"use client";
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
      padding: '60px 20px',
      marginTop: '40px',
      marginBottom: '60px',
      overflow: 'hidden'
    }} className="animate-fade-in-up delay-400">
      
      <style jsx>{`
        .gala-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          position: relative;
        }
        .gala-quote-box {
          flex: 1 1 60%;
          position: relative;
          z-index: 10; /* Texto siempre arriba */
        }
        .gala-image-box {
          flex: 1 1 40%;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          position: relative;
          min-height: 450px;
        }
        .photo-wrapper {
          position: absolute;
          bottom: -80px;
          right: 0;
          width: 100%;
          height: 120%;
          z-index: 1;
          pointerEvents: none;
          display: flex;
          justify-content: center;
          align-items: flex-end;
        }
        .quote-text {
          font-size: clamp(1.5rem, 4vw, 2.5rem);
          line-height: 1.4;
          color: #1f2937;
          font-weight: 500;
          font-style: italic;
          margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .gala-container {
            flex-direction: column !important;
            text-align: center;
            gap: 20px;
          }
          .gala-quote-box {
            flex: 1 1 100%;
            padding-bottom: 2rem;
          }
          .gala-image-box {
            flex: 1 1 100%;
            min-height: auto;
            margin-top: 0;
            position: relative;
            overflow: visible;
          }
          .photo-wrapper {
            position: relative !important;
            bottom: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 auto;
            display: block;
          }
          .gala-photo {
            max-width: 350px !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 auto;
          }
          .quote-text {
            font-size: 1.35rem;
          }
          .footer-flex {
            justify-content: center;
          }
        }
      `}</style>

      <div className="container gala-container">
        
        {/* Left Side: Quote */}
        <div className="gala-quote-box">
          <Quote size={60} color="var(--color-primary)" style={{ opacity: 0.15, position: 'absolute', top: '-20px', left: '-20px', zIndex: -1 }} />
          
          <blockquote style={{ margin: 0 }}>
            <p className="quote-text">
              "La gestión no es un favor, es un derecho. Entendemos la tecnología como la gran igualadora que nos permite acercar la facultad a cada estudiante, sin intermediarios ni punteros. Nuestra Mesa de Entrada Digital garantiza que tu esfuerzo académico sea lo único que importe. Estamos liderando el avance tecnológico para que tus derechos nunca más sean moneda de cambio."
            </p>
            <footer className="footer-flex" style={{ 
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
        <div className="gala-image-box">
          <div className="photo-wrapper">
            <Image 
              src="/gala.png"
              alt="Gala Borquez"
              width={500}
              height={600}
              className="gala-photo"
              style={{ objectFit: 'contain', filter: 'drop-shadow(-10px 10px 20px rgba(0,0,0,0.1))' }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
