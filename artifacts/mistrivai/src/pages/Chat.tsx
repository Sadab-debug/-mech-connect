import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Send, MessageSquare, ArrowLeft, Search, X } from 'lucide-react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myId = user ? `${user.role}_${user.id}` : '';

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    loadConversations();
  }, [user, authLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await apiGet('/chat/conversations');
      const data = await res.json();
      if (data.success) setConversations(data.conversations);
    } catch {}
    setLoadingConvs(false);
  };

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setShowUserPicker(false);
    setLoadingMsgs(true);
    try {
      const res = await apiGet(`/chat/messages/${conv.id}`);
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch {}
    setLoadingMsgs(false);
    setConversations(prev => prev.map(c => c.id === conv.id ? {...c, unread_count: 0} : c));
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
        setMessages(prev => [...prev, {
          id: data.message_id, sender_id: myId, receiver_id: activeConv.id,
          content, image_url: null, created_at: new Date().toISOString(), is_read: false
        }]);
        setConversations(prev => prev.map(c => c.id === activeConv.id
          ? { ...c, last_message: content, last_time: new Date().toISOString() }
          : c
        ));
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
    if (existing) {
      openConversation(existing);
      return;
    }
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
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#7e57c2] border-t-transparent animate-spin"></div></div>;
  }

  return (
    <div className="h-[calc(100vh-64px)] flex" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e7eef7 100%)' }}>
      {/* Sidebar */}
      <div className={`${activeConv ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 bg-white/80 backdrop-blur border-r border-black/10`}>
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="font-black text-gray-900 text-lg">Messages</h2>
          <button
            onClick={openUserPicker}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-xs hover:opacity-90">
            + New Chat
          </button>
        </div>

        {/* User picker */}
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
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">
                    {chatUsers.length === 0 ? 'No users available to chat with' : 'No results found'}
                  </p>
                ) : (
                  filteredUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => startChatWith(u)}
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
                  ))
                )}
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
              <button onClick={openUserPicker} className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-sm">
                Start a conversation
              </button>
            </div>
          ) : (
            conversations.map(conv => (
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
                      <span className="w-5 h-5 rounded-full bg-[#7e57c2] text-white text-xs font-bold flex items-center justify-center shrink-0">{conv.unread_count}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.last_message || 'Start chatting'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className={`${!activeConv ? 'hidden md:flex' : 'flex'} flex-col flex-1`}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400 font-semibold">Select a conversation</p>
              <button onClick={openUserPicker} className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-sm hover:opacity-90">
                Start New Chat
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur border-b border-black/10">
              <button onClick={() => setActiveConv(null)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <ArrowLeft size={20} />
              </button>
              {activeConv.avatar ? (
                <img src={activeConv.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center">
                  <span className="text-white font-black">{activeConv.name[0]?.toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="font-black text-gray-900">{activeConv.name}</p>
                <p className="text-xs text-gray-400 capitalize">{activeConv.role}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 rounded-full border-4 border-[#7e57c2] border-t-transparent animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">Start the conversation!</div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === myId;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white rounded-br-md' : 'bg-white/90 text-gray-900 border border-black/10 rounded-bl-md'}`}>
                        {msg.content && <p>{msg.content}</p>}
                        {msg.image_url && <img src={msg.image_url} alt="img" className="rounded-lg max-w-full mt-1" />}
                        <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white/80 backdrop-blur border-t border-black/10 flex gap-3">
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
