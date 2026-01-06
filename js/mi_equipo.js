// IMPORTAMOS LA CONFIGURACIÓN CENTRALIZADA
import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- ESTADO ---
let currentUserData = null;
let allAthletes = [];
let teamSlots = [null, null, null]; 
let captainId = null;
let totalPatrimony = 0;
let currentSlotIndex = -1;
let isMarketClosed = false;

// --- 1. COMPROBAR MERCADO ---
function checkMarketStatus() {
    const now = new Date();
    const day = now.getDay(); // 0=Domingo, 1=Lunes ... 6=Sábado
    const hour = now.getHours();

    // REGLA: Cerrado Sábados, Domingos y Lunes completos. Martes hasta las 10:00.
    // (Ajusta esto según tus necesidades reales)
    if (day === 6 || day === 0 || day === 1 || (day === 2 && hour < 8)) {
        isMarketClosed = true;
        
        // Deshabilitar botón visualmente
        const btn = document.getElementById('btnSaveTeam');
        if(btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-lock"></i> MERCADO CERRADO';
            btn.style.backgroundColor = "#333";
            btn.style.opacity = "1"; // Quitamos la transparencia de disabled para que se lea bien
            btn.style.cursor = "not-allowed";
        }
        return false;
    }

    // Mercado Abierto
    isMarketClosed = false;
    return true;
}

// --- 2. INIT ---
async function init() {
    checkMarketStatus();

    const userNick = localStorage.getItem('fantasy_user');
    if (!userNick) { window.location.href = '../index.html'; return; }

    try {
        // Cargar Usuario
        const userDoc = await getDoc(doc(db, "usuarios", userNick));
        if (!userDoc.exists()) {
            console.error("Usuario no encontrado");
            return;
        }
        currentUserData = userDoc.data();

        // Cargar Atletas
        const athSnap = await getDocs(collection(db, "atletas"));
        allAthletes = [];
        athSnap.forEach(d => {
            let a = d.data();
            a.id = d.id;
            a.precio = parseInt(a.precio) || 0; 
            allAthletes.push(a);
        });

        // Reconstruir equipo guardado
        const savedIds = currentUserData.equipo || [];
        captainId = currentUserData.capitanId || null;

        savedIds.forEach((id, index) => {
            if (index < 3) {
                const player = allAthletes.find(a => a.id === id);
                if (player) teamSlots[index] = player;
            }
        });

        // Calcular Patrimonio Total (Presupuesto actual + Valor de los jugadores que tienes)
        // Esto es importante: tu "dinero total real" es lo que tienes en caja + lo que valen tus jugadores
        const currentTeamValue = teamSlots.reduce((sum, p) => sum + (p ? p.precio : 0), 0);
        totalPatrimony = (parseInt(currentUserData.presupuesto) || 0) + currentTeamValue;

        updateUI();

    } catch (error) {
        console.error("Error iniciando Mi Equipo:", error);
        alert("Error de conexión. Intenta recargar.");
    }
}

// --- 3. ACTUALIZAR INTERFAZ ---
function updateUI() {
    // Calcular coste del equipo actual en pantalla
    const currentTeamCost = teamSlots.reduce((sum, p) => sum + (p ? p.precio : 0), 0);
    const currentBudget = totalPatrimony - currentTeamCost;

    // Actualizar Presupuesto
    const budgetEl = document.getElementById('budgetValue');
    const debtWarning = document.getElementById('debtWarning');
    
    if(budgetEl) {
        budgetEl.innerText = Math.round(currentBudget) + "M"; 
        
        if (currentBudget < 0) {
            budgetEl.classList.remove('positive');
            budgetEl.classList.add('negative');
            if(debtWarning) debtWarning.style.display = 'block'; // Mostrar pastilla roja

            if(!isMarketClosed) {
                const btn = document.getElementById('btnSaveTeam');
                btn.disabled = true;
                btn.innerHTML = '⚠️ PRESUPUESTO NEGATIVO';
                btn.style.background = "#e84118";
            }
        } else {
            budgetEl.classList.remove('negative');
            budgetEl.classList.add('positive');
            if(debtWarning) debtWarning.style.display = 'none';

            if(!isMarketClosed) {
                const btn = document.getElementById('btnSaveTeam');
                btn.disabled = false;
                btn.style.opacity = "1";
                btn.style.cursor = "pointer";
                btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> GUARDAR ALINEACIÓN';
                btn.style.backgroundColor = "#ff5e00";
            }
        }
    }

    // Renderizar los 3 huecos
    renderSlot(0, 'slot0');
    renderSlot(1, 'slot1');
    renderSlot(2, 'slot2');
}

