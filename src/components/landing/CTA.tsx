import { Reveal } from "./Reveal";
import { ButtonLink } from "@/components/ui/Button";
import styles from "@/styles/Landing.module.css";

export function CTA() {
  return (
    <section className={styles.section}>
      <div className="container">
        <Reveal className={styles.ctaCard}>
          <div className={styles.ctaGlow} aria-hidden />
          <h2 className={styles.ctaTitle}>Upload Shorts faster than ever</h2>
          <p className={styles.ctaSub}>
            Join creators who publish without ever opening YouTube Studio. Connect
            your channel and ship your next Short in seconds.
          </p>
          <div className={styles.ctaButtons}>
            <ButtonLink href="/login" size="lg">
              Get Started Free
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
