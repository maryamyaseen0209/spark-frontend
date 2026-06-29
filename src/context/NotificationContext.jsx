import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';

const NotificationContext = createContext(null);
const notificationCache = { userId: null, loadedAt: 0, items: [], unreadCount: 0 };

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const inflightRequest = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const userId = user._id || user.id;
    const cacheIsFresh = notificationCache.userId === userId && Date.now() - notificationCache.loadedAt < 30000;
    if (cacheIsFresh) {
      setNotifications(notificationCache.items);
      setUnreadCount(notificationCache.unreadCount);
      return;
    }
    if (inflightRequest.current) return inflightRequest.current;

    inflightRequest.current = api.get('/notifications');
    try {
      const res = await inflightRequest.current;
      const items = res.data.notifications || [];
      const nextUnreadCount = res.data.unreadCount || 0;
      notificationCache.userId = userId;
      notificationCache.loadedAt = Date.now();
      notificationCache.items = items;
      notificationCache.unreadCount = nextUnreadCount;
      setNotifications(items);
      setUnreadCount(nextUnreadCount);
    } catch (error) {
      if (error?.response?.status !== 429) toast.error(getApiErrorMessage(error, 'Unable to load notifications.'));
    } finally {
      inflightRequest.current = null;
    }
  }, [user]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  useEffect(() => {
    if (!socket) return undefined;
    const onNotification = ({ notification }) => {
      setNotifications((items) => {
        const nextItems = [notification, ...items.filter((item) => item._id !== notification._id)].slice(0, 50);
        notificationCache.items = nextItems;
        return nextItems;
      });
      setUnreadCount((count) => {
        const nextCount = count + 1;
        notificationCache.unreadCount = nextCount;
        return nextCount;
      });
    };
    socket.on('notification:new', onNotification);
    return () => socket.off('notification:new', onNotification);
  }, [socket]);

  const markRead = useCallback(async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    setNotifications((items) => {
      const nextItems = items.map((item) => (item._id === id ? res.data.notification : item));
      notificationCache.items = nextItems;
      return nextItems;
    });
    setUnreadCount((count) => {
      const nextCount = Math.max(0, count - 1);
      notificationCache.unreadCount = nextCount;
      return nextCount;
    });
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((items) => {
      const nextItems = items.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }));
      notificationCache.items = nextItems;
      return nextItems;
    });
    notificationCache.unreadCount = 0;
    setUnreadCount(0);
    await api.patch('/notifications/read-all');
  }, []);

  const unreadByType = useMemo(() => notifications.reduce((counts, item) => {
    if (item.readAt) return counts;
    const type = item.type || '';
    if (type.includes('message')) counts.messages += 1;
    if (type.includes('quiz')) counts.quizzes += 1;
    if (type.includes('meeting')) counts.meetings += 1;
    return counts;
  }, { messages: 0, quizzes: 0, meetings: 0 }), [notifications]);

  const value = useMemo(() => ({ notifications, unreadCount, unreadByType, loadNotifications, markRead, markAllRead }), [notifications, unreadCount, unreadByType, loadNotifications, markRead, markAllRead]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => useContext(NotificationContext);