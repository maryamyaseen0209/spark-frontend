import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, FileUp, Play, Save, Send, Trash2 } from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';
import FieldError from './FieldError.jsx';
import SystemAlert from './SystemAlert.jsx';

const generatorDefaults = { title: '', subject: '', classroom: '', durationMinutes: 30, passingScore: 60, totalQuestions: 10, difficulty: 'mixed', questionType: 'multiple-choice', dueAt: '', description: '' };
const secondsLeft = (endsAt) => Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000));
const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export default function QuizPanel({ role }) {
  const [quizzes, setQuizzes] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState(generatorDefaults);
  const [documentFile, setDocumentFile] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [endsAt, setEndsAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [response, setResponse] = useState({ type: 'loading', message: 'Loading quiz workspace...' });
  const canManage = role === 'teacher' || role === 'admin';
  const publishedCount = useMemo(() => quizzes.filter((quiz) => quiz.status === 'published').length, [quizzes]);

  const loadData = () => {
    Promise.all([api.get('/quizzes'), api.get('/classrooms')])
      .then(([quizRes, classroomRes]) => {
        setQuizzes(quizRes.data.quizzes || []);
        setClassrooms(classroomRes.data.classrooms || []);
        setResponse({ type: 'success', message: 'Quiz workspace is ready.' });
      })
      .catch((error) => setResponse({ type: 'error', message: getApiErrorMessage(error) }));
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!endsAt) return undefined;
    const tick = () => setTimeLeft(secondsLeft(endsAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  useEffect(() => {
    if (activeQuiz && endsAt && timeLeft === 0) submitQuiz();
  }, [timeLeft]);

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateQuizField = (field, value) => setEditingQuiz((current) => ({ ...current, [field]: value }));
  const updateQuestion = (questionIndex, field, value) => setEditingQuiz((current) => ({ ...current, questions: current.questions.map((question, index) => (index === questionIndex ? { ...question, [field]: value } : question)) }));
  const updateOption = (questionIndex, optionIndex, value) => setEditingQuiz((current) => ({ ...current, questions: current.questions.map((question, index) => (index === questionIndex ? { ...question, options: question.options.map((option, itemIndex) => (itemIndex === optionIndex ? { ...option, text: value } : option)) } : question)) }));
  const setCorrectOption = (questionIndex, optionIndex) => setEditingQuiz((current) => ({ ...current, questions: current.questions.map((question, index) => (index === questionIndex ? { ...question, options: question.options.map((option, itemIndex) => ({ ...option, isCorrect: itemIndex === optionIndex })) } : question)) }));

  const generateQuiz = async (event) => {
    event.preventDefault();
    if (!documentFile) return setResponse({ type: 'error', message: 'Please upload a PDF, DOCX, TXT, MD, or CSV document.' });
    setBusyId('generate');
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      payload.append('document', documentFile);
      const res = await api.post('/quizzes/generate-from-document', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditingQuiz(res.data.quiz);
      setResponse({ type: 'success', message: res.data.message });
      setForm(generatorDefaults);
      setDocumentFile(null);
      event.target.reset();
      loadData();
    } catch (error) {
      setResponse({ type: 'error', message: getApiErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  };

  const saveDraft = async () => {
    setBusyId(editingQuiz._id);
    try {
      const res = await api.patch(`/quizzes/${editingQuiz._id}`, editingQuiz);
      setEditingQuiz(res.data.quiz);
      setResponse({ type: 'success', message: 'Draft saved. Review it once more before publishing.' });
      loadData();
    } catch (error) {
      setResponse({ type: 'error', message: getApiErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  };

  const runQuizAction = async (id, action) => {
    setBusyId(id);
    try {
      const res = await action();
      setResponse({ type: 'success', message: res.data.message || 'Quiz action completed.' });
      if (editingQuiz?._id === id) setEditingQuiz(null);
      loadData();
    } catch (error) {
      setResponse({ type: 'error', message: getApiErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  };

  const startQuiz = async (quizId) => {
    setBusyId(quizId);
    setResult(null);
    try {
      const res = await api.post(`/quizzes/${quizId}/start`);
      setActiveQuiz(res.data.quiz);
      setEndsAt(res.data.endsAt);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setResponse({ type: 'success', message: 'Quiz started. The timer is running now.' });
    } catch (error) {
      setResponse({ type: 'error', message: getApiErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    try {
      const answerPayload = Object.entries(answers).map(([questionIndex, selectedOptionIndex]) => ({ questionIndex: Number(questionIndex), selectedOptionIndex: Number(selectedOptionIndex) }));
      const res = await api.post(`/quizzes/${activeQuiz._id}/submit`, { answers: answerPayload });
      setResult(res.data);
      setActiveQuiz(null);
      setEndsAt(null);
      setCurrentQuestionIndex(0);
      setResponse({ type: 'success', message: res.data.message });
      loadData();
    } catch (error) {
      setResponse({ type: 'error', message: getApiErrorMessage(error) });
    }
  };

  const loadAnalytics = async (quizId) => {
    setBusyId(quizId);
    try {
      const res = await api.get(`/quizzes/${quizId}/analytics`);
      setAnalytics({ quizId, ...res.data.analytics });
    } catch (error) {
      setResponse({ type: 'error', message: getApiErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section id="quizzes" className="card mt-6 scroll-mt-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">AI Quizzes</h2>
          <p className="mt-2 text-sm text-slate-400">Teachers generate quizzes from documents, preview and edit drafts, then publish timed attempts for students.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-200">{quizzes.length} total / {publishedCount} published</div>
      </div>
      <div className="mt-5"><SystemAlert type={response.type} message={response.message} /></div>

      {canManage && (
        <form onSubmit={generateQuiz} className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/50 dark:shadow-none">
          <div className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white"><FileUp className="h-5 w-5 text-spark-500" /> Generate from document</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input name="title" value={form.title} onChange={updateForm} className="input" placeholder="Quiz title" required />
            <input name="subject" value={form.subject} onChange={updateForm} className="input" placeholder="Subject" required />
            <select name="classroom" value={form.classroom} onChange={updateForm} className="input" required><option value="">Choose classroom</option>{classrooms.map((room) => <option key={room._id} value={room._id}>{room.name}</option>)}</select>
            <input onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} className="input" type="file" accept=".pdf,.docx,.txt,.md,.csv" required />
            <input name="durationMinutes" value={form.durationMinutes} onChange={updateForm} className="input" type="number" min="1" placeholder="Minutes" />
            <input name="passingScore" value={form.passingScore} onChange={updateForm} className="input" type="number" min="0" max="100" placeholder="Pass %" />
            <input name="totalQuestions" value={form.totalQuestions} onChange={updateForm} className="input" type="number" min="1" max="20" placeholder="Questions" />
            <select name="difficulty" value={form.difficulty} onChange={updateForm} className="input"><option value="mixed">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
            <select name="questionType" value={form.questionType} onChange={updateForm} className="input"><option value="multiple-choice">MCQs</option><option value="short-answer">Question/Answer</option><option value="true-false">True/False</option><option value="mixed">Mixed types</option></select>
            <input name="dueAt" value={form.dueAt} onChange={updateForm} className="input" type="datetime-local" title="Submission deadline" />
          </div>
          <textarea name="description" value={form.description} onChange={updateForm} className="input mt-3" placeholder="Optional instructions for students" />
          <button disabled={busyId === 'generate'} className="btn-primary mt-4 gap-2"><FileUp className="h-4 w-4" /> {busyId === 'generate' ? 'Generating with AI...' : 'Generate AI draft'}</button>
        </form>
      )}

      {editingQuiz && canManage && (
        <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-100/80 p-5 dark:bg-amber-400/10">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Teacher preview: {editingQuiz.title}</h3>
          <p className="mt-1 text-sm text-slate-700 dark:text-amber-100">This quiz is still a draft. Edit anything you need before publishing it to students.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2"><input value={editingQuiz.title} onChange={(event) => updateQuizField('title', event.target.value)} className="input" /><input value={editingQuiz.subject} onChange={(event) => updateQuizField('subject', event.target.value)} className="input" /></div>
          <div className="mt-4 space-y-3">{editingQuiz.questions?.map((question, questionIndex) => <div key={questionIndex} className="rounded-2xl bg-white/90 p-4 dark:bg-black/20"><div className="grid gap-3 md:grid-cols-[1fr_150px]"><input value={question.text} onChange={(event) => updateQuestion(questionIndex, 'text', event.target.value)} className="input" /><select value={question.difficulty} onChange={(event) => updateQuestion(questionIndex, 'difficulty', event.target.value)} className="input"><option>easy</option><option>medium</option><option>hard</option></select></div><div className="mt-3 grid gap-2 md:grid-cols-2">{question.options.map((option, optionIndex) => <label key={optionIndex} className="flex items-center gap-2 rounded-xl bg-white/90 p-2 dark:bg-white/5"><input type="radio" checked={option.isCorrect} onChange={() => setCorrectOption(questionIndex, optionIndex)} /><input value={option.text} onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)} className="input py-2" /></label>)}</div><input value={question.explanation || ''} onChange={(event) => updateQuestion(questionIndex, 'explanation', event.target.value)} className="input mt-3" placeholder="Explanation shown after submission" /></div>)}</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3"><input value={editingQuiz.durationMinutes || 30} onChange={(event) => updateQuizField('durationMinutes', event.target.value)} className="input" type="number" min="1" placeholder="Duration minutes" /><input value={editingQuiz.dueAt ? new Date(editingQuiz.dueAt).toISOString().slice(0, 16) : ''} onChange={(event) => updateQuizField('dueAt', event.target.value)} className="input" type="datetime-local" /><select value={editingQuiz.questionType || 'multiple-choice'} onChange={(event) => updateQuizField('questionType', event.target.value)} className="input"><option value="multiple-choice">MCQs</option><option value="short-answer">Question/Answer</option><option value="true-false">True/False</option><option value="mixed">Mixed types</option></select></div>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={saveDraft} disabled={busyId === editingQuiz._id} className="btn-secondary gap-2"><Save className="h-4 w-4" /> Save edits</button><button type="button" disabled={busyId === editingQuiz._id} onClick={() => runQuizAction(editingQuiz._id, () => api.patch(`/quizzes/${editingQuiz._id}/publish`, { dueAt: editingQuiz.dueAt, durationMinutes: editingQuiz.durationMinutes }))} className="btn-primary gap-2"><Send className="h-4 w-4" /> Publish for students</button></div>
        </div>
      )}

      {activeQuiz && (() => {
        const question = activeQuiz.questions[currentQuestionIndex];
        const answeredCount = Object.keys(answers).length;
        const isLastQuestion = currentQuestionIndex === activeQuiz.questions.length - 1;
        return (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-spark-500/30 dark:bg-spark-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-xl font-black text-slate-900 dark:text-white">Taking: {activeQuiz.title}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Question {currentQuestionIndex + 1} of {activeQuiz.questions.length} - {answeredCount} answered. Submit before the timer ends.</p></div><div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100/80 px-4 py-3 text-lg font-black text-slate-900 dark:bg-black/30 dark:text-white"><Clock3 className="h-5 w-5 text-cyan-300" /> {formatTime(timeLeft)}</div></div>
          <div className="mt-4 rounded-full bg-slate-200/80 p-1 dark:bg-black/30"><div className="h-2 rounded-full bg-spark-500 transition-all" style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }} /></div>
          <div className="mt-4 rounded-2xl bg-slate-100/80 p-4 dark:bg-black/20"><p className="font-bold text-slate-900 dark:text-white">{currentQuestionIndex + 1}. {question.text}</p><div className="mt-3 grid gap-2">{question.options.map((option, optionIndex) => <label key={optionIndex} className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-100/80 p-3 text-sm text-slate-900 transition hover:bg-slate-200 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"><input type="radio" name={`question-${currentQuestionIndex}`} checked={answers[currentQuestionIndex] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [currentQuestionIndex]: optionIndex }))} />{option.text}</label>)}</div></div>
          <div className="mt-4 flex flex-wrap justify-between gap-2"><button type="button" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex((current) => Math.max(0, current - 1))} className="btn-secondary">Previous</button><div className="flex flex-wrap gap-2">{!isLastQuestion && <button type="button" onClick={() => setCurrentQuestionIndex((current) => Math.min(activeQuiz.questions.length - 1, current + 1))} className="btn-primary">Next question</button>}{isLastQuestion && <button onClick={submitQuiz} className="btn-primary gap-2"><Send className="h-4 w-4" /> Submit quiz</button>}</div></div>
        </div>
        );
      })()}

      {result && <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-100 p-5 dark:bg-emerald-400/10"><h3 className="text-xl font-black text-slate-900 dark:text-white">Your marks: {result.attempt.correctCount}/{result.attempt.totalQuestions} correct - {result.attempt.score}% ({result.attempt.passed ? 'Passed' : 'Needs review'})</h3><div className="mt-4 space-y-3">{result.quiz.questions.map((question, index) => <div key={index} className="rounded-xl bg-slate-100/90 p-3 text-sm dark:bg-black/20"><p className="font-bold text-slate-900 dark:text-white">{question.text}</p><p className="mt-1 text-slate-500 dark:text-slate-300">Explanation: {question.explanation}</p></div>)}</div></div>}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {quizzes.map((quiz) => <article key={quiz._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-900/60"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black text-slate-900 dark:text-white">{quiz.title} {!canManage && !quiz.latestAttempt && <span className="ml-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-black text-white">New</span>}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{quiz.subject} - {quiz.classroom?.name || 'No classroom'} - {quiz.questions?.length || 0} questions - {quiz.durationMinutes} min{quiz.dueAt ? ` - due ${new Date(quiz.dueAt).toLocaleString()}` : ''}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${quiz.status === 'published' ? 'bg-emerald-400/10 text-emerald-500 dark:text-emerald-300' : 'bg-amber-400/10 text-amber-500 dark:text-amber-300'}`}>{quiz.status}</span></div>{quiz.description && <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{quiz.description}</p>}{quiz.latestAttempt && <p className="mt-3 rounded-xl bg-emerald-100 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">Your marks: {quiz.latestAttempt.score}%</p>}<div className="mt-4 flex flex-wrap gap-2">{canManage ? <><button disabled={busyId === quiz._id || quiz.status === 'published'} onClick={() => setEditingQuiz(quiz)} className="btn-secondary gap-2 px-3 py-2"><CheckCircle2 className="h-4 w-4" /> Preview/Edit</button><button disabled={busyId === quiz._id || quiz.status === 'published'} onClick={() => runQuizAction(quiz._id, () => api.patch(`/quizzes/${quiz._id}/publish`))} className="btn-primary gap-2 px-3 py-2"><Send className="h-4 w-4" /> Publish</button><button disabled={busyId === quiz._id} onClick={() => loadAnalytics(quiz._id)} className="btn-secondary gap-2 px-3 py-2"><BarChart3 className="h-4 w-4" /> Analytics</button><button disabled={busyId === quiz._id} onClick={() => runQuizAction(quiz._id, () => api.delete(`/quizzes/${quiz._id}`))} className="btn-secondary gap-2 px-3 py-2 text-rose-700 dark:text-rose-200"><Trash2 className="h-4 w-4" /> Delete</button></> : <button disabled={busyId === quiz._id || quiz.latestAttempt} onClick={() => startQuiz(quiz._id)} className="btn-primary gap-2 px-3 py-2"><Play className="h-4 w-4" /> {quiz.latestAttempt ? 'Submitted' : 'Start timed quiz'}</button>}</div>{analytics?.quizId === quiz._id && <div className="mt-4 grid gap-2 rounded-xl bg-slate-100/80 p-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200 sm:grid-cols-3"><span>Submissions: <strong>{analytics.submissions}</strong></span><span>Average: <strong>{analytics.averageScore}%</strong></span><span>Passed: <strong>{analytics.passCount}</strong></span></div>}</article>)}
        {quizzes.length === 0 && <FieldError message={canManage ? 'No AI quizzes yet. Upload a document to generate a draft.' : 'No published quizzes are available for your classrooms yet.'} />}
      </div>
    </section>
  );
}
