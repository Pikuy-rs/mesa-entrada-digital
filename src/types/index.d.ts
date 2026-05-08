/**
 * Definiciones de tipos para el proyecto Mesa de Entrada Digital.
 * Preparación para migración progresiva a TypeScript.
 */

export interface Tramite {
  id: string;
  nombre: string;
  dni: string;
  mail?: string;
  celular?: string;
  carrera: string;
  ubicacion: string;
  tipoSolicitud: string;
  descripcion: string;
  status: 'pending' | 'completed';
  createdAt: any; // Firebase Timestamp
}

export interface EvaluacionCatedra {
  id: string;
  catedraId: string;
  teacherId?: string; // Legacy
  catedra: string;
  carrera: string;
  ict: number; // 1-5
  ndc: number; // 1-5
  cat: number; // 1-5
  tce: number; // 1-5
  accionExcelencia: string;
  createdAt: any; // Firebase Timestamp
}

export interface CatedraStats {
  ict: number;
  ndc: number;
  cat: number;
  tce: number;
  promedioGeneral: number;
  count: number;
  feedback: string[];
}

export interface Catedra {
  id: string;
  nombre: string;
  catedra: string;
  carrera: string;
  stats?: CatedraStats;
}
