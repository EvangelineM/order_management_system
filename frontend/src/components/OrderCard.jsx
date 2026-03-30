const statuses = ["pending", "shipped", "delivered"];

function OrderCard({ order, onStatusChange, onDelete }) {
  return (
    <article className="order-card">
      <header>
        <h3>{order.customer_name}</h3>
        <span className={`status status-${order.status}`}>{order.status}</span>
      </header>
      <p>
        <strong>Items:</strong> {order.items.join(", ")}
      </p>
      <p>
        <strong>Total:</strong> Rs. {Number(order.total_price).toLocaleString("en-IN")}
      </p>
      <p>
        <strong>Created:</strong> {new Date(order.created_at).toLocaleString()}
      </p>
      <div className="card-actions">
        <select
          value={order.status}
          onChange={(event) => onStatusChange(order.id, event.target.value)}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button type="button" className="danger" onClick={() => onDelete(order.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}

export default OrderCard;
