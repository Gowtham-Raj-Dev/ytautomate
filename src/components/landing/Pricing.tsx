import { Reveal } from "./Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { cx } from "@/lib/utils";
import styles from "@/styles/Landing.module.css";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    desc: "For creators getting started.",
    features: ["10 uploads / month", "1 connected channel", "Public & unlisted", "Basic dashboard"],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/mo",
    desc: "For daily Shorts creators.",
    features: [
      "Unlimited uploads",
      "1 connected channel",
      "All visibility options",
      "Upload history & analytics",
      "Priority processing",
    ],
    cta: "Start Pro",
    featured: true,
  },
  {
    name: "Studio",
    price: "$29",
    period: "/mo",
    desc: "For teams & agencies.",
    features: [
      "Everything in Pro",
      "Up to 5 channels",
      "Team members",
      "Bulk scheduling",
      "Priority support",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className={styles.section}>
      <div className="container">
        <Reveal className={styles.sectionHead}>
          <span className={styles.eyebrow}>Pricing</span>
          <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
          <p className={styles.sectionSub}>
            Start free. Upgrade when you&apos;re ready to scale your channel.
          </p>
        </Reveal>

        <div className={styles.pricingGrid}>
          {PLANS.map((p, i) => (
            <Reveal
              key={p.name}
              as="article"
              delay={i * 0.08}
              className={cx(styles.priceCard, p.featured && styles.priceCardFeatured)}
            >
              {p.featured && <span className={styles.popular}>Most popular</span>}
              <h3 className={styles.planName}>{p.name}</h3>
              <div className={styles.planPrice}>
                {p.price}
                <span className={styles.planPeriod}>{p.period}</span>
              </div>
              <p className={styles.planDesc}>{p.desc}</p>
              <ul className={styles.planFeatures}>
                {p.features.map((f) => (
                  <li key={f}>
                    <span className={styles.check} aria-hidden>✓</span> {f}
                  </li>
                ))}
              </ul>
              <ButtonLink
                href="/login"
                fullWidth
                variant={p.featured ? "primary" : "secondary"}
              >
                {p.cta}
              </ButtonLink>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
