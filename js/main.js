import { createStereoViewer, DEFAULT_CONFIG } from './viewer.js';
import { createCalibrationGUI } from './controls.js';
import { loadSbsImage } from './fileLoader.js';
import { createImmersiveMode, showToast } from './ui.js';

const config = { ...DEFAULT_CONFIG };
const stage = document.getElementById('viewerStage');
const info = document.getElementById('imageStatus');
const dimensions = document.getElementById('imageDimensions');
const emptyState = document.getElementById('emptyState');
const fileInput = document.getElementById('fileInput');
const demoButtons = [document.getElementById('demoOneBtn'), document.getElementById('demoTwoBtn')];
const PROFILE_KEY = 'stereolab.calibration.v1';
let requestCounter = 0;
let viewer;

function validProfile(value) {
  return value && typeof value === 'object'
    && Number.isFinite(value.parallax) && Number.isFinite(value.scale)
    && Number.isFinite(value.panX) && Number.isFinite(value.panY)
    && Number.isFinite(value.vertical)
    && ['full', 'half'].includes(value.format)
    && typeof value.swap === 'boolean';
}

try {
  const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
  if (validProfile(saved)) Object.assign(config, saved);
} catch { /* El visor usa valores iniciales si el almacenamiento no está disponible. */ }

try {
  viewer = createStereoViewer(stage, config);
} catch (error) {
  emptyState.hidden = false;
  emptyState.querySelector('strong').textContent = 'No se pudo iniciar WebGL';
  emptyState.querySelector('span').textContent = 'Prueba Chrome o Safari actualizado con aceleración gráfica activada.';
  info.textContent = `Error: ${error.message}`;
  throw error;
}

const calibration = createCalibrationGUI(document.getElementById('guiHost'), config, () => viewer.update());
createImmersiveMode(() => viewer.resize());

function resetCalibration() {
  Object.assign(config, DEFAULT_CONFIG);
  calibration.refresh();
  viewer.update();
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(config)); } catch { /* almacenamiento opcional */ }
  showToast('Calibración restablecida.');
}

function saveProfile() {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(config));
    showToast('Perfil guardado. Se aplicará también a las próximas fotos.');
  } catch {
    showToast('No se pudo guardar el perfil en este navegador.');
  }
}

async function displaySource(source, selectedDemo = -1) {
  const requestId = ++requestCounter;
  info.textContent = 'Cargando fotografía…';
  try {
    const { image, name } = await loadSbsImage(source);
    if (requestId !== requestCounter) return; // Ignorar resultado de una carga anterior.
    const { width, height } = viewer.setImage(image, name);
    emptyState.hidden = true;
    info.textContent = name;
    dimensions.textContent = `${width} × ${height} px`;
    demoButtons.forEach((button, index) => button.classList.toggle('active', selectedDemo === index));
    if (width % 2 !== 0) showToast('Imagen cargada. Se recomienda un ancho par para SBS.');
    else showToast(`Imagen cargada: ${name}`);
  } catch (error) {
    if (requestId !== requestCounter) return;
    info.textContent = viewer.getImageInfo()?.name || 'Sin imagen';
    showToast(error.message || 'Ocurrió un problema al cargar la fotografía.');
    if (!viewer.getImageInfo()) emptyState.hidden = false;
  }
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) displaySource(file);
  fileInput.value = ''; // Permite cargar dos veces el mismo archivo.
});

demoButtons[0].addEventListener('click', () => displaySource('./assets/images/demo-sbs-1.jpg', 0));
demoButtons[1].addEventListener('click', () => displaySource('./assets/images/demo-sbs-2.jpg', 1));
document.getElementById('resetBtn').addEventListener('click', resetCalibration);
document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

// Arrastrar mueve ambas vistas; pellizcar o usar la rueda ajusta su escala.
const pointers = new Map();
let gesture = null;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function pointerPosition(event) {
  const rect = stage.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}
function beginGesture() {
  const points = [...pointers.values()];
  if (points.length === 1) {
    gesture = { kind: 'move', point: points[0], panX: config.panX, panY: config.panY };
  } else if (points.length >= 2) {
    gesture = { kind: 'zoom', gap: distance(points[0], points[1]), scale: config.scale };
  }
}
stage.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  stage.setPointerCapture?.(event.pointerId);
  pointers.set(event.pointerId, pointerPosition(event));
  beginGesture();
});
stage.addEventListener('pointermove', (event) => {
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, pointerPosition(event));
  const points = [...pointers.values()];
  if (points.length >= 2 && gesture?.kind === 'zoom') {
    config.scale = clamp(gesture.scale * distance(points[0], points[1]) / Math.max(1, gesture.gap), 40, 180);
  } else if (points.length === 1 && gesture?.kind === 'move') {
    config.panX = clamp(gesture.panX + points[0].x - gesture.point.x, -400, 400);
    config.panY = clamp(gesture.panY + points[0].y - gesture.point.y, -400, 400);
  }
  calibration.refresh();
  viewer.update();
});
function endPointer(event) {
  pointers.delete(event.pointerId);
  if (pointers.size) beginGesture();
  else gesture = null;
}
stage.addEventListener('pointerup', endPointer);
stage.addEventListener('pointercancel', endPointer);
stage.addEventListener('lostpointercapture', endPointer);
stage.addEventListener('wheel', (event) => {
  event.preventDefault();
  config.scale = clamp(config.scale * (event.deltaY < 0 ? 1.05 : 0.95), 40, 180);
  calibration.refresh();
  viewer.update();
}, { passive: false });

document.getElementById('saveBtn').addEventListener('click', () => {
  const payload = {
    proyecto: 'StereoLab / Three.js',
    imagen: viewer.getImageInfo(),
    calibracion: { ...config },
    fecha: new Date().toISOString(),
    nota: 'Estos ajustes no modifican el archivo de imagen original.',
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = 'calibracion-sbs.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Ajustes descargados como JSON.');
});

// Arrastrar y soltar imágenes desde la computadora.
function dragOver(event) { event.preventDefault(); stage.classList.add('drag-over'); }
function dragLeave() { stage.classList.remove('drag-over'); }
stage.addEventListener('dragover', dragOver);
stage.addEventListener('dragleave', dragLeave);
stage.addEventListener('drop', (event) => {
  event.preventDefault();
  dragLeave();
  const file = event.dataTransfer?.files?.[0];
  if (file) displaySource(file);
});

// Se precarga una foto para que la primera visita no muestre un área vacía.
displaySource('./assets/images/demo-sbs-1.jpg', 0);
