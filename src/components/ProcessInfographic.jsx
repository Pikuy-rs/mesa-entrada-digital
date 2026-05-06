"use client";
import React from 'react';
import { FormInput, Settings, MapPin } from 'lucide-react';

export default function ProcessInfographic() {
  return (
    <div style={{ marginBottom: '60px', padding: '0 20px' }} className="animate-fade-in-up delay-200">
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>La Ruta de tu Trámite</h2>
        <p style={{ fontSize: '1.2rem', color: '#4b5563', maxWidth: '600px', margin: '12px auto 0' }}>
          Un proceso ágil, transparente y directo.
        </p>
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        position: 'relative',
        maxWidth: '900px',
        margin: '0 auto',
        gap: '20px'
      }} className="stepper-container">
        
        {/* Responsive CSS for Stepper Lines via inline style tag for simplicity */}
        <style dangerouslySetInnerHTML={{__html: `
          .step-node {
            transition: all 0.3s ease;
            cursor: default;
          }
          .step-node:hover .icon-box {
            transform: scale(1.1);
            box-shadow: 0 0 30px rgba(65, 119, 174, 0.5);
          }
          .step-node:hover .icon-box.alert {
            box-shadow: 0 0 30px rgba(172, 85, 164, 0.5);
          }
          .step-node:hover .icon-box.success {
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
          }
          @media (max-width: 768px) {
            .stepper-container {
              flex-direction: column !important;
              align-items: center !important;
              gap: 40px !important;
            }
            .line-1, .line-2 {
              width: 4px !important;
              height: 50px !important;
              left: 50% !important;
              top: auto !important;
              bottom: -40px !important;
              transform: translateX(-50%) !important;
            }
          }
        `}} />

        {/* Paso 1 */}
        <div className="step-node" style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div className="icon-box" style={{ 
            width: '80px', height: '80px', 
            borderRadius: '50%', 
            background: '#ffffff', 
            border: '2px solid var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 10px 20px rgba(65, 119, 174, 0.15)',
            transition: 'all 0.3s'
          }}>
            <FormInput size={36} color="var(--color-primary)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-text)' }}>1. Solicitud Digital</h3>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: '#6b7280' }}>
            Completás tus datos en 1 minuto.
          </p>
          
          {/* Line to Step 2 */}
          <div className="line-1" style={{
            position: 'absolute',
            top: '40px',
            left: 'calc(50% + 40px)',
            width: 'calc(100% - 80px)',
            height: '4px',
            borderBottom: '4px dotted var(--color-primary)',
            zIndex: -1,
            opacity: 0.6
          }}></div>
        </div>

        {/* Paso 2 */}
        <div className="step-node" style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div className="icon-box alert" style={{ 
            width: '80px', height: '80px', 
            borderRadius: '50%', 
            background: '#ffffff', 
            border: '2px solid var(--color-alert)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 10px 20px rgba(172, 85, 164, 0.15)',
            transition: 'all 0.3s'
          }}>
            <Settings size={36} color="var(--color-alert)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-text)' }}>2. Gestión Directa</h3>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: '#6b7280' }}>
            El Centro de Estudiantes procesa tu pedido sin intermediarios.
          </p>

          {/* Line to Step 3 */}
          <div className="line-2" style={{
            position: 'absolute',
            top: '40px',
            left: 'calc(50% + 40px)',
            width: 'calc(100% - 80px)',
            height: '4px',
            borderBottom: '4px dotted var(--color-alert)',
            zIndex: -1,
            opacity: 0.6
          }}></div>
        </div>

        {/* Paso 3 */}
        <div className="step-node" style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div className="icon-box success" style={{ 
            width: '80px', height: '80px', 
            borderRadius: '50%', 
            background: '#ffffff', 
            border: '2px solid #10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 10px 20px rgba(16, 185, 129, 0.15)',
            transition: 'all 0.3s'
          }}>
            <MapPin size={36} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-text)' }}>3. Retiro Seguro</h3>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: '#6b7280' }}>
            En <strong>24/48hs</strong> buscás tu trámite por Casa Central (Centro de Estudiantes) o Anexo Concepción (SAE).
          </p>
        </div>
        
      </div>
    </div>
  );
}
