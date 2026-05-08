import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";

const SUBMISSIONS_COLLECTION = "submissions";

/**
 * Skill para la administración de la Mesa de Entrada y Reportes.
 */
export const adminSkill = {
  /**
   * Suscribirse a los trámites en tiempo real.
   */
  subscribeSubmissions(callback) {
    const q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    });
  },

  /**
   * Actualiza el estado de un trámite (ej: 'completed').
   */
  async updateStatus(id, status) {
    try {
      const updateData = { status };
      if (status === 'completed') {
        updateData.completedAt = serverTimestamp();
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
  }
};
