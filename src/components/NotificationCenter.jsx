import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.jsx';

export default function NotificationCenter() {
  const { notifications = [], unreadCount = 0, markRead, markAllRead } = useNotifications() || {};
  const navigate = useNavigate();

  const openNotification = (item) => {
    if (!item.readAt) markRead(item._id);
    if (item.type === 'message_received' || item.type === 'announcement_posted') navigate('/dashboard/messages');
    else if (item.type === 'quiz_published' || item.type === 'quiz_submitted') navigate('/dashboard/quizzes');
    else if (item.type === 'resource_added' || item.type === 'resource_commented') navigate('/dashboard/resources');
    else if (item.classroom) navigate('/dashboard/classrooms');
  };

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-800/90 p-6 shadow-lg border border-slate-200 dark:border-slate-700/50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-500"><Bell className="h-4 w-4" /> Notification Center</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">Realtime alerts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{unreadCount} unread update{unreadCount === 1 ? '' : 's'} from your classrooms and messages.</p>
        </div>
        <button onClick={markAllRead} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600">
          <CheckCheck className="h-4 w-4" /> Mark all read
        </button>
      </div>
      <div className="mt-5 space-y-3">
        {notifications.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">No notifications yet.</p> : notifications.map((item) => (
          <button key={item._id} onClick={() => openNotification(item)} className={`block w-full rounded-xl border p-4 text-left transition ${item.readAt ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800' : 'border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
              </div>
              {!item.readAt && <span className="rounded-full bg-blue-500 px-2 py-1 text-xs font-bold text-white">New</span>}
            </div>
            <p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
          </button>
        ))}
      </div>
    </section>
  );
}