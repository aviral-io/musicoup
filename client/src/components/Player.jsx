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
  AlertCircle,
  Tv,
  Image as ImageIcon
} from 'lucide-react';

export default function Player() {
  const { 
    room, 
    syncPlayback, 
    sendHostHeartbeat, 
    playNext, 
    isHost, 
    socketId, 
    syncCommand, 
    heartbeatSync 
  } = useRoom();

  const currentSong = room?.currentSong;
  const playback = room?.playback;
  const isCouple = room?.mode === 'couple';

  const playerRef = useRef(null);
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isDrifting, setIsDrifting] = useState(false);
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  // 1. Initialize YouTube Player
  useEffect(() => {
    let checkInterval = null;

    const startPlayer = () => {
      if (playerRef.current) return;
      if (!window.YT || !window.YT.Player) return;

      const playerConfig = {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1, // Crucial for mobile iOS & Android browsers!
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            setIsReady(true);
            event.target.setVolume(volume);

            if (currentSong?.id) {
              const startAt = playback?.currentTime || 0;
              event.target.loadVideoById(currentSong.id, startAt);
              if (playback?.status === 'playing') {
                tryPlay();
              } else {
                event.target.pauseVideo();
              }
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setNeedsTapToPlay(false);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              // Only host triggers skip to prevent duplicate skips
              if (isHostRef.current) {
                playNext();
              }
            }
          },
          onError: (err) => {
            console.error('YouTube player error:', err);
          }
        }
      };

      if (currentSong?.id) {
        playerConfig.videoId = currentSong.id;
      }

      try {
        playerRef.current = new window.YT.Player('youtube-player-frame', playerConfig);
      } catch (e) {
        console.error('Error mounting YT player:', e);
      }
    };

    if (window.YT && window.YT.Player) {
      startPlayer();
    } else {
      if (!document.getElementById('yt-iframe-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        startPlayer();
      };

      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          startPlayer();
        }
      }, 150);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  const tryPlay = () => {
    if (!playerRef.current || !playerRef.current.playVideo) return;
    try {
      const promise = playerRef.current.playVideo();
      if (promise !== undefined) {
        promise.catch?.(() => {
          setNeedsTapToPlay(true);
        });
      }
    } catch (e) {
      setNeedsTapToPlay(true);
    }
  };

  // Direct user tap to unlock mobile autoplay restriction
  const handleUserUnlockPlay = () => {
    if (!playerRef.current) return;
    try {
      const targetTime = playback?.currentTime || 0;
      playerRef.current.seekTo(targetTime, true);
      playerRef.current.playVideo();
      setNeedsTapToPlay(false);
      setIsPlaying(true);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Track Change: When song changes in room state
  useEffect(() => {
    if (!playerRef.current || !isReady) return;

    if (currentSong?.id) {
      try {
        const currentUrl = playerRef.current.getVideoUrl?.() || '';
        if (!currentUrl.includes(currentSong.id)) {
          const startTime = playback?.currentTime || 0;
          playerRef.current.loadVideoById(currentSong.id, startTime);
          if (playback?.status === 'playing') {
            tryPlay();
          } else {
            playerRef.current.pauseVideo();
          }
        }
      } catch (e) {
        console.error('Error loading video by id:', e);
      }
    } else {
      try {
        playerRef.current.stopVideo?.();
      } catch (e) {}
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [currentSong?.id, isReady]);

  // 3. Event-Driven Sync: When Play / Pause / Seek command arrives from socket
  useEffect(() => {
    if (!syncCommand || !playerRef.current || !isReady) return;

    // If I was the one who sent this action, ignore to avoid self-jitter
    if (syncCommand.updatedBy && syncCommand.updatedBy === socketId) {
      return;
    }

    const player = playerRef.current;
    const targetTime = Number(syncCommand.currentTime) || 0;

    if (syncCommand.status === 'paused') {
      try {
        player.pauseVideo();
        player.seekTo(targetTime, true);
        setIsPlaying(false);
      } catch (e) {}
    } else if (syncCommand.status === 'playing') {
      try {
        player.seekTo(targetTime, true);
        tryPlay();
      } catch (e) {}
    }
  }, [syncCommand, isReady, socketId]);

  // 4. Soft Heartbeat Sync from Host (Only checks every ~6s, only seeks if drift > 3s)
  useEffect(() => {
    if (!heartbeatSync || !playerRef.current || !isReady || isHost) return;

    const player = playerRef.current;
    const hostTime = Number(heartbeatSync.currentTime) || 0;
    const localTime = player.getCurrentTime ? player.getCurrentTime() : 0;
    const drift = Math.abs(localTime - hostTime);

    // Only align if real lag happened (> 3.0s drift)
    if (drift > 3.0 && !isSeeking) {
      setIsDrifting(true);
      try {
        player.seekTo(hostTime, true);
      } catch (e) {}
      setTimeout(() => setIsDrifting(false), 800);
    }
  }, [heartbeatSync, isReady, isHost, isSeeking]);

  // 5. Host broadcasts its playback clock every 5s while playing
  useEffect(() => {
    if (!isHost || !isReady || !isPlaying || !currentSong) return;

    const heartbeatTimer = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        try {
          const time = playerRef.current.getCurrentTime() || 0;
          sendHostHeartbeat(time);
        } catch (e) {}
      }
    }, 5000);

    return () => clearInterval(heartbeatTimer);
  }, [isHost, isReady, isPlaying, currentSong]);

  // 6. Local progress bar timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && isReady && playerRef.current.getCurrentTime && !isSeeking) {
        try {
          const time = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || currentSong?.duration || 0;
          setCurrentTime(time);
          if (dur > 0) setDuration(dur);
        } catch (e) {}
      }
    }, 400);

    return () => clearInterval(timer);
  }, [isReady, currentSong, isSeeking]);

  // Controls
  const togglePlayPause = () => {
    if (!currentSong || !playerRef.current) return;
    const nextStatus = isPlaying ? 'paused' : 'playing';
    const time = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : currentTime;
    
    // Immediate local feedback
    if (nextStatus === 'playing') {
      tryPlay();
    } else {
      playerRef.current.pauseVideo?.();
      setIsPlaying(false);
    }

    // Broadcast to room
    syncPlayback({ status: nextStatus, currentTime: time });
  };

  const handleSeekChange = (e) => {
    if (!currentSong) return;
    setIsSeeking(true);
    setCurrentTime(parseFloat(e.target.value));
  };

  const handleSeekEnd = (e) => {
    if (!currentSong) return;
    const newTime = parseFloat(e.target.value);
    setIsSeeking(false);
    if (playerRef.current?.seekTo) {
      try {
        playerRef.current.seekTo(newTime, true);
      } catch (err) {}
    }
    syncPlayback({ status: isPlaying ? 'playing' : 'paused', currentTime: newTime });
  };

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (playerRef.current?.setVolume) {
      try {
        playerRef.current.setVolume(val);
        if (val === 0) setIsMuted(true);
        else setIsMuted(false);
      } catch (e) {}
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume || 50);
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (e) {}
  };

  const forceResync = () => {
    if (!playback || !playerRef.current) return;
    const targetTime = Number(playback.currentTime) || 0;
    try {
      playerRef.current.seekTo(targetTime, true);
      if (playback.status === 'playing') {
        tryPlay();
      }
    } catch (e) {}
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
      {/* Mobile Autoplay Permission Banner / Button */}
      {(needsTapToPlay || (playback?.status === 'playing' && !isPlaying && currentSong)) && (
        <div className="mb-5 p-4 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 rounded-2xl flex items-center justify-between shadow-xl animate-pulse">
          <div className="flex items-center gap-2.5 text-white text-xs sm:text-sm font-bold">
            <Radio size={20} className="animate-spin text-amber-300" />
            <span>Audio paused by mobile browser. Tap to sync audio!</span>
          </div>
          <button
            onClick={handleUserUnlockPlay}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
          >
            ▶ Tap to Sync
          </button>
        </div>
      )}

      {/* Track Info & Visualizer / Video Frame */}
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mb-6">
        {/* Media Frame: Video is always in DOM, Cover Art overlays when video is off */}
        <div className="relative group w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-xl flex-shrink-0 bg-slate-900 border border-white/10 flex items-center justify-center">
          {/* YouTube IFrame: ALWAYS placed here inside the viewport so mobile browsers never freeze it! */}
          <div className="absolute inset-0 w-full h-full">
            <div id="youtube-player-frame" className="w-full h-full"></div>
          </div>

          {/* Cover Art Overlay (Visible when user prefers cover art view) */}
          {!showVideo && (
            <div className="absolute inset-0 w-full h-full bg-slate-900 z-10 pointer-events-none transition-opacity duration-300">
              {currentSong ? (
                <>
                  <img
                    src={currentSong.thumbnail}
                    alt={currentSong.title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isPlaying ? 'scale-105' : 'scale-100 opacity-80'
                    }`}
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center pb-3">
                      <div className="flex items-end gap-1 h-5">
                        <span className="w-1 bg-white rounded-full equalizer-bar-1"></span>
                        <span className="w-1 bg-white rounded-full equalizer-bar-2"></span>
                        <span className="w-1 bg-white rounded-full equalizer-bar-3"></span>
                        <span className="w-1 bg-white rounded-full equalizer-bar-4"></span>
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
          )}
        </div>

        {/* Title, Artist, Controls */}
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
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"
            >
              <RefreshCw size={11} />
              Resync
            </button>

            {/* Toggle Video / Cover Art */}
            {currentSong && (
              <button
                onClick={() => setShowVideo(!showVideo)}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
              >
                {showVideo ? <ImageIcon size={12} /> : <Tv size={12} />}
                <span>{showVideo ? 'Cover Art' : 'Watch Video'}</span>
              </button>
            )}
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
            onChange={handleSeekChange}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
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
            className="p-2 text-slate-400 hover:text-white transition rounded-full hover:bg-white/5 cursor-pointer"
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
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform transform active:scale-95 cursor-pointer ${
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
            className="p-3 text-slate-300 hover:text-white transition rounded-full hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
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
