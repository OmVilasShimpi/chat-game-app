import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

export default function BlastFX({ active = false, duration = 650, onDone }) {
  const { camera } = useThree();
  const start = useRef(null);
  const original = useRef({ x: camera.position.x, y: camera.position.y, z: camera.position.z });

  useEffect(() => {
    if (active) {
      start.current = performance.now();
      original.current = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      };
    }
  }, [active]);

  useFrame(() => {
    if (!active || start.current == null) return;

    const t = performance.now() - start.current;
    const k = Math.max(0, 1 - t / duration); // decay 1..0
    const amp = 0.05 * k;                    // max shake amplitude

    camera.position.x = original.current.x + (Math.random() - 0.5) * 2 * amp;
    camera.position.y = original.current.y + (Math.random() - 0.5) * 2 * amp;
    camera.position.z = original.current.z + (Math.random() - 0.5) * 1 * amp;
    camera.lookAt(0, 0, 0);

    if (t >= duration) {
      camera.position.set(original.current.x, original.current.y, original.current.z);
      start.current = null;
      onDone?.();
    }
  });

  return null;
}
