import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

export const loginAdmin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Error logging in:", error);
    return { success: false, error: error.message };
  }
};

export const logoutAdmin = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Error logging out:", error);
    return { success: false, error: error.message };
  }
};

export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};
