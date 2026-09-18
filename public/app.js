const INTERVALO_CONSULTA = 3000;
const UMBRAL_DATOS_RECIENTES = 30000;
const CLASES_ESTADO = ['disponible', 'casi-lleno', 'requiere-recojo', 'sin-datos'];

const elementos = {
  heroDashboard: document.querySelector('#heroDashboard'),
  redIoT: document.querySelector('#redIoT'),
  dispositivoId: document.querySelector('#dispositivoId'),
  ubicacion: document.querySelector('#ubicacion'),
  estadoOnline: document.querySelector('#estadoOnline'),
  estado: document.querySelector('#estado'),
  estadoCapsula: document.querySelector('#estadoCapsula'),
  estadoDescripcion: document.querySelector('#estadoDescripcion'),
  nivel: document.querySelector('#nivel'),
  unidadNivel: document.querySelector('#unidadNivel'),
  tachoFigura: document.querySelector('#tachoFigura'),
  tachoCuerpo: document.querySelector('#tachoCuerpo'),
  proximidadTexto: document.querySelector('#proximidadTexto'),
  barraNivel: document.querySelector('#barraNivel'),
  barraFondo: document.querySelector('#barraFondo'),
  distancia: document.querySelector('#distancia'),
  sensorEstado: document.querySelector('#sensorEstado'),
  sensorPunto: document.querySelector('#sensorPunto'),
  tapa: document.querySelector('#tapa'),
  tapaDetalle: document.querySelector('#tapaDetalle'),
  tapaPunto: document.querySelector('#tapaPunto'),
  ultimaActualizacion: document.querySelector('#ultimaActualizacion'),
  tiempoRelativo: document.querySelector('#tiempoRelativo'),
  conexion: document.querySelector('#conexion'),
  textoConexion: document.querySelector('#textoConexion'),
  detalleConexion: document.querySelector('#detalleConexion'),
  monitoreoBtn: document.querySelector('#monitoreoBtn'),
  monitoreoIcono: document.querySelector('#monitoreoIcono'),
  monitoreoTexto: document.querySelector('#monitoreoTexto'),
  anilloConsulta: document.querySelector('#anilloConsulta'),
  proximaConsulta: document.querySelector('#proximaConsulta'),
  servidorEstado: document.querySelector('#servidorEstado'),
  servidorDetalle: document.querySelector('#servidorDetalle'),
  servidorPunto: document.querySelector('#servidorPunto'),
  railSensor: document.querySelector('#railSensor'),
  railSensorTexto: document.querySelector('#railSensorTexto'),
  railTapa: document.querySelector('#railTapa'),
  railTapaTexto: document.querySelector('#railTapaTexto'),
  railServidor: document.querySelector('#railServidor'),
  railServidorTexto: document.querySelector('#railServidorTexto'),
  alertaNivel: document.querySelector('#alertaNivel'),
  alertaDetalle: document.querySelector('#alertaDetalle'),
  alertaPorcentaje: document.querySelector('#alertaPorcentaje'),
  panelInteractivo: document.querySelector('#panelInteractivo'),
  tabsVista: document.querySelectorAll('.tab-vista'),
  vistasInteractivas: document.querySelectorAll('.vista-interactiva'),
  graficoVacio: document.querySelector('#graficoVacio'),
  areaGrafico: document.querySelector('#areaGrafico'),
  lineaGrafico: document.querySelector('#lineaGrafico'),
  puntosGrafico: document.querySelector('#puntosGrafico'),
  graficoMin: document.querySelector('#graficoMin'),
  graficoMax: document.querySelector('#graficoMax'),
  graficoLecturas: document.querySelector('#graficoLecturas'),
  graficoSecuencia: document.querySelector('#graficoSecuencia'),
  actividadLista: document.querySelector('#actividadLista'),
  actividadVacia: document.querySelector('#actividadVacia'),
  actividadContador: document.querySelector('#actividadContador'),
  diagnosticoLatencia: document.querySelector('#diagnosticoLatencia'),
  diagnosticoHttp: document.querySelector('#diagnosticoHttp'),
  diagnosticoMonitoreo: document.querySelector('#diagnosticoMonitoreo'),
  diagnosticoProxima: document.querySelector('#diagnosticoProxima'),
  diagnosticoMedicion: document.querySelector('#diagnosticoMedicion'),
  diagnosticoCampos: document.querySelector('#diagnosticoCampos'),
  centroAlertas: document.querySelector('#centroAlertas'),
  tituloAcciones: document.querySelector('#tituloAcciones'),
  alertaOperativaChip: document.querySelector('#alertaOperativaChip'),
  alertaOperativaEstado: document.querySelector('#alertaOperativaEstado'),
  alertaOperativaDatos: document.querySelector('#alertaOperativaDatos'),
  alertaOperativaId: document.querySelector('#alertaOperativaId'),
  alertaOperativaUbicacion: document.querySelector('#alertaOperativaUbicacion'),
  alertaOperativaNivel: document.querySelector('#alertaOperativaNivel'),
  canalAlerta: document.querySelector('#canalAlerta')
};

