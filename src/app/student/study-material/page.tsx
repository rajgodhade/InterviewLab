'use client';

import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function StudentStudyMaterial() {
  const { showToast } = useUI();
  const [materials, setMaterials] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  const [movingItem, setMovingItem] = useState<{id: string, type: 'assignment' | 'folder'} | null>(null);
  const [allPossibleFolders, setAllPossibleFolders] = useState<any[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeMenuType, setActiveMenuType] = useState<'folder' | 'material' | null>(null);

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

  const getEmbedUrl = (link: string) => {
    const ytMatch = link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^& \n<]+)/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    }
    return link;
  };

  useEffect(() => {
    const email = localStorage.getItem('student_email');
    if (email) {
      fetchData(email);
    } else {
      setLoading(false);
    }
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

  const fetchData = async (email: string) => {
    setLoading(true);
    await fetchStudentMaterials(email);
    await fetchBreadcrumbs();
    setLoading(false);
  };

  const fetchStudentMaterials = async (email: string) => {
    try {
      // 1. Get student ID
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .single();
      
      if (studentError) throw studentError;
      if (!student) return;
      setStudentId(student.id);

      // 2. Fetch student's folders in current location
      let folderQuery = supabase
        .from('study_material_folders')
        .select('*')
        .eq('student_id', student.id)
        .order('name');
      
      if (currentFolderId) {
        folderQuery = folderQuery.eq('parent_id', currentFolderId);
      } else {
        folderQuery = folderQuery.is('parent_id', null);
      }

      const { data: studentFolders } = await folderQuery;
      setFolders(studentFolders || []);

      // 3. Get student batches
      const { data: batchMemberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('student_id', student.id);
      
      const batchIds = batchMemberships?.map(m => m.group_id) || [];

      // 4. Fetch folders
      let foldersList: any[] = [];
      if (!currentFolderId) {
        // At Root: Fetch student's own root folders
        const { data: privateFolders } = await supabase
          .from('study_material_folders')
          .select('*')
          .eq('student_id', student.id)
          .is('parent_id', null)
          .order('name');
        
        // At Root: Fetch folders assigned to student or their batches
        let assignedFoldersQuery = supabase
          .from('study_material_folder_assignments')
          .select('folder_id, study_material_folders(*)');
        
        if (batchIds.length > 0) {
          assignedFoldersQuery = assignedFoldersQuery.or(`student_id.eq.${student.id},group_id.in.(${batchIds.join(',')})`);
        } else {
          assignedFoldersQuery = assignedFoldersQuery.eq('student_id', student.id);
        }

        const { data: assignedFolderRecs } = await assignedFoldersQuery;
        const assignedFolders = assignedFolderRecs?.map(r => r.study_material_folders).filter(Boolean) || [];
        
        foldersList = [...(privateFolders || []), ...assignedFolders];
      } else {
        // Inside a folder: Fetch subfolders (works for both private and assigned folders)
        const { data: subfolders } = await supabase
          .from('study_material_folders')
          .select('*')
          .eq('parent_id', currentFolderId)
          .order('name');
        
        foldersList = subfolders || [];
      }
      setFolders(foldersList);

      // 5. Fetch materials
      let materialsList: any[] = [];
      if (!currentFolderId) {
        // At Root: Fetch individually assigned materials (material-level assignments with no target folder)
        let matAssignQuery = supabase
          .from('study_material_assignments')
          .select('id, material_id, folder_id, study_materials(*)')
          .is('folder_id', null);
        
        if (batchIds.length > 0) {
          matAssignQuery = matAssignQuery.or(`student_id.eq.${student.id},group_id.in.(${batchIds.join(',')})`);
        } else {
          matAssignQuery = matAssignQuery.eq('student_id', student.id);
        }

        const { data: assignments } = await matAssignQuery;
        
        const uniqueMaterialsMap = new Map();
        assignments?.forEach(a => {
          const m = a.study_materials;
          if (m) {
            const materialsArr = Array.isArray(m) ? m : [m];
            materialsArr.forEach((sm: any) => {
              if (sm && !uniqueMaterialsMap.has(sm.id)) {
                uniqueMaterialsMap.set(sm.id, {
                  ...sm,
                  assignment_id: a.id
                });
              }
            });
          }
        });
        materialsList = Array.from(uniqueMaterialsMap.values());
      } else {
        // Inside a folder:
        // We first check if this folder is one of the student's private organization folders
        // OR if it's an admin folder the student is browsing.
        
        // Simple approach: Fetch all materials belonging to this folder in study_materials table
        const { data: folderMaterials } = await supabase
          .from('study_materials')
          .select('*')
          .eq('folder_id', currentFolderId);
        
        // ALSO fetch materials the student MOVED into this folder (private assignments)
        const { data: movedAssignments } = await supabase
          .from('study_material_assignments')
          .select('id, material_id, folder_id, study_materials(*)')
          .eq('folder_id', currentFolderId)
          .eq('student_id', student.id);
        
        const uniqueMaterialsMap = new Map();
        
        // Add materials belonging directly to the folder
        folderMaterials?.forEach(m => {
          uniqueMaterialsMap.set(m.id, m);
        });

        // Add materials moved by the student (overriding or adding)
        movedAssignments?.forEach(a => {
          const m = a.study_materials;
          if (m) {
            const materialsArr = Array.isArray(m) ? m : [m];
            materialsArr.forEach((sm: any) => {
              if (sm && !uniqueMaterialsMap.has(sm.id)) {
                uniqueMaterialsMap.set(sm.id, {
                  ...sm,
                  assignment_id: a.id
                });
              }
            });
          }
        });

        materialsList = Array.from(uniqueMaterialsMap.values());
      }
      setMaterials(materialsList);
    } catch (err: any) {
      showToast('Error fetching materials: ' + err.message, 'error');
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
    } catch (err: any) {
      console.error('Error fetching student folders:', err.message || err);
    }
  };



  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !studentId) return;

    try {
      const { error } = await supabase
        .from('study_material_folders')
        .insert([{
          name: newFolderName,
          parent_id: currentFolderId || null,
          student_id: studentId
        }]);
      
      if (error) throw error;
      
      showToast('Folder created!', 'success');
      setNewFolderName('');
      setShowFolderForm(false);
      fetchData(localStorage.getItem('student_email')!);
    } catch (err: any) {
      showToast('Failed to create folder: ' + err.message, 'error');
    }
  };

  const openMoveModal = async (id: string, type: 'assignment' | 'folder') => {
    setMovingItem({ id, type });
    try {
      const { data } = await supabase
        .from('study_material_folders')
        .select('id, name')
        .eq('student_id', studentId);
      
      const filtered = data?.filter(f => f.id !== id) || [];
      setAllPossibleFolders(filtered);
    } catch (err) {
      console.error('Error fetching folders for move:', err);
    }
  };

  const handleMove = async (targetFolderId: string | null) => {
    if (!movingItem || !studentId) return;

    const table = movingItem.type === 'assignment' ? 'study_material_assignments' : 'study_material_folders';
    const field = movingItem.type === 'assignment' ? 'folder_id' : 'parent_id';

    try {
      let query = supabase
        .from(table)
        .update({ [field]: targetFolderId })
        .eq('id', movingItem.id);
      
      if (movingItem.type === 'assignment') {
        query = query.eq('student_id', studentId);
      } else {
        query = query.eq('student_id', studentId);
      }

      const { error } = await query;
      
      if (error) throw error;
      
      showToast('Moved successfully!', 'success');
      setMovingItem(null);
      fetchData(localStorage.getItem('student_email')!);
    } catch (err: any) {
      showToast('Move failed: ' + err.message, 'error');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Are you sure? This folder and its subfolders will be deleted. (Assigned materials will be moved back to Root)')) return;

    try {
      const { error } = await supabase
        .from('study_material_folders')
        .delete()
        .eq('id', id)
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      showToast('Folder deleted', 'success');
      fetchData(localStorage.getItem('student_email')!);
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-center" style={{ padding: '4rem' }}>
          <div className="spinner"></div>
          <p style={{ marginLeft: '1rem' }}>Loading resources...</p>
        </div>
      );
    }

    if (folders.length === 0 && (materials === null || materials.length === 0)) {
      return (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <span style={{ fontSize: '3rem' }}>📖</span>
          <h3 style={{ marginTop: '1rem' }}>No materials here</h3>
          <p style={{ color: 'var(--text-secondary)' }}>This folder is empty or you haven't been assigned any materials yet.</p>
        </div>
      );
    }

    let materialsContent;
    if (filteredMaterials.length === 0 && (folders.length === 0 || searchQuery)) {
      materialsContent = (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', background: 'var(--glass-bg)' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No materials match your search or filter.</p>
          <button onClick={() => { setSearchQuery(''); setFilterType('All'); }} style={{ background: 'var(--bg-accent)' }}>Clear Filters</button>
        </div>
      );
    } else if (viewMode === 'grid') {
      materialsContent = (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredMaterials.map(item => (
            <div 
              key={item.id} 
              onClick={() => {
                if (item.type === 'video') {
                  setSelectedVideo(item.link);
                } else {
                  window.open(item.link, '_blank');
                }
              }}
              className="card material-card"
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease', 
                display: 'flex', 
                flexDirection: 'column', 
                padding: 0, 
                overflow: 'hidden' 
              }}
            >
              <div style={{ position: 'relative', height: '180px', width: '100%' }}>
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
                <div style={{ 
                  position: 'absolute', 
                  bottom: '0.75rem', 
                  right: '0.75rem',
                  background: 'rgba(0,0,0,0.6)',
                  padding: '0.4rem',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                  fontSize: '1.2rem'
                }}>
                  {item.type === 'video' ? '▶️' : '📄'}
                </div>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>{item.title}</h3>
                  <div style={{ position: 'relative', marginLeft: '0.5rem' }}>
                    {item.assignment_id && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); setActiveMenuType('material'); }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', padding: '0.4rem', cursor: 'pointer' }}
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
                            marginTop: '0.25rem',
                            animation: 'fadeIn 0.2s ease'
                          }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); openMoveModal(item.assignment_id, 'assignment'); setActiveMenuId(null); }}
                              style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                              📂 Move to Folder
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: 600 }}>
                  {item.type === 'video' ? 'Play Video' : 'Open Resource'} <span>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      materialsContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredMaterials.map(item => (
            <div 
              key={item.id}
              onClick={() => {
                if (item.type === 'video') {
                  setSelectedVideo(item.link);
                } else {
                  window.open(item.link, '_blank');
                }
              }}
              className="card material-card-list"
              style={{ 
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                padding: '1rem',
                gap: '1.5rem',
                background: 'var(--glass-bg)',
                border: '1px solid var(--border-color)',
                transition: 'all 0.3s ease'
              }}
            >
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
              <div style={{ position: 'relative' }}>
                {item.assignment_id && (
                  <>
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
                        minWidth: '150px',
                        overflow: 'hidden',
                        animation: 'fadeIn 0.2s ease'
                      }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openMoveModal(item.assignment_id, 'assignment'); setActiveMenuId(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          📂 Move to Folder
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div style={{ color: 'var(--accent-color)', fontWeight: 600 }}>
                {item.type === 'video' ? 'Watch' : 'View'} →
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <Fragment>
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
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{folder.name}</div>
                  {!folder.student_id && (
                    <span style={{ fontSize: '0.6rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-color)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800, marginLeft: '0.2rem' }}>SHARED</span>
                  )}
                </div>
                {folder.student_id && (
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
                )}
              </div>
            ))}
          </div>
        )}
        {materialsContent}
      </Fragment>
    );
  };
  return (
    <div className="container">
      <div className="flex-responsive" style={{ marginBottom: '2rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Study Material</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Resources shared by your instructors to help you prepare.</p>
        </div>
        <button onClick={() => setShowFolderForm(true)} style={{ background: 'var(--bg-accent)', color: 'var(--text-primary)' }}>
          + New Folder
        </button>
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
          📁 My Resources
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
            placeholder="Search by title..." 
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
            <h3 style={{ marginBottom: '1.5rem' }}>Create New Personal Folder</h3>
            <form onSubmit={handleAddFolder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <input 
                type="text" 
                placeholder="e.g. For Revision" 
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

      {renderContent()}

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
                📁 My Resources (Root)
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

      {/* Video Modal Overlay */}
      {selectedVideo && (
        <div 
          className="modal-overlay"
          onClick={() => setSelectedVideo(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(10px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div 
            style={{ width: '100%', maxWidth: '1000px', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedVideo(null)}
              style={{
                position: 'absolute',
                top: '-3rem',
                right: 0,
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Close ✕
            </button>
            <div style={{ 
              position: 'relative', 
              paddingBottom: '56.25%', 
              height: 0, 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <iframe
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
                src={getEmbedUrl(selectedVideo)}
                title="Video Study Material"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
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
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
