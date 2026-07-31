// Referencias a los elementos que cambian con cada medición del ESP32.
const elementos = {
  ubicacion: document.querySelector('#ubicacion'),
  identificador: document.querySelector('#identificador'),
  estado: document.querySelector('#estado'),
  estadoTarjeta: document.querySelector('#estadoTarjeta'),
  nivel: document.querySelector('#nivel'),
  barraNivel: document.querySelector('#barraNivel'),
  barraFondo: document.querySelector('.barra-fondo'),
  distancia: document.querySelector('#distancia'),
  tapa: document.querySelector('#tapa'),
  ultimaActualizacion: document.querySelector('#ultimaActualizacion'),
  conexion: document.querySelector('#conexion'),
  textoConexion: document.querySelector('#textoConexion'),
  mensaje: document.querySelector('#mensaje'),
  actualizarBtn: document.querySelector('#actualizarBtn'),
  probarBtn: document.querySelector('#probarBtn')
};

let ultimaFechaRecibida = null;

function claseSegunEstado(estado) {
  const clases = {
    'Disponible': 'disponible',
    'Casi lleno': 'casi-lleno',
    'Requiere recojo': 'requiere-recojo'
  };
  return clases[estado] || 'sin-datos';
}

function actualizarConexion() {
  const fechaValida = ultimaFechaRecibida && !Number.isNaN(ultimaFechaRecibida.getTime());
  const estaEnLinea = fechaValida && Date.now() - ultimaFechaRecibida.getTime() < 30000;

  elementos.conexion.classList.toggle('en-linea', Boolean(estaEnLinea));
  elementos.conexion.classList.toggle('desconectado', !estaEnLinea);
  elementos.textoConexion.textContent = estaEnLinea ? 'ESP32 en línea' : 'ESP32 desconectado';
}

function mostrarEstado(datos) {
  const nivel = Number.isFinite(datos.nivel) ? Math.min(100, Math.max(0, datos.nivel)) : 0;
  const claseEstado = claseSegunEstado(datos.estado);

  elementos.ubicacion.textContent = datos.ubicacion || 'Sin ubicación';
  elementos.identificador.textContent = `ID: ${datos.id || 'Sin identificar'}`;
  elementos.estado.textContent = datos.estado || 'Sin datos';
  elementos.nivel.innerHTML = `${nivel}<span>%</span>`;
  elementos.barraNivel.style.width = `${nivel}%`;
  elementos.barraFondo.setAttribute('aria-valuenow', String(nivel));
  elementos.distancia.textContent = Number.isFinite(datos.distancia) ? `${datos.distancia} cm` : '—';
  elementos.tapa.textContent = datos.tapa === 'abierta' ? 'Abierta' : 'Cerrada';

  elementos.estadoTarjeta.className = `tarjeta estado-tarjeta ${claseEstado}`;
  elementos.barraNivel.className = `barra-nivel ${claseEstado}`;

  ultimaFechaRecibida = datos.ultimaActualizacion ? new Date(datos.ultimaActualizacion) : null;
  elementos.ultimaActualizacion.textContent = ultimaFechaRecibida && !Number.isNaN(ultimaFechaRecibida.getTime())
    ? ultimaFechaRecibida.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'medium' })
    : 'Aún no hay mediciones';
  actualizarConexion();
}

async function consultarEstado(mostrarConfirmacion = false) {
  try {
    const respuesta = await fetch('/api/estado', { cache: 'no-store' });
    if (!respuesta.ok) throw new Error(`El servidor respondió con estado ${respuesta.status}`);

    mostrarEstado(await respuesta.json());
    elementos.mensaje.classList.remove('error');
    elementos.mensaje.textContent = mostrarConfirmacion ? 'Datos actualizados correctamente.' : '';
  } catch (error) {
    // Se mantienen visibles los últimos datos válidos si la red falla.
    elementos.conexion.classList.remove('en-linea');
    elementos.conexion.classList.add('desconectado');
    elementos.textoConexion.textContent = 'ESP32 desconectado';
    elementos.mensaje.classList.add('error');
    elementos.mensaje.textContent = 'No se pudo conectar con el servidor. Se muestran los últimos datos disponibles.';
    console.error('Error al consultar el estado:', error);
  }
}

async function ejecutarPrueba() {
  elementos.probarBtn.disabled = true;
  try {
    const respuesta = await fetch('/api/prueba', { method: 'POST' });
    if (!respuesta.ok) throw new Error(`El servidor respondió con estado ${respuesta.status}`);
    await consultarEstado();
    elementos.mensaje.classList.remove('error');
    elementos.mensaje.textContent = 'Simulación realizada: el tacho requiere recojo.';
  } catch (error) {
    elementos.mensaje.classList.add('error');
    elementos.mensaje.textContent = 'No fue posible ejecutar la simulación.';
    console.error('Error durante la prueba:', error);
  } finally {
    elementos.probarBtn.disabled = false;
  }
}

elementos.actualizarBtn.addEventListener('click', () => consultarEstado(true));
elementos.probarBtn.addEventListener('click', ejecutarPrueba);

// Consulta inmediata y actualización automática cada tres segundos.
consultarEstado();
setInterval(consultarEstado, 3000);
setInterval(actualizarConexion, 1000);
