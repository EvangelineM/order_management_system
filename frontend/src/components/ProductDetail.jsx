import { useMemo } from "react";

function ProductDetail({
  product,
  onClose,
  onAddToCart,
  cart = {},
  showCartControls = true,
}) {
  if (!product) return null;

  const rating = Number(product.rating || 0);
  const reviews = Number(product.reviews || 0);
  const stock = Math.max(0, Number(product.stock || 0));
  const soldOut = stock <= 0;

  const stars = useMemo(() => {
    const safeRating = Math.max(0, Math.min(5, rating));
    const fullStars = Math.floor(safeRating);
    const hasHalf = safeRating - fullStars >= 0.5;

    return Array.from({ length: 5 }, (_, idx) => {
      if (idx < fullStars) return "full";
      if (idx === fullStars && hasHalf) return "half";
      return "empty";
    });
  }, [rating]);

  const handleAdd = () => {
    if (soldOut) return;
    onAddToCart(product);
  };

  return (
    <div
      className="product-detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Product details"
    >
      <div className="product-detail-modal">
        <button
          type="button"
          className="close-btn"
          onClick={onClose}
          aria-label="Close details"
          style={{ color: "#111827", fontWeight: 700, lineHeight: 1 }}
        >
          ×
        </button>

        <div className="detail-content">
          <div className="detail-image-section">
            <img
              className="detail-image"
              src={product.image}
              alt={product.name}
              onError={(e) => {
                e.target.src = "/fallback-image.jpg";
              }}
            />
          </div>

          <div className="detail-info-section">
            <p className="detail-category">{product.category || "Jewelry"}</p>
            <p className="muted-text">Product ID: {product.id || "N/A"}</p>
            <h2 className="detail-name">{product.name}</h2>

            <div className="rating-section">
              <div className="stars">
                {stars.map((star, index) => (
                  <span key={index} className={`star-${star}`}>
                    ★
                  </span>
                ))}
              </div>
              <span className="rating-value">{rating.toFixed(1)}</span>
              <span className="reviews-count">
                ({reviews.toLocaleString("en-IN")} reviews)
              </span>
            </div>

            <p className="detail-description">{product.description}</p>

            <p className="detail-price">
              Rs. {Number(product.price || 0).toLocaleString("en-IN")}
            </p>

            <div className="details-grid">
              <h3>Product Details</h3>
              <div className="detail-row">
                <span className="detail-label">Material</span>
                <span className="detail-value">
                  {product.material || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Product ID</span>
                <span className="detail-value">{product.id || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Metal</span>
                <span className="detail-value">{product.metal || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Gemstone</span>
                <span className="detail-value">
                  {product.gemstone || "None"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Color</span>
                <span className="detail-value">{product.color || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Weight</span>
                <span className="detail-value">{product.weight || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stock</span>
                <span className="detail-value">{stock}</span>
              </div>
            </div>

            {showCartControls && (
              <div className="cart-controls">
                <button
                  type="button"
                  className="add-to-cart-btn"
                  onClick={handleAdd}
                  disabled={soldOut}
                >
                  {soldOut ? "Out of Stock" : "Add to Cart"}
                </button>

                {soldOut && <p className="out-of-stock-text">Out of stock</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
