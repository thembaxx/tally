import { SparkleIcon } from '@phosphor-icons/react';
export function Logo() {
  return (
    <span className="brand">
      <img className="brand-mark" src="/brand-mark.webp" alt="" width={40} height={44} />
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
