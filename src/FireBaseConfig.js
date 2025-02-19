import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAjqpju5BRscl581dJBrgbaSc8wSPPkpu8",
  authDomain: "restauranthub-52c3a.firebaseapp.com",
  projectId: "restauranthub-52c3a",
  storageBucket: "restauranthub-52c3a.firebasestorage.app",
  messagingSenderId: "658395508776",
  appId: "1:658395508776:web:b3d54dc6f486580e0c851d",
  measurementId: "G-675BXB1CG6"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para obtener el número actual de reviewers y asignar NumInList
export const getReviewersCount = async () => {
    const snapshot = await getDocs(collection(db, "reviewers"));
    return snapshot.size; // Número de documentos en la colección
};

// Función para agregar un reviewer a Firestore
export const addReviewer = async (reviewerData) => {
    const count = await getReviewersCount();
    const newReviewer = { ...reviewerData, NumInList: count + 1 };
    await addDoc(collection(db, "reviewers"), newReviewer);
};

export const updateReviewer = async (id, data) => {
  const reviewerRef = doc(db, "reviewers", id);
  await updateDoc(reviewerRef, data);
};

export { db };
