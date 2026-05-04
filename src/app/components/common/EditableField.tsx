export default function EditableField({
  label,
  value,
  onChange,
  disabled = false,
  textarea = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-base font-medium text-slate-500">{label}</span>

      {textarea ? (
        <textarea
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 min-h-32 w-full rounded-2xl border border-sky-200 px-4 py-3"
        />
      ) : (
        <input
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 h-12 w-full rounded-2xl border border-sky-200 px-4"
        />
      )}
    </label>
  );
}