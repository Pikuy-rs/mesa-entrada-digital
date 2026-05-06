"use client";
import React, { useState } from 'react';
import { addSubmission } from '../services/submissions';
import { Send, CheckCircle, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function SubmissionForm() {
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    celular: '',
    mail: '',
    carrera: '',
    ubicacion: 'Anexo Concepción',
    tipoSolicitud: '',
    descripcion: ''
  });
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    
    const result = await addSubmission(formData);
    
    if (result.success) {
      setStatus('success');
      setFormData({
        nombre: '',
        dni: '',
        celular: '',
        mail: '',
        carrera: '',
        ubicacion: 'Anexo Concepción',
        tipoSolicitud: '',
        descripcion: ''
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 5000);
    } else {
      setStatus('error');
      setErrorMsg(result.error || 'Ocurrió un error al enviar la solicitud.');
    }
  };

  if (status === 'success') {
    return (
      <div className="glass-panel animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
        <CheckCircle size={64} color="var(--color-primary)" style={{ margin: '0 auto 20px auto' }} />
        <h2 style={{ color: 'var(--color-primary)' }}>¡Solicitud Enviada!</h2>
        <p style={{ fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
          Tu trámite ha sido registrado exitosamente. Será procesado por la Secretaría Académica a la brevedad.
        </p>
        <button 
          className="glass-button" 
          style={{ marginTop: '24px' }}
          onClick={() => setStatus('idle')}
        >
          Enviar nueva solicitud
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in-up delay-400" style={{ padding: '40px' }}>
      <h3 style={{ marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', fontSize: '1.5rem', fontWeight: 700 }}>
        Ingresa tu Solicitud
      </h3>
      
      {status === 'error' && (
        <div style={{ background: 'rgba(172, 85, 164, 0.1)', border: '1px solid var(--color-alert)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertCircle color="var(--color-alert)" />
          <p style={{ margin: 0, color: 'var(--color-text)' }}>{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Nombre Completo</label>
            <input 
              type="text" 
              name="nombre" 
              value={formData.nombre} 
              onChange={handleChange} 
              className="glass-input" 
              required 
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>DNI</label>
            <input 
              type="number" 
              name="dni" 
              value={formData.dni} 
              onChange={handleChange} 
              className="glass-input" 
              required 
              placeholder="Sin puntos ni espacios"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Celular</label>
            <input 
              type="tel" 
              name="celular" 
              value={formData.celular} 
              onChange={handleChange} 
              className="glass-input" 
              required 
              placeholder="Ej: 3811234567"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Correo Electrónico (Mail)</label>
            <input 
              type="email" 
              name="mail" 
              value={formData.mail} 
              onChange={handleChange} 
              className="glass-input" 
              required 
              placeholder="Ej: estudiante@gmail.com"
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Carrera</label>
          <select 
            name="carrera" 
            value={formData.carrera} 
            onChange={handleChange} 
            className="glass-input" 
            required
          >
            <option value="" disabled>Seleccione una carrera...</option>
            <option value="Ingeniería Electrónica">Ingeniería Electrónica</option>
            <option value="Ingeniería en Sistemas de Información">Ingeniería en Sistemas de Información</option>
            <option value="Ingeniería Mecánica">Ingeniería Mecánica</option>
            <option value="Ingeniería Eléctrica">Ingeniería Eléctrica</option>
            <option value="Ingeniería Civil">Ingeniería Civil</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Sede de Retiro</label>
            <select 
              name="ubicacion" 
              value={formData.ubicacion} 
              onChange={handleChange} 
              className="glass-input"
              required
            >
              <option value="Anexo Concepción" style={{ fontWeight: 'bold' }}>⭐ Anexo Concepción</option>
              <option value="Casa Central">Casa Central</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Tipo de Solicitud</label>
            <select 
              name="tipoSolicitud" 
              value={formData.tipoSolicitud} 
              onChange={handleChange} 
              className="glass-input"
              required
            >
              <option value="" disabled>Seleccione un tipo...</option>
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
            
            {/* Tooltips / Helper Text */}
            <div style={{ 
              marginTop: '12px', 
              padding: '12px', 
              background: 'rgba(65, 119, 174, 0.05)', 
              borderLeft: '3px solid var(--color-primary)', 
              borderRadius: '0 8px 8px 0',
              fontSize: '0.85rem',
              color: '#374151',
              minHeight: '60px',
              display: formData.tipoSolicitud ? 'block' : 'none'
            }} className="animate-fade-in-up">
              {formData.tipoSolicitud === 'Campus Virtual' && <span>ℹ️ Inscripción a materias, recuperar contraseña y errores de Moodle.</span>}
              {formData.tipoSolicitud === 'Certificado de Alumno Regular' && <span>ℹ️ Acreditación para becas, transporte o trámites de salud.</span>}
              {formData.tipoSolicitud === 'Sysacad Gestión' && <span>ℹ️ Inscripción a finales y actualización de legajo.</span>}
              {formData.tipoSolicitud === 'Presentación de Papeles' && <span>ℹ️ Entrega de documentación física digitalizada.</span>}
              {formData.tipoSolicitud === 'Solicitud de Mesa Especial' && <span>ℹ️ Para casos excepcionales o materias finales.</span>}
              {formData.tipoSolicitud === 'Equivalencias' && <span>ℹ️ Reconocimiento de materias de otras carreras o facultades.</span>}
              {formData.tipoSolicitud === 'Activación de Legajo' && <span>ℹ️ Reincorporación al sistema académico.</span>}
              {formData.tipoSolicitud === 'Analítico' && <span>ℹ️ Solicitud de estado curricular y notas certificadas.</span>}
              {formData.tipoSolicitud === 'Solicitud de Becas' && <span>ℹ️ Gestión directa de ayudas económicas estudiantiles.</span>}
              {formData.tipoSolicitud === 'Actualización de Datos Personales' && <span>ℹ️ Cambios en domicilio, teléfono o mail.</span>}
              {formData.tipoSolicitud === 'Justificación de Inasistencia' && <span>ℹ️ Presentación de certificados médicos o laborales.</span>}
              {formData.tipoSolicitud === 'Inicio de Trámite de Título' && <span>ℹ️ Apertura de expediente para graduados.</span>}
              {formData.tipoSolicitud === 'Seguimiento de Título en Trámite' && <span>ℹ️ Consulta de estado del expediente de graduación.</span>}
              {formData.tipoSolicitud === 'Seguimiento de Notas' && <span>ℹ️ Consultas sobre actas de examen y carga de notas.</span>}
              {formData.tipoSolicitud === 'Mesa de Ayuda SAE' && <span>ℹ️ Consulta directa para casos no listados.</span>}
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Descripción Detallada</label>
          <textarea 
            name="descripcion" 
            value={formData.descripcion} 
            onChange={handleChange} 
            className="glass-input" 
            required 
            rows="5"
            placeholder="Describe tu solicitud, trámite o sugerencia con el mayor detalle posible..."
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Banner de Privacidad */}
        <div style={{ 
          background: 'rgba(65, 119, 174, 0.08)', 
          borderLeft: '4px solid var(--color-alert)', 
          padding: '16px', 
          borderRadius: '0 8px 8px 0',
          marginTop: '8px',
          marginBottom: '16px'
        }}>
          <h4 style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '1rem' }}>
            🛡️ PRIVACIDAD ABSOLUTA
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.5 }}>
            Tu gestión es personal. La tecnología de Alternativa Tecnológica garantiza que NADIE (punteros, intermediarios o terceros) tenga acceso a tu solicitud. Solo el equipo académico responsable procesará tus datos.
          </p>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            className="glass-button" 
            disabled={status === 'loading'}
            style={{ width: '100%', maxWidth: '300px' }}
          >
            {status === 'loading' ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Send size={20} />
                Enviar Solicitud
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
