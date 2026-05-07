"use client";
import React from 'react';
import Header from '../components/Header';
import ProcessInfographic from '../components/ProcessInfographic';
import GalaQuote from '../components/GalaQuote';
import SubmissionForm from '../components/SubmissionForm';
import AcademicExcellence from '../components/AcademicExcellence';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [activeModule, setActiveModule] = React.useState('mesa');

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Animated Background Shapes */}
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>
      <div className="shape shape-3"></div>

      <Navbar activeModule={activeModule} setActiveModule={setActiveModule} />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '80px', zIndex: 1 }}>
        <Header />
        
        <main className="container" style={{ width: '100%', maxWidth: '1000px', zIndex: 10 }}>
          <AnimatePresence mode="wait">
            {activeModule === 'mesa' ? (
              <motion.div
                key="mesa"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <ProcessInfographic />
                <div id="mesa-entrada" style={{ marginTop: '40px' }}>
                  <SubmissionForm />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="excelencia"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                id="excelencia"
              >
                <AcademicExcellence />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      
      {/* Footer */}
      <footer style={{ 
        background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--glass-border)',
        padding: '60px 20px 40px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
        marginTop: 'auto'
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          
          <div style={{ opacity: 0.9 }}>
            <Image 
              src="/logo-transparent.png" 
              alt="AT Logo Footer" 
              width={100} 
              height={100} 
              style={{ objectFit: 'contain' }}
            />
          </div>
          
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <p style={{ color: 'var(--color-primary)', fontSize: '1.1rem', margin: '0 0 8px 0', fontWeight: 600 }}>
              Alternativa Tecnológica
            </p>
            <p style={{ color: '#4b5563', fontSize: '0.9rem', marginTop: '8px', lineHeight: 1.5 }}>
              Desarrollado para garantizar la transparencia, rapidez y eficiencia en la gestión estudiantil.
            </p>
          </div>
          
          <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)', margin: '16px 0' }}></div>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0, fontWeight: 500 }}>
              © {new Date().getFullYear()} Mesa de Entrada Digital. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
