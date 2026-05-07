"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getAllTeachers, submitEvaluation, getTeacherEvaluations } from '@/services/academicService';
import TeacherRadarChart from './TeacherRadarChart';
import DataFlowTimeline from './DataFlowTimeline';
import { 
  Star, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle,
  BookOpen,
  Info,
  ChevronDown
} from 'lucide-react';
import styles from './AcademicExcellence.module.css';

const AXES = [
  {
    id: 'ict',
    title: 'ICT (Índice de Claridad Transmisiva)',
    description: 'Evalúa la capacidad docente para transmitir conocimientos de forma clara y aplicada.',
    questions: [
      { id: 'ict_1', text: '¿Demuestra dominio profundo de la materia?' },
      { id: 'ict_2', text: '¿Utiliza ejemplos prácticos aplicables a la ingeniería?' },
      { id: 'ict_3', text: '¿Fomenta el pensamiento crítico y la participación?' }
    ]
  },
  {
    id: 'ndc',
    title: 'NDC (Nivel de Digitalización)',
    description: 'Mide la integración tecnológica y organización del material en la cátedra.',
    questions: [
      { id: 'ndc_1', text: '¿Hace un uso efectivo y constante del campus virtual?' },
      { id: 'ndc_2', text: '¿El material digital está organizado y actualizado?' },
      { id: 'ndc_3', text: '¿Integra software, simuladores o herramientas tecnológicas actuales?' }
    ]
  },
  {
    id: 'cat',
    title: 'CAT (Apoyo a la Trayectoria)',
    description: 'Evalúa el trato humano y el compromiso con el seguimiento del estudiante.',
    questions: [
      { id: 'cat_1', text: '¿Mantiene un trato cordial, respetuoso y empático?' },
      { id: 'cat_2', text: '¿Cumple estrictamente con los horarios de inicio y fin de clase?' },
      { id: 'cat_3', text: '¿Muestra predisposición para resolver dudas (presencial o virtual)?' }
    ]
  },
  {
    id: 'tce',
    title: 'TCE (Coherencia Evaluativa)',
    description: 'El "radar de justicia": coherencia entre lo evaluado y lo enseñado.',
    questions: [
      { id: 'tce_1', text: '¿Los exámenes se ajustan a la bibliografía y lo dado en clase?' },
      { id: 'tce_2', text: '¿Son claros los criterios de corrección aplicados?' }
    ]
  }
];

const SISTEMAS_SUBJECTS = [
  "Análisis Matemático I", "Álgebra y Geometría Analítica", "Física I", "Inglés I", 
  "Lógica y Estructuras Discretas", "Algoritmos y Estructuras de Datos", 
  "Arquitectura de Computadoras", "Sistemas y Procesos de Negocio",
  "Análisis Matemático II", "Física II", "Ingeniería y Sociedad", "Inglés II", 
  "Sintaxis y Semántica de los Lenguajes", "Paradigmas de Programación", 
  "Sistemas Operativos", "Análisis de Sistemas de Información",
  "Probabilidad y Estadística", "Economía", "Bases de Datos", "Desarrollo de Software", 
  "Comunicación de Datos", "Análisis Numérico", "Diseño de Sistemas de Información",
  "Legislación", "Ingeniería y Calidad de Software", "Redes de Datos", 
  "Investigación Operativa", "Simulación", "Tecnologías para la automatización", 
  "Administración de Sistemas de Información",
  "Inteligencia Artificial", "Ciencia de Datos", "Sistemas de Gestión", 
  "Gestión Gerencial", "Seguridad en los Sistemas de Información", "Proyecto Final"
];

const VIRTUAL_CURRICULUM = [
  ...SISTEMAS_SUBJECTS.map(s => ({
    id: `v_${s.replace(/\s+/g, '_')}_sis`,
    nombre: "Cátedra General",
    catedra: s,
    carrera: "Ingeniería en Sistemas de Información"
  }))
];

