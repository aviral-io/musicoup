import React, { useEffect, useRef, useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Music, 
  Radio, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function Player() {
  const { room, syncPlayback, playNext, isHost } = useRoom();
  const currentSong = room?.currentSong;
  const playback = room?.playback;
  const isCouple = room?.mode === 'couple';

  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isDrifting, setIsDrifting] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);

  // Load YouTube IFrame API script
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    function initPlayer() {
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player('youtube-player-frame', {
        height: '100%',
        width: '100%',
        videoId: currentSong?.id || '',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            setIsReady(true);
            event.target.setVolume(volume);
            if (playback?.status === 'playing') {
              tryPlay();
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setNeedsUserInteraction(false);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              // Auto skip to next
              playNext();
            }
          },
          onError: (err) => {
            console.error('YouTube player error:', err);
          }
        }
      });
    }

    return () => {
      // Keep player intact across renders or clean up
    };
  }, []);

  const tryPlay = () => {
    if (!playerRef.current || !playerRef.current.playVideo) return;
    const promise = playerRef.current.playVideo();
    // Catch browser autoplay prevention
    if (promise !== undefined) {
      promise.catch?.(() => {
        setNeedsUserInteraction(true);
      });
    }
  };

  // When song changes in room state
  useEffect(() => {
    if (!playerRef.current || !isReady) return;

    if (currentSong?.id) {
      const currentVideoUrl = playerRef.current.getVideoUrl?.() || '';
      if (!currentVideoUrl.includes(currentSong.id)) {
        playerRef.current.loadVideoById(currentSong.id, playback?.currentTime || 0);
        if (playback?.status === 'playing') {
          tryPlay();
        } else {
          playerRef.current.pauseVideo();
        }
      }
    } else {
      playerRef.current.stopVideo?.();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [currentSong?.id, isReady]);

  // Handle Playback State Sync from Socket
  useEffect(() => {
    if (!playerRef.current || !isReady || !playback) return;

    const player = playerRef.current;
    const now = Date.now();
    const elapsed = playback.status === 'playing' ? (now - playback.lastUpdated) / 1000 : 0;
    const expectedTime = playback.currentTime + elapsed;

    const localTime = player.getCurrentTime ? player.getCurrentTime() : 0;
    const timeDiff = Math.abs(localTime - expectedTime);

    // If drift is more than 1.2 seconds, resync
    if (timeDiff > 1.2) {
      setIsDrifting(true);
      player.seekTo(expectedTime, true);
      setTimeout(() => setIsDrifting(false), 800);
    }

    if (playback.status === 'playing') {
      tryPlay();
    } else if (playback.status === 'paused') {
      player.pauseVideo();
    }
  }, [playback?.status, playback?.lastUpdated, isReady]);

  // Interval timer for local progress bar
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && isReady && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || currentSong?.duration || 0;
        setCurrentTime(time);
        if (dur > 0) setDuration(dur);
      }
    }, 400);

    return () => clearInterval(timer);
  }, [isReady, currentSong]);

  // Controls
  const togglePlayPause = () => {
    if (!currentSong) return;
    const nextStatus = isPlaying ? 'paused' : 'playing';
    const time = playerRef.current?.getCurrentTime() || currentTime;
    syncPlayback({ status: nextStatus, currentTime: time });
  };

  const handleSeek = (e) => {
    if (!currentSong) return;
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(newTime, true);
    }
    syncPlayback({ status: isPlaying ? 'playing' : 'paused', currentTime: newTime });
  };

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(val);
      if (val === 0) setIsMuted(true);
      else setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume || 50);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const forceResync = () => {
    if (!playback || !playerRef.current) return;
    const now = Date.now();
    const elapsed = playback.status === 'playing' ? (now - playback.lastUpdated) / 1000 : 0;
    const expectedTime = playback.currentTime + elapsed;
    playerRef.current.seekTo(expectedTime, true);
    if (playback.status === 'playing') {
      tryPlay();
    }
    setIsDrifting(false);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`relative rounded-3xl p-6 sm:p-8 transition-all duration-500 shadow-2xl ${
      isCouple 
        ? 'glass-panel-couple shadow-rose-950/40 border-rose-500/20' 
        : 'glass-panel shadow-cyan-950/30 border-cyan-500/20'
    }`}>
      {/* Hidden YouTube IFrame embed (always active in background) */}
      <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden">
        <div id="youtube-player-frame"></div>
      </div>

      {/* Autoplay blocker prompt */}
      {needsUserInteraction && (
        <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 text-amber-200 text-sm">
            <AlertCircle size={18} />
            <span>Browser paused audio. Click to start sync!</span>
          </div>
          <button
            onClick={() => {
              tryPlay();
              setNeedsUserInteraction(false);
            }}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition"
          >
            Enable Sound
          </button>
        </div>
      )}

      {/* Track Info & Visualizer */}
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mb-6">
        {/* Album Artwork / Thumbnail */}
        <div className="relative group w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-xl flex-shrink-0 bg-slate-900 border border-white/10">
          {currentSong ? (
            <>
              <img
                src={currentSong.thumbnail}
                alt={currentSong.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105 rotate-0' : 'scale-100 opacity-80'
                }`}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-3">
                  <div className="flex items-end gap-1 h-5">
                    <span className={`w-1 bg-white rounded-full equalizer-bar-1`}></span>
                    <span className={`w-1 bg-white rounded-full equalizer-bar-2`}></span>
                    <span className={`w-1 bg-white rounded-full equalizer-bar-3`}></span>
                    <span className={`w-1 bg-white rounded-full equalizer-bar-4`}></span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <Music size={40} className="animate-pulse" />
              <span className="text-xs font-medium">Queue is empty</span>
            </div>
          )}
        </div>

        {/* Title, Artist, Sync status */}
        <div className="flex-1 text-center sm:text-left min-w-0 w-full">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isDrifting 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {isDrifting ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  Syncing audio...
                </>
              ) : (
                <>
                  <CheckCircle2 size={12} />
                  In Realtime Sync
                </>
              )}
            </span>

            <button
              onClick={forceResync}
              title="Resync audio with room"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 transition"
            >
              <RefreshCw size={11} />
              Resync
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white truncate drop-shadow-sm">
            {currentSong ? currentSong.title : 'No song playing'}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 truncate mt-1">
            {currentSong ? currentSong.artist : 'Search or add tracks below to jam together!'}
          </p>

          {currentSong?.addedByName && (
            <p className="text-xs text-slate-400 mt-2">
              Queued by <span className="text-white font-medium">{currentSong.addedByName}</span>
            </p>
          )}
        </div>
      </div>

      {/* Progress Slider */}
      <div className="space-y-1 mb-6">
        <div className="relative flex items-center group">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!currentSong}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400 transition"
            style={{
              background: `linear-gradient(to right, ${isCouple ? '#f43f5e' : '#06b6d4'} ${progressPercent}%, #1e293b ${progressPercent}%)`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between">
        {/* Volume controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 text-slate-400 hover:text-white transition rounded-full hover:bg-white/5"
          >
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 sm:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-300"
          />
        </div>

        {/* Center Play / Pause & Skip buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlayPause}
            disabled={!currentSong}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform transform active:scale-95 ${
              !currentSong 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : isCouple 
                  ? 'bg-gradient-to-tr from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 shadow-rose-600/40 hover:scale-105' 
                  : 'bg-gradient-to-tr from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 shadow-cyan-600/40 hover:scale-105'
            }`}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>

          <button
            onClick={playNext}
            disabled={!currentSong}
            title="Skip to next song"
            className="p-3 text-slate-300 hover:text-white transition rounded-full hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <SkipForward size={22} />
          </button>
        </div>

        {/* Mode Pill Badge */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
            <Radio size={14} className={isPlaying ? 'text-emerald-400 animate-pulse' : 'text-slate-500'} />
            {isCouple ? 'Couples Room' : 'Party Room'}
          </span>
        </div>
      </div>
    </div>
  );
}
