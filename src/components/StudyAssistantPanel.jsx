import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bot,
  Brain,
  Check,
  Copy,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';

const subjects = [
  'General',
  'Mathematics',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Literature',
  'History',
];

const personas = [
  { id: 'Tutor', label: 'Patient Tutor', desc: 'Step-by-step clear explanations' },
  { id: 'Exam Coach', label: 'Exam Coach', desc: 'High-yield points & test tips' },
  { id: 'Concept Simplifier', label: 'Concept Simplifier', desc: 'Feynman technique & analogies' },
];

const samplePrompts = [
  'Explain Newton\'s Laws of Motion with real-world sports examples.',
  'Show step-by-step how to solve quadratic equations using the quadratic formula.',
  'Explain Big-O notation and why binary search is O(log n).',
  'What were the key causes and long-term effects of the Industrial Revolution?',
  'Give me 3 practice problems on stoichiometry with answer explanations.',
];

export default function StudyAssistantPanel({ role }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'summarizer'
  const [subject, setSubject] = useState('General');
  const [persona, setPersona] = useState('Tutor');

  // Chat State
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hello! I'm **Study SparkAI**, your intelligent academic coach and homework helper.\n\nChoose your **Subject** and **Tutor Style** above, or pick one of the quick prompts below. What topic would you like to master today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Summarizer State
  const [notesInput, setNotesInput] = useState('');
  const [summaryFormat, setSummaryFormat] = useState('bullet_points');
  const [summaryResult, setSummaryResult] = useState('');
  const [summarizerLoading, setSummarizerLoading] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

  // Send Chat Message
  const handleSendMessage = async (customPrompt) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || chatLoading) return;

    const newMessages = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    if (!customPrompt) setInput('');
    setChatLoading(true);

    try {
      const { data } = await api.post('/ai/tutor', {
        question: textToSend,
        subject,
        persona,
        conversationHistory: newMessages.slice(-6),
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to get AI response.'));
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ I encountered an issue generating a response. Please verify that GROQ_API_KEY is configured in backend/.env, or try again in a moment.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Run Summarizer
  const handleSummarize = async () => {
    if (!notesInput.trim() || notesInput.length < 20) {
      toast.error('Please enter at least 20 characters of study notes.');
      return;
    }

    setSummarizerLoading(true);
    try {
      const { data } = await api.post('/ai/summarize', {
        text: notesInput,
        format: summaryFormat,
      });

      setSummaryResult(data.summary);
      toast.success('Summary generated!');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to summarize notes.'));
    } finally {
      setSummarizerLoading(false);
    }
  };

  const copyText = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      if (index !== undefined) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        setSummaryCopied(true);
        setTimeout(() => setSummaryCopied(false), 2000);
      }
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy text.');
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear your current conversation history?')) {
      setMessages([
        {
          role: 'assistant',
          content: 'Conversation cleared! How can I help you next?',
        },
      ]);
    }
  };

  return (
    <section className="mt-6 space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-md ring-1 ring-white/30">
              <Sparkles className="h-8 w-8 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">SparkAI Study Tutor</h2>
                <span className="rounded-full bg-amber-400/20 px-3 py-0.5 text-xs font-black text-amber-200 ring-1 ring-amber-300/40">
                  LLaMA 3.3 70B
                </span>
              </div>
              <p className="mt-1 text-sm text-purple-100 max-w-xl">
                24/7 AI tutor for homework help, step-by-step problem solving, exam prep, and instant revision summaries.
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex rounded-2xl bg-white/10 p-1 backdrop-blur-sm border border-white/20 self-start sm:self-center">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'chat' ? 'bg-white text-purple-900 shadow-md' : 'text-purple-100 hover:text-white'
              }`}
            >
              <MessageSquare className="h-4 w-4" /> AI Study Chat
            </button>
            <button
              onClick={() => setActiveTab('summarizer')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'summarizer' ? 'bg-white text-purple-900 shadow-md' : 'text-purple-100 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" /> Notes Summarizer
            </button>
          </div>
        </div>
      </div>

      {/* CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200/90 dark:bg-slate-900 dark:border-slate-800 space-y-5">
          {/* Controls: Subject & Persona */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject:</span>
              <div className="flex flex-wrap gap-1">
                {subjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSubject(sub)}
                    className={`rounded-xl px-3 py-1 text-xs font-medium transition ${
                      subject === sub
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tutor Style:</span>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} ({p.desc})
                  </option>
                ))}
              </select>

              <button
                onClick={clearChat}
                className="rounded-xl p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="min-h-[380px] max-h-[550px] overflow-y-auto space-y-4 pr-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`group relative max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 rounded-br-none'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-100 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyText(msg.content, index)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition rounded-lg p-1 bg-white/80 dark:bg-slate-800 text-slate-500 hover:text-slate-900 shadow-sm"
                      title="Copy response"
                    >
                      {copiedIndex === index ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white animate-pulse">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-400 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span>SparkAI is thinking and preparing your explanation...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Chips */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Suggested topics to ask:
            </p>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  disabled={chatLoading}
                  onClick={() => handleSendMessage(prompt)}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask any question about ${subject}... (e.g. "Explain this concept step-by-step")`}
              disabled={chatLoading}
              className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
            />
            <button
              type="submit"
              disabled={chatLoading || !input.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>
      )}

      {/* SUMMARIZER TAB */}
      {activeTab === 'summarizer' && (
        <div className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200/90 dark:bg-slate-900 dark:border-slate-800 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Input */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" /> Paste Study Notes or Text
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Paste lecture notes, book chapters, or articles to get smart bullet points, flashcards, or cheat sheets.
                </p>
              </div>

              {/* Format Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Summary Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSummaryFormat('bullet_points')}
                    className={`rounded-xl p-2.5 text-xs font-bold border transition text-center ${
                      summaryFormat === 'bullet_points'
                        ? 'border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200 ring-1 ring-purple-500'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    📌 Key Bullet Points
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryFormat('flashcards')}
                    className={`rounded-xl p-2.5 text-xs font-bold border transition text-center ${
                      summaryFormat === 'flashcards'
                        ? 'border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200 ring-1 ring-purple-500'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    🎴 Q&A Flashcards
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryFormat('cheat_sheet')}
                    className={`rounded-xl p-2.5 text-xs font-bold border transition text-center ${
                      summaryFormat === 'cheat_sheet'
                        ? 'border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200 ring-1 ring-purple-500'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    ⚡ Quick Revision Sheet
                  </button>
                </div>
              </div>

              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Paste your study notes, essay, or lecture transcript here (minimum 20 characters)..."
                rows={9}
                className="w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed shadow-sm"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {notesInput.length} characters entered
                </span>

                <button
                  onClick={handleSummarize}
                  disabled={summarizerLoading || notesInput.trim().length < 20}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {summarizerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  Generate Summary
                </button>
              </div>
            </div>

            {/* Right: Output */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Generated Study Summary
                </h4>

                {summaryResult && (
                  <button
                    onClick={() => copyText(summaryResult)}
                    className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 transition"
                  >
                    {summaryCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{summaryCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              <div className="mt-4 flex-1 overflow-y-auto">
                {summarizerLoading ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    <p className="text-xs">Generating study summary & key takeaways...</p>
                  </div>
                ) : summaryResult ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {summaryResult}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 p-6">
                    <FileText className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-xs font-medium">Your generated summary or flashcards will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
