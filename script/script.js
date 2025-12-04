// Constantes para los elementos del DOM
const formularioMuestra = document.getElementById('formularioMuestra');
const tablaBody = document.querySelector('#tabla-muestras tbody');
const tablaMuestras = document.getElementById('tabla-muestras');
const mensajeVacio = document.getElementById('mensaje-vacio');
const botonLimpiar = document.getElementById('limpiarDatos');
const botonExportar = document.getElementById('exportarDatos');
const KEY_STORAGE = 'muestrasGeologicas';

// Constantes para la nueva sección de búsqueda manual
const formularioMapaManual = document.getElementById('formularioMapaManual');
const inputMapLatitud = document.getElementById('mapLatitud');
const inputMapLongitud = document.getElementById('mapLongitud');


// --- FUNCIONES DE UTILIDAD Y BÚSQUEDA EN MAPA ---

/**
 * Función que construye la URL de Google Maps y abre una nueva pestaña.
 * Prioriza Latitud/Longitud. Si no existen, usa Localidad y País.
 */
function abrirEnGoogleMaps(latitud, longitud, localidad, pais) {
    let url = '';
    
    // Función de conversión simple GMS a Decimal
    function convertirADecimal(coord) {
        if (!coord) return null;
        let decimal = parseFloat(coord.toString().replace(/[^\d.\-]/g, ''));
        if (!isNaN(decimal)) return decimal;
        return null; 
    }

    // 1. Prioridad: Latitud y Longitud (deben estar AMBOS presentes)
    const latDecimal = convertirADecimal(latitud);
    const lonDecimal = convertirADecimal(longitud);

    if (latDecimal !== null && lonDecimal !== null) {
        url = `https://www.google.com/maps/search/?api=1&query=${latDecimal},${lonDecimal}`;
    
    // 2. Opción de fallback: Localidad y País (deben estar AMBOS presentes)
    } else if (localidad && pais) {
        const consulta = encodeURIComponent(`${localidad}, ${pais}`);
        url = `https://www.google.com/maps/search/?api=1&query=${consulta}`;
    
    // 3. Ningún dato para buscar
    } else {
        alert("Faltan datos de ubicación (coordenadas o Localidad/País) para buscar en el mapa.");
        return;
    }

    window.open(url, '_blank');
}

/**
 * Manejador para el formulario de búsqueda manual de coordenadas.
 */
function manejarEnvioMapaManual(e) {
    e.preventDefault(); 
    
    // El campo de Número de Muestra es opcional y solo para referencia.
    const latitud = inputMapLatitud.value;
    const longitud = inputMapLongitud.value;
    
    // La validación de 'required' en el HTML ya asegura que no estén vacíos
    
    // Llamamos a la función principal. Solo usamos coordenadas.
    abrirEnGoogleMaps(latitud, longitud, '', ''); 
}

// --- GESTIÓN DE LOCAL STORAGE (CRUD) ---

function obtenerMuestras() {
    const muestrasJSON = localStorage.getItem(KEY_STORAGE);
    return muestrasJSON ? JSON.parse(muestrasJSON) : [];
}

function guardarMuestras(muestras) {
    localStorage.setItem(KEY_STORAGE, JSON.stringify(muestras));
}

function eliminarMuestra(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta muestra?')) return; 
    let muestras = obtenerMuestras();
    muestras = muestras.filter(muestra => muestra.id !== id); 
    guardarMuestras(muestras);
    renderizarMuestras();
    alert('Muestra eliminada exitosamente.');
}

// --- RENDERIZADO DE TABLA Y ACCIONES ---

/**
 * Habilita la edición de una fila.
 */
function habilitarEdicion(id, fila) {
    const celdas = fila.getElementsByTagName('td');
    // 8 campos de datos
    const campos = ['numeroMuestra', 'coleccionista', 'localidad', 'pais', 'mineralogia', 'paleontologia', 'latitud', 'longitud'];
    
    campos.forEach((campo, index) => {
        const valorActual = celdas[index].textContent;
        celdas[index].innerHTML = `<input type="text" value="${valorActual}" class="input-edicion" id="edit-${campo}-${id}">`;
    });

    // La celda de Acciones (índice 9)
    const celdaAcciones = celdas[campos.length + 1]; 
    celdaAcciones.innerHTML = ''; 
    
    const botonGuardar = document.createElement('button');
    botonGuardar.textContent = 'Guardar';
    botonGuardar.classList.add('btn-accion', 'btn-guardar-edicion');
    botonGuardar.onclick = () => guardarEdicion(id); 

    celdaAcciones.appendChild(botonGuardar);
}

