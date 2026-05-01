"use client";

type ThemeMode = "dark" | "light";

type Props = {
  themeMode: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
};

export default function EnvironmentSettingsPanel({
  themeMode,
  onChangeTheme,
}: Props) {
  return (
    <div className="rounded-3xl bg-white/10 p-6">
      <div>
        <h3 className="text-xl font-semibold">환경 설정</h3>
        <p className="mt-1 text-sm text-slate-400">
          어드민 화면의 테마와 이후 확장될 환경 옵션을 설정해.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
            테마
          </span>
          <select
            value={themeMode}
            onChange={(e) => onChangeTheme(e.target.value as ThemeMode)}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
          >
            <option value="dark">다크 모드</option>
            <option value="light">라이트 모드</option>
          </select>
        </label>
      </div>
    </div>
  );
}