import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import roomManager from './roomManager.js';
import { searchYouTube, getYouTubeSuggestions } from './youtubeSearch.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.join(__dirname, '../../client/dist');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MusiCoup Server', time: Date.now() });
});

// Song search API
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    const results = await searchYouTube(q);
    res.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Failed to search music.' });
  }
});

// Live Autocomplete Suggestions API
app.get('/api/suggest', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json({ suggestions: [] });
  }

  try {
    const suggestions = await getYouTubeSuggestions(q);
    res.json({ suggestions });
  } catch (error) {
    res.json({ suggestions: [] });
  }
});

// Check room info
app.get('/api/rooms/:code', (req, res) => {
  const room = roomManager.getRoom(req.params.code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    code: room.code,
    name: room.name,
    mode: room.mode,
    userCount: room.users.length,
    currentSong: room.currentSong
  });
});

// Helper to sanitize room state for clients (converts Sets to Arrays and syncs accurate clock)
function serializeRoom(room) {
  if (!room) return null;
  const interpolated = roomManager.getInterpolatedTime(room);
  return {
    ...room,
    playback: {
      ...room.playback,
      currentTime: interpolated
    },
    votesToSkip: Array.from(room.votesToSkip || []),
    estimatedCurrentTime: interpolated
  };
}

// Socket.io Events
io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // Create Room
  socket.on('create_room', ({ name, mode, hostName, avatar }, callback) => {
    try {
      const room = roomManager.createRoom({
        name,
        mode,
        hostName,
        socketId: socket.id,
        avatar
      });

      socket.join(room.code);
      console.log(`[Room Created] Code: ${room.code}, Mode: ${room.mode}, Host: ${hostName}`);

      const serialized = serializeRoom(room);
      if (typeof callback === 'function') callback({ success: true, room: serialized });
      socket.emit('room_state', serialized);
    } catch (err) {
      console.error('Error creating room:', err);
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Join Room
  socket.on('join_room', ({ code, name, avatar }, callback) => {
    try {
      const result = roomManager.joinRoom({
        code,
        name,
        socketId: socket.id,
        avatar
      });

      if (result.error) {
        if (typeof callback === 'function') callback({ success: false, error: result.error });
        return;
      }

      socket.join(result.room.code);
      console.log(`[User Joined] User: ${name} -> Room: ${result.room.code}`);

      const serialized = serializeRoom(result.room);
      if (typeof callback === 'function') callback({ success: true, room: serialized });

      // Notify all room members with updated state
      io.to(result.room.code).emit('room_state', serialized);
    } catch (err) {
      console.error('Error joining room:', err);
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Synchronize Playback (Play / Pause / Seek)
  socket.on('sync_playback', ({ code, status, currentTime }) => {
    const room = roomManager.updatePlayback({
      code,
      status,
      currentTime,
      socketId: socket.id
    });

    if (room) {
      io.to(room.code).emit('playback_update', {
        status: room.playback.status,
        currentTime: room.playback.currentTime,
        serverTimestamp: Date.now(),
        updatedBy: socket.id
      });
    }
  });

  // Host Heartbeat (Host sends current timestamp every 6s to keep room softly aligned)
  socket.on('host_heartbeat', ({ code, currentTime }) => {
    const room = roomManager.getRoom(code);
    if (room && room.hostId === socket.id && room.playback.status === 'playing') {
      room.playback.currentTime = currentTime;
      room.playback.lastUpdated = Date.now();
      socket.to(room.code).emit('heartbeat_sync', {
        currentTime,
        serverTimestamp: Date.now()
      });
    }
  });

  // Explicit time sync request (for drift correction)
  socket.on('request_sync', ({ code }, callback) => {
    const room = roomManager.getRoom(code);
    if (room) {
      const time = roomManager.getInterpolatedTime(room);
      const data = {
        status: room.playback.status,
        currentTime: time,
        serverTimestamp: Date.now()
      };
      if (typeof callback === 'function') callback(data);
      socket.emit('sync_response', data);
    }
  });

  // Add song to queue
  socket.on('add_to_queue', ({ code, song, userName }) => {
    const room = roomManager.addToQueue({
      code,
      song,
      socketId: socket.id,
      socketName: userName
    });

    if (room) {
      io.to(room.code).emit('room_state', serializeRoom(room));
    }
  });

  // Remove song from queue
  socket.on('remove_from_queue', ({ code, queueId }) => {
    const room = roomManager.removeFromQueue({ code, queueId });
    if (room) {
      io.to(room.code).emit('room_state', serializeRoom(room));
    }
  });

  // Play next track (Skip)
  socket.on('play_next', ({ code }) => {
    const room = roomManager.playNext({ code });
    if (room) {
      io.to(room.code).emit('room_state', serializeRoom(room));
    }
  });

  // Vote to skip
  socket.on('vote_skip', ({ code }) => {
    const result = roomManager.voteSkip({ code, socketId: socket.id });
    if (result.room) {
      io.to(result.room.code).emit('room_state', serializeRoom(result.room));
    }
  });

  // Live Chat Message
  socket.on('send_chat', ({ code, userName, text }) => {
    const msg = roomManager.addChatMessage({
      code,
      senderId: socket.id,
      senderName: userName,
      text
    });

    if (msg) {
      io.to(code.toUpperCase()).emit('new_chat', msg);
    }
  });

  // Live Reaction (heart, fire, party, cry, laugh, etc.)
  socket.on('send_reaction', ({ code, emoji, userName }) => {
    if (!code) return;
    io.to(code.toUpperCase()).emit('new_reaction', {
      id: `react-${Date.now()}-${Math.random()}`,
      emoji: emoji || '❤️',
      userName: userName || 'Someone',
      timestamp: Date.now()
    });
  });

  // Update couple notes / shared love notes
  socket.on('update_couple_notes', ({ code, notes }) => {
    const room = roomManager.updateCoupleNotes({ code, notes });
    if (room) {
      io.to(room.code).emit('couple_notes_updated', { notes: room.coupleNotes });
    }
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
    const result = roomManager.leaveRoom(socket.id);
    if (result && !result.destroyed && result.room) {
      io.to(result.roomCode).emit('room_state', serializeRoom(result.room));
    }
  });
});

// Serve frontend in production or if built
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

server.listen(PORT, () => {
  console.log(`🚀 MusiCoup Server running on http://localhost:${PORT}`);
});