/**
 * Guarda los datos editados con validación.
 */
function guardarEdicion(id) {
    const nuevosDatos = {
        numeroMuestra: document.getElementById(`edit-numeroMuestra-${id}`).value,
        coleccionista: document.getElementById(`edit-coleccionista-${id}`).value,
        localidad: document.getElementById(`edit-localidad-${id}`).value,
        pais: document.getElementById(`edit-pais-${id}`).value,
        mineralogia: document.getElementById(`edit-mineralogia-${id}`).value,
        paleontologia: document.getElementById(`edit-paleontologia-${id}`).value,
        latitud: document.getElementById(`edit-latitud-${id}`).value, 
        longitud: document.getElementById(`edit-longitud-${id}`).value
    };
    
    // Validación de campos obligatorios
    if (!nuevosDatos.numeroMuestra || !nuevosDatos.coleccionista || !nuevosDatos.localidad || !nuevosDatos.pais || !nuevosDatos.mineralogia || !nuevosDatos.paleontologia) {
        alert('Los campos principales son obligatorios.');
        return;
    }

    // Validación CRUZADA de Latitud/Longitud: Ambos llenos O ambos vacíos.
    const tieneLatitud = !!nuevosDatos.latitud;
    const tieneLongitud = !!nuevosDatos.longitud;
    if ((tieneLatitud && !tieneLongitud) || (!tieneLatitud && tieneLongitud)) {
        alert('Si se ingresa una coordenada (Latitud o Longitud), la otra también debe ser ingresada. Ambas deben estar llenas o ambas vacías.');
        return;
    }

    let muestras = obtenerMuestras();
    const indiceMuestra = muestras.findIndex(muestra => muestra.id === id);

    if (indiceMuestra !== -1) {
        muestras[indiceMuestra] = { ...muestras[indiceMuestra], ...nuevosDatos }; 
    }

    guardarMuestras(muestras);
    renderizarMuestras();
    alert('Muestra actualizada exitosamente.');
}


/**
 * Renderiza la tabla de muestras.
 */
function renderizarMuestras() {
    const muestras = obtenerMuestras();
    tablaBody.innerHTML = ''; 

    // Lógica para mostrar/ocultar elementos
    const tablaVisible = muestras.length > 0;
    mensajeVacio.classList.toggle('oculto', tablaVisible);
    tablaMuestras.classList.toggle('oculto', !tablaVisible);
    botonLimpiar.classList.toggle('oculto', !tablaVisible);
    botonExportar.classList.toggle('oculto', !tablaVisible); 

    if (!tablaVisible) return;

    // Crear las filas de la tabla
    muestras.forEach(muestra => {
        const fila = tablaBody.insertRow();
        
        // Insertamos los 8 campos de datos
        fila.insertCell().textContent = muestra.numeroMuestra;
        fila.insertCell().textContent = muestra.coleccionista;
        fila.insertCell().textContent = muestra.localidad;
        fila.insertCell().textContent = muestra.pais;
        fila.insertCell().textContent = muestra.mineralogia;
        fila.insertCell().textContent = muestra.paleontologia;
        fila.insertCell().textContent = muestra.latitud;
        fila.insertCell().textContent = muestra.longitud;

        // Celda de MAPA
        const celdaMapa = fila.insertCell();
        const botonMapa = document.createElement('button');
        botonMapa.textContent = 'Ver en Mapa';
        botonMapa.classList.add('btn-accion', 'btn-mapa');
        
        // Función de mapa con fallback a Localidad/País
        botonMapa.onclick = () => abrirEnGoogleMaps(
            muestra.latitud, 
            muestra.longitud, 
            muestra.localidad, 
            muestra.pais
        ); 
        celdaMapa.appendChild(botonMapa);
        
        // Celda de Acciones (Editar/Eliminar)
        const celdaAcciones = fila.insertCell();
        
        const botonEditar = document.createElement('button');
        botonEditar.textContent = 'Editar';
        botonEditar.classList.add('btn-accion', 'btn-editar');
        botonEditar.onclick = () => habilitarEdicion(muestra.id, fila); 
        
        const botonEliminar = document.createElement('button');
        botonEliminar.textContent = 'Eliminar';
        botonEliminar.classList.add('btn-accion', 'btn-eliminar');
        botonEliminar.onclick = () => eliminarMuestra(muestra.id); 

        celdaAcciones.appendChild(botonEditar);
        celdaAcciones.appendChild(botonEliminar);
    });
}

