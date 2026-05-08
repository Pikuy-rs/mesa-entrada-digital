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
   * Obtiene estadísticas consolidadas por cátedra con trazabilidad profunda.
   */
  async getCatedrasWithStats() {
    try {
      console.log("Iniciando escaneo de trazabilidad académica...");
      await this.autoSeed();
      
      const [catSnap, evalSnap] = await Promise.all([
        getDocs(collection(db, CATEDRAS_COLLECTION)),
        getDocs(collection(db, EVALUATIONS_COLLECTION))
      ]);

      const rawCatedras = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const rawEvaluations = evalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log(`Datos crudos: ${rawCatedras.length} cátedras, ${rawEvaluations.length} evaluaciones.`);

      // Mapa de consolidación por NOMBRE (para evitar fallos de ID)
      const statsMap = {};

      // 1. Inicializar mapa con cátedras conocidas
      rawCatedras.forEach(c => {
        const key = c.catedra.trim().toLowerCase();
        if (!statsMap[key]) {
          statsMap[key] = {
            id: c.id,
            catedraId: c.id,
            catedra: c.catedra,
            catedraNombre: c.catedra,
            carrera: c.carrera || 'N/A',
            evaluacionesCount: 0,
            sumICT: 0, sumNDC: 0, sumCAT: 0, sumTCE: 0,
            feedback: []
          };
        }
      });

      // 2. Procesar evaluaciones y agrupar por nombre (o ID si coincide)
      rawEvaluations.forEach(e => {
        const key = (e.catedra || "").trim().toLowerCase();
        if (!key) return;

        // Si la cátedra no existe en el mapa, la creamos (cátedra detectada)
        if (!statsMap[key]) {
          statsMap[key] = {
            id: e.catedraId || e.teacherId || `gen_${key}`,
            catedraId: e.catedraId || e.teacherId || `gen_${key}`,
            catedra: e.catedra,
            catedraNombre: e.catedra,
            carrera: e.carrera || 'N/A',
            evaluacionesCount: 0,
            sumICT: 0, sumNDC: 0, sumCAT: 0, sumTCE: 0,
            feedback: []
          };
        }

        const s = statsMap[key];
        s.evaluacionesCount++;
        s.sumICT += (e.ict || 0);
        s.sumNDC += (e.ndc || 0);
        s.sumCAT += (e.cat || 0);
        s.sumTCE += (e.tce || 0);
        if (e.accionExcelencia) s.feedback.push(e.accionExcelencia);
      });

      // 3. Finalizar promedios y retornar array
      const result = Object.values(statsMap).map(s => {
        const count = s.evaluacionesCount || 1;
        const ict = s.sumICT / count;
        const ndc = s.sumNDC / count;
        const cat = s.sumCAT / count;
        const tce = s.sumTCE / count;
        const promedioGeneral = (ict + ndc + cat + tce) / 4;

        return {
          ...s,
          promedioGeneral,
          stats: {
            ict, ndc, cat, tce, 
            promedioGeneral, 
            count: s.evaluacionesCount,
            feedback: s.feedback
          },
          desglose: { ICT: ict, NDC: ndc, CAT: cat, TCE: tce }
        };
      });

      console.log("Escaneo completado. Cátedras procesadas:", result.length);
      return result;
    } catch (error) {
      console.error("CRITICAL ERROR en getCatedrasWithStats:", error);
      return [];
    }
  }
};
