"use client";

import { Check, CircleAlert } from "lucide-react";

type SettingsField = {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox" | "select";
};

type CommonServiceSettingsPanelProps = {
  title: string;
  description: string;
  fields: SettingsField[];
  values: Record<string, string | number | boolean>;
  onChange: (key: string, value: string | number | boolean) => void;
  onSave?: () => void;
  saveStateLabel?: string;
  saveStateType?: "idle" | "success" | "error";
};

function getSelectOptions(fieldKey: string) {
  if (fieldKey === "primary") {
    return [
      { value: "internal", label: "내부" },
      { value: "external", label: "외부" },
    ];
  }

  if (fieldKey === "placement") {
    return [
      { value: "main", label: "메인" },
      { value: "sub", label: "서브" },
    ];
  }

  if (fieldKey === "serviceKind") {
    return [
      { value: "nas", label: "NAS" },
      { value: "media", label: "미디어" },
      { value: "domain", label: "도메인" },
      { value: "api", label: "API" },
      { value: "other", label: "기타" },
    ];
  }

  if (fieldKey === "icon") {
    return [
      { value: "server", label: "서버" },
      { value: "hard-drive", label: "NAS" },
      { value: "film", label: "미디어" },
      { value: "globe", label: "도메인" },
      { value: "boxes", label: "박스/API" },
    ];
  }

  return [];
}

export default function CommonServiceSettingsPanel({
  title,
  description,
  fields,
  values,
  onChange,
  onSave,
  saveStateLabel,
  saveStateType = "idle",
}: CommonServiceSettingsPanelProps) {
  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          {saveStateLabel ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {saveStateType === "success" ? (
                <Check size={14} className="text-emerald-300" />
              ) : saveStateType === "error" ? (
                <CircleAlert size={14} className="text-red-300" />
              ) : null}
              <span>{saveStateLabel}</span>
            </div>
          ) : null}

          {onSave ? (
            <button
              type="button"
              onClick={onSave}
              className="inline-flex h-8 items-center justify-center rounded-xl bg-white/10 px-3 text-sm text-slate-200 transition hover:bg-white/15"
            >
              저장
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {fields.map((field) => {
          const rawValue = values[field.key];

          const displayLabel =
  field.key === "placement" ? "서비스 구분" : field.label;

const wrapperClass =
  field.key === "note" ? "block md:col-span-2" : "block";

          if (field.type === "checkbox") {
            return (
              <label
                key={field.key}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={Boolean(rawValue)}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                />
                <span className="text-sm text-slate-200">{displayLabel}</span>
              </label>
            );
          }

          if (field.type === "select") {
            const options = getSelectOptions(field.key);

            return (
              <label
                key={field.key}
                className={wrapperClass}
              >
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
                  {displayLabel}
                </span>

                <select
                  value={String(rawValue ?? "")}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
                >
                  {options.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          }

          return (
            <label
              key={field.key}
              className={wrapperClass}
            >
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
                {displayLabel}
              </span>

              <input
                type={field.type === "number" ? "number" : "text"}
                value={
                  typeof rawValue === "number" || typeof rawValue === "string"
                    ? rawValue
                    : ""
                }
                onChange={(e) =>
                  onChange(
                    field.key,
                    field.type === "number"
                      ? Number(e.target.value)
                      : e.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}