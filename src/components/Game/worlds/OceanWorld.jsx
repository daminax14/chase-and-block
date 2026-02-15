import { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { Sky, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Water } from 'three-stdlib';

extend({ Water });

export function OceanWorld() {
  const ref = useRef();
  // Carichiamo la normal map per le increspature reali
  const waterNormals = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg');
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  useFrame((state, delta) => {
    if (ref.current) ref.current.material.uniforms.time.value += delta * 0.5;
  });

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.4} />
      <Stars count={2000} factor={4} fade speed={1} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 20, 10]} intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} />
      
      <water
        ref={ref}
        args={[new THREE.PlaneGeometry(1000, 1000), {
          textureWidth: 512,
          textureHeight: 512,
          waterColor: 0x001e0f,
          sunColor: 0xffffff,
          sunDirection: new THREE.Vector3(),
          eye: new THREE.Vector3(),
          waterNormals,
          distortionScale: 3.7,
        }]}
        rotation-x={-Math.PI / 2}
        position={[0, -2, 0]}
      />
    </>
  );
}