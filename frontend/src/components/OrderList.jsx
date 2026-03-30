import OrderCard from "./OrderCard";

function OrderList({ orders, onStatusChange, onDelete }) {
  if (orders.length === 0) {
    return <div className="panel">No orders found.</div>;
  }

  return (
    <section className="list-grid order-list-grid">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}

export default OrderList;
