// Constantes para los elementos del DOM
const formularioMuestra = document.getElementById('formularioMuestra');
const tablaBody = document.querySelector('#tabla-muestras tbody');
const tablaMuestras = document.getElementById('tabla-muestras');
const mensajeVacio = document.getElementById('mensaje-vacio');
const botonLimpiar = document.getElementById('limpiarDatos');
const botonExportar = document.getElementById('exportarDatos');
const KEY_STORAGE = 'muestrasGeologicas';

const formularioMapaManual = document.getElementById('formularioMapaManual');
const inputMapLatitud = document.getElementById('mapLatitud');
const inputMapLongitud = document.getElementById('mapLongitud');

// --- FUNCIONES DE UTILIDAD Y BÚSQUEDA EN MAPA ---

/**
 * Abre Google Maps. Prioriza coordenadas, luego Localidad/País.
 */
function abrirEnGoogleMaps(latitud, longitud, localidad, pais) {
    let url = '';
    
    function convertirADecimal(coord) {
        if (!coord) return null;
        let decimal = parseFloat(coord.toString().replace(/[^\d.\-]/g, ''));
        return isNaN(decimal) ? null : decimal;
    }

    const latDecimal = convertirADecimal(latitud);
    const lonDecimal = convertirADecimal(longitud);

    if (latDecimal !== null && lonDecimal !== null) {
        url = `https://www.google.com/maps?q=${latDecimal},${lonDecimal}`;
    } else if (localidad || pais) {
        const consulta = encodeURIComponent(`${localidad}${localidad && pais ? ', ' : ''}${pais}`);
        url = `https://www.google.com/maps/search/${consulta}`;
    } else {
        alert("No hay datos suficientes (coordenadas o ubicación) para buscar en el mapa.");
        return;
    }

    window.open(url, '_blank');
}

function manejarEnvioMapaManual(e) {
    e.preventDefault(); 
    const latitud = inputMapLatitud.value;
    const longitud = inputMapLongitud.value;
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
}

// --- RENDERIZADO DE TABLA Y ACCIONES ---

function habilitarEdicion(id, fila) {
    const celdas = fila.getElementsByTagName('td');
    const campos = ['numeroMuestra', 'coleccionista', 'localidad', 'pais', 'mineralogia', 'paleontologia', 'latitud', 'longitud'];
    
    campos.forEach((campo, index) => {
        const valorActual = celdas[index].textContent === "---" ? "" : celdas[index].textContent;
        celdas[index].innerHTML = `<input type="text" value="${valorActual}" class="input-edicion" id="edit-${campo}-${id}">`;
    });

    const celdaAcciones = celdas[campos.length + 1]; 
    celdaAcciones.innerHTML = ''; 
    
    const botonGuardar = document.createElement('button');
    botonGuardar.textContent = 'Guardar';
    botonGuardar.classList.add('btn-accion', 'btn-guardar-edicion');
    botonGuardar.onclick = () => guardarEdicion(id); 

    celdaAcciones.appendChild(botonGuardar);
}

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

    // Validación cruzada de coordenadas: o ambas o ninguna.
    if ((nuevosDatos.latitud && !nuevosDatos.longitud) || (!nuevosDatos.latitud && nuevosDatos.longitud)) {
        alert('Si ingresas una coordenada, debes completar ambos campos (Latitud y Longitud).');
        return;
    }

    let muestras = obtenerMuestras();
    const indiceMuestra = muestras.findIndex(m => m.id === id);

    if (indiceMuestra !== -1) {
        muestras[indiceMuestra] = { ...muestras[indiceMuestra], ...nuevosDatos }; 
    }

    guardarMuestras(muestras);
    renderizarMuestras();
    alert('Muestra actualizada.');
}

