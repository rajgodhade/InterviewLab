'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

interface LeaderboardEntry {
  student_id: string;
  student_name: string;
  photo_url: string;
  total_score: number;
  total_max: number;
  interviews_completed: number;
  average_percentage: number;
}

export default function LeaderboardView({ isAdmin = false }: { isAdmin?: boolean }) {
  const { showToast } = useUI();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [technologies, setTechnologies] = useState<string[]>([]);
  
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedTech, setSelectedTech] = useState<string>('all');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedBatch, selectedTech]);

  const fetchInitialData = async () => {
    try {
      const { data: batchData } = await supabase.from('groups').select('*');
      setBatches(batchData || []);

      const { data: techData } = await supabase.from('interviews').select('technology');
      const uniqueTechs = Array.from(new Set((techData || []).map(t => t.technology)));
      setTechnologies(uniqueTechs);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let query;
      
      if (selectedBatch === 'all') {
        query = supabase
          .from('interview_assignments')
          .select(`
            final_score,
            max_score,
            students (id, name, photo_url),
            interviews (technology)
          `)
          .eq('status', 'completed')
          .not('final_score', 'is', null);
      } else {
        // Filter by student group membership (not just explicit group_id on assignment)
        query = supabase
          .from('interview_assignments')
          .select(`
            final_score,
            max_score,
            students!inner (
              id, name, photo_url,
              group_members!inner (group_id)
            ),
            interviews (technology)
          `)
          .eq('status', 'completed')
          .not('final_score', 'is', null)
          .eq('students.group_members.group_id', selectedBatch);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data || [];
      if (selectedTech !== 'all') {
        filteredData = filteredData.filter((item: any) => item.interviews?.technology === selectedTech);
      }

      const studentMap: Record<string, LeaderboardEntry> = {};

      filteredData.forEach((item: any) => {
        const student = item.students;
        if (!student) return;

        if (!studentMap[student.id]) {
          studentMap[student.id] = {
            student_id: student.id,
            student_name: student.name,
            photo_url: student.photo_url || '',
            total_score: 0,
            total_max: 0,
            interviews_completed: 0,
            average_percentage: 0
          };
        }

        studentMap[student.id].total_score += item.final_score || 0;
        studentMap[student.id].total_max += item.max_score || 0;
        studentMap[student.id].interviews_completed += 1;
      });

      const leaderboardArray = Object.values(studentMap).map(entry => ({
        ...entry,
        average_percentage: entry.total_max > 0 ? (entry.total_score / entry.total_max) * 100 : 0
      }));

      leaderboardArray.sort((a, b) => b.average_percentage - a.average_percentage);
      setEntries(leaderboardArray);

    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      showToast('Failed to load leaderboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const topThree = entries.slice(0, 3);
  const theRest = entries.slice(3);

  return (
    <div className="leaderboard-view">
      {/* Header with Blobs */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '2rem 0', marginBottom: '3rem' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '20%', width: '400px', height: '400px', background: 'rgba(59, 130, 246, 0.1)', filter: 'blur(100px)', borderRadius: '50%', zIndex: -1 }}></div>
        <div style={{ position: 'absolute', top: '-50px', right: '10%', width: '300px', height: '300px', background: 'rgba(139, 92, 246, 0.08)', filter: 'blur(80px)', borderRadius: '50%', zIndex: -1 }}></div>
        
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1.5rem', position: 'relative' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {isAdmin ? 'Performance Hub' : 'The Arena'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
              {isAdmin 
                ? 'Comprehensive student ranking and technical analytics dashboard.' 
                : "Real-time rankings for the top tech talent in your batch."}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select 
              value={selectedBatch} 
              onChange={(e) => setSelectedBatch(e.target.value)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.6rem 1rem', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <option value="all">All Batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select 
              value={selectedTech} 
              onChange={(e) => setSelectedTech(e.target.value)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.6rem 1rem', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <option value="all">All Tech</option>
              {technologies.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '40vh' }}>
          <div className="spinner"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="card flex-center" style={{ minHeight: '300px', flexDirection: 'column', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)' }}>
          <span className="material-icons-round" style={{ fontSize: '4rem', marginBottom: '1.5rem', color: 'var(--text-secondary)', opacity: 0.5 }}>leaderboard</span>
          <h3>The board is empty</h3>
          <p style={{ color: 'var(--text-secondary)' }}>No interviews found for the current filters.</p>
        </div>
      ) : (
        <>
          {/* Enhanced Podium Section */}
          <div className="podium-container">
            {topThree[1] && <PodiumCard entry={topThree[1]} rank={2} height="160px" color="#94a3b8" delay="0.2s" />}
            {topThree[0] && <PodiumCard entry={topThree[0]} rank={1} height="220px" color="#facc15" delay="0s" />}
            {topThree[2] && <PodiumCard entry={topThree[2]} rank={3} height="120px" color="#d97706" delay="0.4s" />}
          </div>

          {/* Premium Ranking Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-premium)', borderRadius: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1.25rem 2rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Rank</th>
                  <th style={{ padding: '1.25rem 2rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Student</th>
                  <th style={{ padding: '1.25rem 2rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Sessions</th>
                  <th style={{ padding: '1.25rem 2rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Total Score</th>
                  <th style={{ padding: '1.25rem 2rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', textAlign: 'right' }}>Performance</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.student_id} className="ranking-row" style={{ 
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background 0.2s ease',
                    cursor: 'default'
                  }}>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <span style={{ 
                        fontSize: '1rem', 
                        fontWeight: 900, 
                        color: index === 0 ? '#facc15' : index === 1 ? '#94a3b8' : index === 2 ? '#d97706' : 'var(--text-secondary)',
                        fontFamily: 'monospace'
                      }}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden', 
                          background: 'var(--bg-accent)', border: '1px solid var(--border-color)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                        }}>
                          {entry.photo_url ? (
                            <img src={entry.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div className="flex-center" style={{ width: '100%', height: '100%', fontSize: '1rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                              {entry.student_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{entry.student_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 2rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{entry.interviews_completed} Completed</td>
                    <td style={{ padding: '1.25rem 2rem', fontWeight: 700 }}>{entry.total_score} / {entry.total_max}</td>
                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${entry.average_percentage}%`, height: '100%', background: entry.average_percentage > 80 ? 'var(--success)' : entry.average_percentage > 50 ? 'var(--accent-color)' : 'var(--danger)', borderRadius: '10px' }}></div>
                        </div>
                        <span style={{ 
                          minWidth: '45px', fontSize: '0.9rem', fontWeight: 800,
                          color: entry.average_percentage > 80 ? 'var(--success)' : entry.average_percentage > 50 ? 'var(--accent-color)' : 'var(--danger)'
                        }}>
                          {Math.round(entry.average_percentage)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style jsx>{`
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255,255,255,0.05);
          border-radius: 50%;
          border-top-color: var(--accent-color);
          animation: spin 1s linear infinite;
        }
        .podium-container {
          display: flex; 
          justify-content: center; 
          align-items: flex-end; 
          gap: 2rem; 
          margin-bottom: 5rem;
          padding-top: 2rem;
          min-height: 400px;
        }
        .ranking-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .podium-container {
            flex-direction: column;
            align-items: center;
            gap: 3rem;
          }
        }
      `}</style>
    </div>
  );
}

function PodiumCard({ entry, rank, height, color, delay }: { entry: LeaderboardEntry; rank: number; height: string; color: string; delay: string }) {
  const isFirst = rank === 1;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: isFirst ? '200px' : '170px',
      position: 'relative',
      animation: `fadeInUp 0.8s ease ${delay} forwards`,
      opacity: 0
    }}>
      {/* Visual Rank Indicator */}
      <div style={{ 
        position: 'absolute', top: isFirst ? '-40px' : '-30px', 
        left: '50%', transform: 'translateX(-50%)',
        fontSize: isFirst ? '6rem' : '4rem', 
        fontWeight: 900, color: `${color}11`, zIndex: 0, 
        fontFamily: 'monospace', pointerEvents: 'none',
        letterSpacing: '-5px'
      }}>
        0{rank}
      </div>

      {/* Avatar Section */}
      <div style={{ 
        position: 'relative', 
        marginBottom: '1.5rem',
        animation: isFirst ? 'float 4s ease-in-out infinite' : 'none',
        zIndex: 1
      }}>
        {isFirst && (
          <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%) rotate(-5deg)', color: color, fontSize: '2.5rem', zIndex: 10 }}>
            <span className="material-icons-round" style={{ fontSize: '3rem' }}>workspace_premium</span>
          </div>
        )}
        
        <div style={{ 
          width: isFirst ? '110px' : '85px', 
          height: isFirst ? '110px' : '85px', 
          borderRadius: '30px', 
          border: `3px solid ${color}`,
          padding: '6px',
          background: 'var(--bg-primary)',
          boxShadow: isFirst ? `0 0 30px ${color}44` : `0 0 15px ${color}22`,
          transform: 'rotate(-5deg)'
        }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '22px', overflow: 'hidden', background: 'var(--bg-accent)', transform: 'rotate(5deg)' }}>
            {entry.photo_url ? (
              <img src={entry.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div className="flex-center" style={{ width: '100%', height: '100%', fontSize: '2rem', fontWeight: 900, color: 'var(--text-secondary)' }}>
                {entry.student_name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Accuracy Badge */}
        <div style={{ 
          position: 'absolute', bottom: '-10px', right: '-10px', 
          background: color, color: '#000', 
          padding: '0.25rem 0.6rem', borderRadius: '10px', 
          fontSize: '0.75rem', fontWeight: 900, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' 
        }}>
          {Math.round(entry.average_percentage)}%
        </div>
      </div>

      {/* Info */}
      <div style={{ textAlign: 'center', marginBottom: '1rem', width: '100%' }}>
        <div style={{ fontWeight: 900, fontSize: isFirst ? '1.4rem' : '1.1rem', marginBottom: '0.2rem' }}>{entry.student_name}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {entry.total_score} Points
        </div>
      </div>

      {/* Podium Block */}
      <div style={{ 
        width: '100%', 
        height: height, 
        background: `linear-gradient(180deg, ${color}33 0%, ${color}05 100%)`,
        border: `1px solid ${color}44`,
        borderRadius: '24px 24px 4px 4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `inset 0 0 20px ${color}11`,
        backdropFilter: 'blur(10px)'
      }}>
        <span style={{ 
          fontSize: isFirst ? '6rem' : '4.5rem', 
          fontWeight: 950, 
          color: color, 
          opacity: 1, 
          lineHeight: 1,
          textShadow: `0 0 30px ${color}66` 
        }}>
          {rank}
        </span>
      </div>
    </div>
  );
}
