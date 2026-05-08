"use client";
import React, { useState, useEffect } from 'react';
import { subscribeToAuthChanges } from '@/services/auth';
import AdminLogin from './AdminLogin';
import { Loader2, ShieldAlert } from 'lucide-react';

/**
 * AuthGuard Component - Security Architect Optimized
 * Bloquea el renderizado de sus hijos hasta que el estado de autenticación 
 * y la sincronización del Token JWT de Firebase se resuelvan por completo.
 * Erradica race conditions en el handshake de Firestore.
 */
export default function AuthGuard({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    // Suscripción al estado de autenticación de Firebase
    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      try {
        if (currentUser) {
          // FORZAR SINCRONIZACIÓN DE TOKEN ANTES DE CONSULTAR FIRESTORE
          // Esto asegura que el cliente de Firestore tenga las credenciales inyectadas
          await currentUser.getIdToken(true);
          setUser(currentUser);
          setIsTokenValid(true);
        } else {
          setUser(null);
          setIsTokenValid(false);
        }
      } catch (error) {
        console.error("Error validando token de seguridad institucional:", error);
        setAuthError(true);
      } finally {
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (authError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', gap: '20px' }}>
        <ShieldAlert size={64} color="#ef5f27" />
        <h2 style={{ color: '#ef5f27', fontWeight: '950' }}>Error de Validación de Seguridad</h2>
        <p style={{ color: '#4b5563', fontWeight: '700' }}>No se pudo sincronizar el token de acceso. Por favor, reintente el inicio de sesión.</p>
        <button onClick={() => window.location.reload()} className="glass-button" style={{ background: '#3f75ab', color: '#fff' }}>Reintentar Conexión</button>
      </div>
    );
  }

  if (isAuthLoading || (user && !isTokenValid)) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        gap: '16px'
      }}>
        <Loader2 className="animate-spin" size={48} color="#3f75ab" />
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#3f75ab', 
          fontWeight: '800',
          letterSpacing: '-0.02em' 
        }}>
          {user ? "Sincronizando token de seguridad..." : "Verificando credenciales institucionales..."}
        </p>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  // Renderizado Condicional Absoluto: Solo si el token es válido
  return (
    <>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { user });
        }
        return child;
      })}
    </>
  );
}
