import { trpc } from "@/providers/trpc";
import { Sparkles, X } from "lucide-react";

/**
 * Kalibrasyon önerisi çubuğu — spec §3.2 + §4.4.
 *
 * Bir katsayı için 3+ örnek birikmişse `calibration.pending` listesinde görünür.
 * Yönetici "Uygula" veya "Şimdilik kalsın" seçer.
 *
 * UI ilkesi: önemli ama dikkat dağıtmasın — küçük bir banner. Form üstüne sticky
 * konularak gözden kaçmaz, ama action bar'ı ezmez.
 */
export function CalibrationBanner({ onChanged }: { onChanged: () => void }) {
  const pendingQuery = trpc.buenasDias.calibration.pending.useQuery();
  const accept = trpc.buenasDias.calibration.accept.useMutation();
  const dismiss = trpc.buenasDias.calibration.dismiss.useMutation();

  const pending = pendingQuery.data ?? [];
  if (pending.length === 0) return null;

  return (
    <div className="space-y-2">
      {pending.map((c) => (
        <div
          key={c.type}
          className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex flex-wrap items-center gap-3 text-sm"
        >
          <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-amber-900">{coefLabel(c.type)}</span>{" "}
            <span className="text-amber-800">
              katsayısı için <strong>{c.currentValue.toFixed(2)}</strong> kullanıyorsun, son{" "}
              {c.sampleCount} örneğin ortalaması{" "}
              <strong>{c.lastSuggestedValue?.toFixed(2) ?? "?"}</strong>. Güncelleyeyim mi?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() =>
                accept.mutate(
                  { type: c.type as never },
                  {
                    onSuccess: () => {
                      pendingQuery.refetch();
                      onChanged();
                    },
                  },
                )
              }
              disabled={accept.isPending}
              className="px-2.5 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
            >
              Uygula
            </button>
            <button
              onClick={() =>
                dismiss.mutate(
                  { type: c.type as never },
                  {
                    onSuccess: () => {
                      pendingQuery.refetch();
                    },
                  },
                )
              }
              disabled={dismiss.isPending}
              className="px-2.5 py-1 text-xs border border-amber-300 text-amber-800 rounded hover:bg-amber-100 disabled:opacity-50"
              title="Şimdilik kalsın"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function coefLabel(type: string): string {
  switch (type) {
    case "stretch":
      return "Stretch";
    case "weekend":
      return "Haftasonu";
    case "special_day":
      return "Özel gün";
    case "weather_sunny":
      return "Güneşli hava";
    case "weather_normal":
      return "Normal hava";
    case "weather_bad":
      return "Kötü hava";
    default:
      return type;
  }
}
