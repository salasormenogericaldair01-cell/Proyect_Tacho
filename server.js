const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// La medición se conserva en memoria mientras el proceso del servidor esté activo.
let ultimaMedicion = null;

const estadoInicial = {
  id: 'tacho-01',
  ubicacion: 'Sin ubicación',
  distancia: null,
  nivel: 0,
  tapa: 'cerrada',
  estado: 'Sin datos',
  ultimaActualizacion: null
};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Calcula el mensaje que verá el operador según el porcentaje de llenado.
function calcularEstado(nivel) {
  if (nivel >= 85) return 'Requiere recojo';
  if (nivel >= 70) return 'Casi lleno';
  return 'Disponible';
}

// Devuelve un mensaje claro para el primer campo que no cumpla el formato.
function validarMedicion(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return 'El cuerpo de la solicitud debe ser un objeto JSON.';
  }
  if (typeof datos.id !== 'string' || datos.id.trim() === '') {
    return 'El campo "id" es obligatorio y debe ser un texto válido.';
  }
  if (typeof datos.ubicacion !== 'string' || datos.ubicacion.trim() === '') {
    return 'El campo "ubicacion" es obligatorio y debe ser un texto válido.';
  }
  if (typeof datos.distancia !== 'number' || !Number.isFinite(datos.distancia)) {
    return 'El campo "distancia" debe ser un número válido.';
  }
  if (typeof datos.nivel !== 'number' || !Number.isFinite(datos.nivel) || datos.nivel < 0 || datos.nivel > 100) {
    return 'El campo "nivel" debe ser un número entre 0 y 100.';
  }
  if (datos.tapa !== 'abierta' && datos.tapa !== 'cerrada') {
    return 'El campo "tapa" solo puede ser "abierta" o "cerrada".';
  }
  return null;
}

function guardarMedicion(datos) {
  ultimaMedicion = {
    id: datos.id.trim(),
    ubicacion: datos.ubicacion.trim(),
    distancia: datos.distancia,
    nivel: datos.nivel,
    tapa: datos.tapa,
    estado: calcularEstado(datos.nivel),
    ultimaActualizacion: new Date().toISOString()
  };
  return ultimaMedicion;
}

app.post('/api/medicion', (req, res) => {
  const error = validarMedicion(req.body);

  if (error) {
    return res.status(400).json({ success: false, error });
  }

  const medicion = guardarMedicion(req.body);
  return res.status(200).json({ success: true, medicion });
});

app.get('/api/estado', (_req, res) => {
  res.json(ultimaMedicion || estadoInicial);
});

// Permite comprobar todo el panel antes de conectar físicamente el ESP32.
app.post('/api/prueba', (_req, res) => {
  const medicion = guardarMedicion({
    id: 'tacho-01',
    ubicacion: 'Entrada principal',
    distancia: 8,
    nivel: 90,
    tapa: 'cerrada'
  });

  res.status(200).json({ success: true, medicion });
});

// Express identifica aquí un JSON mal escrito y responde también en formato JSON.
app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'El cuerpo de la solicitud contiene un JSON inválido.'
    });
  }
  return next(error);
});

// 0.0.0.0 permite que Render exponga el servicio públicamente.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Tacho Inteligente IoT disponible en http://localhost:${PORT}`);
});