let fechaUltimaMedicion = null;
let hayMedicion = false;
let hayLecturaInterior = false;
let servidorDisponible = false;
let consultaEnCurso = false;
let nivelMostrado = null;
let animacionNivel = null;
let temporizadorPulso = null;
let temporizadorConsulta = null;
let proximaConsultaEn = null;
let monitoreoPausado = false;
let ultimaLatencia = null;
let ultimoEstadoHttp = 'Pendiente';
let ultimaMedicionRegistrada = null;
let ultimaLecturaInvalidaRegistrada = null;
let datosAnteriores = null;
let escaneoEnCurso = false;
let conexionInterrumpida = false;
let datosObsoletosDetectados = false;
const historialMediciones = [];
const eventosSesion = [];

function claseSegunEstado(estado) {
  const clases = {
    'Disponible': 'disponible',
    'Casi lleno': 'casi-lleno',
    'Requiere recojo': 'requiere-recojo'
  };

  return clases[estado] || 'sin-datos';
}

function estadoSegunNivel(nivel) {
  if (Number.isFinite(nivel)) {
    if (nivel >= 85) return 'Requiere recojo';
    if (nivel >= 70) return 'Casi lleno';
    return 'Disponible';
  }
  return 'Sin datos';
}

function descripcionSegunEstado(estado) {
  const descripciones = {
    'Disponible': 'Sin proximidad crítica detectada por el sensor lateral',
    'Casi lleno': 'Atención próxima: residuos cerca de la zona crítica',
    'Requiere recojo': 'Zona crítica alcanzada · coordinar el recojo'
  };
  return descripciones[estado] || 'Esperando datos del sensor';
}

function distanciaInteriorValida(distancia) {
  return typeof distancia === 'number' && Number.isFinite(distancia) && distancia > 0;
}

function proximidadSegunEstado(estado) {
  const mensajes = {
    'Disponible': 'Zona crítica libre',
    'Casi lleno': 'Residuos próximos a zona crítica',
    'Requiere recojo': 'Zona crítica alcanzada'
  };
  return mensajes[estado] || 'Esperando datos del sensor';
}

function formatearNumero(valor) {
  return valor.toLocaleString('es-PE', { maximumFractionDigits: 1 });
}

