import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, MessageCircleOff, Megaphone, MessageSquare, Send, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

function conversationTitle(conversation) {
  if (conversation?.type === 'classroom') return conversation.classroom?.name || 'Classroom thread';
  return conversation?.participant?.fullName || 'Direct message';
}

export default function MessagingPanel({ classroom = null, embedded = false }) {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [kind, setKind] = useState('message');
  const [priority, setPriority] = useState('normal');
  const [moderationReason, setModerationReason] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const requestedClassroomId = searchParams.get('classroom');
  const active = useMemo(() => conversations.find((item) => item.id === activeId), [conversations, activeId]);
  const canAnnounce = active?.type === 'classroom' && (user?.role === 'teacher' || user?.role === 'admin');
  const classroomSettings = active?.classroom?.communicationSettings || {};
  const studentPostingBlocked = active?.type === 'classroom' && user?.role === 'student' && (classroomSettings.studentMessagingEnabled === false || classroomSettings.announcementsOnly);

  useEffect(() => {
    if (classroom?._id) {
      const classroomThread = { id: `classroom:${classroom._id}`, type: 'classroom', classroom };
      setConversations([classroomThread]);
      setActiveId(classroomThread.id);
      return;
    }
    api.get('/messages/conversations')
      .then((res) => {
        const threads = res.data.conversations || [];
        setConversations(threads);
        const requestedThread = requestedClassroomId ? threads.find((item) => item.type === 'classroom' && String(item.classroom?._id) === String(requestedClassroomId)) : null;
        setActiveId((current) => requestedThread?.id || current || threads[0]?.id || '');
      })
      .catch((error) => toast.error(getApiErrorMessage(error, 'Unable to load conversations.')));
  }, [classroom, requestedClassroomId]);

  useEffect(() => {
    if (!active) return;
    const params = active.type === 'classroom' ? { classroomId: active.classroom._id } : { userId: active.participant._id };
    if (active.type === 'classroom') socket?.emit('classroom:join', { classroomId: active.classroom._id });
    api.get('/messages', { params })
      .then((res) => setMessages(res.data.messages || []))
      .catch((error) => toast.error(getApiErrorMessage(error, 'Unable to load messages.')));
    api.patch('/messages/read', params).then(() => {
      setConversations((items) => items.map((item) => (item.id === active.id ? { ...item, unreadCount: 0 } : item)));
    }).catch(() => {});
    setTypingUsers([]);
  }, [active, socket]);

  useEffect(() => {
    if (!socket) return undefined;
    const onMessage = ({ message }) => {
      const belongsToActive = active?.type === 'classroom'
        ? String(message.classroom) === String(active.classroom?._id)
        : [message.sender?._id, message.receiver?._id].map(String).includes(String(active?.participant?._id));
      if (belongsToActive) setMessages((items) => [...items.filter((item) => item._id !== message._id), message]);
      setConversations((items) => items.map((item) => {
        const belongsToConversation = item.type === 'classroom'
          ? String(message.classroom) === String(item.classroom?._id)
          : [message.sender?._id, message.receiver?._id].map(String).includes(String(item.participant?._id));
        if (!belongsToConversation) return item;
        const fromSelf = String(message.sender?._id || message.sender) === String(user?._id);
        return { ...item, lastMessage: message, unreadCount: belongsToActive || fromSelf ? item.unreadCount || 0 : (item.unreadCount || 0) + 1 };
      }));
    };
    const onRead = ({ readerId, classroomId }) => {
      setMessages((items) => items.map((message) => {
        const appliesToMessage = classroomId ? String(message.classroom) === String(classroomId) : String(message.receiver?._id || message.receiver) === String(readerId);
        if (!appliesToMessage || message.readBy?.some((entry) => String(entry.user?._id || entry.user) === String(readerId))) return message;
        return { ...message, readBy: [...(message.readBy || []), { user: readerId, readAt: new Date().toISOString() }] };
      }));
    };
    const onTypingStart = (payload) => {
      if (String(payload.userId) === String(user?._id)) return;
      setTypingUsers((items) => [...items.filter((item) => item.userId !== payload.userId), payload]);
    };
    const onTypingStop = (payload) => setTypingUsers((items) => items.filter((item) => item.userId !== payload.userId));
    socket.on('message:new', onMessage);
    socket.on('message:read', onRead);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    return () => {
      socket.off('message:new', onMessage);
      socket.off('message:read', onRead);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [socket, active, user?._id]);

  useEffect(() => {
    if (!socket || !active || !content.trim()) return undefined;
    const payload = active.type === 'classroom' ? { classroomId: active.classroom._id } : { receiverId: active.participant._id };
    socket.emit('typing:start', payload);
    const timeout = setTimeout(() => socket.emit('typing:stop', payload), 1200);
    return () => clearTimeout(timeout);
  }, [socket, active, content]);

  async function sendMessage(event) {
    event.preventDefault();
    if (!active || !content.trim()) return;
    const payload = active.type === 'classroom' ? { classroom: active.classroom._id, content, kind: canAnnounce ? kind : 'message', priority } : { receiver: active.participant._id, content };
    try {
      const res = await api.post('/messages', payload);
      setMessages((items) => [...items.filter((item) => item._id !== res.data.message._id), res.data.message]);
      if (socket && active) {
        socket.emit('typing:stop', active.type === 'classroom' ? { classroomId: active.classroom._id } : { receiverId: active.participant._id });
      }
      setContent('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to send message.'));
    }
  }

  async function moderateMessage(messageId, status) {
    try {
      const res = await api.patch(`/messages/${messageId}/moderate`, { status, reason: moderationReason });
      setMessages((items) => items.map((item) => (item._id === messageId ? res.data.message : item)));
      setModerationReason('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to moderate message.'));
    }
  }

  return (
    <section className={embedded ? '' : 'rounded-2xl bg-white dark:bg-slate-800/90 p-6 shadow-lg border border-slate-200 dark:border-slate-700/50'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-500"><MessageSquare className="h-4 w-4" /> Messages</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{classroom ? `${classroom.name} classroom messages` : 'Inbox and classroom threads'}</h2>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${connected ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>
          {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />} {connected ? 'Realtime connected' : 'Offline polling'}
        </span>
      </div>
      <div className={`mt-5 grid gap-4 ${classroom ? '' : 'lg:grid-cols-[280px_1fr]'}`}>
        {!classroom && <aside className="space-y-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/50">
          {conversations.length === 0 ? <p className="p-3 text-sm text-slate-500">Join or create a classroom to start messaging.</p> : conversations.map((item) => (
            <button key={item.id} onClick={() => setActiveId(item.id)} className={`w-full rounded-xl p-3 text-left text-sm transition ${activeId === item.id ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}>
              <p className="flex items-center gap-2 font-bold">{item.type === 'classroom' && <Megaphone className="h-4 w-4" />} {conversationTitle(item)} {item.unreadCount > 0 && <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">{item.unreadCount}</span>} {item.type === 'classroom' && item.classroom?.communicationSettings?.studentMessagingEnabled === false && <MessageCircleOff className="h-4 w-4 text-amber-300" />}</p>
              <p className="mt-1 truncate text-xs opacity-80">{item.lastMessage?.content || (item.type === 'classroom' ? 'Classroom conversation' : 'Direct thread')}</p>
            </button>
          ))}
        </aside>}
        <div className="flex h-[620px] min-h-[420px] flex-col rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="border-b border-slate-200 p-4 dark:border-slate-700">
            <h3 className="font-black text-slate-900 dark:text-white">{active ? conversationTitle(active) : 'Select a thread'}</h3>
            {studentPostingBlocked && <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-500"><MessageCircleOff className="h-3 w-3" /> Student messages are disabled by your teacher.</p>}
            {typingUsers.length > 0 && <p className="mt-1 text-xs font-semibold text-blue-500">{typingUsers.map((item) => item.fullName).join(', ')} typing...</p>}
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => {
              const mine = String(message.sender?._id || message.sender) === String(user?._id);
              return (
                <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.kind === 'announcement' ? 'border border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100' : mine ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100'}`}>
                    <p className="flex items-center gap-2 text-xs font-bold opacity-80">
                      {message.kind === 'announcement' && <Megaphone className="h-3 w-3" />}
                      {mine ? 'You' : message.sender?.fullName}
                      {message.priority !== 'normal' && <span className="rounded-full bg-red-500/15 px-2 py-0.5 uppercase text-red-500">{message.priority}</span>}
                      {message.moderated?.status && message.moderated.status !== 'visible' && <span className="rounded-full bg-slate-500/15 px-2 py-0.5 uppercase">{message.moderated.status}</span>}
                    </p>
                    <p className="mt-1 text-sm">{message.content}</p>
                    {mine && <p className="mt-2 text-[11px] font-semibold opacity-70">Read by {Math.max((message.readBy?.length || 1) - 1, 0)}</p>}
                    {user?.role === 'admin' && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-current/10 pt-2">
                        <input value={moderationReason} onChange={(event) => setModerationReason(event.target.value)} placeholder="Moderation reason" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white/80 px-2 py-1 text-xs text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
                        <button type="button" onClick={() => moderateMessage(message._id, 'flagged')} className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-xs font-bold text-white"><ShieldAlert className="h-3 w-3" /> Flag</button>
                        <button type="button" onClick={() => moderateMessage(message._id, 'hidden')} className="inline-flex items-center gap-1 rounded-lg bg-rose-500 px-2 py-1 text-xs font-bold text-white"><AlertTriangle className="h-3 w-3" /> Hide</button>
                        <button type="button" onClick={() => moderateMessage(message._id, 'visible')} className="rounded-lg bg-emerald-500 px-2 py-1 text-xs font-bold text-white">Restore</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <form onSubmit={sendMessage} className="flex flex-col gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
            {canAnnounce && active?.type === 'classroom' && (
              <div className="flex flex-wrap gap-2">
                <select value={kind} onChange={(event) => setKind(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                  <option value="message">Class message</option>
                  <option value="announcement">Announcement</option>
                </select>
                <select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <input disabled={studentPostingBlocked} value={content} onChange={(event) => setContent(event.target.value)} placeholder={studentPostingBlocked ? 'Posting is disabled by your teacher' : 'Write a message...'} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800" />
              <button disabled={!active || !content.trim() || studentPostingBlocked} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" /> Send</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}