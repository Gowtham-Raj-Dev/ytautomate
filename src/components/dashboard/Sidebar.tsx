"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { cx } from "@/lib/utils";
import styles from "@/styles/Sidebar.module.css";

import { MdDashboard, MdFileUpload, MdOutlineContentCut, MdLiveTv, MdSettings } from "react-icons/md";

const navLinks = [
  { name: "Dashboard", path: "/dashboard", icon: <MdDashboard /> },
  { name: "Upload Video", path: "/upload", icon: <MdFileUpload /> },
  { name: "Autocut AI", path: "/autocut", icon: <MdOutlineContentCut /> },
  { name: "Your Channel", path: "/channel", icon: <MdLiveTv /> },
  { name: "Settings", path: "/settings", icon: <MdSettings /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoWrap}>
        <Logo href="/" />
      </div>
      
      <nav className={styles.nav}>
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          return (
            <Link
              key={link.path}
              href={link.path}
              className={cx(styles.link, isActive && styles.active)}
            >
              <span className={styles.icon}>{link.icon}</span>
              <span className={styles.label}>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.helpBox}>
          <p>Need help?</p>
          <a href="mailto:support@codelove.in">Contact Support</a>
        </div>
      </div>
    </aside>
  );
}