function iniciarRedIoT() {
  const canvas = elementos.redIoT;
  const contexto = canvas.getContext('2d');
  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const puntero = { x: 0, y: 0, activo: false };
  let ancho = 0;
  let alto = 0;
  let nodos = [];
  let ultimoFotograma = 0;

  function colorAcento() {
    if (elementos.heroDashboard.classList.contains('requiere-recojo')) return [255, 92, 98];
    if (elementos.heroDashboard.classList.contains('casi-lleno')) return [242, 184, 75];
    return [46, 230, 157];
  }

  function ajustarCanvas() {
    const limites = canvas.getBoundingClientRect();
    const escala = Math.min(window.devicePixelRatio || 1, 1.5);
    ancho = Math.max(1, limites.width);
    alto = Math.max(1, limites.height);
    canvas.width = Math.round(ancho * escala);
    canvas.height = Math.round(alto * escala);
    contexto.setTransform(escala, 0, 0, escala, 0, 0);
    nodos = Array.from({ length: ancho < 600 ? 18 : 30 }, (_, indice) => ({
      x: Math.random() * ancho,
      y: Math.random() * alto,
      radio: 1 + Math.random() * 1.5,
      fase: Math.random() * Math.PI * 2,
      velocidad: .00018 + Math.random() * .00022,
      direccion: indice % 2 ? 1 : -1
    }));
    dibujarRed(performance.now(), true);
  }

  function dibujarRed(ahora, fotogramaUnico = false) {
    if (!fotogramaUnico && ahora - ultimoFotograma < 32) {
      window.requestAnimationFrame(dibujarRed);
      return;
    }
    ultimoFotograma = ahora;
    contexto.clearRect(0, 0, ancho, alto);
    const [rojo, verde, azul] = colorAcento();
    const posiciones = nodos.map((nodo) => ({
      x: nodo.x + Math.sin(ahora * nodo.velocidad + nodo.fase) * 12 * nodo.direccion,
      y: nodo.y + Math.cos(ahora * nodo.velocidad * .8 + nodo.fase) * 9,
      radio: nodo.radio
    }));

    for (let i = 0; i < posiciones.length; i += 1) {
      for (let j = i + 1; j < posiciones.length; j += 1) {
        const distanciaX = posiciones[i].x - posiciones[j].x;
        const distanciaY = posiciones[i].y - posiciones[j].y;
        const distancia = Math.hypot(distanciaX, distanciaY);
        if (distancia > 145) continue;
        contexto.beginPath();
        contexto.moveTo(posiciones[i].x, posiciones[i].y);
        contexto.lineTo(posiciones[j].x, posiciones[j].y);
        contexto.strokeStyle = `rgba(${rojo}, ${verde}, ${azul}, ${(1 - distancia / 145) * .13})`;
        contexto.lineWidth = .7;
        contexto.stroke();
      }
    }

    posiciones.forEach((nodo) => {
      contexto.beginPath();
      contexto.arc(nodo.x, nodo.y, nodo.radio, 0, Math.PI * 2);
      contexto.fillStyle = `rgba(${rojo}, ${verde}, ${azul}, .42)`;
      contexto.fill();
    });

    if (puntero.activo) {
      posiciones.forEach((nodo) => {
        const distancia = Math.hypot(nodo.x - puntero.x, nodo.y - puntero.y);
        if (distancia > 175) return;
        contexto.beginPath();
        contexto.moveTo(nodo.x, nodo.y);
        contexto.lineTo(puntero.x, puntero.y);
        contexto.strokeStyle = `rgba(${rojo}, ${verde}, ${azul}, ${(1 - distancia / 175) * .32})`;
        contexto.lineWidth = 1;
        contexto.stroke();
      });
      contexto.beginPath();
      contexto.arc(puntero.x, puntero.y, 3, 0, Math.PI * 2);
      contexto.fillStyle = `rgba(${rojo}, ${verde}, ${azul}, .8)`;
      contexto.fill();
    }

    if (!movimientoReducido && !fotogramaUnico) window.requestAnimationFrame(dibujarRed);
  }

  elementos.heroDashboard.addEventListener('pointermove', (evento) => {
    if (evento.pointerType !== 'mouse') return;
    const limites = elementos.heroDashboard.getBoundingClientRect();
    puntero.x = evento.clientX - limites.left;
    puntero.y = evento.clientY - limites.top;
    puntero.activo = true;
  });
  elementos.heroDashboard.addEventListener('pointerleave', () => {
    puntero.activo = false;
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(ajustarCanvas).observe(elementos.heroDashboard);
  } else {
    window.addEventListener('resize', ajustarCanvas);
  }
  ajustarCanvas();
  if (!movimientoReducido) window.requestAnimationFrame(dibujarRed);
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

  return `Recibido hace ${Math.floor(horas / 24)} d`;
}

function actualizarGrafico() {
  const niveles = historialMediciones.map((medicion) => medicion.nivel);
  elementos.graficoLecturas.textContent = String(niveles.length);
  elementos.graficoVacio.hidden = niveles.length > 0;

  if (niveles.length === 0) {
    elementos.graficoMin.textContent = '—';
    elementos.graficoMax.textContent = '—';
    elementos.graficoSecuencia.textContent = 'Esperando datos del sensor.';
    elementos.lineaGrafico.setAttribute('points', '');
    elementos.areaGrafico.setAttribute('d', '');
    elementos.puntosGrafico.replaceChildren();
    return;
  }

  elementos.graficoMin.textContent = `${formatearNumero(Math.min(...niveles))}%`;
  elementos.graficoMax.textContent = `${formatearNumero(Math.max(...niveles))}%`;
  elementos.graficoSecuencia.textContent = `Estimaciones: ${niveles
    .map((nivel) => `${formatearNumero(nivel)}%`)
    .join(' → ')}`;

  const anchoInicio = 36;
  const anchoFinal = 580;
  const base = 190;
  const altoUtil = 160;
  const puntos = historialMediciones.map((medicion, indice) => {
    const x = niveles.length === 1
      ? (anchoInicio + anchoFinal) / 2
      : anchoInicio + (indice / (niveles.length - 1)) * (anchoFinal - anchoInicio);
    const y = base - (medicion.nivel / 100) * altoUtil;
    return { ...medicion, x, y };
  });

  const coordenadas = puntos.map((punto) => `${punto.x.toFixed(1)},${punto.y.toFixed(1)}`).join(' ');
  elementos.lineaGrafico.setAttribute('points', coordenadas);
  elementos.areaGrafico.setAttribute(
    'd',
    `M ${puntos[0].x.toFixed(1)} ${base} L ${coordenadas.replaceAll(',', ' ')} L ${puntos.at(-1).x.toFixed(1)} ${base} Z`
  );

  const fragmento = document.createDocumentFragment();
  puntos.forEach((punto) => {
    const circulo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const titulo = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    circulo.setAttribute('cx', punto.x.toFixed(1));
    circulo.setAttribute('cy', punto.y.toFixed(1));
    circulo.setAttribute('r', '5');
    titulo.textContent = `${formatearNumero(punto.nivel)}% estimado · ${punto.fecha.toLocaleTimeString('es-PE')}`;
    circulo.appendChild(titulo);
    fragmento.appendChild(circulo);
  });
  elementos.puntosGrafico.replaceChildren(fragmento);
  elementos.lineaGrafico.classList.remove('actualizada');
  void elementos.lineaGrafico.getBoundingClientRect();
  elementos.lineaGrafico.classList.add('actualizada');
}

function registrarEvento(titulo, detalle, tipo = '') {
  const evento = { titulo, detalle, tipo, fecha: new Date() };
  eventosSesion.push(evento);
  elementos.actividadVacia?.remove();

  const item = document.createElement('li');
  if (tipo) item.classList.add(`evento-${tipo}`);
  const contenido = document.createElement('div');
  const tituloElemento = document.createElement('strong');
  const detalleElemento = document.createElement('span');
  const horaElemento = document.createElement('time');
  tituloElemento.textContent = titulo;
  detalleElemento.textContent = detalle;
  horaElemento.dateTime = evento.fecha.toISOString();
  horaElemento.textContent = evento.fecha.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  contenido.append(tituloElemento, detalleElemento, horaElemento);
  item.appendChild(contenido);
  elementos.actividadLista.prepend(item);

  while (elementos.actividadLista.children.length > 10) {
    elementos.actividadLista.lastElementChild.remove();
  }
  elementos.actividadContador.textContent = String(eventosSesion.length);
}

function registrarMedicionSesion(datos, nivel, fecha, estadoActual) {
  if (nivel === null || fecha.toISOString() === ultimaMedicionRegistrada) return;

  ultimaMedicionRegistrada = fecha.toISOString();
  historialMediciones.push({ nivel, fecha });
  if (historialMediciones.length > 18) historialMediciones.shift();
  actualizarGrafico();

  registrarEvento(
    'Nueva medición recibida',
    `${formatearNumero(nivel)}% estimado · ${formatearNumero(datos.distancia)} cm desde el sensor lateral`
  );

  if (datosAnteriores?.estado && datosAnteriores.estado !== estadoActual) {
    registrarEvento(
      `Estado: ${estadoActual}`,
      `Cambió desde ${datosAnteriores.estado}`,
      estadoActual === 'Requiere recojo' ? 'alerta' : 'sistema'
    );
  }

  if (datosAnteriores?.tapa && datosAnteriores.tapa !== datos.tapa) {
    registrarEvento(
      `Tapa ${datos.tapa}`,
      'Cambio detectado por el dispositivo',
      datos.tapa === 'abierta' ? 'sistema' : ''
    );
  }

  if (datosAnteriores && datosAnteriores.nivel < 70 && nivel >= 70) {
    registrarEvento('Tacho alcanzó 70%', `${formatearNumero(nivel)}% estimado · atención próxima`, 'sistema');
  }

  if (nivel >= 85 && (!datosAnteriores || datosAnteriores.nivel < 85)) {
    registrarEvento('Tacho requiere recojo', `${formatearNumero(nivel)}% estimado · zona crítica alcanzada`, 'alerta');
  }

  if (datosAnteriores && Math.abs(nivel - datosAnteriores.nivel) >= 15) {
    registrarEvento(
      'Cambio importante de nivel',
      `${formatearNumero(datosAnteriores.nivel)}% → ${formatearNumero(nivel)}% estimado`,
      'sistema'
    );
  }

  datosAnteriores = { nivel, estado: estadoActual, tapa: datos.tapa };
}

function actualizarDiagnostico() {
  elementos.diagnosticoLatencia.textContent = Number.isFinite(ultimaLatencia)
    ? `${ultimaLatencia} ms`
    : '—';
  elementos.diagnosticoHttp.textContent = ultimoEstadoHttp;
  elementos.diagnosticoMonitoreo.textContent = monitoreoPausado ? 'Pausada' : 'Automática';
  elementos.diagnosticoMedicion.textContent = hayLecturaInterior ? 'Recibida' : 'No disponible';
  elementos.diagnosticoCampos.textContent = hayLecturaInterior
    ? 'Lectura lateral y estimación disponibles'
    : (hayMedicion ? 'Lectura interior no disponible' : 'Esperando datos del sensor');
}

function cambiarVista(nombreVista) {
  elementos.tabsVista.forEach((tab) => {
    const activa = tab.dataset.vista === nombreVista;
    tab.classList.toggle('activo', activa);
    tab.setAttribute('aria-selected', String(activa));
  });

  elementos.vistasInteractivas.forEach((vista) => {
    const activa = vista.id === `vista${nombreVista.charAt(0).toUpperCase() + nombreVista.slice(1)}`;
    vista.classList.toggle('activo', activa);
    vista.hidden = !activa;
  });
}

function actualizarCuentaRegresiva() {
  actualizarDiagnostico();

  if (monitoreoPausado) {
    elementos.proximaConsulta.textContent = 'Pulsa para reanudar';
    elementos.diagnosticoProxima.textContent = 'Sin consultas automáticas';
    elementos.anilloConsulta.style.setProperty('--progreso', '0deg');
    return;
  }

  if (!proximaConsultaEn) {
    elementos.proximaConsulta.textContent = 'Sincronizando ahora...';
    elementos.diagnosticoProxima.textContent = 'Consulta en curso';
    elementos.anilloConsulta.style.setProperty('--progreso', '360deg');
    return;
  }

  const restante = Math.max(0, proximaConsultaEn - Date.now());
  const segundos = Math.max(1, Math.ceil(restante / 1000));
  const progreso = Math.min(360, Math.max(0, (1 - restante / INTERVALO_CONSULTA) * 360));
  elementos.proximaConsulta.textContent = `Próxima lectura en ${segundos} s`;
  elementos.diagnosticoProxima.textContent = `Siguiente consulta en ${segundos} s`;
  elementos.anilloConsulta.style.setProperty('--progreso', `${progreso}deg`);
}

function programarProximaConsulta() {
  window.clearTimeout(temporizadorConsulta);
  if (monitoreoPausado) {
    proximaConsultaEn = null;
    actualizarCuentaRegresiva();
    return;
  }

  proximaConsultaEn = Date.now() + INTERVALO_CONSULTA;
  temporizadorConsulta = window.setTimeout(async () => {
    proximaConsultaEn = null;
    await consultarEstado();
    programarProximaConsulta();
  }, INTERVALO_CONSULTA);
  actualizarCuentaRegresiva();
}

async function alternarMonitoreo() {
  monitoreoPausado = !monitoreoPausado;
  elementos.monitoreoBtn.setAttribute('aria-pressed', String(monitoreoPausado));
  elementos.monitoreoIcono.setAttribute('href', monitoreoPausado ? '#icon-play' : '#icon-pausa');
  elementos.monitoreoTexto.textContent = monitoreoPausado ? 'Monitoreo pausado' : 'Monitoreo automático';

  if (monitoreoPausado) {
    window.clearTimeout(temporizadorConsulta);
    proximaConsultaEn = null;
    registrarEvento('Monitoreo pausado', 'Las consultas automáticas fueron detenidas', 'sistema');
    actualizarCuentaRegresiva();
    return;
  }

  registrarEvento('Monitoreo reanudado', 'Consultas automáticas cada 3 segundos', 'sistema');
  await consultarEstado();
  programarProximaConsulta();
}

async function explorarTelemetria() {
  if (escaneoEnCurso) return;
  escaneoEnCurso = true;
  elementos.tachoFigura.setAttribute('aria-busy', 'true');
  elementos.heroDashboard.classList.add('escaneando');
  elementos.tachoFigura.classList.remove('explorando');
  void elementos.tachoFigura.offsetWidth;
  elementos.tachoFigura.classList.add('explorando');
  await Promise.all([
    consultarEstado(),
    new Promise((resolver) => window.setTimeout(resolver, 950))
  ]);
  elementos.heroDashboard.classList.remove('escaneando');
  elementos.tachoFigura.removeAttribute('aria-busy');
  escaneoEnCurso = false;
  cambiarVista('historial');
  elementos.panelInteractivo.classList.remove('enfocado');
  void elementos.panelInteractivo.offsetWidth;
  elementos.panelInteractivo.classList.add('enfocado');
  elementos.panelInteractivo.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  });
}

