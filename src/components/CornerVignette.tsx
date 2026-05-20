/**
 * Köşelerde 4 adet 22px L-shape — atelier editorial çentiği.
 * Pozisyon: bulunduğu section'a `relative` ekle, bu absolute.
 */
export function CornerVignette({ color = "currentColor", opacity = 0.4 }: { color?: string; opacity?: number }) {
  const sides = [
    { pos: "top-0 left-0", borders: "border-t border-l" },
    { pos: "top-0 right-0", borders: "border-t border-r" },
    { pos: "bottom-0 left-0", borders: "border-b border-l" },
    { pos: "bottom-0 right-0", borders: "border-b border-r" },
  ];
  return (
    <>
      {sides.map((s) => (
        <span
          key={s.pos}
          aria-hidden
          className={`absolute ${s.pos} w-[18px] h-[18px] ${s.borders} pointer-events-none`}
          style={{ borderColor: color, opacity }}
        />
      ))}
    </>
  );
}
