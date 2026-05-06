import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";

const COLLECTION_NAME = "submissions";

export const addSubmission = async (data) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: serverTimestamp(),
      status: 'pending' // Default status for new requests
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding submission: ", error);
    return { success: false, error: error.message };
  }
};

export const subscribeToSubmissions = (callback) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (querySnapshot) => {
    const submissions = [];
    querySnapshot.forEach((doc) => {
      submissions.push({ id: doc.id, ...doc.data() });
    });
    callback(submissions);
  }, (error) => {
    console.error("Error fetching submissions:", error);
  });
};
