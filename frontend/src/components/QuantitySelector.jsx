export default function QuantitySelector({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="quantity-selector">
      <button className="qty-btn" onClick={onDecrease}>
        −
      </button>

      <span className="qty-value">{quantity}</span>

      <button className="qty-btn" onClick={onIncrease}>
        +
      </button>
    </div>
  );
}
