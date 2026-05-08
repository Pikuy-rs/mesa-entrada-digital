"use client";
import React, { useState, useEffect } from 'react';
import { subscribeToAuthChanges } from '@/services/auth';
import AdminLogin from './AdminLogin';
import { Loader2 } from 'lucide-react';

/**
 * AuthGuard Component
 * Bloquea el renderizado de sus hijos hasta que el estado de autenticación se resuelva.
 * Previene race conditions en listeners de Firestore.
 */
export default function AuthGuard({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Suscripción al estado de autenticación de Firebase
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isAuthLoading) {
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
          Verificando credenciales institucionales...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  // Clonamos el hijo inyectando el usuario si es necesario, 
  // o simplemente renderizamos si el componente hijo maneja su propia lógica.
  // En este caso, AdminDashboard recibirá al usuario.
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
