import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { Music, Copy, Check, LogOut, Heart, Users } from 'lucide-react';

export default function Navbar() {
  const { room, leaveRoom } = useRoom();
  const [copied, setCopied] = useState(false);
  const isCouple = room?.mode === 'couple';

  const copyCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/70 border-b border-white/5 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <Music size={20} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-rose-200 bg-clip-text text-transparent">
              MusiCoup
            </h1>
            <p className="text-[10px] text-slate-400 font-medium -mt-1">
              Synchronized Listening
            </p>
          </div>
        </div>

        {/* Room Info (if inside room) */}
        {room && (
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mode Indicator */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isCouple 
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' 
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
            }`}>
              {isCouple ? <Heart size={13} fill="currentColor" /> : <Users size={13} />}
              <span>{isCouple ? 'Couple Room' : 'Party Room'}</span>
            </div>

            {/* Room Code Badge */}
            <button
              onClick={copyCode}
              title="Click to copy room code"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-white transition active:scale-95"
            >
              <span>{room.code}</span>
              {copied ? (
                <Check size={13} className="text-emerald-400" />
              ) : (
                <Copy size={13} className="text-slate-400" />
              )}
            </button>

            {/* Leave Room Button */}
            <button
              onClick={leaveRoom}
              title="Leave Room"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

