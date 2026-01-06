import { db, auth } from "../js/firebase-config.js"; 
    import { 
        collection, addDoc, getDocs, orderBy, query, doc, getDoc, updateDoc, deleteDoc, where 
    } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
    import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

    // Variables globales
    let listaParticipantes = []; 
    window.listaParticipantes = listaParticipantes; 

    // === SEGURIDAD ===
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const docRef = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().rol === "admin") {
                initAdmin();
            } else {
                document.body.innerHTML = "<h1>⛔ ACCESO DENEGADO</h1>";
                setTimeout(() => window.location.href = "../docs/home.html", 1500);
            }
        } else {
            window.location.href = "../index.html";
        }
    });

    async function initAdmin() {
        console.log("Iniciando Admin...");
        cargarSelectoresAtletas();
        cargarSelectorCompes();
        cargarCheckboxesPendientes();
    }

    // =============================================================
    // 1. LÓGICA DE ATLETAS (SOLUCIÓN A TU PROBLEMA DE GUARDADO)
    // =============================================================

    // --- CARGAR DATOS AL EDITAR ---
    document.getElementById('btnCargarAtleta').addEventListener('click', () => {
        const select = document.getElementById('selectorEditarAtleta');
        if(!select.value) return alert("Selecciona un atleta.");
        
        // Obtenemos los datos completos del atributo data-info
        const data = JSON.parse(select.options[select.selectedIndex].getAttribute('data-info'));
        console.log("Cargando datos:", data); // Para depurar

        document.getElementById('atletaIdHidden').value = select.value;
        document.getElementById('atlNombre').value = data.nombre;
        document.getElementById('atlApellidos').value = data.apellidos;
        document.getElementById('atlCategoria').value = data.categoria;
        document.getElementById('atlPrecio').value = data.precio;
        document.getElementById('atlPruebas').value = data.pruebas_principales || "";
        document.getElementById('atlCatMarcas').value = data.cat_marcas || "u23";
        
        // CARGA DE CAMPOS ESPECÍFICOS (Asegurando que coinciden con los IDs del HTML)
        document.getElementById('atlMarcaPersonal').value = data.marca_personal || "";
        document.getElementById('atlPosicionEsperada').value = data.posicion_esperada || "";
        document.getElementById('atlFechaUltima').value = data.fecha_ultima_competicion || "";
        document.getElementById('atlMarcaUltima').value = data.marca_ultima_competicion || "";

        document.getElementById('fotoActualHidden').value = data.foto || "";
        
        // Mostrar botones ocultos
        document.getElementById('btnCancelarEdicion').style.display = 'block';
        document.getElementById('btnBorrarAtleta').style.display = 'block';
    });

    // --- GUARDAR (SUBMIT) ---
    document.getElementById('formAtleta').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSubmitAtleta');
        btn.disabled = true;
        btn.innerText = "Procesando...";

        try {
            const id = document.getElementById('atletaIdHidden').value;
            const precio = Number(document.getElementById('atlPrecio').value);
            const fileInput = document.getElementById('atlFotoInput');
            
            // Foto
            let rutaFoto = id ? document.getElementById('fotoActualHidden').value : "https://cdn-icons-png.flaticon.com/512/74/74472.png";
            if (fileInput.files.length > 0) rutaFoto = "../images/" + fileInput.files[0].name;

            // Recoger valores de los inputs nuevos MANUALMENTE para asegurar
            const mp = document.getElementById('atlMarcaPersonal').value;
            const pos = document.getElementById('atlPosicionEsperada').value;
            const fecha = document.getElementById('atlFechaUltima').value;
            const mUltima = document.getElementById('atlMarcaUltima').value;

            // Construir objeto
            const datos = {
                nombre: document.getElementById('atlNombre').value,
                apellidos: document.getElementById('atlApellidos').value,
                categoria: document.getElementById('atlCategoria').value,
                precio: precio,
                pruebas_principales: document.getElementById('atlPruebas').value,
                cat_marcas: document.getElementById('atlCatMarcas').value,
                foto: rutaFoto,
                
                // AQUÍ ESTÁN LOS CAMPOS QUE NO SE GUARDABAN:
                marca_personal: mp,
                posicion_esperada: Number(pos) || 0,
                fecha_ultima_competicion: fecha,
                marca_ultima_competicion: mUltima
            };

            console.log("Enviando a Firebase:", datos); // MIRA LA CONSOLA SI FALLA

            if (id) {
                // ACTUALIZAR
                await updateDoc(doc(db, "atletas", id), datos);
                alert("✅ Datos actualizados correctamente en Firebase.");
            } else {
                // CREAR
                datos.puntos = 0;
                datos.tendencia = "neutral";
                datos.historial_puntos = [];
                datos.historial_valor = [precio];
                await addDoc(collection(db, "atletas"), datos);
                alert("✅ Nuevo atleta creado correctamente.");
            }

            window.location.reload(); 

        } catch (error) {
            console.error("ERROR AL GUARDAR:", error);
            alert("Error crítico al guardar: " + error.message);
            btn.disabled = false;
            btn.innerText = "GUARDAR ATLETA";
        }
    });

    // =============================================================
    // RESTO DE FUNCIONES (SELECTORES, COMPETICIONES, ETC.)
    // =============================================================
    async function cargarSelectoresAtletas() {
        try {
            const q = query(collection(db, "atletas"), orderBy("nombre"));
            const snap = await getDocs(q);
            let html = '<option value="">-- Selecciona Atleta --</option>';
            snap.forEach((doc) => {
                const d = doc.data();
                const safeData = JSON.stringify(d).replace(/"/g, '&quot;');
                html += `<option value="${doc.id}" data-info="${safeData}">${d.nombre} ${d.apellidos}</option>`;
            });
            document.getElementById('selectorEditarAtleta').innerHTML = html;
            document.getElementById('selectorAtletasLineup').innerHTML = html;
        } catch(e) { console.error(e); }
    }

    async function cargarSelectorCompes() {
        try {
            const q = query(collection(db, "competiciones"), orderBy("fecha", "desc"));
            const snap = await getDocs(q);
            let html = '<option value="">-- Selecciona --</option>';
            snap.forEach((doc) => {
                const d = doc.data();
                const safeData = JSON.stringify(d).replace(/"/g, '&quot;');
                const estado = d.estado === 'finalizada' ? '✅' : '⏳';
                html += `<option value="${doc.id}" data-info="${safeData}">${estado} ${d.fecha} - ${d.nombre}</option>`;
            });
            document.getElementById('selectorEditarCompe').innerHTML = html;
        } catch(e) { console.error(e); }
    }

    // --- COMPETICIONES ---
    document.getElementById('btnCargarCompe').addEventListener('click', () => {
        const select = document.getElementById('selectorEditarCompe');
        if(!select.value) return alert("Selecciona una competición");
        const data = JSON.parse(select.options[select.selectedIndex].getAttribute('data-info'));
        
        document.getElementById('compeIdHidden').value = select.value;
        document.getElementById('compNombre').value = data.nombre;
        document.getElementById('compFecha').value = data.fecha;
        document.getElementById('compLugar').value = data.lugar;
        document.getElementById('compEstado').value = data.estado || "pendiente";
        document.getElementById('compLinks').value = data.links || "";
        document.getElementById('compPruebas').value = data.pruebas_resumen || "";
        
        window.listaParticipantes = data.participantes || [];
        actualizarVisualCompe();
        document.getElementById('btnCancelarCompe').style.display = 'block';
        document.getElementById('btnBorrarCompe').style.display = 'block';
    });

    document.getElementById('btnAddLineup').addEventListener('click', () => {
        const selector = document.getElementById('selectorAtletasLineup');
        const prueba = document.getElementById('inputPruebaEspecifica').value;
        if (!selector.value || !prueba) return alert("Falta Atleta o Prueba");

        window.listaParticipantes.push({
            id_atleta: selector.value,
            nombre_completo: selector.options[selector.selectedIndex].text,
            prueba: prueba,
            resultado: "",
            puntos: 0
        });
        document.getElementById('inputPruebaEspecifica').value = "";
        actualizarVisualCompe();
    });

    function actualizarVisualCompe() {
        const container = document.getElementById('listaVisual');
        container.innerHTML = window.listaParticipantes.length ? "" : '<p style="color:#666;text-align:center;">Lista vacía.</p>';
        window.listaParticipantes.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'lineup-item';
            div.dataset.id = item.id_atleta;
            div.style.cssText = "display:flex; align-items:center; gap:10px; border-bottom:1px solid #333; padding:10px; background:#151515; margin-bottom:5px;";
            div.innerHTML = `
                <div style="flex-grow:1;"><strong style="color:white;">${item.nombre_completo}</strong> <span style="color:#888;">(${item.prueba})</span></div>
                <input type="text" class="result-text" value="${item.resultado||''}" oninput="window.listaParticipantes[${index}].resultado=this.value">
                <input type="number" class="result-points" value="${item.puntos||0}" oninput="window.listaParticipantes[${index}].puntos=Number(this.value)">
                <i class="fa-solid fa-trash" style="color:red; cursor:pointer;" onclick="delLineup(${index})"></i>
            `;
            container.appendChild(div);
        });
    }
    window.delLineup = (index) => { window.listaParticipantes.splice(index, 1); actualizarVisualCompe(); };

    document.getElementById('formCompe').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSubmitCompe');
        btn.disabled = true; btn.innerText = "Guardando...";
        try {
            const id = document.getElementById('compeIdHidden').value;
            const domItems = document.querySelectorAll('.lineup-item');
            const listaFinal = [];
            domItems.forEach((div, i) => {
                const inputs = div.querySelectorAll('input');
                listaFinal.push({
                    ...window.listaParticipantes[i],
                    resultado: inputs[0].value,
                    puntos: Number(inputs[1].value)
                });
            });

            const datos = {
                nombre: document.getElementById('compNombre').value,
                fecha: document.getElementById('compFecha').value,
                lugar: document.getElementById('compLugar').value,
                estado: document.getElementById('compEstado').value,
                links: document.getElementById('compLinks').value,
                pruebas_resumen: document.getElementById('compPruebas').value,
                participantes: listaFinal
            };

            if(id) await updateDoc(doc(db, "competiciones", id), datos);
            else await addDoc(collection(db, "competiciones"), datos);
            
            alert("✅ Competición guardada.");
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
            btn.disabled = false;
        }
    });

    // --- CIERRE JORNADA ---
    async function cargarCheckboxesPendientes() {
        const container = document.getElementById('checklistCompes');
        try {
            const q = query(collection(db, "competiciones"), orderBy("fecha", "asc"));
            const snap = await getDocs(q);
            let html = '';
            let hay = false;
            snap.forEach(doc => {
                const d = doc.data();
                if(d.estado === 'pendiente') {
                    hay = true;
                    const json = JSON.stringify(d.participantes || []).replace(/"/g, '&quot;');
                    html += `<div class="check-item"><label style="display:flex;align-items:center;cursor:pointer;"><input type="checkbox" class="comp-checkbox" value="${doc.id}" data-parts="${json}" style="margin-right:10px;"><span style="color:white;">${d.nombre}</span></label></div>`;
                }
            });
            container.innerHTML = hay ? html : '<p style="color:#666;text-align:center">No hay pendientes.</p>';
            if(!hay && document.getElementById('btnCerrarJornadaGlobal')) document.getElementById('btnCerrarJornadaGlobal').disabled = true;
        } catch(e) { console.error(e); }
    }

    document.getElementById('btnCerrarJornadaGlobal').addEventListener('click', async () => {
        if(!confirm("¿Cerrar jornada?")) return;
        const checks = document.querySelectorAll('.comp-checkbox:checked');
        const btn = document.getElementById('btnCerrarJornadaGlobal');
        btn.disabled = true; btn.innerText = "Procesando...";
        
        try {
            const mapa = {};
            const ids = [];
            checks.forEach(cb => {
                ids.push(cb.value);
                const parts = JSON.parse(cb.getAttribute('data-parts'));
                parts.forEach(p => { 
                    const pts = Number(p.puntos) || 0;
                    if(pts > 0) mapa[p.id_atleta] = (mapa[p.id_atleta] || 0) + pts;
                });
            });

            // Usuarios
            const usrs = await getDocs(collection(db, "usuarios"));
            const promisesU = usrs.docs.map(async uDoc => {
                const u = uDoc.data();
                const eq = u.equipo || [];
                let suma = 0;
                eq.forEach(aid => {
                    let p = mapa[aid] || 0;
                    if(u.capitanId === aid) p *= 1.5;
                    suma += p;
                });
                if(suma > 0) await updateDoc(doc(db, "usuarios", uDoc.id), { puntos_total: (u.puntos_total||0)+suma, puntos_ultima_jornada: suma });
            });
            await Promise.all(promisesU);

            // Atletas
            const promisesA = Object.keys(mapa).map(async aid => {
                const pts = mapa[aid];
                const ref = doc(db, "atletas", aid);
                const snap = await getDoc(ref);
                if(snap.exists()) {
                    const d = snap.data();
                    let np = d.precio;
                    if(pts >= 25) np++;
                    if(pts <= 5 && np > 1) np--;
                    const hp = d.historial_puntos || []; hp.push(pts);
                    const hv = d.historial_valor || []; hv.push(np);
                    await updateDoc(ref, { puntos: (d.puntos||0)+pts, precio: np, historial_puntos: hp, historial_valor: hv });
                }
            });
            await Promise.all(promisesA);

            // Cerrar
            const promisesC = ids.map(id => updateDoc(doc(db, "competiciones", id), { estado: "finalizada" }));
            await Promise.all(promisesC);

            alert("Jornada cerrada");
            window.location.reload();
        } catch(e) { console.error(e); alert("Error: " + e.message); btn.disabled = false; }
    });