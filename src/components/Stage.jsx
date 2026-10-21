import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Avatar } from '../avatar/Avatar.jsx';
import { getOutfit } from '../data/outfits.js';
import { getPose } from '../data/poses.js';
import { getBackground } from '../data/backgrounds.js';

// Smoothly moves the camera between full-body and face close-up views.
function CameraRig({ closeUp }) {
  const { camera, controls } = useThree();
  const goal = useRef({ t: [0, 0.72, 0], d: 4.3 });
  goal.current = closeUp ? { t: [0, 1.38, 0], d: 2.1 } : { t: [0, 0.72, 0], d: 4.3 };
  useFrame(() => {
    if (!controls) return;
    const { t, d } = goal.current;
    controls.target.y += (t[1] - controls.target.y) * 0.12;
    const dir = camera.position.clone().sub(controls.target);
    const cur = dir.length();
    const next = cur + (d - cur) * 0.12;
    if (Math.abs(next - cur) > 0.0005 || Math.abs(t[1] - controls.target.y) > 0.0005) {
      dir.setLength(next);
      camera.position.copy(controls.target).add(dir);
      controls.update();
    }
  });
  return null;
}

function Props({ bg }) {
  const group = useRef();
  useFrame(({ clock }) => {
    if (group.current && bg.id === 'dream') group.current.rotation.y = clock.elapsedTime * 0.05;
  });

  if (bg.id === 'night') {
    const towers = [-5, -3.6, -2.2, 2.4, 3.8, 5.2];
    return (
      <group position={[0, 0, -4]}>
        {towers.map((x, i) => (
          <group key={x} position={[x, 0, -i * 0.2]}>
            <mesh position={[0, 1.6 + (i % 3) * 0.8, 0]}>
              <boxGeometry args={[1.0, 3.2 + (i % 3) * 1.6, 1]} />
              <meshStandardMaterial color="#120d20" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.2 + (i % 3) * 0.6, 0.51]}>
              <boxGeometry args={[0.7, 0.08, 0.02]} />
              <meshBasicMaterial color={i % 2 ? '#ff4fa3' : '#38e8ff'} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 2.4, -1]}>
          <torusGeometry args={[1.2, 0.04, 8, 48]} />
          <meshBasicMaterial color="#ff4fa3" />
        </mesh>
      </group>
    );
  }
  if (bg.id === 'silver') {
    return (
      <group>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 1.6, 0.02, 0.5]}>
            <boxGeometry args={[0.06, 0.04, 6]} />
            <meshBasicMaterial color="#ff4fa3" />
          </mesh>
        ))}
        <mesh position={[0, 2.6, -3.5]}>
          <boxGeometry args={[6, 0.08, 0.08]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.9, -3.6]}>
          <boxGeometry args={[4.4, 1.8, 0.05]} />
          <meshStandardMaterial color="#9fa2b3" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    );
  }
  if (bg.id === 'dream') {
    return (
      <group ref={group}>
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const r = 3 + (i % 3) * 0.6;
          return (
            <mesh key={i} position={[Math.cos(a) * r, 0.8 + (i % 5) * 0.55, Math.sin(a) * r - 1]}>
              <icosahedronGeometry args={[0.12 + (i % 3) * 0.05, 0]} />
              <meshBasicMaterial color={['#ffe27a', '#ffffff', '#ff8fc4'][i % 3]} />
            </mesh>
          );
        })}
      </group>
    );
  }
  // studio
  return (
    <group>
      <mesh position={[0, 1.5, -3.5]}>
        <circleGeometry args={[2.4, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.28} />
      </mesh>
      {[-2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, 1.2, -2.5]}>
          <boxGeometry args={[0.12, 2.4, 0.12]} />
          <meshStandardMaterial color="#c9ccd6" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export function Stage({ outfitId, poseId, expressionId, bgId, autoRotate, closeUp }) {
  const outfit = getOutfit(outfitId);
  const pose = getPose(poseId);
  const bg = getBackground(bgId);
  return (
    <div className="stage" style={{ background: bg.css }}>
      <Canvas
        shadows
        flat
        dpr={[1, 2]}
        camera={{ position: [0, 0.85, 4.3], fov: 34 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
      >
        <hemisphereLight args={['#ffffff', bg.id === 'night' ? '#5a2a8a' : '#ffb3d6', 1.3]} />
        <directionalLight position={[2.5, 4, 3]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 2, -2]} intensity={0.8} color={bg.id === 'night' ? '#38e8ff' : '#ff9fd0'} />
        <Suspense fallback={null}>
          <Props bg={bg} />
          <Avatar outfit={outfit} pose={pose} expression={expressionId} />
          {/* pedestal */}
          <mesh position={[0, -0.03, 0]} receiveShadow>
            <cylinderGeometry args={[0.85, 0.9, 0.06, 64]} />
            <meshStandardMaterial color={bg.floor} roughness={0.4} metalness={bg.id === 'silver' ? 0.6 : 0.1} />
          </mesh>
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.72, 0.78, 64]} />
            <meshBasicMaterial color={bg.ring} />
          </mesh>
          <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={4} blur={2.4} far={1.5} />
        </Suspense>
        <CameraRig closeUp={closeUp} />
        <OrbitControls
          makeDefault
          target={[0, 0.72, 0]}
          enablePan={false}
          minDistance={1.2}
          maxDistance={6}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.55}
          autoRotate={autoRotate}
          autoRotateSpeed={2.5}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
