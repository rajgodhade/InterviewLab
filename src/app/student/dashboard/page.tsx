'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';

// Custom components for dashboard
const StatCard = ({ title, value, icon, trend, color }: any) => (
  <div className="card" style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '0.5rem', 
    background: 'var(--glass-bg)', 
    backdropFilter: 'blur(10px)',
    border: '1px solid var(--border-color)',
    padding: '1.5rem',
    borderRadius: '20px',
    flex: 1,
    minWidth: '200px',
    transition: 'transform 0.3s ease'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      {trend && (
        <span style={{ 
          fontSize: '0.75rem', 
          background: trend > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
          color: trend > 0 ? 'var(--success)' : 'var(--danger)',
          padding: '0.2rem 0.5rem',
          borderRadius: '10px',
          fontWeight: 700
        }}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div style={{ marginTop: '0.5rem' }}>
      <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</h4>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: color || 'var(--text-primary)', marginTop: '0.25rem' }}>{value}</div>
    </div>
  </div>
);

const ArticleCard = ({ article, isSaved, onToggleSave, compact }: { article: any, isSaved: boolean, onToggleSave: (e: React.MouseEvent, article: any) => void, compact?: boolean }) => (
  <div style={{ position: 'relative', height: '100%' }}>
    <a 
      href={article.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
    >
      <div className="card article-card" style={{ 
        height: '100%', 
        background: 'var(--glass-bg)', 
        padding: compact ? '1rem' : '0', 
        borderRadius: '20px', 
        overflow: 'hidden', 
        border: '1px solid var(--border-color)',
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s ease'
      }}>
        {!compact && (
          <>
            {article.cover_image ? (
              <img src={article.cover_image} alt={article.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '140px', background: 'var(--accent-gradient)', opacity: 0.2 }}></div>
            )}
          </>
        )}

        <div style={{ padding: compact ? '0' : '1.25rem', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!compact && (
            <div style={{ marginBottom: '1rem', paddingRight: '35px' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {article.tag_list?.slice(0, 2).map((tag: string) => (
                  <span key={tag} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.08)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <h4 style={{ 
            margin: 0, 
            fontSize: compact ? '0.85rem' : '1rem', 
            lineHeight: '1.4', 
            height: compact ? 'auto' : '2.8rem', 
            overflow: 'hidden', 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical',
            fontWeight: 700,
            paddingRight: compact ? '2.5rem' : '0',
            color: 'var(--text-primary)'
          }}>
            {article.title}
          </h4>
          
          {!compact && (
            <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <img src={article.user?.profile_image_90} alt={article.user?.name} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border-color)' }} />
              <span style={{ fontWeight: 500 }}>{article.user?.name}</span>
            </div>
          )}
        </div>
      </div>
    </a>

    {/* Bookmark Button - Absolute positioned outside the <a> link but within relative container */}
    <div 
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(e, article); }}
      style={{
        position: 'absolute',
        top: compact ? '50%' : '155px', // Below image or centered in compact
        right: compact ? '1rem' : '1.25rem',
        transform: compact ? 'translateY(-50%)' : 'none',
        width: compact ? '28px' : '32px',
        height: compact ? '28px' : '32px',
        background: isSaved ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 100,
        color: '#fff',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isSaved ? '0 4px 12px rgba(59, 130, 246, 0.4)' : '0 4px 12px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
      title={isSaved ? 'Remove from reading list' : 'Save for later'}
    >
      <svg width={compact ? "12" : "16"} height={compact ? "12" : "16"} viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
    </div>
  </div>
);

export default function StudentDashboardOverview() {
  const router = useRouter();
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completedInterviews: 0,
    pendingInterviews: 0,
    avgScore: 0,
    studyMaterials: 0,
    unreadMessages: 0
  });
  const [articles, setArticles] = useState<any[]>([]);
  const [interviewArticles, setInterviewArticles] = useState<any[]>([]);
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem('student_email');
    if (!email) {
      router.push('/student');
      return;
    }
    fetchDashboardData(email);
  }, [router]);

  const toggleSaveArticle = async (e: React.MouseEvent, article: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!studentInfo?.id) return;

    const isAlreadySaved = savedArticles.find(a => a.id === article.id);
    
    try {
      if (isAlreadySaved) {
        // Remove from Supabase
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .eq('student_id', studentInfo.id)
          .eq('article_id', String(article.id));
        
        if (error) throw error;
        setSavedArticles(prev => prev.filter(a => a.id !== article.id));
      } else {
        // Add to Supabase
        const { error } = await supabase
          .from('saved_articles')
          .insert({
            student_id: studentInfo.id,
            article_id: String(article.id),
            article_data: article
          });
        
        if (error) throw error;
        setSavedArticles(prev => [article, ...prev]);
      }
    } catch (err) {
      console.error('Failed to toggle save article:', err);
    }
  };

  const fetchArticles = async (techTag?: string) => {
    try {
      setLoadingArticles(true);
      
      // Fetch personalized or general programming articles
      const tag = techTag?.toLowerCase() || 'programming';
      const techRes = await fetch(`https://dev.to/api/articles?tag=${tag}&per_page=4`);
      const techData = await techRes.json();
      setArticles(techData);

      // Fetch interview & career articles
      const interviewRes = await fetch('https://dev.to/api/articles?tag=interview&per_page=4');
      const interviewData = await interviewRes.json();
      setInterviewArticles(interviewData);

    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoadingArticles(false);
    }
  };

  const fetchDashboardData = async (email: string) => {
    try {
      // 1. Fetch student info
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .single();

      if (studentError) throw studentError;
      setStudentInfo(studentData);

      // 2. Fetch assignments with results
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('interview_assignments')
        .select(`
          *,
          interviews(*),
          responses (
            id,
            answer_text,
            questions (
              id,
              expected_answer
            )
          )
        `)
        .eq('student_id', studentData.id)
        .order('scheduled_date', { ascending: true });

      if (assignmentError) throw assignmentError;
      setAssignments(assignmentData || []);

      // 3. Fetch study material count
      const { count: materialCount } = await supabase
        .from('study_material_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentData.id);

      // 4. Fetch unread messages
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentData.id)
        .eq('sender_role', 'admin')
        .eq('is_read', false);

      // Calculate stats
      const completed = assignmentData?.filter(a => a.status === 'completed') || [];
      const pending = assignmentData?.filter(a => a.status === 'pending') || [];
      
      let totalScore = 0;
      let totalPossible = 0;

      completed.forEach(a => {
        const correct = a.responses?.reduce((acc: number, res: any) => {
          const sAns = (res.answer_text || '').trim().toLowerCase();
          const eAns = (res.questions?.expected_answer || '').trim().toLowerCase();
          return (eAns && sAns === eAns) ? acc + 1 : acc;
        }, 0) || 0;
        totalScore += correct;
        totalPossible += a.responses?.length || 0;
      });

      const avgScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

      setStats({
        totalInterviews: assignmentData?.length || 0,
        completedInterviews: completed.length,
        pendingInterviews: pending.length,
        avgScore,
        studyMaterials: materialCount || 0,
        unreadMessages: messageCount || 0
      });

      // 5. Fetch saved articles from Supabase
      const { data: savedData, error: savedError } = await supabase
        .from('saved_articles')
        .select('*')
        .eq('student_id', studentData.id);

      if (savedError) {
        console.warn('Failed to load saved articles from server:', savedError);
      } else if (savedData) {
        setSavedArticles(savedData.map(s => s.article_data));
      }

      // After fetching data, fetch personalized articles based on the student's technology
      const topTech = assignmentData?.find(a => a.interviews?.technology)?.interviews?.technology;
      fetchArticles(topTech);

    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack,
        ...error
      };
      console.error('Error fetching dashboard data:', errorDetails);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !studentInfo) return;

      if (file.size > 2 * 1024 * 1024) {
        alert('File too large. Maximum size is 2MB.');
        return;
      }

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentInfo.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('students')
        .update({ photo_url: publicUrl })
        .eq('id', studentInfo.id);

      if (updateError) throw updateError;

      setStudentInfo({ ...studentInfo, photo_url: publicUrl });
    } catch (err: any) {
      console.error(err);
      alert('Upload failed. Ensure "avatars" bucket is public.');
    } finally {
      setUploading(false);
    }
  };

  // Prepare data for Trend Chart (last 7 completed interviews)
  const trendData = useMemo(() => {
    return assignments
      .filter(a => a.status === 'completed')
      .slice(-7)
      .map((a, index) => {
        const correct = a.responses?.reduce((acc: number, res: any) => {
          const sAns = (res.answer_text || '').trim().toLowerCase();
          const eAns = (res.questions?.expected_answer || '').trim().toLowerCase();
          return (eAns && sAns === eAns) ? acc + 1 : acc;
        }, 0) || 0;
        const total = a.responses?.length || 1;
        return {
          name: `I-${index + 1}`,
          score: Math.round((correct / total) * 100),
          title: a.interviews?.title
        };
      });
  }, [assignments]);

  // Prepare data for Skills Distribution
  const skillData = useMemo(() => {
    const skillsMap: Record<string, { total: number, correct: number, count: number }> = {};
    
    assignments.filter(a => a.status === 'completed').forEach(a => {
      const tech = a.interviews?.technology || 'Other';
      if (!skillsMap[tech]) skillsMap[tech] = { total: 0, correct: 0, count: 0 };
      
      a.responses?.forEach((res: any) => {
        skillsMap[tech].total += 1;
        const studentAns = (res.answer_text || '').trim().toLowerCase();
        const expectedAns = (res.questions?.expected_answer || '').trim().toLowerCase();
        if (expectedAns && studentAns === expectedAns) {
          skillsMap[tech].correct += 1;
        }
      });
    });

    return Object.entries(skillsMap).map(([name, data]) => ({
      name,
      value: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      interviews: data.total
    })).sort((a, b) => b.value - a.value);
  }, [assignments]);

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
        <p style={{ marginLeft: '1rem' }}>Preparing your dashboard...</p>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="container" style={{ maxWidth: '1200px', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <div className="flex-between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', 
                background: 'var(--bg-primary)', border: '2px solid var(--accent-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
              }}>
                {studentInfo?.photo_url ? (
                  <img src={studentInfo.photo_url} alt={studentInfo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{studentInfo?.name.charAt(0)}</span>
                )}
              </div>
              <label style={{ 
                position: 'absolute', bottom: -2, right: -2, background: 'var(--accent-color)', 
                color: '#fff', width: '20px', height: '20px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                fontSize: '0.8rem', border: '2px solid var(--bg-primary)'
              }}>
                +
                <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Welcome back, <span style={{ color: 'var(--accent-color)' }}>{studentInfo?.name}</span>!</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', fontSize: '0.9rem' }}>{studentInfo?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => { localStorage.clear(); router.push('/student'); }} 
            style={{ 
              background: 'rgba(239,68,68,0.1)', 
              color: 'var(--danger)', 
              border: '1px solid rgba(239,68,68,0.2)',
              padding: '0.6rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard title="Total Interviews" value={stats.totalInterviews} icon="📋" color="#3b82f6" />
        <StatCard title="Average Score" value={`${stats.avgScore}%`} icon="🎯" color="#10b981" />
        <StatCard title="Pending Tasks" value={stats.pendingInterviews} icon="⏳" color="#f59e0b" />
        <StatCard title="Resources" value={stats.studyMaterials} icon="📚" color="#8b5cf6" />
      </div>

      {/* Main Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Performance Trend */}
        <div className="card" style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Performance Trend</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Last 7 Sessions</span>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                    itemStyle={{ color: 'var(--accent-color)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="var(--accent-color)" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: 'var(--accent-color)', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-center" style={{ height: '100%', color: 'var(--text-secondary)' }}>
                Complete an interview to see your trend!
              </div>
            )}
          </div>
        </div>

        {/* Skill Matrix */}
        <div className="card" style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Skill Distribution</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Proficiency by Topic</span>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            {skillData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-primary)" fontSize={12} width={100} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                    {skillData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-center" style={{ height: '100%', color: 'var(--text-secondary)' }}>
                No skill data available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tech Insights Container */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: savedArticles.length > 0 ? 'minmax(300px, 1fr) 2.5fr' : '1fr', 
        gap: '2.5rem', 
        marginBottom: '4rem',
        alignItems: 'start'
      }}>
        {/* Left Section: Saved Articles (Vertical) */}
        {savedArticles.length > 0 && (
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.03)', 
            padding: '2rem', 
            borderRadius: '32px', 
            border: '1px solid rgba(59, 130, 246, 0.1)',
            position: 'sticky',
            top: '2rem'
          }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span>📚</span> Reading List
              </h2>
              <button 
                onClick={() => { if(confirm('Clear all saved articles?')) { setSavedArticles([]); localStorage.removeItem('saved_tech_articles'); } }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              maxHeight: '620px',
              overflowY: 'auto',
              paddingRight: '0.5rem',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--accent-color) transparent'
            }}>
              {savedArticles.map((article) => (
                <ArticleCard 
                  key={article.id} 
                  article={article} 
                  isSaved={true}
                  onToggleSave={toggleSaveArticle}
                  compact={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Right Section: Fetched Content */}
        <div>
          {/* Recommended for You */}
          <div style={{ marginBottom: '3rem' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>🎯</span> Recommended for You
              </h2>
            </div>
            
            {loadingArticles ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {[1, 2].map(i => (
                  <div key={i} className="card" style={{ height: '240px', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', opacity: 0.5 }}></div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {articles.map((article) => (
                  <ArticleCard 
                    key={article.id} 
                    article={article} 
                    isSaved={!!savedArticles.find(a => a.id === article.id)}
                    onToggleSave={toggleSaveArticle}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Career & Interview Mastery */}
          <div>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>💼</span> Career Mastery
              </h2>
              <a href="https://dev.to" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>
                Dev.to
              </a>
            </div>

            {loadingArticles ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {[1, 2].map(i => (
                  <div key={i} className="card" style={{ height: '240px', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', opacity: 0.5 }}></div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {interviewArticles.map((article) => (
                  <ArticleCard 
                    key={article.id} 
                    article={article} 
                    isSaved={!!savedArticles.find(a => a.id === article.id)}
                    onToggleSave={toggleSaveArticle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '2rem' }}>
        {/* Recent Activity */}
        <div className="card" style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Recent Interviews</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignments.filter(a => a.status === 'completed').slice(-4).reverse().map((a) => {
               const correct = a.responses?.reduce((acc: number, res: any) => {
                if (!res.questions?.expected_answer) return acc;
                return res.answer_text?.trim().toLowerCase() === res.questions.expected_answer.trim().toLowerCase() ? acc + 1 : acc;
              }, 0) || 0;
              const total = a.responses?.length || 0;
              const score = total > 0 ? Math.round((correct / total) * 100) : 0;

              return (
                <div key={a.id} className="flex-between" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.interviews?.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {new Date(a.created_at).toLocaleDateString()} • {a.interviews?.technology}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: score >= 50 ? 'var(--success)' : 'var(--danger)' }}>{score}%</div>
                    <Link href={`/student/results/${a.id}`} style={{ fontSize: '0.7rem', color: 'var(--accent-color)', textDecoration: 'none' }}>View Details →</Link>
                  </div>
                </div>
              );
            })}
            {assignments.filter(a => a.status === 'completed').length === 0 && (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No completed interviews yet.</p>
            )}
          </div>
          <Link href="/student/interviews" style={{ display: 'block', marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>
            View All Interviews
          </Link>
        </div>

        {/* Quick Links & Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card" style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', flex: 1 }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Link href="/student/interviews" style={{ textDecoration: 'none' }}>
                <div className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem', padding: '1.25rem', background: 'var(--accent-gradient)', borderRadius: '16px', color: '#fff' }}>
                  <span style={{ fontSize: '1.5rem' }}>📝</span>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Take Interview</span>
                </div>
              </Link>
              <Link href="/student/study-material" style={{ textDecoration: 'none' }}>
                <div className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  <span style={{ fontSize: '1.5rem' }}>📚</span>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Study Material</span>
                </div>
              </Link>
              <Link href="/student/leaderboard" style={{ textDecoration: 'none' }}>
                <div className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  <span style={{ fontSize: '1.5rem' }}>🏆</span>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Leaderboard</span>
                </div>
              </Link>
              <Link href="/student/messages" style={{ textDecoration: 'none' }}>
                <div className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', position: 'relative' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-color)' }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Messages</span>
                  {stats.unreadMessages > 0 && (
                    <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--danger)', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 800 }}>{stats.unreadMessages}</span>
                  )}
                </div>
              </Link>
            </div>
          </div>

          <div className="card" style={{ 
            background: 'var(--accent-gradient)', 
            padding: '1.5rem 2rem', 
            borderRadius: '24px', 
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)'
          }}>
            <div>
              <h4 style={{ margin: 0, opacity: 0.9 }}>Ready for your next challenge?</h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>You have {stats.pendingInterviews} pending interviews.</p>
            </div>
            <Link href="/student/interviews">
              <button style={{ background: '#fff', color: 'var(--accent-color)', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', border: 'none' }}>
                Start Now
              </button>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px -8px rgba(0,0,0,0.3);
        }
        .article-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .article-card:hover {
          border-color: var(--accent-color) !important;
          background: rgba(255,255,255,0.03) !important;
        }
      `}</style>
    </div>
  );
}
