import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { ROLES, STAR_LEVELS, TENURE_LEVELS, type StaffRow } from "./constants";

export function ReportTab({ staff }: { staff: StaffRow[] }) {
  const roleSummary = useMemo(() => {
    return ROLES.map((role) => {
      const counts = [0, 0, 0, 0, 0];
      for (const p of staff) {
        const lvl = p.competencies[role] ?? 0;
        counts[lvl]++;
      }
      return {
        role,
        Yok: counts[0],
        Kriz: counts[1],
        Destek: counts[2],
        Ana: counts[3],
        "Tercih+": counts[4],
        capable: counts[3] + counts[4],
      };
    });
  }, [staff]);

  const tenureSummary = useMemo(() => {
    return TENURE_LEVELS.map((t) => ({
      name: t.label,
      color: t.color,
      count: staff.filter((p) => p.tenureLevel === t.id).length,
    }));
  }, [staff]);

  const averageCompetencyPerPerson = useMemo(() => {
    return staff
      .map((p) => {
        const vals = ROLES.map((r) => p.competencies[r] ?? 0);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        return { name: p.shortName, avg: Math.round(avg * 100) / 100 };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [staff]);

  return (
    <div className="space-y-8">
      <section className="border border-stone-300 p-6">
        <h3 className="text-lg mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Rol Bazında Yetkinlik Dağılımı
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Her rol için kaç kişi hangi seviyede? "Ana" (★★★) ve üstü çalışabilir sayılır.
        </p>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={roleSummary} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="role" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, border: "1px solid #000" }}
                cursor={{ fill: "#f5f5f4" }}
              />
              {STAR_LEVELS.map((s, idx) => (
                <Bar
                  key={s.value}
                  dataKey={s.name}
                  stackId="a"
                  fill={
                    ["#f5f5f4", "#fecaca", "#fde68a", "#bbf7d0", "#0a0a0a"][idx]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-4 text-[10px] tracking-wider uppercase text-stone-600">
          {roleSummary.map((r) => (
            <div key={r.role} className="border border-stone-200 p-2">
              <div className="font-semibold">{r.role}</div>
              <div className="text-2xl font-light tabular-nums">{r.capable}</div>
              <div className="text-stone-400">çalışabilir</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-stone-300 p-6">
        <h3 className="text-lg mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Tenure Dağılımı
        </h3>
        <div className="grid grid-cols-5 gap-px bg-stone-300 border border-stone-300 mt-4">
          {tenureSummary.map((t) => (
            <div key={t.name} className="bg-white p-4">
              <div className="text-[9px] tracking-[0.25em] uppercase text-stone-500 mb-1">
                {t.name}
              </div>
              <div className="text-3xl font-light tabular-nums" style={{ color: t.color }}>
                {String(t.count).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-stone-300 p-6">
        <h3 className="text-lg mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Personel Bazında Ortalama Yetkinlik
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Tüm rollerdeki yıldız ortalaması. Yüksek skor → tam joker.
        </p>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart
              data={averageCompetencyPerPerson}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 32, bottom: 8 }}
            >
              <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                contentStyle={{ fontSize: 12, border: "1px solid #000" }}
                cursor={{ fill: "#f5f5f4" }}
              />
              <Bar dataKey="avg" fill="#0a0a0a">
                {averageCompetencyPerPerson.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.avg >= 3 ? "#0a0a0a" : d.avg >= 2 ? "#525252" : "#a8a29e"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
