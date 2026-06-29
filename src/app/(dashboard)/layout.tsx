"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import styles from "@/styles/AppLayout.module.css";
import { useQueueProcessor } from "@/hooks/useQueueProcessor";
import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useQueueProcessor();
  
  return (
    <ProtectedRoute>
      <div className={styles.appContainer}>
        <Sidebar />
        <div className={styles.mainContent}>
          <DashboardHeader />
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