function cambiarEstadoElemento(elemento, clase) {
  elemento.classList.remove('activo', 'alerta', 'advertencia');
  if (clase) elemento.classList.add(clase);
}

function aplicarEstadoVisual(claseEstado) {
  elementos.heroDashboard.classList.remove(...CLASES_ESTADO);
  elementos.heroDashboard.classList.add(claseEstado);
  elementos.estadoCapsula.classList.remove(...CLASES_ESTADO);
  elementos.estadoCapsula.classList.add(claseEstado);
}

function actualizarConexion() {
  elementos.conexion.classList.remove('en-linea', 'sin-datos', 'consultando', 'desconectado');
  elementos.heroDashboard.classList.remove('datos-recientes');
  elementos.servidorPunto.classList.remove('activo', 'alerta');

  if (consultaEnCurso) {
    elementos.conexion.classList.add('consultando');
    elementos.textoConexion.textContent = 'Actualizando telemetría';
    elementos.detalleConexion.textContent = 'Consultando el servidor...';
    elementos.servidorEstado.textContent = 'Sincronizando';
    elementos.railServidorTexto.textContent = 'Sincronizando';
    cambiarEstadoElemento(elementos.railServidor, 'advertencia');
    return;
  }

  if (!servidorDisponible) {
    elementos.conexion.classList.add('desconectado');
    elementos.textoConexion.textContent = 'Sin conexión';
    elementos.detalleConexion.textContent = 'No se pudo consultar el servidor';
    elementos.servidorEstado.textContent = 'Sin conexión';
    elementos.servidorDetalle.textContent = 'Servidor no disponible';
    elementos.servidorPunto.classList.add('alerta');
    elementos.railServidorTexto.textContent = 'Sin conexión';
    elementos.estadoOnline.textContent = 'SIN CONEXIÓN';
    cambiarEstadoElemento(elementos.railServidor, 'alerta');
    return;
  }

  elementos.servidorPunto.classList.add('activo');
  elementos.servidorEstado.textContent = 'Servidor online';
  elementos.servidorDetalle.textContent = '/api/estado · cada 3 s';
  elementos.railServidorTexto.textContent = 'Online';
  cambiarEstadoElemento(elementos.railServidor, 'activo');

  if (!hayMedicion) {
    elementos.conexion.classList.add('sin-datos');
    elementos.textoConexion.textContent = 'Esperando datos';
    elementos.detalleConexion.textContent = 'Servidor disponible · sin mediciones';
    elementos.estadoOnline.textContent = 'ESPERANDO DATOS';
    datosObsoletosDetectados = false;
    return;
  }

  const datosRecientes = Date.now() - fechaUltimaMedicion.getTime() < UMBRAL_DATOS_RECIENTES;
  elementos.conexion.classList.add(datosRecientes ? 'en-linea' : 'sin-datos');
  elementos.textoConexion.textContent = datosRecientes ? 'ESP32 conectado' : 'Sin datos recientes';
  elementos.detalleConexion.textContent = datosRecientes
    ? 'Sistema IoT conectado'
    : describirTiempoTranscurrido(fechaUltimaMedicion);
  elementos.estadoOnline.textContent = datosRecientes ? 'SISTEMA IoT CONECTADO' : 'SIN DATOS RECIENTES';
  elementos.heroDashboard.classList.toggle('datos-recientes', datosRecientes);

  if (!datosRecientes) {
    if (!datosObsoletosDetectados) {
      datosObsoletosDetectados = true;
      registrarEvento(
        'Sin datos recientes',
        `Última lectura: ${describirTiempoTranscurrido(fechaUltimaMedicion).toLowerCase()}`,
        'sistema'
      );
    }
    return;
  }

  if (datosObsoletosDetectados) {
    registrarEvento('Comunicación restablecida', 'El ESP32 volvió a enviar datos recientes', 'sistema');
    datosObsoletosDetectados = false;
  }
}

