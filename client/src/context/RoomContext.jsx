import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { socket } from '../socket';

const RoomContext = createContext(null);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

export const RoomProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('musicoup_user');
    return saved ? JSON.parse(saved) : { name: '', avatar: '🎧' };
  });

  const [room, setRoom] = useState(null);
  const [inSync, setInSync] = useState(true);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  // Save user profile
  const updateUserProfile = (name, avatar) => {
    const updated = { name, avatar };
    setCurrentUser(updated);
    localStorage.setItem('musicoup_user', JSON.stringify(updated));
  };

  useEffect(() => {
    // Listen for room state updates
    const handleRoomState = (state) => {
      setRoom(state);
    };

    // Listen for playback update
    const handlePlaybackUpdate = (playbackData) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          playback: {
            ...prev.playback,
            status: playbackData.status,
            currentTime: playbackData.currentTime,
            lastUpdated: playbackData.serverTimestamp,
          }
        };
      });
    };

    // Listen for floating reactions
    const handleNewReaction = (reaction) => {
      const id = `${reaction.id}-${Date.now()}`;
      setFloatingReactions((prev) => [...prev, { ...reaction, id }]);

      // Remove after animation completes (3 seconds)
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    };

    // Listen for new chat
    const handleNewChat = (message) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chat: [...(prev.chat || []), message]
        };
      });
    };

    // Listen for couple notes update
    const handleCoupleNotes = ({ notes }) => {
      setRoom((prev) => (prev ? { ...prev, coupleNotes: notes } : prev));
    };

    socket.on('room_state', handleRoomState);
    socket.on('playback_update', handlePlaybackUpdate);
    socket.on('new_reaction', handleNewReaction);
    socket.on('new_chat', handleNewChat);
    socket.on('couple_notes_updated', handleCoupleNotes);

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('playback_update', handlePlaybackUpdate);
      socket.off('new_reaction', handleNewReaction);
      socket.off('new_chat', handleNewChat);
      socket.off('couple_notes_updated', handleCoupleNotes);
    };
  }, []);

  // Room Actions
  const createRoom = ({ name, mode, hostName, avatar }) => {
    return new Promise((resolve, reject) => {
      updateUserProfile(hostName, avatar);
      socket.emit('create_room', { name, mode, hostName, avatar }, (res) => {
        if (res && res.success) {
          setRoom(res.room);
          resolve(res.room);
        } else {
          reject(new Error(res?.error || 'Failed to create room'));
        }
      });
    });
  };

  const joinRoom = ({ code, name, avatar }) => {
    return new Promise((resolve, reject) => {
      updateUserProfile(name, avatar);
      socket.emit('join_room', { code, name, avatar }, (res) => {
        if (res && res.success) {
          setRoom(res.room);
          resolve(res.room);
        } else {
          reject(new Error(res?.error || 'Failed to join room'));
        }
      });
    });
  };

  const leaveRoom = () => {
    window.location.reload();
  };

  const syncPlayback = ({ status, currentTime }) => {
    if (!room) return;
    socket.emit('sync_playback', {
      code: room.code,
      status,
      currentTime
    });
  };

  const addToQueue = (song) => {
    if (!room) return;
    socket.emit('add_to_queue', {
      code: room.code,
      song,
      userName: currentUser.name || 'Friend'
    });
  };

  const removeFromQueue = (queueId) => {
    if (!room) return;
    socket.emit('remove_from_queue', {
      code: room.code,
      queueId
    });
  };

  const playNext = () => {
    if (!room) return;
    socket.emit('play_next', { code: room.code });
  };

  const voteSkip = () => {
    if (!room) return;
    socket.emit('vote_skip', { code: room.code });
  };

  const sendChat = (text) => {
    if (!room || !text.trim()) return;
    socket.emit('send_chat', {
      code: room.code,
      userName: currentUser.name || 'Friend',
      text
    });
  };

  const sendReaction = (emoji) => {
    if (!room) return;
    socket.emit('send_reaction', {
      code: room.code,
      emoji,
      userName: currentUser.name || 'Friend'
    });
  };

  const updateCoupleNotes = (notes) => {
    if (!room) return;
    socket.emit('update_couple_notes', {
      code: room.code,
      notes
    });
  };

  const isHost = room && room.hostId === socket.id;

  return (
    <RoomContext.Provider
      value={{
        room,
        currentUser,
        updateUserProfile,
        isHost,
        socketId: socket.id,
        inSync,
        setInSync,
        floatingReactions,
        createRoom,
        joinRoom,
        leaveRoom,
        syncPlayback,
        addToQueue,
        removeFromQueue,
        playNext,
        voteSkip,
        sendChat,
        sendReaction,
        updateCoupleNotes
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
