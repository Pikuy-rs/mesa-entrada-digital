import React from 'react';
import Image from 'next/image';

export default function Header() {
  return (
    <header style={{ 
      position: 'relative',
      padding: '60px 20px 40px',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      textAlign: 'center',
      zIndex: 10
    }} className="animate-fade-in-up delay-100">
      
      {/* Logo Container */}
      <div style={{ 
        position: 'relative',
        marginBottom: '40px',
        animation: 'float 6s ease-in-out infinite'
      }}>
        {/* Glow behind the logo */}
        <div style={{ 
          position: 'absolute', 
          top: '50%', left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: '120%', height: '120%', 
          background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
          filter: 'blur(30px)',
          zIndex: -1
        }}></div>
        <Image 
          src="/logo-transparent.png" 
          alt="Alternativa Tecnológica" 
          width={350} 
          height={350} 
          style={{ objectFit: 'contain', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.15))' }}
          priority
        />
      </div>

      {/* Hero Text */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="text-gradient" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '16px' }}>
          Gestión Directa, <br />
          <span className="text-gradient-primary">Derechos Reales.</span>
        </h1>
      </div>
    </header>
  );
}
