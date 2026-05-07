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

const TEACHERS_COLLECTION = "docentes";

export const getAllTeachers = async () => {
  try {
    const querySnapshot = await getDocs(query(collection(db, TEACHERS_COLLECTION), orderBy("catedra")));
    const teachers = [];
    querySnapshot.forEach((doc) => {
      teachers.push({ id: doc.id, ...doc.data() });
    });
    return teachers;
  } catch (error) {
    console.error("Error getting all teachers:", error);
    return [];
  }
};

export const searchTeachers = async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  try {
    const q = query(
      collection(db, TEACHERS_COLLECTION),
      orderBy("nombre"),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    const teachers = [];
    const searchLower = searchTerm.toLowerCase();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.nombre.toLowerCase().includes(searchLower) || (data.catedra && data.catedra.toLowerCase().includes(searchLower))) {
        teachers.push({ id: doc.id, ...data });
      }
    });
    
    return teachers;
  } catch (error) {
    console.error("Error searching teachers:", error);
    return [];
  }
};

export const submitEvaluation = async (teacherId, evaluationData, teacherObj = null) => {
  try {
    let finalTeacherId = teacherId;

    // Si el ID es virtual, creamos el registro del docente en Firestore en este momento
    if (typeof teacherId === 'string' && teacherId.startsWith('v_') && teacherObj) {
      const teacherDoc = await addDoc(collection(db, TEACHERS_COLLECTION), {
        nombre: teacherObj.nombre,
        catedra: teacherObj.catedra,
        carrera: teacherObj.carrera
      });
      finalTeacherId = teacherDoc.id;
    }

    // Guardar en la colección plana de evaluaciones para el Admin
    const evaluationsRef = collection(db, "evaluaciones_excelencia");
    await addDoc(evaluationsRef, {
      ...evaluationData,
      teacherId: finalTeacherId,
      teacherName: teacherObj?.nombre || 'Cátedra General',
      catedra: teacherObj?.catedra || 'N/A',
      carrera: teacherObj?.carrera || 'N/A',
      createdAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error submitting evaluation:", error);
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
    console.error("Error getting all evaluations:", error);
    return [];
  }
};

export const getTeacherEvaluations = async (teacherId) => {
  try {
    const q = query(
      collection(db, "evaluaciones_excelencia"), 
      where("teacherId", "==", teacherId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const evaluations = [];
    querySnapshot.forEach((doc) => {
      evaluations.push({ id: doc.id, ...doc.data() });
    });
    
    return evaluations;
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return [];
  }
};

export const getAllTeachersWithStats = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, TEACHERS_COLLECTION));
    const teachers = [];
    
    for (const teacherDoc of querySnapshot.docs) {
      const teacherData = teacherDoc.data();
      const allEvaluations = await getTeacherEvaluations(teacherDoc.id);
      
      // Filtro de Venganza: No promediar los que son isOutlier
      const validEvaluations = allEvaluations.filter(e => !e.isOutlier);
      
      const stats = validEvaluations.length > 0 ? {
        ict: validEvaluations.reduce((acc, curr) => acc + curr.ict, 0) / validEvaluations.length,
        ndc: validEvaluations.reduce((acc, curr) => acc + curr.ndc, 0) / validEvaluations.length,
        cat: validEvaluations.reduce((acc, curr) => acc + curr.cat, 0) / validEvaluations.length,
        tce: validEvaluations.reduce((acc, curr) => acc + curr.tce, 0) / validEvaluations.length,
        promedioGeneral: (validEvaluations.reduce((acc, curr) => acc + curr.ict + curr.ndc + curr.cat + curr.tce, 0) / (validEvaluations.length * 4)),
        count: validEvaluations.length,
        outlierCount: allEvaluations.length - validEvaluations.length
      } : { ict: 0, ndc: 0, cat: 0, tce: 0, promedioGeneral: 0, count: 0, outlierCount: allEvaluations.length };
      
      teachers.push({
        id: teacherDoc.id,
        ...teacherData,
        stats
      });
    }
    
    return teachers;
  } catch (error) {
    console.error("Error getting all teachers with stats:", error);
    return [];
  }
};

export const seedTeachers = async () => {
  const sistemasSubjects = [
    // Primer Nivel
    "Análisis Matemático I", "Álgebra y Geometría Analítica", "Física I", "Inglés I", 
    "Lógica y Estructuras Discretas", "Algoritmos y Estructuras de Datos", 
    "Arquitectura de Computadoras", "Sistemas y Procesos de Negocio",
    // Segundo Nivel
    "Análisis Matemático II", "Física II", "Ingeniería y Sociedad", "Inglés II", 
    "Sintaxis y Semántica de los Lenguajes", "Paradigmas de Programación", 
    "Sistemas Operativos", "Análisis de Sistemas de Información",
    // Tercer Nivel
    "Probabilidad y Estadística", "Economía", "Bases de Datos", "Desarrollo de Software", 
    "Comunicación de Datos", "Análisis Numérico", "Diseño de Sistemas de Información",
    // Cuarto Nivel
    "Legislación", "Ingeniería y Calidad de Software", "Redes de Datos", 
    "Investigación Operativa", "Simulación", "Tecnologías para la automatización", 
    "Administración de Sistemas de Información",
    // Quinto Nivel
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
    // Seed Sistemas
    for (const subject of sistemasSubjects) {
      await addDoc(collection(db, TEACHERS_COLLECTION), {
        nombre: "Cátedra General",
        catedra: subject,
        carrera: "Ingeniería en Sistemas de Información"
      });
    }

    // Seed Electrónica
    for (const subject of electronicaSubjects) {
      await addDoc(collection(db, TEACHERS_COLLECTION), {
        nombre: "Cátedra General",
        catedra: subject,
        carrera: "Ingeniería Electrónica"
      });
    }

    console.log("Seeding complete for Sistemas and Electrónica!");
  } catch (error) {
    console.error("Error seeding teachers:", error);
  }
};
