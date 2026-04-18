'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function GroupsDashboard() {
  const { showToast, showConfirm } = useUI();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      // Get groups and count members
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

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading groups...</div>;

  return (
    <div className="container">
      <div className="flex-responsive" style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Student Groups</h2>
        <Link href="/admin/groups/create">
          <button style={{ width: '100%', background: 'var(--accent-gradient)' }}>+ Create Group</button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1rem' }}>No groups found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Create your first student group to manage batches easily.</p>
          <Link href="/admin/groups/create">
            <button style={{ background: 'var(--accent-gradient)' }}>Create Group</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))' }}>
          {groups.map((g) => (
            <div key={g.id} className="card" style={{ display: 'flex', flexDirection: 'column', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
              <div className="flex-between" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{g.name}</h3>
                <button 
                  onClick={() => handleDelete(g.id, g.name)}
                  style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.25rem', fontSize: '1.25rem', lineHeight: 1 }}
                  title="Delete Group"
                >
                  ✕
                </button>
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
