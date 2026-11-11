import React, { useState, useRef, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { MessageSquare, Send } from 'lucide-react';

export default function Chat() {
  const { room, currentUser, sendChat } = useRoom();
  const chat = room?.chat || [];
  const isCouple = room?.mode === 'couple';

  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendChat(input);
    setInput('');
  };

  const formatChatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`rounded-3xl p-6 shadow-xl flex flex-col h-[400px] ${
      isCouple ? 'glass-panel-couple' : 'glass-panel'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-4 border-b border-white/10 mb-4">
        <MessageSquare size={18} className={isCouple ? 'text-rose-400' : 'text-cyan-400'} />
        <h4 className="text-sm font-bold text-white">Live Room Chat</h4>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {chat.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            Say something to your {isCouple ? 'partner' : 'friends'}!
          </div>
        ) : (
          chat.map((msg) => {
            const isMe = msg.senderName === currentUser?.name;
            const isSystem = msg.type === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] bg-white/5 text-slate-400 border border-white/5">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-baseline gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-bold text-slate-400">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono">
                    {formatChatTime(msg.timestamp)}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs break-words shadow-sm ${
                    isMe
                      ? isCouple
                        ? 'bg-rose-600 text-white rounded-br-xs'
                        : 'bg-cyan-600 text-white rounded-br-xs'
                      : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-white/5'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="pt-3 border-t border-white/10 flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className={`px-3 py-2 rounded-xl text-white transition disabled:opacity-40 flex items-center justify-center ${
            isCouple 
              ? 'bg-rose-600 hover:bg-rose-500' 
              : 'bg-cyan-600 hover:bg-cyan-500'
          }`}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
