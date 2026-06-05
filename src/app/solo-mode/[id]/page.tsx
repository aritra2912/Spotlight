'use client';

import React, { useState, useEffect, useRef, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageSquare, 
  ChevronLeft, 
  Send, 
  Clock, 
  Trash2,
  Lock,
  VolumeX,
  Volume2
} from 'lucide-react';
import { mockDb, ChatMessage, User, type Event } from '@/lib/mockDb';
import Header from '@/components/Header';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SoloModeChatPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [event, setEvent] = useState<Event | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [inputValue, setInputValue] = useState('');
  
  // Moderation Lists
  const [mutedUserIds, setMutedUserIds] = useState<string[]>([]);
  const [chatAccessDenied, setChatAccessDenied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChatData = useCallback(() => {
    const ev = mockDb.getEvent(id);
    if (!ev) {
      router.push('/');
      return;
    }
    setEvent(ev);

    const user = mockDb.getActiveUser();
    setCurrentUser(user);

    // Verify ticket holder authorization
    const tkts = mockDb.getTickets().filter(t => t.eventId === id && t.purchaserId === user.id);
    const hasValidTicket = tkts.some(t => t.status === 'valid' || t.status === 'checked-in');
    
    // Creator always has access
    const isCreator = ev.creatorId === user.id;

    if (!hasValidTicket && !isCreator) {
      setChatAccessDenied(true);
      return;
    }

    // Load messages
    const msgs = mockDb.getChatMessages(id);
    setMessages(msgs);

    // Load local muted list
    const storedMuted = localStorage.getItem(`muted_${id}`);
    if (storedMuted) {
      setMutedUserIds(JSON.parse(storedMuted));
    }
  }, [id, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadChatData();
    }, 0);

    const handleDbUpdate = () => {
      loadChatData();
    };
    window.addEventListener('mockdb-update', handleDbUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mockdb-update', handleDbUpdate);
    };
  }, [loadChatData]);

  // Auto scroll to latest bubble
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (chatAccessDenied) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-sm w-full glass-card p-6 text-center space-y-4">
            <Lock className="h-10 w-10 text-danger mx-auto" />
            <h4 className="font-semibold text-white text-base">Chat Access Denied</h4>
            <p className="text-xs text-gray-400 leading-normal">
              Solo Mode temporary chats are restricted to verified ticket holders of this event. Book a pass to unlock.
            </p>
            <Link href={`/events/${id}`} className="inline-block py-2 px-4 rounded-xl bg-primary text-white text-xs font-semibold">
              Get Event Pass
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!event || !currentUser) return null;

  const isCreator = event.creatorId === currentUser.id;
  const isMuted = mutedUserIds.includes(currentUser.id);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isMuted) return;

    mockDb.sendChatMessage(event.id, inputValue);
    setInputValue('');
    
    // Re-sync
    setMessages(mockDb.getChatMessages(event.id));
    window.dispatchEvent(new Event('mockdb-update'));
  };

  const handleMuteUser = (userId: string) => {
    if (!isCreator) return;
    
    let updated: string[];
    if (mutedUserIds.includes(userId)) {
      updated = mutedUserIds.filter(id => id !== userId);
    } else {
      updated = [...mutedUserIds, userId];
    }
    
    setMutedUserIds(updated);
    localStorage.setItem(`muted_${event.id}`, JSON.stringify(updated));
    alert(mutedUserIds.includes(userId) ? 'User Unmuted' : 'User Muted in this chat room');
  };

  const handleRemoveMessage = (msgId: string) => {
    if (!isCreator) return;
    mockDb.deleteChatMessage(msgId);
    
    // Re-sync
    setMessages(mockDb.getChatMessages(event.id));
    window.dispatchEvent(new Event('mockdb-update'));
  };

  const dateStr = new Date(event.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 md:py-10 flex flex-col h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Chat Header details */}
        <div className="glass-card p-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <Link href={`/events/${event.id}`} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div>
              <h4 className="font-semibold text-white text-sm leading-snug">{event.title}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Solo Mode chat room • {dateStr}</p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-semibold flex items-center gap-1 shrink-0">
            <MessageSquare className="h-3 w-3" /> Ticket Holder Group
          </span>
        </div>

        {/* Chat lifecycle alert note */}
        <div className="p-3 bg-white/[0.02] border-b border-l border-r border-white/5 rounded-b-2xl flex gap-2.5 text-[10px] text-gray-400 leading-normal shrink-0">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <p>
            <strong>Solo Mode Lifecycle (Loophole #13):</strong> This temporary chat was created 24 hours before event start, and will auto-delete permanently 24 hours after show concludes. No PII is shared.
          </p>
        </div>

        {/* Chat Messages Display viewport */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4 min-h-[300px] pr-1">
          {messages.length === 0 ? (
            <div className="text-center py-16 space-y-1">
              <MessageSquare className="h-8 w-8 text-gray-600 mx-auto" />
              <p className="text-xs text-gray-400">Welcome to Solo Mode! Say hello to other attendees.</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.userId === currentUser.id;
              const msgUserMuted = mutedUserIds.includes(msg.userId);
              
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Bubble sender */}
                  <span className="text-[9px] text-gray-500 font-semibold mb-0.5 px-1.5">
                    {msg.userName} {msg.userId === event.creatorId && '(Host)'}
                  </span>

                  <div className="flex items-center gap-1.5 max-w-[85%] group">
                    {/* Creator Moderation action */}
                    {isCreator && !isMe && (
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button
                          onClick={() => handleMuteUser(msg.userId)}
                          className="p-1 rounded bg-white/5 text-gray-400 hover:text-white"
                          title={msgUserMuted ? 'Unmute participant' : 'Mute participant'}
                        >
                          {msgUserMuted ? <Volume2 className="h-3 w-3 text-success" /> : <VolumeX className="h-3 w-3 text-warning" />}
                        </button>
                        <button
                          onClick={() => handleRemoveMessage(msg.id)}
                          className="p-1 rounded bg-white/5 text-gray-400 hover:text-danger"
                          title="Delete message"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Bubble body */}
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white/5 border border-white/5 text-gray-200 rounded-tl-none'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="pt-3 border-t border-white/5 flex gap-2 shrink-0">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isMuted}
            placeholder={isMuted ? 'You have been muted in this chat room' : 'Type a safe message...'}
            className="flex-1 glass-input text-xs py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isMuted || !inputValue.trim()}
            className="p-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white disabled:opacity-50 transition-colors shrink-0"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>

      </main>
    </div>
  );
}