export default function AcademicExcellence() {
  const [teachersList, setTeachersList] = useState([]);
  const [selectedCarrera, setSelectedCarrera] = useState('Ingeniería en Sistemas de Información');
  const [selectedCatedra, setSelectedCatedra] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherStats, setTeacherStats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  const initialFormState = {
    ict_1: 0, ict_2: 0, ict_3: 0,
    ndc_1: 0, ndc_2: 0, ndc_3: 0,
    cat_1: 0, cat_2: 0, cat_3: 0,
    tce_1: 0, tce_2: 0,
    accionExcelencia: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  // Cargar lista de docentes al montar
  useEffect(() => {
    const fetchTeachers = async () => {
      const dbTeachers = await getAllTeachers();
      
      // Combinar los virtuales (hardcoded) con los reales de la DB
      // Si un docente real de la DB tiene el mismo nombre y cátedra, lo preferimos para tener el ID real de Firestore
      const combined = [...VIRTUAL_CURRICULUM];
      
      dbTeachers.forEach(dbT => {
        const index = combined.findIndex(v => v.catedra === dbT.catedra && v.carrera === dbT.carrera && v.nombre === dbT.nombre);
        if (index !== -1) {
          combined[index] = dbT; // Reemplazar virtual con real si ya existe en DB
        } else {
          combined.push(dbT); // Añadir docente nuevo si no está en el currículo base
        }
      });

      setTeachersList(combined);
    };
    fetchTeachers();
  }, []);

  // Derivados para los dropdowns
  const uniqueCarreras = [...new Set(teachersList.map(t => t.carrera))].sort();
  const uniqueCatedras = teachersList
    .filter(t => t.carrera === selectedCarrera)
    .reduce((acc, curr) => {
      if (!acc.includes(curr.catedra)) acc.push(curr.catedra);
      return acc;
    }, [])
    .sort();
    
  const availableDocentes = teachersList.filter(t => t.catedra === selectedCatedra && t.carrera === selectedCarrera);

  // Auto-seleccionar docente al cambiar la cátedra
  useEffect(() => {
    if (selectedCatedra) {
      const teacher = teachersList.find(t => t.catedra === selectedCatedra && t.carrera === selectedCarrera);
      if (teacher) {
        setSelectedTeacher(teacher);
      }
    } else {
      setSelectedTeacher(null);
    }
  }, [selectedCatedra, teachersList, selectedCarrera]);

  // Si cambia la carrera, resetear cátedra
  useEffect(() => {
    setSelectedCatedra('');
  }, [selectedCarrera]);

  // Si cambia la cátedra, nada especial ahora
  useEffect(() => {
    // No-op for now
  }, [selectedCatedra]);

  const handleRatingChange = (questionId, value) => {
    setFormData(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTeacher) {
      setErrorMsg('Por favor, selecciona una cátedra.');
      return;
    }
    
    // Validate all 12 questions
    const allQuestionsAnswered = Object.keys(formData)
      .filter(key => key !== 'accionExcelencia')
      .every(key => formData[key] > 0);
      
    if (!allQuestionsAnswered) {
      setErrorMsg('Por favor, califica todas las métricas de 1 a 5 estrellas.');
      return;
    }

    if (formData.accionExcelencia.trim() === '') {
      setErrorMsg('Por favor, ingresa una acción sugerida para la excelencia.');
      return;
    }


    setStatus('loading');
    
    const ict = (formData.ict_1 + formData.ict_2 + formData.ict_3) / 3;
    const ndc = (formData.ndc_1 + formData.ndc_2 + formData.ndc_3) / 3;
    const cat = (formData.cat_1 + formData.cat_2 + formData.cat_3) / 3;
    const tce = (formData.tce_1 + formData.tce_2) / 2;

    const evaluationData = {
      ...formData,
      ict, ndc, cat, tce
    };

    const result = await submitEvaluation(selectedTeacher.id, evaluationData, selectedTeacher);
    
    if (result.success) {
      setStatus('success');
      setFormData(initialFormState);
      
      setTimeout(async () => {
        setStatus('idle');
      }, 3000);
    } else {
      setStatus('error');
      setErrorMsg(result.error || 'Ocurrió un error al enviar la evaluación.');
    }
  };

  const StarRating = ({ metricId, value }) => (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star}
          size={32}
          className={styles.star}
          fill={star <= value ? "#ef5f27" : "none"}
          color={star <= value ? "#ef5f27" : "#d1d5db"}
          onClick={() => handleRatingChange(metricId, star)}
          style={{ 
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: star <= value ? 'drop-shadow(0 0 8px rgba(239, 95, 39, 0.3))' : 'none'
          }}
        />
      ))}
    </div>
  );

  return (
    <section id="excelencia" className={styles.section}>
      <div className="container">
        <h2 style={{ 
          fontSize: '3rem', 
          fontWeight: '800', 
          color: 'var(--color-primary)', 
          textAlign: 'center',
          marginBottom: '16px'
        }} className="text-gradient-primary">
          Excelencia Académica
        </h2>
        <p className={styles.subtitle} style={{ marginBottom: '48px' }}>
          Monitor Estratégico de Calidad Educativa - Gestión Directa AT
        </p>

        {/* 1. Camino de la Información */}
        <div style={{ marginBottom: '64px' }}>
          <DataFlowTimeline />
        </div>

        {/* 2. Bloque Institucional Estático (Diseño de 2 Columnas) */}
        <div style={{ 
          maxWidth: '1100px', 
          margin: '0 auto 60px auto', 
          padding: '60px', 
          background: '#ffffff', 
          borderRadius: '3rem',
          border: '5px solid #3f75ab',
          boxShadow: '0 40px 80px rgba(0,0,0,0.12)',
          position: 'relative'
        }} className="animate-fade-in">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'minmax(260px, 1fr) 2fr', 
            gap: '60px', 
            alignItems: 'center' 
          }}>
            {/* Columna Izquierda: Identidad Visual */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '260px', 
                height: '260px', 
                borderRadius: '50%', 
                overflow: 'hidden', 
                border: '8px solid #3f75ab', 
                boxShadow: '0 20px 40px rgba(63, 117, 171, 0.3)',
                margin: '0 auto 24px auto'
              }}>
                <Image 
                  src="/gala.png"
                  alt="Gala Bórquez"
                  width={260}
                  height={260}
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>

            {/* Columna Derecha: Manifiesto Institucional y Firma */}
            <div>
              <div style={{ paddingRight: '20px' }}>
                <p style={{ 
                  fontSize: '1.45rem', 
                  color: '#000000', 
                  lineHeight: '1.6', 
                  fontWeight: '700', 
                  fontStyle: 'italic',
                  margin: '0 0 32px 0',
                  letterSpacing: '-0.01em'
                }}>
                  "En Alternativa Tecnológica entendemos que la educación de excelencia es un diálogo constante. El Sistema de Retroalimentación de Excelencia no nace para juzgar, sino para construir puentes. Al Estudiante: Le damos la voz para proteger el valor de su título. Al Docente: Le brindamos una métrica real y profesional de su impacto en el aula. Creemos firmemente que una observación, una sugerencia o incluso una queja, son indicadores valiosos para fortalecer la enseñanza. No buscamos señalar, buscamos optimizar el proceso educativo. Porque cuando el aula mejora, ganamos todos: el docente en su prestigio y el alumno en su futuro profesional."
                </p>
                <div style={{ 
                  borderTop: '2px solid #f3f4f6', 
                  paddingTop: '20px',
                  textAlign: 'right' 
                }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#3f75ab', margin: '0 0 4px 0', fontWeight: '950', letterSpacing: '-0.02em' }}>Gala Bórquez</h3>
                  <span style={{ fontSize: '1.1rem', color: '#4b5563', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Presidenta del Centro de Estudiantes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Botón de Acción Principal */}
        {!showForm && (
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <button 
              className="glass-button" 
              style={{ 
                fontSize: '1.8rem', 
                padding: '24px 80px', 
                borderRadius: '1.5rem', 
                background: '#3f75ab', 
                color: '#fff', 
                width: '100%', 
                maxWidth: '500px',
                boxShadow: '0 20px 40px rgba(63, 117, 171, 0.4)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '900',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '-0.02em'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 30px 60px rgba(63, 117, 171, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(63, 117, 171, 0.4)';
              }}
              onClick={() => setShowForm(true)}
            >
              Evaluar Cátedra <ChevronDown size={28} style={{ marginLeft: '12px', verticalAlign: 'middle' }} />
            </button>
          </div>
        )}

        {/* 4. Formulario de Evaluación (Revelable) */}
        {showForm && (
          <div className="animate-fade-in-up" style={{ 
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '60px', 
            background: '#ffffff', 
            border: '2px solid #3f75ab', 
            borderRadius: '2.5rem',
            boxShadow: '0 40px 80px rgba(0,0,0,0.18)' 
          }}>
            <div className="animate-fade-in">
              {status === 'success' ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <CheckCircle size={64} color="#3f75ab" style={{ margin: '0 auto 16px auto' }} />
                  <h4 style={{ color: '#3f75ab', marginBottom: '8px', fontSize: '2rem', fontWeight: '900' }}>Métricas Registradas</h4>
                  <p style={{ fontSize: '1.2rem', color: '#4b5563', fontWeight: '600' }}>Tu feedback ha sido procesado de forma anónima para la mejora institucional.</p>
                  <button className="glass-button" style={{ marginTop: '32px', background: '#3f75ab', color: '#fff', padding: '12px 32px', borderRadius: '1rem' }} onClick={() => setStatus('idle')}>
                    Evaluar otra cátedra
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Identificación Académica (Ahora dentro del formulario) */}
                  <div style={{ background: '#f9fafb', padding: '40px', borderRadius: '2rem', border: '1px solid #e5e7eb', marginBottom: '48px' }}>
                    <h4 style={{ color: '#000000', fontSize: '1.4rem', fontWeight: '900', marginBottom: '24px' }}>Identificación de Cátedra</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: '800', marginBottom: '12px', color: '#000000' }}>Carrera</label>
                        <select 
                          className="glass-input" 
                          value={selectedCarrera} 
                          disabled
                          style={{ width: '100%', background: '#ffffff', border: '2px solid #3f75ab', color: '#000000', fontWeight: '700', padding: '12px', borderRadius: '0.75rem' }}
                        >
                          <option value="Ingeniería en Sistemas de Información">Ingeniería en Sistemas de Información</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: '800', marginBottom: '12px', color: '#000000' }}>Cátedra / Materia</label>
                        <select 
                          className="glass-input" 
                          value={selectedCatedra} 
                          onChange={(e) => setSelectedCatedra(e.target.value)}
                          style={{ width: '100%', background: '#ffffff', border: '2px solid #3f75ab', color: '#000000', fontWeight: '700', padding: '12px', borderRadius: '0.75rem' }}
                        >
                          <option value="">Selecciona la materia...</option>
                          {uniqueCatedras.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {!selectedTeacher ? (
                    <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed #d1d5db', borderRadius: '2rem' }}>
                      <p style={{ fontSize: '1.1rem', color: '#6b7280', fontWeight: '600' }}>Selecciona una cátedra arriba para desplegar las métricas.</p>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      {/* Métricas Axes */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        {AXES.map((axis) => (
                          <div key={axis.id} style={{ background: '#ffffff', padding: '40px', borderRadius: '2rem', border: '1px solid #e5e7eb', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                              <h4 style={{ margin: 0, fontSize: '1.4rem', color: '#3f75ab', fontWeight: '900' }}>{axis.title}</h4>
                              <div className="tooltip-container" title={axis.description} style={{ cursor: 'help', color: '#ef5f27' }}>
                                <Info size={22} />
                              </div>
                            </div>
                            <p style={{ fontSize: '1rem', color: '#4b5563', marginBottom: '24px', borderBottom: '2px solid #f3f4f6', paddingBottom: '16px', fontWeight: '600' }}>
                              {axis.description}
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                              {axis.questions.map((q) => (
                                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '1.1rem', flex: '1 1 300px', fontWeight: '700', color: '#000000' }}>{q.text}</span>
                                  <StarRating metricId={q.id} value={formData[q.id]} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Acción para la Excelencia */}
                      <div style={{ marginTop: '48px', background: '#ffffff', padding: '40px', borderRadius: '2.5rem', border: '3px solid #3f75ab' }}>
                        <label style={{ display: 'block', fontWeight: 950, marginBottom: '8px', color: '#000000', fontSize: '1.6rem', letterSpacing: '-0.02em' }}>
                          Acción para la Excelencia
                        </label>
                        <textarea 
                          className="glass-input" 
                          rows="6" 
                          placeholder="Deja aquí tus sugerencias, observaciones o comentarios sobre la cátedra..."
                          value={formData.accionExcelencia}
                          onChange={(e) => setFormData(prev => ({ ...prev, accionExcelencia: e.target.value }))}
                          style={{ 
                            width: '100%',
                            resize: 'vertical', 
                            background: '#ffffff', 
                            border: '1px solid #e5e7eb', 
                            color: '#000000',
                            padding: '20px',
                            fontSize: '1.2rem',
                            borderRadius: '1rem',
                            marginTop: '12px'
                          }}
                        />
                        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(63, 117, 171, 0.05)', padding: '16px', borderRadius: '1rem' }}>
                          <ShieldCheck size={24} style={{ color: '#3f75ab' }} />
                          <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151', fontWeight: '600' }}>
                            <strong>Privacidad AT:</strong> Tu feedback es anónimo y seguro.
                          </p>
                        </div>
                      </div>

                      {status === 'error' && (
                        <div style={{ color: '#ac55a4', background: 'rgba(172, 85, 164, 0.1)', padding: '16px', borderRadius: '8px', fontSize: '1rem', marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid #ac55a4', fontWeight: '700' }}>
                          <AlertCircle size={20} /> {errorMsg}
                        </div>
                      )}

                      <div style={{ marginTop: '48px', textAlign: 'center' }}>
                        <button type="submit" className="glass-button" disabled={status === 'loading'} style={{ width: '100%', maxWidth: '400px', background: '#3f75ab', color: '#fff', fontSize: '1.5rem', padding: '20px', borderRadius: '1.25rem', fontWeight: '900' }}>
                          {status === 'loading' ? <Loader2 className="animate-spin" size={24} /> : "Procesar Evaluación"}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
