"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToSubmissions, deleteSubmission, updateSubmissionStatus } from '@/services/submissions';
import { getAllTeachersWithStats, getAllEvaluations } from '@/services/academicService';
import { 
  Download, 
  Filter, 
  Search, 
  Lock, 
  LogOut, 
  Eye, 
  X, 
  Trash2, 
  FileText,
  BarChart2,
  List,
  CheckCircle2,
  Clock,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions', 'academic', 'evaluations'
  const [submissions, setSubmissions] = useState([]);
  const [academicStats, setAcademicStats] = useState([]);
  const [allEvaluations, setAllEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterUbicacion, setFilterUbicacion] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending', 'completed', ''
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Authentication
  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === 'GalaAT08-01') { 
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Fetch Data
  useEffect(() => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    if (activeTab === 'submissions') {
      const unsubscribe = subscribeToSubmissions((data) => {
        setSubmissions(data);
        setLoading(false);
      });
      return () => unsubscribe();
    } else if (activeTab === 'academic') {
      const fetchAcademic = async () => {
        const data = await getAllTeachersWithStats();
        setAcademicStats(data);
        setLoading(false);
      };
      fetchAcademic();
    } else if (activeTab === 'evaluations') {
      const fetchEvals = async () => {
        const data = await getAllEvaluations();
        setAllEvaluations(data);
        setLoading(false);
      };
      fetchEvals();
    }
  }, [isAuthenticated, activeTab]);

  // Derived State (Filtered Submissions)
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchUbicacion = filterUbicacion ? sub.ubicacion === filterUbicacion : true;
      const matchTipo = filterTipo ? sub.tipoSolicitud === filterTipo : true;
      const matchStatus = filterStatus ? sub.status === filterStatus : true;
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = searchQuery 
        ? (sub.nombre?.toLowerCase().includes(searchLower) || sub.dni?.includes(searchQuery))
        : true;
        
      return matchUbicacion && matchTipo && matchSearch && matchStatus;
    });
  }, [submissions, filterUbicacion, filterTipo, searchQuery, filterStatus]);

  // Excel Date Helper
  const formatDateExcel = (ts) => {
    if (ts && typeof ts.toDate === 'function') {
      return format(ts.toDate(), 'yyyy-MM-dd HH:mm');
    }
    return 'N/A';
  };

  // Status Update
  const handleUpdateStatus = async (id, status) => {
    await updateSubmissionStatus(id, status);
  };

  // Export Submissions to Excel (Only Pending)
  const handleExportExcel = async () => {
    const pendingSubmissions = submissions.filter(s => s.status === 'pending');
    
    if (loading || pendingSubmissions.length === 0) {
      alert("No hay trámites pendientes para exportar.");
      return;
    }

    const dataToExport = pendingSubmissions.map(sub => ({
      Fecha: formatDateExcel(sub.createdAt),
      Nombre: sub.nombre,
      DNI: sub.dni,
      Celular: sub.celular || 'N/A',
      Mail: sub.mail || 'N/A',
      Carrera: sub.carrera,
      Sede: sub.ubicacion,
      Tipo_Trámite: sub.tipoSolicitud,
      Estado: 'Pendiente',
      Detalle_Solicitud: sub.descripcion
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pendientes");
    
    const wscols = Object.keys(dataToExport[0]).map(key => ({ wch: Math.max(key.length, 15) }));
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `MesaEntrada_PENDIENTES_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);

    // Bulk Completion Option
    if (window.confirm("¿Deseas marcar todos los trámites exportados como COMPLETADOS?")) {
      for (const sub of pendingSubmissions) {
        await updateSubmissionStatus(sub.id, 'completed');
      }
    }
  };

  // Export Academic Excellence
  const handleExportAcademicExcel = () => {
    if (loading || allEvaluations.length === 0) return;

    const dataToExport = allEvaluations.map(e => ({
      Fecha: formatDateExcel(e.createdAt),
      Carrera: e.carrera,
      Cátedra: e.catedra,
      Docente: e.teacherName,
      ICT: e.ict,
      NDC: e.ndc,
      CAT: e.cat,
      TCE: e.tce,
      Acción_Excelencia: e.accionExcelencia
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluaciones_Detalle");
    XLSX.writeFile(workbook, `Reporte_Excelencia_Detalle_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este registro?")) {
      await deleteSubmission(id);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ background: '#ffffff', padding: '48px', borderRadius: '2rem', textAlign: 'center', maxWidth: '450px', width: '90%', border: '4px solid #3f75ab', boxShadow: '0 40px 80px rgba(0,0,0,0.1)' }}>
          <div style={{ background: 'rgba(63, 117, 171, 0.1)', padding: '24px', borderRadius: '50%', display: 'inline-block', marginBottom: '24px' }}>
            <Lock size={48} color="#3f75ab" />
          </div>
          <h2 style={{ fontSize: '2rem', color: '#3f75ab', fontWeight: '950', marginBottom: '8px' }}>Admin Login</h2>
          <p style={{ color: '#4b5563', marginBottom: '32px', fontWeight: '600' }}>Acceso reservado para la gestión institucional.</p>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="glass-input"
              placeholder="PIN DE SEGURIDAD"
              autoFocus
              style={{ textAlign: 'center', letterSpacing: '12px', fontSize: '1.5rem', marginBottom: '24px', border: '3px solid #3f75ab', color: '#000' }}
            />
            {pinError && <p style={{ color: '#ef5f27', fontWeight: '800', marginBottom: '16px' }}>PIN INCORRECTO</p>}
            <button type="submit" className="glass-button" style={{ width: '100%', background: '#3f75ab', color: '#fff', padding: '16px', borderRadius: '1rem', fontSize: '1.2rem', fontWeight: '900' }}>ENTRAR AL PANEL</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1400px', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: '950', color: '#3f75ab', letterSpacing: '-0.04em', margin: 0 }}>GALA Dashboard</h1>
          <p style={{ fontSize: '1.2rem', color: '#4b5563', fontWeight: '700', margin: 0 }}>Gestión Institucional de Alternativa Tecnológica</p>
        </div>
        <button className="glass-button" style={{ background: '#000', color: '#fff', borderRadius: '1rem', padding: '12px 24px' }} onClick={() => setIsAuthenticated(false)}>
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
        {[
          { id: 'submissions', label: 'Mesa de Entrada', icon: FileText },
          { id: 'academic', label: 'Métricas de Cátedra', icon: BarChart2 },
          { id: 'evaluations', label: 'Log de Excelencia', icon: List }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              flex: 1, 
              padding: '20px', 
              borderRadius: '1.5rem', 
              fontSize: '1.1rem', 
              fontWeight: '900',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px',
              background: activeTab === tab.id ? '#3f75ab' : '#ffffff',
              color: activeTab === tab.id ? '#fff' : '#4b5563',
              border: '3px solid #3f75ab',
              transition: 'all 0.3s'
            }}
          >
            <tab.icon size={24} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'submissions' && (
        <div className="animate-fade-in">
          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '2rem', border: '2px solid #e5e7eb', marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={20} />
              <input type="text" placeholder="Buscar por DNI o Nombre..." className="glass-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: '48px', width: '100%', borderRadius: '1rem' }} />
            </div>
            
            <select className="glass-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ flex: '1 1 150px', borderRadius: '1rem' }}>
              <option value="pending">Solo Pendientes</option>
              <option value="completed">Solo Completados</option>
              <option value="">Todos los estados</option>
            </select>

            <button className="glass-button" style={{ background: '#ef5f27', color: '#fff', borderRadius: '1rem', border: 'none' }} onClick={handleExportExcel}>
              <Download size={18} /> Exportar Pendientes (.xlsx)
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '2rem', overflow: 'hidden', border: '2px solid #e5e7eb', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #3f75ab' }}>
                  <th style={{ padding: '24px', textAlign: 'left', fontWeight: '900', color: '#3f75ab' }}>Fecha</th>
                  <th style={{ padding: '24px', textAlign: 'left', fontWeight: '900', color: '#3f75ab' }}>Estudiante</th>
                  <th style={{ padding: '24px', textAlign: 'left', fontWeight: '900', color: '#3f75ab' }}>Trámite</th>
                  <th style={{ padding: '24px', textAlign: 'center', fontWeight: '900', color: '#3f75ab' }}>Estado</th>
                  <th style={{ padding: '24px', textAlign: 'right', fontWeight: '900', color: '#3f75ab' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map(sub => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '24px', fontWeight: '700', color: '#6b7280' }}>{formatDateExcel(sub.createdAt)}</td>
                    <td style={{ padding: '24px' }}>
                      <div style={{ fontWeight: '900', color: '#000' }}>{sub.nombre}</div>
                      <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>DNI: {sub.dni} | {sub.carrera}</div>
                    </td>
                    <td style={{ padding: '24px' }}>
                      <span style={{ background: '#f3f4f6', padding: '6px 12px', borderRadius: '2rem', fontSize: '0.9rem', fontWeight: '800', color: '#3f75ab' }}>{sub.tipoSolicitud}</span>
                    </td>
                    <td style={{ padding: '24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {sub.status === 'completed' ? (
                          <span style={{ color: '#10b981', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={18} /> COMPLETADO</span>
                        ) : (
                          <span style={{ color: '#f59e0b', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={18} /> PENDIENTE</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button onClick={() => setSelectedSubmission(sub)} style={{ background: '#f3f4f6', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><Eye size={20} /></button>
                        {sub.status === 'pending' && (
                          <button onClick={() => handleUpdateStatus(sub.id, 'completed')} style={{ background: '#3f75ab', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', color: '#fff' }}><ChevronRight size={20} /></button>
                        )}
                        <button onClick={() => handleDelete(sub.id)} style={{ background: 'rgba(239, 95, 39, 0.1)', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', color: '#ef5f27' }}><Trash2 size={20} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'academic' && (
        <div className="animate-fade-in">
          <div style={{ background: '#ffffff', borderRadius: '2rem', overflow: 'hidden', border: '2px solid #e5e7eb', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #3f75ab' }}>
                  <th style={{ padding: '24px', textAlign: 'left', fontWeight: '900', color: '#3f75ab' }}>Cátedra / Materia</th>
                  <th style={{ padding: '24px', textAlign: 'center', fontWeight: '900', color: '#3f75ab' }}>Evals</th>
                  <th style={{ padding: '24px', textAlign: 'center', fontWeight: '900', color: '#3f75ab' }}>Promedio</th>
                  <th style={{ padding: '24px', textAlign: 'left', fontWeight: '900', color: '#3f75ab' }}>Desglose de Calidad</th>
                </tr>
              </thead>
              <tbody>
                {academicStats.filter(t => t.stats.count > 0).map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '24px' }}>
                      <div style={{ fontWeight: '900', color: '#000', fontSize: '1.1rem' }}>{t.catedra}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{t.carrera}</div>
                    </td>
                    <td style={{ padding: '24px', textAlign: 'center', fontWeight: '900' }}>{t.stats.count}</td>
                    <td style={{ padding: '24px', textAlign: 'center' }}>
                      <span style={{ background: '#3f75ab', color: '#fff', padding: '8px 16px', borderRadius: '2rem', fontWeight: '900' }}>{t.stats.promedioGeneral.toFixed(2)}</span>
                    </td>
                    <td style={{ padding: '24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {[
                          { label: 'ICT', val: t.stats.ict },
                          { label: 'NDC', val: t.stats.ndc },
                          { label: 'CAT', val: t.stats.cat },
                          { label: 'TCE', val: t.stats.tce }
                        ].map(m => (
                          <div key={m.label} style={{ textAlign: 'center', background: '#f9fafb', padding: '8px', borderRadius: '10px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#3f75ab' }}>{m.label}</div>
                            <div style={{ fontWeight: '900' }}>{m.val.toFixed(1)}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'evaluations' && (
        <div className="animate-fade-in">
          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '2rem', border: '2px solid #e5e7eb', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.5rem' }}>Registro Individual de Evaluaciones</h3>
            <button className="glass-button" style={{ background: '#3f75ab', color: '#fff' }} onClick={handleExportAcademicExcel}>
              <Download size={18} /> Exportar Log Completo (.xlsx)
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '2rem', overflow: 'hidden', border: '2px solid #e5e7eb', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #3f75ab' }}>
                  <th style={{ padding: '24px', textAlign: 'left', fontWeight: '900', color: '#3f75ab' }}>Fecha</th>
                  <th style={{ padding: '24px', textAlign: 'left', fontWeight: '900', color: '#3f75ab' }}>Cátedra / Carrera</th>
                  <th style={{ padding: '24px', textAlign: 'center', fontWeight: '900', color: '#3f75ab' }}>Puntajes</th>
                  <th style={{ padding: '24px', textAlign: 'left', fontWeight: '900', color: '#3f75ab' }}>Acción para la Excelencia</th>
                </tr>
              </thead>
              <tbody>
                {allEvaluations.map(evalu => (
                  <tr key={evalu.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '24px', fontWeight: '700', color: '#6b7280', fontSize: '0.85rem' }}>{formatDateExcel(evalu.createdAt)}</td>
                    <td style={{ padding: '24px' }}>
                      <div style={{ fontWeight: '900', color: '#000' }}>{evalu.catedra}</div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{evalu.carrera}</div>
                    </td>
                    <td style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {[
                          { l: 'I', v: evalu.ict },
                          { l: 'N', v: evalu.ndc },
                          { l: 'C', v: evalu.cat },
                          { l: 'T', v: evalu.tce }
                        ].map(p => (
                          <div key={p.l} style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#3f75ab' }}>{p.l}</div>
                            <div style={{ fontWeight: '900', fontSize: '0.85rem' }}>{p.v}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '24px' }}>
                      <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '1rem', border: '1px dashed #d1d5db' }}>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#1f2937', fontWeight: '600', lineHeight: '1.4' }}>
                          {evalu.accionExcelencia || <span style={{ opacity: 0.4, fontStyle: 'italic' }}>Sin feedback cualitativo.</span>}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSubmission && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '2.5rem', width: '100%', maxWidth: '700px', padding: '48px', position: 'relative', border: '4px solid #3f75ab' }}>
            <button onClick={() => setSelectedSubmission(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={32} /></button>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '950', color: '#3f75ab', marginBottom: '32px', letterSpacing: '-0.04em' }}>Detalle de Solicitud</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '900', color: '#6b7280', textTransform: 'uppercase' }}>Estudiante</label>
                <div style={{ fontSize: '1.3rem', fontWeight: '900' }}>{selectedSubmission.nombre}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '900', color: '#6b7280', textTransform: 'uppercase' }}>DNI</label>
                <div style={{ fontSize: '1.3rem', fontWeight: '900' }}>{selectedSubmission.dni}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '900', color: '#6b7280', textTransform: 'uppercase' }}>Carrera</label>
                <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{selectedSubmission.carrera}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '900', color: '#6b7280', textTransform: 'uppercase' }}>Sede</label>
                <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{selectedSubmission.ubicacion}</div>
              </div>
            </div>

            <div style={{ background: '#f3f4f6', padding: '32px', borderRadius: '1.5rem', marginBottom: '32px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '900', color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Motivo / Descripción</label>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600', lineHeight: '1.6' }}>{selectedSubmission.descripcion}</p>
            </div>

            {selectedSubmission.status === 'pending' && (
              <button 
                onClick={async () => {
                  await handleUpdateStatus(selectedSubmission.id, 'completed');
                  setSelectedSubmission(null);
                }}
                style={{ width: '100%', background: '#10b981', color: '#fff', padding: '20px', borderRadius: '1.25rem', fontSize: '1.4rem', fontWeight: '950', border: 'none', cursor: 'pointer' }}
              >
                MARCAR COMO COMPLETADO
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
