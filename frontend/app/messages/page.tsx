'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Send, MessageSquare, User, Wifi, WifiOff, Circle } from 'lucide-react';
import { messagesService } from '@/services/messages.service';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import type { Message } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, 'ws') || 'ws://localhost:8000';

type OnlineMap = Record<number, boolean>;

export default function MessagesPage() {
  const router = useRouter();
  const { isAuthenticated, user, accessToken } = useAuthStore();

  const [selectedPartner, setSelectedPartner] = useState<number | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<OnlineMap>({});

  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selectedPartner);
  selectedRef.current = selectedPartner;

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, []);

  // ── Load conversation history when partner changes ────────────────────────
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['thread', selectedPartner],
    queryFn: () => messagesService.getThread(selectedPartner!),
    enabled: !!selectedPartner,
    staleTime: 0,
  });

  useEffect(() => {
    if (history) setThreadMessages(history);
  }, [history]);

  // ── WebSocket lifecycle ───────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    if (!accessToken) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setWsStatus('connecting');
    const ws = new WebSocket(`${WS_URL}/api/v1/ws/chat?token=${accessToken}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      // Start ping keepalive every 25 seconds
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25_000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'pong') return;

      if (data.type === 'online') {
        setOnlineUsers((prev) => ({ ...prev, [data.user_id]: data.status }));
        return;
      }

      if (data.type === 'message') {
        const msg = data as Message;
        // Only append to thread if it belongs to the currently open conversation
        const partner = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
        if (partner === selectedRef.current) {
          setThreadMessages((prev) => [...prev, msg]);
        }
      }
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      if (pingRef.current) clearInterval(pingRef.current);
      // Auto-reconnect after 3s
      setTimeout(connectWS, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [accessToken, user?.id]);

  useEffect(() => {
    connectWS();
    return () => {
      wsRef.current?.close();
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [connectWS]);

  // ── Auto scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  // ── Send ─────────────────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!text.trim() || !selectedPartner || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'message', receiver_id: selectedPartner, text: text.trim() }));
    setText('');
  };

  // ── Conversation list (initial data from REST, kept as partner Set) ───────
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesService.getConversations,
  });

  const partners = conversations
    ? Array.from(
        new Map(
          conversations.map((m) => {
            const partnerId = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
            return [partnerId, { id: partnerId, last: m }];
          })
        ).values()
      )
    : [];

  // ── Status indicator ──────────────────────────────────────────────────────
  const statusColor =
    wsStatus === 'connected' ? 'text-emerald-400' : wsStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400';
  const StatusIcon = wsStatus === 'connected' ? Wifi : WifiOff;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Сообщения</h1>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${statusColor}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {wsStatus === 'connected' ? 'В сети' : wsStatus === 'connecting' ? 'Подключение…' : 'Переподключение…'}
        </div>
      </div>

      <div className="card p-0 overflow-hidden" style={{ height: '72vh' }}>
        <div className="flex h-full">

          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 border-r border-slate-700/50 flex flex-col">
            <div className="p-4 border-b border-slate-700/50">
              <div className="text-slate-400 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {partners.length} диалог{partners.length !== 1 && partners.length < 5 ? 'а' : partners.length >= 5 ? 'ов' : ''}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {partners.length === 0 && (
                <p className="p-6 text-center text-slate-500 text-sm">Пока нет диалогов</p>
              )}
              {partners.map(({ id, last }) => {
                const isOnline = onlineUsers[id] ?? false;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setSelectedPartner(id);
                      setThreadMessages([]);
                    }}
                    className={`w-full text-left p-4 flex items-center gap-3 transition-colors hover:bg-surface-muted ${
                      selectedPartner === id ? 'bg-surface-muted border-l-2 border-brand-500' : ''
                    }`}
                  >
                    {/* Avatar with online dot */}
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                        <User className="w-4 h-4 text-brand-400" />
                      </div>
                      {isOnline && (
                        <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-emerald-400 fill-emerald-400 bg-surface-card rounded-full" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white flex items-center gap-1.5">
                        Пользователь #{id}
                        {isOnline && <span className="text-xs text-emerald-400 font-normal">в сети</span>}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">{last.text}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Chat pane */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedPartner ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Выберите диалог</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-5 py-3 border-b border-slate-700/50 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-brand-400" />
                    </div>
                    {onlineUsers[selectedPartner] && (
                      <Circle className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-emerald-400 fill-emerald-400 bg-surface-card rounded-full" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Пользователь #{selectedPartner}</div>
                    <div className="text-xs text-slate-500">
                      {onlineUsers[selectedPartner] ? '● В сети' : '○ Не в сети'}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
                  {historyLoading && (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {threadMessages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                        <div
                          className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5 ${
                            isMe
                              ? 'bg-brand-600 text-white rounded-br-sm'
                              : 'bg-surface-muted text-slate-200 rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-brand-200' : 'text-slate-500'}`}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div className="p-4 border-t border-slate-700/50">
                  {wsStatus !== 'connected' && (
                    <p className="text-xs text-yellow-400 text-center mb-2">
                      Переподключение к серверу…
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Введите сообщение… (Enter для отправки)"
                      className="input-field flex-1 py-2.5"
                      disabled={wsStatus !== 'connected'}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!text.trim() || wsStatus !== 'connected'}
                      className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
