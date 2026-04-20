'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function AssignFolderAccess() {
  const router = useRouter();
  const { showToast } = useUI();
  const params = useParams();
  const folderId = params.id as string;

  const [folder, setFolder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [assignType, setAssignType] = useState<'individual' | 'batch'>('individual');

  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [existingAssignments, setExistingAssignments] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchExistingAssignments();
  }, [folderId]);

  const fetchExistingAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('study_material_folder_assignments')
        .select(`
          id,
          student_id,
          group_id,
          students (name, email),
          groups (name)
        `)
        .eq('folder_id', folderId);
      
      if (error) throw error;
      setExistingAssignments(data || []);
    } catch (err: any) {
      console.error('Error fetching existing assignments:', err);
    }
  };

  const fetchData = async () => {
    // 1. Fetch folder
    const { data: folderData } = await supabase.from('study_material_folders').select('*').eq('id', folderId).single();
    if (folderData) setFolder(folderData);

    // 2. Fetch batches
    const { data: batchData } = await supabase.from('groups').select('*').order('name');
    if (batchData) setBatches(batchData);

    // 3. Fetch students
    const { data: studentData } = await supabase.from('students').select('*').order('name');
    if (studentData) setRegisteredStudents(studentData);
  };

  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      showToast('Please select at least one student.', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Filter out students who already have access
      const alreadyAssignedIds = existingAssignments.map(a => a.student_id);
      const newStudentIds = selectedStudentIds.filter(id => !alreadyAssignedIds.includes(id));

      if (newStudentIds.length === 0) {
        showToast('All selected students already have access.', 'warning');
        setLoading(false);
        return;
      }

      const assignments = newStudentIds.map(sid => ({
        folder_id: folderId,
        student_id: sid,
      }));

      const { error } = await supabase.from('study_material_folder_assignments').insert(assignments);
      if (error) throw error;

      // Notify students
      const notifications = newStudentIds.map(sid => ({
        student_id: sid,
        title: 'New Folder Shared',
        message: `Admin shared a folder with you: ${folder?.name}`,
        link: '/student/study-material'
      }));
      await supabase.from('notifications').insert(notifications);

      showToast('Folder assigned successfully!', 'success');
      fetchExistingAssignments();
      setSelectedStudentIds([]);
    } catch (err: any) {
      showToast('Assignment failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) {
      showToast('Please select a batch.', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      // Check if already assigned
      if (existingAssignments.some(a => a.group_id === selectedBatchId)) {
        showToast('This batch already has access.', 'warning');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('study_material_folder_assignments').insert({
        folder_id: folderId,
        group_id: selectedBatchId
      });
      if (error) throw error;

      // Notify students in batch
      const { data: members } = await supabase
        .from('group_members')
        .select('student_id')
        .eq('group_id', selectedBatchId);
      
      if (members && members.length > 0) {
        const notifications = members.map(m => ({
          student_id: m.student_id,
          title: 'New Folder Shared',
          message: `Admin shared a folder with your batch: ${folder?.name}`,
          link: '/student/study-material'
        }));
        await supabase.from('notifications').insert(notifications);
      }

      showToast('Folder assigned to batch successfully!', 'success');
      fetchExistingAssignments();
      setSelectedBatchId('');
    } catch (err: any) {
      showToast('Batch assignment failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('study_material_folder_assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      showToast('Access revoked', 'success');
      fetchExistingAssignments();
    } catch (err: any) {
      showToast('Action failed: ' + err.message, 'error');
    }
  };

  const filteredStudents = registeredStudents.filter(s => {
    const isSearchMatch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          s.email.toLowerCase().includes(studentSearch.toLowerCase());
    const isAlreadyAssigned = existingAssignments.some(a => a.student_id === s.id);
    return isSearchMatch && !isAlreadyAssigned;
  });

  return (
    <div className="container" style={{ maxWidth: '1450px' }}>
      <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Folder Access Control</h1>
          {folder && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <span style={{ 
                padding: '0.3rem 0.8rem', 
                borderRadius: '8px', 
                background: 'rgba(59, 130, 246, 0.1)', 
                color: 'var(--accent-color)',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>FOLDER</span>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{folder.name}</p>
            </div>
          )}
        </div>
        <button 
          onClick={() => router.back()} 
          style={{ 
            background: 'var(--bg-secondary)', 
            color: 'var(--text-primary)', 
            width: '45px', 
            height: '45px', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            border: '1px solid var(--border-color)'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '3rem', alignItems: 'start' }}>
        {/* Left Col: Assignment Form */}
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setAssignType('individual')}
              style={{ 
                flex: 1,
                background: assignType === 'individual' ? 'var(--accent-gradient)' : 'transparent', 
                color: '#fff', 
                padding: '0.6rem', 
                borderRadius: '8px', 
                fontWeight: 700, 
                fontSize: '0.85rem'
              }}
            >
              Students
            </button>
            <button 
              onClick={() => setAssignType('batch')}
              style={{ 
                flex: 1,
                background: assignType === 'batch' ? 'var(--accent-gradient)' : 'transparent', 
                color: '#fff', 
                padding: '0.6rem', 
                borderRadius: '8px', 
                fontWeight: 700, 
                fontSize: '0.85rem'
              }}
            >
              Batches
            </button>
          </div>

          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
            <form onSubmit={assignType === 'individual' ? handleIndividualSubmit : handleBatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {assignType === 'individual' ? (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>New Access</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 700 }}>
                        {selectedStudentIds.length} Selected
                      </span>
                    </div>
                    
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                      <input 
                        type="text" 
                        placeholder="Search students..." 
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        style={{ height: '45px', background: 'rgba(0,0,0,0.2)', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div style={{ 
                      maxHeight: '400px', 
                      overflowY: 'auto', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px', 
                      background: 'rgba(0,0,0,0.1)',
                      padding: '0.25rem'
                    }}>
                      {filteredStudents.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {registeredStudents.length > 0 ? "All available students already have access" : "No students found"}
                        </div>
                      ) : (
                        filteredStudents.map(student => {
                          const isSelected = selectedStudentIds.includes(student.id);
                          return (
                            <div 
                              key={student.id} 
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                                } else {
                                  setSelectedStudentIds(prev => [...prev, student.id]);
                                }
                              }}
                              className="student-item"
                              style={{ 
                                padding: '0.6rem 0.75rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.75rem', 
                                cursor: 'pointer', 
                                borderRadius: '8px',
                                background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                                marginBottom: '0.2rem'
                              }}
                            >
                              <div style={{ 
                                width: '18px', 
                                height: '18px', 
                                border: `2px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}`, 
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isSelected ? 'var(--accent-color)' : 'transparent'
                              }}>
                                {isSelected && <span style={{ color: '#fff', fontSize: '0.6rem' }}>✓</span>}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{student.email}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                </div>
              ) : (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}>Target Batch</label>
                  <select 
                    required 
                    value={selectedBatchId} 
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    style={{ height: '50px', fontSize: '0.9rem' }}
                  >
                    <option value="">-- Choose a batch --</option>
                    {batches.filter(b => !existingAssignments.some(a => a.group_id === b.id)).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                  width: '100%',
                  background: 'var(--accent-gradient)', 
                  padding: '0.9rem', 
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  borderRadius: '10px'
                }}
              >
                {loading ? 'Processing...' : 'Share Resource'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Currently Assigned Access */}
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div className="flex-between" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>Current Access Control</h2>
            <span style={{ color: 'var(--text-secondary)', fontSize: '1rem', background: 'var(--bg-secondary)', padding: '0.4rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              {existingAssignments.length} total records
            </span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '3rem' }}>
            {/* Students List */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-color)', boxShadow: '0 0 10px var(--accent-color)' }}></div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, letterSpacing: '0.02em' }}>Individual Students</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '700px', overflowY: 'auto', paddingRight: '0.75rem' }}>
                {existingAssignments.filter(a => a.student_id).length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.05)', borderStyle: 'dashed' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No individual access granted</p>
                  </div>
                ) : (
                  existingAssignments.filter(a => a.student_id).map(a => (
                    <div key={a.id} className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', transition: 'all 0.3s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', boxShadow: '0 5px 15px rgba(59, 130, 246, 0.3)' }}>
                          {a.students?.name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{a.students?.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.students?.email}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteAssignment(a.id)}
                        className="revoke-btn"
                        style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '0.6rem 1rem', borderRadius: '10px', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 800, border: '1px solid rgba(244, 63, 94, 0.2)' }}
                      >Revoke Access</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Batches List */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }}></div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, letterSpacing: '0.02em' }}>Batches</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {existingAssignments.filter(a => a.group_id).length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.05)', borderStyle: 'dashed' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No batch access granted</p>
                  </div>
                ) : (
                  existingAssignments.filter(a => a.group_id).map(a => (
                    <div key={a.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.2rem', marginBottom: '0.25rem' }}>{a.groups?.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Shared with all members</div>
                      </div>
                      <button 
                        onClick={() => handleDeleteAssignment(a.id)}
                        className="revoke-btn"
                        style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '0.6rem 1rem', borderRadius: '10px', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 800, border: '1px solid rgba(244, 63, 94, 0.2)' }}
                      >Revoke</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .student-item:hover {
          background: rgba(255, 255, 255, 0.03) !important;
          transform: translateX(5px);
        }
        .revoke-btn {
          transition: all 0.2s ease;
        }
        .revoke-btn:hover {
          background: var(--danger) !important;
          color: white !important;
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(244, 63, 94, 0.3);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
