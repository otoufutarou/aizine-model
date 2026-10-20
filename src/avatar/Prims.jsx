import { createElement } from 'react';

// Low-poly box: <B a={[w, h, d]} pos={[..]} c="#fff" />
export function B({ a, pos, rot, c = '#fff', rough = 0.85, metal = 0, children, ...mat }) {
  return (
    <mesh position={pos} rotation={rot} castShadow>
      <boxGeometry args={a} />
      <meshStandardMaterial color={c} roughness={rough} metalness={metal} flatShading {...mat} />
      {children}
    </mesh>
  );
}

// Generic primitive: <P g="cylinder" a={[...]} />
export function P({ g, a, pos, rot, scale, c = '#fff', rough = 0.85, metal = 0, children, ...mat }) {
  return (
    <mesh position={pos} rotation={rot} scale={scale} castShadow>
      {createElement(`${g}Geometry`, { args: a })}
      <meshStandardMaterial color={c} roughness={rough} metalness={metal} flatShading {...mat} />
      {children}
    </mesh>
  );
}

// Flat decal with a transparent texture
export function Decal({ map, size, pos, rot }) {
  return (
    <mesh position={pos} rotation={rot}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={map} transparent alphaTest={0.05} />
    </mesh>
  );
}
