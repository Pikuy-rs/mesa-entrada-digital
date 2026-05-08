import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp,
  deleteField 
} from "firebase/firestore";

const SUBMISSIONS_COLLECTION = "submissions";

/**
 * Skill para la administración de la Mesa de Entrada y Reportes.
 */
export const adminSkill = {
  /**
   * Suscribirse a los trámites en tiempo real con manejo de errores.
   */
  subscribeSubmissions(callback, errorCallback) {
    const q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(q, 
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      },
      (error) => {
        if (errorCallback) errorCallback(error);
      }
    );
  },

  /**
   * Actualiza el estado de un trámite (ej: 'completed').
   */
  async updateStatus(id, status) {
    try {
      const updateData = { status };
      if (status === 'completed') {
        updateData.completedAt = serverTimestamp();
      } else {
        updateData.completedAt = deleteField();
      }
      await updateDoc(doc(db, SUBMISSIONS_COLLECTION, id), updateData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Elimina un registro de trámite.
   */
  async deleteRecord(id) {
    try {
      await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, id));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Prepara los datos para una exportación limpia de trámites.
   */
  prepareExportData(records, filterStatus = 'pending') {
    return records
      .filter(r => (filterStatus ? r.status === filterStatus : true))
      .map(r => ({
        Fecha: r.createdAt?.toDate?.() ? r.createdAt.toDate().toLocaleString() : 'N/A',
        Estudiante: r.nombre || 'N/A',
        DNI: r.dni || 'N/A',
        Carrera: r.carrera || 'N/A',
        Sede: r.ubicacion || 'N/A',
        Trámite: r.tipoSolicitud || 'N/A',
        Estado: r.status || 'N/A',
        Descripción: r.descripcion || 'N/A'
      }));
  },

  /**
   * Calcula el SLA (Tiempo Promedio de Resolución) de los trámites.
   */
  calculateSLA(records) {
    const resolved = records.filter(r => 
      r.status === 'completed' && 
      r.createdAt?.toDate && 
      r.completedAt?.toDate
    );

    if (resolved.length === 0) return "Sin datos";

    const totalHours = resolved.reduce((acc, curr) => {
      const start = curr.createdAt.toDate();
      const end = curr.completedAt.toDate();
      const diff = (end - start) / (1000 * 60 * 60);
      return acc + diff;
    }, 0);

    const averageHours = totalHours / resolved.length;

    if (averageHours < 24) {
      return `${Math.round(averageHours)} Horas`;
    } else {
      const days = Math.floor(averageHours / 24);
      const remainingHours = Math.round(averageHours % 24);
      return `${days} ${days === 1 ? 'Día' : 'Días'}${remainingHours > 0 ? ` y ${remainingHours}h` : ''}`;
    }
  }
};
