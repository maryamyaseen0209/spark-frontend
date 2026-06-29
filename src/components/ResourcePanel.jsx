import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileUp, Link as LinkIcon, MessageCircle, Pin, Send, ThumbsUp, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getApiErrorMessage } from '../api/client.js';
import FieldError from './FieldError.jsx';
import SystemAlert from './SystemAlert.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { classroomId: '', title: '', description: '', url: '', tags: '', file: null };
const bytesToSize = (bytes = 0) => {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

export default function ResourcePanel({ role, classroomId = '', embedded = false }) {
  const { socket } = useSocket() || {};
  const { user } = useAuth() || {};
  const [resources, setResources] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState({ ...emptyForm, classroomId });
  const [editForm, setEditForm] = useState({ id: '', title: '', description: '', tags: '' });
  const [commentText, setCommentText] = useState({});
  const [filters, setFilters] = useState({ search: '', type: 'all', classroomId });
  const [busyId, setBusyId] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [response, setResponse] = useState({ type: 'loading', message: 'Loading resources...' });
  const canModerate = role === 'teacher' || role === 'admin';
  const canShare = role === 'teacher';

  const visibleClassrooms = useMemo(() => classrooms.filter((room) => room.status !== 'archived'), [classrooms]);

  const loadResources = () => {
    const params = Object.fromEntries(Object.entries({ ...filters, classroomId: classroomId || filters.classroomId }).filter(([, value]) => value));
    api.get('/resources', { params })
      .then((res) => {
        setResources(res.data.resources || []);
        setResponse({ type: 'success', message: 'Resource library is ready.' });
      })
      .catch((error) => setResponse({ type: 'error', message: getApiErrorMessage(error, 'Unable to load resources.') }));
  };

  useEffect(() => {
    Promise.all([api.get('/classrooms'), api.get('/resources', { params: classroomId ? { classroomId } : {} })])
      .then(([classroomRes, resourceRes]) => {
        setClassrooms(classroomRes.data.classrooms || []);
        setResources(resourceRes.data.resources || []);
        setResponse({ type: 'success', message: 'Resource library is ready.' });
      })
      .catch((error) => setResponse({ type: 'error', message: getApiErrorMessage(error) }));
  }, [classroomId]);

  useEffect(() => {
    const reload = () => loadResources();
    socket?.on('resource:updated', reload);
    return () => socket?.off('resource:updated', reload);
  }, [socket, filters]);

  const updateForm = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({ ...current, [name]: files ? files[0] : value }));
  };

  const shareResource = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries({ ...form, classroomId: classroomId || form.classroomId }).forEach(([key, value]) => { if (value) payload.append(key, value); });
    try {
      setUploadProgress(form.file ? 1 : 0);
      const res = await api.post('/resources', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total));
        },
      });
      setResources((items) => [res.data.resource, ...items]);
      setForm({ ...emptyForm, classroomId });
      setShowCreateForm(false);
      setResponse({ type: 'success', message: res.data.message });
      toast.success(res.data.resource?.storageProvider === 'cloudinary' ? 'Resource uploaded to Cloudinary' : 'Resource shared');
    } catch (error) {
      setResponse({ type: 'error', message: getApiErrorMessage(error) });
    } finally {
      setUploadProgress(0);
    }
  };

  const runResourceAction = async (resource, action) => {
    setBusyId(resource._id);
    try {
      const res = await action();
      if (res.data.resource) setResources((items) => items.map((item) => (item._id === resource._id ? res.data.resource : item)));
      else setResources((items) => items.filter((item) => item._id !== resource._id));
      toast.success(res.data.message || 'Resource updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusyId('');
    }
  };

  const openResource = async (resource, kind = 'preview') => {
    const { data } = await api.post(`/resources/${resource._id}/view`, { kind }).catch(() => ({ data: null }));
    if (data?.resource) setResources((items) => items.map((item) => (item._id === resource._id ? data.resource : item)));
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const addComment = async (resource) => {
    const body = (commentText[resource._id] || '').trim();
    if (!body) return;
    await runResourceAction(resource, () => api.post(`/resources/${resource._id}/comments`, { body }));
    setCommentText((items) => ({ ...items, [resource._id]: '' }));
  };

  const deleteResource = (resource) => {
    const confirmed = window.confirm(`Delete "${resource.title}" from this classroom resource library?`);
    if (!confirmed) return;
    runResourceAction(resource, () => api.delete(`/resources/${resource._id}`));
  };

  const canEditResource = (resource) => canModerate || resource.uploadedBy?._id === user?._id;

  const startEditing = (resource) => {
    setEditForm({ id: resource._id, title: resource.title || '', description: resource.description || '', tags: (resource.tags || []).join(', ') });
  };

  const saveResourceEdit = (resource) => {
    runResourceAction(resource, () => api.patch(`/resources/${resource._id}`, {
      title: editForm.title,
      description: editForm.description,
      tags: editForm.tags,
    }));
    setEditForm({ id: '', title: '', description: '', tags: '' });
  };

  return (
    <section id={embedded ? undefined : 'resources'} className={embedded ? 'mt-4 rounded-2xl bg-black/20 p-4' : 'card mt-6 scroll-mt-24'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className={embedded ? 'text-lg font-black text-white' : 'section-title'}>{embedded ? 'Classroom resources' : 'Resources'}</h2>
          <p className="mt-2 text-sm text-slate-400">{canShare ? 'Share classroom files and links, track previews/downloads, and collaborate with moderated comments.' : 'View teacher-shared classroom files and links, then collaborate in comments.'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-2xl bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-200">{resources.length} shared</div>
          {canShare && <button type="button" onClick={() => setShowCreateForm((open) => !open)} className="btn-primary gap-2"><FileUp className="h-4 w-4" /> {showCreateForm ? 'Close form' : 'Create resource'}</button>}
        </div>
      </div>
      <div className="mt-5"><SystemAlert type={response.type} message={response.message} /></div>

      {canShare && showCreateForm && <form onSubmit={shareResource} className="mt-5 grid gap-3 rounded-2xl bg-black/20 p-4 md:grid-cols-2 xl:grid-cols-3">
        {!classroomId && <select name="classroomId" value={form.classroomId} onChange={updateForm} className="input" required><option value="">Choose classroom</option>{visibleClassrooms.map((room) => <option key={room._id} value={room._id}>{room.name}</option>)}</select>}
        <input name="title" value={form.title} onChange={updateForm} className="input" placeholder="Resource title" required />
        <input name="tags" value={form.tags} onChange={updateForm} className="input" placeholder="Tags: algebra, exam" />
        <input name="url" value={form.url} onChange={updateForm} className="input" placeholder="Optional link URL" />
        <input name="file" onChange={updateForm} className="input" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp,.mp4" />
        <button className="btn-primary gap-2"><FileUp className="h-4 w-4" /> Share resource</button>
        {form.file && <p className="text-xs font-bold text-cyan-200 md:col-span-2 xl:col-span-3">Selected for Cloudinary/local upload: {form.file.name} {bytesToSize(form.file.size) && `(${bytesToSize(form.file.size)})`}</p>}
        {uploadProgress > 0 && <div className="h-2 overflow-hidden rounded-full bg-white/10 md:col-span-2 xl:col-span-3"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${uploadProgress}%` }} /></div>}
        <textarea name="description" value={form.description} onChange={updateForm} className="input md:col-span-2 xl:col-span-3" placeholder="Describe how students should use this resource" />
      </form>}

      {!embedded && <div className="mt-5 grid gap-3 md:grid-cols-3">
        <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} className="input" placeholder="Search resources" />
        <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} className="input"><option value="all">All types</option><option value="document">Documents</option><option value="image">Images</option><option value="video">Videos</option><option value="link">Links</option></select>
        <button type="button" onClick={loadResources} className="btn-secondary">Apply filters</button>
      </div>}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {resources.map((resource) => (
          <article key={resource._id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="text-xl font-black text-white">{resource.pinned && <Pin className="mr-2 inline h-4 w-4 text-amber-300" />}{resource.title}</h3><p className="mt-1 text-sm text-slate-400">{resource.classroom?.name} - {resource.type} - shared by {resource.uploadedBy?.fullName || 'User'}</p>{resource.originalName && <p className="mt-1 text-xs text-slate-500">{resource.originalName} {bytesToSize(resource.size) && `- ${bytesToSize(resource.size)}`}</p>}</div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${resource.storageProvider === 'cloudinary' ? 'bg-cyan-500/15 text-cyan-200' : 'bg-white/10 text-slate-200'}`}>{resource.storageProvider}</span>
            </div>
            {resource.description && <p className="mt-3 text-sm leading-6 text-slate-300">{resource.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">{(resource.tags || []).map((tag) => <span key={tag} className="rounded-full bg-white/10 px-2 py-1">#{tag}</span>)}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => openResource(resource)} className="btn-secondary gap-2 px-3 py-2"><Eye className="h-4 w-4" /> Preview ({resource.previewCount || 0})</button>
              <button type="button" onClick={() => openResource(resource, 'download')} className="btn-secondary gap-2 px-3 py-2"><Download className="h-4 w-4" /> Download ({resource.downloads || 0})</button>
              {resource.storageProvider === 'external' && <LinkIcon className="mt-2 h-4 w-4 text-spark-200" />}
              {canEditResource(resource) && <button disabled={busyId === resource._id} onClick={() => startEditing(resource)} className="btn-secondary gap-2 px-3 py-2">Edit details</button>}
              {canModerate && <button disabled={busyId === resource._id} onClick={() => runResourceAction(resource, () => api.patch(`/resources/${resource._id}`, { pinned: !resource.pinned }))} className="btn-secondary gap-2 px-3 py-2"><Pin className="h-4 w-4" /> {resource.pinned ? 'Unpin' : 'Pin'}</button>}
              {canModerate && <button disabled={busyId === resource._id} onClick={() => runResourceAction(resource, () => api.patch(`/resources/${resource._id}`, { commentsEnabled: !resource.commentsEnabled }))} className="btn-secondary gap-2 px-3 py-2"><MessageCircle className="h-4 w-4" /> {resource.commentsEnabled ? 'Disable comments' : 'Enable comments'}</button>}
              {canModerate && <button disabled={busyId === resource._id} onClick={() => deleteResource(resource)} className="btn-secondary gap-2 px-3 py-2 text-rose-200"><Trash2 className="h-4 w-4" /> Delete</button>}
            </div>
            {editForm.id === resource._id && <div className="mt-4 grid gap-3 rounded-2xl bg-black/20 p-4">
              <input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} className="input" placeholder="Resource title" />
              <input value={editForm.tags} onChange={(event) => setEditForm((current) => ({ ...current, tags: event.target.value }))} className="input" placeholder="Tags separated by commas" />
              <textarea value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} className="input" placeholder="Description" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => saveResourceEdit(resource)} className="btn-primary px-4 py-2">Save details</button>
                <button type="button" onClick={() => setEditForm({ id: '', title: '', description: '', tags: '' })} className="btn-secondary px-4 py-2">Cancel</button>
              </div>
            </div>}
            <div className="mt-5 rounded-2xl bg-black/20 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><MessageCircle className="h-4 w-4" /> Comments</p>
              <div className="space-y-2">{(resource.comments || []).filter((comment) => !comment.deletedAt).sort((a, b) => Number(b.pinned) - Number(a.pinned)).slice(-6).map((comment) => <div key={comment._id} className="rounded-xl bg-white/5 p-3 text-sm"><p className="font-bold text-white">{comment.author?.fullName || 'User'} {comment.pinned && <span className="text-amber-300">Pinned</span>}</p><p className="mt-1 text-slate-300">{comment.moderated ? 'Hidden by moderator' : comment.body}</p><div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400"><button onClick={() => runResourceAction(resource, () => api.patch(`/resources/${resource._id}/comments/${comment._id}`, { action: 'upvote' }))} className="inline-flex items-center gap-1 hover:text-white"><ThumbsUp className="h-3 w-3" /> {comment.upvotes?.length || 0}</button>{canModerate && <button onClick={() => runResourceAction(resource, () => api.patch(`/resources/${resource._id}/comments/${comment._id}`, { action: 'pin' }))}>{comment.pinned ? 'Unpin' : 'Pin'}</button>}{canModerate && <button onClick={() => runResourceAction(resource, () => api.patch(`/resources/${resource._id}/comments/${comment._id}`, { action: 'moderate' }))}>Disable</button>}{(canModerate || comment.author?._id === user?._id) && <button onClick={() => runResourceAction(resource, () => api.patch(`/resources/${resource._id}/comments/${comment._id}`, { action: 'delete' }))} className="text-rose-200">Delete</button>}</div></div>)}</div>
              {resource.commentsEnabled ? <div className="mt-3 flex gap-2"><input value={commentText[resource._id] || ''} onChange={(event) => setCommentText((items) => ({ ...items, [resource._id]: event.target.value }))} className="input" placeholder="Add a comment" /><button type="button" onClick={() => addComment(resource)} className="btn-primary px-3"><Send className="h-4 w-4" /></button></div> : <FieldError message="Comments are off for this resource." />}
            </div>
          </article>
        ))}
        {resources.length === 0 && <FieldError message={canShare ? 'No resources yet. Share a link or upload a file for this classroom.' : 'No teacher-shared resources are available in this classroom yet.'} />}
      </div>
    </section>
  );
}