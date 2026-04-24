'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Sector,
  ComposedChart, Line, Area
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const StatCard = ({ title, value, icon, color, subtitle }: any) => (
  <div className="card" style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '0.5rem', 
    background: 'var(--glass-bg)', 
    border: '1px solid var(--border-color)',
    padding: '1.5rem',
    borderRadius: '24px',
    flex: 1
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="material-icons-round" style={{ fontSize: '1.75rem', color }}>{icon}</span>
    </div>
    <div style={{ marginTop: '0.5rem' }}>
      <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</h4>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{value}</div>
      {subtitle && <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subtitle}</p>}
    </div>
  </div>
);

export default function AdminAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedTech, setSelectedTech] = useState('All');
  const [technologies, setTechnologies] = useState<string[]>(['All']);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completionRate: 0,
    avgScore: 0,
    activeStudents: 0,
    proctoringHealth: 0
  });
  const [batchData, setBatchData] = useState<any[]>([]);
  const [techData, setTechData] = useState<any[]>([]);
  const [rawQuestionData, setRawQuestionData] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [growthLeaders, setGrowthLeaders] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminAnalytics();
  }, []);

  const fetchAdminAnalytics = async () => {
    try {
      setLoading(true);
      
      const { data: assignments } = await supabase
        .from('interview_assignments')
        .select(`
          *,
          interviews(technology, title, mode),
          groups(name),
          students(name, email),
          responses(answer_text, questions(expected_answer, question_text))
        `);

      if (!assignments) return;

      // Extract unique technologies
      const uniqueTechs = ['All', ...Array.from(new Set(assignments.map(a => a.interviews?.technology).filter(Boolean)))];
      setTechnologies(uniqueTechs as string[]);

      const completed = assignments.filter(a => a.status === 'completed');
      const cleanInterviews = completed.filter(a => (a.tab_switches_count || 0) === 0 && (a.face_missing_count || 0) === 0);
      
      const totalScore = completed.reduce((acc, a) => {
        const correct = a.responses?.filter((res: any) => {
          const sAns = (res.answer_text || '').trim().toLowerCase();
          const eAns = (res.questions?.expected_answer || '').trim().toLowerCase();
          return eAns && sAns === eAns;
        }).length || 0;
        const total = a.responses?.length || 1;
        return acc + (correct / total);
      }, 0);

      setStats({
        totalInterviews: assignments.length,
        completionRate: Math.round((completed.length / assignments.length) * 100) || 0,
        avgScore: Math.round((totalScore / completed.length) * 100) || 0,
        activeStudents: new Set(assignments.map(a => a.student_id)).size,
        proctoringHealth: Math.round((cleanInterviews.length / completed.length) * 100) || 0
      });

      // Timeline
      const dayMap: Record<string, { assigned: number, completed: number }> = {};
      const today = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dayMap[dateStr] = { assigned: 0, completed: 0 };
      }
      assignments.forEach(a => {
        const date = a.scheduled_date;
        if (dayMap[date]) {
          dayMap[date].assigned++;
          if (a.status === 'completed') dayMap[date].completed++;
        }
      });
      setTimelineData(Object.entries(dayMap).map(([date, data]) => ({
        date: date.split('-').slice(1).join('/'),
        ...data
      })));

      // Batch Comparison
      const batchMap: Record<string, { total: number, score: number }> = {};
      completed.forEach(a => {
        const name = a.groups?.name || 'Individual';
        if (!batchMap[name]) batchMap[name] = { total: 0, score: 0 };
        const correct = a.responses?.filter((res: any) => {
          const sAns = (res.answer_text || '').trim().toLowerCase();
          const eAns = (res.questions?.expected_answer || '').trim().toLowerCase();
          return eAns && sAns === eAns;
        }).length || 0;
        const total = a.responses?.length || 1;
        batchMap[name].total++;
        batchMap[name].score += (correct / total);
      });
      setBatchData(Object.entries(batchMap).map(([name, data]) => ({
        name,
        avgScore: Math.round((data.score / data.total) * 100),
        count: data.total
      })).sort((a, b) => b.avgScore - a.avgScore));

      // Leaders
      const studentMap: Record<string, { name: string, scores: number[] }> = {};
      completed.forEach(a => {
        const sid = a.student_id;
        if (!studentMap[sid]) studentMap[sid] = { name: a.students?.name || 'Unknown', scores: [] };
        const correct = a.responses?.filter((res: any) => {
          const sAns = (res.answer_text || '').trim().toLowerCase();
          const eAns = (res.questions?.expected_answer || '').trim().toLowerCase();
          return eAns && sAns === eAns;
        }).length || 0;
        const total = a.responses?.length || 1;
        studentMap[sid].scores.push(Math.round((correct / total) * 100));
      });
      const leaders = Object.values(studentMap)
        .filter(s => s.scores.length >= 2)
        .map(s => ({
          name: s.name,
          growth: s.scores[s.scores.length - 1] - s.scores[0],
          latest: s.scores[s.scores.length - 1],
          count: s.scores.length
        }))
        .sort((a, b) => b.growth - a.growth)
        .slice(0, 5);
      setGrowthLeaders(leaders);

      // Tech Chart
      const techMap: Record<string, number> = {};
      assignments.forEach(a => {
        const tech = a.interviews?.technology || 'Other';
        techMap[tech] = (techMap[tech] || 0) + 1;
      });
      setTechData(Object.entries(techMap).map(([name, value]) => ({ name, value })));

      // Question Data (Raw with Tech mapping)
      const qMap: Record<string, { total: number, correct: number, tech: string }> = {};
      completed.forEach(a => {
        const tech = a.interviews?.technology || 'Other';
        a.responses?.forEach((res: any) => {
          const text = res.questions?.question_text;
          if (!text) return;
          if (!qMap[text]) qMap[text] = { total: 0, correct: 0, tech };
          qMap[text].total++;
          const sAns = (res.answer_text || '').trim().toLowerCase();
          const eAns = (res.questions?.expected_answer || '').trim().toLowerCase();
          if (eAns && sAns === eAns) qMap[text].correct++;
        });
      });
      setRawQuestionData(Object.entries(qMap).map(([text, data]) => ({
        text,
        tech: data.tech,
        score: Math.round((data.correct / data.total) * 100),
        total: data.total
      })));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    return rawQuestionData
      .filter(q => (selectedTech === 'All' || q.tech === selectedTech) && q.total >= 3)
      .sort((a, b) => a.score - b.score)
      .slice(0, 8);
  }, [rawQuestionData, selectedTech]);

  if (loading) return <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>;

  return (
    <div className="container" style={{ maxWidth: '1200px', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Advanced <span style={{ color: 'var(--accent-color)' }}>Analytics</span></h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Comprehensive performance insights and operational metrics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard title="Assignments" value={stats.totalInterviews} icon="analytics" color="var(--accent-color)" />
        <StatCard title="Completion" value={`${stats.completionRate}%`} icon="task_alt" color="var(--success)" />
        <StatCard title="Avg Score" value={`${stats.avgScore}%`} icon="trending_up" color="var(--warning)" />
        <StatCard title="Proctor Health" value={`${stats.proctoringHealth}%`} icon="security" color="var(--danger)" subtitle="No incidents detected" />
      </div>

      <div className="card" style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Activity Timeline (Last 14 Days)</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
              <Legend />
              <Area type="monotone" dataKey="assigned" fill="var(--accent-color)" stroke="var(--accent-color)" fillOpacity={0.1} />
              <Bar dataKey="completed" fill="var(--success)" radius={[4, 4, 0, 0]} barSize={20} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Batch Performance Index</h3>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="var(--text-primary)" fontSize={12} width={100} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} />
                <Bar dataKey="avgScore" fill="var(--accent-color)" radius={[0, 8, 8, 0]} barSize={20}>
                  {batchData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card" style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', flex: 1 }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Growth Leaders (Most Improved)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {growthLeaders.length > 0 ? growthLeaders.map((leader, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{leader.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{leader.count} interviews taken</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--success)', fontWeight: 800 }}>+{leader.growth}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current: {leader.latest}%</div>
                  </div>
                </div>
              )) : <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Not enough data yet.</p>}
            </div>
          </div>
          
          <div className="card" style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Tech Popularity</h3>
            <div style={{ height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={techData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                    {techData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottleneck Questions */}
      <div className="card" style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
        <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>Bottleneck Questions (Focus Areas)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Topics with the lowest success rates filtered by technology.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter by Tech:</span>
            <select 
              value={selectedTech} 
              onChange={(e) => setSelectedTech(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {technologies.map(t => <option key={t} value={t} style={{ background: 'var(--bg-secondary)' }}>{t}</option>)}
            </select>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredQuestions.length > 0 ? filteredQuestions.map((q, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '0.75rem', 
              padding: '1.25rem', 
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ 
                  padding: '0.2rem 0.6rem', borderRadius: '8px', 
                  background: q.score < 40 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: q.score < 40 ? 'var(--danger)' : 'var(--warning)',
                  fontWeight: 800, fontSize: '0.75rem'
                }}>
                  {q.score}% Score
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--accent-color)', fontWeight: 700, textTransform: 'uppercase' }}>{q.tech}</div>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: '1.4' }}>
                {q.text.length > 80 ? q.text.substring(0, 80) + '...' : q.text}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{q.total} Attempts</div>
                <div style={{ height: '4px', width: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${q.score}%`, 
                    background: q.score < 40 ? 'var(--danger)' : 'var(--warning)',
                  }} />
                </div>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              No bottleneck data for this technology.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
