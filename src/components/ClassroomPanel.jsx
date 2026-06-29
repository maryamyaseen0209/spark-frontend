import { useEffect, useMemo, useState } from 'react';
import { Archive, ArrowLeft, BookOpen, Copy, FileText, MessageCircleOff, MessageSquare, Megaphone, Pencil, Plus, RefreshCw, Trash2, UserMinus, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api, getApiErrorMessage } from '../api/client.js';
import FieldError from './FieldError.jsx';
import ResourcePanel from './ResourcePanel.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

const emptyForm = { name: '', subject: '', gradeLevel: '', section: '', academicYear: '', description: '', joinCode: '', studentEmail: '' };

export default function ClassroomPanel({ role }) {
  const navigate = useNavigate();
  const { notifications = [] } = useNotifications() || {};
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const canManage = role === 'teacher' || role === 'admin';

  const activeRooms = useMemo(() => classrooms.filter((room) => room.status === 'active').length, [classrooms]);
  const unreadClassroomIds = useMemo(() => new Set(notifications
    .filter((item) => !item.readAt && item.type === 'message_received' && item.classroom)
    .map((item) => String(item.classroom?._id || item.classroom))), [notifications]);

  const loadClassrooms = () => api.get('/classrooms')
    .then((res) => {
      const rooms = res.data.classrooms || [];
      setClassrooms(rooms);
    })
    .catch((error) => toast.error(getApiErrorMessage(error)));

  useEffect(() => { loadClassrooms(); }, []);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const saveClassroom = async (event) => {
    event.preventDefault();
    const payload = { name: form.name, subject: form.subject, gradeLevel: form.gradeLevel, section: form.section, academicYear: form.academicYear, description: form.description };
    try {
      const res = editingId ? await api.patch(`/classrooms/${editingId}`, payload) : await api.post('/classrooms', payload);
      toast.success(res.data.message || 'Classroom saved.');
      resetForm();
      loadClassrooms();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const joinClassroom = async (event) => {
    event.preventDefault();
    try {
      const res = await api.post('/classrooms/join', { joinCode: form.joinCode });
      toast.success(res.data.message || 'Classroom joined.');
      setForm((current) => ({ ...current, joinCode: '' }));
      loadClassrooms();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const runRoomAction = async (id, action) => {
    setBusyId(id);
    try {
      const res = await action();
      toast.success(res.data.message || 'Classroom updated.');
      loadClassrooms();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (room) => {
    setEditingId(room._id);
    setShowForm(true);
    setForm({ ...emptyForm, name: room.name || '', subject: room.subject || '', gradeLevel: room.gradeLevel || '', section: room.section || '', academicYear: room.academicYear || '', description: room.description || '' });
  };

  const addStudent = async (roomId) => {
    if (!form.studentEmail.trim()) {
      toast.error('Enter an active student email first.');
      return;
    }
    await runRoomAction(roomId, () => api.post(`/classrooms/${roomId}/students`, { email: form.studentEmail }));
    setForm((current) => ({ ...current, studentEmail: '' }));
  };

  const updateCommunication = (room, settings) => runRoomAction(room._id, () => api.patch(`/classrooms/${room._id}`, { communicationSettings: { ...room.communicationSettings, ...settings } }));

  const copy = (code) => {
    navigator.clipboard?.writeText(code);
    toast.success('Join code copied');
  };

  return (
    <section id="classrooms" className="card mt-6 scroll-mt-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Classrooms</h2>
          <p className="mt-2 text-sm text-slate-400">Create classes, manage rosters, join by code, leave classes, and keep enrollment notifications in sync.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-spark-500/10 px-4 py-3 text-sm font-bold text-spark-200"><Users className="h-5 w-5" /> {classrooms.length} total / {activeRooms} active</div>
          {canManage && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }} className="btn-primary gap-2"><Plus className="h-4 w-4" /> Create new class</button>}
        </div>
      </div>

      {canManage && showForm ? (
        <form onSubmit={saveClassroom} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input name="name" value={form.name} onChange={update} className="input" placeholder="Classroom name" required />
          <input name="subject" value={form.subject} onChange={update} className="input" placeholder="Subject" required />
          <input name="gradeLevel" value={form.gradeLevel} onChange={update} className="input" placeholder="Grade level" />
          <input name="section" value={form.section} onChange={update} className="input" placeholder="Section" />
          <input name="academicYear" value={form.academicYear} onChange={update} className="input" placeholder="Academic year" />
          <div className="flex gap-2">
            <button className="btn-primary flex-1 gap-2"><Plus className="h-4 w-4" /> {editingId ? 'Save changes' : 'Create classroom'}</button>
            {editingId && <button type="button" onClick={resetForm} className="btn-secondary px-4">Cancel</button>}
          </div>
          <textarea name="description" value={form.description} onChange={update} className="input md:col-span-2 xl:col-span-3" placeholder="Description" />
        </form>
      ) : !canManage ? (
        <form onSubmit={joinClassroom} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input name="joinCode" value={form.joinCode} onChange={update} className="input uppercase tracking-[0.3em]" placeholder="Enter 6-character code" minLength={6} maxLength={6} required />
          <button className="btn-primary whitespace-nowrap">Join classroom</button>
        </form>
      ) : null}

      {selectedRoomId ? (
        <ClassroomDetail
          busyId={busyId}
          canManage={canManage}
          copy={copy}
          form={form}
          onBack={() => setSelectedRoomId('')}
          room={classrooms.find((room) => room._id === selectedRoomId)}
          role={role}
          update={update}
          addStudent={addStudent}
          startEdit={startEdit}
          runRoomAction={runRoomAction}
          updateCommunication={updateCommunication}
          unreadClassroomIds={unreadClassroomIds}
          navigate={navigate}
        />
      ) : (
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {classrooms.map((room) => (
          <article key={room._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{room.name}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{room.subject} {room.gradeLevel ? `- ${room.gradeLevel}` : ''} {room.section ? `/ ${room.section}` : ''}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${room.status === 'active' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>{room.status}</span>
            </div>

            {room.description && <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{room.description}</p>}
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Teacher: {room.teacher?.fullName || 'Assigned teacher'} <span className="text-slate-500">({room.teacher?.email || 'no email'})</span></p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <code className="rounded-xl bg-slate-100 px-3 py-2 font-bold tracking-[0.3em] text-blue-600 dark:bg-black/30 dark:text-spark-300">{room.joinCode}</code>
              <button type="button" onClick={() => copy(room.joinCode)} className="btn-secondary gap-2 px-3 py-2"><Copy className="h-4 w-4" /> Copy</button>
              <button type="button" onClick={() => setSelectedRoomId(room._id)} className="btn-primary gap-2 px-3 py-2"><BookOpen className="h-4 w-4" /> Open classroom</button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-black/20 dark:text-slate-300"><Users className="mb-2 h-4 w-4 text-blue-500 dark:text-spark-200" /> Students: <strong className="text-slate-900 dark:text-white">{room.students?.length || 0}</strong></div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-black/20 dark:text-slate-300"><BookOpen className="mb-2 h-4 w-4 text-blue-500 dark:text-spark-200" /> Subject: <strong className="text-slate-900 dark:text-white">{room.subject || 'General'}</strong></div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-black/20 dark:text-slate-300"><FileText className="mb-2 h-4 w-4 text-blue-500 dark:text-spark-200" /> Open this classroom for resources, chat, roster, and controls.</div>
            </div>
          </article>
        ))}
        {classrooms.length === 0 && <FieldError message="No classrooms yet. Create or join one to begin." />}
      </div>
      )}
    </section>
  );
}

function ClassroomDetail({ room, role, canManage, busyId, form, update, addStudent, startEdit, runRoomAction, updateCommunication, copy, onBack, unreadClassroomIds, navigate }) {
  if (!room) return <FieldError message="Select a valid classroom from the list." />;

  return <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <button type="button" onClick={onBack} className="btn-secondary mb-4 gap-2 px-3 py-2"><ArrowLeft className="h-4 w-4" /> Back to classrooms</button>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{room.name}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{room.subject} {room.gradeLevel ? `- ${room.gradeLevel}` : ''} {room.section ? `/ ${room.section}` : ''}</p>
        {room.description && <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{room.description}</p>}
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${room.status === 'active' ? 'bg-emerald-400/10 text-emerald-500' : 'bg-amber-400/10 text-amber-500'}`}>{room.status}</span>
    </div>
    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Teacher: {room.teacher?.fullName || 'Assigned teacher'} <span className="text-slate-500">({room.teacher?.email || 'no email'})</span></p>

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <code className="rounded-xl bg-slate-100 px-3 py-2 font-bold tracking-[0.3em] text-blue-600 dark:bg-black/30 dark:text-spark-300">{room.joinCode}</code>
      <button type="button" onClick={() => copy(room.joinCode)} className="btn-secondary gap-2 px-3 py-2"><Copy className="h-4 w-4" /> Copy</button>
      <button type="button" onClick={() => navigate(`/dashboard/messages?classroom=${room._id}`)} className="btn-secondary relative gap-2 px-3 py-2">
        <MessageSquare className="h-4 w-4" /> Chat
        {unreadClassroomIds.has(String(room._id)) && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />}
      </button>
      {canManage && <button disabled={busyId === room._id} type="button" onClick={() => runRoomAction(room._id, () => api.patch(`/classrooms/${room._id}/regenerate-code`))} className="btn-secondary gap-2 px-3 py-2"><RefreshCw className="h-4 w-4" /> New code</button>}
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-black/20 dark:text-slate-300"><Users className="mb-2 h-4 w-4 text-blue-500 dark:text-spark-200" /> Students: <strong className="text-slate-900 dark:text-white">{room.students?.length || 0}</strong></div>
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-black/20 dark:text-slate-300"><BookOpen className="mb-2 h-4 w-4 text-blue-500 dark:text-spark-200" /> Subject: <strong className="text-slate-900 dark:text-white">{room.subject || 'General'}</strong></div>
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-black/20 dark:text-slate-300"><FileText className="mb-2 h-4 w-4 text-blue-500 dark:text-spark-200" /> Resources, chat, roster, and controls are available here.</div>
    </div>

    <ResourcePanel role={role} classroomId={room._id} embedded />

    {canManage ? (
      <div className="mt-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => startEdit(room)} className="btn-secondary gap-2 px-3 py-2"><Pencil className="h-4 w-4" /> Edit</button>
          <button type="button" onClick={() => runRoomAction(room._id, () => api.patch(`/classrooms/${room._id}`, { status: room.status === 'active' ? 'archived' : 'active' }))} className="btn-secondary gap-2 px-3 py-2"><Archive className="h-4 w-4" /> {room.status === 'active' ? 'Archive' : 'Activate'}</button>
          <button type="button" onClick={() => runRoomAction(room._id, () => api.delete(`/classrooms/${room._id}`))} className="btn-secondary gap-2 px-3 py-2 text-rose-500 dark:text-rose-200"><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-black/20">
          <p className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Communication controls</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => updateCommunication(room, { studentMessagingEnabled: !(room.communicationSettings?.studentMessagingEnabled !== false) })} className="btn-secondary gap-2 px-3 py-2"><MessageCircleOff className="h-4 w-4" /> {(room.communicationSettings?.studentMessagingEnabled !== false) ? 'Disable student messages' : 'Enable student messages'}</button>
            <button type="button" onClick={() => updateCommunication(room, { announcementsOnly: !room.communicationSettings?.announcementsOnly })} className="btn-secondary gap-2 px-3 py-2"><Megaphone className="h-4 w-4" /> {room.communicationSettings?.announcementsOnly ? 'Allow discussions' : 'Announcements only'}</button>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-black/20">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input name="studentEmail" value={form.studentEmail} onChange={update} className="input" placeholder="student@email.com" type="email" />
            <button type="button" onClick={() => addStudent(room._id)} className="btn-primary gap-2 whitespace-nowrap"><UserPlus className="h-4 w-4" /> Add student</button>
          </div>
          <div className="mt-4 space-y-2">
            {(room.students || []).map((student) => <div key={student._id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm dark:bg-white/5"><span><strong className="text-slate-900 dark:text-white">{student.fullName}</strong><span className="ml-2 text-slate-500 dark:text-slate-400">{student.email}</span></span><button type="button" onClick={() => runRoomAction(room._id, () => api.delete(`/classrooms/${room._id}/students/${student._id}`))} className="text-rose-500 hover:text-rose-600 dark:text-rose-200 dark:hover:text-rose-100"><UserMinus className="h-4 w-4" /></button></div>)}
            {(!room.students || room.students.length === 0) && <FieldError message="No students enrolled yet." />}
          </div>
        </div>
      </div>
    ) : (
      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-black/20">
        <p className="text-sm text-slate-600 dark:text-slate-300">Roster size: <strong className="text-slate-900 dark:text-white">{room.students?.length || 0}</strong></p>
        <button type="button" onClick={() => runRoomAction(room._id, () => api.post(`/classrooms/${room._id}/leave`))} className="btn-secondary gap-2 px-3 py-2 text-rose-500 dark:text-rose-200"><UserMinus className="h-4 w-4" /> Leave</button>
      </div>
    )}
  </article>;
}
