interface SearchFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function SearchField({
  label,
  placeholder,
  value,
  onChange,
}: SearchFieldProps) {
  return (
    <div className="search-box">
      <span className="search-icon" aria-hidden="true">
        ⌕
      </span>

      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      {value && (
        <button
          type="button"
          className="search-clear"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
        >
          ×
        </button>
      )}
    </div>
  );
}
