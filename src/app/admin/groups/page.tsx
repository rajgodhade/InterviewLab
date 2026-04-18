'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function GroupsDashboard() {
  const { showToast, showConfirm } = useUI();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load groups: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (groupId: string, isArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ is_archived: !isArchived })
        .eq('id', groupId);
      
      if (error) throw error;
      
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, is_archived: !isArchived } : g));
      showToast(isArchived ? 'Group unarchived' : 'Group archived', 'success');
      fetchGroups(); // Refresh to update member counts and state properly
    } catch (err: any) {
      console.error(err);
      showToast('Action failed. Ensure "is_archived" column exists in groups table.', 'error');
    }
  };

  const handleDelete = async (groupId: string, name: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Group',
      message: `Are you sure you want to delete the group "${name}"? This will remove all students from this group, but the students themselves will not be deleted.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('groups').delete().eq('id', groupId);
      if (error) throw error;
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      showToast('Group deleted successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete group: ' + err.message, 'error');
    }
  };

  const filteredGroups = groups.filter(g => (g.is_archived || false) === showArchived);

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading groups...</div>;

  return (
    <div className="container">
      <div className="flex-responsive" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Student Groups</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Manage your batches and student collections.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '500px', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => setShowArchived(!showArchived)}
            style={{ 
              background: showArchived ? 'var(--accent-gradient)' : 'var(--bg-accent)', 
              color: 'var(--text-primary)', border: '1px solid var(--border-color)',
              fontSize: '0.85rem', padding: '0.75rem 1rem'
            }}
          >
            {showArchived ? '📦 Showing Archived' : '📁 Show Archived'}
          </button>
          <Link href="/admin/groups/create">
            <button style={{ background: 'var(--accent-gradient)' }}>+ Create Group</button>
          </Link>
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1rem' }}>No {showArchived ? 'archived' : 'active'} groups found</h3>
          {!showArchived && (
            <Link href="/admin/groups/create">
              <button style={{ background: 'var(--accent-gradient)' }}>Create your first group</button>
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))' }}>
          {filteredGroups.map((g) => (
            <div key={g.id} className="card" style={{ display: 'flex', flexDirection: 'column', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)', opacity: g.is_archived ? 0.8 : 1 }}>
              <div className="flex-between" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{g.name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleArchive(g.id, g.is_archived)}
                    style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.25rem', fontSize: '1.1rem', lineHeight: 1 }}
                    title={g.is_archived ? 'Unarchive' : 'Archive'}
                  >
                    {g.is_archived ? '📤' : '📥'}
                  </button>
                  <button 
                    onClick={() => handleDelete(g.id, g.name)}
                    style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.25rem', fontSize: '1.1rem', lineHeight: 1 }}
                    title="Delete Group"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {g.description && (
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem', flex: 1 }}>
                  {g.description}
                </p>
              )}
              
              <div className="flex-between" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <strong>{g.group_members?.[0]?.count || 0}</strong> members
                </span>
                <Link href={`/admin/groups/${g.id}`}>
                  <button style={{ background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    Manage
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

  );
}
