import { useEffect, useMemo, useState } from "react";
import ProductDetail from "./ProductDetail";
import ProductFilters from "./ProductFilters";

function CustomerStorefront({
  products,
  productSearch,
  cart,
  feedback,
  error,
  placingOrder,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onPlaceOrder,
  customerOrders,
  ordersLoading,
  onOpenInvoice,
  selectedInvoice,
  onCloseInvoice,
}) {
  const [view, setView] = useState("shop");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    metal: [],
    gemstone: [],
    minRating: 0,
    priceRange: [0, 300000],
  });

  const categoryChips = useMemo(() => {
    const categories = Array.from(
      new Set(products.map((product) => String(product.category || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return ["All", ...categories];
  }, [products]);

  useEffect(() => {
    if (!categoryChips.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [activeCategory, categoryChips]);

  const cartItems = useMemo(
    () =>
      products
        .filter((product) => (cart[product.id] || 0) > 0)
        .map((product) => ({ ...product, quantity: cart[product.id] })),
    [products, cart]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category.toLowerCase() === activeCategory.toLowerCase();
      if (!matchesCategory) return false;

      const query = String(productSearch || "").trim().toLowerCase();
      if (query) {
        const haystack = [
          product.name,
          product.category,
          product.description,
          product.metal,
          product.gemstone,
          product.material,
          product.color,
          product.weight,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (filters.metal.length > 0 && !filters.metal.includes(product.metal)) return false;
      if (filters.gemstone.length > 0) {
        const gemstoneValue =
          product.gemstone == null || String(product.gemstone).trim() === ""
            ? "None"
            : String(product.gemstone);
        if (!filters.gemstone.includes(gemstoneValue)) return false;
      }
      if (filters.minRating > 0 && Number(product.rating || 0) < filters.minRating) return false;

      const price = Number(product.price || 0);
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;

      return true;
    });
  }, [activeCategory, productSearch, products, filters]);

  const handleClearFilters = () => {
    setFilters((prev) => ({
      metal: [],
      gemstone: [],
      minRating: 0,
      priceRange: [
        prev?.priceRange?.[0] ? 0 : 0,
        Math.max(
          300000,
          ...products.map((item) => Number(item.price || 0))
        ),
      ],
    }));
  };

  const handleOpenInvoice = async (orderId) => {
    await onOpenInvoice(orderId);
    setView("invoice");
  };

  const handleInvoiceView = async () => {
    if (selectedInvoice) {
      setView("invoice");
      return;
    }

    if (customerOrders.length > 0) {
      const latestOrder = [...customerOrders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      if (latestOrder?.id) {
        await handleOpenInvoice(latestOrder.id);
        return;
      }
    }

    setView("invoice");
  };

  return (
    <section className="panel">
      <div className="section-head section-head-end">
        <div className="role-switch">
          <button
            type="button"
            className={view === "shop" ? "active" : ""}
            onClick={() => setView("shop")}
          >
            Shop
          </button>
          <button
            type="button"
            className={view === "cart" ? "active" : ""}
            onClick={() => setView("cart")}
          >
            Cart ({cartItems.length})
          </button>
          <button
            type="button"
            className={view === "history" ? "active" : ""}
            onClick={() => setView("history")}
          >
            Order History
          </button>
          <button
            type="button"
            className={view === "invoice" ? "active" : ""}
            onClick={() => {
              void handleInvoiceView();
            }}
            disabled={customerOrders.length === 0}
          >
            Invoice
          </button>
        </div>
      </div>

      {view === "shop" && (
        <div className="shop-layout">
          <ProductFilters
            products={products}
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={handleClearFilters}
          />

          <div className="shop-content">
            <div className="category-chips">
              {categoryChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className={`chip ${activeCategory === chip ? "chip-active" : ""}`}
                  onClick={() => setActiveCategory(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="products-grid">
              {filteredProducts.map((product) => {
                const qty = cart[product.id] || 0;
                const soldOut = product.stock <= 0;

                return (
                  <article
                    className="product-card"
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <img className="product-image" src={product.image} alt={product.name} />
                    <p className="product-category">{product.category}</p>
                    <h3>{product.name}</h3>
                    <p className="product-desc">{product.description}</p>
                    <div className="product-rating">
                      <span className="rating-stars">Rating {Number(product.rating || 0).toFixed(1)} / 5</span>
                    </div>
                    <p className="product-price">Rs. {Number(product.price).toLocaleString("en-IN")}</p>
                    <p className={soldOut ? "stock stock-out" : "stock"}>
                      {soldOut ? "Out of stock" : `${product.stock} in stock`}
                    </p>

                    <div className="qty-controls">
                      <button
                        type="button"
                        className="details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateCartQty(product.id, Math.max(qty - 1, 0));
                        }}
                        disabled={qty === 0}
                      >
                        -
                      </button>
                      <span>{qty}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                        disabled={soldOut}
                      >
                        +
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="panel">No jewelry products found for your search or filters.</div>
            )}
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={onAddToCart}
          cart={cart}
        />
      )}

      {view === "cart" && (
        <div className="cart-panel">
          <label>
            Cart Summary
            <input value={`${cartItems.length} items selected`} disabled readOnly />
          </label>

          {cartItems.length === 0 ? (
            <p className="muted-text">Your cart is empty. Add products from the Shop tab.</p>
          ) : (
            <div className="cart-grid">
              {cartItems.map((item) => (
                <article
                  className="cart-item"
                  key={item.id}
                  onClick={() => setSelectedProduct(item)}
                >
                  <img className="cart-item-image" src={item.image} alt={item.name} />
                  <div>
                    <h3>{item.name}</h3>
                    <p className="muted-text">{item.description}</p>
                    <p>
                      Rs. {Number(item.price).toLocaleString("en-IN")} x {item.quantity}
                    </p>
                    <p className="cart-line-total">
                      Rs. {Number(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="cart-actions">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onUpdateCartQty(item.id, Math.max(item.quantity - 1, 0));
                      }}
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAddToCart(item);
                      }}
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveFromCart(item.id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="checkout-box">
            <p className="cart-total">Total: Rs. {Number(cartTotal).toLocaleString("en-IN")}</p>
            <button
              type="button"
              onClick={() => onPlaceOrder(cartItems, cartTotal)}
              disabled={placingOrder || cartItems.length === 0}
            >
              {placingOrder ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </div>
      )}

      {view === "history" && (
        <div className="history-board">
          {ordersLoading ? (
            <div className="panel">Loading your orders...</div>
          ) : customerOrders.length === 0 ? (
            <div className="panel">No orders found for your account.</div>
          ) : (
            customerOrders.map((order) => (
              <article className="history-row" key={order.id}>
                <div>
                  <p className="history-id">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="muted-text">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="muted-text">Items</p>
                  <p>{order.items.length}</p>
                </div>
                <div>
                  <p className="muted-text">Total</p>
                  <p>Rs. {Number(order.total_price).toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <span className={`status status-${order.status}`}>{order.status}</span>
                </div>
                <button type="button" onClick={() => handleOpenInvoice(order.id)}>
                  View Details
                </button>
              </article>
            ))
          )}
        </div>
      )}

      {view === "invoice" && selectedInvoice && (
        <section className="invoice-shell">
          <div className="invoice-head">
            <button type="button" className="secondary" onClick={() => setView("history")}>
              Back to Order History
            </button>
            <h2>INVOICE</h2>
            <span className={`status status-${selectedInvoice.status}`}>{selectedInvoice.status}</span>
          </div>

          <div className="invoice-meta-grid">
            <div className="invoice-card">
              <p className="muted-text">Order ID</p>
              <p>#{selectedInvoice.id}</p>
            </div>
            <div className="invoice-card">
              <p className="muted-text">Customer</p>
              <p>{selectedInvoice.customer_name}</p>
            </div>
            <div className="invoice-card">
              <p className="muted-text">Date</p>
              <p>{new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
            </div>
            <div className="invoice-card">
              <p className="muted-text">Total Amount</p>
              <p>Rs. {Number(selectedInvoice.total_price).toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="invoice-table">
            <div className="invoice-row invoice-row-head">
              <span>Item</span>
              <span>Description</span>
              <span>Qty</span>
            </div>
            {selectedInvoice.items.map((item, index) => (
              <div className="invoice-row" key={`${item}-${index}`}>
                <span>{index + 1}</span>
                <span>{item}</span>
                <span>1</span>
              </div>
            ))}
          </div>

          <div className="invoice-foot">
            <button type="button" className="secondary" onClick={onCloseInvoice}>
              Close Invoice
            </button>
          </div>
        </section>
      )}

      {view === "invoice" && !selectedInvoice && (
        <div className="panel">No invoice selected. Open one from Order History.</div>
      )}

      {view === "shop" && feedback && <p className="success">{feedback}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}

export default CustomerStorefront;
