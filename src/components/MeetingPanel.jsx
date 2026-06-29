import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, CheckCircle2, ExternalLink, Loader2, Send, Video, XCircle } from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';

const initialForm = {
  title: '',
  description: '',
  classroomId: '',
  startsAt: '',
  durationMinutes: 45,
  provider: 'jitsi',
};

export default function MeetingPanel({ role }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [zoomConnection, setZoomConnection] = useState(null);
  const [form, setForm] = useState(initialForm);

  const canSchedule = role === 'teacher';
  const canManage = ['teacher', 'admin'].includes(role);

  const upcomingMeetings = useMemo(() => meetings.filter((meeting) => meeting.status !== 'cancelled'), [meetings]);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/meetings');
      setMeetings(data.meetings || []);
      setClassrooms(data.classrooms || []);
      setForm((current) => ({ ...current, classroomId: current.classroomId || data.classrooms?.[0]?._id || '' }));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load meetings.'));
    } finally {
      setLoading(false);
    }
  };

  const loadZoomConnection = async () => {
    if (!canSchedule) return;
    try {
      const { data } = await api.get('/meetings/zoom/status');
      setZoomConnection(data.zoom || null);
    } catch (error) {
      setZoomConnection({ configured: false, connected: false, message: getApiErrorMessage(error, 'Unable to load Zoom connection status.') });
    }
  };

  useEffect(() => {
    loadMeetings();
    loadZoomConnection();
  }, []);

  const scheduleMeeting = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/meetings', form);
      toast.success(data.configurationMessage || 'Meeting scheduled.');
      setForm({ ...initialForm, classroomId: classrooms[0]?._id || '' });
      loadMeetings();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to schedule meeting.'));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelMeeting = async (id) => {
    try {
      await api.patch(`/meetings/${id}/cancel`);
      toast.success('Meeting cancelled.');
      loadMeetings();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to cancel meeting.'));
    }
  };

  const sendReminders = async () => {
    try {
      const { data } = await api.post('/meetings/reminders/run');
      toast.success(data.message || 'Reminders sent.');
      loadMeetings();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to send reminders.'));
    }
  };

  return (
    <section className="mt-6 space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Video className="h-8 w-8 text-cyan-100" />
            <div>
              <h2 className="text-2xl font-black">Live Meetings</h2>
              <p className="text-sm text-cyan-50">Schedule Zoom-ready classroom sessions, reminders, and student join links.</p>
            </div>
          </div>
          {canManage && <button onClick={sendReminders} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold ring-1 ring-white/25 transition hover:bg-white/25"><Send className="h-4 w-4" /> Send 24h reminders</button>}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {canSchedule && (
          <form onSubmit={scheduleMeeting} className="rounded-2xl bg-white p-5 shadow-lg dark:bg-slate-800">
            <div className="mb-4 flex items-center gap-2"><CalendarClock className="text-blue-500" /><h3 className="text-lg font-bold text-slate-900 dark:text-white">Schedule Session</h3></div>
            <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${zoomConnection?.connected ? 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200' : 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200'}`}>
              <div>
                <p className="flex items-center gap-2 font-black"><CheckCircle2 className="h-4 w-4" /> {zoomConnection?.connected ? 'Zoom Server-to-Server ready' : 'Zoom Server-to-Server setup required'}</p>
                <p className="mt-1 text-xs font-semibold">{zoomConnection?.message || 'Add Zoom Server-to-Server OAuth credentials in the backend .env file.'}</p>
              </div>
            </div>
            {!zoomConnection?.connected && (
              <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-100">
                <p className="font-black">Admin Zoom setup guide</p>
                <p className="mt-1 text-xs font-semibold">Use a Zoom Server-to-Server OAuth app. No redirect URL, allow list, or teacher browser login is required.</p>
                <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-blue-900 ring-1 ring-blue-100 dark:bg-slate-950/40 dark:text-blue-100 dark:ring-blue-900/50">Set <span className="font-black">ZOOM_ACCOUNT_ID</span>, <span className="font-black">ZOOM_CLIENT_ID</span>, and <span className="font-black">ZOOM_CLIENT_SECRET</span> in backend/.env, then restart the backend.</p>
              </div>
            )}
            <input required value={form.title} onChange={(e) => setForm((value) => ({ ...value, title: e.target.value }))} placeholder="Meeting title" className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            <textarea value={form.description} onChange={(e) => setForm((value) => ({ ...value, description: e.target.value }))} placeholder="Description" rows={3} className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            <select required value={form.classroomId} onChange={(e) => setForm((value) => ({ ...value, classroomId: e.target.value }))} className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              <option value="">Select classroom</option>
              {classrooms.map((classroom) => <option key={classroom._id} value={classroom._id}>{classroom.name} {classroom.subject ? `(${classroom.subject})` : ''}</option>)}
            </select>
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <input required type="datetime-local" value={form.startsAt} onChange={(e) => setForm((value) => ({ ...value, startsAt: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
              <input min="15" max="240" type="number" value={form.durationMinutes} onChange={(e) => setForm((value) => ({ ...value, durationMinutes: Number(e.target.value) }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </div>
            <div className="mb-3">
              <select value={form.provider} onChange={(e) => setForm((value) => ({ ...value, provider: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                <option value="zoom">Zoom Meeting (Requires Setup)</option>
                <option value="jitsi">Jitsi Meet (No Setup Required - Instant Host)</option>
              </select>
            </div>
            
            {form.provider === 'zoom' && (
              <p className="mb-3 rounded-xl bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-200">Provider: Zoom Server-to-Server. Study SparkAI records the teacher as the legal app host and asks Zoom to add the teacher as an alternative host when the teacher is eligible in the Zoom account.</p>
            )}
            {form.provider === 'jitsi' && (
              <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">Provider: Jitsi Meet. Free and requires no account setup. Simply schedule and you can instantly start the meeting as the host.</p>
            )}

            <button disabled={submitting || classrooms.length === 0 || (form.provider === 'zoom' && !zoomConnection?.connected)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />} Schedule meeting</button>
            {classrooms.length === 0 && <p className="mt-3 text-xs text-amber-500">Create or join a classroom before scheduling meetings.</p>}
            {classrooms.length > 0 && form.provider === 'zoom' && !zoomConnection?.connected && <p className="mt-3 text-xs text-amber-500">Zoom scheduling needs Server-to-Server credentials in backend/.env. Teachers remain the legal app host.</p>}
          </form>
        )}

        <div className={`rounded-2xl bg-white p-5 shadow-lg dark:bg-slate-800 ${canSchedule ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Upcoming Sessions</h3>
          {loading ? <p className="text-sm text-slate-500">Loading meetings...</p> : (
            <div className="grid gap-3 md:grid-cols-2">
              {upcomingMeetings.map((meeting) => (
                <article key={meeting._id} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{meeting.title}</p>
                      <p className="text-xs text-slate-500">{meeting.classroom?.name || 'Classroom'} - {new Date(meeting.startsAt).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${meeting.providerStatus === 'configured' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300'}`}>{meeting.providerStatus || meeting.provider}</span>
                  </div>
                  {meeting.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{meeting.description}</p>}
                  <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-200">
                    Legal app host: {meeting.legalHost?.fullName || meeting.host?.fullName || 'Teacher'}{meeting.provider === 'zoom' && meeting.providerMetadata?.teacherHostEmail ? ` - Zoom host: ${meeting.providerMetadata.teacherHostEmail}` : ''}
                  </p>
                  {meeting.providerMetadata?.message && <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">{meeting.providerMetadata.message}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {meeting.launchUrl && <a href={meeting.launchUrl} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${meeting.launchRole === 'host' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}><ExternalLink className="h-3 w-3" /> {meeting.launchRole === 'host' ? 'Start as host' : 'Join as participant'}</a>}
                    {!meeting.launchUrl && <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Zoom configuration required</span>}
                    {meeting.canCancel && <button onClick={() => cancelMeeting(meeting._id)} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-100"><XCircle className="h-3 w-3" /> Cancel</button>}
                  </div>
                </article>
              ))}
              {upcomingMeetings.length === 0 && <p className="text-sm text-slate-500">No upcoming meetings yet.</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}