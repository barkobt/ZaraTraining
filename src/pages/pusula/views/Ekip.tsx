import { Headline } from "../../brain/primitives";
import { employees } from "../data";
import type { Employee } from "../types";
import { PersonCard } from "../components/PersonCard";

/**
 * Ekip görünümü — roster kartları + güvence ibareleri. Karta tıkla → drawer peek.
 */
export function Ekip({ onPeek }: { onPeek: (p: Employee) => void }) {
  return (
    <div className="pusula-team">
      <div className="pusula-team-head">
        <Headline ital="Yaşayan" roman="Ekip" size={32} />
        <div className="pusula-sub">İnsan birincil — yerleşim onun sonucu.</div>
      </div>

      <div className="pusula-team-grid">
        {employees.map((p) => (
          <PersonCard key={p.id} person={p} onOpen={() => onPeek(p)} />
        ))}
      </div>

      <div className="pusula-assure pusula-assure-row">
        <span>Bu profili çalışan da görür</span>
        <span>Skor yok, sıralama yok — yalnız nitel okuma</span>
      </div>
    </div>
  );
}
