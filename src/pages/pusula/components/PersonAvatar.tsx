/**
 * Pusula avatar — brain Avatar idiomunun Employee'ye uyarlanmış ince kopyası
 * (brain Person'a bağımlı kalmamak için). İsmin baş harfini gösterir.
 * `dark` = koç/usta vurgusu için koyu varyant.
 */
export function PersonAvatar({
  name,
  dark = false,
  size = 30,
}: {
  name: string;
  dark?: boolean;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: dark ? "var(--zara-ink)" : "var(--zara-bg-alt)",
        color: dark ? "var(--zara-bg)" : "var(--zara-ink-2)",
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--ff-display)",
        fontStyle: "italic",
        fontSize: size * 0.46,
        border: dark ? "none" : "1px solid var(--zara-line)",
      }}
    >
      {name[0]}
    </div>
  );
}
