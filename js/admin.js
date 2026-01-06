import { db, auth } from "./firebase-config.js"; 
import { 
    collection, 
    addDoc, 
    getDocs, 
    orderBy, 
    query, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ... el resto de tu código ...

// === SEGURIDAD: EL PORTERO DE DISCOTECA ===
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. El usuario está logueado, vamos a ver quién es en la BD
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // 2. ¿TIENE EL ROL DE ADMIN?
            if (data.rol !== "admin") {
                // SI NO ES ADMIN -> ¡FUERA!
                document.body.innerHTML = "<h1>⛔ ACCESO DENEGADO</h1><p>Redirigiendo...</p>";
                setTimeout(() => {
                    window.location.href = "../docs/home.html";
                }, 1000);
            } else {
                // SI ES ADMIN -> Le dejamos pasar (cargamos cosas)
                console.log("Bienvenido, Admin supremo.");
                cargarSelectorAtletas(); // Solo cargamos los datos si es admin
            }
        }
    } else {
        // Ni siquiera está logueado -> Al login
        window.location.href = "../index.html";
    }
});

// ... (Aquí sigue el resto de tu código de cargarSelectorAtletas, etc.)
// === VARIABLES GLOBALES ===
// Aquí guardaremos temporalmente los atletas que vamos añadiendo a la competición
let listaParticipantes = []; 

// === 1. CARGAR ATLETAS EN EL SELECTOR (Al iniciar) ===
async function cargarSelectorAtletas() {
    const selector = document.getElementById('selectorAtletasBD');
    selector.innerHTML = '<option value="">Cargando...</option>';

    try {
        // Pedimos los atletas ordenados por nombre
        const q = query(collection(db, "atletas"), orderBy("nombre"));
        const querySnapshot = await getDocs(q);

        selector.innerHTML = '<option value="">-- Selecciona un Atleta --</option>';

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Creamos la opción. El value es el ID de firebase, el texto es Nombre + Apellido
            const option = document.createElement('option');
            option.value = doc.id; 
            option.text = `${data.nombre} ${data.apellidos} (${data.categoria})`;
            // Guardamos el nombre completo en un atributo extra para usarlo luego
            option.setAttribute('data-nombre-completo', `${data.nombre} ${data.apellidos}`);
            selector.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando atletas:", error);
        selector.innerHTML = '<option>Error al cargar</option>';
    }
}

// Ejecutar carga al abrir la página
window.addEventListener('DOMContentLoaded', cargarSelectorAtletas);


// === 2. GUARDAR NUEVO ATLETA ===
// === 2. GUARDAR NUEVO ATLETA ===
const formAtleta = document.getElementById('formAtleta');

formAtleta.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = formAtleta.querySelector('button');
    btn.innerText = "Guardando...";
    btn.disabled = true;

    try {
        // Capturamos el precio en una variable para usarlo en el array también
        const precioInicial = Number(document.getElementById('atlPrecio').value);

        await addDoc(collection(db, "atletas"), {
            nombre: document.getElementById('atlNombre').value,
            apellidos: document.getElementById('atlApellidos').value,
            categoria: document.getElementById('atlCategoria').value,
            precio: precioInicial,
            foto: document.getElementById('atlFoto').value || "https://cdn-icons-png.flaticon.com/512/74/74472.png",
            
            // Campos básicos
            puntos: 0, 
            tendencia: "neutral",

            // --- NUEVOS CAMPOS PARA LAS GRÁFICAS ---
            historial_puntos: [],            // Array vacío (aún no ha jugado)
            historial_valor: [precioInicial] // Array con el primer precio (el de salida)
        });

        alert("✅ Atleta creado correctamente");
        formAtleta.reset();
        cargarSelectorAtletas(); 

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.innerText = "GUARDAR ATLETA";
        btn.disabled = false;
    }
});


