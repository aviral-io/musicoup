import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { Users, Crown, FastForward, Flame, Sparkles, Copy, Check } from 'lucide-react';

const PARTY_REACTIONS = [
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💃', label: 'Dance' },
  { emoji: '🎧', label: 'Jamming' },
  { emoji: '🚀', label: 'Hype' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '🥳', label: 'Party' },
  { emoji: '⚡', label: 'Lightning' },
];

export default function GroupView() {
  const { room, socketId, sendReaction, voteSkip } = useRoom();
  const users = room?.users || [];
  const votes = room?.votesToSkip || [];
  const hasVoted = votes.includes(socketId);
  const requiredVotes = Math.max(1, Math.ceil(users.length / 2));

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}?room=${room?.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Group Members & Controls Bar */}
      <div className="p-6 rounded-3xl glass-panel border border-cyan-500/20 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-cyan-400" />
            <h4 className="text-base font-bold text-white">Party Listeners</h4>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {users.length} Online
            </span>
          </div>

          {/* Invite Pill */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-300">Invite Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Invite Friends (Code: {room?.code})</span>
              </>
            )}
          </button>
        </div>

        {/* Member Avatars Grid */}
        <div className="flex flex-wrap gap-3 mb-6">
          {users.map((u) => {
            const isUserHost = u.isHost || u.id === room?.hostId;
            return (
              <div
                key={u.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-900/60 border border-white/5"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-sm">
                    {u.avatar || '🎧'}
                  </div>
                  {isUserHost && (
                    <Crown size={12} className="absolute -top-1.5 -right-1 text-amber-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate max-w-[100px]">
                    {u.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {isUserHost ? 'Host' : 'Listener'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Vote to Skip Section */}
        {room?.currentSong && (
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <FastForward size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Democratic Vote Skip</p>
                <p className="text-[11px] text-slate-400">
                  {votes.length} of {requiredVotes} votes needed to skip track
                </p>
              </div>
            </div>

            <button
              onClick={voteSkip}
              disabled={hasVoted}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                hasVoted
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-white/5'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95'
              }`}
            >
              <FastForward size={14} />
              {hasVoted ? 'Vote Recorded' : 'Vote to Skip'}
            </button>
          </div>
        )}

        {/* Party Emoji Soundboard */}
        <div className="mt-6 pt-5 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-cyan-300/80 font-medium flex items-center gap-1">
            <Sparkles size={14} /> Party reactions:
          </span>
          <div className="flex items-center gap-2">
            {PARTY_REACTIONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                title={label}
                className="w-10 h-10 rounded-xl bg-cyan-950/40 hover:bg-cyan-600/30 border border-cyan-500/20 hover:border-cyan-400/40 text-lg flex items-center justify-center transition-all transform hover:scale-125 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

