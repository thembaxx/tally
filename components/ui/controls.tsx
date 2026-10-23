'use client';
// Adapted from EasyUI AnimatedTabs and StretchSwitch (MIT). See THIRD_PARTY_NOTICES.md.
import { motion } from 'motion/react';
import { useId, useState, type ReactNode } from 'react';
export function Segmented({
  items,
  value,
  onChange,
  label,
}: {
  items: { id: string; label: string; icon?: ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div className="segmented" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          type="button"
          data-tally-sound="select"
          key={item.id}
          aria-pressed={value === item.id}
          onClick={() => onChange(item.id)}
        >
          {value === item.id && (
            <motion.span
              className="segment-active"
              layoutId={id}
              transition={{ type: 'spring', stiffness: 450, damping: 34 }}
            />
          )}
          <span>
            {item.icon}
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      className={`switch ${checked ? 'on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onClick={() => onChange(!checked)}
    >
      <motion.span
        animate={{ x: checked ? 20 : 0, scaleX: pressed ? 1.18 : 1, scaleY: pressed ? 0.88 : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
