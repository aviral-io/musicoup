import React, { useState, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { Heart, Users, Sparkles, ArrowRight, Music, Radio, KeyRound, PlusCircle, AlertCircle } from 'lucide-react';

const COUPLE_AVATARS = ['💖', '🌹', '✨', '🌙', '🧸', '💌', '🌸', '☕'];
const GROUP_AVATARS = ['🎧', '🔥', '⚡', '🚀', '🐱', '🎸', '👾', '🎉'];

export default function Lobby() {
  const { createRoom, joinRoom, currentUser } = useRoom();

  // Top level: 'join' or 'create'
  const [mainTab, setMainTab] = useState('join');
  // Sub level for create: 'couple' or 'group'
  const [createMode, setCreateMode] = useState('couple');

  const [name, setName] = useState(currentUser?.name || '');
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('💖');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-detect invite link with query param (?room=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('room');
    if (codeParam) {
      setJoinCode(codeParam.toUpperCase().trim());
      setMainTab('join');
    }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createRoom({
        name: roomName.trim() || undefined,
        mode: createMode,
        hostName: name.trim(),
        avatar: selectedAvatar
      });
    } catch (err) {
      setError(err.message || 'Failed to create room');
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      setError('Please enter a valid room code (e.g. 6 letters)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await joinRoom({
        code: cleanCode,
        name: name.trim(),
        avatar: selectedAvatar
      });
    } catch (err) {
      setError(err.message || 'Room not found! Please check the code.');
      setLoading(false);
    }
  };

  const avatarsList = (mainTab === 'create' && createMode === 'group') ? GROUP_AVATARS : COUPLE_AVATARS;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-14">
      {/* Hero Header */}
      <div className="text-center mb-8 sm:mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold tracking-wide uppercase">
          <Sparkles size={14} /> Listen together in real-time • 100% Free
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Music sounds better <br />
          <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            when you're listening together.
          </span>
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
          Synchronized audio playback for couples and friends. Enter your partner's code to join or create your own room.
        </p>
      </div>

      {/* Main Container Card */}
      <div className="max-w-xl mx-auto glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
        {/* Top-Level Navigation: JOIN vs CREATE */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900/90 rounded-2xl mb-7 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setMainTab('join');
              setError('');
            }}
            className={`py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition ${
              mainTab === 'join'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound size={16} />
            <span>Join Existing Room</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMainTab('create');
              setError('');
            }}
            className={`py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition ${
              mainTab === 'create'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle size={16} />
            <span>Create New Room</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2 justify-center">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ===================== TAB 1: JOIN EXISTING ROOM ===================== */}
        {mainTab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-5">
            <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-2xl text-center">
              <p className="text-xs text-purple-200">
                Joining a partner or friend? Enter their <strong>6-digit Room Code</strong> below:
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">
                Room Code (6 Characters)
              </label>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="e.g. 7K4X9B"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                className="w-full px-4 py-3.5 bg-slate-900 border-2 border-purple-500/40 rounded-2xl text-lg font-mono font-bold tracking-widest text-center text-white placeholder-slate-600 focus:outline-none focus:border-purple-400 transition uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">
                Your Name / Nickname
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Priya"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">
                Choose Your Avatar
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {avatarsList.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition border ${
                      selectedAvatar === av
                        ? 'bg-purple-600/30 border-purple-400 scale-110 shadow-lg shadow-purple-500/20'
                        : 'bg-slate-900/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-purple-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Connecting to Room...' : 'Join Room & Listen Together 🎵'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* ===================== TAB 2: CREATE NEW ROOM ===================== */}
        {mainTab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Mode Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-300/90 mb-2">
                Select Room Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateMode('couple');
                    setSelectedAvatar('💖');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                    createMode === 'couple'
                      ? 'bg-rose-950/40 border-rose-500 text-white shadow-lg shadow-rose-950/40'
                      : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl flex-shrink-0">
                    💑
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Couple Room</p>
                    <p className="text-[10px] text-slate-400">2 partners, romantic theme</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateMode('group');
                    setSelectedAvatar('🎧');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                    createMode === 'group'
                      ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-950/40'
                      : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl flex-shrink-0">
                    🎉
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Party Room</p>
                    <p className="text-[10px] text-slate-400">Multiple friends, voting</p>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-300/90 mb-2">
                Your Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/90 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-300/90 mb-2">
                Room Title (Optional)
              </label>
              <input
                type="text"
                placeholder={createMode === 'couple' ? "e.g. Our Late Night Vibes 🌙" : "e.g. Friday Jam Session 🎧"}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/90 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-300/90 mb-2">
                Pick Avatar
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {avatarsList.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition border ${
                      selectedAvatar === av
                        ? 'bg-rose-600/30 border-rose-400 scale-110 shadow-lg shadow-rose-500/20'
                        : 'bg-slate-900/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 text-white font-extrabold rounded-2xl text-sm shadow-xl transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                createMode === 'couple'
                  ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-400 shadow-rose-600/30'
                  : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-600/30'
              }`}
            >
              <span>{loading ? 'Creating Room...' : `Create ${createMode === 'couple' ? 'Couple' : 'Party'} Room & Get Code`}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>

      {/* Feature highlights below */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-14 text-center sm:text-left">
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 mx-auto sm:mx-0">
            <Heart size={20} />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Couple Mode</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cozy 2-person room with floating love reactions, listening timer, and shared love note.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3 mx-auto sm:mx-0">
            <Radio size={20} />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Sub-Second Sync</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatic drift correction ensures all listeners hear the exact same beat simultaneously.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 mx-auto sm:mx-0">
            <Music size={20} />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Millions of Free Tracks</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Search any track, lofi stream, or paste any YouTube URL with zero subscription needed.
          </p>
        </div>
      </div>
    </div>
  );
}
