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
   * Seeding automático de cátedras para inicializar el sistema.
   */
  async autoSeed() {
    const sistemas = [
      "Análisis Matemático I", "Álgebra y Geometría Analítica", "Física I", "Inglés I", 
      "Lógica y Estructuras Discretas", "Algoritmos y Estructuras de Datos", 
      "Arquitectura de Computadoras", "Sistemas y Procesos de Negocio",
      "Análisis Matemático II", "Física II", "Ingeniería y Sociedad", "Inglés II", 
      "Sintaxis y Semántica de los Lenguajes", "Paradigmas de Programación", 
      "Sistemas Operativos", "Análisis de Sistemas de Información",
      "Probabilidad y Estadística", "Economía", "Bases de Datos", "Desarrollo de Software", 
      "Comunicación de Datos", "Análisis Numérico", "Diseño de Sistemas de Información",
      "Legislación", "Ingeniería y Calidad de Software", "Redes de Datos", 
      "Investigación Operativa", "Simulación", "Tecnologías para la automatización", 
      "Administración de Sistemas de Información",
      "Inteligencia Artificial", "Ciencia de Datos", "Sistemas de Gestión", 
      "Gestión Gerencial", "Seguridad en los Sistemas de Información", "Proyecto Final"
    ];

    try {
      const q = query(collection(db, CATEDRAS_COLLECTION));
      const snap = await getDocs(q);
      if (snap.empty) {
        for (const s of sistemas) {
          await addDoc(collection(db, CATEDRAS_COLLECTION), {
            nombre: "Cátedra General",
            catedra: s,
            carrera: "Ingeniería en Sistemas de Información"
          });
        }
      }
    } catch (error) {
      // Error silencioso en seeding
    }
  },

  /**
   * Obtiene todas las cátedras registradas.
   */
  async getCatedras() {
    try {
      await this.autoSeed();
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
      await this.autoSeed();
      const [catSnap, evalSnap] = await Promise.all([
        getDocs(collection(db, CATEDRAS_COLLECTION)),
        getDocs(collection(db, EVALUATIONS_COLLECTION))
      ]);

      const catedras = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const evaluations = evalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Agrupación principal por ID de Cátedra
      const grouped = evaluations.reduce((acc, curr) => {
        const id = curr.catedraId || curr.teacherId;
        if (!id) return acc;
        if (!acc[id]) acc[id] = [];
        acc[id].push(curr);
        return acc;
      }, {});

      const knownIds = new Set(catedras.map(c => c.id));

      // Integrar cátedras detectadas en evaluaciones que no figuran en la colección maestra
      evaluations.forEach(e => {
        const id = e.catedraId || e.teacherId;
        if (id && !knownIds.has(id)) {
          catedras.push({
            id: id,
            catedra: e.catedra || 'Cátedra Desconocida',
            carrera: e.carrera || 'N/A',
            nombre: 'Cátedra Detectada'
          });
          knownIds.add(id);
        }
      });

      return catedras.map(cat => {
        const evals = grouped[cat.id] || [];
        const count = evals.length;

        const ict = count > 0 ? evals.reduce((a, c) => a + (c.ict || 0), 0) / count : 0;
        const ndc = count > 0 ? evals.reduce((a, c) => a + (c.ndc || 0), 0) / count : 0;
        const cat_score = count > 0 ? evals.reduce((a, c) => a + (c.cat || 0), 0) / count : 0;
        const tce = count > 0 ? evals.reduce((a, c) => a + (c.tce || 0), 0) / count : 0;
        const promedioGeneral = count > 0 ? (ict + ndc + cat_score + tce) / 4 : 0;

        return {
          id: cat.id,
          catedraId: cat.id,
          catedra: cat.catedra,
          catedraNombre: cat.catedra,
          carrera: cat.carrera,
          evaluacionesCount: count,
          promedioGeneral: promedioGeneral,
          // Compatibilidad con UI actual
          stats: {
            ict, ndc, cat: cat_score, tce, promedioGeneral, count,
            feedback: evals.map(e => e.accionExcelencia).filter(Boolean)
          },
          desglose: { ICT: ict, NDC: ndc, CAT: cat_score, TCE: tce }
        };
      });
    } catch (error) {
      console.error("Error en getCatedrasWithStats:", error);
      return [];
    }
  }
};
