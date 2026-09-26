import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Avatar3DConfig, EmotionState, GestureType } from '../types';

interface Avatar3DCanvasProps {
  avatarConfig: Avatar3DConfig;
  emotions: EmotionState;
  isSpeaking: boolean;
  environment: string;
  onTapAvatar?: () => void;
}

export const Avatar3DCanvas: React.FC<Avatar3DCanvasProps> = ({
  avatarConfig,
  emotions,
  isSpeaking,
  environment,
  onTapAvatar,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const leftEyeRef = useRef<THREE.Mesh | null>(null);
  const rightEyeRef = useRef<THREE.Mesh | null>(null);
  const leftEyelidRef = useRef<THREE.Mesh | null>(null);
  const rightEyelidRef = useRef<THREE.Mesh | null>(null);
  const mouthRef = useRef<THREE.Mesh | null>(null);
  const leftBlushRef = useRef<THREE.Mesh | null>(null);
  const rightBlushRef = useRef<THREE.Mesh | null>(null);
  const leftEyebrowRef = useRef<THREE.Mesh | null>(null);
  const rightEyebrowRef = useRef<THREE.Mesh | null>(null);
  const chestRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);

  // State refs for animation
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const blinkProgressRef = useRef(0);
  const nextBlinkTimeRef = useRef(Date.now() + 2500);
  const gestureTimeRef = useRef(0);
  const currentGestureRef = useRef<GestureType>(emotions.currentGesture);

  useEffect(() => {
    currentGestureRef.current = emotions.currentGesture;
    gestureTimeRef.current = 0;
  }, [emotions.currentGesture]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 700;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.25, 3.4);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    keyLight.position.set(2, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.6);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(new THREE.Color(avatarConfig.glowColor), 2.5, 8);
    rimLight.position.set(0, 3, -2);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // 3. Ambient Background & Particles
    const particleCount = 180;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const glowCol = new THREE.Color(avatarConfig.glowColor);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = Math.random() * 4 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;

      const mixed = glowCol.clone().lerp(new THREE.Color(0xffffff), Math.random() * 0.5);
      particleColors[i * 3] = mixed.r;
      particleColors[i * 3 + 1] = mixed.g;
      particleColors[i * 3 + 2] = mixed.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // 4. Build Procedural 3D Character
    const characterGroup = new THREE.Group();
    characterGroup.position.set(0, -0.6, 0);
    scene.add(characterGroup);
    characterGroupRef.current = characterGroup;

    // --- Head Group ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.85, 0);
    characterGroup.add(headGroup);
    headGroupRef.current = headGroup;

    // Head Base (Stylized smooth oval head)
    const headGeo = new THREE.SphereGeometry(0.48, 32, 32);
    headGeo.scale(1.0, 1.15, 0.95);
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatarConfig.skinTone),
      roughness: 0.45,
      metalness: 0.05,
    });
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headGroup.add(headMesh);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.45, 24);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, -0.45, 0);
    headGroup.add(neckMesh);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.1, 16, 16);
    earGeo.scale(0.5, 1.2, 0.8);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(0.48, 0.02, -0.05);
    leftEar.rotation.y = 0.2;
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(-0.48, 0.02, -0.05);
    rightEar.rotation.y = -0.2;
    headGroup.add(rightEar);

    // Eyes
    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.1,
      metalness: 0.1,
    });
    const eyeIrisMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatarConfig.eyeColor),
      roughness: 0.15,
      metalness: 0.3,
    });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const eyeHighlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const createEyeAssembly = (isLeft: boolean) => {
      const eyeGroup = new THREE.Group();
      const xPos = isLeft ? 0.17 : -0.17;
      eyeGroup.position.set(xPos, 0.08, 0.4);

      // Eye White Ball
      const eyeSclera = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 20), eyeWhiteMat);
      eyeGroup.add(eyeSclera);

      // Iris
      const iris = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.02, 20), eyeIrisMat);
      iris.rotation.x = Math.PI / 2;
      iris.position.z = 0.08;
      eyeGroup.add(iris);

      // Pupil
      const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.022, 16), pupilMat);
      pupil.rotation.x = Math.PI / 2;
      pupil.position.z = 0.083;
      eyeGroup.add(pupil);

      // Eye Gleam / Highlight
      const gleam = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), eyeHighlightMat);
      gleam.position.set(0.025, 0.025, 0.095);
      eyeGroup.add(gleam);

      return eyeGroup;
    };

    const leftEye = createEyeAssembly(true);
    const rightEye = createEyeAssembly(false);
    headGroup.add(leftEye);
    headGroup.add(rightEye);
    leftEyeRef.current = leftEye as any;
    rightEyeRef.current = rightEye as any;

    // Eyelids for blinking
    const eyelidGeo = new THREE.SphereGeometry(0.098, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    eyelidGeo.rotateX(-Math.PI / 2);
    const eyelidMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatarConfig.skinTone).clone().multiplyScalar(0.95),
      roughness: 0.5,
    });

    const leftEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    leftEyelid.position.set(0.17, 0.08, 0.41);
    leftEyelid.scale.set(1.05, 0.05, 1.05); // starts open
    headGroup.add(leftEyelid);
    leftEyelidRef.current = leftEyelid;

    const rightEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    rightEyelid.position.set(-0.17, 0.08, 0.41);
    rightEyelid.scale.set(1.05, 0.05, 1.05);
    headGroup.add(rightEyelid);
    rightEyelidRef.current = rightEyelid;

    // Eyebrows
    const eyebrowMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatarConfig.hairColor).clone().multiplyScalar(0.7),
      roughness: 0.8,
    });
    const eyebrowGeo = new THREE.BoxGeometry(0.14, 0.024, 0.02);

    const leftEyebrow = new THREE.Mesh(eyebrowGeo, eyebrowMat);
    leftEyebrow.position.set(0.17, 0.22, 0.44);
    leftEyebrow.rotation.z = -0.06;
    headGroup.add(leftEyebrow);
    leftEyebrowRef.current = leftEyebrow;

    const rightEyebrow = new THREE.Mesh(eyebrowGeo, eyebrowMat);
    rightEyebrow.position.set(-0.17, 0.22, 0.44);
    rightEyebrow.rotation.z = 0.06;
    headGroup.add(rightEyebrow);
    rightEyebrowRef.current = rightEyebrow;

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.045, 0.12, 12);
    noseGeo.rotateX(Math.PI);
    const noseMesh = new THREE.Mesh(noseGeo, skinMat);
    noseMesh.position.set(0, -0.04, 0.48);
    noseMesh.scale.set(0.7, 1.0, 0.8);
    headGroup.add(noseMesh);

    // Mouth / Lips
    const lipMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatarConfig.skinTone).clone().lerp(new THREE.Color(0xd9777f), 0.45),
      roughness: 0.35,
    });
    const mouthGeo = new THREE.TorusGeometry(0.065, 0.018, 12, 24, Math.PI * 0.85);
    mouthGeo.rotateZ(-Math.PI * 0.42);
    const mouthMesh = new THREE.Mesh(mouthGeo, lipMat);
    mouthMesh.position.set(0, -0.22, 0.44);
    mouthMesh.rotation.x = 0.15;
    headGroup.add(mouthMesh);
    mouthRef.current = mouthMesh;

    // Blush meshes
    const blushGeo = new THREE.CircleGeometry(0.07, 16);
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.18,
    });
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(0.24, -0.04, 0.44);
    leftBlush.rotation.y = 0.25;
    headGroup.add(leftBlush);
    leftBlushRef.current = leftBlush;

    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(-0.24, -0.04, 0.44);
    rightBlush.rotation.y = -0.25;
    headGroup.add(rightBlush);
    rightBlushRef.current = rightBlush;

    // Hair Assembly based on hairStyle
    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatarConfig.hairColor),
      roughness: 0.55,
      metalness: 0.1,
    });

    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);

    // Top hair skull cap
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.51, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
    hairCap.position.set(0, 0.04, -0.02);
    hairCap.scale.set(1.02, 1.14, 1.05);
    hairGroup.add(hairCap);

    // Style specifics
    const style = avatarConfig.hairStyle;
    if (style === 'long_wavy') {
      // Cascading strands
      for (let i = 0; i < 10; i++) {
        const strandGeo = new THREE.CylinderGeometry(0.06, 0.03, 1.0, 10);
        const strand = new THREE.Mesh(strandGeo, hairMat);
        const side = i % 2 === 0 ? 1 : -1;
        const xOffset = side * (0.32 + Math.random() * 0.15);
        strand.position.set(xOffset, -0.4 - Math.random() * 0.1, -0.15 + (i * 0.04));
        strand.rotation.z = side * (0.15 + Math.random() * 0.1);
        strand.rotation.x = 0.1 + Math.random() * 0.1;
        hairGroup.add(strand);
      }
      // Front bangs framing face
      const bangGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.4, 8);
      const leftBang = new THREE.Mesh(bangGeo, hairMat);
      leftBang.position.set(0.32, 0.05, 0.35);
      leftBang.rotation.z = -0.2;
      hairGroup.add(leftBang);

      const rightBang = new THREE.Mesh(bangGeo, hairMat);
      rightBang.position.set(-0.32, 0.05, 0.35);
      rightBang.rotation.z = 0.2;
      hairGroup.add(rightBang);
    } else if (style === 'bob_cut') {
      // Sleek bob curved around chin
      const bobGeo = new THREE.CylinderGeometry(0.52, 0.48, 0.65, 24, 1, true);
      const bobMesh = new THREE.Mesh(bobGeo, hairMat);
      bobMesh.position.set(0, -0.15, -0.02);
      hairGroup.add(bobMesh);

      // Neat front fringe
      const fringeGeo = new THREE.BoxGeometry(0.48, 0.14, 0.1);
      const fringe = new THREE.Mesh(fringeGeo, hairMat);
      fringe.position.set(0, 0.28, 0.42);
      fringe.rotation.x = -0.2;
      hairGroup.add(fringe);
    } else if (style === 'messy_spikes') {
      // Spiky anime/cyber locks
      for (let s = 0; s < 18; s++) {
        const spikeGeo = new THREE.ConeGeometry(0.09, 0.38, 7);
        const spike = new THREE.Mesh(spikeGeo, hairMat);
        const angle = (s / 18) * Math.PI * 2;
        const radius = 0.44;
        spike.position.set(Math.cos(angle) * radius, 0.32 + Math.sin(s) * 0.12, Math.sin(angle) * radius);
        spike.lookAt(new THREE.Vector3(Math.cos(angle) * 1.5, 1.2, Math.sin(angle) * 1.5));
        hairGroup.add(spike);
      }
    } else if (style === 'sleek_bun') {
      // High elegant bun
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 20), hairMat);
      bun.position.set(0, 0.58, -0.25);
      bun.scale.set(1.1, 0.9, 1.0);
      hairGroup.add(bun);
      // Wispy side strands
      const wispGeo = new THREE.CylinderGeometry(0.02, 0.01, 0.45, 8);
      const leftWisp = new THREE.Mesh(wispGeo, hairMat);
      leftWisp.position.set(0.36, -0.08, 0.32);
      leftWisp.rotation.z = -0.15;
      hairGroup.add(leftWisp);
      const rightWisp = new THREE.Mesh(wispGeo, hairMat);
      rightWisp.position.set(-0.36, -0.08, 0.32);
      rightWisp.rotation.z = 0.15;
      hairGroup.add(rightWisp);
    } else {
      // Default / curtain bangs
      const partedLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.6, 8), hairMat);
      partedLeft.position.set(0.28, 0.02, 0.35);
      partedLeft.rotation.z = -0.3;
      hairGroup.add(partedLeft);

      const partedRight = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.6, 8), hairMat);
      partedRight.position.set(-0.28, 0.02, 0.35);
      partedRight.rotation.z = 0.3;
      hairGroup.add(partedRight);

      // Back volume
      const backGeo = new THREE.CylinderGeometry(0.48, 0.42, 0.8, 16);
      const backHair = new THREE.Mesh(backGeo, hairMat);
      backHair.position.set(0, -0.28, -0.2);
      hairGroup.add(backHair);
    }

    // Accessories
    const acc = avatarConfig.accessory;
    if (acc === 'glasses') {
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.2, metalness: 0.8 });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.45,
        roughness: 0.05,
        transmission: 0.9,
      });

      const leftRim = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.014, 12, 24), frameMat);
      leftRim.position.set(0.18, 0.08, 0.47);
      headGroup.add(leftRim);

      const rightRim = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.014, 12, 24), frameMat);
      rightRim.position.set(-0.18, 0.08, 0.47);
      headGroup.add(rightRim);

      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), frameMat);
      bridge.rotation.z = Math.PI / 2;
      bridge.position.set(0, 0.08, 0.48);
      headGroup.add(bridge);

      const leftLens = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), glassMat);
      leftLens.position.set(0.18, 0.08, 0.47);
      headGroup.add(leftLens);

      const rightLens = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), glassMat);
      rightLens.position.set(-0.18, 0.08, 0.47);
      headGroup.add(rightLens);
    } else if (acc === 'choker') {
      const chokerMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 });
      const chokerMesh = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.02, 16, 32), chokerMat);
      chokerMesh.rotation.x = Math.PI / 2;
      chokerMesh.position.set(0, -0.42, 0);
      headGroup.add(chokerMesh);

      // Small glowing gem
      const gemMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(avatarConfig.glowColor) });
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), gemMat);
      gem.position.set(0, -0.42, 0.2);
      headGroup.add(gem);
    } else if (acc === 'pendant_necklace') {
      const chainMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.012, 12, 32), chainMat);
      chain.rotation.x = Math.PI / 2.3;
      chain.position.set(0, -0.5, 0.05);
      headGroup.add(chain);

      const pendant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.04), chainMat);
      pendant.position.set(0, -0.66, 0.22);
      headGroup.add(pendant);
    } else if (acc === 'cyber_earring') {
      const cyberMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(avatarConfig.glowColor) });
      const earring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 10, 16), cyberMat);
      earring.position.set(0.49, -0.06, -0.04);
      headGroup.add(earring);
    }

    // --- Torso & Outfit ---
    const outfitMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatarConfig.outfitPrimaryColor),
      roughness: 0.65,
      metalness: 0.15,
    });
    const outfitTrimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatarConfig.outfitSecondaryColor),
      roughness: 0.5,
      metalness: 0.3,
    });

    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.8, 0);
    characterGroup.add(torsoGroup);

    // Chest & Shoulders
    const chestGeo = new THREE.CylinderGeometry(0.42, 0.38, 0.9, 24);
    chestGeo.scale(1.25, 1.0, 0.75);
    const chestMesh = new THREE.Mesh(chestGeo, outfitMat);
    chestMesh.position.set(0, 0.15, 0);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    torsoGroup.add(chestMesh);
    chestRef.current = chestMesh;

    // Collar / Neck trim
    const collarGeo = new THREE.TorusGeometry(0.25, 0.06, 12, 24);
    collarGeo.rotateX(Math.PI / 2);
    const collar = new THREE.Mesh(collarGeo, outfitTrimMat);
    collar.position.set(0, 0.62, 0);
    torsoGroup.add(collar);

    // Shoulders
    const shoulderGeo = new THREE.SphereGeometry(0.2, 16, 16);
    shoulderGeo.scale(1.1, 0.9, 1.0);
    const leftShoulder = new THREE.Mesh(shoulderGeo, outfitMat);
    leftShoulder.position.set(0.58, 0.45, 0);
    torsoGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, outfitMat);
    rightShoulder.position.set(-0.58, 0.45, 0);
    torsoGroup.add(rightShoulder);

    // Upper arms
    const armGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.7, 16);
    const leftArm = new THREE.Mesh(armGeo, outfitMat);
    leftArm.position.set(0.66, 0.05, 0);
    leftArm.rotation.z = -0.15;
    torsoGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, outfitMat);
    rightArm.position.set(-0.66, 0.05, 0);
    rightArm.rotation.z = 0.15;
    torsoGroup.add(rightArm);

    // Cyber seams / glow stripes if cyber jacket or cyber earring
    if (avatarConfig.outfitStyle === 'cyber_jacket' || avatarConfig.accessory === 'cyber_earring') {
      const glowSeamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(avatarConfig.glowColor) });
      const seamGeo = new THREE.BoxGeometry(0.02, 0.75, 0.02);

      const leftSeam = new THREE.Mesh(seamGeo, glowSeamMat);
      leftSeam.position.set(0.24, 0.18, 0.28);
      torsoGroup.add(leftSeam);

      const rightSeam = new THREE.Mesh(seamGeo, glowSeamMat);
      rightSeam.position.set(-0.24, 0.18, 0.28);
      torsoGroup.add(rightSeam);
    }

    // 5. Mouse tracking & Interaction Events
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouseRef.current.targetX = (clientX / rect.width) * 2 - 1;
      mouseRef.current.targetY = -(clientY / rect.height) * 2 + 1;

      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;
        targetRotationRef.current.y += deltaX * 0.008;
        targetRotationRef.current.x = Math.max(-0.35, Math.min(0.35, targetRotationRef.current.x + deltaY * 0.005));
        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current) {
        const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
        const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;
        targetRotationRef.current.y += deltaX * 0.01;
        targetRotationRef.current.x = Math.max(-0.35, Math.min(0.35, targetRotationRef.current.x + deltaY * 0.008));
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 700;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('resize', handleResize);

    // 6. Main Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Smooth rotation lerp
      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;

      if (characterGroupRef.current) {
        characterGroupRef.current.rotation.y = currentRotationRef.current.y;
        characterGroupRef.current.rotation.x = currentRotationRef.current.x;
      }

      // Breathing animation
      const breath = Math.sin(elapsedTime * 2.2) * 0.015;
      if (chestRef.current) {
        chestRef.current.scale.y = 1.0 + breath * 1.5;
        chestRef.current.scale.x = 1.25 + breath;
      }

      // Natural random eye blinking
      const now = Date.now();
      if (now > nextBlinkTimeRef.current) {
        blinkProgressRef.current = 1.0;
        nextBlinkTimeRef.current = now + 2800 + Math.random() * 3200;
      }
      if (blinkProgressRef.current > 0) {
        blinkProgressRef.current -= delta * 6.5;
        const eyelidScale = Math.max(0.05, Math.sin(Math.max(0, blinkProgressRef.current) * Math.PI) * 1.15);
        if (leftEyelidRef.current && rightEyelidRef.current) {
          leftEyelidRef.current.scale.y = eyelidScale;
          rightEyelidRef.current.scale.y = eyelidScale;
        }
      }

      // Eye tracking target (mouse & subtle micro-saccades)
      const saccade = Math.sin(elapsedTime * 6.0) * 0.006;
      const eyeTargetX = mouseRef.current.x * 0.02 + saccade;
      const eyeTargetY = mouseRef.current.y * 0.02;
      if (leftEyeRef.current && rightEyeRef.current) {
        leftEyeRef.current.position.x = 0.17 + eyeTargetX;
        leftEyeRef.current.position.y = 0.08 + eyeTargetY;
        rightEyeRef.current.position.x = -0.17 + eyeTargetX;
        rightEyeRef.current.position.y = 0.08 + eyeTargetY;
      }

      // Dynamic Gestures & Head Movements
      gestureTimeRef.current += delta;
      const gTime = gestureTimeRef.current;
      const gesture = currentGestureRef.current;

      let targetHeadRotZ = 0;
      let targetHeadRotX = breath * 0.4;
      let targetHeadRotY = mouseRef.current.x * 0.12;
      let targetHeadPosY = 1.85 + breath;
      let targetHeadPosZ = 0;

      let blushOpacity = (emotions.affection / 100) * 0.35;
      let smileCurve = 0.15;

      if (gesture === 'nod') {
        targetHeadRotX += Math.sin(gTime * 5.0) * 0.12 * Math.exp(-gTime * 0.8);
      } else if (gesture === 'thoughtful') {
        targetHeadRotZ = 0.12;
        targetHeadRotX = -0.06;
        targetHeadRotY += 0.08;
      } else if (gesture === 'blush') {
        targetHeadRotX = 0.14;
        targetHeadRotZ = -0.09;
        blushOpacity = 0.65;
        targetHeadRotY *= 0.4;
      } else if (gesture === 'laugh') {
        targetHeadRotX += Math.sin(gTime * 9.0) * 0.08 * Math.exp(-gTime * 0.6);
        targetHeadPosY += Math.abs(Math.sin(gTime * 9.0)) * 0.03;
        smileCurve = 0.35;
      } else if (gesture === 'lean_in') {
        targetHeadPosZ = 0.22;
        targetHeadRotX = -0.05;
      } else if (gesture === 'wink') {
        if (gTime < 1.2 && leftEyelidRef.current) {
          leftEyelidRef.current.scale.y = 1.1;
        }
      }

      // Speech mouth movement
      if (isSpeaking) {
        const talkWave = Math.abs(Math.sin(elapsedTime * 14.0));
        smileCurve += talkWave * 0.18;
        if (mouthRef.current) {
          mouthRef.current.scale.y = 1.0 + talkWave * 0.6;
          mouthRef.current.scale.x = 1.0 - talkWave * 0.15;
        }
      } else if (mouthRef.current) {
        mouthRef.current.scale.y = 1.0;
        mouthRef.current.scale.x = 1.0;
      }

      // Apply Head Rotations
      if (headGroupRef.current) {
        headGroupRef.current.rotation.z += (targetHeadRotZ - headGroupRef.current.rotation.z) * 0.08;
        headGroupRef.current.rotation.x += (targetHeadRotX - headGroupRef.current.rotation.x) * 0.08;
        headGroupRef.current.rotation.y += (targetHeadRotY - headGroupRef.current.rotation.y) * 0.08;
        headGroupRef.current.position.y += (targetHeadPosY - headGroupRef.current.position.y) * 0.08;
        headGroupRef.current.position.z += (targetHeadPosZ - headGroupRef.current.position.z) * 0.08;
      }

      // Apply Blush Opacity
      if (leftBlushRef.current && rightBlushRef.current) {
        const bMat1 = leftBlushRef.current.material as THREE.MeshBasicMaterial;
        const bMat2 = rightBlushRef.current.material as THREE.MeshBasicMaterial;
        bMat1.opacity = blushOpacity;
        bMat2.opacity = blushOpacity;
      }

      // Particles ambient swirl
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.035;
        particlesRef.current.rotation.x = Math.sin(elapsedTime * 0.02) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [avatarConfig, environment]);

  return (
    <div
      ref={containerRef}
      onClick={onTapAvatar}
      className="w-full h-full cursor-grab active:cursor-grabbing select-none relative overflow-hidden flex items-center justify-center"
      title="Click and drag to rotate companion view"
    />
  );
};
