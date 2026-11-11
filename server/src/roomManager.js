// MusiCoup Room State Manager

class RoomManager {
  constructor() {
    this.rooms = new Map(); // code -> room object
    this.socketToRoom = new Map(); // socketId -> { roomCode, userId }
  }

  generateRoomCode(mode = 'group') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom({ name, mode = 'group', hostName, socketId, avatar }) {
    let code = this.generateRoomCode(mode);
    while (this.rooms.has(code)) {
      code = this.generateRoomCode(mode);
    }

    const hostUser = {
      id: socketId,
      name: hostName || 'Host',
      avatar: avatar || (mode === 'couple' ? '💖' : '🎧'),
      isHost: true,
      joinedAt: Date.now()
    };

    const room = {
      code,
      name: name || (mode === 'couple' ? `${hostUser.name}'s Cozy Room` : `${hostUser.name}'s Party`),
      mode, // 'couple' or 'group'
      hostId: socketId,
      createdAt: Date.now(),
      users: [hostUser],
      currentSong: null,
      playback: {
        status: 'paused', // 'playing' | 'paused' | 'buffering'
        currentTime: 0,
        lastUpdated: Date.now(),
        playbackRate: 1
      },
      queue: [],
      chat: [
        {
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'MusiCoup',
          text: mode === 'couple' 
            ? `Welcome to your private Couple Room! Share code ${code} with your special one.`
            : `Party room created! Share code ${code} with your friends to listen together.`,
          timestamp: Date.now(),
          type: 'system'
        }
      ],
      votesToSkip: new Set(),
      coupleNotes: mode === 'couple' ? 'Our shared song memories 💕' : null
    };

    this.rooms.set(code, room);
    this.socketToRoom.set(socketId, { roomCode: code, userId: socketId });
    return room;
  }

  getRoom(code) {
    if (!code) return null;
    return this.rooms.get(code.toUpperCase());
  }

  joinRoom({ code, name, socketId, avatar }) {
    const upperCode = code ? code.toUpperCase() : '';
    const room = this.rooms.get(upperCode);
    if (!room) {
      return { error: 'Room not found! Check your code.' };
    }

    if (room.mode === 'couple' && room.users.length >= 2) {
      // Check if user is reconnecting
      const existing = room.users.find(u => u.name.toLowerCase() === (name || '').toLowerCase());
      if (!existing) {
        return { error: 'This Couple Room is already full (2/2 members).' };
      }
    }

    const newUser = {
      id: socketId,
      name: name || `Listener ${room.users.length + 1}`,
      avatar: avatar || (room.mode === 'couple' ? (room.users.length === 0 ? '💖' : '✨') : '🎵'),
      isHost: room.users.length === 0,
      joinedAt: Date.now()
    };

    room.users.push(newUser);
    this.socketToRoom.set(socketId, { roomCode: upperCode, userId: socketId });

    room.chat.push({
      id: `msg-${Date.now()}`,
      senderId: 'system',
      senderName: 'MusiCoup',
      text: `${newUser.name} joined the room!`,
      timestamp: Date.now(),
      type: 'system'
    });

    return { room };
  }

  leaveRoom(socketId) {
    const meta = this.socketToRoom.get(socketId);
    if (!meta) return null;

    const { roomCode } = meta;
    this.socketToRoom.delete(socketId);

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const leavingUser = room.users.find(u => u.id === socketId);
    room.users = room.users.filter(u => u.id !== socketId);
    room.votesToSkip.delete(socketId);

    if (room.users.length === 0) {
      // Clean up empty room
      this.rooms.delete(roomCode);
      return { roomCode, destroyed: true };
    }

    // Reassign host if the host left
    if (room.hostId === socketId && room.users.length > 0) {
      room.hostId = room.users[0].id;
      room.users[0].isHost = true;
      room.chat.push({
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'MusiCoup',
        text: `${room.users[0].name} is now the host!`,
        timestamp: Date.now(),
        type: 'system'
      });
    }

    if (leavingUser) {
      room.chat.push({
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'MusiCoup',
        text: `${leavingUser.name} left the room.`,
        timestamp: Date.now(),
        type: 'system'
      });
    }

    return { roomCode, room };
  }

