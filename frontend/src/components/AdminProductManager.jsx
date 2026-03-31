import { useState } from "react";
import ProductDetail from "./ProductDetail";
import { useVoiceRecognition } from "../hooks/useVoiceRecognition";

const initialProduct = {
  name: "",
  category: "",
  description: "",
  price: "",
  stock: "",
  image: "",
  metal: "",
  gemstone: "",
  weight: "",
  rating: "",
  color: "",
  material: "",
  reviews: "",
};

function AdminProductManager({ products, onAddProduct, onRemoveProduct, onUpdateProduct }) {
  const [form, setForm] = useState(initialProduct);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [voiceField, setVoiceField] = useState(null); // Track which field to populate with voice
  const [focusedField, setFocusedField] = useState(null); // Track currently focused field

  const {
    transcript: voiceTranscript,
    isListening: isVoiceListening,
    startListening: startVoiceRecording,
    stopListening: stopVoiceRecording,
    isBrowserSupported: voiceSupported,
  } = useVoiceRecognition();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFieldFocus = (fieldName) => {
    console.log("Field focused:", fieldName);
    setFocusedField(fieldName);
  };

  const handleVoiceStart = () => {
    console.log("handleVoiceStart called. isVoiceListening:", isVoiceListening);
    
    if (!voiceSupported) {
      console.error("Voice not supported");
      alert("Voice recognition is not supported in your browser");
      return;
    }

    if (isVoiceListening) {
      console.log("Already listening, stopping...");
      stopVoiceRecording();
      return;
    }

    const targetField = focusedField || "name";
    console.log("Starting voice for field:", targetField);
    setVoiceField(targetField);
    
    startVoiceRecording((finalTranscript) => {
      console.log("Voice callback fired with transcript:", finalTranscript);
      if (finalTranscript) {
        console.log("Updating form field", targetField, "with:", finalTranscript);
        setForm((prev) => ({
          ...prev,
          [targetField]: finalTranscript,
        }));
      }
      setVoiceField(null);
    });
  };

  const handleAdd = (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.category.trim() || !form.price || !form.stock) {
      setError("Name, category, price, and stock are required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim() || "No description provided.",
      price: Number(form.price),
      stock: Number(form.stock),
      image:
        form.image.trim() ||
        "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80",
      metal: form.metal.trim() || "N/A",
      gemstone: form.gemstone.trim() || null,
      weight: form.weight.trim() || "N/A",
      rating: Number(form.rating || 0),
      color: form.color.trim() || "N/A",
      material: form.material.trim() || "N/A",
      reviews: Number(form.reviews || 0),
      active: true,
    };

    if (
      Number.isNaN(payload.price) ||
      Number.isNaN(payload.stock) ||
      Number.isNaN(payload.rating) ||
      Number.isNaN(payload.reviews)
    ) {
      setError("Price, stock, rating, and reviews must be valid numbers.");
      return;
    }

    if (payload.rating < 0 || payload.rating > 5) {
      setError("Rating must be between 0 and 5.");
      return;
    }

    onAddProduct(payload);
    setForm(initialProduct);
  };

  return (
    <section className="panel">
      <div className="admin-form-shell">
        <div className="admin-form-head">
          <h2>Add Product</h2>
          <p className="muted-text">Fill in essentials first, then enhance with jewelry details.</p>
        </div>

        {voiceSupported && (
          <div
            style={{
              padding: "12px",
              backgroundColor: isVoiceListening ? "#e8f5e9" : "#f5f5f5",
              borderRadius: "6px",
              marginBottom: "16px",
              display: "flex",
              gap: "12px",
              alignItems: "center",
              border: "1px solid #d3d4dd",
            }}
          >
            <button
              type="button"
              onClick={handleVoiceStart}
              className={`voice-cta ${isVoiceListening ? "listening" : ""}`}
              style={{
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                flex: "0 0 auto",
              }}
              title={isVoiceListening ? "Stop listening" : "Click to speak"}
            >
              🎤 {isVoiceListening ? "Listening..." : "Voice Input"}
            </button>
            <div style={{ flex: 1 }}>
              {isVoiceListening && (
                <p style={{ margin: 0, color: "#4caf50", fontWeight: "bold", fontSize: "14px" }}>
                  {focusedField ? `Speaking for: ${focusedField}` : "Click a field then speak..."}
                </p>
              )}
              {voiceTranscript && (
                <p
                  style={{
                    margin: "4px 0 0 0",
                    color: "#333",
                    fontSize: "13px",
                    fontStyle: "italic",
                    padding: "4px 8px",
                    backgroundColor: "white",
                    borderRadius: "4px",
                  }}
                >
                  "{voiceTranscript}"
                </p>
              )}
            </div>
          </div>
        )}

        <form className="admin-product-form" onSubmit={handleAdd}>
          <div className="admin-form-section">
            <h3>Core Info</h3>
            <div className="admin-form-grid">
              <label>
                Product Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onFocus={() => handleFieldFocus("name")}
                  placeholder="Astral Diamond Pendant"
                />
              </label>
              <label>
                Category
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  onFocus={() => handleFieldFocus("category")}
                  placeholder="Pendants"
                />
              </label>
              <label className="admin-span-2">
                Description
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  onFocus={() => handleFieldFocus("description")}
                  placeholder="Brilliant-cut pendant in premium setting"
                />
              </label>
              <label>
                Price (Rs.)
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  onFocus={() => handleFieldFocus("price")}
                  placeholder="25000"
                />
              </label>
              <label>
                Stock
                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  onFocus={() => handleFieldFocus("stock")}
                  placeholder="15"
                />
              </label>
              <label className="admin-span-2">
                Image URL
                <input
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  onFocus={() => handleFieldFocus("image")}
                  placeholder="https://..."
                />
              </label>
            </div>
          </div>

          <div className="admin-form-section">
            <h3>Jewelry Details</h3>
            <div className="admin-form-grid">
              <label>
                Material
                <input
                  name="material"
                  value={form.material}
                  onChange={handleChange}
                  onFocus={() => handleFieldFocus("material")}
                  placeholder="18K Gold with Diamond accents"
                />
              </label>
              <label>
                Metal
                <input
                  name="metal"
                  value={form.metal}
                  onChange={handleChange}
                  onFocus={() => handleFieldFocus("metal")}
                  placeholder="18K Gold"
                />
              </label>
              <label>
                Gemstone
                <input
                  name="gemstone"
                  value={form.gemstone}
                  onChange={handleChange}
                  onFocus={() => handleFieldFocus("gemstone")}
                  placeholder="Diamond (leave blank for none)"
                />
              </label>
              <label>
                Color
                <input
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  onFocus={() => handleFieldFocus("color")}
                  placeholder="Yellow Gold"
                />
              </label>
              <label>
                Weight
                <input
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  onFocus={() => handleFieldFocus("weight")}
                  placeholder="5.2g"
                />
              </label>
              <label>
                Rating (0-5)
                <input
                  name="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={handleChange}
                  onFocus={() => handleFieldFocus("rating")}
                  placeholder="4.6"
                />
              </label>
              <label>
                Reviews
                <input
                  name="reviews"
                  type="number"
                  min="0"
                  step="1"
                  value={form.reviews}
                  onChange={handleChange}
                  onFocus={() => handleFieldFocus("reviews")}
                  placeholder="145"
                />
              </label>
            </div>
          </div>

          <div className="admin-form-actions">
            <button type="submit">Add Product</button>
          </div>
        </form>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="admin-inventory-head">
        <h2>Product Inventory</h2>
        <span className="muted-text">{products.length} products</span>
      </div>

      <div className="admin-list">
        {products.map((product) => (
          <article className="admin-product" key={product.id} onClick={() => setSelectedProduct(product)}>
            <div className="admin-product-main">
              <img className="product-image product-image-small" src={product.image} alt={product.name} />
              <div className="admin-product-copy">
                <p className="product-category">{product.category}</p>
                <p className="muted-text">Product ID: {product.id}</p>
                <h3>{product.name}</h3>
                <p className="product-desc">{product.description}</p>
                <div className="admin-product-meta">
                  <p className="product-price">Rs. {Number(product.price).toLocaleString("en-IN")}</p>
                  <p className={Number(product.stock) <= 0 ? "stock stock-out" : "stock"}>
                    {Number(product.stock) <= 0 ? "Out of stock" : `Stock: ${product.stock}`}
                  </p>
                  <p className="stock">
                    Rating: {Number(product.rating || 0).toFixed(1)} ({Number(product.reviews || 0)})
                  </p>
                  <p className="stock">Status: {product.active ? "Active" : "Hidden"}</p>
                </div>
              </div>
            </div>
            <div className="admin-side-rail" onClick={(event) => event.stopPropagation()}>
              <button
                className="btn-toggle admin-visibility-btn"
                type="button"
                aria-label={product.active ? "Hide product" : "Show product"}
                title={product.active ? "Hide product" : "Show product"}
                onClick={(event) => {
                  event.stopPropagation();
                  onUpdateProduct(product.id, { active: !product.active });
                }}
              >
                <span className="action-icon" aria-hidden="true">
                  {product.active ? (
                    <svg viewBox="0 0 24 24" width="14" height="14" focusable="false">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M4 4l16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="14" height="14" focusable="false">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" fill="none" stroke="currentColor" strokeWidth="2" />
                      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </span>
              </button>

              <div className="admin-stock-stack">
                <button
                  className="btn-stock-inc admin-stock-btn"
                  type="button"
                  aria-label="Increase stock"
                  title="Increase stock"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateProduct(product.id, { stock: product.stock + 1 });
                  }}
                >
                  +1
                </button>
                <button
                  className="btn-stock-dec admin-stock-btn"
                  type="button"
                  aria-label="Decrease stock"
                  title="Decrease stock"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateProduct(product.id, { stock: Math.max(product.stock - 1, 0) });
                  }}
                >
                  -1
                </button>
              </div>

              <button
                type="button"
                className="danger admin-remove-btn"
                aria-label="Remove product"
                title="Remove product"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemoveProduct(product.id);
                }}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={() => {}}
          showCartControls={false}
        />
      )}
    </section>
  );
}

export default AdminProductManager;
