import React from 'react';
import { useRoom } from './context/RoomContext';
import Navbar from './components/Navbar';
import Lobby from './components/Lobby';
import Player from './components/Player';
import Queue from './components/Queue';
import CoupleView from './components/CoupleView';
import GroupView from './components/GroupView';
import Chat from './components/Chat';
import ReactionsOverlay from './components/ReactionsOverlay';

function RoomContent() {
  const { room } = useRoom();

  if (!room) {
    return <Lobby />;
  }

  const isCouple = room.mode === 'couple';

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Synchronized Player */}
      <Player />

      {/* Mode-specific Experience: Couple or Group */}
      {isCouple ? <CoupleView /> : <GroupView />}

      {/* Shared Queue and Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <Queue />
        </div>
        <div className="lg:col-span-5">
          <Chat />
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      <Navbar />
      <div className="flex-1">
        <RoomContent />
      </div>
      <ReactionsOverlay />

      <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-500">
        <p>MusiCoup • Listen together in real time • Free for friends & couples</p>
      </footer>
    </div>
  );
}