function actualizarTiempoRelativo() {
  elementos.tiempoRelativo.textContent = describirTiempoTranscurrido(fechaUltimaMedicion);
  actualizarConexion();
}

function escribirNivel(valor) {
  elementos.nivel.textContent = formatearNumero(valor);
}

function animarValorNivel(nuevoNivel) {
  window.cancelAnimationFrame(animacionNivel);

  if (nuevoNivel === null) {
    nivelMostrado = null;
    elementos.nivel.textContent = '—';
    elementos.unidadNivel.textContent = '';
    return;
  }

  elementos.unidadNivel.textContent = '%';
  if (!Number.isFinite(nivelMostrado)) {
    nivelMostrado = nuevoNivel;
    escribirNivel(nuevoNivel);
    return;
  }
  const inicio = Number.isFinite(nivelMostrado) ? nivelMostrado : 0;
  const diferencia = nuevoNivel - inicio;

  if (Math.abs(diferencia) < .05 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    escribirNivel(nuevoNivel);
    nivelMostrado = nuevoNivel;
    return;
  }

  const duracion = 760;
  let tiempoInicial = null;

  function avanzar(ahora) {
    if (tiempoInicial === null) tiempoInicial = ahora;
    const progreso = Math.max(0, Math.min(1, (ahora - tiempoInicial) / duracion));
    const suavizado = 1 - Math.pow(1 - progreso, 3);
    escribirNivel(inicio + diferencia * suavizado);

    if (progreso < 1) {
      animacionNivel = window.requestAnimationFrame(avanzar);
    } else {
      nivelMostrado = nuevoNivel;
      escribirNivel(nuevoNivel);
    }
  }

  animacionNivel = window.requestAnimationFrame(avanzar);
}

