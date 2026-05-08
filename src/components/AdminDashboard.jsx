"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { adminSkill } from '@/lib/firebase/skills/adminSkill';
import { evaluacionSkill } from '@/lib/firebase/skills/evaluacionSkill';
import { logoutAdmin, subscribeToAuthChanges } from '@/services/auth';
import { getAllEvaluations } from '@/services/academicService';
import { getInstitutionalStatus, formatMetric } from '@/lib/utils';
import AdminLogin from './AdminLogin';
import AnalyticsView from './AnalyticsView';
import { 
  Download, 
  Search, 
  LogOut, 
  Eye, 
  X, 
  Trash2, 
  Inbox,
  BarChart2,
  History,
  CheckCircle2,
  Clock,
  MessageSquare,
  Loader2,
  TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('submissions'); 
  const [submissions, setSubmissions] = useState([]);
  const [academicStats, setAcademicStats] = useState([]);
  const [allEvaluations, setAllEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting with Persistence
  const [academicSortField, setAcademicSortField] = useState('catedra');
  const [academicSortOrder, setAcademicSortOrder] = useState('asc');
  
  // Persisted Filter: Carrera
  const [academicFilterCarrera, setAcademicFilterCarrera] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gala_filter_carrera') || '';
    }
    return '';
  });

  const [academicSearch, setAcademicSearch] = useState('');
  const [evalSortField, setEvalSortField] = useState('createdAt');
  const [evalSortOrder, setEvalSortOrder] = useState('desc');
  const [evalSearch, setEvalSearch] = useState('');

  const [filterUbicacion, setFilterUbicacion] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Persist Filter on Change
  useEffect(() => {
    localStorage.setItem('gala_filter_carrera', academicFilterCarrera);
  }, [academicFilterCarrera]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data using Skills
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    let unsubscribeSub = null;

    const fetchData = async () => {
      try {
        if (activeTab === 'submissions' || activeTab === 'analytics') {
          unsubscribeSub = adminSkill.subscribeSubmissions(
            (data) => {
              setSubmissions(data);
              if (activeTab === 'submissions') setLoading(false);
            },
            (error) => {
              console.error("Error en listener de trámites:", error);
              setLoading(false);
            }
          );
        }

        if (activeTab === 'academic') {
          const data = await evaluacionSkill.getCatedrasWithStats();
          setAcademicStats(data);
          setLoading(false);
        } else if (activeTab === 'evaluations') {
          const evaluationsData = await getAllEvaluations();
          setAllEvaluations(evaluationsData);
          setLoading(false);
        } else if (activeTab === 'analytics') {
          const [stats, evals] = await Promise.all([
            evaluacionSkill.getCatedrasWithStats(),
            getAllEvaluations()
          ]);
          setAcademicStats(stats);
          setAllEvaluations(evals);
          // setLoading se llama dentro del listener de submissions arriba
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        setLoading(false);
      }
    };
    
    fetchData();
    return () => {
      if (unsubscribeSub) unsubscribeSub();
    };
  }, [user, activeTab]);

  const sortData = (data, field, order) => {
    return [...data].sort((a, b) => {
      let valA = field.split('.').reduce((obj, key) => obj?.[key], a);
      let valB = field.split('.').reduce((obj, key) => obj?.[key], b);
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const processedAcademic = useMemo(() => {
    // Escaneo de trazabilidad en frontend
    console.log('[Dashboard] Datos para tabla academic:', academicStats);
    
    if (!academicStats || academicStats.length === 0) return [];

    let filtered = academicStats.filter(t => (t.stats?.count || t.evaluacionesCount || 0) > 0);
    
    if (academicFilterCarrera) {
      filtered = filtered.filter(t => t.carrera === academicFilterCarrera);
    }
    
    if (academicSearch) {
      const searchLower = academicSearch.toLowerCase();
      filtered = filtered.filter(t => 
        (t.catedraNombre || t.catedra || "").toLowerCase().includes(searchLower)
      );
    }
    
    const sorted = sortData(filtered, academicSortField, academicSortOrder);
    console.log('[Dashboard] Cátedras tras filtros:', sorted.length);
    return sorted;
  }, [academicStats, academicFilterCarrera, academicSearch, academicSortField, academicSortOrder]);

  const kpisSubmissions = useMemo(() => {
    const total = submissions.length;
    const completed = submissions.filter(s => s.status === 'completed').length;
    const tasa = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
    const sla = adminSkill.calculateSLA(submissions);
    return { total, tasa, sla };
  }, [submissions]);

  const processedEvaluations = useMemo(() => {
    let filtered = allEvaluations;
    if (academicFilterCarrera) filtered = filtered.filter(e => e.carrera === academicFilterCarrera);
    if (evalSearch) filtered = filtered.filter(e => e.catedra.toLowerCase().includes(evalSearch.toLowerCase()));
    return sortData(filtered, evalSortField, evalSortOrder);
  }, [allEvaluations, academicFilterCarrera, evalSearch, evalSortField, evalSortOrder]);

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

  const formatDate = (ts) => {
    if (ts && typeof ts.toDate === 'function') {
      return format(ts.toDate(), 'dd/MM/yyyy HH:mm');
    }
    return 'N/A';
  };

  const handleUpdateStatus = async (id, status) => {
    await adminSkill.updateStatus(id, status);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este registro?")) {
      await adminSkill.deleteRecord(id);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
  };

  // Professional Export with Institutional Headers
  const handleExportExcel = async () => {
    const pendingSubmissions = submissions.filter(s => s.status === 'pending');
    
    if (loading || pendingSubmissions.length === 0) {
      alert("No hay trámites pendientes para exportar.");
      return;
    }

    const reportData = adminSkill.prepareExportData(pendingSubmissions);

    const metadata = [
      ["ALTERNATIVA TECNOLÓGICA - GESTIÓN INSTITUCIONAL"],
      ["REPORTE DE MESA DE ENTRADA DIGITAL"],
      [`Fecha de Generación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`],
      [""],
      ["Fecha", "Estudiante", "DNI", "Carrera", "Sede", "Trámite", "Estado", "Descripción"]
    ];

    const wsData = [...metadata, ...reportData.map(r => Object.values(r))];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trámites");
    
    XLSX.writeFile(workbook, `GALA_MesaEntrada_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);

    if (window.confirm("¿Deseas marcar todos los trámites exportados como COMPLETADOS?")) {
      for (const sub of pendingSubmissions) {
        await adminSkill.updateStatus(sub.id, 'completed');
      }
    }
  };

  const handleExportAcademicSummary = () => {
    if (loading || processedAcademic.length === 0) return;

    const metadata = [
      ["ALTERNATIVA TECNOLÓGICA - GESTIÓN ESTRATÉGICA"],
      ["RESUMEN CONSOLIDADO DE EXCELENCIA ACADÉMICA"],
      [`Fecha de Reporte: ${format(new Date(), 'dd/MM/yyyy')}`],
      [""],
      ["Carrera", "Cátedra", "Evaluaciones", "Promedio Gral", "ICT", "NDC", "CAT", "TCE", "Feedback"]
    ];

    const dataRows = processedAcademic.map(t => [
      t.carrera,
      t.catedra,
      t.stats.count,
      formatMetric(t.stats.promedioGeneral),
      formatMetric(t.stats.ict),
      formatMetric(t.stats.ndc),
      formatMetric(t.stats.cat),
      formatMetric(t.stats.tce),
      (t.stats.feedback || []).join(" | ")
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([...metadata, ...dataRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resumen_Cátedras");
    XLSX.writeFile(workbook, `GALA_Excelencia_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const MetricGlossary = () => (
    <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '1.5rem', border: '2px solid #e2e8f0', marginBottom: '32px' }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#3f75ab', fontWeight: '900', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageSquare size={20} /> Referencia de Evaluación
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {[
          { s: 'ICT', t: 'Claridad Conceptual', d: 'Evalúa la capacidad de la cátedra para transmitir conocimientos de forma clara y aplicada.' },
          { s: 'NDC', t: 'Disponibilidad de Material', d: 'Mide la integración tecnológica y organización del material digital.' },
          { s: 'CAT', t: 'Criterio de Evaluación', d: 'Evalúa la coherencia entre lo enseñado y lo evaluado en los exámenes.' },
          { s: 'TCE', t: 'Empatía y Sugerencias', d: 'Mide el trato humano, el compromiso y la predisposición para resolver dudas.' }
        ].map(item => (
          <div key={item.s}>
            <div style={{ fontWeight: '900', color: '#000', fontSize: '0.9rem' }}>{item.s}: {item.t}</div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>{item.d}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '16px', display: 'flex', gap: '24px', padding: '12px 0', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '800' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></span> 3.8 - 5.0: Excelente
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '800' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></span> 2.6 - 3.7: Aceptable
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '800' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></span> 1.0 - 2.5: Crítico
        </div>
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Loader2 className="animate-spin" size={48} color="#3f75ab" />
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  return (
    <div className="container" style={{ maxWidth: '1400px', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: '950', color: '#3f75ab', letterSpacing: '-0.04em', margin: 0 }}>GALA Dashboard</h1>
          <p style={{ fontSize: '1.2rem', color: '#4b5563', fontWeight: '700', margin: 0 }}>Gestión Institucional de Alternativa Tecnológica</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3f75ab', fontWeight: '700' }}>
              <Loader2 className="animate-spin" size={20} />
              <span>Cargando métricas institucionales...</span>
            </div>
          )}
          <button className="glass-button" style={{ background: '#000', color: '#fff', borderRadius: '1rem', padding: '12px 24px' }} onClick={handleLogout}>
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
        {[
          { id: 'submissions', label: 'Mesa de Entrada', icon: Inbox },
          { id: 'academic', label: 'Métricas de Cátedra', icon: BarChart2 },
          { id: 'evaluations', label: 'Log de Excelencia', icon: History },
          { id: 'analytics', label: 'Inteligencia Analítica', icon: TrendingUp }
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

      {/* Views */}
      {activeTab === 'submissions' && (
        <div className="animate-fade-in">
          {/* KPI Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '1.5rem', border: '2px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ background: '#3f75ab15', padding: '10px', borderRadius: '1rem', color: '#3f75ab' }}>
                  <Inbox size={24} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase' }}>Histórico</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '950', color: '#1f2937' }}>{kpisSubmissions.total}</div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '700' }}>Trámites Recibidos</div>
            </div>

            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '1.5rem', border: '2px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ background: '#10b98115', padding: '10px', borderRadius: '1rem', color: '#10b981' }}>
                  <CheckCircle2 size={24} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase' }}>Eficiencia</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '950', color: '#1f2937' }}>{kpisSubmissions.tasa}%</div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '700' }}>Tasa de Resolución</div>
            </div>

            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '1.5rem', border: '2px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ background: '#3f75ab15', padding: '10px', borderRadius: '1rem', color: '#3f75ab' }}>
                  <Clock size={24} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase' }}>SLA Gestión</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '950', color: '#3f75ab' }}>{kpisSubmissions.sla}</div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '700' }}>Tiempo de Respuesta</div>
            </div>
          </div>

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
                    <td style={{ padding: '24px', fontWeight: '700', color: '#6b7280' }}>{formatDate(sub.createdAt)}</td>
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
                        <button onClick={() => setSelectedSubmission(sub)} className="glass-button-icon" style={{ color: '#3f75ab' }}><Eye size={22} /></button>
                        <button 
                          onClick={() => sub.status === 'pending' && handleUpdateStatus(sub.id, 'completed')} 
                          disabled={sub.status === 'completed'}
                          className="glass-button-icon"
                          style={{ 
                            background: sub.status === 'completed' ? '#10b981' : '#3f75ab', 
                            color: '#fff',
                            opacity: sub.status === 'completed' ? 0.7 : 1
                          }}
                        >
                          <CheckCircle2 size={22} />
                        </button>
                        <button onClick={() => handleDelete(sub.id)} className="glass-button-icon" style={{ color: '#ef5f27', background: 'rgba(239, 95, 39, 0.1)' }}><Trash2 size={22} /></button>
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
          <MetricGlossary />
          
          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '2rem', border: '2px solid #e5e7eb', marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={20} />
              <input type="text" placeholder="Buscar Cátedra..." className="glass-input" value={academicSearch} onChange={(e) => setAcademicSearch(e.target.value)} style={{ paddingLeft: '48px', width: '100%', borderRadius: '1rem' }} />
            </div>
            <select className="glass-input" value={academicFilterCarrera} onChange={(e) => setAcademicFilterCarrera(e.target.value)} style={{ flex: '1 1 200px', borderRadius: '1rem' }}>
              <option value="">Todas las Carreras</option>
              <option value="Ingeniería en Sistemas de Información">Sistemas</option>
              <option value="Ingeniería Electrónica">Electrónica</option>
            </select>
            <button className="glass-button" style={{ background: '#3f75ab', color: '#fff' }} onClick={handleExportAcademicSummary}><Download size={18} /> Exportar Resumen</button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '2rem', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #3f75ab' }}>
                  <th style={{ padding: '24px', textAlign: 'left', fontWeight: '900', color: '#3f75ab' }}>Cátedra / Materia</th>
                  <th style={{ padding: '24px', textAlign: 'center', fontWeight: '900', color: '#3f75ab' }}>Evaluaciones</th>
                  <th style={{ padding: '24px', textAlign: 'center', fontWeight: '900', color: '#3f75ab' }}>Promedio</th>
                  <th style={{ padding: '24px', textAlign: 'left', fontWeight: '900', color: '#3f75ab' }}>Desglose de Calidad</th>
                </tr>
              </thead>
              <tbody>
                {processedAcademic.map(t => {
                  const statusInfo = getInstitutionalStatus(t.stats.promedioGeneral);
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '24px' }}>
                        <div style={{ fontWeight: '900', color: '#000', fontSize: '1.1rem' }}>{t.catedraNombre || t.catedra}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{t.carrera}</div>
                      </td>
                      <td style={{ padding: '24px', textAlign: 'center', fontWeight: '900' }}>{t.evaluacionesCount || t.stats?.count || 0}</td>
                      <td style={{ padding: '24px', textAlign: 'center' }}>
                        <span style={{ background: statusInfo.bg, color: statusInfo.text, padding: '8px 16px', borderRadius: '2rem', fontWeight: '900', border: `2px solid ${statusInfo.text}20` }}>
                          {formatMetric(t.promedioGeneral || t.stats?.promedioGeneral)}
                        </span>
                      </td>
                      <td style={{ padding: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                          {[
                            { l: 'ICT', v: t.desglose?.ICT || t.stats?.ict },
                            { l: 'NDC', v: t.desglose?.NDC || t.stats?.ndc },
                            { l: 'CAT', v: t.desglose?.CAT || t.stats?.cat },
                            { l: 'TCE', v: t.desglose?.TCE || t.stats?.tce }
                          ].map(m => {
                            const mStatus = getInstitutionalStatus(m.v);
                            return (
                              <div key={m.l} style={{ textAlign: 'center', background: mStatus.bg, padding: '8px', borderRadius: '10px' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: mStatus.text }}>{m.l}</div>
                                <div style={{ fontWeight: '900', color: mStatus.text }}>{formatMetric(m.v)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'evaluations' && (
        <div className="animate-fade-in">
          <MetricGlossary />
          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '2rem', border: '2px solid #e5e7eb', marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={20} />
              <input type="text" placeholder="Buscar por Cátedra..." className="glass-input" value={evalSearch} onChange={(e) => setEvalSearch(e.target.value)} style={{ paddingLeft: '48px', width: '100%', borderRadius: '1rem' }} />
            </div>
            <select className="glass-input" value={academicFilterCarrera} onChange={(e) => setAcademicFilterCarrera(e.target.value)} style={{ flex: '1 1 200px', borderRadius: '1rem' }}>
              <option value="">Todas las Carreras</option>
              <option value="Ingeniería en Sistemas de Información">Sistemas</option>
              <option value="Ingeniería Electrónica">Electrónica</option>
            </select>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '2rem', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
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
                {processedEvaluations.map(evalu => (
                  <tr key={evalu.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '24px', fontWeight: '700', color: '#6b7280', fontSize: '0.85rem' }}>{formatDate(evalu.createdAt)}</td>
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
                          <div key={p.l} style={{ background: getInstitutionalStatus(p.v).bg, padding: '4px 8px', borderRadius: '6px', textAlign: 'center', minWidth: '36px' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: '900', color: getInstitutionalStatus(p.v).text }}>{p.l}</div>
                            <div style={{ fontWeight: '900', fontSize: '0.85rem', color: getInstitutionalStatus(p.v).text }}>{formatMetric(p.v)}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '24px' }}>
                      <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '1rem', border: '1px dashed #d1d5db' }}>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#1f2937', fontWeight: '600' }}>{evalu.accionExcelencia || 'Sin feedback.'}</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <AnalyticsView submissions={submissions} evaluations={allEvaluations} />
      )}

      {/* Modal Detail */}
      {selectedSubmission && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '2.5rem', width: '100%', maxWidth: '700px', padding: '48px', position: 'relative', border: '4px solid #3f75ab' }}>
            <button onClick={() => setSelectedSubmission(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={32} /></button>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '950', color: '#3f75ab', marginBottom: '32px' }}>Detalle de Solicitud</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
              <div><label style={{ fontSize: '0.8rem', fontWeight: '900', color: '#6b7280' }}>Estudiante</label><div style={{ fontSize: '1.3rem', fontWeight: '900' }}>{selectedSubmission.nombre}</div></div>
              <div><label style={{ fontSize: '0.8rem', fontWeight: '900', color: '#6b7280' }}>DNI</label><div style={{ fontSize: '1.3rem', fontWeight: '900' }}>{selectedSubmission.dni}</div></div>
            </div>
            <div style={{ background: '#f3f4f6', padding: '32px', borderRadius: '1.5rem', marginBottom: '32px' }}>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>{selectedSubmission.descripcion}</p>
            </div>
            {selectedSubmission.status === 'pending' && (
              <button 
                onClick={async () => { await handleUpdateStatus(selectedSubmission.id, 'completed'); setSelectedSubmission(null); }}
                style={{ width: '100%', background: '#10b981', color: '#fff', padding: '20px', borderRadius: '1.25rem', fontSize: '1.4rem', fontWeight: '950', border: 'none' }}
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
