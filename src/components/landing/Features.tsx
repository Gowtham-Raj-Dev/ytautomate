import { Reveal } from "./Reveal";
import { MdFlashOn, MdLink, MdDashboard, MdGpsFixed, MdLock, MdTrendingUp } from "react-icons/md";
import styles from "@/styles/Landing.module.css";

const FEATURES = [
  {
    icon: <MdFlashOn />,
    title: "Instant uploads",
    desc: "Skip YouTube Studio entirely. Drag, drop, and publish your Short in a single flow.",
  },
  {
    icon: <MdLink />,
    title: "One-click channel connect",
    desc: "Securely link your YouTube channel with Google sign-in. No API keys to manage.",
  },
  {
    icon: <MdDashboard />,
    title: "Upload dashboard",
    desc: "Track total uploads, last activity, and channel status from one clean dashboard.",
  },
  {
    icon: <MdGpsFixed />,
    title: "Shorts-optimized",
    desc: "Automatic Shorts validation for format, size, and aspect ratio before publishing.",
  },
  {
    icon: <MdLock />,
    title: "Privacy controls",
    desc: "Publish as Public, Unlisted, or Private — you decide who sees every Short.",
  },
  {
    icon: <MdTrendingUp />,
    title: "Real-time progress",
    desc: "Resumable uploads with live progress so you always know exactly what's happening.",
  },
];

export function Features() {
  return (
    <section id="features" className={styles.section}>
      <div className="container">
        <Reveal className={styles.sectionHead}>
          <span className={styles.eyebrow}>Features</span>
          <h2 className={styles.sectionTitle}>Everything you need to ship Shorts</h2>
          <p className={styles.sectionSub}>
            Built for creators who post daily. YT Automate removes every step
            between recording and publishing.
          </p>
        </Reveal>

        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} as="article" delay={i * 0.06} className={styles.featureCard}>
              <span className={styles.featureIcon} aria-hidden>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
