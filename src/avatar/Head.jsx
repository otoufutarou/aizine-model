import { P } from './Prims.jsx';

const SKIN = '#f7d9cb';
const HAIR = '#3a2216';
const HAIR_HI = '#5b3a24';
const RY = 0.1;
// Surface depth of the head ellipsoid at (x, y) relative to the head centre.
const faceZ = (x, y) => 0.092 * Math.sqrt(Math.max(0, 1 - (x / 0.09) ** 2 - (y / 0.105) ** 2));

function Eye({ s }) {
  const x = s * 0.04;
  const y = -0.004;
  const z = faceZ(x, y) + 0.001;
  return (
    <group position={[x, y, z]} rotation={[0, s * 0.35, s * 0.09]}>
      <P g="sphere" a={[0.02, 20, 12]} scale={[1.45, 0.66, 0.3]} c="#ffffff" rough={0.3} castShadow={false} />
      <P g="sphere" a={[0.0145, 20, 12]} pos={[0, 0, 0.003]} scale={[1, 1.05, 0.4]} c="#6a2742" rough={0.3} castShadow={false} />
      <P g="sphere" a={[0.008, 16, 10]} pos={[0, 0, 0.005]} scale={[1, 1.1, 0.4]} c="#1a0d12" rough={0.3} castShadow={false} />
      <P g="sphere" a={[0.0042, 10, 8]} pos={[s * -0.005, 0.005, 0.007]} c="#ffffff" emissive="#ffffff" castShadow={false} />
      {/* liner with a winged tip */}
      <P g="box" a={[0.064, 0.0065, 0.004]} pos={[0, 0.0125, 0.003]} rot={[0, 0, 0]} c="#120a0e" castShadow={false} />
      <P g="box" a={[0.026, 0.005, 0.004]} pos={[s * 0.036, 0.021, 0.003]} rot={[0, 0, s * 0.5]} c="#120a0e" castShadow={false} />
      {/* pink shadow */}
      <P g="sphere" a={[0.02, 14, 8]} pos={[0, 0.02, 0]} scale={[1.5, 0.45, 0.25]} c="#ff8fc4" transparent opacity={0.55} castShadow={false} />
    </group>
  );
}

function Brow({ s }) {
  const x = s * 0.042;
  const y = 0.046;
  return (
    <P g="box" a={[0.036, 0.004, 0.005]} pos={[x, y, faceZ(x, y) + 0.001]} rot={[0, s * 0.35, s * 0.02]} c="#4a2a1a" castShadow={false} />
  );
}

