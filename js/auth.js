import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const registroForm = document.getElementById('registroForm');
const mensajeError = document.getElementById('mensajeError');

registroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensajeError.innerText = "Creando cuenta...";

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;

    if (username.length < 3) {
        mensajeError.innerText = "El nombre de usuario debe tener al menos 3 caracteres.";
        return;
    }

    try {
        // 1. Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // 2. Guardar datos en Firestore
        await setDoc(doc(db, "usuarios", user.uid), {
            nombre_usuario: username, // Usamos el nombre elegido
            email: email,
            presupuesto: 100,
            puntos_total: 0,
            puntos_totales: 0,
            equipo: [],
            rol: "user"
        });

        alert(`¡Cuenta creada! Bienvenido, ${username}.`);
        
        // Guardar UID localmente para consistencia con login
        localStorage.setItem('fantasy_user', user.uid);
        
        window.location.href = "docs/home.html";

    } catch (error) {
        console.error(error);
        if (error.code === 'auth/email-already-in-use') {
            mensajeError.innerText = "Este correo ya existe. Ve a Iniciar Sesión.";
        } else if (error.code === 'auth/weak-password') {
            mensajeError.innerText = "La contraseña debe tener al menos 6 caracteres.";
        } else {
            mensajeError.innerText = "Error: " + error.message;
        }
    }
});