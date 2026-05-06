import React from 'react';
import { Quote } from 'lucide-react';
import Image from 'next/image';

export default function GalaQuote() {
  return (
    <section style={{ 
      width: '100vw', 
      position: 'relative', 
      left: '50%', 
      right: '50%', 
      marginLeft: '-50vw', 
      marginRight: '-50vw',
      background: 'linear-gradient(135deg, rgba(65, 119, 174, 0.05) 0%, rgba(172, 85, 164, 0.05) 100%)',
      borderTop: '1px solid rgba(65, 119, 174, 0.1)',
      borderBottom: '1px solid rgba(172, 85, 164, 0.1)',
      padding: '80px 20px',
      marginTop: '40px',
      marginBottom: '60px',
      overflow: 'hidden'
    }} className="animate-fade-in-up delay-400">
      
      <div className="container" style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: '40px',
        position: 'relative'
      }}>
        
        {/* Left Side: Quote */}
        <div style={{ flex: '1 1 60%', position: 'relative', zIndex: 2 }}>
          <Quote size={60} color="var(--color-primary)" style={{ opacity: 0.2, position: 'absolute', top: '-20px', left: '-20px', zIndex: -1 }} />
          
          <blockquote style={{ margin: 0 }}>
            <p style={{ 
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
              lineHeight: 1.5, 
              color: '#1f2937', 
              fontWeight: 500,
              fontStyle: 'italic',
              marginBottom: '32px'
            }}>
              "La gestión no es un favor, es un derecho. Entendemos la tecnología como la gran igualadora que nos permite acercar la facultad a cada estudiante, sin intermediarios ni punteros. Nuestra Mesa de Entrada Digital garantiza que tu esfuerzo académico sea lo único que importe. Estamos liderando el avance tecnológico para que tus derechos nunca más sean moneda de cambio."
            </p>
            <footer style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px' 
            }}>
              <div style={{ width: '60px', height: '4px', background: 'var(--color-alert)' }}></div>
              <div>
                <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--color-primary)' }}>Gala Borquez</strong>
                <span style={{ fontSize: '1.1rem', color: '#6b7280' }}>Presidenta del Centro de Estudiantes</span>
              </div>
            </footer>
          </blockquote>
        </div>

        {/* Right Side: Image */}
        <div style={{ 
          flex: '1 1 40%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-end',
          position: 'relative',
          minHeight: '400px'
        }}>
          <div style={{
            position: 'absolute',
            bottom: '-80px',
            right: '0',
            width: '100%',
            height: '120%',
            zIndex: 1,
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end'
          }}>
            <Image 
              src="/gala.png"
              alt="Gala Borquez"
              width={500}
              height={600}
              style={{ objectFit: 'contain', filter: 'drop-shadow(-10px 10px 20px rgba(0,0,0,0.1))', maxWidth: '500px' }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
