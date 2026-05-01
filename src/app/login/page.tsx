"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "로그인에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      setMessage("로그인 성공");
window.sessionStorage.removeItem("suenify-active-view");
router.push("/");
router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">
              Suenify
            </p>
            <h1 className="mt-2 text-3xl font-semibold">관리자 로그인</h1>
            <p className="mt-2 text-sm text-slate-400">
              관리자 계정으로 로그인 후 어드민 페이지에 접근합니다.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                아이디
              </label>
              <input
                type="text"
                value={id}
                onChange={(event) => setId(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none"
                placeholder="아이디 입력"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none"
                placeholder="비밀번호 입력"
                autoComplete="current-password"
              />
            </div>

            {message ? (
              <p className="text-sm text-slate-300">{message}</p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-400/20 px-4 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/30 disabled:opacity-60"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}