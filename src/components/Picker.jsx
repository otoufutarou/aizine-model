export function Picker({ items, value, onChange, render }) {
  return (
    <div className="picker">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className={`card ${it.id === value ? 'active' : ''}`}
          onClick={() => onChange(it.id)}
          aria-pressed={it.id === value}
        >
          <span className="card-en">{it.en}</span>
          <span className="card-name">{it.name}</span>
          {render(it)}
        </button>
      ))}
    </div>
  );
}
