import React from 'react';
import { useRoom } from '../context/RoomContext';

export default function ReactionsOverlay() {
  const { floatingReactions } = useRoom();

  if (floatingReactions.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {floatingReactions.map((item, index) => {
        // Pseudo-random positioning based on index
        const randomLeft = 15 + ((index * 37) % 70); // between 15% and 85%
        const randomDelay = (index % 3) * 0.1;

        return (
          <div
            key={item.id}
            className="absolute bottom-10 text-4xl animate-float-up flex flex-col items-center"
            style={{
              left: `${randomLeft}%`,
              animation: `floatUp 2.8s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
              animationDelay: `${randomDelay}s`,
            }}
          >
            <span>{item.emoji}</span>
            <span className="text-[10px] font-bold text-white/80 bg-black/40 px-1.5 py-0.5 rounded-full mt-1 backdrop-blur-xs">
              {item.userName}
            </span>
          </div>
        );
      })}

      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.6) rotate(0deg);
          }
          15% {
            opacity: 1;
            transform: translateY(-40px) scale(1.2) rotate(-5deg);
          }
          80% {
            opacity: 0.9;
            transform: translateY(-380px) scale(1) rotate(5deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-500px) scale(0.8) rotate(15deg);
          }
        }
      `}</style>
    </div>
  );
}
