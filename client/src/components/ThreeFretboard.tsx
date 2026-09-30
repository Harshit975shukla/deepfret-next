import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { NoteEvent } from '../types/transcription';

interface ThreeFretboardProps {
  events: NoteEvent[];
  currentTime: number;
  tuningNames?: string[];
}

export const ThreeFretboard: React.FC<ThreeFretboardProps> = ({
  events,
  currentTime,
  tuningNames = ['E', 'A', 'D', 'G', 'B', 'E'],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const activeBallsGroupRef = useRef<THREE.Group | null>(null);

  // Fretboard geometrical specifications
  const numFrets = 19;
  const numStrings = 6;
  const scaleLength = 40.0; // Virtual scale length
  const fretboardWidthNut = 3.6;
  const fretboardWidthBridge = 4.8;

  // Calculate fret longitudinal X positions using guitar rule of 17.817
  const fretPositions: number[] = [0];
  for (let f = 1; f <= numFrets; f++) {
    const prev = fretPositions[f - 1];
    const distFromNut = scaleLength * (1 - Math.pow(2, -f / 12));
    fretPositions.push(distFromNut);
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 280;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x13151A);

    // 2. Camera setup - angled 3D view looking down the neck towards the body
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(10, 8.5, 14);
    camera.lookAt(12, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffecc4, 1.4);
    dirLight.position.set(15, 20, 10);
    scene.add(dirLight);

    const blueRimLight = new THREE.DirectionalLight(0x7090ff, 0.5);
    blueRimLight.position.set(-10, 5, -10);
    scene.add(blueRimLight);

    // 5. Build Fretboard Plank (Dark Rosewood / Ebony)
    const neckLength = fretPositions[numFrets] + 2.0;
    const boardGeo = new THREE.BoxGeometry(neckLength, 0.5, fretboardWidthBridge);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x1f1a17,
      roughness: 0.75,
      metalness: 0.1,
    });
    const fretboardMesh = new THREE.Mesh(boardGeo, boardMat);
    fretboardMesh.position.set(neckLength / 2, -0.25, 0);
    scene.add(fretboardMesh);

    // 6. Build Bone Nut (at Fret 0)
    const nutGeo = new THREE.BoxGeometry(0.35, 0.7, fretboardWidthNut);
    const nutMat = new THREE.MeshStandardMaterial({ color: 0xefebd8, roughness: 0.4 });
    const nutMesh = new THREE.Mesh(nutGeo, nutMat);
    nutMesh.position.set(0, 0.1, 0);
    scene.add(nutMesh);

    // 7. Nickel Silver Frets
    const fretMat = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      metalness: 0.85,
      roughness: 0.25,
    });

    for (let f = 1; f <= numFrets; f++) {
      const x = fretPositions[f];
      const fretGeo = new THREE.CylinderGeometry(0.04, 0.04, fretboardWidthBridge * 0.98, 8);
      const fretMesh = new THREE.Mesh(fretGeo, fretMat);
      fretMesh.rotation.x = Math.PI / 2;
      fretMesh.position.set(x, 0.04, 0);
      scene.add(fretMesh);
    }

    // 8. Mother of Pearl Position Inlays (Frets 3, 5, 7, 9, 12, 15, 17)
    const inlayMat = new THREE.MeshStandardMaterial({ color: 0xded8ce, roughness: 0.3 });
    const dotFrets = [3, 5, 7, 9, 15, 17];
    dotFrets.forEach((f) => {
      const x = (fretPositions[f - 1] + fretPositions[f]) / 2;
      const dotGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16);
      const dot = new THREE.Mesh(dotGeo, inlayMat);
      dot.position.set(x, 0.02, 0);
      scene.add(dot);
    });

    // 12th Fret Double Inlay
    const x12 = (fretPositions[11] + fretPositions[12]) / 2;
    [-0.7, 0.7].forEach((offsetZ) => {
      const dotGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.02, 16);
      const dot = new THREE.Mesh(dotGeo, inlayMat);
      dot.position.set(x12, 0.02, offsetZ);
      scene.add(dot);
    });

    // 9. Steel Strings (Thick Low E to thin High E)
    const stringMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      metalness: 0.95,
      roughness: 0.2,
    });

    for (let s = 0; s < numStrings; s++) {
      const thickness = 0.025 + (5 - s) * 0.015; // Low E is thicker
      const stringGeo = new THREE.CylinderGeometry(thickness, thickness, neckLength, 8);
      const stringMesh = new THREE.Mesh(stringGeo, stringMat);
      stringMesh.rotation.z = Math.PI / 2;
      const zPos = ((s - 2.5) / 5) * (fretboardWidthNut * 0.85);
      stringMesh.position.set(neckLength / 2, 0.18, zPos);
      scene.add(stringMesh);
    }

    // 10. Container Group for dynamic note balls
    const activeBallsGroup = new THREE.Group();
    scene.add(activeBallsGroup);
    activeBallsGroupRef.current = activeBallsGroup;

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight || 280;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Active Notes on Fretboard when currentTime updates
  useEffect(() => {
    if (!activeBallsGroupRef.current || !events.length) return;
    const group = activeBallsGroupRef.current;

    // Clear previous dynamic indicators
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    // Find currently active notes (time <= currentTime < time + duration)
    const active = events.filter((e) => currentTime >= e.time && currentTime < e.time + Math.max(0.12, e.duration));
    // Find upcoming notes within 0.75 seconds for trajectory preview
    const upcoming = events.filter((e) => e.time > currentTime && e.time <= currentTime + 0.75);

    // 1. Draw Active Notes (Amber / Coral Glowing Spheres)
    active.forEach((note) => {
      const s = note.string;
      const f = note.fret;

      // Z coordinate across string
      const zPos = ((s - 2.5) / 5) * (fretboardWidthNut * 0.85);

      if (f === 0) {
        // Open string indicator: Glowing ring at the nut
        const openGeo = new THREE.TorusGeometry(0.25, 0.06, 12, 24);
        const openMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const ring = new THREE.Mesh(openGeo, openMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.set(0, 0.35, zPos);
        group.add(ring);
      } else {
        // Fretted note: Sphere located between fret f-1 and fret f
        const xPos = (fretPositions[f - 1] + fretPositions[f]) / 2;
        const sphereGeo = new THREE.SphereGeometry(0.24, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: 0xf97316, // Vibrant Amber
          emissive: 0xe05600,
          emissiveIntensity: 0.9,
          roughness: 0.2,
        });
        const ball = new THREE.Mesh(sphereGeo, sphereMat);
        ball.position.set(xPos, 0.38, zPos);
        group.add(ball);

        // Note ring light around fret
        const ringGeo = new THREE.RingGeometry(0.26, 0.36, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(xPos, 0.05, zPos);
        group.add(ring);
      }
    });

    // 2. Draw Upcoming Target Circles & Hop Trajectory Arcs
    upcoming.slice(0, 4).forEach((note) => {
      const s = note.string;
      const f = note.fret;
      const zPos = ((s - 2.5) / 5) * (fretboardWidthNut * 0.85);

      if (f > 0) {
        const xPos = (fretPositions[f - 1] + fretPositions[f]) / 2;
        const targetGeo = new THREE.RingGeometry(0.18, 0.26, 20);
        const targetMat = new THREE.MeshBasicMaterial({
          color: 0xa855f7, // DeepFret violet coming target
          side: THREE.DoubleSide,
        });
        const target = new THREE.Mesh(targetGeo, targetMat);
        target.rotation.x = -Math.PI / 2;
        target.position.set(xPos, 0.06, zPos);
        group.add(target);
      }
    });
  }, [currentTime, events]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-paper-border bg-studio-900 shadow-xl">
      {/* 3D Canvas Viewport */}
      <div ref={containerRef} className="w-full h-64 md:h-72 cursor-grab active:cursor-grabbing" />

      {/* Legend & Tuning Overlay */}
      <div className="absolute top-3 left-3 flex items-center gap-3 bg-studio-800/80 backdrop-blur px-3 py-1.5 rounded-lg border border-studio-700 text-[11px] text-paper font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
          <span>Active Strike</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
          <span>Next Fret</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
          <span>Open String</span>
        </div>
      </div>

      {/* Tuning Labels along nut */}
      <div className="absolute bottom-3 left-4 flex gap-1.5 text-[10px] font-mono font-bold bg-studio-800/90 text-guitar-gold px-2.5 py-1 rounded border border-studio-700">
        <span>Tuning:</span>
        <span>{tuningNames.join(' ')}</span>
      </div>
    </div>
  );
};
