import Link from "next/link";
import Image from "next/image";
import styles from "@/styles/Logo.module.css";

interface LogoProps {
  href?: string;
  compact?: boolean;
}

export function Logo({ href = "/", compact = false }: LogoProps) {
  const content = (
    <span className={styles.logo}>
      <span className={styles.mark}>
        <Image 
          src="/favicon.ico" 
          alt="Logo" 
          width={28} 
          height={28} 
          className={styles.logoImg}
        />
      </span>
      {!compact && (
        <span className={styles.text}>
          YT <span className={styles.accent}>Automate</span>
        </span>
      )}
    </span>
  );

  return (
    <Link href={href} className={styles.link} aria-label="YT Automate home">
      {content}
    </Link>
  );
}
