import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, Download, Medal, Sparkles, Target, Trophy, TrendingUp, Users } from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';

function ProgressBar({ value, tone = 'blue' }) {
  const tones = { blue: 'from-blue-500 to-indigo-500', green: 'from-emerald-400 to-green-500', amber: 'from-amber-400 to-orange-500' };
  return <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"><div className={`h-2 rounded-full bg-gradient-to-r ${tones[tone]}`} style={{ width: `${Math.min(Number(value) || 0, 100)}%` }} /></div>;
}

export default function AnalyticsPanel({ role, analytics = {} }) {
  const [exportState, setExportState] = useState('');
  const [liveData, setLiveData] = useState({ leaderboard: [], badges: [], report: null });
  const [loadingLiveData, setLoadingLiveData] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingLiveData(true);
    const requests = [api.get('/dashboard/reports/overview')];
    if (role === 'student') requests.push(api.get('/dashboard/leaderboard'), api.get('/dashboard/badges'));
    Promise.all(requests)
      .then(([reportRes, leaderboardRes, badgeRes]) => {
        if (!isMounted) return;
        setLiveData({
          report: reportRes.data.report,
          leaderboard: leaderboardRes?.data?.leaderboard || [],
          badges: badgeRes?.data?.badges || [],
        });
      })
      .catch(() => {
        if (isMounted) setLiveData((current) => ({ ...current, report: null }));
      })
      .finally(() => isMounted && setLoadingLiveData(false));
    return () => { isMounted = false; };
  }, [role]);

  const exportData = async (format = 'json') => {
    try {
      const res = await api.get(`/dashboard/analytics/export?format=${format}`, { responseType: 'blob' });
      if (format === 'csv') {
        downloadBlob(res.data, 'study-sparkai-analytics.csv', 'text/csv');
        setExportState('CSV analytics report downloaded.');
        return;
      }
      if (format === 'pdf') {
        downloadBlob(res.data, 'study-sparkai-analytics.pdf', 'application/pdf');
        setExportState('PDF analytics report downloaded.');
        return;
      }
      downloadBlob(res.data, 'study-sparkai-analytics.json', 'application/json');
      setExportState('JSON analytics report downloaded.');
    } catch (error) {
      setExportState(getApiErrorMessage(error, 'Unable to prepare export.'));
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-700/50 dark:bg-slate-800/90 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-blue-500"><BarChart3 className="h-4 w-4" /> Phase 8 Analytics</p>
          <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Progress, insights, gamification, and reports</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportData('json')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"><Download className="h-4 w-4" /> JSON</button>
          <button onClick={() => exportData('csv')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"><Download className="h-4 w-4" /> CSV</button>
          <button onClick={() => exportData('pdf')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"><Download className="h-4 w-4" /> PDF</button>
        </div>
      </div>
      {exportState && <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">{exportState}</p>}

      {loadingLiveData && <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Refreshing report endpoints...</p>}
      {liveData.report && <ReportSnapshot report={liveData.report} />}
      {role === 'student' && <StudentAnalytics analytics={analytics} liveData={liveData} />}
      {role === 'teacher' && <TeacherAnalytics analytics={analytics} />}
      {role === 'admin' && <AdminAnalytics analytics={analytics} />}
    </section>
  );
}

function StudentAnalytics({ analytics, liveData }) {
  const leaderboard = liveData.leaderboard.length ? liveData.leaderboard : analytics.leaderboard || [];
  const badges = liveData.badges.length ? liveData.badges : analytics.badges || [];
  return <div className="mt-5 grid gap-4 lg:grid-cols-2">
    <Card title="Report Summary" icon={Activity}>{(analytics.reportSummary || []).map((item) => <Metric key={item.label} label={`${item.label} · ${item.status || 'Status'}`} value={item.value} />)}</Card>
    <Card title="Learning Velocity" icon={TrendingUp}><div className="rounded-xl bg-white p-4 dark:bg-slate-800"><p className="text-3xl font-black text-slate-900 dark:text-white">{analytics.learningVelocity?.delta > 0 ? '+' : ''}{analytics.learningVelocity?.delta || 0}%</p><p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{analytics.learningVelocity?.label || 'Not enough attempts'}</p></div></Card>
    <Card title="Subject Performance" icon={Target}>{(analytics.subjectPerformance || []).length ? analytics.subjectPerformance.map((item) => <div key={item.subject} className="mb-3"><div className="flex justify-between text-sm"><span className="font-semibold text-slate-700 dark:text-slate-200">{item.subject}</span><span className="font-black text-slate-900 dark:text-white">{item.averageScore}%</span></div><ProgressBar value={item.averageScore} tone="green" /></div>) : <Empty text="Take quizzes to build subject trends." />}</Card>
    <Card title="Leaderboard" icon={Trophy}>{leaderboard.length ? leaderboard.map((row) => <div key={row.studentId} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0 dark:border-slate-700"><span className="font-bold text-slate-700 dark:text-slate-200">#{row.rank} {row.name}</span><span className="text-slate-500 dark:text-slate-400">{row.averageScore}% avg · {row.points || 0} pts</span></div>) : <Empty text="Leaderboard appears after submitted attempts." />}</Card>
    <Card title="Badges" icon={Medal}>{badges.length ? badges.map((badge) => <div key={badge.name} className="mb-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/40"><div className="flex justify-between text-sm"><span className="font-black text-slate-900 dark:text-white">{badge.name}</span><span className={badge.unlocked ? 'text-emerald-500' : 'text-slate-400'}>{badge.unlocked ? `Unlocked · ${badge.points || 0} pts` : `${badge.progress}/${badge.goal}`}</span></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{badge.description}</p><ProgressBar value={(badge.progress / badge.goal) * 100} tone={badge.unlocked ? 'green' : 'amber'} /></div>) : <Empty text="Badge progress appears after learning activity." />}</Card>
    <Card title="Activity Heatmap" icon={Activity}>{(analytics.activityHeatmap || []).length ? analytics.activityHeatmap.map((day) => <Metric key={day.date} label={`${new Date(day.date).toLocaleDateString()} · ${day.averageScore}% avg`} value={day.attempts} />) : <Empty text="Daily activity appears after submitted attempts." />}</Card>
    <Card title="Recommendations" icon={Sparkles}>{(analytics.recommendations || []).map((text) => <p key={text} className="mb-2 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">{text}</p>)}</Card>
  </div>;
}

function ReportSnapshot({ report }) {
  return <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Report endpoint</p>
        <p className="mt-1 text-sm font-semibold text-blue-900 dark:text-blue-100">Generated {new Date(report.generatedAt).toLocaleString()} · formats: {(report.exportFormats || []).join(', ')}</p>
      </div>
      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700 dark:bg-slate-900 dark:text-blue-300">{report.role}</span>
    </div>
    {!!report.recommendations?.length && <div className="mt-3 grid gap-2 md:grid-cols-2">{report.recommendations.slice(0, 4).map((item) => <p key={item} className="rounded-xl bg-white/80 p-3 text-sm font-semibold text-blue-900 dark:bg-slate-900/60 dark:text-blue-100">{item}</p>)}</div>}
  </div>;
}

function TeacherAnalytics({ analytics }) {
  return <div className="mt-5 grid gap-4 lg:grid-cols-3">
    <Card title="Engagement Summary" icon={Users}>{(analytics.engagementSummary || []).map((item) => <Metric key={item.label} {...item} />)}</Card>
    <Card title="Score Bands" icon={BarChart3}>{(analytics.scoreBands || []).map((band) => <div key={band.label} className="mb-3"><div className="flex justify-between text-sm"><span className="font-semibold text-slate-700 dark:text-slate-200">{band.label}</span><span>{band.count}</span></div><ProgressBar value={band.count * 12} /></div>)}</Card>
    <Card title="Challenging Quizzes" icon={Target}>{(analytics.quizInsights || []).length ? analytics.quizInsights.map((quiz) => <div key={quiz.title} className="mb-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900/40"><p className="font-black text-slate-900 dark:text-white">{quiz.title}</p><p className="text-slate-500 dark:text-slate-400">{quiz.subject} · avg {quiz.averageScore}% · pass {quiz.passRate}%</p></div>) : <Empty text="Publish quizzes to generate insights." />}</Card>
    <Card title="At-Risk Students" icon={AlertTriangle}>{(analytics.atRiskStudents || []).length ? analytics.atRiskStudents.map((student) => <div key={student.studentId} className="mb-3 rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-500/10"><p className="font-black text-slate-900 dark:text-white">{student.name}</p><p className="text-amber-700 dark:text-amber-300">{student.averageScore}% avg · {student.attempts} attempts · {student.risk} risk</p></div>) : <Empty text="No students are currently flagged as at-risk." />}</Card>
    <Card title="Class Trend" icon={TrendingUp}>{(analytics.classTrend || []).length ? analytics.classTrend.map((day) => <Metric key={day.date} label={`${new Date(day.date).toLocaleDateString()} · ${day.averageScore}% avg`} value={day.attempts} />) : <Empty text="Class trend appears after submitted attempts." />}</Card>
    <Card title="AI Smart Insights" icon={Sparkles}>{(analytics.smartInsights || []).map((text) => <p key={text} className="mb-2 rounded-xl bg-violet-50 p-3 text-sm font-semibold text-violet-800 dark:bg-violet-500/10 dark:text-violet-200">{text}</p>)}</Card>
  </div>;
}

function AdminAnalytics({ analytics }) {
  return <div className="mt-5 grid gap-4 lg:grid-cols-2">
    <Card title="Growth Summary" icon={BarChart3}>{(analytics.growthSummary || []).map((item) => <Metric key={item.label} {...item} />)}</Card>
    <Card title="Platform Health" icon={Target}>{(analytics.platformHealth || []).map((item) => <Metric key={item.label} {...item} />)}</Card>
    <Card title="Usage Trend" icon={Activity}>{(analytics.usageTrend || []).map((day) => <Metric key={day.date} label={`${new Date(day.date).toLocaleDateString()} · ${day.quizzes || 0} quizzes`} value={day.attempts} />)}</Card>
    <Card title="Role Growth" icon={Users}>{(analytics.roleGrowth || []).length ? analytics.roleGrowth.map((item) => <Metric key={`${item.role}-${item.date}`} label={`${item.role} · ${new Date(item.date).toLocaleDateString()}`} value={item.count} />) : <Empty text="New account growth appears here." />}</Card>
  </div>;
}

function Card({ title, icon: Icon, children }) { return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-900/40"><h3 className="mb-3 flex items-center gap-2 font-black text-slate-900 dark:text-white"><Icon className="h-4 w-4 text-blue-500" /> {title}</h3>{children}</div>; }
function Metric({ label, value }) { return <div className="mb-3 flex items-center justify-between rounded-xl bg-white p-3 text-sm dark:bg-slate-800"><span className="font-semibold text-slate-500 dark:text-slate-400">{label}</span><span className="text-xl font-black text-slate-900 dark:text-white">{value}</span></div>; }
function Empty({ text }) { return <p className="rounded-xl bg-white p-3 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{text}</p>; }

function downloadBlob(data, filename, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}