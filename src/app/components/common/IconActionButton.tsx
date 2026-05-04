export default function IconActionButton({
  title,
  onClick,
  disabled = false,
  children,
}: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200 bg-white text-slate-700 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}