function renderizarMuestras() {
    const muestras = obtenerMuestras();
    tablaBody.innerHTML = ''; 

    const tablaVisible = muestras.length > 0;
    mensajeVacio.classList.toggle('oculto', tablaVisible);
    tablaMuestras.classList.toggle('oculto', !tablaVisible);
    botonLimpiar.classList.toggle('oculto', !tablaVisible);
    botonExportar.classList.toggle('oculto', !tablaVisible); 

    if (!tablaVisible) return;

    muestras.forEach(muestra => {
        const fila = tablaBody.insertRow();
        
        // Función auxiliar para mostrar "---" si el dato está vacío
        const mostrarDato = (dato) => (dato && dato.trim() !== "") ? dato : "---";

        fila.insertCell().textContent = mostrarDato(muestra.numeroMuestra);
        fila.insertCell().textContent = mostrarDato(muestra.coleccionista);
        fila.insertCell().textContent = mostrarDato(muestra.localidad);
        fila.insertCell().textContent = mostrarDato(muestra.pais);
        fila.insertCell().textContent = mostrarDato(muestra.mineralogia);
        fila.insertCell().textContent = mostrarDato(muestra.paleontologia);
        fila.insertCell().textContent = mostrarDato(muestra.latitud);
        fila.insertCell().textContent = mostrarDato(muestra.longitud);

        const celdaMapa = fila.insertCell();
        const botonMapa = document.createElement('button');
        botonMapa.textContent = 'Ver en Mapa';
        botonMapa.classList.add('btn-accion', 'btn-mapa');
        botonMapa.onclick = () => abrirEnGoogleMaps(muestra.latitud, muestra.longitud, muestra.localidad, muestra.pais); 
        celdaMapa.appendChild(botonMapa);
        
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

function manejarEnvioFormulario(e) {
    e.preventDefault(); 

    const nuevaMuestra = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9), 
        numeroMuestra: document.getElementById('numeroMuestra').value,
        coleccionista: document.getElementById('coleccionista').value,
        localidad: document.getElementById('localidad').value,
        pais: document.getElementById('pais').value,
        mineralogia: document.getElementById('mineralogia').value,
        paleontologia: document.getElementById('paleontologia').value,
        latitud: document.getElementById('latitud').value, 
        longitud: document.getElementById('longitud').value
    };

    // Validación mínima de coordenadas
    if ((nuevaMuestra.latitud && !nuevaMuestra.longitud) || (!nuevaMuestra.latitud && nuevaMuestra.longitud)) {
        alert('Si ingresas una coordenada, debes completar ambos campos (Latitud y Longitud).');
        return;
    }

    const muestras = obtenerMuestras();
    muestras.push(nuevaMuestra);
    guardarMuestras(muestras);

    renderizarMuestras();
    formularioMuestra.reset(); 
    alert('Muestra guardada exitosamente.');
}

function manejarExportarDatos() {
    const muestras = obtenerMuestras();
    if (muestras.length === 0) return alert('No hay datos para exportar.');

    const cabeceras = ['ID', 'Número de muestra', 'Coleccionista', 'Localidad', 'País', 'Mineralogía', 'Paleontología', 'Latitud', 'Longitud']; 
    const filasCSV = muestras.map(m => 
        `"${m.id}","${m.numeroMuestra}","${m.coleccionista}","${m.localidad}","${m.pais}","${(m.mineralogia || '').replace(/"/g, '""')}","${(m.paleontologia || '').replace(/"/g, '""')}","${m.latitud}","${m.longitud}"`
    );

    const contenidoCSV = [cabeceras.join(','), ...filasCSV].join('\n');
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `muestras_${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
}

function manejarLimpiarDatos() {
    if (confirm('¿Eliminar TODOS los datos? Esta acción es irreversible.')) {
        localStorage.removeItem(KEY_STORAGE);
        renderizarMuestras();
    }
}

// --- INICIALIZACIÓN ---
formularioMuestra.addEventListener('submit', manejarEnvioFormulario);
botonLimpiar.addEventListener('click', manejarLimpiarDatos);
botonExportar.addEventListener('click', manejarExportarDatos); 
if(formularioMapaManual) formularioMapaManual.addEventListener('submit', manejarEnvioMapaManual);

document.addEventListener('DOMContentLoaded', renderizarMuestras);