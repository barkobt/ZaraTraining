import { useState, useEffect } from "react";
import { Lock, AlertCircle } from "lucide-react";
import { trpc } from "@/providers/trpc";

// PIN ARTIK sunucuda doğrulanır (auth.checkAdmin). Başarılı PIN, token olarak
// bu anahtarda saklanır; tRPC client onu `x-app-password` header'ıyla gönderir,
// sunucu adminQuery'de doğrular. Eski "admin_access_granted=true" bayrağı bırakıldı.
const STORAGE_KEY = "admin_auth_v1";

export function clearAccess() {
  localStorage.removeItem(STORAGE_KEY);
}

export function PinGuard({ children }: { children: React.ReactNode }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const checkMut = trpc.auth.checkAdmin.useMutation();

  useEffect(() => {
    // Token zaten saklıysa erişim aç (sunucu yine de her çağrıda doğrular).
    setHasAccess(!!localStorage.getItem(STORAGE_KEY));
  }, []);

  const handleVerify = () => {
    checkMut.mutate(
      { pin },
      {
        onSuccess: (res) => {
          if (res.ok) {
            localStorage.setItem(STORAGE_KEY, pin);
            setHasAccess(true);
            setError(false);
          } else {
            setError(true);
            setPin("");
          }
        },
        onError: () => {
          setError(true);
          setPin("");
        },
      },
    );
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zara text-ink flex items-center justify-center relative overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=900&fit=crop&q=85&auto=format&sat=-100"
        alt=""
        className="absolute top-0 left-0 w-1/3 h-full object-cover opacity-25 grayscale"
      />
      <img
        src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=900&fit=crop&q=85&auto=format&sat=-100"
        alt=""
        className="absolute top-0 right-0 w-1/3 h-full object-cover opacity-25 grayscale"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--zara-bg)] via-[var(--zara-bg)]/40 to-[var(--zara-bg)]" />

      <div className="relative z-10 w-full max-w-sm mx-4 text-center space-y-8 animate-fade-up">
        <div className="flex justify-center">
          <div className="w-12 h-12 border border-zara-strong flex items-center justify-center" style={{ borderColor: "var(--zara-line-strong)" }}>
            <Lock size={18} className="text-ink/50" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] tracking-[0.32em] font-mono text-ink/40 uppercase">
            ZARA · ADMIN
          </div>
          <h2 className="font-serif text-4xl text-ink tracking-[-0.02em]">
            Giriş <span className="italic font-light">Kısıtlı</span>
          </h2>
          <p className="text-xs text-ink/40 font-sans tracking-wide">
            Bu alana erişmek için eğitmen PIN&apos;ini girin
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            placeholder="······"
            className="w-48 bg-transparent border-b border-ink/20 px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink placeholder:text-ink/15 focus:outline-none focus:border-ink transition-colors font-mono tabular-nums"
          />

          {error && (
            <div className="flex items-center gap-2 text-red-500/80 text-[10px] font-mono tracking-[0.2em] uppercase animate-fade-in">
              <AlertCircle size={12} />
              PIN HATALI · TEKRAR DENEYİN
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={pin.length !== 6}
            className="group relative inline-flex items-center gap-3 px-12 py-4 bg-ink text-zara overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 text-[11px] tracking-[0.25em] font-sans uppercase font-medium">
              Giriş Yap
            </span>
            <span className="absolute inset-0 bg-[var(--zara-gold)] translate-y-full group-hover:translate-y-0 group-disabled:translate-y-full transition-transform duration-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
