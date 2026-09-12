const INTERVALO_CONSULTA = 3000;
const UMBRAL_DATOS_RECIENTES = 30000;

const elementos = {
  ubicacion: document.querySelector('#ubicacion'),
  identificador: document.querySelector('#identificador'),
  estado: document.querySelector('#estado'),
  estadoTarjeta: document.querySelector('#estadoTarjeta'),
  nivel: document.querySelector('#nivel'),
  unidadNivel: document.querySelector('#unidadNivel'),
  barraNivel: document.querySelector('#barraNivel'),
  barraFondo: document.querySelector('#barraFondo'),
  distancia: document.querySelector('#distancia'),
  tapa: document.querySelector('#tapa'),
  tapaPunto: document.querySelector('#tapaPunto'),
  ultimaActualizacion: document.querySelector('#ultimaActualizacion'),
  tiempoRelativo: document.querySelector('#tiempoRelativo'),
  conexion: document.querySelector('#conexion'),
  textoConexion: document.querySelector('#textoConexion'),
  detalleConexion: document.querySelector('#detalleConexion'),
  alertaNivel: document.querySelector('#alertaNivel'),
  alertaDetalle: document.querySelector('#alertaDetalle'),
  alertaPorcentaje: document.querySelector('#alertaPorcentaje'),
  mensaje: document.querySelector('#mensaje'),
  actualizarBtn: document.querySelector('#actualizarBtn'),
  probarBtn: document.querySelector('#probarBtn'),
  alertaBtn: document.querySelector('#alertaBtn')
};

let fechaUltimaMedicion = null;
let hayMedicion = false;
let servidorDisponible = false;
let consultaEnCurso = false;
let alertaEnCurso = false;
let temporizadorMensaje = null;

function claseSegunEstado(estado) {
  const clases = {
    'Disponible': 'disponible',
    'Casi lleno': 'casi-lleno',
    'Requiere recojo': 'requiere-recojo'
  };

  return clases[estado] || 'sin-datos';
}

function formatearNumero(valor) {
  return valor.toLocaleString('es-PE', { maximumFractionDigits: 1 });
}

