'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useUI } from '@/components/UIProvider';
import { useRef } from 'react';

export default function StudentProfileList() {
  const supabase = createClient();
  const { showToast, showConfirm } = useUI();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudents, setNewStudents] = useState([{ name: '', email: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showArchived]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }
      fetchStudents();
    };
    checkAuth();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`*, interview_assignments (id)`)
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load students: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (studentId: string, isArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ is_archived: !isArchived })
        .eq('id', studentId);
      
      if (error) throw error;
      
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, is_archived: !isArchived } : s));
      showToast(isArchived ? 'Student unarchived' : 'Student archived', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Action failed', 'error');
    }
  };

  const handleDelete = async (studentId: string, name: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Student',
      message: `Are you sure you want to permanently delete "${name}"? This will also delete all their interview history and responses. This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      danger: true
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) throw error;
      
      setStudents(prev => prev.filter(s => s.id !== studentId));
      showToast('Student deleted successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete student: ' + err.message, 'error');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const validStudents = newStudents.filter(s => s.name && s.email);
    if (validStudents.length === 0) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('students')
        .insert(validStudents.map(s => ({
          name: s.name,
          email: s.email.toLowerCase().trim(),
          is_archived: false
        })))
        .select();

      if (error) throw error;

      fetchStudents(); // Refresh to ensure all data (like assignments count) is correct
      setNewStudents([{ name: '', email: '' }]);
      setIsAddModalOpen(false);
      showToast(`Successfully added ${data?.length} students`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to add students: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMoreRow = () => {
    setNewStudents([...newStudents, { name: '', email: '' }]);
  };

  const removeRow = (index: number) => {
    if (newStudents.length === 1) return;
    setNewStudents(newStudents.filter((_, i) => i !== index));
  };

  const updateStudentField = (index: number, field: 'name' | 'email', value: string) => {
    setNewStudents(newStudents.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const studentsToAdd: any[] = [];

      // Assume CSV format: name, email
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [name, email] = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        if (name && email) {
          studentsToAdd.push({ name, email: email.toLowerCase() });
        }
      }

      if (studentsToAdd.length === 0) {
        showToast('No valid student data found in CSV', 'error');
        return;
      }

      try {
        setLoading(true);
        const { error } = await supabase
          .from('students')
          .insert(studentsToAdd);

        if (error) throw error;
        
        fetchStudents(); // Refresh the list
        showToast(`Successfully imported students`, 'success');
      } catch (err: any) {
        console.error(err);
        showToast('Import failed: ' + err.message, 'error');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const currentFilteredIds = filteredStudents.map(s => s.id);
    if (selectedIds.length === currentFilteredIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentFilteredIds);
    }
  };

  const handleCSVDownload = (exportSelected: boolean = false) => {
    const studentsToExport = exportSelected 
      ? students.filter(s => selectedIds.includes(s.id))
      : students;

    if (studentsToExport.length === 0) {
      showToast('No students to export', 'warning');
      return;
    }

    const headers = ['Name', 'Email', 'Status', 'Sessions'];
    const rows = studentsToExport.map(s => [
      `"${s.name}"`,
      `"${s.email}"`,
      s.is_archived ? 'Archived' : 'Active',
      s.interview_assignments?.length || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${exportSelected ? 'selected' : 'all'}_students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArchive = (s.is_archived || false) === showArchived;
      return matchesSearch && matchesArchive;
    });
  }, [students, searchTerm, showArchived]);

  const { currentItems, totalPages } = useMemo(() => {
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
    return { currentItems, totalPages };
  }, [filteredStudents, currentPage, itemsPerPage]);

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading student profiles...</div>;

  return (
    <div className="container">
      <div className="flex-responsive" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Student Profiles</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>View full interview records for each student.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            style={{ background: 'var(--accent-gradient)', fontSize: '0.85rem', padding: '0.75rem 1.25rem' }}
          >
            + Add Student
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.85rem', padding: '0.75rem 1.25rem' }}
          >
            📂 Import CSV
          </button>
          <button 
            onClick={() => setIsSelectionMode(true)}
            disabled={isSelectionMode}
            style={{ 
              background: isSelectionMode ? 'var(--bg-accent)' : 'rgba(255, 255, 255, 0.05)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border-color)', 
              fontSize: '0.85rem', 
              padding: '0.75rem 1.25rem',
              opacity: isSelectionMode ? 0.6 : 1
            }}
          >
            📥 Export CSV
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCSVUpload} 
            accept=".csv" 
            style={{ display: 'none' }} 
          />
        </div>
      </div>

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
            placeholder="Search by name or email..." 
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

      {isSelectionMode && (
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem 1.5rem', 
          background: 'var(--accent-gradient)', 
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          animation: 'slideDown 0.3s ease',
          boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
              <input 
                type="checkbox" 
                checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0} 
                onChange={toggleSelectAll} 
                style={{ width: '18px', height: '18px' }}
              />
              Select All
            </label>
            <span style={{ fontWeight: 600 }}>{selectedIds.length} students selected</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => handleCSVDownload(false)}
              style={{ background: 'white', color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: 700, padding: '0.6rem 1.25rem' }}
            >
              Export All
            </button>
            <button 
              onClick={() => handleCSVDownload(true)}
              disabled={selectedIds.length === 0}
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontSize: '0.85rem', fontWeight: 700, padding: '0.6rem 1.25rem', opacity: selectedIds.length === 0 ? 0.5 : 1 }}
            >
              Export Selected
            </button>
            <button 
              onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
              style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {filteredStudents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            {showArchived ? 'No archived students found.' : 'No active students found matching your search.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }}>
          {currentItems.map((student) => (
            <div 
              key={student.id} 
              className="card" 
              style={{ 
                display: 'flex', flexDirection: 'column', gap: '1.5rem', 
                background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', 
                border: selectedIds.includes(student.id) ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', 
                opacity: student.is_archived ? 0.8 : 1,
                position: 'relative'
              }}
            >
              {/* Selection Checkbox */}
              {isSelectionMode && (
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(student.id)} 
                  onChange={() => toggleSelection(student.id)}
                  style={{ position: 'absolute', top: '1rem', right: '1rem', width: '18px', height: '18px', zIndex: 2 }}
                />
              )}

              {/* Student Header Info */}
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '18px', 
                  overflow: 'hidden', 
                  background: 'var(--bg-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  border: student.is_archived ? '2px solid var(--text-secondary)' : '2px solid var(--accent-color)',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  {student.photo_url ? (
                    <img src={student.photo_url} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: student.is_archived ? 'var(--text-secondary)' : 'var(--accent-color)' }}>{student.name.charAt(0)}</span>
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, wordBreak: 'break-word', lineHeight: 1.2 }}>{student.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0', wordBreak: 'break-all' }}>{student.email}</p>
                </div>
              </div>

              {/* Stats Bar */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                padding: '0.75rem 1rem', 
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Sessions</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: student.is_archived ? 'var(--text-secondary)' : 'var(--accent-color)' }}>
                  {student.interview_assignments?.length || 0}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                <Link href={`/admin/students/${student.id}`} style={{ flex: 1 }}>
                  <button style={{ 
                    width: '100%', 
                    background: 'var(--bg-accent)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)', 
                    fontSize: '0.9rem', 
                    padding: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '10px'
                  }}>
                    View Full Record
                  </button>
                </Link>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleArchive(student.id, student.is_archived)}
                    title={student.is_archived ? 'Unarchive' : 'Archive'}
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      color: 'var(--text-secondary)', 
                      border: '1px solid var(--border-color)', 
                      width: '44px', 
                      height: '44px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      borderRadius: '10px', 
                      fontSize: '1.2rem', 
                      padding: 0,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {student.is_archived ? '📤' : '📥'}
                  </button>
                  {student.is_archived && (
                    <button 
                      onClick={() => handleDelete(student.id, student.name)}
                      title="Delete permanently"
                      style={{ 
                        background: 'rgba(244, 63, 94, 0.1)', 
                        color: 'var(--danger)', 
                        border: '1px solid rgba(244, 63, 94, 0.2)', 
                        width: '44px', 
                        height: '44px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        borderRadius: '10px', 
                        fontSize: '1rem', 
                        padding: 0 
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                {isSelectionMode && <th style={{ padding: '1rem', width: '40px' }}></th>}
                <th style={{ padding: '1rem' }}>Student</th>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Sessions</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((student) => (
                <tr 
                  key={student.id} 
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    background: selectedIds.includes(student.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                    opacity: student.is_archived ? 0.8 : 1
                  }}
                >
                  {isSelectionMode && (
                    <td style={{ padding: '1rem' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(student.id)} 
                        onChange={() => toggleSelection(student.id)}
                        style={{ width: '16px', height: '16px' }}
                      />
                    </td>
                  )}
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                        {student.photo_url ? <img src={student.photo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : student.name[0]}
                      </div>
                      <span style={{ fontWeight: 600 }}>{student.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{student.email}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ background: 'var(--bg-accent)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                      {student.interview_assignments?.length || 0}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link href={`/admin/students/${student.id}`}>
                        <button style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--bg-accent)' }}>View</button>
                      </Link>
                      <button 
                        onClick={() => handleArchive(student.id, student.is_archived)}
                        style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}
                      >
                        {student.is_archived ? '📤' : '📥'}
                      </button>
                      {student.is_archived && (
                        <button 
                          onClick={() => handleDelete(student.id, student.name)}
                          style={{ padding: '0.4rem 0.8rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', border: '1px solid rgba(244, 63, 94, 0.2)' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '1rem', 
          marginTop: '2.5rem', 
          padding: '1.5rem',
          background: 'var(--glass-bg)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          backdropFilter: 'blur(10px)'
        }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'auto' }); }}
            style={{ 
              padding: '0.6rem 1.25rem', 
              background: 'var(--bg-accent)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '10px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            Previous
          </button>
          
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', gap: '0.5rem' }}>
            Page <strong style={{ color: 'var(--text-primary)' }}>{currentPage}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
          </div>
          
          <button 
            disabled={currentPage === totalPages}
            onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'auto' }); }}
            style={{ 
              padding: '0.6rem 1.25rem', 
              background: 'var(--bg-accent)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '10px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1,
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '2rem'
        }}>
          <div className="card" style={{ maxWidth: '650px', width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Add New Students</h3>
              <button 
                onClick={addMoreRow}
                style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}
              >
                + Add More Rows
              </button>
            </div>

            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {newStudents.map((s, index) => (
                <div key={index} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1.5fr auto', 
                  gap: '1rem', 
                  alignItems: 'flex-end',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>Name</label>
                    <input 
                      required
                      placeholder="John Doe"
                      value={s.name}
                      onChange={(e) => updateStudentField(index, 'name', e.target.value)}
                      style={{ padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>Email</label>
                    <input 
                      required
                      type="email"
                      placeholder="john@example.com"
                      value={s.email}
                      onChange={(e) => updateStudentField(index, 'email', e.target.value)}
                      style={{ padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                    />
                  </div>
                  {newStudents.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeRow(index)}
                      style={{ background: 'transparent', color: 'var(--danger)', border: 'none', fontSize: '1.2rem', padding: '0.5rem' }}
                      title="Remove row"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem', 
                marginTop: '1rem', 
                position: 'sticky', 
                bottom: 0, 
                background: 'var(--bg-secondary)', 
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)'
              }}>
                <button 
                  type="button" 
                  onClick={() => { setIsAddModalOpen(false); setNewStudents([{ name: '', email: '' }]); }}
                  style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  {isSubmitting ? 'Adding...' : `Add ${newStudents.length} Students`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
