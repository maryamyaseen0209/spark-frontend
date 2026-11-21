import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  Radio,
  Send,
  Sparkles,
  Users,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';

const initialForm = {
  title: '',
  description: '',
  classroomId: '',
  startsAt: '',
  durationMinutes: 45,
  provider: 'jitsi',
  customUrl: '',
};

export default function MeetingPanel({ role }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [zoomConnection, setZoomConnection] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [filter, setFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [activeInAppMeeting, setActiveInAppMeeting] = useState(null);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);

  const canSchedule = role === 'teacher';
  const canManage = ['teacher', 'admin'].includes(role);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/meetings');
      setMeetings(data.meetings || []);
      setClassrooms(data.classrooms || []);
      setForm((current) => ({
        ...current,
        classroomId: current.classroomId || data.classrooms?.[0]?._id || '',
      }));
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
      setZoomConnection({
        configured: false,
        connected: false,
        message: getApiErrorMessage(error, 'Unable to load Zoom connection status.'),
      });
    }
  };

  useEffect(() => {
    loadMeetings();
    loadZoomConnection();
  }, []);

  const filteredMeetings = useMemo(() => {
    const active = meetings.filter((m) => m.status !== 'cancelled');
    if (filter === 'live') return active.filter((m) => m.isLive);
    if (filter === 'upcoming') return active.filter((m) => !m.isPast && !m.isLive);
    if (filter === 'past') return active.filter((m) => m.isPast);
    return active;
  }, [meetings, filter]);

  const liveMeetingsCount = useMemo(() => meetings.filter((m) => m.status !== 'cancelled' && m.isLive).length, [meetings]);

  const scheduleMeeting = async (event) => {
    event.preventDefault();
    if (form.provider === 'google_meet' || form.provider === 'teams' || form.provider === 'custom') {
      if (!form.customUrl || !/^https?:\/\//i.test(form.customUrl.trim())) {
        toast.error('Please enter a valid meeting URL starting with http:// or https://');
        return;
      }
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/meetings', form);
      toast.success(data.configurationMessage || 'Meeting scheduled successfully!');
      setForm({ ...initialForm, classroomId: classrooms[0]?._id || '' });
      loadMeetings();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to schedule meeting.'));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelMeeting = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this meeting?')) return;
    try {
      await api.patch(`/meetings/${id}/cancel`);
      toast.success('Meeting cancelled.');
      if (activeInAppMeeting?._id === id) setActiveInAppMeeting(null);
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

  const copyMeetingLink = async (meeting) => {
    const url = meeting.launchUrl || meeting.joinUrl;
    if (!url) {
      toast.error('No meeting link available.');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(meeting._id);
      toast.success('Meeting link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy. Please copy link manually.');
    }
  };

  const getProviderBadge = (provider) => {
    switch (provider) {
      case 'jitsi':
        return { label: 'Jitsi Meet (HD)', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' };
      case 'google_meet':
        return { label: 'Google Meet', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800' };
      case 'teams':
        return { label: 'MS Teams', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800' };
      case 'zoom':
        return { label: 'Zoom Session', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800' };
      default:
        return { label: 'Custom Video Room', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800' };
    }
  };

  return (
    <section className="mt-6 space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-500 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-md ring-1 ring-white/30">
              <Video className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Live Classrooms & Video Meetings</h2>
                {liveMeetingsCount > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-0.5 text-xs font-bold text-white shadow-lg animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-white"></span>
                    {liveMeetingsCount} LIVE NOW
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-cyan-100 max-w-xl">
                Instant interactive video classrooms with screen sharing, tile view, and audio. Join directly inside StudySparkAI or in a new window.
              </p>
            </div>
          </div>
          {canManage && (
            <button
              onClick={sendReminders}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-bold ring-1 ring-white/30 transition hover:bg-white/25 backdrop-blur-sm shrink-0"
            >
              <Send className="h-4 w-4" /> Send 24h reminders
            </button>
          )}
        </div>
      </div>

      {/* Embedded In-App Meeting Modal */}
      {activeInAppMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4">
          <div className={`flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden transition-all duration-300 ${isIframeFullscreen ? 'fixed inset-2 z-50' : 'w-full max-w-6xl h-[88vh]'}`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">{activeInAppMeeting.title}</h3>
                  <p className="text-xs text-slate-400">{activeInAppMeeting.classroom?.name || 'Live Classroom Session'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyMeetingLink(activeInAppMeeting)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                  title="Copy link"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copy Link</span>
                </button>
                <a
                  href={activeInAppMeeting.launchUrl || activeInAppMeeting.joinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                  title="Open in new window"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open in Tab</span>
                </a>
                <button
                  onClick={() => setIsIframeFullscreen(!isIframeFullscreen)}
                  className="rounded-xl bg-slate-800 p-2 text-slate-200 hover:bg-slate-700 transition"
                  title={isIframeFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isIframeFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setActiveInAppMeeting(null)}
                  className="rounded-xl bg-red-500/20 p-2 text-red-400 hover:bg-red-500 hover:text-white transition"
                  title="Leave classroom"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Embedded Live Video Frame */}
            <div className="relative flex-1 bg-black">
              <iframe
                src={activeInAppMeeting.embeddedUrl || activeInAppMeeting.joinUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                className="w-full h-full border-0"
                title="Live Classroom Session"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Scheduler + List */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Schedule Meeting Form */}
        {canSchedule && (
          <form onSubmit={scheduleMeeting} className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200/90 dark:bg-slate-900 dark:border-slate-800">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Schedule Live Session</h3>
              </div>
            </div>

            {/* Provider Tabs / Selector */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Choose Video Platform
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm((v) => ({ ...v, provider: 'jitsi' }))}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                    form.provider === 'jitsi'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> Jitsi Meet
                  </span>
                  <span className="mt-1 text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                    Instant & In-App (No setup needed)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm((v) => ({ ...v, provider: 'google_meet' }))}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                    form.provider === 'google_meet'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <Video className="h-3.5 w-3.5 text-blue-500" /> Google Meet
                  </span>
                  <span className="mt-1 text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                    Paste meeting link
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm((v) => ({ ...v, provider: 'teams' }))}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                    form.provider === 'teams'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <Radio className="h-3.5 w-3.5 text-indigo-500" /> Teams / Custom
                  </span>
                  <span className="mt-1 text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                    Custom meeting link
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm((v) => ({ ...v, provider: 'zoom' }))}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                    form.provider === 'zoom'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${zoomConnection?.connected ? 'text-emerald-500' : 'text-amber-500'}`} /> Zoom
                  </span>
                  <span className="mt-1 text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                    {zoomConnection?.connected ? 'Server OAuth Ready' : 'Optional Setup'}
                  </span>
                </button>
              </div>
            </div>

            {/* Provider-specific info / input */}
            {form.provider === 'jitsi' && (
              <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant Live Video Classroom
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  Zero setup required. Unlimited duration, high-definition video, screen share, tile view, and interactive classroom experience right in your app.
                </p>
              </div>
            )}

            {(form.provider === 'google_meet' || form.provider === 'teams' || form.provider === 'custom') && (
              <div className="mb-4">
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {form.provider === 'google_meet' ? 'Google Meet URL' : 'Meeting URL'}
                </label>
                <input
                  required
                  type="url"
                  value={form.customUrl}
                  onChange={(e) => setForm((v) => ({ ...v, customUrl: e.target.value }))}
                  placeholder={form.provider === 'google_meet' ? 'https://meet.google.com/abc-defg-hij' : 'https://teams.microsoft.com/...'}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {form.provider === 'zoom' && (
              <div className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3.5 text-xs text-cyan-900 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-200">
                <p className="font-bold">Zoom Server-to-Server OAuth</p>
                <p className="mt-1">
                  {zoomConnection?.connected
                    ? 'Zoom Server-to-Server is configured. StudySparkAI will automatically create your Zoom session.'
                    : 'Zoom credentials in backend/.env are optional. If unconfigured, StudySparkAI automatically provides an instant Jitsi classroom so your class never fails.'}
                </p>
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Session Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
                  placeholder="e.g. Weekly Review & Problem Solving"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Classroom</label>
                <select
                  required
                  value={form.classroomId}
                  onChange={(e) => setForm((v) => ({ ...v, classroomId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select classroom</option>
                  {classrooms.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.subject ? `(${c.subject})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm((v) => ({ ...v, startsAt: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Duration (mins)</label>
                  <input
                    min="15"
                    max="240"
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) => setForm((v) => ({ ...v, durationMinutes: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Description / Agenda (Optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
                  placeholder="Topics to cover, homework questions to review..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || classrooms.length === 0}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Schedule Live Session
              </button>

              {classrooms.length === 0 && (
                <p className="text-center text-xs text-amber-500">Create or join a classroom before scheduling sessions.</p>
              )}
            </div>
          </form>
        )}

        {/* Sessions List */}
        <div className={`rounded-3xl bg-white p-6 shadow-xl border border-slate-200/90 dark:bg-slate-900 dark:border-slate-800 ${canSchedule ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Classroom Sessions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Join upcoming meetings, view agendas, and review past classes.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900/60 text-xs font-semibold">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-xl px-3 py-1.5 transition ${filter === 'all' ? 'bg-white shadow text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('live')}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 transition ${filter === 'live' ? 'bg-white shadow text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}
              >
                <span className="h-2 w-2 rounded-full bg-red-500"></span> Live Now
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`rounded-xl px-3 py-1.5 transition ${filter === 'upcoming' ? 'bg-white shadow text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`rounded-xl px-3 py-1.5 transition ${filter === 'past' ? 'bg-white shadow text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}`}
              >
                Past
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-slate-500">Loading scheduled meetings...</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredMeetings.map((meeting) => {
                const badge = getProviderBadge(meeting.provider);
                const startDate = new Date(meeting.startsAt);
                return (
                  <article
                    key={meeting._id}
                    className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                      meeting.isLive
                        ? 'border-red-300 bg-red-50/20 shadow-md ring-1 ring-red-400/30 dark:border-red-900/40 dark:bg-red-950/10'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${badge.color}`}>
                              {badge.label}
                            </span>
                            {meeting.isLive && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-sm animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-white"></span> Happening Now
                              </span>
                            )}
                            {meeting.isPast && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                Completed
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">{meeting.title}</h4>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <p className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <Users className="h-3.5 w-3.5 text-blue-500" />
                          <span>{meeting.classroom?.name || 'Classroom'}</span>
                          {meeting.classroom?.subject && <span className="text-slate-400">({meeting.classroom.subject})</span>}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-slate-400">({meeting.durationMinutes} min)</span>
                        </p>
                      </div>

                      {meeting.description && (
                        <p className="mt-3 line-clamp-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                          {meeting.description}
                        </p>
                      )}

                      <div className="mt-3 text-[11px] text-slate-400">
                        Host: <span className="font-semibold text-slate-600 dark:text-slate-300">{meeting.legalHost?.fullName || meeting.host?.fullName || 'Teacher'}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Jitsi In-App Live Video Join */}
                        {meeting.provider === 'jitsi' && meeting.embeddedUrl && !meeting.isPast && (
                          <button
                            onClick={() => setActiveInAppMeeting(meeting)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:from-emerald-600 hover:to-teal-700 transition"
                          >
                            <Play className="h-3 w-3 fill-current" /> Join Live in App
                          </button>
                        )}

                        {/* Open in Tab */}
                        {meeting.launchUrl && (
                          <a
                            href={meeting.launchUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              meeting.provider === 'jitsi'
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                            }`}
                          >
                            <ExternalLink className="h-3 w-3" />
                            {meeting.provider === 'jitsi' ? 'Open in Tab' : meeting.launchRole === 'host' ? 'Start as Host' : 'Join Meeting'}
                          </a>
                        )}

                        {/* Copy Link Button */}
                        <button
                          onClick={() => copyMeetingLink(meeting)}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                          title="Copy meeting link"
                        >
                          {copiedId === meeting._id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {/* Cancel Button */}
                      {meeting.canCancel && !meeting.isPast && (
                        <button
                          onClick={() => cancelMeeting(meeting._id)}
                          className="inline-flex items-center gap-1 rounded-xl p-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                          title="Cancel meeting"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}

              {filteredMeetings.length === 0 && (
                <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                  <Video className="mx-auto h-8 w-8 text-slate-400 mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No sessions found for this filter.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {canSchedule ? 'Schedule a new live classroom session using the form on the left.' : 'Your teachers have not scheduled any sessions matching this filter yet.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
