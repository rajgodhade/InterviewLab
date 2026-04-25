'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useUI } from '@/components/UIProvider';

export default function StudyMaterialManager() {
  return (
    <Suspense fallback={<div className="flex-center" style={{ padding: '4rem' }}><div className="spinner"></div></div>}>
      <StudyMaterialContent />
    </Suspense>
  );
}

function StudyMaterialContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { showToast } = useUI();
  const [materials, setMaterials] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize from URL search params
  const currentFolderId = searchParams.get('folder');
  
  const setCurrentFolderId = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set('folder', id);
    } else {
      params.delete('folder');
    }
    router.push(`/admin/study-material?${params.toString()}`);
  };
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    link: '',
    type: 'document'
  });
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeMenuType, setActiveMenuType] = useState<'folder' | 'material' | null>(null);
  const [viewingAccessId, setViewingAccessId] = useState<string | null>(null);
  const [viewingAccessType, setViewingAccessType] = useState<'material' | 'folder' | null>(null);
  const [accessRecords, setAccessRecords] = useState<any[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(false);

  const openAccessModal = async (id: string, type: 'material' | 'folder') => {
    setViewingAccessId(id);
    setViewingAccessType(type);
    setLoadingAccess(true);
    try {
      const table = type === 'material' ? 'study_material_assignments' : 'study_material_folder_assignments';
      const field = type === 'material' ? 'material_id' : 'folder_id';
      
      const { data, error } = await supabase
        .from(table)
        .select(`
          id,
          student_id,
          group_id,
          students (name, email),
          groups (name)
        `)
        .eq(field, id);
      
      if (error) throw error;
      setAccessRecords(data || []);
    } catch (err) {
      console.error('Error fetching access records:', err);
    } finally {
      setLoadingAccess(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this access?')) return;
    try {
      const table = viewingAccessType === 'material' ? 'study_material_assignments' : 'study_material_folder_assignments';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      showToast('Access revoked', 'success');
      setAccessRecords(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      showToast('Failed to revoke access: ' + err.message, 'error');
    }
  };

  const getThumbnail = (link: string, type: string) => {
    if (type === 'video') {
      const ytMatch = link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^& \n<]+)/);
      if (ytMatch && ytMatch[1]) {
        return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
      }
      return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1074&auto=format&fit=crop';
    }
    if (type === 'document') {
      return 'https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1031&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?q=80&w=1170&auto=format&fit=crop';
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      fetchData();
    };
    checkAuth();
  }, [currentFolderId]);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuId(null);
      setActiveMenuType(null);
    };
    if (activeMenuId) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMaterials(),
      fetchFolders(),
      fetchBreadcrumbs()
    ]);
    setLoading(false);
  };

  const fetchFolders = async () => {
    try {
      let query = supabase
        .from('study_material_folders')
        .select('*')
        .is('student_id', null)
        .order('name');

      if (currentFolderId) {
        query = query.eq('parent_id', currentFolderId);
      } else {
        query = query.is('parent_id', null);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setFolders(data || []);
    } catch (err: any) {
      console.error('Error fetching folders:', err.message || err);
    }
  };

  const fetchBreadcrumbs = async () => {
    if (!currentFolderId) {
      setBreadcrumbs([]);
      return;
    }

    try {
      const crumbs = [];
      let tempId = currentFolderId;
      
      while (tempId) {
        const { data, error } = await supabase
          .from('study_material_folders')
          .select('id, name, parent_id')
          .eq('id', tempId)
          .single();
        
        if (error) break;
        crumbs.unshift(data);
        tempId = data.parent_id;
      }
      setBreadcrumbs(crumbs);
    } catch (err) {
      console.error('Error fetching breadcrumbs:', err);
    }
  };

  const fetchMaterials = async () => {
    try {
      let query = supabase
        .from('study_materials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (currentFolderId) {
        query = query.eq('folder_id', currentFolderId);
      } else {
        query = query.is('folder_id', null);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setMaterials(data || []);
    } catch (err: any) {
      showToast('Error fetching materials: ' + err.message, 'error');
    }
  };

  const [movingItem, setMovingItem] = useState<{id: string, type: 'material' | 'folder'} | null>(null);
  const [allPossibleFolders, setAllPossibleFolders] = useState<any[]>([]);

  const openMoveModal = async (id: string, type: 'material' | 'folder') => {
    setMovingItem({ id, type });
    try {
      const { data } = await supabase
        .from('study_material_folders')
        .select('id, name')
        .is('student_id', null);
      
      // Filter out the folder itself if we are moving a folder
      const filtered = data?.filter(f => f.id !== id) || [];
      setAllPossibleFolders(filtered);
    } catch (err) {
      console.error('Error fetching folders for move:', err);
    }
  };

  const handleMove = async (targetFolderId: string | null) => {
    if (!movingItem) return;

    const table = movingItem.type === 'material' ? 'study_materials' : 'study_material_folders';
    const field = movingItem.type === 'material' ? 'folder_id' : 'parent_id';

    try {
      const { error } = await supabase
        .from(table)
        .update({ [field]: targetFolderId })
        .eq('id', movingItem.id);
      
      if (error) throw error;
      
      showToast('Moved successfully!', 'success');
      setMovingItem(null);
      fetchData();
    } catch (err: any) {
      showToast('Move failed: ' + err.message, 'error');
    }
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('study_material_folders')
        .insert([{
          name: newFolderName,
          parent_id: currentFolderId || null,
          admin_id: user?.id
        }]);
      
      if (error) throw error;
      
      showToast('Folder created!', 'success');
      setNewFolderName('');
      setShowFolderForm(false);
      fetchFolders();
    } catch (err: any) {
      showToast('Failed to create folder: ' + err.message, 'error');
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title || !newMaterial.link) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    try {
      const { error } = await supabase
        .from('study_materials')
        .insert([{
          ...newMaterial,
          folder_id: currentFolderId || null
        }]);
      
      if (error) throw error;
      
      showToast('Study material added successfully!', 'success');
      setNewMaterial({ title: '', link: '', type: 'document' });
      setShowAddForm(false);
      fetchMaterials();
    } catch (err: any) {
      showToast('Failed to add material: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study material?')) return;
    
    try {
      const { error } = await supabase
        .from('study_materials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      showToast('Material deleted', 'success');
      fetchMaterials();
    } catch (err: any) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Are you sure? Deleting a folder will remove all its contents (subfolders and materials).')) return;

    try {
      const { error } = await supabase
        .from('study_material_folders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      showToast('Folder deleted', 'success');
      fetchFolders();
    } catch (err: any) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  const filteredMaterials = materials
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'All' || item.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'az') return a.title.localeCompare(b.title);
      if (sortBy === 'za') return b.title.localeCompare(a.title);
      return 0;
    });

  return (
    <div className="container">
      <div className="flex-responsive" style={{ marginBottom: '2.5rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <h1>Study Material</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage and share documents or video links with students.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowFolderForm(true)} style={{ background: 'var(--bg-accent)', color: 'var(--text-primary)' }}>
            + New Folder
          </button>
          <button onClick={() => setShowAddForm(true)}>
            + Add Material
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        marginBottom: '1.5rem', 
        fontSize: '0.9rem', 
        color: 'var(--text-secondary)',
        background: 'var(--bg-secondary)',
        padding: '0.6rem 1rem',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        width: 'fit-content'
      }}>
        <span 
          onClick={() => setCurrentFolderId(null)} 
          style={{ cursor: 'pointer', fontWeight: !currentFolderId ? 700 : 500, color: !currentFolderId ? 'var(--accent-color)' : 'inherit' }}
        >
          📁 Root
        </span>
        {breadcrumbs.map(crumb => (
          <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ opacity: 0.5 }}>/</span>
            <span 
              onClick={() => setCurrentFolderId(crumb.id)} 
              style={{ cursor: 'pointer', fontWeight: currentFolderId === crumb.id ? 700 : 500, color: currentFolderId === crumb.id ? 'var(--accent-color)' : 'inherit' }}
            >
              {crumb.name}
            </span>
          </span>
        ))}
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
            placeholder="Search materials..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.75rem', fontSize: '0.95rem', width: '100%' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: 'auto', minWidth: '130px', fontSize: '0.85rem', padding: '0.6rem 1rem' }}
          >
            <option value="All">All Types</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
            <option value="other">Other</option>
          </select>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ width: 'auto', minWidth: '130px', fontSize: '0.85rem', padding: '0.6rem 1rem' }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="az">Title A-Z</option>
            <option value="za">Title Z-A</option>
          </select>

          <div style={{ display: 'flex', background: 'var(--bg-accent)', padding: '0.2rem', borderRadius: '8px', gap: '0.2rem', marginLeft: '0.5rem', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setViewMode('grid')}
              style={{ 
                padding: '0.4rem 0.8rem', 
                background: viewMode === 'grid' ? 'var(--accent-gradient)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
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
                color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
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

      {showFolderForm && (
        <div 
          className="modal-overlay"
          onClick={() => setShowFolderForm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div 
            className="card"
            style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1.5rem' }}>Create New Folder</h3>
            <form onSubmit={handleAddFolder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <input 
                type="text" 
                placeholder="e.g. React Resources" 
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                autoFocus
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => setShowFolderForm(false)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, background: 'var(--accent-gradient)' }}>
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddForm && (
        <div 
          className="modal-overlay"
          onClick={() => setShowAddForm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div 
            className="card"
            style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1.5rem' }}>Add New Material</h3>
            <form onSubmit={handleAddMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. React Hooks Masterclass" 
                  value={newMaterial.title}
                  onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Resource Link</label>
                <input 
                  type="url" 
                  placeholder="https://..." 
                  value={newMaterial.link}
                  onChange={e => setNewMaterial({...newMaterial, link: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Type</label>
                <select 
                  value={newMaterial.type}
                  onChange={e => setNewMaterial({...newMaterial, type: e.target.value})}
                >
                  <option value="document">Document / PDF</option>
                  <option value="video">Video / Tutorial</option>
                  <option value="other">Other Resource</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, background: 'var(--accent-gradient)' }}>
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex-center" style={{ padding: '4rem' }}>
          <div className="spinner"></div>
          <p style={{ marginLeft: '1rem' }}>Loading materials...</p>
        </div>
      ) : (folders.length === 0 && materials.length === 0) ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <span style={{ fontSize: '3rem' }}>📚</span>
          <h3 style={{ marginTop: '1rem' }}>No study materials yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Add your first folder or material to share with students.</p>
        </div>
      ) : (
        <>
          {/* Folders Display */}
          {folders.length > 0 && !searchQuery && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem', animation: 'fadeIn 0.5s ease' }}>
              {folders.map(folder => (
                <div 
                  key={folder.id} 
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="card folder-card"
                  style={{ 
                    cursor: 'pointer',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1.25rem', 
                    padding: '1.25rem',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease',
                    borderRadius: '16px'
                  }}
                >
                  <div style={{ 
                    width: '45px', 
                    height: '45px', 
                    borderRadius: '12px', 
                    background: 'rgba(59, 130, 246, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    📁
                  </div>
                  <div style={{ flex: 1, fontWeight: 700, fontSize: '1rem' }}>{folder.name}</div>
                  
                  {/* Actions Menu */}
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === folder.id ? null : folder.id); setActiveMenuType('folder'); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', padding: '0.5rem', cursor: 'pointer' }}
                    >
                      ⋮
                    </button>
                    {activeMenuId === folder.id && activeMenuType === 'folder' && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                        zIndex: 100,
                        minWidth: '150px',
                        overflow: 'hidden',
                        animation: 'fadeIn 0.2s ease'
                      }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openAccessModal(folder.id, 'folder'); setActiveMenuId(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          👁️ View Access
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin/study-material/assign-folder/${folder.id}`); setActiveMenuId(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          👤 Assign Access
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openMoveModal(folder.id, 'folder'); setActiveMenuId(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          📂 Move Folder
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); setActiveMenuId(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#ff4d4d', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          🗑️ Delete Folder
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredMaterials.length === 0 && (folders.length === 0 || searchQuery) ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No materials match your search or filter.</p>
              <button onClick={() => { setSearchQuery(''); setFilterType('All'); }} style={{ background: 'var(--bg-accent)' }}>Clear Filters</button>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filteredMaterials.map(item => (
                <div key={item.id} className="card material-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 0, overflow: 'hidden', transition: 'all 0.3s ease' }}>
                  <div style={{ position: 'relative', height: '160px', width: '100%' }}>
                    <img 
                      src={getThumbnail(item.link, item.type)} 
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                       <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '20px', 
                        fontSize: '0.65rem', 
                        background: item.type === 'video' ? 'rgba(244, 63, 94, 0.9)' : 'rgba(59, 130, 246, 0.9)',
                        color: '#fff',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        backdropFilter: 'blur(4px)'
                      }}>
                        {item.type}
                      </span>
                    </div>
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); setActiveMenuType('material'); }}
                        style={{ 
                          background: 'rgba(0,0,0,0.5)', 
                          padding: '0.4rem', 
                          borderRadius: '8px', 
                          color: '#fff', 
                          fontSize: '1.2rem',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(4px)',
                          cursor: 'pointer',
                          border: 'none'
                        }}
                      >
                        ⋮
                      </button>
                      {activeMenuId === item.id && activeMenuType === 'material' && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                          zIndex: 100,
                          minWidth: '150px',
                          overflow: 'hidden',
                          marginTop: '0.5rem',
                          animation: 'fadeIn 0.2s ease'
                        }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openAccessModal(item.id, 'material'); setActiveMenuId(null); }}
                            style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            👁️ View Access
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openMoveModal(item.id, 'material'); setActiveMenuId(null); }}
                            style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            📂 Move to Folder
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); setActiveMenuId(null); }}
                            style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#ff4d4d', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            🗑️ Delete Material
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.8rem' }}>{item.title}</h3>
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8rem', color: 'var(--accent-color)', wordBreak: 'break-all', display: 'block', marginBottom: '1.5rem', opacity: 0.8 }}
                    >
                      {item.link.length > 40 ? item.link.substring(0, 40) + '...' : item.link}
                    </a>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => openAccessModal(item.id, 'material')}
                        style={{ flex: '0 0 45px', background: 'var(--bg-accent)', color: 'var(--text-primary)', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="View assigned students"
                      >
                        👁️
                      </button>
                      <button 
                        onClick={() => router.push(`/admin/study-material/assign/${item.id}`)}
                        style={{ flex: 1, background: 'var(--bg-accent)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredMaterials.map(item => (
                <div key={item.id} className="card material-card-list" style={{ display: 'flex', alignItems: 'center', padding: '1rem', gap: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', transition: 'all 0.3s ease' }}>
                  <div style={{ width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <img 
                      src={getThumbnail(item.link, item.type)} 
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      {item.type === 'video' ? '▶️' : '📄'}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.title}</h3>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>{item.type.toUpperCase()}</span>
                      <span>•</span>
                      <span>Added {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {/* Actions Menu */}
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); setActiveMenuType('material'); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', padding: '0.5rem', cursor: 'pointer' }}
                    >
                      ⋮
                    </button>
                    {activeMenuId === item.id && activeMenuType === 'material' && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                        zIndex: 100,
                        minWidth: '180px',
                        overflow: 'hidden',
                        animation: 'fadeIn 0.2s ease'
                      }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openAccessModal(item.id, 'material'); setActiveMenuId(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          👁️ View Access
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin/study-material/assign/${item.id}`); setActiveMenuId(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          👤 Assign Access
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openMoveModal(item.id, 'material'); setActiveMenuId(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          📂 Move to Folder
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); setActiveMenuId(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#ff4d4d', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          🗑️ Delete Material
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Move Modal */}
      {movingItem && (
        <div 
          className="modal-overlay"
          onClick={() => setMovingItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div 
            className="card"
            style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1.5rem' }}>Move to Folder</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              <button 
                onClick={() => handleMove(null)}
                style={{ 
                  textAlign: 'left', 
                  padding: '1rem', 
                  background: currentFolderId === null ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                  color: '#fff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px'
                }}
              >
                📁 Root Directory
              </button>
              {allPossibleFolders.map(folder => (
                <button 
                  key={folder.id}
                  onClick={() => handleMove(folder.id)}
                  style={{ 
                    textAlign: 'left', 
                    padding: '1rem', 
                    background: currentFolderId === folder.id ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px'
                  }}
                >
                  📁 {folder.name}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setMovingItem(null)}
              style={{ marginTop: '1.5rem', width: '100%', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid var(--border-color);
          border-top: 3px solid var(--accent-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .material-card:hover, .material-card-list:hover {
          transform: translateY(-4px);
          border-color: var(--accent-color) !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Access Modal */}
      {viewingAccessId && (
        <div 
          className="modal-overlay"
          onClick={() => setViewingAccessId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 11000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div 
            className="card"
            style={{ 
              width: '100%', 
              maxWidth: '600px', 
              padding: '2rem', 
              maxHeight: '80vh', 
              display: 'flex', 
              flexDirection: 'column',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-premium)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Current Access Control</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {viewingAccessType === 'folder' ? 'Folder' : 'Material'} Access List
                </p>
              </div>
              <button 
                onClick={() => setViewingAccessId(null)}
                style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', fontSize: '1.5rem', padding: '0.5rem' }}
              >✕</button>
            </div>

            {loadingAccess ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p style={{ color: 'var(--text-secondary)' }}>Loading access records...</p>
              </div>
            ) : accessRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-accent)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                <span style={{ fontSize: '2.5rem' }}>👥</span>
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontWeight: 500 }}>No access granted yet.</p>
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
                {accessRecords.map(record => (
                  <div key={record.id} style={{ 
                    padding: '1rem', 
                    borderRadius: '12px', 
                    background: 'var(--bg-accent)', 
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: record.group_id ? 'var(--success)' : 'var(--accent-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                        {record.group_id ? 'B' : record.students?.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{record.group_id ? record.groups?.name : record.students?.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{record.group_id ? 'Batch Access' : record.students?.email}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRevoke(record.id)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '8px' }}
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button 
                onClick={() => {
                  const path = viewingAccessType === 'folder' 
                    ? `/admin/study-material/assign-folder/${viewingAccessId}` 
                    : `/admin/study-material/assign/${viewingAccessId}`;
                  router.push(path);
                }}
                style={{ width: '100%', background: 'var(--accent-gradient)' }}
              >
                + Assign New Access
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
