'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, OrbitControls, ContactShadows } from '@react-three/drei';
import { Component, useEffect, useRef, useState, type ReactNode, type ComponentRef } from 'react';
import { Group, MathUtils } from 'three';
import {
  ScalesIcon,
  ArrowClockwiseIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ChartBarIcon,
  StackIcon,
} from '@phosphor-icons/react';

type Props = {
  kind?: 'scale' | 'tower' | 'bars';
  values?: number[];
  maxValue?: number;
  tilt?: number;
  blocks?: number;
  order?: string[];
  compact?: boolean;
};
function Box({
  position,
  scale,
  color,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  rotation?: [number, number, number];
}) {
  return (
    <RoundedBox
      args={scale}
      radius={Math.min(...scale) * 0.25}
      smoothness={3}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.32} metalness={0.07} />
    </RoundedBox>
  );
}
function Coin({
  position,
  color = '#f5c553',
}: {
  position: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.09, 40]} />
        <meshStandardMaterial color={color} roughness={0.24} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.049, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.21, 0.012, 8, 40]} />
        <meshStandardMaterial color="#ffe4a0" metalness={0.35} roughness={0.2} />
      </mesh>
    </group>
  );
}
function Falling({ children, still }: { children: ReactNode; still: boolean }) {
  const ref = useRef<Group>(null);
  const age = useRef(0);
  useFrame((_, dt) => {
    age.current += dt;
    if (ref.current)
      ref.current.position.y = still ? 0 : Math.max(0, 1.4 - 3 * age.current * age.current);
  });
  return (
    <group ref={ref} position={[0, still ? 0 : 1.4, 0]}>
      {children}
    </group>
  );
}
function Pan({
  x,
  side,
  blocks,
  still,
}: {
  x: number;
  side: number;
  blocks: number;
  still: boolean;
}) {
  return (
    <group position={[x, 0, 0]}>
      {[-1, 1].map((z) => (
        <group key={z}>
          <mesh position={[0, -0.48, z * 0.3]} rotation={[0, 0, side * 0.12]}>
            <cylinderGeometry args={[0.016, 0.016, 0.98, 12]} />
            <meshStandardMaterial color="#726454" metalness={0.5} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -1.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.66, 0.48, 0.14, 64]} />
        <meshStandardMaterial color="#efb477" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.94, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.61, 0.035, 12, 64]} />
        <meshStandardMaterial color="#ffd8a5" metalness={0.25} roughness={0.2} />
      </mesh>
      {side < 0 ? (
        blocks >= 1 && (
          <Falling still={still}>
            <group position={[0, -0.65, 0]}>
              <Box
                position={[0, 0, 0]}
                scale={[0.7, 0.55, 0.63]}
                color="#77c7a4"
                rotation={[0, 0.2, 0]}
              />
              <Box
                position={[0, 0.3, 0]}
                scale={[0.75, 0.08, 0.67]}
                color="#a4e0c2"
                rotation={[0, 0.2, 0]}
              />
            </group>
          </Falling>
        )
      ) : (
        <>
          {blocks >= 2 && (
            <Falling still={still}>
              <Box
                position={[0.26, -0.66, 0.03]}
                scale={[0.4, 0.45, 0.43]}
                color="#b99ae9"
                rotation={[0, -0.3, 0]}
              />
            </Falling>
          )}
          {blocks >= 3 && (
            <Falling still={still}>
              <Coin position={[-0.2, -0.86, 0]} />
              <Coin position={[-0.2, -0.76, 0]} />
              <Coin position={[-0.2, -0.66, 0]} />
              <Coin position={[-0.2, -0.56, 0]} />
            </Falling>
          )}
        </>
      )}
    </group>
  );
}
function Scale({
  tilt = 0,
  blocks = 0,
  still = false,
}: {
  tilt: number;
  blocks: number;
  still?: boolean;
}) {
  const beam = useRef<Group>(null);
  const group = useRef<Group>(null);
  useFrame((state, dt) => {
    if (beam.current)
      beam.current.rotation.z = still ? tilt : MathUtils.damp(beam.current.rotation.z, tilt, 5, dt);
    if (group.current)
      group.current.position.y = still ? 0 : Math.sin(state.clock.elapsedTime * 0.7) * 0.025;
  });
  return (
    <group ref={group} position={[0, -0.22, 0]} rotation={[0, -0.12, 0]}>
      <Box position={[0, -1.35, 0]} scale={[1.5, 0.21, 1.08]} color="#eeaa73" />
      <Box position={[0, -1.2, 0]} scale={[1.13, 0.13, 0.77]} color="#f7c58e" />
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} position={[x * 0.53, -1.49, z * 0.32]}>
            <cylinderGeometry args={[0.1, 0.12, 0.11, 20]} />
            <meshStandardMaterial color="#9b7159" />
          </mesh>
        )),
      )}
      <mesh position={[0, -0.13, 0]} castShadow>
        <cylinderGeometry args={[0.095, 0.16, 2.1, 32]} />
        <meshStandardMaterial color="#e3aa70" metalness={0.25} roughness={0.3} />
      </mesh>
      {[0, 0.1, 0.2].map((n) => (
        <mesh key={n} position={[0, -1.02 + n, 0]}>
          <cylinderGeometry args={[0.21 - n * 0.2, 0.21 - n * 0.2, 0.04, 32]} />
          <meshStandardMaterial color="#f3c58c" />
        </mesh>
      ))}
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="#fa9c79" roughness={0.3} />
      </mesh>
      <group ref={beam} position={[0, 0.86, 0]}>
        <Box position={[0, 0, 0]} scale={[3.65, 0.15, 0.23]} color="#7184ed" />
        <Box position={[0, 0.06, 0]} scale={[0.43, 0.29, 0.38]} color="#f4b88f" />
        <mesh position={[0, 0.07, 0.23]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.085, 0.085, 0.12, 24]} />
          <meshStandardMaterial color="#bd8562" metalness={0.5} />
        </mesh>
        <Pan x={-1.52} side={-1} blocks={blocks} still={still} />
        <Pan x={1.52} side={1} blocks={blocks} still={still} />
        {[-1, 1].map((x) => (
          <mesh key={x} position={[x * 1.52, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.075, 0.024, 8, 20]} />
            <meshStandardMaterial color="#e6c19a" metalness={0.5} />
          </mesh>
        ))}
      </group>
      <Box position={[0, -1.22, 0.397]} scale={[0.52, 0.11, 0.015]} color="#bc8966" />
    </group>
  );
}
function Tower({ order = [] }: { order: string[] }) {
  const colors = ['#7a94ed', '#ba96e4', '#eac767', '#7ac6a1', '#8bacc5'];
  const originals = useRef(order.slice());
  return (
    <group position={[0, -0.8, 0]} rotation={[0, 0.3, 0]}>
      {originals.current.map((line, i) => (
        <Slab key={line} color={colors[i % 5]} index={order.indexOf(line)} />
      ))}
      <Box position={[0, -0.3, 0]} scale={[2.5, 0.18, 1.9]} color="#e7ccac" />
    </group>
  );
}
function Slab({ color, index }: { color: string; index: number }) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current)
      ref.current.position.y = MathUtils.damp(ref.current.position.y, index * 0.38, 7, dt);
  });
  return (
    <group ref={ref} position={[0, 0, 0]}>
      <Box position={[0, 0, 0]} scale={[2, 0.3, 1.5]} color={color} />
      <Box position={[0.68, 0, 0.755]} scale={[0.12, 0.1, 0.02]} color="#fff1d8" />
    </group>
  );
}
function Bars({ values, maxValue }: { values: number[]; maxValue?: number }) {
  const maximum = maxValue || Math.max(1, ...values);
  return (
    <group position={[0, -1.1, 0]}>
      <Box position={[0, -0.13, 0]} scale={[3.2, 0.18, 1.4]} color="#d6d9e5" />
      {values.map((v, i) => (
        <Bar
          key={i}
          value={(v / maximum) * 2}
          x={(i - (values.length - 1) / 2) * 1.02}
          color={['#7a94ed', '#ba96e4', '#7ac6a1'][i % 3]}
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <Box
          key={i}
          position={[-1.7, i * 0.25, 0.4]}
          scale={[i % 2 === 0 ? 0.18 : 0.1, 0.02, 0.02]}
          color="#ac977d"
        />
      ))}
    </group>
  );
}
function Bar({ value, x, color }: { value: number; x: number; color: string }) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.scale.y = MathUtils.damp(ref.current.scale.y, Math.max(0.02, value), 7, dt);
      ref.current.position.y = ref.current.scale.y / 2;
    }
  });
  return (
    <group ref={ref} position={[x, 0.5, 0]} scale={[1, 1, 1]}>
      <Box position={[0, 0, 0]} scale={[0.7, 1, 0.8]} color={color} />
    </group>
  );
}
function Fallback({ kind = 'scale' }: { kind?: Props['kind'] }) {
  const Icon = kind === 'bars' ? ChartBarIcon : kind === 'tower' ? StackIcon : ScalesIcon;
  return (
    <div className="scene-fallback">
      <Icon size={112} weight="duotone" />
      <span>
        {kind === 'scale' ? 'Assets = Liabilities + Equity' : 'Explore with the controls below.'}
      </span>
    </div>
  );
}
class Boundary extends Component<
  { children: ReactNode; kind?: Props['kind'] },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Fallback kind={this.props.kind} /> : this.props.children;
  }
}
export default function Scene({
  kind = 'scale',
  tilt = 0,
  blocks = 3,
  order,
  compact,
  values = [],
  maxValue,
}: Props) {
  const [capable, setCapable] = useState<boolean | null>(null);
  const [active, setActive] = useState(false);
  const [still, setStill] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const orbit = useRef<ComponentRef<typeof OrbitControls>>(null);
  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2');
      setCapable(!!gl);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      setCapable(false);
    }
    const q = matchMedia('(prefers-reduced-motion: reduce)');
    setStill(q.matches);
    const change = () => setStill(q.matches);
    q.addEventListener('change', change);
    const el = holder.current;
    let inView = false;
    const update = () => {
      const dialog = document.querySelector('[role="dialog"][data-state="open"]');
      setActive(inView && !document.hidden && (!dialog || (!!el && dialog.contains(el))));
    };
    const io = new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      update();
    });
    // IntersectionObserver still considers a scene behind a dialog visible.
    // Let the foreground activity use the GPU while background scenes pause.
    const dialogs = new MutationObserver(update);
    dialogs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state'],
    });
    document.addEventListener('visibilitychange', update);
    if (el) io.observe(el);
    return () => {
      io.disconnect();
      dialogs.disconnect();
      document.removeEventListener('visibilitychange', update);
      q.removeEventListener('change', change);
    };
  }, []);
  return (
    <div
      ref={holder}
      className={`scene ${compact ? 'compact' : ''}`}
      role="group"
      aria-label={
        kind === 'bars'
          ? 'Interactive 3D comparison. Drag to rotate; pinch to zoom.'
          : kind === 'tower'
            ? 'Interactive statement tower. Drag to rotate; pinch to zoom.'
            : 'Interactive 3D balance scale. Drag to rotate; pinch to zoom.'
      }
    >
      {capable === null ? (
        <div className="scene-loading" />
      ) : !capable ? (
        <Fallback kind={kind} />
      ) : (
        <Boundary kind={kind}>
          <Canvas
            shadows
            dpr={[1, 1.7]}
            frameloop={active ? 'always' : 'never'}
            camera={{ position: [4, 2.7, 7], fov: 37 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          >
            <ambientLight intensity={1.7} />
            <directionalLight
              position={[3, 7, 5]}
              intensity={3.3}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <directionalLight position={[-4, 3, -2]} intensity={2} color="#ffe5cd" />
            {kind === 'bars' ? (
              <Bars values={values} maxValue={maxValue} />
            ) : kind === 'scale' ? (
              <Scale tilt={tilt} blocks={blocks} still={still} />
            ) : (
              <Tower order={order || []} />
            )}
            <ContactShadows position={[0, -1.81, 0]} opacity={0.28} scale={10} blur={2.5} far={5} />
            <OrbitControls
              ref={orbit}
              enablePan={false}
              enableZoom
              minDistance={5}
              maxDistance={11}
              minPolarAngle={0.4}
              maxPolarAngle={Math.PI / 2.05}
              autoRotate={!still && active}
              autoRotateSpeed={0.45}
              target={[0, -0.15, 0]}
            />
          </Canvas>
        </Boundary>
      )}
      {capable && (
        <div className="scene-controls" aria-label="3D view controls">
          <button
            type="button"
            aria-label="Rotate 3D view"
            onClick={() => {
              const c = orbit.current;
              if (c) {
                c.setAzimuthalAngle(c.getAzimuthalAngle() + Math.PI / 4);
                c.update();
              }
            }}
          >
            <ArrowClockwiseIcon />
          </button>
          <button
            type="button"
            aria-label="Zoom 3D view in"
            onClick={() => {
              orbit.current?.dollyIn(1.2);
              orbit.current?.update();
            }}
          >
            <MagnifyingGlassPlusIcon />
          </button>
          <button
            type="button"
            aria-label="Zoom 3D view out"
            onClick={() => {
              orbit.current?.dollyOut(1.2);
              orbit.current?.update();
            }}
          >
            <MagnifyingGlassMinusIcon />
          </button>
        </div>
      )}
    </div>
  );
}
