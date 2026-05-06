"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToSubmissions, deleteSubmission } from '../services/submissions';
import { Download, Filter, Search, Lock, LogOut, Eye, X, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterUbicacion, setFilterUbicacion] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Authentication
  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === 'GalaAT08-01') { // Hardcoded PIN for MVP
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
    const unsubscribe = subscribeToSubmissions((data) => {
      setSubmissions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Derived State (Filtered Submissions)
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchUbicacion = filterUbicacion ? sub.ubicacion === filterUbicacion : true;
      const matchTipo = filterTipo ? sub.tipoSolicitud === filterTipo : true;
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = searchQuery 
        ? (sub.nombre?.toLowerCase().includes(searchLower) || sub.dni?.includes(searchQuery))
        : true;
        
      return matchUbicacion && matchTipo && matchSearch;
    });
  }, [submissions, filterUbicacion, filterTipo, searchQuery]);

  // Excel Date Helper
  const formatDateExcel = (ts) => {
    if (ts && typeof ts.toDate === 'function') {
      return format(ts.toDate(), 'yyyy-MM-dd HH:mm');
    }
    return 'Pendiente';
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (loading || filteredSubmissions.length === 0) return;

    const dataToExport = filteredSubmissions.map(sub => ({
      Fecha: formatDateExcel(sub.createdAt),
      Nombre: sub.nombre,
      DNI: sub.dni,
      Celular: sub.celular || 'N/A',
      Mail: sub.mail || 'N/A',
      Carrera: sub.carrera,
      Sede: sub.ubicacion,
      Tipo_Trámite: sub.tipoSolicitud,
      Estado: sub.status === 'pending' ? 'Pendiente' : (sub.status || 'Pendiente'),
      Detalle_Solicitud: sub.descripcion
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trámites");
    
    // Auto-size columns loosely
    const wscols = Object.keys(dataToExport[0]).map(key => ({ wch: Math.max(key.length, 15) }));
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `MesaEntrada_Export_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este registro de forma permanente?")) {
      await deleteSubmission(id);
    }
  };

  // Table Date Helper
  const formatDateTable = (ts) => {
    if (ts && typeof ts.toDate === 'function') {
      return ts.toDate().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    }
    return 'Procesando...';
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <div style={{ background: 'rgba(252,252,252,0.1)', padding: '16px', borderRadius: '50%', display: 'inline-block', marginBottom: '24px' }}>
            <Lock size={32} color="var(--color-primary)" />
          </div>
          <h2 style={{ marginBottom: '8px' }}>Acceso Privado</h2>
          <p style={{ marginBottom: '24px', fontSize: '0.9rem' }}>Ingresa el PIN de seguridad para acceder al dashboard administrativo.</p>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="glass-input"
              placeholder="PIN de acceso"
              autoFocus
              style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem', marginBottom: '16px' }}
            />
            {pinError && <p className="text-alert" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>PIN incorrecto.</p>}
            <button type="submit" className="glass-button" style={{ width: '100%' }}>Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container main-content" style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Panel de Control</h1>
          <p style={{ margin: 0 }}>Gestión de trámites y solicitudes en tiempo real.</p>
        </div>
        <button className="glass-button secondary" onClick={() => setIsAuthenticated(false)}>
          <LogOut size={18} /> Salir
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 200px' }}>
          <Search size={18} color="var(--color-text)" style={{ opacity: 0.6 }} />
          <input 
            type="text" 
            placeholder="Buscar por DNI o Nombre..." 
            className="glass-input" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select 
          className="glass-input" 
          style={{ flex: '1 1 150px' }}
          value={filterUbicacion}
          onChange={(e) => setFilterUbicacion(e.target.value)}
        >
          <option value="">Todas las ubicaciones</option>
          <option value="Anexo Concepción">Anexo Concepción</option>
          <option value="Casa Central">Casa Central</option>
        </select>

        <select 
          className="glass-input" 
          style={{ flex: '1 1 150px' }}
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
        >
          <option value="">Todos los trámites</option>
          <option value="Campus Virtual">Campus Virtual</option>
          <option value="Certificado de Alumno Regular">Certificado de Alumno Regular</option>
          <option value="Sysacad Gestión">Sysacad Gestión</option>
          <option value="Presentación de Papeles">Presentación de Papeles</option>
          <option value="Solicitud de Mesa Especial">Solicitud de Mesa Especial</option>
          <option value="Equivalencias">Equivalencias</option>
          <option value="Activación de Legajo">Activación de Legajo</option>
          <option value="Analítico">Analítico</option>
          <option value="Solicitud de Becas">Solicitud de Becas</option>
          <option value="Actualización de Datos Personales">Actualización de Datos Personales</option>
          <option value="Justificación de Inasistencia">Justificación de Inasistencia</option>
          <option value="Inicio de Trámite de Título">Inicio de Trámite de Título</option>
          <option value="Seguimiento de Título en Trámite">Seguimiento de Título en Trámite</option>
          <option value="Seguimiento de Notas">Seguimiento de Notas</option>
          <option value="Mesa de Ayuda SAE">Mesa de Ayuda SAE</option>
        </select>

        <button 
          className="glass-button" 
          onClick={handleExportExcel}
          disabled={loading || filteredSubmissions.length === 0}
          style={{ flex: '0 0 auto' }}
        >
          <Download size={18} />
          Exportar Excel
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }} className="hide-scrollbar">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(252,252,252,0.05)', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>Fecha</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>Estudiante</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>DNI</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>Contacto</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>Carrera</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>Trámite</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>Sede</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>Estado</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center' }}>Cargando solicitudes...</td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center' }}>No hay solicitudes que coincidan con los filtros.</td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid rgba(252,252,252,0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px', fontSize: '0.9rem', color: 'rgba(252,252,252,0.7)' }}>
                      {formatDateTable(sub.createdAt)}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>
                      {sub.nombre || 'No proporcionado'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.9rem' }}>
                      {sub.dni || '-'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.85rem' }}>
                      <div style={{ color: 'var(--color-text)' }}>{sub.celular || '-'}</div>
                      <div style={{ color: 'rgba(252,252,252,0.6)' }}>{sub.mail || '-'}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.9rem' }}>
                      {sub.carrera || '-'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(65, 119, 174, 0.1)', color: 'var(--color-primary)', borderRadius: '4px', fontSize: '0.85rem' }}>
                        {sub.tipoSolicitud || 'No proporcionado'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.9rem' }}>{sub.ubicacion || '-'}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(172, 85, 164, 0.1)', color: 'var(--color-alert)', borderRadius: '4px', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                        {sub.status === 'pending' ? 'Pendiente' : (sub.status || 'Pendiente')}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button 
                        onClick={() => setSelectedSubmission(sub)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '8px', borderRadius: '4px', transition: 'background 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(65, 119, 174, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                        title="Ver detalle"
                      >
                        <Eye size={20} />
                      </button>
                      <button 
                        onClick={() => handleDelete(sub.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-alert)', padding: '8px', borderRadius: '4px', transition: 'background 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(172, 85, 164, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                        title="Eliminar registro"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalles */}
      {selectedSubmission && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            backdropFilter: 'blur(10px)',
            borderRadius: '1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto',
            padding: '32px', position: 'relative'
          }}>
            <button 
              onClick={() => setSelectedSubmission(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '24px', color: 'var(--color-primary)', fontSize: '1.5rem', paddingBottom: '16px', borderBottom: '1px solid var(--border-glass)' }}>
              Detalle del Trámite
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text)', opacity: 0.7 }}>Estudiante</span>
                <strong style={{ fontSize: '1.1rem' }}>{selectedSubmission.nombre || 'No proporcionado'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text)', opacity: 0.7 }}>DNI</span>
                <strong style={{ fontSize: '1.1rem' }}>{selectedSubmission.dni || 'No proporcionado'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text)', opacity: 0.7 }}>Carrera</span>
                <strong>{selectedSubmission.carrera || 'No proporcionado'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text)', opacity: 0.7 }}>Sede</span>
                <strong>{selectedSubmission.ubicacion || 'No proporcionado'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text)', opacity: 0.7 }}>Celular</span>
                <strong>{selectedSubmission.celular || 'No proporcionado'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text)', opacity: 0.7 }}>Mail</span>
                <strong>{selectedSubmission.mail || 'No proporcionado'}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text)', opacity: 0.7 }}>Tipo de Trámite</span>
              <span style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(65, 119, 174, 0.1)', color: 'var(--color-primary)', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 600, marginTop: '4px' }}>
                {selectedSubmission.tipoSolicitud || 'No proporcionado'}
              </span>
            </div>

            <div style={{ background: 'rgba(252,252,252,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text)', opacity: 0.7, marginBottom: '8px' }}>Descripción Detallada</span>
              <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {selectedSubmission.descripcion || 'Sin descripción'}
              </p>
            </div>
            
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text)', opacity: 0.5 }}>
                Registrado el {formatDateTable(selectedSubmission.createdAt)}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