function describirTiempoTranscurrido(fecha) {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return 'Sin datos recibidos';

  const segundos = Math.max(0, Math.floor((Date.now() - fecha.getTime()) / 1000));
  if (segundos < 5) return 'Recibido hace unos segundos';
  if (segundos < 60) return `Recibido hace ${segundos} s`;

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `Recibido hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Recibido hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  return `Recibido hace ${dias} d`;
}

function actualizarConexion() {
  elementos.conexion.classList.remove('en-linea', 'sin-datos', 'consultando', 'desconectado');

  if (consultaEnCurso) {
    elementos.conexion.classList.add('consultando');
    elementos.textoConexion.textContent = 'Actualizando datos';
    elementos.detalleConexion.textContent = 'Consultando el servidor...';
    return;
  }

  if (!servidorDisponible) {
    elementos.conexion.classList.add('desconectado');
    elementos.textoConexion.textContent = 'Sin conexión';
    elementos.detalleConexion.textContent = 'No se pudo consultar el servidor';
    return;
  }

  if (!hayMedicion) {
    elementos.conexion.classList.add('sin-datos');
    elementos.textoConexion.textContent = 'Servidor conectado';
    elementos.detalleConexion.textContent = 'Esperando la primera medición';
    return;
  }

  const edadMedicion = Date.now() - fechaUltimaMedicion.getTime();
  const datosRecientes = edadMedicion < UMBRAL_DATOS_RECIENTES;
  elementos.conexion.classList.add(datosRecientes ? 'en-linea' : 'sin-datos');
  elementos.textoConexion.textContent = datosRecientes ? 'Datos actualizados' : 'Servidor conectado';
  elementos.detalleConexion.textContent = describirTiempoTranscurrido(fechaUltimaMedicion);
}

function actualizarTiempoRelativo() {
  elementos.tiempoRelativo.textContent = describirTiempoTranscurrido(fechaUltimaMedicion);
  actualizarConexion();
}

function mostrarSinDatos() {
  hayMedicion = false;
  fechaUltimaMedicion = null;
  elementos.ubicacion.textContent = '—';
  elementos.identificador.textContent = 'ID: —';
  elementos.estado.textContent = 'Sin datos';
  elementos.nivel.textContent = '—';
  elementos.unidadNivel.textContent = '';
  elementos.barraNivel.style.width = '0%';
  elementos.barraNivel.className = 'barra-nivel';
  elementos.barraFondo.setAttribute('aria-valuenow', '0');
  elementos.barraFondo.setAttribute('aria-valuetext', 'Sin datos');
  elementos.distancia.textContent = '—';
  elementos.tapa.textContent = '—';
  elementos.tapaPunto.classList.remove('activo');
  elementos.ultimaActualizacion.textContent = 'Esperando la primera medición';
  elementos.tiempoRelativo.textContent = 'Sin datos recibidos';
  elementos.estadoTarjeta.className = 'tarjeta estado-tarjeta sin-datos';
  elementos.alertaNivel.hidden = true;
  elementos.alertaBtn.disabled = true;
}

function mostrarEstado(datos) {
  const fecha = datos.ultimaActualizacion ? new Date(datos.ultimaActualizacion) : null;
  const fechaValida = fecha && !Number.isNaN(fecha.getTime());

  if (!fechaValida) {
    mostrarSinDatos();
    actualizarConexion();
    return;
  }

  const nivelRecibido = typeof datos.nivel === 'number' && Number.isFinite(datos.nivel)
    ? datos.nivel
    : null;
  const nivel = nivelRecibido === null ? null : Math.min(100, Math.max(0, nivelRecibido));
  const claseEstado = claseSegunEstado(datos.estado);
  const ubicacion = typeof datos.ubicacion === 'string' && datos.ubicacion.trim()
    ? datos.ubicacion.trim()
    : 'Sin ubicación';
  const identificador = typeof datos.id === 'string' && datos.id.trim()
    ? datos.id.trim()
    : 'Sin identificar';

  hayMedicion = true;
  fechaUltimaMedicion = fecha;
  elementos.ubicacion.textContent = ubicacion;
  elementos.identificador.textContent = `ID: ${identificador}`;
  elementos.estado.textContent = datos.estado || 'Sin datos';
  elementos.nivel.textContent = nivel === null ? '—' : formatearNumero(nivel);
  elementos.unidadNivel.textContent = nivel === null ? '' : '%';
  elementos.barraNivel.style.width = `${nivel ?? 0}%`;
  elementos.barraNivel.className = `barra-nivel ${claseEstado}`;
  elementos.barraFondo.setAttribute('aria-valuenow', String(nivel ?? 0));
  elementos.barraFondo.setAttribute(
    'aria-valuetext',
    nivel === null ? 'Sin datos' : `${formatearNumero(nivel)} por ciento`
  );
  elementos.distancia.textContent = typeof datos.distancia === 'number' && Number.isFinite(datos.distancia)
    ? `${formatearNumero(datos.distancia)} cm`
    : '—';

  const tapaValida = datos.tapa === 'abierta' || datos.tapa === 'cerrada';
  elementos.tapa.textContent = tapaValida
    ? datos.tapa.charAt(0).toUpperCase() + datos.tapa.slice(1)
    : '—';
  elementos.tapaPunto.classList.toggle('activo', tapaValida);
  elementos.estadoTarjeta.className = `tarjeta estado-tarjeta ${claseEstado}`;
  elementos.ultimaActualizacion.textContent = fecha.toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'America/Lima'
  });
  elementos.tiempoRelativo.textContent = describirTiempoTranscurrido(fecha);
  elementos.alertaBtn.disabled = alertaEnCurso;

  const requiereAlerta = nivel !== null && nivel >= 85;
  elementos.alertaNivel.hidden = !requiereAlerta;
  if (requiereAlerta) {
    elementos.alertaDetalle.textContent = `Ubicación: ${ubicacion}. Coordinar el recojo del tacho.`;
    elementos.alertaPorcentaje.textContent = `${formatearNumero(nivel)}%`;
  }

  actualizarConexion();
}

function mostrarMensaje(texto, esError = false) {
  window.clearTimeout(temporizadorMensaje);
  elementos.mensaje.textContent = texto;
  elementos.mensaje.classList.toggle('error', esError);
  temporizadorMensaje = window.setTimeout(() => {
    elementos.mensaje.textContent = '';
    elementos.mensaje.classList.remove('error');
  }, 6000);
}

async function leerRespuestaJson(respuesta) {
  try {
    return await respuesta.json();
  } catch {
    return {};
  }
}

async function consultarEstado(mostrarConfirmacion = false) {
  if (consultaEnCurso) return;

  consultaEnCurso = true;
  actualizarConexion();

  try {
    const respuesta = await fetch('/api/estado', { cache: 'no-store' });
    if (!respuesta.ok) throw new Error(`El servidor respondió con estado ${respuesta.status}`);

    const datos = await respuesta.json();
    servidorDisponible = true;
    mostrarEstado(datos);
    if (mostrarConfirmacion) mostrarMensaje('Datos actualizados correctamente.');
  } catch (error) {
    servidorDisponible = false;
    mostrarMensaje('No se pudo conectar con el servidor. Se conservan los últimos datos recibidos.', true);
    console.error('Error al consultar el estado:', error);
  } finally {
    consultaEnCurso = false;
    actualizarConexion();
  }
}

async function enviarAlerta() {
  alertaEnCurso = true;
  elementos.alertaBtn.disabled = true;

  try {
    const respuesta = await fetch('/api/alerta', { method: 'POST' });
    const resultado = await leerRespuestaJson(respuesta);
    if (!respuesta.ok) throw new Error(resultado.error || `El servidor respondió con estado ${respuesta.status}`);

    const nivel = typeof resultado.alerta?.nivel === 'number'
      ? ` (${formatearNumero(resultado.alerta.nivel)}%)`
      : '';
    mostrarMensaje(`Alerta registrada para ${resultado.alerta.ubicacion}${nivel}.`);
  } catch (error) {
    mostrarMensaje(error.message || 'No fue posible registrar la alerta.', true);
    console.error('Error al registrar la alerta:', error);
  } finally {
    alertaEnCurso = false;
    elementos.alertaBtn.disabled = !hayMedicion;
  }
}

async function ejecutarPrueba() {
  elementos.probarBtn.disabled = true;

  try {
    const respuesta = await fetch('/api/prueba', { method: 'POST' });
    const resultado = await leerRespuestaJson(respuesta);
    if (!respuesta.ok) throw new Error(resultado.error || `El servidor respondió con estado ${respuesta.status}`);

    servidorDisponible = true;
    mostrarEstado(resultado.medicion);
    mostrarMensaje('Simulación realizada: el tacho requiere recojo.');
  } catch (error) {
    mostrarMensaje('No fue posible ejecutar la simulación.', true);
    console.error('Error durante la prueba:', error);
  } finally {
    elementos.probarBtn.disabled = false;
    actualizarConexion();
  }
}

elementos.actualizarBtn.addEventListener('click', () => consultarEstado(true));
elementos.probarBtn.addEventListener('click', ejecutarPrueba);
elementos.alertaBtn.addEventListener('click', enviarAlerta);

mostrarSinDatos();
consultarEstado();
window.setInterval(consultarEstado, INTERVALO_CONSULTA);
window.setInterval(actualizarTiempoRelativo, 1000);