function renderSlot(index, elementId) {
    const container = document.getElementById(elementId);
    if(!container) return;

    const player = teamSlots[index];
    container.innerHTML = "";
    
    // Limpiamos clases previas y dejamos la base
    container.className = "player-card-slot"; 

    if (player) {
        container.classList.add('filled');
        
        // Datos del jugador
        const imgUrl = player.foto || 'https://cdn-icons-png.flaticon.com/512/74/74472.png';
        const isCapi = (player.id === captainId);
        const capiClass = isCapi ? "active" : "";

        // Si el mercado está cerrado, NO mostramos botones de borrar/capitán
        const actionsHTML = isMarketClosed ? '' : `
            <div class="card-actions">
                <button class="btn-mini btn-captain ${capiClass}" data-cap-idx="${index}">C</button>
                <button class="btn-mini btn-remove" data-rem-idx="${index}">X</button>
            </div>
        `;

        container.innerHTML = `
            <img src="${imgUrl}" class="slot-img">
            <div class="slot-name">${player.nombre}</div>
            <div class="slot-price">${player.precio}M</div>
            ${actionsHTML}
        `;

        // Eventos de botones (Capitán y Borrar)
        if (!isMarketClosed) {
            const btnCap = container.querySelector(`[data-cap-idx="${index}"]`);
            const btnRem = container.querySelector(`[data-rem-idx="${index}"]`);
            
            if(btnCap) btnCap.onclick = (e) => { e.stopPropagation(); toggleCaptain(player.id); };
            if(btnRem) btnRem.onclick = (e) => { e.stopPropagation(); clearSlot(index); };
        }
        
        // Al hacer click en la carta llena no pasa nada (o podrías abrir info del jugador)
        container.onclick = null; 

    } else {
        // HUECO VACÍO
        container.innerHTML = `
            <i class="fa-solid fa-plus" style="font-size: 1.5rem; color: #555;"></i>
            <span style="font-size: 0.6rem; color: #666; margin-top:5px; font-weight:bold; text-transform:uppercase;">Fichar</span>
        `;
        
        // Si mercado abierto -> Click abre modal
        if(!isMarketClosed) {
            container.onclick = () => openModal(index);
        } else {
            container.onclick = null;
            container.style.opacity = "0.5"; // Visualmente desactivado
        }
    }
}

// --- 4. FUNCIONES LÓGICAS ---

function toggleCaptain(pid) {
    if(isMarketClosed) return;
    // Si ya era capitán, se quita. Si no, se pone.
    captainId = (captainId === pid) ? null : pid;
    updateUI();
}

function clearSlot(index) {
    if(isMarketClosed) return;
    const p = teamSlots[index];
    // Si borramos al capitán, reseteamos capitán
    if (p && p.id === captainId) captainId = null;
    teamSlots[index] = null;
    updateUI();
}

// --- 5. MODAL DE FICHAJES ---

// Hacemos la función accesible globalmente (para que el HTML la encuentre si es necesario)
window.openModal = function(index) {
    if (isMarketClosed) return;
    currentSlotIndex = index;
    renderMarketList();
    document.getElementById('playerModal').style.display = 'flex'; // Usamos flex para centrar
}

// Función global para cerrar
window.closeModal = function() {
    document.getElementById('playerModal').style.display = 'none';
}

