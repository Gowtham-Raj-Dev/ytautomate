"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { saveScheduleSettings } from "@/services/firestore";
import { Button } from "@/components/ui/Button";
import type { WeeklySchedule } from "@/types";
import styles from "@/styles/Settings.module.css";
import { MdAdd, MdDelete } from "react-icons/md";

const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: ["06:00", "13:00", "16:00"],
  tuesday: ["10:00", "17:00"],
  wednesday: ["09:00", "12:00", "15:00", "18:00", "21:00"],
  thursday: ["10:00", "17:00"],
  friday: ["06:00", "13:00", "16:00"],
  saturday: ["11:00", "15:00", "19:00"],
  sunday: ["11:00", "15:00", "19:00"],
};

const DAYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
] as const;

export function ScheduleSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.scheduleSettings) {
      setSchedule(profile.scheduleSettings);
    }
  }, [profile]);

  const handleAddTime = (day: keyof WeeklySchedule) => {
    setSchedule(prev => ({
      ...prev,
      [day]: [...prev[day], "12:00"]
    }));
  };

  const handleRemoveTime = (day: keyof WeeklySchedule, index: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const handleTimeChange = (day: keyof WeeklySchedule, index: number, value: string) => {
    setSchedule(prev => {
      const newTimes = [...prev[day]];
      newTimes[index] = value;
      return {
        ...prev,
        [day]: newTimes
      };
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const sortedSchedule = {} as WeeklySchedule;
      (Object.keys(schedule) as (keyof WeeklySchedule)[]).forEach(day => {
        sortedSchedule[day] = [...schedule[day]].sort();
      });

      await saveScheduleSettings(user.uid, sortedSchedule);
      setSchedule(sortedSchedule);
      await refreshProfile();
      toast.success("Schedule settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>Bulk Upload Weekly Schedule</h2>
        <p className={styles.cardHint} style={{marginTop: "8px", color: "var(--text-muted)", fontSize: "0.95rem"}}>
          Set the times videos should be published on each day. These rules apply when uploading entire folders.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "32px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", overflow: "hidden" }}>
        {DAYS.map((day, idx) => (
          <div key={day} style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "24px", background: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", padding: "16px 20px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ textTransform: "capitalize", fontWeight: 600, fontSize: "0.95rem", color: "#fff" }}>
                {day}
              </span>
              <button 
                onClick={() => handleAddTime(day)}
                style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", padding: 0, fontWeight: 500 }}
              >
                <MdAdd size={14} /> Add Time
              </button>
            </div>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {schedule[day].length === 0 ? (
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", alignSelf: "center" }}>No videos will be uploaded on {day}</span>
              ) : (
                schedule[day].map((time, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden", transition: "all 0.2s" }}>
                    <input 
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(day, i, e.target.value)}
                      className={styles.timeInput}
                    />
                    <button 
                      onClick={() => handleRemoveTime(day, i)}
                      style={{ background: "transparent", border: "none", padding: "6px 10px 6px 6px", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "var(--error)"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                    >
                      <MdDelete size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.cardActions}>
        <Button onClick={handleSave} loading={loading}>
          Save Schedule Rules
        </Button>
      </div>
    </section>
  );
}
