import { useEffect, useState } from 'react';
import { Check, Copy, FileText, Paperclip, Sparkles, Trash2 } from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';
import FieldError from './FieldError.jsx';
import SystemAlert from './SystemAlert.jsx';

const emptyForm = { topic: '', wordCount: 800, difficulty: 'intermediate', references: false, document: null };

function flattenContent(content) {
  if (!content) return '';
  const body = content.bodySections?.map((section) => `${section.heading}\n${section.body}`).join('\n\n') || '';
  return [content.introduction, body, content.conclusion, ...(content.references || [])].filter(Boolean).join('\n\n');
}

export default function AssignmentPanel({ role }) {
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [response, setResponse] = useState({ type: 'idle', message: '' });

  const loadAssignments = () => {
    api.get('/assignments')
      .then((res) => {
        setAssignments(res.data.assignments || []);
        setResponse({ type: 'success', message: res.data.aiConfigured ? 'AI assignment workspace ready.' : 'Using dev fallback. Add GROQ_API_KEY for live AI.' });
      })
      .catch((error) => setResponse({ type: 'error', message: getApiErrorMessage(error, 'Unable to load assignments.') }));
  };

  useEffect(() => {
    if (role === 'student') loadAssignments();
  }, [role]);

  if (role !== 'student') return null;

  const updateForm = (event) => {
    const { name, value, type, checked, files } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'file' ? files?.[0] || null : type === 'checkbox' ? checked : value }));
  };

  const generateAssignment = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = new FormData();
      payload.append('topic', form.topic);
      payload.append('wordCount', Number(form.wordCount));
      payload.append('difficulty', form.difficulty);
      payload.append('references', String(form.references));
      if (form.document) payload.append('document', form.document);
      const res = await api.post('/assignments/generate', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAssignments((current) => [res.data.assignment, ...current]);
      setForm(emptyForm);
      event.target.reset();
      setResponse({ type: 'success', message: res.data.message });
    } catch (error) {
      setResponse({ type: 'error', message: getApiErrorMessage(error, 'Unable to generate assignment.') });
    } finally {
      setBusy(false);
    }
  };

  const deleteAssignment = async (id) => {
    setBusy(true);
    try {
      const res = await api.delete(`/assignments/${id}`);
      setAssignments((current) => current.filter((assignment) => assignment._id !== id));
      setResponse({ type: 'success', message: res.data.message });
    } catch (error) {
      setResponse({ type: 'error', message: getApiErrorMessage(error, 'Unable to delete assignment.') });
    } finally {
      setBusy(false);
    }
  };

  const copyAssignment = async (assignment) => {
    const text = flattenContent(assignment.content);
    if (!text) {
      setResponse({ type: 'error', message: 'There is no assignment content to copy yet.' });
      return;
    }

    try {
      await navigator.clipboard.writeText(`${assignment.topic}\n\n${text}`);
      setCopiedId(assignment._id);
      setResponse({ type: 'success', message: 'Assignment copied to clipboard.' });
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setResponse({ type: 'error', message: 'Clipboard copy is unavailable in this browser. Please select and copy the text manually.' });
    }
  };

  return (
    <section id="assignments" className="card mt-6 scroll-mt-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">AI Assignment Generator</h2>
          <p className="mt-2 text-sm text-slate-400">Generate, save, review, and manage AI assignment drafts from a topic or uploaded study document.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-spark-500/10 px-4 py-3 text-sm font-bold text-spark-200"><FileText className="h-5 w-5" /> {assignments.length} saved</div>
      </div>

      {response.message && <div className="mt-5"><SystemAlert type={response.type} message={response.message} /></div>}

      <form onSubmit={generateAssignment} className="mt-5 rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/60 p-4 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20">
        <div className="grid gap-3 md:grid-cols-[1fr_150px_180px]">
          <input name="topic" value={form.topic} onChange={updateForm} className="input" placeholder="Assignment topic" required minLength={3} />
          <input name="wordCount" value={form.wordCount} onChange={updateForm} className="input" type="number" min="500" max="2000" step="100" />
          <select name="difficulty" value={form.difficulty} onChange={updateForm} className="input"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>
        </div>
        <label className="mt-3 flex cursor-pointer flex-col gap-2 rounded-2xl border border-slate-300/80 bg-slate-50/90 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2"><Paperclip className="h-4 w-4 text-spark-500" /> Upload PDF, DOCX, TXT, MD, or CSV for source-based AI writing</span>
          <input type="file" name="document" accept=".pdf,.docx,.txt,.md,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*" onChange={updateForm} className="text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-spark-500 file:px-4 file:py-2 file:text-sm file:font-bold file:text-slate-950" />
        </label>
        {form.document && <p className="mt-2 text-xs font-bold text-spark-600 dark:text-spark-200">Selected source: {form.document.name}</p>}
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" name="references" checked={form.references} onChange={updateForm} /> Include references section</label>
        <button disabled={busy} className="btn-primary mt-4 gap-2"><Sparkles className="h-4 w-4" /> {busy ? 'Generating...' : 'Generate assignment'}</button>
      </form>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {assignments.map((assignment) => <article key={assignment._id} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black text-slate-900 dark:text-white">{assignment.topic}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{assignment.wordCount} words - {assignment.difficulty} - {assignment.generationMetadata?.model}</p></div><div className="flex items-center gap-2"><button type="button" disabled={busy} onClick={() => copyAssignment(assignment)} className="btn-secondary px-3 py-2 text-spark-900 dark:text-spark-100" title="Copy assignment">{copiedId === assignment._id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button><button disabled={busy} onClick={() => deleteAssignment(assignment._id)} className="btn-secondary px-3 py-2 text-rose-600 dark:text-rose-200"><Trash2 className="h-4 w-4" /></button></div></div><pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-100/80 p-4 text-sm leading-6 text-slate-700 dark:bg-black/20 dark:text-slate-300">{flattenContent(assignment.content)}</pre></article>)}
        {assignments.length === 0 && <FieldError message="No assignments yet. Generate your first AI draft above." />}
      </div>
    </section>
  );
}