function confirmarActualizacionVisual() {
  window.clearTimeout(temporizadorPulso);
  elementos.heroDashboard.classList.remove('datos-actualizados');
  void elementos.heroDashboard.offsetWidth;
  elementos.heroDashboard.classList.add('datos-actualizados');
  temporizadorPulso = window.setTimeout(() => {
    elementos.heroDashboard.classList.remove('datos-actualizados');
  }, 1000);
}

function actualizarAlertaOperativa({ id = 'TACHO-01', ubicacion = 'Entrada principal', nivel = null } = {}) {
  const lecturaValida = hayLecturaInterior && Number.isFinite(nivel);
  const requiereRecojo = lecturaValida && nivel >= 85;
  const atencionProxima = lecturaValida && nivel >= 70 && nivel < 85;

  elementos.centroAlertas.classList.toggle('alerta-activa', requiereRecojo);
  elementos.centroAlertas.classList.toggle('atencion-proxima', atencionProxima);
  elementos.centroAlertas.classList.toggle('sin-alerta', lecturaValida && !requiereRecojo && !atencionProxima);
  elementos.centroAlertas.classList.toggle('sin-datos', !lecturaValida);
  elementos.alertaOperativaDatos.hidden = !requiereRecojo;
  elementos.tituloAcciones.textContent = 'Alerta operativa';

  if (!lecturaValida) {
    elementos.alertaOperativaChip.textContent = 'ESPERANDO DATOS';
    elementos.alertaOperativaEstado.textContent = 'Esperando una medición válida del sensor interior.';
    elementos.canalAlerta.hidden = true;
    return;
  }

  if (requiereRecojo) {
    elementos.alertaOperativaChip.textContent = 'REQUIERE RECOJO';
    elementos.alertaOperativaEstado.textContent = 'Zona crítica alcanzada.';
    elementos.canalAlerta.textContent = 'Notificación enviada al personal por WhatsApp.';
    elementos.canalAlerta.hidden = false;
    elementos.alertaOperativaId.textContent = id.toUpperCase();
    elementos.alertaOperativaUbicacion.textContent = ubicacion;
    elementos.alertaOperativaNivel.textContent = `${formatearNumero(nivel)}%`;
    return;
  }

  if (atencionProxima) {
    elementos.alertaOperativaChip.textContent = 'ATENCIÓN PRÓXIMA';
    elementos.alertaOperativaEstado.textContent = 'Los residuos se aproximan a la zona crítica.';
    elementos.canalAlerta.hidden = true;
    return;
  }

  elementos.alertaOperativaChip.textContent = 'SIN ALERTA ACTIVA';
  elementos.alertaOperativaEstado.textContent = 'El contenedor se encuentra disponible.';
  elementos.canalAlerta.textContent = 'Notificación automática por WhatsApp habilitada.';
  elementos.canalAlerta.hidden = false;
}