// === 3. LÓGICA DE LA COMPETICIÓN (Añadir a lista temporal) ===
// === BOTÓN AÑADIR A LA LISTA ===
document.getElementById('btnAddLineup').addEventListener('click', () => {
    const selector = document.getElementById('selectorAtletasLineup'); // Ojo: asegúrate que el ID coincida con tu HTML (en tu primer bloque era este, en el segundo pusiste selectorAtletasBD)
    const prueba = document.getElementById('inputPruebaEspecifica').value;
    const marcaPB = document.getElementById('inputMarcaPersonal').value;     // NUEVO
    const posEsp = document.getElementById('inputPosicionEsperada').value;   // NUEVO

    if (!selector.value || !prueba) return alert("Faltan datos obligatorios (Atleta y Prueba)");

    // Añadimos al array con los nuevos campos
    listaParticipantes.push({
        id_atleta: selector.value,
        nombre_completo: selector.options[selector.selectedIndex].text.trim(),
        prueba: prueba,
        marca_personal: marcaPB || "-", // Si está vacío ponemos un guion
        posicion_esperada: posEsp || "-",
        resultado: "", 
        puntos: 0
    });

    // Limpiamos los inputs para meter al siguiente rápido
    document.getElementById('inputPruebaEspecifica').value = "";
    document.getElementById('inputMarcaPersonal').value = "";
    document.getElementById('inputPosicionEsperada').value = "";

    actualizarVisualCompe();
});

