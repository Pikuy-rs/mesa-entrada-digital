import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  getDocs, 
  orderBy
} from "firebase/firestore";

const CATEDRAS_COLLECTION = "catedras";
const EVALUATIONS_COLLECTION = "evaluaciones_excelencia";

/**
 * Skill para el manejo de evaluaciones de cátedras.
 * Siguiendo el estándar de modularización de lógica.
 */
export const evaluacionSkill = {
  /**
   * Obtiene todas las cátedras registradas.
   */
  async getCatedras() {
    try {
      const q = query(collection(db, CATEDRAS_COLLECTION), orderBy("catedra"));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      return [];
    }
  },

  /**
   * Valida que los rangos de las métricas estén entre 1 y 5.
   */
  validateMetrics(data) {
    const metrics = ['ict', 'ndc', 'cat', 'tce'];
    for (const m of metrics) {
      if (data[m] < 1 || data[m] > 5) return false;
    }
    return true;
  },

  /**
   * Registra una nueva evaluación.
   */
  async submit(catedraId, evaluationData, catedraObj = null) {
    try {
      let finalId = catedraId;

      // Lógica de cátedra virtual (se crea si no existe)
      if (typeof catedraId === 'string' && catedraId.startsWith('v_') && catedraObj) {
        const docRef = await addDoc(collection(db, CATEDRAS_COLLECTION), {
          nombre: catedraObj.nombre || 'Cátedra General',
          catedra: catedraObj.catedra,
          carrera: catedraObj.carrera
        });
        finalId = docRef.id;
      }

      // Registro de evaluación
      await addDoc(collection(db, EVALUATIONS_COLLECTION), {
        ...evaluationData,
        catedraId: finalId,
        teacherId: finalId, // Compatibilidad
        catedra: catedraObj?.catedra || 'N/A',
        carrera: catedraObj?.carrera || 'N/A',
        createdAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtiene estadísticas consolidadas por cátedra.
   */
  async getCatedrasWithStats() {
    try {
      const [catSnap, evalSnap] = await Promise.all([
        getDocs(collection(db, CATEDRAS_COLLECTION)),
        getDocs(collection(db, EVALUATIONS_COLLECTION))
      ]);

      const catedras = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const evaluations = evalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const grouped = evaluations.reduce((acc, curr) => {
        const id = curr.catedraId || curr.teacherId;
        if (!acc[id]) acc[id] = [];
        acc[id].push(curr);
        return acc;
      }, {});

      return catedras.map(cat => {
        const evals = grouped[cat.id] || [];
        const count = evals.length;

        const stats = count > 0 ? {
          ict: evals.reduce((a, c) => a + (c.ict || 0), 0) / count,
          ndc: evals.reduce((a, c) => a + (c.ndc || 0), 0) / count,
          cat: evals.reduce((a, c) => a + (c.cat || 0), 0) / count,
          tce: evals.reduce((a, c) => a + (c.tce || 0), 0) / count,
          promedioGeneral: evals.reduce((a, c) => a + (c.ict || 0) + (c.ndc || 0) + (c.cat || 0) + (c.tce || 0), 0) / (count * 4),
          count,
          feedback: evals.map(e => e.accionExcelencia).filter(Boolean)
        } : { ict: 0, ndc: 0, cat: 0, tce: 0, promedioGeneral: 0, count: 0, feedback: [] };

        return { ...cat, stats };
      });
    } catch (error) {
      return [];
    }
  }
};
