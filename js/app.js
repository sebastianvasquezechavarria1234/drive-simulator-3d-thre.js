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
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015);

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

// Ambient
const ambient = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambient);

// Hemisphere
const hemi = new THREE.HemisphereLight(0x6688cc, 0x223344, 0.8);
scene.add(hemi);

// Directional (sun)
const dirLight = new THREE.DirectionalLight(0xffeedd, 2.5);
dirLight.position.set(10, 15, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -20;
dirLight.shadow.camera.right = 20;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -20;
dirLight.shadow.bias = -0.0005;
scene.add(dirLight);

// Fill light
const fillLight = new THREE.DirectionalLight(0x8899bb, 0.8);
fillLight.position.set(-8, 5, -6);
scene.add(fillLight);

// Point lights for atmosphere
const pointRed = new THREE.PointLight(0xe94560, 1.5, 20);
pointRed.position.set(-6, 3, 0);
scene.add(pointRed);

const pointBlue = new THREE.PointLight(0x0f3460, 1.5, 20);
pointBlue.position.set(6, 3, 0);
scene.add(pointBlue);

// ─── Ground ─────────────────────────────────────────────────────────

// Ground texture
const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load('texture/grav.jpg');
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(20, 20);

// Ground plane with shadow
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({
  map: groundTexture,
  roughness: 0.85,
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

function addPillar(x, z) {
  const geo = new THREE.CylinderGeometry(0.15, 0.2, 4, 8);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x334466,
    roughness: 0.3,
    metalness: 0.7,
  });
  const pillar = new THREE.Mesh(geo, mat);
  pillar.position.set(x, 2, z);
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  scene.add(pillar);

  // Light on top
  const light = new THREE.PointLight(0xe94560, 0.4, 8);
  light.position.set(x, 4.2, z);
  scene.add(light);
}

const pillarPositions = [
  [-5, -5], [-5, 5], [5, -5], [5, 5],
  [-5, 0], [5, 0], [0, -5], [0, 5],
];
pillarPositions.forEach(([x, z]) => addPillar(x, z));

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

// ─── Load Model ─────────────────────────────────────────────────────
const loader = new GLTFLoader();
const loadingEl = document.getElementById('loading');

loader.load(
  'model/model_inspector_demo_press_i.glb',
  (gltf) => {
    const model = gltf.scene;

    // Center and auto-scale model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 4 / maxDim;

    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    model.position.y = -(box.min.y * scale);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(model);
    car = model;

    // Center controls on model
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

    // Clamp to ground bounds
    const limit = 45;
    car.position.x = Math.max(-limit, Math.min(limit, car.position.x));
    car.position.z = Math.max(-limit, Math.min(limit, car.position.z));

    // Camera follows car when moving
    if (Math.abs(carSpeed) > 0.01) {
      const offset = new THREE.Vector3(0, 5, 10);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y + Math.PI);
      camera.position.lerp(car.position.clone().add(offset), 0.08);
      controls.target.lerp(car.position.clone().add(new THREE.Vector3(0, 1, 0)), 0.08);
    }
  }

  controls.update();

  // Subtle floating point lights
  pointRed.position.y = 3 + Math.sin(t * 0.8) * 0.5;
  pointBlue.position.y = 3 + Math.cos(t * 0.8) * 0.5;

  renderer.render(scene, camera);
}

animate();
