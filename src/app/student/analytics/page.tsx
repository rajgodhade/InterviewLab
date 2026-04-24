'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend
} from 'recharts';

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="card" style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '0.5rem', 
    background: 'var(--glass-bg)', 
    backdropFilter: 'blur(10px)',
    border: '1px solid var(--border-color)',
    padding: '1.5rem',
    borderRadius: '20px',
    flex: 1
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="material-icons-round" style={{ fontSize: '1.75rem', color: color || 'var(--accent-color)' }}>{icon}</span>
    </div>
    <div style={{ marginTop: '0.5rem' }}>
      <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</h4>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: color || 'var(--text-primary)', marginTop: '0.25rem' }}>{value}</div>
    </div>
  </div>
);

export default function StudentAnalytics() {
  const router = useRouter();
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem('student_email');
    if (!email) {
      router.push('/student');
      return;
    }
    fetchData(email);
  }, [router]);

  const fetchData = async (email: string) => {
    try {
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .single();

      if (!student) throw new Error('Student not found');
      setStudentInfo(student);

      const { data: assignmentData } = await supabase
        .from('interview_assignments')
        .select(`
          *,
          interviews(*),
          responses (
            id,
            answer_text,
            questions (
              id,
              expected_answer,
              question_type
            )
          )
        `)
        .eq('student_id', student.id)
        .order('scheduled_date', { ascending: true });

      setAssignments(assignmentData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Radar Data (Proficiency by Technology)
  const radarData = useMemo(() => {
    const techScores: Record<string, { total: number, correct: number }> = {};
    assignments.filter(a => a.status === 'completed').forEach(a => {
      const tech = a.interviews?.technology || 'Other';
      if (!techScores[tech]) techScores[tech] = { total: 0, correct: 0 };
      
      a.responses?.forEach((res: any) => {
        techScores[tech].total++;
        const sAns = (res.answer_text || '').trim().toLowerCase();
        const eAns = (res.questions?.expected_answer || '').trim().toLowerCase();
        if (eAns && sAns === eAns) techScores[tech].correct++;
      });
    });

    return Object.entries(techScores).map(([subject, data]) => ({
      subject,
      A: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      fullMark: 100
    })).slice(0, 6); // Top 6 for visual clarity
  }, [assignments]);

  // 2. Growth Data (Score over time)
  const growthData = useMemo(() => {
    return assignments
      .filter(a => a.status === 'completed')
      .map((a, i) => {
        const correct = a.responses?.reduce((acc: number, res: any) => {
          const sAns = (res.answer_text || '').trim().toLowerCase();
          const eAns = (res.questions?.expected_answer || '').trim().toLowerCase();
          return (eAns && sAns === eAns) ? acc + 1 : acc;
        }, 0) || 0;
        const total = a.responses?.length || 1;
        return {
          date: a.scheduled_date,
          score: Math.round((correct / total) * 100)
        };
      });
  }, [assignments]);

  // 3. Question Type Analysis
  const typeData = useMemo(() => {
    const types: Record<string, { total: number, correct: number }> = {};
    assignments.filter(a => a.status === 'completed').forEach(a => {
      a.responses?.forEach((res: any) => {
        const type = res.questions?.question_type || 'other';
        if (!types[type]) types[type] = { total: 0, correct: 0 };
        types[type].total++;
        const sAns = (res.answer_text || '').trim().toLowerCase();
        const eAns = (res.questions?.expected_answer || '').trim().toLowerCase();
        if (eAns && sAns === eAns) types[type].correct++;
      });
    });

    return Object.entries(types).map(([name, data]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
    }));
  }, [assignments]);

  if (loading) return <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>;

  const avgScore = growthData.length > 0 
    ? Math.round(growthData.reduce((acc, curr) => acc + curr.score, 0) / growthData.length)
    : 0;

  return (
    <div className="container" style={{ maxWidth: '1200px', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Performance <span style={{ color: 'var(--accent-color)' }}>Analytics</span></h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Deep dive into your interview performance and skill growth.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard title="Overall Proficiency" value={`${avgScore}%`} icon="stars" color="var(--accent-color)" />
        <StatCard title="Interviews Taken" value={growthData.length} icon="assignment_turned_in" color="var(--success)" />
        <StatCard title="Best Technology" value={radarData.length > 0 ? radarData.sort((a, b) => b.A - a.A)[0].subject : 'N/A'} icon="emoji_events" color="var(--warning)" />
        <StatCard title="Focus Area" value={radarData.length > 0 ? radarData.sort((a, b) => a.A - b.A)[0].subject : 'N/A'} icon="biotech" color="var(--danger)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Radar Chart */}
        <div className="card" style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Skill Proficiency Radar</h3>
          <div style={{ height: '400px', width: '100%' }}>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                  <Radar
                    name="Proficiency"
                    dataKey="A"
                    stroke="var(--accent-color)"
                    fill="var(--accent-color)"
                    fillOpacity={0.6}
                  />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-center" style={{ height: '100%', color: 'var(--text-secondary)' }}>Complete more interviews to build your profile.</div>
            )}
          </div>
        </div>

        {/* Growth Chart */}
        <div className="card" style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Score Progression</h3>
          <div style={{ height: '400px', width: '100%' }}>
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="score" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-center" style={{ height: '100%', color: 'var(--text-secondary)' }}>Trend will appear after your first interview.</div>
            )}
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="card" style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '2rem' }}>Performance by Format</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          {typeData.map((type, i) => (
            <div key={type.name} style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', height: '120px', width: '120px', margin: '0 auto 1rem' }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={['var(--accent-color)', 'var(--success)', 'var(--warning)'][i % 3]} strokeWidth="3" strokeDasharray={`${type.value}, 100`} />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.25rem', fontWeight: 800 }}>{type.value}%</div>
              </div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{type.name}</h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
