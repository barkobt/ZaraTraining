export const STAR_LEVELS = [
  { value: 0, label: "—", name: "Yok" },
  { value: 1, label: "★", name: "Kriz" },
  { value: 2, label: "★★", name: "Destek" },
  { value: 3, label: "★★★", name: "Ana" },
  { value: 4, label: "★★★+", name: "Tercih+" },
] as const;

export const TENURE_LEVELS = [
  { id: "NEW_0_1", label: "0–1 ay", color: "#ef4444" },
  { id: "NEW_1_3", label: "1–3 ay", color: "#f59e0b" },
  { id: "NEW_3_6", label: "3–6 ay", color: "#eab308" },
  { id: "NEW_6_PLUS", label: "6+ ay", color: "#10b981" },
  { id: "EXPERT", label: "Yetkin", color: "#000000" },
] as const;

export const ROLES = ["Welcome", "Kabin", "Runner", "Sprinter", "Z3-Z4", "Z5"] as const;
export type Role = (typeof ROLES)[number];

export type StaffRow = {
  id: number;
  fullName: string;
  shortName: string;
  tenureLevel: string;
  isManager: boolean;
  note: string | null;
  competencies: Record<string, number>;
};
