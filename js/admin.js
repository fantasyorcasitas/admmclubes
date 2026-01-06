// ==========================================
// 1. BOTÓN CARGAR (Para editar un atleta existente)
// ==========================================
document.getElementById('btnCargarAtleta').addEventListener('click', () => {
    const select = document.getElementById('selectorEditarAtleta');
    
    // Validar que se haya seleccionado alguien
    if(!select.value) return alert("⚠️ Por favor, selecciona un atleta de la lista.");
    
    // Recuperamos el objeto de datos guardado en el atributo data-info
    const data = JSON.parse(select.options[select.selectedIndex].getAttribute('data-info'));
    
    // Rellenamos los campos básicos
    document.getElementById('atletaIdHidden').value = select.value;
    document.getElementById('atlNombre').value = data.nombre;
    document.getElementById('atlApellidos').value = data.apellidos;
    document.getElementById('atlCategoria').value = data.categoria;
    document.getElementById('atlPrecio').value = data.precio;
    document.getElementById('atlPruebas').value = data.pruebas_principales || "";
    document.getElementById('atlCatMarcas').value = data.cat_marcas || "u23";
    
    // --- AQUÍ RELLENAMOS LOS NUEVOS CAMPOS ---
    document.getElementById('atlMarcaPersonal').value = data.marca_personal || "";
    document.getElementById('atlPosicionEsperada').value = data.posicion_esperada || "";
    // -----------------------------------------

    // Gestión de la foto
    document.getElementById('fotoActualHidden').value = data.foto;
    document.getElementById('rutaPreview').innerText = data.foto ? "Foto actual cargada" : "Sin foto";
    
    // Mostrar botones de borrar/cancelar
    document.getElementById('btnCancelarEdicion').style.display = 'block';
    document.getElementById('btnBorrarAtleta').style.display = 'block';
});


// ==========================================
// 2. FORMULARIO SUBMIT (Guardar o Actualizar)
// ==========================================
document.getElementById('formAtleta').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btnSubmitAtleta');
    btn.innerText = "Guardando...";
    btn.disabled = true;

    try {
        const id = document.getElementById('atletaIdHidden').value;
        const precioInput = Number(document.getElementById('atlPrecio').value);
        const fileInput = document.getElementById('atlFotoInput');
        
        // Lógica de Foto: Si suben una nueva usamos esa, si no, la que ya tenía, o la default
        let rutaFoto = id ? document.getElementById('fotoActualHidden').value : "https://cdn-icons-png.flaticon.com/512/74/74472.png";
        
        // NOTA: Aquí asumo que guardas la ruta local. Si usas Storage real, la lógica cambia un poco.
        if (fileInput.files.length > 0) {
            rutaFoto = "../images/" + fileInput.files[0].name; 
        }

        // CREAMOS EL OBJETO CON TODOS LOS DATOS
        const datos = {
            nombre: document.getElementById('atlNombre').value,
            apellidos: document.getElementById('atlApellidos').value,
            categoria: document.getElementById('atlCategoria').value,
            precio: precioInput,
            pruebas_principales: document.getElementById('atlPruebas').value,
            cat_marcas: document.getElementById('atlCatMarcas').value,
            foto: rutaFoto,

            // --- AQUÍ GUARDAMOS LOS NUEVOS CAMPOS ---
            marca_personal: document.getElementById('atlMarcaPersonal').value, 
            posicion_esperada: Number(document.getElementById('atlPosicionEsperada').value) || 0
            // ----------------------------------------
        };

        if (id) {
            // === MODO EDICIÓN ===
            // Actualizamos el documento existente
            await updateDoc(doc(db, "atletas", id), datos);
            alert("✅ Atleta actualizado correctamente");
        } else {
            // === MODO CREACIÓN ===
            // Inicializamos valores por defecto para un atleta nuevo
            datos.puntos = 0;
            datos.tendencia = "neutral";
            datos.historial_puntos = [];
            datos.historial_valor = [precioInput]; // El primer valor del historial es su precio actual

            await addDoc(collection(db, "atletas"), datos);
            alert("✅ Nuevo atleta creado correctamente");
        }

        // Limpieza y recarga
        document.getElementById('formAtleta').reset();
        window.location.reload();

    } catch (error) {
        console.error("Error guardando atleta:", error);
        alert("❌ Error al guardar: " + error.message);
    } finally {
        btn.innerText = "GUARDAR";
        btn.disabled = false;
    }
});