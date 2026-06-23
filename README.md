<div align="center">

# 🚗 Drive Simulator 3D

![Preview](img/preview.jpg)

**An interactive 3D driving simulator built with Three.js**

[![Made with Three.js](https://img.shields.io/badge/Made%20with-Three.js-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## About

**Drive Simulator 3D** is a web-based driving experience that lets you get behind the wheel of a 3D car model directly in your browser. Built from scratch using **Three.js**, the project features real-time 3D rendering, physics-based acceleration and braking, dynamic camera following, and an atmospheric scene with custom lighting and decorative elements.

The goal of this project is to explore real-time 3D graphics on the web, experimenting with model loading, scene composition, and interactive controls to create a smooth and visually appealing driving experience.

## Features

- **Real-Time 3D Rendering** — Powered by Three.js with ACES Filmic tone mapping, soft shadow maps, and exponential fog for depth.
- **Smooth Vehicle Physics** — Acceleration, braking, reverse, and natural deceleration with tuned feel.
- **Dynamic Third-Person Camera** — The camera follows behind the car as you drive, with orbit controls to freely look around when stationary.
- **Atmospheric Lighting** — Multi-light setup with a directional sun, hemisphere sky, fill and rim lights, and animated colored point lights for atmosphere.
- **3D Model Loading** — Car and decorative models loaded from `.glb` files using GLTFLoader with auto-scaling and centering.
- **Immersive HUD** — On-screen WASD controls for touch/mobile devices, loading indicator, and a clean interface.
- **Responsive Design** — Adapts to any screen size, works on both desktop and mobile.

## Technologies

| Technology | Usage |
| :--- | :--- |
| **HTML5 & CSS3** | Structure and styling |
| **JavaScript (ES6 Modules)** | Application logic |
| **Three.js** | 3D rendering engine |
| **GLTFLoader** | Loading `.glb` 3D models |
| **OrbitControls** | Camera interaction |

## Controls

| Action | Keyboard | On-Screen |
| :--- | :--- | :--- |
| **Forward** | `W` / `↑` | Button W |
| **Reverse** | `S` / `↓` | Button S |
| **Turn Left** | `A` / `←` | Button A |
| **Turn Right** | `D` / `→` | Button D |
| **Brake** | `Space` | — |
| **Rotate Camera** | `Left Click + Drag` | Touch drag |
| **Zoom** | `Mouse Wheel` | Pinch |

## Project Structure

```
drive-simulator-3d-thre.js/
├── index.html          # Main HTML entry point
├── css/
│   └── style.css       # Styles and responsive layout
├── js/
│   └── app.js          # Three.js scene, physics, controls & rendering
├── model/
│   ├── card.glb        # Car 3D model
│   └── pine.glb        # Decorative pine model
├── texture/
│   ├── grav.jpg        # Ground textures
│   └── grav-2.jpg
├── img/
│   └── preview.jpg     # Project preview image
└── LICENSE
```

## How It Works

1. The scene loads with a ground plane, atmospheric lighting, and decorative pine models placed around the environment.
2. The car model (`card.glb`) is loaded, auto-scaled to fit the scene, and wrapped in a group for proper orientation.
3. Press **W** to accelerate, **S** to reverse, and **A/D** to steer. The car follows smooth acceleration and deceleration curves.
4. While driving, the camera automatically follows behind the car. When stationary, you can freely orbit with the mouse.
5. The car is clamped to a circular boundary to keep it within the scene.

## 3D Models

> **Note:** The 3D models used in this project were sourced from [Poly Pizza](https://poly.pizza/). All credit to the original model authors. Licensed under [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/).

## Creator

Developed by **Sebastián Vásquez**.

- [Web Portfolio](https://sebas-dev.vercel.app/)
- [Source Code](https://github.com/sebastianvasquezechavarria1234/drive-simulator-3d-thre.js)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. You are free to use, copy, and modify the code, as long as you provide appropriate credit.
