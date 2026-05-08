"use client";
import React, { useState } from 'react';
import { loginAdmin } from '@/services/auth';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await loginAdmin(email, password);
    
    if (!result.success) {
      setError('Credenciales inválidas. Verifique su correo y contraseña.');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ 
        background: '#ffffff', 
        padding: '48px', 
        borderRadius: '2rem', 
        textAlign: 'center', 
        maxWidth: '450px', 
        width: '90%', 
        border: '4px solid #3f75ab', 
        boxShadow: '0 40px 80px rgba(0,0,0,0.1)' 
      }}>
        <div style={{ 
          background: 'rgba(63, 117, 171, 0.1)', 
          padding: '24px', 
          borderRadius: '50%', 
          display: 'inline-block', 
          marginBottom: '24px' 
        }}>
          <Lock size={48} color="#3f75ab" />
        </div>
        <h2 style={{ fontSize: '2rem', color: '#3f75ab', fontWeight: '950', marginBottom: '8px' }}>GALA Admin</h2>
        <p style={{ color: '#4b5563', marginBottom: '32px', fontWeight: '600' }}>Acceso seguro para la gestión institucional.</p>
        
        {error && (
          <div style={{ 
            background: 'rgba(239, 95, 39, 0.1)', 
            border: '1px solid #ef5f27', 
            padding: '12px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            color: '#ef5f27',
            fontWeight: '700',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={20} />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
              placeholder="Correo electrónico"
              required
              style={{ paddingLeft: '48px', width: '100%', borderRadius: '1rem' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={20} />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              placeholder="Contraseña"
              required
              style={{ paddingLeft: '48px', width: '100%', borderRadius: '1rem' }}
            />
          </div>
          
          <button 
            type="submit" 
            className="glass-button" 
            disabled={loading}
            style={{ 
              width: '100%', 
              background: '#3f75ab', 
              color: '#fff', 
              padding: '16px', 
              borderRadius: '1rem', 
              fontSize: '1.2rem', 
              fontWeight: '900',
              marginTop: '12px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : "ENTRAR AL PANEL"}
          </button>
        </form>
      </div>
    </div>
  );
}
