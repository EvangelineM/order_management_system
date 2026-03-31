const statuses = ["pending", "shipped", "delivered"];

const parseOrderItem = (itemText) => {
  const raw = String(itemText || "").trim();
  const withId = raw.match(/^\[([^\]]+)\]\s*(.*)$/);

  if (!withId) {
    return {
      name: raw,
      productId: "N/A",
    };
  }

  return {
    productId: withId[1],
    name: withId[2] || "-",
  };
};

function OrderCard({ order, onStatusChange, onDelete }) {
  const parsedItems = order.items.map(parseOrderItem);

  return (
    <article className="order-card">
      <header>
        <h3>{order.customer_name}</h3>
        <span className={`status status-${order.status}`}>{order.status}</span>
      </header>
      <p>
        <strong>Order ID:</strong> {order.id}
      </p>
      <p>
        <strong>Items:</strong>
      </p>
      <div className="order-item-list">
        {parsedItems.map((item, index) => (
          <div className="order-item-row" key={`${order.id}-${index}`}>
            <span className="order-item-name">{item.name}</span>
            <span className="order-item-id">ID: {item.productId}</span>
          </div>
        ))}
      </div>
      <p>
        <strong>Total:</strong> Rs.{" "}
        {Number(order.total_price).toLocaleString("en-IN")}
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
        <button
          type="button"
          className="danger"
          onClick={() => onDelete(order.id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default OrderCard;
