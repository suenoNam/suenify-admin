"use client";

type ServiceDraft = {
  title: string;
  internalUrl: string;
  externalUrl: string;
  note: string;
};

type ServiceEditPanelProps = {
  value: ServiceDraft;
  onChange: (next: ServiceDraft) => void;
};

export default function ServiceEditPanel({
  value,
  onChange,
}: ServiceEditPanelProps) {
  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">서비스 편집</h3>
        <p className="mt-1 text-sm text-slate-400">
          추가된 서비스만 여기서 간단하게 수정할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-slate-300">서비스 이름</label>
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none"
            value={value.title}
            onChange={(e) =>
              onChange({
                ...value,
                title: e.target.value,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300">내부 주소</label>
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none"
            value={value.internalUrl}
            onChange={(e) =>
              onChange({
                ...value,
                internalUrl: e.target.value,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300">외부 주소</label>
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none"
            value={value.externalUrl}
            onChange={(e) =>
              onChange({
                ...value,
                externalUrl: e.target.value,
              })
            }
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-slate-300">메모</label>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none"
            value={value.note}
            onChange={(e) =>
              onChange({
                ...value,
                note: e.target.value,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}