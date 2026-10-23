import { SparkleIcon } from '@phosphor-icons/react';
export function Logo() {
  return (
    <span className="brand">
      <svg viewBox="0 0 40 44" aria-hidden="true">
        <path
          d="M17 4a5 5 0 0 1 10 0v8h7a5 5 0 0 1 0 10h-7v10c0 3 2 4 5 4h2a4 4 0 0 1 0 8h-4c-9 0-14-5-14-13V22H8a5 5 0 0 1 0-10h9Z"
          fill="currentColor"
        />
      </svg>
      <span>
        tally<span className="brand-dot">.</span>
      </span>
    </span>
  );
}
export function Blob({ small = false, happy = false }: { small?: boolean; happy?: boolean }) {
  return (
    <span
      className={`blob ${small ? 'small' : ''} ${happy ? 'happy' : ''}`}
      aria-label="Tali, your learning companion"
      role="img"
    >
      <span className="blob-eye" />
      <span className="blob-eye" />
      <span className="blob-cheek" />
      <SparkleIcon className="blob-spark" weight="fill" />
    </span>
  );
}
