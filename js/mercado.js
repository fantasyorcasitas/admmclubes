import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const mercadoGrid = document.getElementById('mercadoGrid');
const inputBuscador = document.getElementById('buscadorAtleta');
let todosLosAtletas = [];

// === 1. CARGAR MERCADO Y ORDENAR ===
async function cargarMercado() {
    try {
        mercadoGrid.innerHTML = '<p style="color:white; text-align:center; margin-top:20px;">Cargando mercado...</p>';
        const querySnapshot = await getDocs(collection(db, "atletas"));
        
        todosLosAtletas = [];
        querySnapshot.forEach((doc) => {
            todosLosAtletas.push({ id: doc.id, ...doc.data() });
        });

        // ORDENAR POR PRECIO (DE MAYOR A MENOR)
        todosLosAtletas.sort((a, b) => Number(b.precio) - Number(a.precio));

        renderizarAtletas(todosLosAtletas);
    } catch (error) {
        console.error("Error:", error);
        mercadoGrid.innerHTML = '<p style="color:red; text-align:center">Error cargando datos.</p>';
    }
}

// === 2. RENDERIZAR TARJETAS (MODIFICADO) ===
function renderizarAtletas(listaAtletas) {
    if (listaAtletas.length === 0) {
        mercadoGrid.innerHTML = '<p style="text-align:center; color:gray">No hay resultados.</p>';
        return;
    }

    let htmlAcumulado = '';

    listaAtletas.forEach(atleta => {
        // --- A. CÁLCULOS DE ESTADÍSTICAS BÁSICAS ---
        const historial = atleta.historial_puntos || [];
        const totalPuntos = historial.reduce((a, b) => a + b, 0);
        const media = historial.length > 0 ? (totalPuntos / historial.length).toFixed(1) : "0.0";
        
        // PRECIO
        const precioVal = atleta.precio !== undefined ? atleta.precio : 0;
        const precioDisplay = precioVal + 'M';

        // --- B. NUEVOS DATOS TÉCNICOS (MMP y POSICIÓN) ---
        // Usamos "N/A" o "-" si el campo no existe en la base de datos todavía
        const mmp = atleta.marca_personal || "-";
        const posEsperada = atleta.posicion_esperada || "-";

        // --- C. CONSTRUIR HTML ---
        htmlAcumulado += `
            <div class="athlete-card">
                <div class="athlete-header">
                    <img src="${atleta.foto}" class="athlete-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/74/74472.png'">
                    <div class="athlete-info">
                        <h3>${atleta.nombre} ${atleta.apellidos || ''}</h3>
                        <span class="badge-cat">${atleta.categoria || 'JUGADOR'}</span>
                        <div class="price-tag">${precioDisplay}</div>
                    </div>
                </div>

                <div class="stats-summary">
                    <div class="stat-box">
                        <span class="stat-label">TOTAL PTS</span>
                        <span class="stat-num">${totalPuntos}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">MEDIA</span>
                        <span class="stat-num">${media}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">JORNADAS</span>
                        <span class="stat-num">${historial.length}</span>
                    </div>
                </div>

                <div class="toggle-btn" onclick="toggleHistorial('${atleta.id}')">
                    Ver datos técnicos <i class="fa-solid fa-stopwatch"></i>
                </div>

                <div id="historial-${atleta.id}" class="historial-desplegable" style="display: none;">
                    
                    <div style="display: flex; gap: 10px; padding: 10px; background: #222; border-radius: 8px; text-align: center;">
                        
                        <div style="flex: 1; border-right: 1px solid #444;">
                            <div style="color: #aaa; font-size: 0.7rem; text-transform: uppercase; margin-bottom: 5px;">
                                <i class="fa-solid fa-bolt"></i> Marca Personal
                            </div>
                            <div style="color: white; font-size: 1.2rem; font-weight: bold;">
                                ${mmp}
                            </div>
                        </div>

                        <div style="flex: 1;">
                            <div style="color: #aaa; font-size: 0.7rem; text-transform: uppercase; margin-bottom: 5px;">
                                <i class="fa-solid fa-ranking-star"></i> Pos. Esperada
                            </div>
                            <div style="color: #ff5e00; font-size: 1.2rem; font-weight: bold;">
                                ${posEsperada}º
                            </div>
                        </div>

                    </div>

                    <p style="color: #666; font-size: 0.7rem; text-align: center; margin-top: 10px; font-style: italic;">
                        * Datos basados en últimas competiciones oficiales.
                    </p>

                </div>
            </div>
        `;
    });

    mercadoGrid.innerHTML = htmlAcumulado;
}

// === 3. FUNCIONES AUXILIARES ===
window.toggleHistorial = (id) => {
    const el = document.getElementById(`historial-${id}`);
    const btn = event.currentTarget; // El botón que se clickeó
    
    if (el.style.display === "none") {
        el.style.display = "block";
        // Animación simple de entrada
        el.style.animation = "fadeIn 0.3s ease-out";
        btn.innerHTML = 'Ocultar info <i class="fa-solid fa-chevron-up"></i>';
    } else {
        el.style.display = "none";
        btn.innerHTML = 'Ver datos técnicos <i class="fa-solid fa-stopwatch"></i>';
    }
};

inputBuscador.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    const filtrados = todosLosAtletas.filter(a => (a.nombre + ' ' + a.apellidos).toLowerCase().includes(texto));
    renderizarAtletas(filtrados);
});

window.addEventListener('DOMContentLoaded', cargarMercado);