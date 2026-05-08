import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc
} from "firebase/firestore";

const CATEDRAS_COLLECTION = "catedras";

export const getAllCatedras = async () => {
  try {
    const querySnapshot = await getDocs(query(collection(db, CATEDRAS_COLLECTION), orderBy("catedra")));
    const catedras = [];
    querySnapshot.forEach((doc) => {
      catedras.push({ id: doc.id, ...doc.data() });
    });
    return catedras;
  } catch (error) {
    return [];
  }
};

export const submitEvaluation = async (catedraId, evaluationData, catedraObj = null) => {
  try {
    let finalCatedraId = catedraId;

    // Si el ID es virtual, creamos el registro de la cátedra en Firestore
    if (typeof catedraId === 'string' && catedraId.startsWith('v_') && catedraObj) {
      const catedraDoc = await addDoc(collection(db, CATEDRAS_COLLECTION), {
        nombre: catedraObj.nombre || 'Cátedra General',
        catedra: catedraObj.catedra,
        carrera: catedraObj.carrera
      });
      finalCatedraId = catedraDoc.id;
    }

    // Guardar en la colección plana de evaluaciones para el Admin
    const evaluationsRef = collection(db, "evaluaciones_excelencia");
    await addDoc(evaluationsRef, {
      ...evaluationData,
      teacherId: finalCatedraId, // Mantengo teacherId por compatibilidad en la base de datos si es necesario, pero conceptualmente es catedraId
      catedraId: finalCatedraId,
      catedra: catedraObj?.catedra || 'N/A',
      carrera: catedraObj?.carrera || 'N/A',
      createdAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllEvaluations = async () => {
  try {
    const q = query(collection(db, "evaluaciones_excelencia"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const evals = [];
    querySnapshot.forEach((doc) => {
      evals.push({ id: doc.id, ...doc.data() });
    });
    return evals;
  } catch (error) {
    return [];
  }
};

export const getAllCatedrasWithStats = async () => {
  try {
    const [catedrasSnapshot, evalsSnapshot] = await Promise.all([
      getDocs(collection(db, CATEDRAS_COLLECTION)),
      getDocs(collection(db, "evaluaciones_excelencia"))
    ]);

    const catedras = catedrasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const allEvals = evalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const evalsByCatedra = allEvals.reduce((acc, curr) => {
      const cid = curr.catedraId || curr.teacherId; // Fallback to teacherId
      if (!acc[cid]) acc[cid] = [];
      acc[cid].push(curr);
      return acc;
    }, {});

    return catedras.map(cat => {
      const catedraEvals = evalsByCatedra[cat.id] || [];
      
      const stats = catedraEvals.length > 0 ? {
        ict: catedraEvals.reduce((acc, curr) => acc + (curr.ict || 0), 0) / catedraEvals.length,
        ndc: catedraEvals.reduce((acc, curr) => acc + (curr.ndc || 0), 0) / catedraEvals.length,
        cat: catedraEvals.reduce((acc, curr) => acc + (curr.cat || 0), 0) / catedraEvals.length,
        tce: catedraEvals.reduce((acc, curr) => acc + (curr.tce || 0), 0) / catedraEvals.length,
        promedioGeneral: (catedraEvals.reduce((acc, curr) => acc + (curr.ict || 0) + (curr.ndc || 0) + (curr.cat || 0) + (curr.tce || 0), 0) / (catedraEvals.length * 4)),
        count: catedraEvals.length,
        feedback: catedraEvals.map(e => e.accionExcelencia).filter(Boolean)
      } : { ict: 0, ndc: 0, cat: 0, tce: 0, promedioGeneral: 0, count: 0, feedback: [] };

      return {
        ...cat,
        stats
      };
    });
  } catch (error) {
    return [];
  }
};

export const seedCatedras = async () => {
  const sistemasSubjects = [
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

  const electronicaSubjects = [
    "Análisis Matemático I", "Álgebra y Geometría Analítica", "Física I", "Informática I",
    "Análisis Matemático II", "Física II", "Informática II", "Sistemas Digitales I",
    "Teoría de Circuitos I", "Electrónica Aplicada I", "Sistemas Digitales II", "Señales y Sistemas",
    "Teoría de Circuitos II", "Electrónica Aplicada II", "Control Automático I", "Microprocesadores",
    "Comunicaciones I", "Electrónica de Potencia", "Control Automático II", "Instrumentación Electrónica",
    "Proyecto Final"
  ];

  try {
    for (const subject of sistemasSubjects) {
      await addDoc(collection(db, CATEDRAS_COLLECTION), {
        nombre: "Cátedra General",
        catedra: subject,
        carrera: "Ingeniería en Sistemas de Información"
      });
    }

    for (const subject of electronicaSubjects) {
      await addDoc(collection(db, CATEDRAS_COLLECTION), {
        nombre: "Cátedra General",
        catedra: subject,
        carrera: "Ingeniería Electrónica"
      });
    }
  } catch (error) {
    // Silent error
  }
};
