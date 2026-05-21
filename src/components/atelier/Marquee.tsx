/**
 * Marquee — words-and-dots serif tape, infinite scroll.
 *
 * Italic Instrument Serif words at ~32px, separated by gold mid-dots `·`.
 * 40s linear infinite. Pauses on hover. Used as a hero/footer ornament.
 */
export function Marquee({ words }: { words: string[] }) {
  const renderRun = (key: string) => (
    <span key={key} className="inline-flex items-center gap-0">
      {words.map((w, i) => (
        <span
          key={`${key}-${i}`}
          className="whitespace-nowrap"
          style={{
            fontFamily:
              w === "·" ? "var(--ff-display)" : "var(--ff-editorial)",
            fontStyle: w === "·" ? "normal" : "italic",
            fontSize: 32,
            color: w === "·" ? "var(--zara-gold)" : "var(--zara-ink-65)",
            margin: "0 22px",
          }}
        >
          {w}
        </span>
      ))}
    </span>
  );

  return (
    <div
      className="overflow-hidden py-[18px]"
      style={{
        background: "var(--zara-bg-alt)",
        borderTop: "1px solid var(--zara-line)",
        borderBottom: "1px solid var(--zara-line)",
      }}
    >
      <div className="marquee">
        {renderRun("a")}
        {renderRun("b")}
      </div>
    </div>
  );
}
