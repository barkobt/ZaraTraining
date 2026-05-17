import { useEffect, useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";

const STORAGE_KEY = "shift_organizer_auth_v1";

export function useAuthGate() {
  const requiredQuery = trpc.auth.required.useQuery(undefined, {
    staleTime: 5 * 60_000,
  });
  const checkMut = trpc.auth.check.useMutation();

  const [authed, setAuthed] = useState<boolean>(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token && requiredQuery.data?.required) {
      checkMut.mutate(
        { token },
        {
          onSuccess: (r) => {
            setAuthed(!!r.ok);
            setChecked(true);
          },
          onError: () => setChecked(true),
        },
      );
    } else {
      setChecked(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiredQuery.data?.required]);

  const required = requiredQuery.data?.required ?? false;

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
  };

  function LoginScreen() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const loginMut = trpc.auth.check.useMutation();

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="border border-stone-300 p-10 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={16} strokeWidth={1.5} />
            <h1 className="font-serif text-xl">Shift Organizer</h1>
          </div>
          <p className="text-xs text-stone-500 mb-4">
            Bu alan kısıtlı. Erişim şifresini gir.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="••••••••"
            className="w-full border-b border-stone-300 py-2 outline-none focus:border-black font-mono mb-4"
            autoFocus
          />
          {error && (
            <div className="text-xs text-red-600 mb-3">{error}</div>
          )}
          <button
            onClick={submit}
            disabled={!password || loginMut.isPending}
            className="w-full bg-black text-white py-2 text-[10px] tracking-[0.2em] uppercase hover:bg-stone-800 disabled:bg-stone-300 flex items-center justify-center gap-2"
          >
            {loginMut.isPending && <Loader2 className="animate-spin" size={14} />}
            Giriş
          </button>
        </div>
      </div>
    );

    function submit() {
      setError(null);
      loginMut.mutate(
        { token: password },
        {
          onSuccess: (r) => {
            if (r.ok) {
              localStorage.setItem(STORAGE_KEY, password);
              setAuthed(true);
            } else {
              setError("Yanlış şifre.");
            }
          },
          onError: (e) => setError(e.message),
        },
      );
    }
  }

  if (!checked || requiredQuery.isLoading) {
    return {
      required: true,
      authed: false,
      logout,
      LoginScreen: () => (
        <div className="min-h-screen flex items-center justify-center text-stone-400">
          <Loader2 className="animate-spin" size={20} />
        </div>
      ),
    };
  }

  return { required, authed, logout, LoginScreen };
}
