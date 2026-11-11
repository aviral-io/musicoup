import React, { useState, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { Heart, Users, Sparkles, ArrowRight, Music, Radio, Shield, Zap } from 'lucide-react';

const COUPLE_AVATARS = ['💖', '🌹', '✨', '🌙', '🧸', '💌', '🌸', '☕'];
const GROUP_AVATARS = ['🎧', '🔥', '⚡', '🚀', '🐱', '🎸', '👾', '🎉'];

export default function Lobby() {
  const { createRoom, joinRoom, currentUser } = useRoom();

  const [activeTab, setActiveTab] = useState('couple'); // 'couple' | 'group' | 'join'
  const [name, setName] = useState(currentUser?.name || '');
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(COUPLE_AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check URL query param for invite link (?room=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('room');
    if (codeParam) {
      setJoinCode(codeParam.toUpperCase());
      setActiveTab('join');
    }
  }, []);

  // Update avatar default when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    if (tab === 'couple') setSelectedAvatar(COUPLE_AVATARS[0]);
    else if (tab === 'group') setSelectedAvatar(GROUP_AVATARS[0]);
  };

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
        mode: activeTab,
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
    if (!joinCode.trim()) {
      setError('Please enter the 6-character room code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await joinRoom({
        code: joinCode.trim().toUpperCase(),
        name: name.trim(),
        avatar: selectedAvatar
      });
    } catch (err) {
      setError(err.message || 'Could not join room');
      setLoading(false);
    }
  };

  const avatarsList = activeTab === 'couple' ? COUPLE_AVATARS : GROUP_AVATARS;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16">
      {/* Hero Header */}
      <div className="text-center mb-10 sm:mb-14 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold tracking-wide uppercase">
          <Sparkles size={14} /> Listen together • 100% Free
        </div>
        <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Music sounds better <br />
          <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            when you're together.
          </span>
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Synchronize music in real-time with your partner or friend circle. No subscriptions, no ads, infinite tracks.
        </p>
      </div>

      {/* Main Container Card */}
      <div className="max-w-xl mx-auto glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-900/80 rounded-2xl mb-8 border border-white/5">
          <button
            onClick={() => handleTabChange('couple')}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'couple'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart size={15} fill={activeTab === 'couple' ? 'currentColor' : 'none'} />
            <span>Couple</span>
          </button>

          <button
            onClick={() => handleTabChange('group')}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'group'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={15} />
            <span>Party</span>
          </button>

          <button
            onClick={() => handleTabChange('join')}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'join'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap size={15} />
            <span>Join Code</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Form: Create Couple Room */}
        {activeTab === 'couple' && (
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-300/90 mb-2">
                Your Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/90 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-300/90 mb-2">
                Room Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Us Under The Stars 🌙"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/90 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-300/90 mb-2">
                Pick Your Vibe
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
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-400 text-white font-bold rounded-2xl text-sm shadow-xl shadow-rose-600/30 transition transform active:scale-98 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Creating Romantic Room...' : 'Start Couple Listening'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Form: Create Party Room */}
        {activeTab === 'group' && (
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300/90 mb-2">
                Your Nickname
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DJ Sam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/90 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300/90 mb-2">
                Party Room Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Friday Night Jam 🎧"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/90 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300/90 mb-2">
                Select Avatar
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {avatarsList.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition border ${
                      selectedAvatar === av
                        ? 'bg-cyan-600/30 border-cyan-400 scale-110 shadow-lg shadow-cyan-500/20'
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
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-cyan-600/30 transition transform active:scale-98 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Setting Up Party...' : 'Launch Party Room'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Form: Join Existing Room */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/90 mb-2">
                Room Code (6 Characters)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 7K4X9B"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-slate-900/90 border border-white/10 rounded-2xl text-base font-mono tracking-widest text-center text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/90 mb-2">
                Your Name
              </label>
              <input
                type="text"
                required
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/90 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/90 mb-2">
                Choose Avatar
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[...COUPLE_AVATARS, ...GROUP_AVATARS].slice(0, 8).map((av) => (
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
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-purple-600/30 transition transform active:scale-98 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Connecting...' : 'Join Room'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>

      {/* Feature highlights below */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16 text-center sm:text-left">
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 mx-auto sm:mx-0">
            <Heart size={20} />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Couple Mode</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cozy 2-person room with floating love reactions, listening timer, and shared love note.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 mx-auto sm:mx-0">
            <Radio size={20} />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Sub-Second Sync</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatic drift correction ensures all listeners hear the exact same beat simultaneously.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 mx-auto sm:mx-0">
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

