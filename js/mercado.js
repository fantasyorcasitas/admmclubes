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

// === 2. RENDERIZAR TARJETAS (DISEÑO MEJORADO) ===
function renderizarAtletas(listaAtletas) {
    if (listaAtletas.length === 0) {
        mercadoGrid.innerHTML = '<p style="text-align:center; color:gray">No hay resultados.</p>';
        return;
    }

    let htmlAcumulado = '';

    listaAtletas.forEach(atleta => {
        // DATOS BÁSICOS
        const precioDisplay = (atleta.precio || 0) + 'M';
        
        // VISIBLES: MMP Y POSICIÓN
        const mmp = atleta.marca_personal || "-";
        const posEsperada = atleta.posicion_esperada || "-";

        // DESPLEGABLES: ÚLTIMA COMPE
        const fechaUltima = atleta.fecha_ultima_competicion || "-";
        const marcaUltima = atleta.marca_ultima_competicion || "-";

        // ETIQUETA PRUEBA (EJ: 400m)
        const etiquetaPrueba = atleta.pruebas_principales || atleta.categoria || 'ATLETA';

        htmlAcumulado += `
            <div class="athlete-card" style="background: #111; border: 1px solid #333; border-radius: 16px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); position: relative; overflow: hidden;">
                
                <div class="athlete-header" style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                    <img src="${atleta.foto}" class="athlete-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/74/74472.png'" 
                         style="width: 75px; height: 75px; border-radius: 50%; border: 3px solid #ff5e00; object-fit: cover; background: #000;">
                    
                    <div class="athlete-info" style="flex-grow: 1;">
                        <h3 style="margin: 0; color: white; font-size: 1.3rem; font-weight: 800; letter-spacing: -0.5px;">
                            ${atleta.nombre} <span style="font-weight: 400;">${atleta.apellidos || ''}</span>
                        </h3>
                        
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
                            <span style="background: rgba(255, 94, 0, 0.15); color: #ff5e00; border: 1px solid rgba(255, 94, 0, 0.3); 
                                         padding: 4px 12px; border-radius: 8px; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                                ${etiquetaPrueba}
                            </span>
                            
                            <div style="color: #4cd137; font-size: 1.6rem; font-weight: 900; text-shadow: 0 0 10px rgba(76, 209, 55, 0.3);">
                                ${precioDisplay}
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: flex; background: linear-gradient(180deg, #1a1a1a 0%, #151515 100%); border-radius: 12px; padding: 15px 0; border: 1px solid #333;">
                    
                    <div style="flex: 1; text-align: center; border-right: 1px solid #333;">
                        <span style="display: block; font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">
                            <i class="fa-solid fa-bolt" style="color: #ff5e00;"></i> MMP (Marca)
                        </span>
                        <span style="font-size: 1.5rem; font-weight: 800; color: white;">
                            ${mmp}
                        </span>
                    </div>

                    <div style="flex: 1; text-align: center;">
                        <span style="display: block; font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">
                            <i class="fa-solid fa-ranking-star" style="color: #4cd137;"></i> Pos. Esp.
                        </span>
                        <span style="font-size: 1.5rem; font-weight: 800; color: white;">
                            ${posEsperada}º
                        </span>
                    </div>
                </div>

                <div class="toggle-btn" onclick="toggleHistorial('${atleta.id}')" 
                     style="margin-top: 15px; text-align: center; color: #666; font-size: 0.8rem; cursor: pointer; transition: 0.3s;">
                    Ver última competición <i class="fa-solid fa-chevron-down"></i>
                </div>

                <div id="historial-${atleta.id}" class="historial-desplegable" style="display: none; margin-top: 15px; border-top: 1px dashed #333; padding-top: 15px; animation: fadeIn 0.3s ease-out;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 10px 15px; border-radius: 8px;">
                        <div style="text-align: left;">
                            <span style="font-size: 0.7rem; color: #888; text-transform: uppercase;">Fecha</span>
                            <div style="color: white; font-weight: 600; margin-top: 2px;">${fechaUltima}</div>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.7rem; color: #888; text-transform: uppercase;">Marca Realizada</span>
                            <div style="color: #ff5e00; font-weight: 800; font-size: 1.1rem; margin-top: 2px;">${marcaUltima}</div>
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
        btn.innerHTML = 'Ocultar info <i class="fa-solid fa-chevron-up"></i>';
        btn.style.color = "#ff5e00";
    } else {
        el.style.display = "none";
        btn.innerHTML = 'Ver última competición <i class="fa-solid fa-chevron-down"></i>';
        btn.style.color = "#666";
    }
};

inputBuscador.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    const filtrados = todosLosAtletas.filter(a => (a.nombre + ' ' + a.apellidos).toLowerCase().includes(texto));
    renderizarAtletas(filtrados);
});

// Iniciar
window.addEventListener('DOMContentLoaded', cargarMercado);