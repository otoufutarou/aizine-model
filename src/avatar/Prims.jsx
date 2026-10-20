import { createElement } from 'react';

// Tiny mesh helper: <P g="sphere" a={[r, 24, 16]} c="#fff" pos={[..]} />
export function P({ g, a, pos, rot, scale, c = '#fff', rough = 0.65, metal = 0, children, castShadow = true, ...mat }) {
  return (
    <mesh position={pos} rotation={rot} scale={scale} castShadow={castShadow}>
      {createElement(`${g}Geometry`, { args: a })}
      <meshStandardMaterial color={c} roughness={rough} metalness={metal} {...mat} />
      {children}
    </mesh>
  );
}
