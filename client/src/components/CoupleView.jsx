import React, { useState, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { Heart, Sparkles, HeartHandshake, Edit3, Check, Clock, Copy, Share2 } from 'lucide-react';

const ROMANTIC_REACTIONS = [
  { emoji: '💖', label: 'Sparkling Heart' },
  { emoji: '❤️', label: 'Red Heart' },
  { emoji: '🌹', label: 'Rose' },
  { emoji: '🌙', label: 'Moon' },
  { emoji: '✨', label: 'Sparkles' },
  { emoji: '🫂', label: 'Hug' },
  { emoji: '🥰', label: 'Love' },
];

export default function CoupleView() {
  const { room, currentUser, sendReaction, updateCoupleNotes } = useRoom();
  const users = room?.users || [];
  const partner1 = users[0] || { name: 'Partner 1', avatar: '💖' };
  const partner2 = users[1] || null;

  const [notes, setNotes] = useState(room?.coupleNotes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [listeningMinutes, setListeningMinutes] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (room?.coupleNotes !== undefined) {
      setNotes(room.coupleNotes);
    }
  }, [room?.coupleNotes]);

  // Session duration timer
  useEffect(() => {
    const updateDuration = () => {
      if (room?.createdAt) {
        const mins = Math.floor((Date.now() - room.createdAt) / 60000);
        setListeningMinutes(mins);
      }
    };
    updateDuration();
    const interval = setInterval(updateDuration, 10000);
    return () => clearInterval(interval);
  }, [room?.createdAt]);

  const handleSaveNotes = () => {
    updateCoupleNotes(notes);
    setIsEditingNotes(false);
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}?room=${room?.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Hey! Listen to music with me on MusiCoup 💕 Join my room: ${window.location.origin}?room=${room?.code}`
  )}`;

  return (
    <div className="space-y-6">
      {/* Duo Profile Banner */}
      <div className="p-6 rounded-3xl glass-panel-couple border border-rose-500/20 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          {/* Couple Avatars */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Partner 1 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 p-0.5 shadow-lg shadow-rose-500/20">
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-2xl">
                  {partner1.avatar || '💖'}
                </div>
              </div>
              <span className="text-xs font-bold text-white mt-2 truncate max-w-[80px]">
                {partner1.name}
              </span>
              <span className="text-[10px] text-rose-300 font-medium">Host</span>
            </div>

            {/* Connecting Heart Icon */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
                <Heart size={18} fill="currentColor" />
              </div>
              <span className="text-[10px] text-rose-300/80 font-mono mt-1">in sync</span>
            </div>

            {/* Partner 2 */}
            <div className="flex flex-col items-center">
              {partner2 ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-400 to-purple-400 p-0.5 shadow-lg shadow-pink-500/20">
                    <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-2xl">
                      {partner2.avatar || '✨'}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white mt-2 truncate max-w-[80px]">
                    {partner2.name}
                  </span>
                  <span className="text-[10px] text-pink-300 font-medium">Partner</span>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-rose-500/30 flex items-center justify-center text-slate-500 text-sm">
                    Waiting...
                  </div>
                  <span className="text-xs text-rose-300/80 mt-2 font-medium">Partner not joined</span>
                  <span className="text-[10px] text-slate-400 font-mono">Code: {room?.code}</span>
                </div>
              )}
            </div>
          </div>

          {/* Together Duration Badge */}
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/60 border border-rose-500/20 rounded-2xl">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-rose-300/80">
                Listening Together
              </p>
              <p className="text-lg font-extrabold text-white">
                {listeningMinutes} {listeningMinutes === 1 ? 'min' : 'mins'}
              </p>
            </div>
          </div>
        </div>

        {/* Invite prompt if partner has not joined yet */}
        {!partner2 && (
          <div className="mt-5 pt-4 border-t border-rose-500/15 flex flex-wrap items-center justify-between gap-3 bg-rose-950/20 p-3.5 rounded-2xl">
            <span className="text-xs text-rose-200">
              💌 Invite your partner to listen together:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={copyInviteLink}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/30"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Link Copied!' : `Copy Link (Code: ${room?.code})`}</span>
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
              >
                <Share2 size={14} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* Quick Romantic Reactions Bar */}
        <div className="mt-6 pt-5 border-t border-rose-500/20 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-rose-300/80 font-medium flex items-center gap-1">
            <Sparkles size={14} /> Send a heart to your partner:
          </span>
          <div className="flex items-center gap-2">
            {ROMANTIC_REACTIONS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                title={label}
                className="w-10 h-10 rounded-xl bg-rose-950/40 hover:bg-rose-600/30 border border-rose-500/20 hover:border-rose-400/40 text-lg flex items-center justify-center transition-all transform hover:scale-125 active:scale-95 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shared Couple Notes */}
      <div className="p-6 rounded-3xl glass-panel-couple border border-rose-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-rose-300">
            <HeartHandshake size={18} />
            <h4 className="text-sm font-bold text-white">Our Shared Love Note</h4>
          </div>
          {isEditingNotes ? (
            <button
              onClick={handleSaveNotes}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
            >
              <Check size={13} /> Save Note
            </button>
          ) : (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs text-rose-300/70 hover:text-white flex items-center gap-1 transition"
            >
              <Edit3 size={12} /> Edit Note
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write a sweet message, our song memory, or future playlist ideas..."
            rows={3}
            className="w-full p-3.5 bg-slate-900/80 border border-rose-500/30 rounded-2xl text-xs text-rose-100 placeholder-rose-300/40 focus:outline-none focus:border-rose-500 transition"
          />
        ) : (
          <div 
            onClick={() => setIsEditingNotes(true)}
            className="p-4 bg-slate-900/40 rounded-2xl border border-rose-500/10 text-xs text-rose-200/90 leading-relaxed cursor-pointer hover:bg-slate-900/60 transition italic"
          >
            "{notes || 'Click here to write a sweet shared note together 💕'}"
          </div>
        )}
      </div>
    </div>
  );
}
