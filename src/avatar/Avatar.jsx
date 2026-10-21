import { Suspense } from 'react';
import { ProceduralAvatar } from './ProceduralAvatar.jsx';
import { GLBAvatar } from './GLBAvatar.jsx';
import { AVATAR_MODEL_URL } from '../config.js';

export function Avatar(props) {
  if (!AVATAR_MODEL_URL) return <ProceduralAvatar {...props} />;
  return (
    <Suspense fallback={<ProceduralAvatar {...props} />}>
      <GLBAvatar url={AVATAR_MODEL_URL} {...props} />
    </Suspense>
  );
}
