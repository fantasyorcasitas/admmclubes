// 1. Importamos las librerías desde los servidores de Google (versión Web)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Tu configuración (Copiada de lo que me has pasado)
const firebaseConfig = {
  apiKey: "AIzaSyBZTceWkrcCxPyuFmlC9myC9mmiDb92WLo",
  authDomain: "extra-ricki.firebaseapp.com",
  projectId: "extra-ricki",
  storageBucket: "extra-ricki.firebasestorage.app",
  messagingSenderId: "989567931458",
  appId: "1:989567931458:web:796308cff8b89214a349db",
  measurementId: "G-RE1Q34F3KS"
};

// 3. Inicializamos la App, la Autenticación y la Base de Datos
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);       // Esto activa el sistema de Login
const db = getFirestore(app);    // Esto activa la Base de Datos

// 4. Exportamos 'auth' y 'db' para poder usarlos en los otros archivos (auth.js, app.js, etc.)
export { auth, db };