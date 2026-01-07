import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBZTceWkrcCxPyuFmlC9myC9mmiDb92WLo",
  authDomain: "extra-ricki.firebaseapp.com",
  projectId: "extra-ricki",
  storageBucket: "extra-ricki.firebasestorage.app",
  messagingSenderId: "989567931458",
  appId: "1:989567931458:web:796308cff8b89214a349db",
  measurementId: "G-RE1Q34F3KS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- FUNCIÓN DE CARGA ---
async function cargarRanking(coleccionNombre, bodyId) {
    const tbody = document.getElementById(bodyId);
    if (!tbody) return;

    // Spinner de carga
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#888;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>`;

    try {
        // Usamos getDocs (más estándar que getDocsFromServer para cache híbrida)
        const querySnapshot = await getDocs(collection(db, coleccionNombre));
        let listaDatos = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let item = { nombre: "---", puntos: 0 };
            let esValido = false;

            if (coleccionNombre === 'usuarios') {
                // --- MANAGERS ---
                // Prioridad de nombres: nombre_usuario > nick > email/id
                const nombre = data.nombre_usuario || data.nick || data.email || "Manager";
                
                // Aseguramos que puntos_total sea un número
                const puntos = Number(data.puntos_total) || 0;

                item.nombre = nombre;
                item.puntos = puntos;
                esValido = true;

            } else {
                // --- ATLETAS ---
                const nombre = data.nombre || "Atleta";
                const apellido = data.apellidos || "";
                const nombreCompleto = `${nombre} ${apellido}`.trim();
                
                // Puntos del atleta
                const puntos = Number(data.puntos) || 0;

                item.nombre = nombreCompleto;
                item.puntos = puntos;
                esValido = true;
            }

            if (esValido) {
                listaDatos.push(item);
            }
        });

        // ORDENAR (Mayor a menor)
        listaDatos.sort((a, b) => b.puntos - a.puntos);

        // RENDERIZAR
        tbody.innerHTML = "";
        
        if (listaDatos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#666;">No hay datos disponibles.</td></tr>`;
            return;
        }

        listaDatos.forEach((dato, index) => {
            const tr = document.createElement('tr');
            
            // Medallas para el Top 3
            let posicion = index + 1;
            let icono = `<span style="color:#666; font-weight:bold;">${posicion}</span>`;
            
            if (index === 0) icono = '<i class="fa-solid fa-medal" style="color:#ffd700; font-size:1.2rem;"></i>'; // Oro
            if (index === 1) icono = '<i class="fa-solid fa-medal" style="color:#c0c0c0; font-size:1.1rem;"></i>'; // Plata
            if (index === 2) icono = '<i class="fa-solid fa-medal" style="color:#cd7f32; font-size:1.1rem;"></i>'; // Bronce

            // Estilo de fila (Top 3 destacado)
            const rowStyle = index < 3 ? 'background: rgba(255, 94, 0, 0.05);' : '';

            tr.innerHTML = `
                <td class="rank-col" style="text-align:center; padding:12px;">${icono}</td>
                <td style="font-weight:600; color:#ddd;">${dato.nombre}</td>
                <td class="pts-col" style="text-align:right; font-weight:800; color:#ff5e00;">${dato.puntos}</td>
            `;
            
            tr.style.cssText = rowStyle;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error cargando ranking:", error);
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#ff4444; padding:20px;">Error de conexión.</td></tr>`;
    }
}

// --- INICIAR AL CARGAR ---
document.addEventListener('DOMContentLoaded', () => {
    cargarRanking('usuarios', 'managersBody');
    cargarRanking('atletas', 'atletasBody');
});