"use client";

type DeleteServiceDialogProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteServiceDialog({
  isOpen,
  onCancel,
  onConfirm,
}: DeleteServiceDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9997 flex items-center justify-center bg-black/60 px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white">서비스 삭제 확인</h3>
        <p className="mt-2 text-sm text-slate-300">
          정말로 이 서비스를 삭제하시겠습니까? 삭제 후에는 복구되지 않습니다.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-slate-100 hover:bg-white/15"
          >
            취소
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-2xl bg-red-500/15 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}