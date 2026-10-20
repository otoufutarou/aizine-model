import { createElement } from 'react';

// Mesh from a prebuilt geometry (lathe / deformed sphere ...)
export function M({ geo, pos, rot, scale, c = '#fff', rough = 0.85, metal = 0, side, children, ...mat }) {
  return (
    <mesh geometry={geo} position={pos} rotation={rot} scale={scale} castShadow>
      <meshStandardMaterial color={c} roughness={rough} metalness={metal} side={side} flatShading {...mat} />
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
