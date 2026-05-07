"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { UserVoice, Database, Presentation, ArrowRight } from 'lucide-react';

// Custom icons to match the requested narrative
const StepIcon1 = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

export default function DataFlowTimeline() {
  const steps = [
    {
      title: "Aporte Estudiantil",
      description: "Alimentas el sistema con tu experiencia real en la cátedra.",
      icon: StepIcon1,
      color: "#3f75ab"
    },
    {
      title: "Procesamiento AT",
      description: "Alternativa Tecnológica recopila, anonimiza y analiza los datos.",
      icon: Database,
      color: "#ac55a4"
    },
    {
      title: "Impacto Institucional",
      description: "Generamos reportes con recomendaciones directas para autoridades.",
      icon: Presentation,
      color: "#10b981"
    }
  ];

  return (
    <div style={{ margin: '60px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h3 style={{ color: '#3f75ab', fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>
          El Camino de la Información
        </h3>
        <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          Tu voz se transforma en gestión estratégica para una mejor facultad.
        </p>
      </div>

      <div className="timeline-container" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '40px',
        maxWidth: '1000px',
        margin: '0 auto',
        position: 'relative'
      }}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center',
                position: 'relative',
                zIndex: 2
              }}
            >
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '20px',
                background: '#fff',
                border: `2px solid ${step.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: `0 10px 25px ${step.color}20`,
                color: step.color
              }}>
                <Icon size={32} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '10px', color: '#070707' }}>
                {step.title}
              </h4>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#4b5563' }}>
                {step.description}
              </p>

              {/* Connecting Line (Horizontal for desktop) */}
              {index < steps.length - 1 && (
                <div className="connecting-line" style={{
                  position: 'absolute',
                  top: '35px',
                  left: 'calc(50% + 45px)',
                  width: 'calc(100% - 90px)',
                  height: '2px',
                  background: `linear-gradient(90deg, ${step.color} 0%, ${steps[index+1].color} 100%)`,
                  opacity: 0.3,
                  zIndex: -1
                }} />
              )}
            </motion.div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .timeline-container {
            flex-direction: column !important;
            align-items: center !important;
            gap: 50px !important;
          }
          .connecting-line {
            width: 2px !important;
            height: 50px !important;
            left: 50% !important;
            top: auto !important;
            bottom: -50px !important;
            transform: translateX(-50%) !important;
            background: linear-gradient(180deg, var(--line-start) 0%, var(--line-end) 100%) !important;
          }
        }
      `}} />
    </div>
  );
}
