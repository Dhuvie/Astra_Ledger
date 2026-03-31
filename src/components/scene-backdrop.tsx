"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export type SceneTheme = "light" | "dark";

/**
 * Full-viewport Three.js field — opaque materials, theme-aware colors.
 */
export function SceneBackdrop({ theme }: { theme: SceneTheme }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const light = theme === "light";

    const scene = new THREE.Scene();
    const fogColor = light ? 0xffffff : 0x070709;
    // Light mode changes only the sky/fog to white; keep environment colors/animation consistent.
    // Keep particles/planet visible on the white sky by reducing fog density a lot.
    const fogDensity = reducedMotion
      ? (light ? 0 : 0.028)
      : light
        ? 0
        : 0.036;
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      120,
    );
    camera.position.z = 11;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    // Make light mode actually white sky (otherwise WebGL may clear to black).
    renderer.setClearColor(light ? 0xffffff : 0x000000, 1);
    const pr = Math.min(window.devicePixelRatio, reducedMotion ? 1.25 : 1.75);
    renderer.setPixelRatio(pr);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      reducedMotion ? (light ? 0.12 : 0.2) : light ? 0.18 : 0.38,
      0.5,
      0.88,
    );
    composer.addPass(bloomPass);

    const ambient = new THREE.AmbientLight("#c8fff4", 0.5);
    const key = new THREE.PointLight("#7dd4c2", 5.5, 42);
    key.position.set(2.2, 1.2, 7);
    const rim = new THREE.PointLight("#a78bfa", 2.8, 36);
    rim.position.set(-3.5, -1.2, 4);
    scene.add(ambient, key, rim);

    const orbMat = new THREE.MeshPhysicalMaterial({
      color: light ? 0x0b1220 : "#dffcf6",
      metalness: 0.2,
      roughness: 0.32,
      wireframe: true,
      transparent: false,
    });

    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.55, 10), orbMat);

    const knotColor = 0x0d1a18;
    const knotEmissive = 0x1a3d36;
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.05, 0.22, 180, 24),
      new THREE.MeshStandardMaterial({
        color: knotColor,
        metalness: 0.55,
        roughness: 0.28,
        emissive: knotEmissive,
        // In light mode we keep the knot visible by staying mostly non-glowy.
        emissiveIntensity: light ? 0.15 : 0.38,
      }),
    );
    knot.rotation.x = Math.PI / 2.1;

    const ringColorA = light ? 0x0d9488 : 0x7dd4c2;
    const ringColorB = light ? 0x334155 : 0xe2e8f0;
    const ringColorC = light ? 0x4f46e5 : 0xa78bfa;

    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(2.65, 0.016, 14, 256),
      new THREE.MeshBasicMaterial({
        color: ringColorA,
        transparent: false,
      }),
    );

    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(3.35, 0.014, 12, 256),
      new THREE.MeshBasicMaterial({
        color: ringColorB,
        transparent: false,
      }),
    );
    ringB.rotation.x = Math.PI / 2.65;
    ringB.rotation.y = Math.PI / 7;

    const ringC = new THREE.Mesh(
      new THREE.TorusGeometry(4.05, 0.01, 10, 200),
      new THREE.MeshBasicMaterial({
        color: ringColorC,
        transparent: false,
      }),
    );
    ringC.rotation.x = Math.PI / 3.2;

    scene.add(orb, knot, ringA, ringB, ringC);

    const particleCount = reducedMotion ? 64 : 220;
    const positions = new Float32Array(particleCount * 3);
    const baseY = new Float32Array(particleCount);
    const seeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      baseY[i] = positions[i * 3 + 1];
      seeds[i] = Math.random() * Math.PI * 2;
    }

    // In light mode, use dark particles for strong contrast on white.
    const starColor = light ? 0x0b1220 : 0xf8fafc;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: starColor,
        transparent: false,
        opacity: 1,
        // Light mode needs larger, always-visible points on white.
        size: reducedMotion ? (light ? 0.05 : 0.024) : light ? 0.085 : 0.038,
        sizeAttenuation: true,
        depthWrite: false,
        depthTest: light ? false : true,
      }),
    );
    scene.add(stars);

    const onResize = () => {
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    let frame = 0;

    const render = () => {
      frame = window.requestAnimationFrame(render);
      const time = performance.now() * 0.0002;
      const px = pointerRef.current.x;
      const py = pointerRef.current.y;
      // Faster pointer response (less perceived latency).
      const ease = reducedMotion ? 0.22 : 0.28;

      smoothRef.current.x += (px - smoothRef.current.x) * ease;
      smoothRef.current.y += (py - smoothRef.current.y) * ease;

      const sx = smoothRef.current.x;
      const sy = smoothRef.current.y;

      orb.rotation.x = time * 1.25 + sy * 0.55;
      orb.rotation.y = time * 1.85 + sx * 0.65;
      knot.rotation.z = time * 0.95;
      knot.rotation.y = time * 0.42 + sx * 0.2;

      ringA.rotation.z = -time * 1.15;
      ringA.rotation.y = time * 0.38 + sx * 0.32;
      ringB.rotation.z = time * 0.82 + sy * 0.18;
      ringC.rotation.y = -time * 0.55;
      ringC.rotation.x = Math.PI / 3.2 + sx * 0.12;

      stars.rotation.y = time * 0.18;
      stars.rotation.x = sy * 0.08;

      const positionsAttr = starGeo.getAttribute("position") as THREE.BufferAttribute;
      const posArr = positionsAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i += 1) {
        const ix = i * 3;
        const seed = seeds[i];
        posArr[ix + 1] = baseY[i] + Math.sin(time * 2.8 + seed) * 0.35;
      }
      positionsAttr.needsUpdate = true;

      camera.position.x = sx * 1.55;
      camera.position.y = -sy * 0.95;
      camera.position.z = 11 + Math.sin(time * 0.6) * 0.08;
      camera.lookAt(sx * 0.95, -sy * 0.65, 0);

      key.position.x = 2.2 + sx * 2.4;
      key.position.y = 1.2 - sy * 1.8;
      rim.position.x = -3.5 - sx * 1.2;
      rim.position.y = -1.2 + sy * 1.4;

      composer.render();
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      composer.dispose();
      renderPass.dispose();
      bloomPass.dispose();
      renderer.dispose();
      orb.geometry.dispose();
      orbMat.dispose();
      knot.geometry.dispose();
      (knot.material as THREE.Material).dispose();
      ringA.geometry.dispose();
      (ringA.material as THREE.Material).dispose();
      ringB.geometry.dispose();
      (ringB.material as THREE.Material).dispose();
      ringC.geometry.dispose();
      (ringC.material as THREE.Material).dispose();
      starGeo.dispose();
      (stars.material as THREE.Material).dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme]);

  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0" />;
}
