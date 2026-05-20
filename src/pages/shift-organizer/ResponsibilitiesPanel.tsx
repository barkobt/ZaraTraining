import { useEffect, useState } from "react";
import { Loader2, UserCog } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { RESPONSIBILITY_ROLES, type ResponsibilityRole, type StaffRow } from "./constants";

export type Responsibilities = Partial<Record<ResponsibilityRole, string>>;

export function ResponsibilitiesPanel({
  chartId,
  staff,
  initial,
}: {
  chartId: number | null;
  staff: StaffRow[];
  initial?: Responsibilities;
}) {
  const [local, setLocal] = useState<Responsibilities>(initial ?? {});
  const [saved, setSaved] = useState(true);
  const utils = trpc.useUtils();

  const mut = trpc.chart.updateResponsibilities.useMutation({
    onSuccess: () => {
      setSaved(true);
      utils.chart.list.invalidate();
    },
  });

  useEffect(() => {
    setLocal(initial ?? {});
    setSaved(true);
  }, [chartId, initial]);

  function update(role: ResponsibilityRole, shortName: string) {
    if (chartId === null) return;
    const next = { ...local, [role]: shortName || undefined };
    setLocal(next);
    setSaved(false);
    mut.mutate({
      id: chartId,
      responsibilities: Object.fromEntries(
        RESPONSIBILITY_ROLES.map((r) => [r, next[r] ?? null]),
      ),
    });
  }

  return (
    <div className="border border-stone-300 mt-4">
      <div className="px-4 py-3 border-b border-stone-300 flex items-center gap-2 text-[11px]">
        <UserCog size={13} strokeWidth={1.5} />
        <span className="tracking-[0.25em] uppercase text-stone-500">Günün Sorumluları</span>
        <span className="text-stone-400 text-[10px] ml-auto">
          {mut.isPending ? (
            <span className="flex items-center gap-1">
              <Loader2 className="animate-spin" size={10} /> Kaydediliyor
            </span>
          ) : saved ? (
            "Kaydedildi"
          ) : (
            "Değişiklik var"
          )}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-stone-200">
        {RESPONSIBILITY_ROLES.map((role) => (
          <div key={role} className="bg-white p-3">
            <div className="text-[9px] tracking-[0.25em] uppercase text-stone-500 mb-2">
              {role}
            </div>
            <select
              value={local[role] ?? ""}
              onChange={(e) => update(role, e.target.value)}
              disabled={chartId === null}
              className="w-full text-sm border-b border-stone-300 py-1 outline-none focus:border-black bg-transparent disabled:text-stone-300"
            >
              <option value="">— (boş)</option>
              {staff.map((p) => (
                <option key={p.id} value={p.shortName}>
                  {p.shortName} · {p.fullName}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {chartId === null && (
        <div className="px-4 py-2 text-[10px] text-stone-400 border-t border-stone-200">
          Chart kaydı yok — önce solver'ı çalıştır.
        </div>
      )}
    </div>
  );
}
