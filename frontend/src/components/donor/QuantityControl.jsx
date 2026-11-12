export default function QuantityControl({ value, onChange, min = 0 }) {
  return (
    <div className="quantity-control" role="group" aria-label="Quantity control">
      <button
        className="quantity-btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="quantity-value" aria-live="polite">{value}</span>
      <button
        className="quantity-btn"
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
