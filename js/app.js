import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// ─── Renderer ───────────────────────────────────────────────────────
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ─── Scene ──────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xE8E8F0);
scene.fog = new THREE.FogExp2(0xE8E8F0, 0.015);

// ─── Camera ─────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(8, 6, 12);

// ─── Controls ───────────────────────────────────────────────────────
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 1, 0);
controls.minDistance = 3;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2.05;
controls.update();

// ─── Lights ─────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambient);

// ─── Ground ─────────────────────────────────────────────────────────

// Main platform (where car is)
const groundGeo = new THREE.CircleGeometry(50, 128);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0xE8E8F0,
  roughness: 0.8,
  metalness: 0.1,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ─── Environment / Skybox ──────────────────────────────────────────
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

function createGradientEnvironment() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const t = y / size;
      const r = Math.floor(10 + t * 20);
      const g = Math.floor(10 + t * 15);
      const b = Math.floor(40 + t * 30);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.needsUpdate = true;
  return tex;
}

const envTexture = createGradientEnvironment();
const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
scene.environment = envMap;

// ─── Decorative elements ────────────────────────────────────────────

// ─── Car controls (WASD) ────────────────────────────────────────────
let car = null;
let carSpeed = 0;
const carMaxSpeed = 0.5;
const carAccel = 0.008;
const carDecel = 0.015;
const carBrake = 0.04;
const carRotSpeed = 0.04;
const keys = {};

window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// ─── WASD Button Controls ──────────────────────────────────────────
function setupButton(key) {
  const btn = document.getElementById(`btn-${key}`);
  if (btn) {
    btn.addEventListener('mousedown', () => { keys[key] = true; });
    btn.addEventListener('mouseup', () => { keys[key] = false; });
    btn.addEventListener('mouseleave', () => { keys[key] = false; });
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
  }
}
setupButton('w');
setupButton('a');
setupButton('s');
setupButton('d');

// ─── Load Car Model ─────────────────────────────────────────────────
const loader = new GLTFLoader();
const loadingEl = document.getElementById('loading');

loader.load(
  'model/card.glb',
  (gltf) => {
    const model = gltf.scene;

    // Center and auto-scale model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;

    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    model.position.y = -(box.min.y * scale);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const carGroup = new THREE.Group();
    model.rotation.y = -Math.PI / 2;
    carGroup.add(model);
    scene.add(carGroup);
    car = carGroup;

    controls.target.set(0, size.y * scale * 0.4, 0);
    controls.update();

    // Hide loading
    loadingEl.classList.add('hidden');

    // Play animations if any
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });

      const clock = new THREE.Clock();
      function animateAnimation() {
        requestAnimationFrame(animateAnimation);
        mixer.update(clock.getDelta());
      }
      animateAnimation();
    }
  },
  undefined,
  (error) => {
    console.error('Error loading model:', error);
    loadingEl.innerHTML = '<p style="color:#e94560">Error loading model</p>';
  }
);

// ─── Load Mushroom (decorative) ────────────────────────────────────
const mushroomLoader = new GLTFLoader();
mushroomLoader.load(
  'model/pine.glb',
  (gltf) => {
    const mushroomModel = gltf.scene;
    const mushroomPositions = [
      [-8, -6], [8, -5], [-2, 3],
    ];
    mushroomPositions.forEach(([x, z]) => {
      const mushroomClone = mushroomModel.clone();
      const box = new THREE.Box3().setFromObject(mushroomClone);
      const size = box.getSize(new THREE.Vector3());
      const scale = 12 / Math.max(size.x, size.y, size.z);
      mushroomClone.scale.setScalar(scale);
      mushroomClone.position.set(x, 0, z);
      mushroomClone.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(mushroomClone);
    });
  },
  undefined,
  (error) => {
    console.error('Error loading mushroom:', error);
  }
);

// ─── Resize ─────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Render loop ────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // ── WASD movement with acceleration ──
  if (car) {
    const isMoving = keys['w'] || keys['s'] || keys['arrowup'] || keys['arrowdown'];

    // Accelerate
    if (keys['w'] || keys['arrowup']) {
      carSpeed = Math.min(carSpeed + carAccel, carMaxSpeed);
    }
    // Reverse
    else if (keys['s'] || keys['arrowdown']) {
      carSpeed = Math.max(carSpeed - carAccel, -carMaxSpeed * 0.5);
    }
    // Brake (space)
    else if (keys[' ']) {
      if (carSpeed > 0) carSpeed = Math.max(carSpeed - carBrake, 0);
      else if (carSpeed < 0) carSpeed = Math.min(carSpeed + carBrake, 0);
    }
    // Natural deceleration (no key pressed)
    else {
      if (carSpeed > 0) carSpeed = Math.max(carSpeed - carDecel, 0);
      else if (carSpeed < 0) carSpeed = Math.min(carSpeed + carDecel, 0);
    }

    // Apply speed
    car.position.x += Math.sin(car.rotation.y) * carSpeed;
    car.position.z += Math.cos(car.rotation.y) * carSpeed;

    // Rotation only when moving
    if (Math.abs(carSpeed) > 0.01) {
      if (keys['a'] || keys['arrowleft']) {
        car.rotation.y += carRotSpeed * (carSpeed > 0 ? 1 : -1);
      }
      if (keys['d'] || keys['arrowright']) {
        car.rotation.y -= carRotSpeed * (carSpeed > 0 ? 1 : -1);
      }
    }

    // Clamp to ground bounds (circular)
    const maxRadius = 40;
    const distXZ = Math.sqrt(car.position.x ** 2 + car.position.z ** 2);
    if (distXZ > maxRadius) {
      const angle = Math.atan2(car.position.z, car.position.x);
      car.position.x = Math.cos(angle) * maxRadius;
      car.position.z = Math.sin(angle) * maxRadius;
    }

    // Camera follows car when moving
    if (Math.abs(carSpeed) > 0.01) {
      const offset = new THREE.Vector3(0, 5, 10);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y + Math.PI);
      camera.position.lerp(car.position.clone().add(offset), 0.08);
      controls.target.lerp(car.position.clone().add(new THREE.Vector3(0, 1, 0)), 0.08);
    }
  }

  controls.update();

  renderer.render(scene, camera);
}

animate();
