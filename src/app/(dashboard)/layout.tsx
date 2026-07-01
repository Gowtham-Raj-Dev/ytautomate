"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import styles from "@/styles/AppLayout.module.css";
import { useQueueProcessor } from "@/hooks/useQueueProcessor";
import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useQueueProcessor();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  return (
    <ProtectedRoute>
      <div className={styles.appContainer}>
        {isMobileOpen && (
          <div className={styles.backdrop} onClick={() => setIsMobileOpen(false)} />
        )}
        <Sidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
        <div className={styles.mainContent}>
          <DashboardHeader onToggleSidebar={() => setIsMobileOpen(v => !v)} />
          <main className={styles.scrollArea}>
            <div className={styles.pageContent}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
