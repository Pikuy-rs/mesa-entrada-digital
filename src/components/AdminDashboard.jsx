"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { adminSkill } from '@/lib/firebase/skills/adminSkill';
import { evaluacionSkill } from '@/lib/firebase/skills/evaluacionSkill';
import { logoutAdmin } from '@/services/auth';
import { getAllEvaluations } from '@/services/academicService';
import AuthGuard from './AuthGuard';
import styles from './AdminDashboard.module.css';
import { 
  Download, 
  Search, 
  LogOut, 
  Eye, 
  X, 
  Trash2, 
  Inbox,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  LayoutDashboard,
  BarChart3,
  GraduationCap,
  ClipboardList,
  ChevronRight,
  FileText,
  Activity,
  User,
  ShieldCheck,
  Info,
  BookOpen
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
  LineChart, Line,
  PieChart, Pie,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { format, subDays, isAfter, differenceInHours, eachDayOfInterval, startOfDay } from 'date-fns';

const formatMetric = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const num = Number(value);
  return isNaN(num) ? 'N/A' : num.toFixed(1);
};

const CustomTooltip = ({ active, payload, label, definitions }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{label || payload[0].name}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            <span style={{ color: entry.color, fontWeight: 700 }}>{entry.name}: </span>
            <span style={{ fontWeight: 800 }}>{entry.value}</span>
            {definitions && definitions[entry.name] && (
              <p className={styles.tooltipDesc}>{definitions[entry.name]}</p>
            )}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const InfoTooltip = ({ text }) => (
  <div className={styles.infoTooltipWrapper}>
    <Info size={14} className="text-gray-400 cursor-help" />
    <span className={styles.infoTooltipText}>{text}</span>
  </div>
);

function AdminDashboardContent({ user }) {
  const [submissions, setSubmissions] = useState([]);
  const [allEvaluations, setAllEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [activeSection, setActiveSection] = useState('vision');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

  const [filtroCalidad, setFiltroCalidad] = useState('total');
  const [subFiltro, setSubFiltro] = useState('');

  const [busquedaBitacora, setBusquedaBitacora] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    let unsubscribeSub = null;

    const fetchData = async () => {
      try {
        unsubscribeSub = adminSkill.subscribeSubmissions(
          (data) => {
            setSubmissions(data);
            setLoading(false);
          },
          (error) => console.error(error)
        );
        const evals = await getAllEvaluations();
        setAllEvaluations(evals);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    
    fetchData();
    return () => unsubscribeSub && unsubscribeSub();
  }, [user]);

  const analytics = useMemo(() => {
    const now = new Date();
    const last7Days = subDays(now, 7);
    const last30Days = subDays(now, 30);

    const currentWeekSubmissions = submissions.filter(s => s.createdAt?.toDate && isAfter(s.createdAt.toDate(), last7Days));
    const prevWeekSubmissions = submissions.filter(s => s.createdAt?.toDate && isAfter(s.createdAt.toDate(), subDays(now, 14)) && !isAfter(s.createdAt.toDate(), last7Days));
    const growth = prevWeekSubmissions.length > 0 
      ? ((currentWeekSubmissions.length - prevWeekSubmissions.length) / prevWeekSubmissions.length * 100).toFixed(1)
      : 100;

    const sparklineData = eachDayOfInterval({ start: last7Days, end: now }).map(day => ({
      value: submissions.filter(s => s.createdAt?.toDate && format(s.createdAt.toDate(), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length
    }));

    const completed = submissions.filter(s => s.status === 'completed');
    const avgResolutionHours = completed.length > 0 && completed[0].completedAt
      ? (completed.reduce((acc, s) => acc + (s.completedAt?.toDate ? differenceInHours(s.completedAt.toDate(), s.createdAt.toDate()) : 0), 0) / completed.length).toFixed(1)
      : 0;

    const alertsCount = submissions.filter(s => s.status === 'pending' && s.createdAt?.toDate && !isAfter(s.createdAt.toDate(), subDays(now, 2))).length;

    // Tasa de Efectividad Logic
    const tasaEfectividad = submissions.length > 0 
      ? ((completed.length / submissions.length) * 100).toFixed(1)
      : 0;

    const flowData = eachDayOfInterval({ start: last30Days, end: now }).map(day => {
      const dayISO = format(day, 'yyyy-MM-dd');
      const dayIngresos = submissions.filter(s => s.createdAt?.toDate && format(s.createdAt.toDate(), 'yyyy-MM-dd') === dayISO).length;
      const dayEgresos = submissions.filter(s => s.status === 'completed' && s.completedAt?.toDate && format(s.completedAt.toDate(), 'yyyy-MM-dd') === dayISO);
      const dayAvgResTime = dayEgresos.length > 0
        ? dayEgresos.reduce((acc, s) => acc + differenceInHours(s.completedAt.toDate(), s.createdAt.toDate()), 0) / dayEgresos.length
        : 0;

      return {
        name: format(day, 'dd/MM'),
        ingresos: dayIngresos,
        egresos: dayEgresos.length,
        resTime: dayAvgResTime.toFixed(1)
      };
    });

    const statusMap = submissions.reduce((acc, s) => {
      const status = s.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const donutData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    const carreraMap = submissions.reduce((acc, s) => {
      const c = s.carrera || 'Otras';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    const carreraData = Object.entries(carreraMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);

    const subjects = [...new Set(allEvaluations.map(e => e.catedra).filter(Boolean))].sort();

    // Data filtering for Radar Chart
    let filteredEvals = allEvaluations;
    if (filtroCalidad === 'anio' && subFiltro) {
      filteredEvals = allEvaluations.filter(e => e.anioLectivo === subFiltro || e.anio === subFiltro);
    } else if (filtroCalidad === 'materia' && subFiltro) {
      filteredEvals = allEvaluations.filter(e => e.catedra === subFiltro);
    }

    const avgIndices = {
      ICT: filteredEvals.reduce((acc, e) => acc + (e.ict || 0), 0) / (filteredEvals.length || 1),
      NDC: filteredEvals.reduce((acc, e) => acc + (e.ndc || 0), 0) / (filteredEvals.length || 1),
      CAT: filteredEvals.reduce((acc, e) => acc + (e.cat || 0), 0) / (filteredEvals.length || 1),
      TCE: filteredEvals.reduce((acc, e) => acc + (e.tce || 0), 0) / (filteredEvals.length || 1),
    };
    const radarData = [
      { subject: 'Claridad (ICT)', A: (avgIndices.ICT * 20).toFixed(0), fullMark: 100 },
      { subject: 'Material (NDC)', A: (avgIndices.NDC * 20).toFixed(0), fullMark: 100 },
      { subject: 'Evaluación (CAT)', A: (avgIndices.CAT * 20).toFixed(0), fullMark: 100 },
      { subject: 'Empatía (TCE)', A: (avgIndices.TCE * 20).toFixed(0), fullMark: 100 },
    ];

    return { total: submissions.length, growth, sparklineData, avgResolutionHours, alertsCount, tasaEfectividad, flowData, donutData, carreraData, radarData, subjects };
  }, [submissions, allEvaluations, filtroCalidad, subFiltro]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchSearch = searchQuery === '' || 
        sub.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        sub.dni?.includes(searchQuery) ||
        sub.tipoSolicitud?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === '' || sub.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [submissions, searchQuery, filterStatus]);

  const bitacoraFiltrada = useMemo(() => {
    if (!busquedaBitacora) return allEvaluations;
    const termino = busquedaBitacora.toLowerCase();
    return allEvaluations.filter(item => {
      const fechaStr = item.createdAt?.toDate ? format(item.createdAt.toDate(), 'dd/MM/yyyy') : '';
      return (
        (item.catedra && item.catedra.toLowerCase().includes(termino)) ||
        (item.accionExcelencia && item.accionExcelencia.toLowerCase().includes(termino)) ||
        (item.tipoGestion && item.tipoGestion.toLowerCase().includes(termino)) ||
        (item.estudiante && item.estudiante.toLowerCase().includes(termino)) ||
        (fechaStr.includes(termino))
      );
    });
  }, [allEvaluations, busquedaBitacora]);

  const exportToCSV = () => {
    const headers = ["Fecha", "Estudiante", "Trámite", "Prioridad", "Responsable", "Estado"];
    const rows = filteredSubmissions.map(sub => [
      sub.createdAt?.toDate ? format(sub.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A',
      sub.nombre,
      sub.tipoSolicitud,
      sub.priority || 'Media',
      sub.responsable || 'Sin Asignar',
      sub.status === 'completed' ? 'Completado' : 'Pendiente'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Reporte_Gestion_GALA.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await adminSkill.updateStatus(id, status);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Desea eliminar este expediente definitivamente?')) {
      try {
        await adminSkill.deleteRecord(id);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const formatearValor = (val) => (val && !isNaN(val) ? Number(val).toFixed(1) : '-');
  
  const obtenerColorSemaforo = (val) => {
    const n = Number(val);
    if (!n) return '#9ca3af'; // Gris si no hay dato
    if (n < 3) return '#dc2626'; // Rojo (Crítico)
    if (n < 4) return '#d97706'; // Naranja/Amarillo (Regular)
    return '#059669'; // Verde (Óptimo)
  };

  const calcularPromedioGeneral = (item) => {
    const valores = [item.ict, item.ndc, item.cat, item.tce].map(Number).filter(n => !isNaN(n));
    return valores.length > 0 ? (valores.reduce((a, b) => a + b, 0) / valores.length) : null;
  };

  const exportarCSV = (datos, nombreArchivo) => {
    if (!datos || datos.length === 0) return alert('No hay datos para exportar.');
    
    // Extraer cabeceras (limpiando campos internos si existen)
    const cabeceras = Object.keys(datos[0]).filter(k => k !== 'createdAt' && k !== 'completedAt');
    
    const filasCSV = datos.map(fila => 
      cabeceras.map(cabecera => {
        let valor = fila[cabecera] !== null && fila[cabecera] !== undefined ? fila[cabecera] : '';
        valor = valor.toString().replace(/"/g, '""'); // Escapar comillas
        return `"${valor}"`; // Envolver en comillas
      }).join(',')
    );
    
    const contenidoCSV = [cabeceras.join(','), ...filasCSV].join('\n');
    const blob = new Blob(["\uFEFF" + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${nombreArchivo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && submissions.length === 0) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin" size={48} color="#005088" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      
      {/* SIDEBAR FIJO A LA IZQUIERDA */}
      <aside style={{ width: '260px', backgroundColor: '#1e3a8a', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 20, boxShadow: '4px 0 10px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <ShieldCheck size={32} /> Consola GALA
          </h2>
        </div>

        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', textAlign: 'left', backgroundColor: activeSection === 'vision' ? '#1e40af' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
            onClick={() => scrollTo('vision')}
          >
            <LayoutDashboard size={20}/> Visión Estratégica
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', textAlign: 'left', backgroundColor: activeSection === 'tendencias' ? '#1e40af' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
            onClick={() => scrollTo('tendencias')}
          >
            <BarChart3 size={20}/> Análisis de Tendencias
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', textAlign: 'left', backgroundColor: activeSection === 'calidad' ? '#1e40af' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
            onClick={() => scrollTo('calidad')}
          >
            <GraduationCap size={20}/> Monitor de Calidad
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', textAlign: 'left', backgroundColor: activeSection === 'bitacora' ? '#1e40af' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
            onClick={() => scrollTo('bitacora')}
          >
            <ClipboardList size={20}/> Bitácora de Gestión
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', textAlign: 'left', backgroundColor: activeSection === 'operativa' ? '#1e40af' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
            onClick={() => scrollTo('operativa')}
          >
            <Activity size={20}/> Grilla Operativa
          </button>
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #1e40af', marginTop: 'auto' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', textAlign: 'left', backgroundColor: 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
            onClick={logoutAdmin}
          >
            <LogOut size={20}/> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL A LA DERECHA */}
      <main style={{ flex: 1, height: '100%', overflowY: 'auto', position: 'relative', padding: '32px' }}>
        <div className="max-w-7xl mx-auto">
          <header className={styles.stickyHeader}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e3a8a', margin: 0 }}>Intelligence Unit v4.0</h1>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Gestión Institucional de Alternativa Tecnológica</p>
            </div>
            <div className={styles.stickyHeaderActions}>
              <button className={styles.actionBtn} onClick={exportToCSV}><Download size={18}/> Exportar Vista</button>
            </div>
          </header>

          {/* SECTION: VISION ESTRATEGICA */}
          <section id="vision" className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Visión Estratégica</h2>
            <div className={styles.kpiGrid}>
              <div className={styles.chartCard}>
                <div className={styles.flexBetween}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Demanda Total</span>
                    <InfoTooltip text="Volumen de trámites ingresados. Mide la carga operativa y la tracción digital de la agrupación." />
                  </div>
                  <Inbox size={18} color="#1e3a8a" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1e3a8a', margin: '0.5rem 0' }}>{analytics.total}</div>
                <div className={styles.flexBetween}>
                  <div style={{ width: '50%', height: '30px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.sparklineData}><Line type="monotone" dataKey="value" stroke="#1e3a8a" strokeWidth={2} dot={false}/></LineChart>
                    </ResponsiveContainer>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#10b981' }}>+{analytics.growth}%</span>
                </div>
              </div>
              
              <div className={styles.chartCard}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Promedio Resolución</span>
                  <InfoTooltip text="Tiempo efectivo de respuesta. Indicador clave para exigir eficiencia administrativa." />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1e3a8a', margin: '0.5rem 0' }}>{analytics.avgResolutionHours}h</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SLA Institucional UTN</div>
              </div>

              <div className={styles.chartCard}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Estado Crítico</span>
                  <InfoTooltip text="Trámites estancados por más de 48hs. Requieren intervención gremial inmediata." />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444', margin: '0.5rem 0' }}>{analytics.alertsCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Trámites {'>'} 48hs</div>
              </div>

              <div className={styles.chartCard}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tasa de Efectividad</span>
                  <InfoTooltip text="Porcentaje de resolución real del Centro de Estudiantes." />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1e3a8a', margin: '0.5rem 0' }}>{analytics.tasaEfectividad}%</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Resolución Institucional</div>
              </div>
            </div>
            <p className={styles.methodologyText}>* Monitoreo dinámico de carga y resolución en tiempo real.</p>
          </section>

          {/* SECTION: TENDENCIAS */}
          <section id="tendencias" className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Análisis de Tendencias</h2>
            <div className={styles.visualizationGrid}>
              <div className={styles.chartCard}>
                <div className="flex items-center gap-2 mb-6">
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Flujo de Ingresos vs. Egresos</h3>
                  <InfoTooltip text="Visualiza cuellos de botella en el procesamiento de expedientes a lo largo del mes." />
                </div>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.flowData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <YAxis yAxisId="right" orientation="right" hide />
                      <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#1e3a8a" fill="#1e3a8a" fillOpacity={0.1} strokeWidth={3} />
                      <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#ef4444" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="resTime" name="Tiempo Res. (h)" stroke="#f59e0b" strokeWidth={2} dot={false} yAxisId="right" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className={styles.chartCard}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Distribución de Estados</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analytics.donutData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {analytics.donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#1e3a8a', '#f59e0b', '#cbd5e1'][index % 3]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* GLOSARIO DE METRICAS ACADEMICAS */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderLeft: '4px solid #1e3a8a', border: '1px solid #f1f5f9', padding: '24px', marginBottom: '32px' }}>
            {/* Header de la Tarjeta: Ícono y Título alineados */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ color: '#1e3a8a' }}>
                <BookOpen size={24} />
              </span>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>
                Referencias de Auditoría Académica
              </h3>
            </div>

            {/* Cuerpo: Párrafos separados por espacio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.875rem', color: '#374151' }}>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#1e3a8a' }}>ICT (Claridad Conceptual):</strong> Mide la capacidad docente para transmitir conocimiento. <em style={{ color: '#6b7280' }}>Utilidad: Exigir tutorías de apoyo o revisión pedagógica.</em>
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#1e3a8a' }}>NDC (Disponibilidad de Material):</strong> Evalúa el acceso a recursos de estudio. <em style={{ color: '#6b7280' }}>Utilidad: Reclamar digitalización de apuntes o subsidios de impresión.</em>
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#1e3a8a' }}>CAT (Criterio de Evaluación):</strong> Mide la coherencia entre lo que se enseña y lo que se toma. <em style={{ color: '#6b7280' }}>Utilidad: Herramienta legal para apelar aplazos masivos.</em>
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#1e3a8a' }}>TCE (Empatía y Trato):</strong> Evalúa el factor humano y la predisposición. <em style={{ color: '#6b7280' }}>Utilidad: Intervenir gremialmente ante maltrato o abuso de poder.</em>
              </p>
            </div>
          </div>

          {/* SECTION: MONITOR CALIDAD ACADEMICA */}
          <section id="calidad" className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Monitor de Calidad Académica</h2>
            
            {/* PANEL DE CONTROL DE FILTROS */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', backgroundColor: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '8px', textTransform: 'uppercase' }}>Nivel de Análisis</label>
                <select 
                  value={filtroCalidad}
                  onChange={(e) => { setFiltroCalidad(e.target.value); setSubFiltro(''); }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', color: '#374151', fontSize: '0.875rem' }}
                >
                  <option value="total">Consolidado Institucional (Todas)</option>
                  <option value="anio">Agrupado por Año de Cursado</option>
                  <option value="materia">Materia Específica</option>
                </select>
              </div>

              {/* Renderizado condicional del segundo selector */}
              {filtroCalidad === 'anio' && (
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '8px', textTransform: 'uppercase' }}>Seleccionar Año</label>
                  <select 
                    value={subFiltro}
                    onChange={(e) => setSubFiltro(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', color: '#374151', fontSize: '0.875rem' }}
                  >
                    <option value="">-- Elegir Año --</option>
                    <option value="1">1er Año</option>
                    <option value="2">2do Año</option>
                    <option value="3">3er Año</option>
                    <option value="4">4to Año</option>
                    <option value="5">5to Año</option>
                  </select>
                </div>
              )}

              {filtroCalidad === 'materia' && (
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '8px', textTransform: 'uppercase' }}>Buscar Materia</label>
                  <select 
                    value={subFiltro}
                    onChange={(e) => setSubFiltro(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', color: '#374151', fontSize: '0.875rem' }}
                  >
                    <option value="">-- Elegir Materia --</option>
                    {analytics.subjects.map((subject, idx) => (
                      <option key={idx} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className={styles.academicGrid}>
              <div className={styles.chartCard}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Perfil de Excelencia Institucional</h3>
                <div style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analytics.radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                      <Radar name="Promedio Gral" dataKey="A" stroke="#1e3a8a" fill="#1e3a8a" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className={styles.chartCard}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Ranking por Carrera</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {analytics.carreraData.map((c, i) => (
                    <div key={i} className={styles.flexBetween} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{c.name}</span>
                      <span style={{ fontWeight: 800, color: '#1e3a8a' }}>{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION: BITACORA DE GESTION */}
          <section id="bitacora" className={styles.contentSection} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Bitácora de Gestión</h2>
              <button 
                onClick={() => exportarCSV(bitacoraFiltrada, 'Bitacora_Gestion_Filtrada')}
                style={{ backgroundColor: '#1e3a8a', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Download size={18} /> Descargar Excel (Bitácora)
              </button>
            </div>

            {/* Barra de Búsqueda Omnidireccional */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
              <span style={{ color: '#94a3b8' }}><Search size={18} /></span>
              <input 
                type="text" 
                placeholder="Buscar por cátedra, estudiante, fecha, feedback o tipo de gestión..." 
                value={busquedaBitacora}
                onChange={(e) => setBusquedaBitacora(e.target.value)}
                style={{ flex: 1, padding: '8px 0', border: 'none', outline: 'none', fontSize: '0.875rem', backgroundColor: 'transparent' }}
              />
            </div>
            
            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflowX: 'auto', border: '1px solid #f1f5f9' }}>
              <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 800, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>FECHA</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 800, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>CÁTEDRA</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 800, whiteSpace: 'nowrap', textTransform: 'uppercase', textAlign: 'center' }}>GENERAL</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 800, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>MÉTRICAS (I | N | C | T)</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>FEEDBACK ACADÉMICO</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 800, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>TIPO DE GESTIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {bitacoraFiltrada.length > 0 ? bitacoraFiltrada.map((item, idx) => {
                    const promedio = calcularPromedioGeneral(item);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: '#64748b' }}>
                          {item.createdAt?.toDate ? format(item.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e3a8a', whiteSpace: 'nowrap' }}>
                          {item.catedra}
                        </td>
                        
                        {/* Columna: Resultado General con Badge */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <span style={{ 
                            backgroundColor: obtenerColorSemaforo(promedio), 
                            color: 'white', 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                          }}>
                            {formatearValor(promedio)}
                          </span>
                        </td>

                        {/* Columna: Métricas Desglosadas con Semáforo de Texto */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                          <span style={{ color: obtenerColorSemaforo(item.ict) }}>I:{formatearValor(item.ict)}</span> <span style={{color: '#cbd5e1'}}>|</span>{' '}
                          <span style={{ color: obtenerColorSemaforo(item.ndc) }}>N:{formatearValor(item.ndc)}</span> <span style={{color: '#cbd5e1'}}>|</span>{' '}
                          <span style={{ color: obtenerColorSemaforo(item.cat) }}>C:{formatearValor(item.cat)}</span> <span style={{color: '#cbd5e1'}}>|</span>{' '}
                          <span style={{ color: obtenerColorSemaforo(item.tce) }}>T:{formatearValor(item.tce)}</span>
                        </td>
                        
                        <td style={{ padding: '12px 16px', minWidth: '250px' }}>
                          {item.accionExcelencia || <span style={{ color: '#94a3b8' }}>Pendiente</span>}
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {item.tipoGestion || 'Académico'}
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        No se encontraron registros para la búsqueda actual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION: GRILLA OPERATIVA */}
          <section id="operativa" className={styles.contentSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Grilla Operativa (Mesa de Entrada)</h2>
              <button 
                onClick={() => exportarCSV(filteredSubmissions, 'Grilla_Operativa_GALA')}
                style={{ backgroundColor: '#059669', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Download size={18} /> Descargar Excel (Grilla)
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por estudiante, DNI o trámite..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.875rem', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#1e3a8a'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
              </div>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', fontSize: '0.875rem', minWidth: '160px', cursor: 'pointer' }}
              >
                <option value="">Todos los Estados</option>
                <option value="pending">Pendientes</option>
                <option value="completed">Completados</option>
              </select>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
              <table className={styles.dataTable} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>ESTUDIANTE</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>TRÁMITE</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>PRIORIDAD</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>RESPONSABLE</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map(sub => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700 }}>{sub.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>DNI: {sub.dni}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: '#475569' }}>{sub.tipoSolicitud}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sub.carrera}</div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span className={`${styles.badge} ${styles[`priority${sub.priority || 'Media'}`]}`}>{sub.priority || 'Media'}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <select 
                          className="text-sm bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer py-1"
                          defaultValue={sub.responsable || "Sin Asignar"}
                          onChange={(e) => adminSkill.updateAssignment(sub.id, e.target.value)}
                        >
                          <option value="Sin Asignar">Sin Asignar</option>
                          <option value="Rafael Salazar">Rafael Salazar</option>
                          <option value="Gala Bórquez">Gala Bórquez</option>
                          <option value="Felipe Cruz">Felipe Cruz</option>
                          <option value="Equipo Soporte">Equipo Soporte</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e3a8a' }} onClick={() => setSelectedSubmission(sub)}><Eye size={18}/></button>
                          {sub.status === 'pending' && <button style={{ background: '#1e3a8a', border: 'none', color: 'white', padding: '0.25rem', borderRadius: '0.25rem', cursor: 'pointer' }} onClick={() => handleUpdateStatus(sub.id, 'completed')}><CheckCircle2 size={16}/></button>}
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} onClick={() => handleDelete(sub.id)}><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* DETAIL MODAL */}
      {selectedSubmission && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '2.5rem', borderRadius: '2rem', width: '100%', maxWidth: '600px', position: 'relative' }}>
            <button onClick={() => setSelectedSubmission(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24}/></button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '1.5rem' }}>Detalle de Expediente</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>ESTUDIANTE</label><div style={{ fontWeight: 700 }}>{selectedSubmission.nombre}</div></div>
              <div><label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>DNI</label><div style={{ fontWeight: 700 }}>{selectedSubmission.dni}</div></div>
            </div>
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>DESCRIPCIÓN</label>
              <p style={{ margin: '0.5rem 0 0 0', lineHeight: 1.6 }}>{selectedSubmission.descripcion || 'Sin descripción.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return <AuthGuard><AdminDashboardContent /></AuthGuard>;
}
