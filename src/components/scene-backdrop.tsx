"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function SceneBackdrop() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      46,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      1000,
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight("#d8fff7", 0.6);
    const key = new THREE.PointLight("#7dd4c2", 4, 30);
    key.position.set(2.5, 1.4, 6);
    scene.add(ambient, key);

    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.6, 12),
      new THREE.MeshPhysicalMaterial({
        color: "#dffcf6",
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      }),
    );

    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(2.5, 0.012, 12, 240),
      new THREE.MeshBasicMaterial({
        color: "#7dd4c2",
        transparent: true,
        opacity: 0.18,
      }),
    );

    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(3.15, 0.01, 12, 240),
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.1,
      }),
    );
    ringB.rotation.x = Math.PI / 2.7;
    ringB.rotation.y = Math.PI / 8;

    scene.add(orb, ringA, ringB);

    const particleCount = 260;
    const positions = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 18;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    const stars = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.36,
        size: 0.018,
      }),
    );
    stars.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    scene.add(stars);

    const onResize = () => {
      camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };

    let frame = 0;

    const render = () => {
      frame = window.requestAnimationFrame(render);
      const time = performance.now() * 0.00018;

      smoothRef.current.x += (pointerRef.current.x - smoothRef.current.x) * 0.045;
      smoothRef.current.y += (pointerRef.current.y - smoothRef.current.y) * 0.045;

      orb.rotation.x = time * 1.4 + smoothRef.current.y * 0.18;
      orb.rotation.y = time * 2 + smoothRef.current.x * 0.28;
      ringA.rotation.z = -time * 1.2;
      ringA.rotation.y = time * 0.45 + smoothRef.current.x * 0.15;
      ringB.rotation.z = time * 0.9;
      stars.rotation.y = time * 0.2;

      camera.position.x = smoothRef.current.x * 0.55;
      camera.position.y = -smoothRef.current.y * 0.3;
      camera.lookAt(smoothRef.current.x * 0.6, -smoothRef.current.y * 0.3, 0);

      renderer.render(scene, camera);
    };

    window.addEventListener("resize", onResize);
    container.addEventListener("pointermove", onPointerMove);
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("pointermove", onPointerMove);
      renderer.dispose();
      orb.geometry.dispose();
      (orb.material as THREE.Material).dispose();
      ringA.geometry.dispose();
      (ringA.material as THREE.Material).dispose();
      ringB.geometry.dispose();
      (ringB.material as THREE.Material).dispose();
      stars.geometry.dispose();
      (stars.material as THREE.Material).dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0" />;
}
