import { useState } from "react";

const initialFormState = {
  customer_name: "",
  items: "",
  total_price: "",
};

function OrderForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const items = form.items
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!form.customer_name.trim() || items.length === 0 || !form.total_price) {
      setError("Fill all fields. Use comma-separated items.");
      return;
    }

    const payload = {
      customer_name: form.customer_name.trim(),
      items,
      total_price: Number(form.total_price),
    };

    const ok = await onSubmit(payload);
    if (ok) {
      setForm(initialFormState);
    }
  };

  return (
    <form className="panel admin-form-shell order-create-shell" onSubmit={handleSubmit}>
      <div className="admin-form-head">
        <h2>Create Order</h2>
        <p className="muted-text">Create an order manually for phone or in-store requests.</p>
      </div>

      <div className="admin-form-section">
        <div className="admin-form-grid">
          <label>
            Customer Name
            <input
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              placeholder="Ada Lovelace"
            />
          </label>
          <label className="admin-span-2">
            Items (comma-separated)
            <input
              name="items"
              value={form.items}
              onChange={handleChange}
              placeholder="Mouse, Keyboard"
            />
          </label>
          <label>
            Total Price (Rs.)
            <input
              name="total_price"
              type="number"
              step="0.01"
              min="0"
              value={form.total_price}
              onChange={handleChange}
              placeholder="1500"
            />
          </label>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="admin-form-actions">
        <button disabled={loading} type="submit">
          {loading ? "Creating..." : "Add Order"}
        </button>
      </div>
    </form>
  );
}

export default OrderForm;