  getInterpolatedTime(room) {
    if (!room || !room.playback) return 0;
    if (room.playback.status !== 'playing') {
      return room.playback.currentTime;
    }
    const elapsed = (Date.now() - room.playback.lastUpdated) / 1000;
    const estimated = room.playback.currentTime + elapsed;
    if (room.currentSong?.duration && estimated > room.currentSong.duration) {
      return room.currentSong.duration;
    }
    return estimated;
  }

  updatePlayback({ code, status, currentTime, socketId }) {
    const room = this.getRoom(code);
    if (!room) return null;

    room.playback.status = status !== undefined ? status : room.playback.status;
    room.playback.currentTime = currentTime !== undefined ? Number(currentTime) : this.getInterpolatedTime(room);
    room.playback.lastUpdated = Date.now();

    return room;
  }

  addToQueue({ code, song, socketId, socketName }) {
    const room = this.getRoom(code);
    if (!room) return null;

    const queueItem = {
      ...song,
      queueId: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      addedBy: socketId,
      addedByName: socketName || 'Listener',
      addedAt: Date.now()
    };

    // If nothing is playing or queue is empty and no current song, auto play
    if (!room.currentSong) {
      room.currentSong = queueItem;
      room.playback = {
        status: 'playing',
        currentTime: 0,
        lastUpdated: Date.now(),
        playbackRate: 1
      };
      room.votesToSkip.clear();
      room.chat.push({
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'MusiCoup',
        text: `Now playing: ${queueItem.title}`,
        timestamp: Date.now(),
        type: 'system'
      });
    } else {
      room.queue.push(queueItem);
      room.chat.push({
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'MusiCoup',
        text: `${queueItem.addedByName} added "${queueItem.title}" to queue.`,
        timestamp: Date.now(),
        type: 'system'
      });
    }

    return room;
  }

  removeFromQueue({ code, queueId }) {
    const room = this.getRoom(code);
    if (!room) return null;
    room.queue = room.queue.filter(item => item.queueId !== queueId);
    return room;
  }

  playNext({ code }) {
    const room = this.getRoom(code);
    if (!room) return null;

    const now = Date.now();
    if (room.lastTrackChange && (now - room.lastTrackChange < 1500)) {
      return room;
    }
    room.lastTrackChange = now;

    if (room.queue.length > 0) {
      const nextSong = room.queue.shift();
      room.currentSong = nextSong;
      room.playback = {
        status: 'playing',
        currentTime: 0,
        lastUpdated: Date.now(),
        playbackRate: 1
      };
      room.votesToSkip.clear();
      room.chat.push({
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'MusiCoup',
        text: `Now playing: ${nextSong.title}`,
        timestamp: Date.now(),
        type: 'system'
      });
    } else {
      room.currentSong = null;
      room.playback = {
        status: 'paused',
        currentTime: 0,
        lastUpdated: Date.now(),
        playbackRate: 1
      };
      room.votesToSkip.clear();
    }

    return room;
  }

  voteSkip({ code, socketId }) {
    const room = this.getRoom(code);
    if (!room || !room.currentSong) return { room, skipped: false };

    room.votesToSkip.add(socketId);
    const requiredVotes = Math.max(1, Math.ceil(room.users.length / 2));

    if (room.votesToSkip.size >= requiredVotes) {
      room.chat.push({
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'MusiCoup',
        text: `Vote skip passed! (${room.votesToSkip.size}/${room.users.length} votes)`,
        timestamp: Date.now(),
        type: 'system'
      });
      this.playNext({ code });
      return { room, skipped: true };
    }

    return { 
      room, 
      skipped: false, 
      currentVotes: room.votesToSkip.size, 
      requiredVotes 
    };
  }

  addChatMessage({ code, senderId, senderName, text }) {
    const room = this.getRoom(code);
    if (!room || !text?.trim()) return null;

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId,
      senderName,
      text: text.trim(),
      timestamp: Date.now(),
      type: 'chat'
    };

    room.chat.push(message);
    if (room.chat.length > 100) {
      room.chat.shift();
    }

    return message;
  }

  updateCoupleNotes({ code, notes }) {
    const room = this.getRoom(code);
    if (!room) return null;
    room.coupleNotes = notes;
    return room;
  }
}

export default new RoomManager();

