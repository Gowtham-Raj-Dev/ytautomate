import styles from "@/styles/Spinner.module.css";

interface SpinnerProps {
  size?: number;
  label?: string;
}

export function Spinner({ size = 20, label }: SpinnerProps) {
  return (
    <span className={styles.wrap} role="status" aria-live="polite">
      <span
        className={styles.spinner}
        style={{ width: size, height: size }}
        aria-hidden
      />
      {label ? <span className={styles.label}>{label}</span> : null}
      <span className={styles.sr}>Loading…</span>
    </span>
  );
}

/** Full-screen centered loader. */
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className={styles.page}>
      <Spinner size={32} label={label} />
    </div>
  );
}
