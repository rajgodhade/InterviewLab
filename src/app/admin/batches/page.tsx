'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useUI } from '@/components/UIProvider';

export default function BatchesDashboard() {
  const supabase = createClient();
  const { showToast, showConfirm } = useUI();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }
      fetchBatches();
    };
    checkAuth();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(
            students(is_archived)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process batches to count only active (non-archived) members
      const processedBatches = (data || []).map(batch => ({
        ...batch,
        activeMemberCount: batch.group_members?.filter((m: any) => m.students && !m.students.is_archived).length || 0
      }));
      
      setBatches(processedBatches);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load batches: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (batchId: string, isArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ is_archived: !isArchived })
        .eq('id', batchId);
      
      if (error) throw error;
      
      setBatches(prev => prev.map(b => b.id === batchId ? { ...b, is_archived: !isArchived } : b));
      showToast(isArchived ? 'Batch unarchived' : 'Batch archived', 'success');
      fetchBatches(); // Refresh to update member counts and state properly
    } catch (err: any) {
      console.error(err);
      showToast('Action failed. Ensure "is_archived" column exists in groups table.', 'error');
    }
  };

  const handleDelete = async (batchId: string, name: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Batch',
      message: `Are you sure you want to delete the batch "${name}"? This will remove all students from this batch, but the students themselves will not be deleted.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('groups').delete().eq('id', batchId);
      if (error) throw error;
      setBatches((prev) => prev.filter((b) => b.id !== batchId));
      showToast('Batch deleted successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete batch: ' + err.message, 'error');
    }
  };

  const filteredBatches = batches.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (b.description && b.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesArchive = (b.is_archived || false) === showArchived;
    return matchesSearch && matchesArchive;
  });

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading batches...</div>;

  return (
    <div className="container">
      <div className="flex-responsive" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Student Batches</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Manage your batches and student collections.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '200px', justifyContent: 'flex-end' }}>
          <Link href="/admin/batches/create">
            <button style={{ background: 'var(--accent-gradient)', width: '100%' }}>+ Create Batch</button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '1rem', 
        marginBottom: '2.5rem',
        background: 'var(--glass-bg)',
        padding: '1rem 1.5rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(10px)',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search batches..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', width: '100%' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            onClick={() => setShowArchived(!showArchived)}
            style={{ 
              background: showArchived ? 'var(--accent-gradient)' : 'var(--bg-accent)', 
              color: 'var(--text-primary)', border: '1px solid var(--border-color)',
              fontSize: '0.85rem', padding: '0.6rem 1.25rem', minWidth: '160px',
              borderRadius: '10px'
            }}
          >
            {showArchived ? '📦 Showing Archived' : '📁 View Archived'}
          </button>

          <div style={{ display: 'flex', background: 'var(--bg-accent)', padding: '0.2rem', borderRadius: '8px', gap: '0.2rem', marginLeft: '0.5rem', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setViewMode('grid')}
              style={{ 
                padding: '0.4rem 0.8rem', 
                background: viewMode === 'grid' ? 'var(--accent-gradient)' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Grid
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{ 
                padding: '0.4rem 0.8rem', 
                background: viewMode === 'list' ? 'var(--accent-gradient)' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {filteredBatches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1rem' }}>No {showArchived ? 'archived' : 'active'} batches found</h3>
          {!showArchived && (
            <Link href="/admin/batches/create">
              <button style={{ background: 'var(--accent-gradient)' }}>Create your first batch</button>
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))' }}>
          {filteredBatches.map((b) => (
            <div key={b.id} className="card material-card" style={{ display: 'flex', flexDirection: 'column', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)', opacity: b.is_archived ? 0.8 : 1, transition: 'all 0.3s ease' }}>
              <div className="flex-between" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{b.name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleArchive(b.id, b.is_archived)}
                    style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.25rem', fontSize: '1.1rem', lineHeight: 1 }}
                    title={b.is_archived ? 'Unarchive' : 'Archive'}
                  >
                    {b.is_archived ? '📤' : '📥'}
                  </button>
                  <button 
                    onClick={() => handleDelete(b.id, b.name)}
                    style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.25rem', fontSize: '1.1rem', lineHeight: 1 }}
                    title="Delete Batch"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {b.description && (
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {b.description}
                </p>
              )}
              
              <div className="flex-between" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <strong>{b.activeMemberCount || 0}</strong> members
                </span>
                <Link href={`/admin/batches/${b.id}`}>
                  <button style={{ background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    Manage
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-accent)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Batch Name</th>
                <th style={{ padding: '1rem' }}>Description</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Members</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((b) => (
                <tr key={b.id} className="material-card-list" style={{ borderBottom: '1px solid var(--border-color)', opacity: b.is_archived ? 0.8 : 1, transition: 'all 0.3s ease' }}>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontWeight: 600 }}>{b.name}</span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {b.description ? (b.description.length > 60 ? b.description.substring(0, 60) + '...' : b.description) : 'No description'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ background: 'var(--bg-accent)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                      {b.activeMemberCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link href={`/admin/batches/${b.id}`}>
                        <button style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Manage</button>
                      </Link>
                      <button 
                        onClick={() => handleArchive(b.id, b.is_archived)}
                        style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-accent)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {b.is_archived ? '📤' : '📥'}
                      </button>
                      <button 
                        onClick={() => handleDelete(b.id, b.name)}
                        style={{ padding: '0.4rem 0.8rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', border: '1px solid rgba(244, 63, 94, 0.2)' }}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .material-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent-color) !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .material-card-list:hover {
          background: rgba(255, 255, 255, 0.03) !important;
        }
      `}</style>
    </div>

  );
}
