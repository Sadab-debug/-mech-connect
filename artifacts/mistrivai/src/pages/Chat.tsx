import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Send, MessageSquare, ArrowLeft, Search, X, ChevronDown } from 'lucide-react';

interface Conversation {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  last_message: string;
  last_time: string;
  unread_count: number;
}

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  is_read: boolean;
}

interface ChatUser {
  id: string;
  username: string;
  avatar: string | null;
  role: string;
}

const MSG_POLL_INTERVAL = 3000;
const CONV_POLL_INTERVAL = 6000;

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [newMsgBanner, setNewMsgBanner] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const activeConvRef = useRef<Conversation | null>(null);
  const lastMsgIdRef = useRef<number>(0);
  const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const convPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myId = user ? `${user.role}_${user.id}` : '';

  const isAtBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    loadConversations();
    startConvPolling();
    return () => {
      if (msgPollRef.current) clearInterval(msgPollRef.current);
      if (convPollRef.current) clearInterval(convPollRef.current);
    };
  }, [user, authLoading]);

  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  const loadConversations = async () => {
    try {
      const res = await apiGet('/chat/conversations');
      const data = await res.json();
      if (data.success) setConversations(data.conversations);
    } catch {}
    setLoadingConvs(false);
  };

  const startConvPolling = () => {
    if (convPollRef.current) clearInterval(convPollRef.current);
    convPollRef.current = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await apiGet('/chat/conversations');
        const data = await res.json();
        if (!data.success) return;
        setConversations(prev => {
          const activeId = activeConvRef.current?.id;
          return data.conversations.map((c: Conversation) =>
            c.id === activeId ? { ...c, unread_count: 0 } : c
          );
        });
      } catch {}
    }, CONV_POLL_INTERVAL);
  };

  const startMsgPolling = useCallback((convId: string) => {
    if (msgPollRef.current) clearInterval(msgPollRef.current);
    msgPollRef.current = setInterval(async () => {
      if (document.hidden) return;
      if (activeConvRef.current?.id !== convId) return;
      try {
        const res = await apiGet(`/chat/messages/${convId}`);
        const data = await res.json();
        if (!data.success) return;
        const newMessages: Message[] = data.messages;
        if (newMessages.length === 0) return;
        const latestId = newMessages[newMessages.length - 1].id;
        if (latestId <= lastMsgIdRef.current) return;
        const hadMessages = lastMsgIdRef.current > 0;
        lastMsgIdRef.current = latestId;
        setMessages(newMessages);
        if (hadMessages) {
          if (isAtBottom()) {
            setTimeout(() => scrollToBottom(true), 50);
          } else {
            setNewMsgBanner(true);
          }
        }
      } catch {}
    }, MSG_POLL_INTERVAL);
  }, []);

  const stopMsgPolling = () => {
    if (msgPollRef.current) {
      clearInterval(msgPollRef.current);
      msgPollRef.current = null;
    }
  };

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setNewMsgBanner(false);
    setShowUserPicker(false);
    setLoadingMsgs(true);
    lastMsgIdRef.current = 0;
    stopMsgPolling();
    try {
      const res = await apiGet(`/chat/messages/${conv.id}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        if (data.messages.length > 0) {
          lastMsgIdRef.current = data.messages[data.messages.length - 1].id;
        }
        setTimeout(() => scrollToBottom(false), 50);
      }
    } catch {}
    setLoadingMsgs(false);
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    startMsgPolling(conv.id);
  };

  const closeConversation = () => {
    setActiveConv(null);
    stopMsgPolling();
    setNewMsgBanner(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeConv || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');
    try {
      const res = await apiPost('/chat/send', { receiver_id: activeConv.id, content });
      const data = await res.json();
      if (data.success) {
        const newMsg: Message = {
          id: data.message_id, sender_id: myId, receiver_id: activeConv.id,
          content, image_url: null, created_at: new Date().toISOString(), is_read: false
        };
        setMessages(prev => {
          const updated = [...prev, newMsg];
          lastMsgIdRef.current = data.message_id;
          return updated;
        });
        setConversations(prev => prev.map(c =>
          c.id === activeConv.id ? { ...c, last_message: content, last_time: new Date().toISOString() } : c
        ));
        setTimeout(() => scrollToBottom(true), 50);
      }
    } catch {}
    setSending(false);
  };

  const openUserPicker = async () => {
    setShowUserPicker(true);
    setUserSearch('');
    try {
      const res = await apiGet('/chat/users');
      const data = await res.json();
      if (data.success) setChatUsers(data.users);
    } catch {}
  };

  const startChatWith = (u: ChatUser) => {
    const existing = conversations.find(c => c.id === u.id);
    if (existing) { openConversation(existing); return; }
    const conv: Conversation = {
      id: u.id, name: u.username, avatar: u.avatar,
      role: u.role, last_message: '', last_time: '', unread_count: 0
    };
    setConversations(prev => [conv, ...prev]);
    openConversation(conv);
  };

  const filteredUsers = chatUsers.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-[#7e57c2] border-t-transparent animate-spin"></div>
    </div>;
  }

  return (
    <div className="h-[calc(100vh-64px)] flex" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e7eef7 100%)' }}>

      {/* Sidebar */}
      <div className={`${activeConv ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 bg-white/80 backdrop-blur border-r border-black/10`}>
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="font-black text-gray-900 text-lg">Messages</h2>
          <button onClick={openUserPicker}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-xs hover:opacity-90">
            + New Chat
          </button>
        </div>

        {/* User picker modal */}
        {showUserPicker && (
          <div className="absolute inset-0 z-20 bg-black/40 flex items-start justify-center pt-20 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-black text-gray-900">Start a Conversation</h3>
                <button onClick={() => setShowUserPicker(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <div className="p-3 border-b">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50">
                  <Search size={15} className="text-gray-400" />
                  <input type="text" placeholder="Search by name..." value={userSearch}
                    onChange={e => setUserSearch(e.target.value)} autoFocus
                    className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">
                    {chatUsers.length === 0 ? 'No users available' : 'No results found'}
                  </p>
                ) : filteredUsers.map(u => (
                  <button key={u.id} onClick={() => startChatWith(u)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50">
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center shrink-0">
                        <span className="text-white font-black text-sm">{u.username[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{u.username}</p>
                      <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse"></div>)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 font-semibold">No conversations yet</p>
              <button onClick={openUserPicker}
                className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-sm">
                Start a conversation
              </button>
            </div>
          ) : conversations.map(conv => (
            <button key={conv.id} onClick={() => openConversation(conv)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50/80 transition-colors text-left border-b border-black/5 ${activeConv?.id === conv.id ? 'bg-[#7e57c2]/10' : ''}`}>
              {conv.avatar ? (
                <img src={conv.avatar} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center shrink-0">
                  <span className="text-white font-black">{conv.name[0]?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-900 truncate">{conv.name}</p>
                  {conv.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#7e57c2] text-white text-xs font-bold flex items-center justify-center shrink-0 ml-1">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{conv.last_message || 'Start chatting'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className={`${!activeConv ? 'hidden md:flex' : 'flex'} flex-col flex-1 relative`}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400 font-semibold">Select a conversation</p>
              <button onClick={openUserPicker}
                className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-sm hover:opacity-90">
                Start New Chat
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur border-b border-black/10 shrink-0">
              <button onClick={closeConversation} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <ArrowLeft size={20} />
              </button>
              {activeConv.avatar ? (
                <img src={activeConv.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center">
                  <span className="text-white font-black">{activeConv.name[0]?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-black text-gray-900">{activeConv.name}</p>
                <p className="text-xs text-gray-400 capitalize flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20c997] inline-block"></span>
                  {activeConv.role} · live updates every {MSG_POLL_INTERVAL / 1000}s
                </p>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 rounded-full border-4 border-[#7e57c2] border-t-transparent animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Start the conversation!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.sender_id === myId;
                  const prevMsg = messages[idx - 1];
                  const showTime = !prevMsg || (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) > 5 * 60 * 1000;
                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <div className="flex justify-center my-2">
                          <span className="text-xs text-gray-400 bg-white/60 px-3 py-1 rounded-full border border-black/5">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isMine
                            ? 'bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white rounded-br-sm'
                            : 'bg-white/90 text-gray-900 border border-black/10 rounded-bl-sm'
                        }`}>
                          {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                          {msg.image_url && <img src={msg.image_url} alt="img" className="rounded-lg max-w-full mt-1" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* New message banner */}
            {newMsgBanner && (
              <button
                onClick={() => { scrollToBottom(true); setNewMsgBanner(false); }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-[#7e57c2] text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity animate-bounce">
                <ChevronDown size={16} /> New message
              </button>
            )}

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 bg-white/80 backdrop-blur border-t border-black/10 flex gap-3 shrink-0">
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-xl border border-black/10 bg-white/70 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40"
              />
              <button type="submit" disabled={sending || !text.trim()}
                className="p-3 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white hover:opacity-90 disabled:opacity-60 transition-opacity">
                <Send size={20} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