export function Head({ outfit }) {
  const o = outfit;
  const bangs = [-3, -2, -1, 0, 1, 2, 3];
  return (
    <group>
      <group position={[0, 0.09, 0]}>
        {/* skull + jaw */}
        <P g="sphere" a={[RY, 32, 24]} scale={[0.9, 1.05, 0.92]} c={SKIN} rough={0.55} />
        <P g="sphere" a={[0.075, 24, 16]} pos={[0, -0.05, 0.012]} scale={[0.85, 0.95, 0.9]} c={SKIN} rough={0.55} />

        <Eye s={1} />
        <Eye s={-1} />
        <Brow s={1} />
        <Brow s={-1} />
        <P g="sphere" a={[0.009, 12, 8]} pos={[0, -0.028, faceZ(0, -0.028) + 0.003]} c="#f0c3b2" castShadow={false} />
        <P g="torus" a={[0.013, 0.0025, 8, 16, Math.PI]} pos={[0, -0.05, faceZ(0, -0.05) + 0.003]} rot={[0, 0, Math.PI]} c="#e0457f" castShadow={false} />
        {[1, -1].map((s) => (
          <P key={s} g="sphere" a={[0.016, 12, 8]} pos={[s * 0.055, -0.026, faceZ(s * 0.055, -0.026) - 0.002]} scale={[1.2, 0.7, 0.3]} rot={[0, s * 0.8, 0]} c="#ff7fb4" transparent opacity={0.4} castShadow={false} />
        ))}
        {/* ears + earrings */}
        {[1, -1].map((s) => (
          <group key={s}>
            <P g="sphere" a={[0.016, 12, 8]} pos={[s * 0.088, -0.005, -0.005]} scale={[0.5, 1, 0.8]} c={SKIN} />
            <P g="sphere" a={[0.007, 10, 8]} pos={[s * 0.094, -0.025, -0.003]} c="#d9dbe6" metal={0.9} rough={0.2} />
            {o.extras.includes('hoops') && (
              <P g="torus" a={[0.015, 0.002, 8, 20]} pos={[s * 0.094, -0.042, -0.003]} rot={[0, Math.PI / 2, 0]} c="#d9dbe6" metal={0.9} rough={0.2} />
            )}
          </group>
        ))}

        {/* hair cap */}
        <P g="sphere" a={[0.106, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.4]} pos={[0, 0.006, -0.004]} scale={[0.93, 1.06, 0.97]} c={HAIR} rough={0.4} side={2} />
        {/* back hair, long to the waist */}
        <P g="sphere" a={[0.1, 28, 20]} pos={[0, -0.17, -0.062]} scale={[1.12, 3.5, 0.78]} c={HAIR} rough={0.4} />
        <P g="sphere" a={[0.108, 28, 20, Math.PI, Math.PI, 0, Math.PI * 0.72]} pos={[0, 0.0, -0.004]} scale={[0.95, 1.08, 0.98]} c={HAIR} rough={0.4} side={2} />
        {/* face-framing locks */}
        {[1, -1].map((s) => (
          <P key={s} g="capsule" a={[0.021, 0.24, 6, 12]} pos={[s * 0.097, -0.03, 0.006]} rot={[0.05, 0, s * 0.04]} c={HAIR} rough={0.4} />
        ))}
        {/* bangs */}
        {bangs.map((i) => {
          const x = i * 0.027;
          const y = 0.063;
          return (
            <P
              key={i}
              g="capsule"
              a={[0.0155, 0.05, 4, 8]}
              pos={[x, y, faceZ(x, y) + 0.01]}
              rot={[-0.12, 0, -x * 5 + (i === 0 ? 0.15 : 0)]}
              c={i % 2 ? HAIR_HI : HAIR}
              rough={0.4}
            />
          );
        })}

        {/* accessories */}
        {o.extras.includes('ribbon') && (
          <group position={[0.075, 0.075, 0.03]} rotation={[0, 0.5, -0.4]}>
            <P g="sphere" a={[0.026, 16, 10]} pos={[0.028, 0, 0]} scale={[1.2, 0.9, 0.5]} c="#ff4fa3" />
            <P g="sphere" a={[0.026, 16, 10]} pos={[-0.028, 0, 0]} scale={[1.2, 0.9, 0.5]} c="#ff4fa3" />
            <P g="sphere" a={[0.013, 12, 8]} c="#ffd1e6" />
          </group>
        )}
        {o.extras.includes('glasses') && (
          <group rotation={[-0.95, 0, 0]}>
            {[1, -1].map((s) => (
              <P key={s} g="torus" a={[0.022, 0.004, 8, 20]} pos={[s * 0.03, 0, 0.112]} scale={[1.3, 0.9, 1]} c="#c9ccd6" metal={0.9} rough={0.2} />
            ))}
            {[1, -1].map((s) => (
              <P key={`l${s}`} g="circle" a={[0.022, 20]} pos={[s * 0.03, 0, 0.112]} scale={[1.3, 0.9, 1]} c="#14121a" rough={0.1} metal={0.6} />
            ))}
            <P g="box" a={[0.02, 0.004, 0.004]} pos={[0, 0, 0.112]} c="#c9ccd6" metal={0.9} rough={0.2} />
          </group>
        )}
      </group>
    </group>
  );
}
