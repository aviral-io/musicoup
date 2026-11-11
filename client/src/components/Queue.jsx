import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { 
  Search, 
  Plus, 
  Trash2, 
  Music2, 
  Sparkles, 
  Flame, 
  Heart, 
  Coffee, 
  Check, 
  Loader2 
} from 'lucide-react';

const QUICK_VIBES = [
  { label: 'Romantic Lofi', query: 'Romantic lofi hip hop beats to study relax to', icon: Heart },
  { label: 'Chill Acoustic', query: 'Ed Sheeran acoustic love songs', icon: Coffee },
  { label: 'Party Bangers', query: 'Pop party dance hits', icon: Flame },
  { label: 'Midnight Vibes', query: 'Midnight lofi jazz cozy rain', icon: Sparkles },
];

export default function Queue() {
  const { room, addToQueue, removeFromQueue } = useRoom();
  const queue = room?.queue || [];
  const isCouple = room?.mode === 'couple';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());

  const handleSearch = async (queryToSearch) => {
    const q = queryToSearch || searchQuery;
    if (!q || !q.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAdd = (song) => {
    addToQueue(song);
    setAddedIds((prev) => new Set(prev).add(song.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(song.id);
        return next;
      });
    }, 2000);
  };

  return (
    <div className={`rounded-3xl p-6 sm:p-7 shadow-xl transition-all ${
      isCouple ? 'glass-panel-couple' : 'glass-panel'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Music2 size={20} className={isCouple ? 'text-rose-400' : 'text-cyan-400'} />
          <h3 className="text-lg font-bold text-white">Shared Queue</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-300">
            {queue.length}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Search songs, artists, or paste YouTube link..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-11 pr-24 py-3 bg-slate-900/80 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition"
        />
        <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
        <button
          onClick={() => handleSearch()}
          disabled={isSearching || !searchQuery.trim()}
          className={`absolute right-2 top-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition flex items-center gap-1 ${
            isCouple 
              ? 'bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500' 
              : 'bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500'
          }`}
        >
          {isSearching ? <Loader2 size={13} className="animate-spin" /> : 'Search'}
        </button>
      </div>

      {/* Quick Vibe Chips */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {QUICK_VIBES.map((vibe) => {
          const Icon = vibe.icon;
          return (
            <button
              key={vibe.label}
              onClick={() => {
                setSearchQuery(vibe.query);
                handleSearch(vibe.query);
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition flex items-center gap-1.5"
            >
              <Icon size={12} className={isCouple ? 'text-rose-400' : 'text-cyan-400'} />
              <span>{vibe.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Results Drawer */}
      {searchResults.length > 0 && (
        <div className="mb-6 p-3 bg-slate-900/90 rounded-2xl border border-white/10 max-h-64 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-white/5 px-1">
            <span className="text-xs font-semibold text-slate-400">Search Results</span>
            <button
              onClick={() => setSearchResults([])}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          </div>
          {searchResults.map((song) => {
            const isAdded = addedIds.has(song.id);
            return (
              <div
                key={song.id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/5 transition group"
              >
                <img
                  src={song.thumbnail}
                  alt={song.title}
                  className="w-11 h-11 rounded-lg object-cover bg-slate-800 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{song.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                </div>
                <button
                  onClick={() => handleAdd(song)}
                  disabled={isAdded}
                  className={`p-2 rounded-xl text-xs font-medium transition flex items-center gap-1 flex-shrink-0 ${
                    isAdded
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isCouple
                        ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30'
                  }`}
                >
                  {isAdded ? <Check size={14} /> : <Plus size={14} />}
                  <span>{isAdded ? 'Added' : 'Add'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Current Queue List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {queue.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <Music2 size={32} className="mx-auto mb-2 opacity-40" />
            <p>No upcoming tracks in queue.</p>
            <p className="text-slate-400 mt-1">Search or click a quick vibe to add!</p>
          </div>
        ) : (
          queue.map((item, index) => (
            <div
              key={item.queueId || index}
              className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-900/50 hover:bg-slate-900/80 border border-white/5 transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono font-bold text-slate-500 w-4 text-center">
                  {index + 1}
                </span>
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-10 h-10 rounded-lg object-cover bg-slate-800 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {item.artist} • <span className="text-slate-500">{item.addedByName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  {item.durationFormatted}
                </span>
                <button
                  onClick={() => removeFromQueue(item.queueId)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg hover:bg-white/5"
                  title="Remove from queue"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