function mostrarSinDatos() {
  hayMedicion = false;
  hayLecturaInterior = false;
  fechaUltimaMedicion = null;
  nivelMostrado = null;
  elementos.dispositivoId.textContent = '—';
  elementos.ubicacion.textContent = '—';
  elementos.estado.textContent = 'Esperando datos';
  elementos.estadoDescripcion.textContent = 'Esperando datos del sensor';
  elementos.proximidadTexto.textContent = 'Esperando datos del sensor';
  animarValorNivel(null);
  elementos.barraNivel.style.width = '0%';
  elementos.barraNivel.className = 'barra-nivel';
  elementos.tachoCuerpo.removeAttribute('aria-valuenow');
  elementos.tachoCuerpo.setAttribute('aria-valuetext', 'Esperando datos del sensor');
  elementos.barraFondo.removeAttribute('aria-valuenow');
  elementos.barraFondo.setAttribute('aria-valuetext', 'Esperando datos del sensor');
  elementos.distancia.textContent = '—';
  elementos.distancia.classList.remove('sin-lectura');
  elementos.sensorEstado.textContent = 'Sensor lateral AJ-SR04M · en espera';
  elementos.sensorPunto.classList.remove('activo');
  elementos.tapa.textContent = '—';
  elementos.tapaDetalle.textContent = 'Sin lectura disponible';
  elementos.tapaPunto.classList.remove('activo', 'alerta');
  elementos.tachoFigura.classList.remove('tapa-abierta');
  elementos.ultimaActualizacion.textContent = '—';
  elementos.tiempoRelativo.textContent = 'Sin datos recibidos';
  elementos.alertaNivel.hidden = true;
  elementos.railSensorTexto.textContent = 'En espera';
  elementos.railTapaTexto.textContent = 'Sin datos';
  cambiarEstadoElemento(elementos.railSensor, '');
  cambiarEstadoElemento(elementos.railTapa, '');
  aplicarEstadoVisual('sin-datos');
  actualizarAlertaOperativa();
  actualizarDiagnostico();
}

function mostrarEstado(datos) {
  const fecha = datos.ultimaActualizacion ? new Date(datos.ultimaActualizacion) : null;
  const fechaValida = fecha && !Number.isNaN(fecha.getTime());

  if (!fechaValida) {
    mostrarSinDatos();
    actualizarConexion();
    return;
  }

  const lecturaValida = distanciaInteriorValida(datos.distancia);
  const nivelRecibido = lecturaValida && typeof datos.nivel === 'number' && Number.isFinite(datos.nivel)
    && datos.nivel >= 0 && datos.nivel <= 100
    ? datos.nivel
    : null;
  const nivel = nivelRecibido;
  const estadoActual = estadoSegunNivel(nivel);
  const claseEstado = claseSegunEstado(estadoActual);
  const ubicacion = typeof datos.ubicacion === 'string' && datos.ubicacion.trim()
    ? datos.ubicacion.trim()
    : 'Sin ubicación';
  const identificador = typeof datos.id === 'string' && datos.id.trim()
    ? datos.id.trim()
    : 'Sin identificar';
  const tapaValida = datos.tapa === 'abierta' || datos.tapa === 'cerrada';
  const tapaAbierta = datos.tapa === 'abierta';

  hayMedicion = true;
  hayLecturaInterior = nivel !== null;
  fechaUltimaMedicion = fecha;
  elementos.dispositivoId.textContent = identificador.toUpperCase();
  elementos.ubicacion.textContent = ubicacion;
  elementos.estado.textContent = hayLecturaInterior ? estadoActual.toUpperCase() : 'SIN LECTURA INTERIOR';
  elementos.estadoDescripcion.textContent = hayLecturaInterior
    ? descripcionSegunEstado(estadoActual)
    : 'Lectura interior no disponible · estimación suspendida';
  elementos.proximidadTexto.textContent = hayLecturaInterior
    ? proximidadSegunEstado(estadoActual)
    : 'Lectura interior no disponible';
  aplicarEstadoVisual(claseEstado);
  animarValorNivel(nivel);

  elementos.barraNivel.style.width = `${nivel ?? 0}%`;
  elementos.barraNivel.className = `barra-nivel ${claseEstado}`;
  if (hayLecturaInterior) {
    elementos.tachoCuerpo.setAttribute('aria-valuenow', String(nivel));
    elementos.barraFondo.setAttribute('aria-valuenow', String(nivel));
  } else {
    elementos.tachoCuerpo.removeAttribute('aria-valuenow');
    elementos.barraFondo.removeAttribute('aria-valuenow');
  }
  elementos.tachoCuerpo.setAttribute(
    'aria-valuetext',
    nivel === null ? 'Lectura interior no disponible' : `${formatearNumero(nivel)} por ciento estimado; ${estadoActual}`
  );
  elementos.barraFondo.setAttribute(
    'aria-valuetext',
    nivel === null ? 'Lectura interior no disponible' : `${formatearNumero(nivel)} por ciento estimado; ${estadoActual}`
  );

  elementos.distancia.textContent = lecturaValida
    ? `${datos.distancia.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} cm`
    : 'Lectura interior no disponible';
  elementos.distancia.classList.toggle('sin-lectura', !lecturaValida);
  elementos.sensorEstado.textContent = lecturaValida
    ? 'Sensor lateral AJ-SR04M'
    : 'Sensor lateral AJ-SR04M · sin lectura';
  elementos.sensorPunto.classList.toggle('activo', lecturaValida);
  elementos.railSensorTexto.textContent = lecturaValida ? 'Activo' : 'Sin lectura';
  cambiarEstadoElemento(elementos.railSensor, lecturaValida ? 'activo' : 'advertencia');

  elementos.tapa.textContent = tapaValida
    ? datos.tapa.charAt(0).toUpperCase() + datos.tapa.slice(1)
    : '—';
  elementos.tapaDetalle.textContent = tapaValida
    ? (tapaAbierta ? 'Apertura detectada' : 'Cierre confirmado')
    : 'Sin lectura disponible';
  elementos.tapaPunto.classList.toggle('activo', tapaValida && !tapaAbierta);
  elementos.tapaPunto.classList.toggle('alerta', tapaAbierta);
  elementos.tachoFigura.classList.toggle('tapa-abierta', tapaAbierta);
  elementos.railTapaTexto.textContent = tapaValida
    ? (tapaAbierta ? 'Abierta' : 'Cerrada')
    : 'Sin datos';
  cambiarEstadoElemento(elementos.railTapa, tapaValida ? (tapaAbierta ? 'advertencia' : 'activo') : '');

  elementos.ultimaActualizacion.textContent = fecha.toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'America/Lima'
  });
  elementos.tiempoRelativo.textContent = describirTiempoTranscurrido(fecha);
  if (!hayLecturaInterior && fecha.toISOString() !== ultimaLecturaInvalidaRegistrada) {
    ultimaLecturaInvalidaRegistrada = fecha.toISOString();
    registrarEvento('Lectura interior no disponible', 'No se muestra una estimación sin distancia lateral válida', 'sistema');
  }
  registrarMedicionSesion(datos, nivel, fecha, estadoActual);

  const requiereAlerta = nivel !== null && nivel >= 85;
  elementos.alertaNivel.hidden = !requiereAlerta;
  if (requiereAlerta) {
    elementos.alertaDetalle.textContent = `Residuos detectados en la zona crítica · ${identificador.toUpperCase()} · ${ubicacion}.`;
    elementos.alertaPorcentaje.textContent = `${formatearNumero(nivel)}% est.`;
  }
  actualizarAlertaOperativa({
    id: identificador,
    ubicacion,
    nivel
  });

  confirmarActualizacionVisual();
  actualizarConexion();
}