// === FUNCIÓN PARA PINTAR LA LISTA VISUALMENTE ===
function actualizarVisualCompe() {
    const container = document.getElementById('listaVisual');
    
    if (listaParticipantes.length === 0) {
        container.innerHTML = '<p style="color:#666;text-align:center;">Lista vacía.</p>';
        return;
    }

    container.innerHTML = ""; 
    
    listaParticipantes.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'lineup-item';
        div.dataset.id = item.id_atleta; 
        div.style.cssText = "display:flex; align-items:center; gap:10px; border-bottom:1px solid #333; padding:10px; margin-bottom:5px; background: #1a1a1a;";
        
        // Aquí mostramos la info extra en pequeñito
        div.innerHTML = `
            <div style="flex-grow:1;">
                <div style="font-weight:bold; color:white;">${item.nombre_completo}</div>
                <div style="font-size:0.8rem; color:#aaa; margin-top:2px;">
                    <span style="color:var(--primary)">${item.prueba}</span> | 
                    <i class="fa-solid fa-stopwatch"></i> PB: ${item.marca_personal} | 
                    <i class="fa-solid fa-chart-line"></i> Est: ${item.posicion_esperada}º
                </div>
            </div>

            <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                <span style="font-size:0.7rem; color:#666;">MARCA</span>
                <input type="text" class="result-text" value="${item.resultado || ''}" 
                    oninput="window.listaParticipantes[${index}].resultado = this.value" 
                    style="width:80px !important;">
            </div>

            <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                <span style="font-size:0.7rem; color:#666;">PTS</span>
                <input type="number" class="result-points" value="${item.puntos || 0}" 
                    oninput="window.listaParticipantes[${index}].puntos = Number(this.value)"
                    style="width:50px !important;">
            </div>

            <i class="fa-solid fa-trash" style="color:#d63031; cursor:pointer; margin-left:10px; font-size:1.1rem;" 
               onclick="delLineup(${index})" title="Eliminar atleta"></i>
        `;
        container.appendChild(div);
    });
    
    // Actualizamos la variable global para que esté sincronizada
    window.listaParticipantes = listaParticipantes;
}
// Función para borrar alguien si te equivocas (necesita estar en window para llamarse desde el HTML string)
window.eliminarDeLista = (index) => {
    listaParticipantes.splice(index, 1);
    actualizarListaVisual();
};
// === FUNCIÓN ARREGLADA: CARGAR CHECKBOXES PARA CIERRE ===
        async function cargarCheckboxesPendientes() {
            const container = document.getElementById('checklistCompes');
            container.innerHTML = '<p style="color:#aaa; text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Buscando competiciones...</p>';

            try {
                // 1. CAMBIO CLAVE: Pedimos TODAS ordenadas por fecha (sin 'where')
                // Esto evita el error de "Missing Index" de Firebase
                const q = query(collection(db, "competiciones"), orderBy("fecha", "asc"));
                const snap = await getDocs(q);
                
                let html = '';
                let contadorPendientes = 0;

                snap.forEach(doc => {
                    const d = doc.data();
                    
                    // 2. FILTRO MANUAL (JavaScript): Solo procesamos si está pendiente
                    if (d.estado === 'pendiente') {
                        contadorPendientes++;
                        
                        // Guardamos los participantes en el dataset para usarlos al cerrar
                        const jsonParticipantes = JSON.stringify(d.participantes || []).replace(/"/g, '&quot;');
                        
                        html += `
                            <div class="check-item">
                                <label style="display:flex; align-items:center; width:100%; cursor:pointer;">
                                    <div style="display:flex; align-items:center; flex-grow:1;">
                                        <input type="checkbox" class="comp-checkbox" value="${doc.id}" data-participantes="${jsonParticipantes}" style="width:20px; height:20px; margin-right:15px; accent-color:#ff5e00;">
                                        <span style="color:white; font-weight:600;">${d.nombre}</span>
                                    </div>
                                    <span class="check-date" style="color:#888; font-size:0.85rem;">${d.fecha}</span>
                                </label>
                            </div>
                        `;
                    }
                });

                // 3. Feedback visual si no hay nada
                if (contadorPendientes === 0) {
                    container.innerHTML = `
                        <div style="text-align:center; padding:20px; color:#666;">
                            <i class="fa-solid fa-check-circle" style="font-size:2rem; margin-bottom:10px;"></i><br>
                            No hay competiciones pendientes.
                        </div>`;
                    const btn = document.getElementById('btnCerrarJornadaGlobal');
                    if(btn) {
                        btn.disabled = true;
                        btn.style.opacity = "0.5";
                        btn.style.cursor = "not-allowed";
                    }
                } else {
                    container.innerHTML = html;
                    const btn = document.getElementById('btnCerrarJornadaGlobal');
                    if(btn) {
                        btn.disabled = false;
                        btn.style.opacity = "1";
                        btn.style.cursor = "pointer";
                    }
                }

            } catch (error) {
                console.error("Error cargando checklist:", error);
                container.innerHTML = `<p style="color:red; text-align:center;">Error de conexión: ${error.message}</p>`;
            }
        }

// === 4. GUARDAR COMPETICIÓN FINAL ===
// === GUARDAR COMPETICIÓN Y ACTUALIZAR PERFILES DE ATLETAS ===
document.getElementById('formCompe').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('compeIdHidden').value;

    // Validación básica
    if (listaParticipantes.length === 0) {
        if(!confirm("⚠️ ¿Seguro que quieres crear una competición sin atletas?")) return;
    }

    const btn = document.getElementById('btnSubmitCompe');
    btn.innerText = "Guardando...";
    btn.disabled = true;

    try {
        // 1. Recoger datos de los inputs visuales (por si editaste resultados a mano)
        const itemsDOM = document.querySelectorAll('.lineup-item');
        const listaActualizada = [];
        
        itemsDOM.forEach((div, index) => {
            const inputs = div.querySelectorAll('input');
            // Buscamos el objeto original en el array
            const original = listaParticipantes[index]; 
            
            listaActualizada.push({ 
                ...original, 
                resultado: inputs[0].value, 
                puntos: Number(inputs[1].value) 
            });
        });

        // 2. Preparar objeto de la competición
        const datosCompe = {
            nombre: document.getElementById('compNombre').value,
            fecha: document.getElementById('compFecha').value,
            lugar: document.getElementById('compLugar').value,
            estado: document.getElementById('compEstado').value,
            links: document.getElementById('compLinks').value,
            pruebas_resumen: document.getElementById('compPruebas').value,
            participantes: listaActualizada
        };

        // 3. GUARDAR LA COMPETICIÓN EN LA COLECCIÓN 'COMPETICIONES'
        if(id) await updateDoc(doc(db, "competiciones", id), datosCompe);
        else await addDoc(collection(db, "competiciones"), datosCompe);

        // ============================================================
        // 4. NUEVO: ACTUALIZAR LA FICHA DE CADA ATLETA (PARA EL MERCADO)
        // ============================================================
        // Esto recorre todos los atletas de la lista y actualiza su MMP y Posición en su perfil personal
        
        const promesasActualizacion = listaActualizada.map(p => {
            // Solo actualizamos si hay datos válidos (para no borrar datos antiguos por error)
            const actualizaciones = {};
            
            if(p.marca_personal && p.marca_personal !== "-") {
                actualizaciones.marca_personal = p.marca_personal;
            }
            if(p.posicion_esperada && p.posicion_esperada !== "-") {
                actualizaciones.posicion_esperada = p.posicion_esperada;
            }

            // Si hay algo que actualizar, lanzamos la petición a la colección 'atletas'
            if(Object.keys(actualizaciones).length > 0) {
                const atletaRef = doc(db, "atletas", p.id_atleta);
                return updateDoc(atletaRef, actualizaciones);
            }
        });

        // Esperamos a que se actualicen todos los atletas
        await Promise.all(promesasActualizacion);

        // ============================================================

        alert("✅ Competición guardada y perfiles de atletas actualizados.");
        window.location.reload();

    } catch (error) {
        console.error(error);
        alert("Error guardando: " + error.message);
        btn.disabled = false;
        btn.innerText = "GUARDAR DATOS";
    }
});