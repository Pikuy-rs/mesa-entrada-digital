"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToSubmissions } from '../services/submissions';
import { Download, Filter, Search, Lock, LogOut } from 'lucide-react';
import Papa from 'papaparse';
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

  // Export to CSV
  const handleExportCSV = () => {
    if (loading || filteredSubmissions.length === 0) return;

    const dataToExport = filteredSubmissions.map(sub => ({
      Fecha: sub.createdAt ? format(sub.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A',
      Nombre: sub.nombre,
      DNI: sub.dni,
      Celular: sub.celular || 'N/A',
      Mail: sub.mail || 'N/A',
      Carrera: sub.carrera,
      Ubicacion: sub.ubicacion,
      Tipo_Solicitud: sub.tipoSolicitud,
      Estado: sub.status,
      Descripcion: sub.descripcion
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MesaEntrada_Export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          onClick={handleExportCSV}
          disabled={loading || filteredSubmissions.length === 0}
          style={{ flex: '0 0 auto' }}
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }} className="hide-scrollbar">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(252,252,252,0.05)', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>Fecha</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>Estudiante</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>Trámite</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>Ubicación</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>Estado</th>
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
                      {sub.createdAt ? format(sub.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '...'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 500 }}>{sub.nombre}</div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(252,252,252,0.6)' }}>DNI: {sub.dni}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(65, 119, 174, 0.1)', color: 'var(--color-primary)', borderRadius: '4px', fontSize: '0.85rem' }}>
                        {sub.tipoSolicitud}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.9rem' }}>{sub.ubicacion}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(172, 85, 164, 0.1)', color: 'var(--color-alert)', borderRadius: '4px', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                        {sub.status || 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