async function consultarEstado() {
  if (consultaEnCurso) return;

  consultaEnCurso = true;
  const inicioConsulta = performance.now();
  actualizarConexion();

  try {
    const respuesta = await fetch('/api/estado', { cache: 'no-store' });
    if (!respuesta.ok) throw new Error(`El servidor respondió con estado ${respuesta.status}`);

    const datos = await respuesta.json();
    ultimaLatencia = Math.round(performance.now() - inicioConsulta);
    ultimoEstadoHttp = `HTTP ${respuesta.status}`;
    servidorDisponible = true;
    if (conexionInterrumpida) {
      registrarEvento('Comunicación restablecida', 'El dashboard volvió a comunicarse con el servidor', 'sistema');
      conexionInterrumpida = false;
    }
    mostrarEstado(datos);
  } catch (error) {
    ultimaLatencia = Math.round(performance.now() - inicioConsulta);
    ultimoEstadoHttp = 'Error de conexión';
    servidorDisponible = false;
    conexionInterrumpida = true;
    console.error('Error al consultar el estado:', error);
  } finally {
    consultaEnCurso = false;
    actualizarConexion();
    actualizarDiagnostico();
  }
}

elementos.monitoreoBtn.addEventListener('click', alternarMonitoreo);
elementos.tabsVista.forEach((tab) => {
  tab.addEventListener('click', () => cambiarVista(tab.dataset.vista));
});
elementos.tachoFigura.addEventListener('click', explorarTelemetria);
elementos.tachoFigura.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter' || evento.key === ' ') {
    evento.preventDefault();
    explorarTelemetria();
  }
});
elementos.tachoFigura.addEventListener('pointermove', (evento) => {
  if (evento.pointerType !== 'mouse') return;
  const limites = elementos.tachoFigura.getBoundingClientRect();
  const proporcionX = (evento.clientX - limites.left) / limites.width - .5;
  const proporcionY = (evento.clientY - limites.top) / limites.height - .5;
  elementos.tachoFigura.style.setProperty('--rotar-y', `${proporcionX * 12}deg`);
  elementos.tachoFigura.style.setProperty('--rotar-x', `${proporcionY * -8}deg`);
});
elementos.tachoFigura.addEventListener('pointerleave', () => {
  elementos.tachoFigura.style.setProperty('--rotar-x', '0deg');
  elementos.tachoFigura.style.setProperty('--rotar-y', '0deg');
});
elementos.tachoFigura.addEventListener('animationend', () => {
  elementos.tachoFigura.classList.remove('explorando');
});

mostrarSinDatos();
actualizarGrafico();
actualizarCuentaRegresiva();
iniciarRedIoT();
window.requestAnimationFrame(() => document.body.classList.add('interfaz-lista'));
consultarEstado().finally(programarProximaConsulta);
window.setInterval(actualizarTiempoRelativo, 1000);
window.setInterval(actualizarCuentaRegresiva, 250);
