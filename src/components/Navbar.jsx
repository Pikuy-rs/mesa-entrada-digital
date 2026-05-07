"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, BarChart3, Users, Heart } from 'lucide-react';

export default function Navbar({ activeModule, setActiveModule }) {
  const menuItems = [
    { id: 'mesa', label: 'Mesa de Entrada' },
    { id: 'excelencia', label: 'Excelencia Académica' },
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'rgba(252, 252, 252, 0.8)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(168, 158, 165, 0.2)',
      padding: '0.75rem 0',
      transition: 'all 0.3s'
    }}>
      <div className="container" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0 20px'
      }}>
        {/* Brand */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div style={{ 
            width: '32px', 
            height: '32px', 
            background: 'linear-gradient(135deg, #3f75ab 0%, #ac55a4 100%)', 
            borderRadius: '6px',
            boxShadow: '0 4px 10px rgba(63, 117, 171, 0.2)'
          }}></div>
          <span className="brand-text" style={{ 
            fontWeight: '800', 
            color: '#3f75ab', 
            fontSize: '1.1rem',
            letterSpacing: '-0.02em'
          }}>
            Alternativa Tecnológica
          </span>
        </motion.div>

        {/* Menu Items */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {menuItems.map((item) => {
            const isActive = activeModule === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => !item.disabled && setActiveModule(item.id)}
                disabled={item.disabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? 'rgba(63, 117, 171, 0.1)' : 'transparent',
                  color: item.disabled ? '#9ca3af' : (isActive ? '#3f75ab' : '#4b5563'),
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  opacity: item.disabled ? 0.6 : 1
                }}
              >
                <span>{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="nav-pill"
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      left: '20%',
                      right: '20%',
                      height: '2px',
                      background: '#3f75ab',
                      borderRadius: '2px'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .brand-text { display: none; }
        @media (min-width: 640px) {
          .brand-text { display: block; }
        }
        @media (max-width: 640px) {
          nav .container { padding: 0 10px !important; }
          nav button { padding: 8px 12px !important; font-size: 0.85rem !important; }
        }
      `}} />
    </nav>
  );
}
