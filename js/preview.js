import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─── Renderer ───────────────────────────────────────────────────────
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ─── Scene ──────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf48fb1);
scene.fog = new THREE.FogExp2(0xf48fb1, 0.008);

// ─── Camera ─────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(5, 3.5, 6);

// ─── Controls ───────────────────────────────────────────────────────
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0.8, 0);
controls.minDistance = 2;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2.05;
controls.update();

// ─── Lights ─────────────────────────────────────────────────────────

// Ambient
const ambient = new THREE.AmbientLight(0x8090b0, 0.6);
scene.add(ambient);

// Hemisphere
const hemi = new THREE.HemisphereLight(0x8899bb, 0x443322, 0.8);
scene.add(hemi);

// Directional (sun)
const dirLight = new THREE.DirectionalLight(0xffeedd, 4.0);
dirLight.position.set(15, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 60;
dirLight.shadow.camera.left = -15;
dirLight.shadow.camera.right = 15;
dirLight.shadow.camera.top = 15;
dirLight.shadow.camera.bottom = -15;
dirLight.shadow.bias = -0.0005;
scene.add(dirLight);

// Fill light
const fillLight = new THREE.DirectionalLight(0x8899bb, 0.8);
fillLight.position.set(-8, 5, -6);
scene.add(fillLight);

// Back / Rim light
const backLight = new THREE.DirectionalLight(0xaabbdd, 2.5);
backLight.position.set(-10, 10, -8);
scene.add(backLight);

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
      const r = Math.floor(15 + t * 25);
      const g = Math.floor(35 + t * 35);
      const b = Math.floor(15 + t * 20);
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
    carGroup.position.x = 0;
    scene.add(carGroup);

    // Point camera at car center
    const carCenter = new THREE.Vector3(0, size.y * scale * 0.4, 0);
    controls.target.copy(carCenter);
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
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
