/**
 * Utilidades centralizadas para el Dashboard GALA.
 */

/**
 * Obtiene el color y etiqueta del semáforo institucional basado en el puntaje.
 * Rangos definidos:
 * - 🟢 Excelente: 3.8 - 5.0
 * - 🟡 Aceptable: 2.6 - 3.7
 * - 🔴 Crítico: 1.0 - 2.5
 */
export const getInstitutionalStatus = (value) => {
  const val = parseFloat(value);
  if (val >= 3.8) {
    return { 
      color: '#10b981', 
      bg: '#dcfce7', 
      text: '#166534', 
      label: 'Excelente',
      status: 'success'
    };
  }
  if (val >= 2.6) {
    return { 
      color: '#f59e0b', 
      bg: '#fff7ed', 
      text: '#9a3412', 
      label: 'Aceptable',
      status: 'warning'
    };
  }
  return { 
    color: '#ef4444', 
    bg: '#fee2e2', 
    text: '#991b1b', 
    label: 'Crítico',
    status: 'danger'
  };
};

/**
 * Formatea un número a un decimal fijo para consistencia en el Dashboard.
 */
export const formatMetric = (value) => {
  const val = parseFloat(value);
  return isNaN(val) ? '0.0' : val.toFixed(1);
};
