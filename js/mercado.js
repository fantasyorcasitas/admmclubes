import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const mercadoGrid = document.getElementById('mercadoGrid');
const inputBuscador = document.getElementById('buscadorAtleta');
let todosLosAtletas = [];

// === 1. CARGAR MERCADO ===
async function cargarMercado() {
    try {
        mercadoGrid.innerHTML = '<p style="color:white; text-align:center; margin-top:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando mercado...</p>';
        
        const querySnapshot = await getDocs(collection(db, "atletas"));
        
        todosLosAtletas = [];
        querySnapshot.forEach((doc) => {
            todosLosAtletas.push({ id: doc.id, ...doc.data() });
        });

        // Ordenar por precio descendente
        todosLosAtletas.sort((a, b) => Number(b.precio) - Number(a.precio));

        renderizarAtletas(todosLosAtletas);
    } catch (error) {
        console.error("Error:", error);
        mercadoGrid.innerHTML = '<p style="color:red; text-align:center">Error cargando datos.</p>';
    }
}

// === 2. RENDERIZAR TARJETAS (DISEÑO ACTUALIZADO) ===
function renderizarAtletas(listaAtletas) {
    if (listaAtletas.length === 0) {
        mercadoGrid.innerHTML = '<p style="text-align:center; color:gray">No hay resultados.</p>';
        return;
    }

    let htmlAcumulado = '';

    listaAtletas.forEach(atleta => {
        // --- DATOS BÁSICOS ---
        const precioDisplay = (atleta.precio || 0) + 'M';
        
        // --- DATOS CLAVE (VISIBLES) ---
        // Si no existen, mostramos un guión
        const mmp = atleta.marca_personal || "-";
        const posEsperada = atleta.posicion_esperada || "-";

        // --- DATOS DESPLEGABLES (ÚLTIMA COMPE) ---
        const fechaUltima = atleta.fecha_ultima_competicion || "-";
        const marcaUltima = atleta.marca_ultima_competicion || "-";

        // Estadísticas generales (Opcional, las guardamos por si acaso)
        const historial = atleta.historial_puntos || [];
        const totalPuntos = historial.reduce((a, b) => a + b, 0);

        // --- CONSTRUIR HTML ---
        htmlAcumulado += `
            <div class="athlete-card">
                <div class="athlete-header">
                    <img src="${atleta.foto}" class="athlete-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/74/74472.png'">
                    <div class="athlete-info">
                        <h3>${atleta.nombre} ${atleta.apellidos || ''}</h3>
                        <span class="badge-cat">${atleta.categoria || 'ATLETA'}</span>
                        <div class="price-tag">${precioDisplay}</div>
                    </div>
                </div>

                <div class="stats-summary" style="display:grid; grid-template-columns: 1fr 1fr; gap:1px; background:#333; border:1px solid #444;">
                    <div class="stat-box" style="background:#0a0a0a;">
                        <span class="stat-label" style="color:#ff5e00;">MMP (Marca)</span>
                        <span class="stat-num" style="font-size:1.3rem;">${mmp}</span>
                    </div>
                    <div class="stat-box" style="background:#0a0a0a;">
                        <span class="stat-label" style="color:#4cd137;">POS. ESPERADA</span>
                        <span class="stat-num" style="font-size:1.3rem;">${posEsperada}º</span>
                    </div>
                </div>

                <div class="toggle-btn" onclick="toggleHistorial('${atleta.id}')" style="margin-top:10px;">
                    Ver última competición <i class="fa-solid fa-chevron-down"></i>
                </div>

                <div id="historial-${atleta.id}" class="historial-desplegable" style="display: none;">
                    
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin-top:5px; border:1px solid #333;">
                        <p style="color:#888; font-size:0.75rem; text-align:center; margin-bottom:10px; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid #333; padding-bottom:5px;">
                            <i class="fa-solid fa-flag-checkered"></i> Última Competición
                        </p>
                        
                        <div style="display: flex; justify-content: space-between; text-align: center;">
                            <div>
                                <span style="display:block; font-size:0.7rem; color:#666;">FECHA</span>
                                <strong style="color:white; font-size:1rem;">${fechaUltima}</strong>
                            </div>
                            <div>
                                <span style="display:block; font-size:0.7rem; color:#666;">MARCA REALIZADA</span>
                                <strong style="color:white; font-size:1rem;">${marcaUltima}</strong>
                            </div>
                        </div>

                        <div style="margin-top:15px; padding-top:10px; border-top:1px solid #333; display:flex; justify-content:center; gap:20px;">
                            <div style="text-align:center;">
                                <span style="font-size:0.7rem; color:#666;">PTS TOTALES</span><br>
                                <span style="color:#ff5e00; font-weight:bold;">${totalPuntos}</span>
                            </div>
                            <div style="text-align:center;">
                                <span style="font-size:0.7rem; color:#666;">JORNADAS</span><br>
                                <span style="color:white; font-weight:bold;">${historial.length}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    });

    mercadoGrid.innerHTML = htmlAcumulado;
}

// === 3. FUNCIONES AUXILIARES ===
window.toggleHistorial = (id) => {
    const el = document.getElementById(`historial-${id}`);
    const btn = event.currentTarget; 
    
    if (el.style.display === "none") {
        el.style.display = "block";
        el.style.animation = "fadeIn 0.3s ease-out";
        btn.innerHTML = 'Ocultar info <i class="fa-solid fa-chevron-up"></i>';
    } else {
        el.style.display = "none";
        btn.innerHTML = 'Ver última competición <i class="fa-solid fa-chevron-down"></i>';
    }
};

inputBuscador.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    const filtrados = todosLosAtletas.filter(a => (a.nombre + ' ' + a.apellidos).toLowerCase().includes(texto));
    renderizarAtletas(filtrados);
});

// Iniciar
window.addEventListener('DOMContentLoaded', cargarMercado);