// --- MANEJO DE FORMULARIO Y EXPORTACIÓN ---

/**
 * Manejador de envío del formulario para agregar nueva muestra.
 */
function manejarEnvioFormulario(e) {
    e.preventDefault(); 

    // 1. Obtener valores
    const numeroMuestra = document.getElementById('numeroMuestra').value;
    const coleccionista = document.getElementById('coleccionista').value;
    const localidad = document.getElementById('localidad').value;
    const pais = document.getElementById('pais').value;
    const mineralogia = document.getElementById('mineralogia').value;
    const paleontologia = document.getElementById('paleontologia').value;
    const latitud = document.getElementById('latitud').value;
    const longitud = document.getElementById('longitud').value;

    // 2. Validación de campos obligatorios
    if (!numeroMuestra || !coleccionista || !localidad || !pais || !mineralogia || !paleontologia) {
        alert('Por favor, complete todos los campos principales.');
        return;
    }
    
    // 3. Validación CRUZADA de Coordenadas
    const tieneLatitud = !!latitud;
    const tieneLongitud = !!longitud;

    if ((tieneLatitud && !tieneLongitud) || (!tieneLatitud && tieneLongitud)) {
        alert('Si se ingresa una coordenada (Latitud o Longitud), la otra también debe ser ingresada. Ambas deben estar llenas o ambas vacías.');
        return;
    }

    // 4. Crear objeto de muestra y guardar
    const nuevoId = Date.now().toString() + Math.random().toString(36).substring(2, 9);

    const nuevaMuestra = {
        id: nuevoId, 
        numeroMuestra: numeroMuestra,
        coleccionista: coleccionista,
        localidad: localidad,
        pais: pais,
        mineralogia: mineralogia,
        paleontologia: paleontologia,
        latitud: latitud, 
        longitud: longitud
    };

    const muestras = obtenerMuestras();
    muestras.push(nuevaMuestra);
    guardarMuestras(muestras);

    renderizarMuestras();
    formularioMuestra.reset(); 
    
    alert('Muestra guardada exitosamente.');
}

/**
 * Función que convierte el arreglo de muestras a formato CSV y fuerza la descarga.
 */
function manejarExportarDatos() {
    const muestras = obtenerMuestras();

    if (muestras.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    // Cabeceras de la tabla
    const cabeceras = ['ID', 'Número de muestra', 'Coleccionista', 'Localidad', 'País', 'Mineralogía', 'Paleontología', 'Latitud', 'Longitud']; 
    
    // Mapear los datos de las muestras a líneas CSV
    const filasCSV = muestras.map(muestra => 
        // Usamos comillas para envolver el texto y manejar comas internas
        `"${muestra.id}","${muestra.numeroMuestra}","${muestra.coleccionista}","${muestra.localidad}","${muestra.pais}","${muestra.mineralogia.replace(/"/g, '""')}","${muestra.paleontologia.replace(/"/g, '""')}","${muestra.latitud}","${muestra.longitud}"`
    );

    const contenidoCSV = [cabeceras.join(','), ...filasCSV].join('\n');

    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const enlaceDescarga = document.createElement('a');
    enlaceDescarga.setAttribute('href', url);
    
    const fecha = new Date().toISOString().slice(0, 10);
    enlaceDescarga.setAttribute('download', `datos_geologicos_${fecha}.csv`);
    
    document.body.appendChild(enlaceDescarga);
    enlaceDescarga.click();
    document.body.removeChild(enlaceDescarga);

    alert('Datos exportados exitosamente como CSV.');
}

/**
 * Manejador del evento de click en el botón de limpiar.
 */
function manejarLimpiarDatos() {
    if (confirm('¿Estás seguro de que quieres eliminar TODOS los datos guardados? Esta acción es irreversible.')) {
        localStorage.removeItem(KEY_STORAGE);
        renderizarMuestras();
        alert('Todos los datos han sido eliminados.');
    }
}


// --- INICIALIZACIÓN DE LA APLICACIÓN ---

// 1. Asigna los eventos
formularioMuestra.addEventListener('submit', manejarEnvioFormulario);
botonLimpiar.addEventListener('click', manejarLimpiarDatos);
botonExportar.addEventListener('click', manejarExportarDatos); 
formularioMapaManual.addEventListener('submit', manejarEnvioMapaManual); // Evento para el formulario manual

// 2. Carga inicial
document.addEventListener('DOMContentLoaded', renderizarMuestras);