// Evento de búsqueda en tiempo real
const searchInput = document.getElementById('modalSearch');
if(searchInput) {
    searchInput.addEventListener('keyup', renderMarketList);
}

function renderMarketList() {
    const container = document.getElementById('modalPlayerList');
    if(!container) return;
    
    const searchVal = document.getElementById('modalSearch').value.toLowerCase();
    container.innerHTML = "";

    // IDs que ya tienes en tu equipo para no mostrarlos
    const usedIds = teamSlots.filter(p => p).map(p => p.id);
    
    // Filtramos atletas disponibles
    const available = allAthletes.filter(a => {
        const matchName = (a.nombre + ' ' + (a.apellidos || '')).toLowerCase().includes(searchVal);
        return !usedIds.includes(a.id) && matchName;
    });

    // Ordenar por precio (más caros primero)
    available.sort((a,b) => b.precio - a.precio);

    if(available.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">No se encontraron atletas.</div>';
        return;
    }

    available.forEach(p => {
        const div = document.createElement('div');
        div.className = 'player-list-item';
        div.innerHTML = `
            <img src="${p.foto || 'https://cdn-icons-png.flaticon.com/512/74/74472.png'}">
            <div style="flex-grow:1;">
                <div style="color:white; font-weight:bold; font-size:0.9rem;">${p.nombre} ${p.apellidos || ''}</div>
                <div style="color:#4cd137; font-size:0.8rem; font-weight:600;">${p.precio}M <span style="color:#666; margin-left:5px;">| ${p.categoria || 'JUG'}</span></div>
            </div>
            <i class="fa-solid fa-plus-circle" style="color:#ff5e00; font-size:1.5rem;"></i>
        `;
        div.onclick = () => selectPlayer(p);
        container.appendChild(div);
    });
}

function selectPlayer(player) {
    teamSlots[currentSlotIndex] = player;
    document.getElementById('playerModal').style.display = 'none';
    
    // Limpiar buscador para la próxima
    document.getElementById('modalSearch').value = "";
    
    updateUI();
}

// --- 6. GUARDAR EN FIREBASE ---
const btnSave = document.getElementById('btnSaveTeam');
if(btnSave) {
    btnSave.addEventListener('click', async () => {
        if(isMarketClosed) return; 

        // Bloquear botón visualmente
        const originalText = btnSave.innerHTML;
        btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GUARDANDO...';
        btnSave.disabled = true;
        btnSave.style.background = "#333";

        try {
            const userNick = localStorage.getItem('fantasy_user');
            
            // Calculamos presupuesto final a guardar
            const currentCost = teamSlots.reduce((sum, p) => sum + (p ? p.precio : 0), 0);
            const finalBudget = totalPatrimony - currentCost;
            
            // Extraemos solo los IDs para guardar en la BD
            const teamIds = teamSlots.filter(p => p).map(p => p.id);

            await updateDoc(doc(db, "usuarios", userNick), {
                equipo: teamIds,
                capitanId: captainId || null,
                presupuesto: Math.round(finalBudget)
            });

            // Feedback visual de éxito
            btnSave.style.background = "#4cd137"; // Verde
            btnSave.innerHTML = '<i class="fa-solid fa-check"></i> GUARDADO';
            
            setTimeout(() => {
                // Restaurar estado normal después de 2 segundos
                btnSave.style.background = "#ff5e00";
                btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> GUARDAR ALINEACIÓN';
                btnSave.disabled = false;
            }, 2000);

        } catch (e) {
            console.error(e);
            btnSave.innerText = "ERROR AL GUARDAR";
            btnSave.style.background = "#e84118"; // Rojo
            setTimeout(() => {
                 btnSave.disabled = false; 
                 btnSave.style.background = "#ff5e00";
                 btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> GUARDAR ALINEACIÓN';
            }, 3000);
        }
    });
}

// INICIAR TODO AL CARGAR LA PÁGINA
document.addEventListener('DOMContentLoaded', init);