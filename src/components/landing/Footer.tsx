import { Logo } from "@/components/ui/Logo";
import styles from "@/styles/Landing.module.css";
import Link from "next/link";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "How to use", href: "/how-to-use" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Security", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        <div className={styles.footerBrand}>
          <Logo />
          <p className={styles.footerTagline}>Upload Shorts Faster Than Ever</p>
          <p className={styles.footerDomain}>ytautomate.codelove.in</p>
        </div>

        <div className={styles.footerCols}>
          {COLUMNS.map((col) => (
            <div key={col.title} className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>{col.title}</h4>
              {col.links.map((l) => (
                <Link key={l.label} href={l.href} className={styles.footerLink}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={`container ${styles.footerBottom}`}>
        <span>© {new Date().getFullYear()} YT Automate. All rights reserved.</span>
        <span>Built by CodeLove</span>
      </div>
    </footer>
  );
}
