import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import AdminProductManager from "../components/AdminProductManager";
import CustomerStorefront from "../components/CustomerStorefront";
import LoginPanel from "../components/LoginPanel";
import OrderList from "../components/OrderList";
import SearchBar from "../components/SearchBar";
import dummyProducts from "../data/dummyProducts";
import { useVoiceRecognition } from "../hooks/useVoiceRecognition";
import {
  createOrder,
  createProduct,
  deleteOrder,
  deleteProduct,
  getCart,
  getOrderById,
  getOrders,
  getOrdersByUser,
  getUniqueCount,
  getProducts,
  saveCart,
  signIn,
  signUp,
  updateOrderStatus,
  updateProduct,
} from "../services/api";

const PAGE_SIZE = 5;
const PRODUCT_STORAGE_KEY = "order_management_products_v5";
const SESSION_STORAGE_KEY = "order_management_session_v1";
const PRODUCT_CATALOG_VERSION = 2;
const JEWELRY_CATEGORIES = new Set([
  "rings",
  "earrings",
  "pendants",
  "bracelets",
  "engagement",
  "necklaces",
  "chains",
]);

const DUMMY_BY_ID = new Map(dummyProducts.map((item) => [item.id, item]));

const normalizeProduct = (product) => {
  const seed = DUMMY_BY_ID.get(product?.id) || {};

  return {
    ...seed,
    ...product,
    rating: Number(product?.rating ?? seed.rating ?? 0),
    reviews: Number(product?.reviews ?? seed.reviews ?? 0),
    material: product?.material ?? seed.material ?? "N/A",
    metal: product?.metal ?? seed.metal ?? "N/A",
    gemstone: product?.gemstone ?? seed.gemstone ?? null,
    color: product?.color ?? seed.color ?? "N/A",
    weight: product?.weight ?? seed.weight ?? "N/A",
  };
};

const normalizeProducts = (items) => items.map(normalizeProduct);

const readSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    if (!parsed.email || !parsed.name || !parsed.role) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const readProducts = () => {
  try {
    const raw = localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (!raw) {
      return normalizeProducts(dummyProducts);
    }
    const parsed = JSON.parse(raw);

    // Legacy cache format (plain array) is treated as stale and replaced.
    if (Array.isArray(parsed)) {
      return normalizeProducts(dummyProducts);
    }

    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== PRODUCT_CATALOG_VERSION ||
      !Array.isArray(parsed.items) ||
      parsed.items.length === 0
    ) {
      return normalizeProducts(dummyProducts);
    }

    const items = parsed.items;

    const hasOutdatedCatalog = items.some((item) => {
      const category = String(item?.category || "")
        .trim()
        .toLowerCase();
      return category && !JEWELRY_CATEGORIES.has(category);
    });

    // Safety: ensure latest catalog ids exist, otherwise force refresh.
    const hasExpectedSeedIds = items.some(
      (item) => item?.id === "r-aurora-knot",
    );

    return hasOutdatedCatalog || !hasExpectedSeedIds
      ? normalizeProducts(dummyProducts)
      : normalizeProducts(items);
  } catch {
    return normalizeProducts(dummyProducts);
  }
};

function Home() {
  const [session, setSession] = useState(readSession);
  const [adminView, setAdminView] = useState("orders");
  const [products, setProducts] = useState(readProducts);
  const [cart, setCart] = useState({});
  const [cartHydrated, setCartHydrated] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [orders, setOrders] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [uniqueOrders, setUniqueOrders] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [error, setError] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const pendingDeletedProductsRef = useRef(new Map());

  const {
    transcript: voiceTranscript,
    isListening: isVoiceListening,
    startListening: startVoiceRecording,
    stopListening: stopVoiceRecording,
    isBrowserSupported: voiceSupported,
  } = useVoiceRecognition();

  const activeProducts = useMemo(
    () => products.filter((product) => product.active),
    [products],
  );

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await getProducts(true);
      if (response.data && response.data.length > 0) {
        setProducts(response.data);
      } else {
        // Fallback to dummy products if no products from API
        setProducts(normalizeProducts(dummyProducts));
      }
    } catch {
      // On error, use dummy products
      setProducts(normalizeProducts(dummyProducts));
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!session) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setCartHydrated(false);
      return;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    const hydrateCart = async () => {
      if (!session) {
        setCartHydrated(false);
        return;
      }

      if (session.role !== "customer") {
        setCartHydrated(true);
        return;
      }

      try {
        const cartResponse = await getCart(session.email);
        setCart(cartResponse.data.cart || {});
      } catch {
        setCart({});
      } finally {
        setCartHydrated(true);
      }
    };

    hydrateCart();
  }, [session]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 450);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadOrders = async () => {
    setLoadingList(true);
    setError("");

    try {
      const [ordersResponse, uniqueCountResponse] = await Promise.all([
        getOrders({
          page,
          pageSize,
          query: search,
          status: statusFilter,
        }),
        getUniqueCount(),
      ]);

      setOrders(ordersResponse.data.items);
      setTotal(ordersResponse.data.total);
      setTotalPages(Math.max(ordersResponse.data.total_pages, 1));
      setUniqueOrders(uniqueCountResponse.data.unique_order_count ?? 0);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load orders.");
    } finally {
      setLoadingList(false);
    }
  };

  const loadCustomerOrders = async () => {
    if (!session || session.role !== "customer") {
      return;
    }

    setLoadingCustomerOrders(true);
    try {
      const response = await getOrdersByUser({
        email: session.email,
        page: 1,
        pageSize: 200,
      });

      setCustomerOrders(response.data.items || []);
    } catch {
      setCustomerOrders([]);
    } finally {
      setLoadingCustomerOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    loadCustomerOrders();
  }, [session]);

  useEffect(() => {
    const persistCart = async () => {
      if (!session || session.role !== "customer") {
        return;
      }
      if (!cartHydrated) {
        return;
      }
      try {
        await saveCart({ email: session.email, cart });
      } catch {
        // Keep UI responsive even if cart persistence fails.
      }
    };

    persistCart();
  }, [cart, cartHydrated, session]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    toast.success(feedback);
    setFeedback("");
  }, [feedback]);

  useEffect(() => {
    if (!error) {
      return;
    }
    toast.error(error);
    setError("");
  }, [error]);

  useEffect(() => {
    return () => {
      pendingDeletedProductsRef.current.forEach((entry) => {
        clearTimeout(entry.timeoutId);
      });
      pendingDeletedProductsRef.current.clear();
    };
  }, []);

  const handleCreate = async (payload) => {
    setLoadingCreate(true);
    setError("");

    try {
      await createOrder(payload);
      setPage(1);
      await loadOrders();
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create order.");
      return false;
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    setError("");

    try {
      await updateOrderStatus(orderId, status);
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update status.");
    }
  };

  const handleDelete = async (orderId) => {
    setError("");

    try {
      await deleteOrder(orderId);
      if (orders.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadOrders();
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete order.");
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  const handleAddProduct = async (product) => {
    setError("");
    try {
      const response = await createProduct(product);
      setProducts((prev) => [response.data, ...prev]);
      toast.success("Product added successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add product.");
    }
  };

  const handleRemoveProduct = async (productId) => {
    setError("");
    const existing = products.find((product) => product.id === productId);
    const label = existing?.name || "Product";

    if (!existing) {
      setError("Product not found.");
      return;
    }

    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((product) => product.id !== productId));

      const timeoutId = setTimeout(() => {
        pendingDeletedProductsRef.current.delete(productId);
      }, 6000);

      pendingDeletedProductsRef.current.set(productId, {
        product: existing,
        timeoutId,
      });

      toast.error(
        ({ closeToast }) => (
          <div className="undo-toast-content">
            <span>{label} removed.</span>
            <button
              type="button"
              className="undo-toast-btn"
              onClick={async () => {
                const pending =
                  pendingDeletedProductsRef.current.get(productId);
                if (!pending) {
                  return;
                }

                clearTimeout(pending.timeoutId);
                pendingDeletedProductsRef.current.delete(productId);

                try {
                  const response = await updateProduct(productId, {
                    active: true,
                  });
                  setProducts((prev) => [response.data, ...prev]);
                  toast.success(`${label} restored.`);
                  closeToast?.();
                } catch (err) {
                  setError(
                    err.response?.data?.detail || "Failed to restore product.",
                  );
                }
              }}
            >
              Undo
            </button>
          </div>
        ),
        {
          autoClose: 6000,
          closeOnClick: false,
        },
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to remove product.");
    }
  };

  const handleUpdateProduct = async (productId, changes) => {
    setError("");
    const existing = products.find((product) => product.id === productId);
    const label = existing?.name || "Product";
    const hasStockChange = Object.prototype.hasOwnProperty.call(
      changes,
      "stock",
    );
    const hasVisibilityChange = Object.prototype.hasOwnProperty.call(
      changes,
      "active",
    );

    const previousStock = Number(existing?.stock ?? 0);
    const nextStock = hasStockChange
      ? Number(changes.stock ?? previousStock)
      : previousStock;

    try {
      const response = await updateProduct(productId, changes);
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? response.data : product,
        ),
      );

      if (hasStockChange) {
        const delta = nextStock - previousStock;
        if (delta > 0) {
          toast.success(`Added ${delta} stock to ${label}.`);
        } else if (delta < 0) {
          toast.error(`Removed ${Math.abs(delta)} stock from ${label}.`);
        } else {
          toast.info(`Stock unchanged for ${label}.`);
        }
        return;
      }

      if (hasVisibilityChange) {
        toast.success(
          changes.active
            ? `${label} is now visible.`
            : `${label} is now hidden.`,
        );
        return;
      }

      toast.success(`${label} updated successfully.`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update product.");
    }
  };

  const handleAddToCart = (product) => {
    setFeedback("");
    setError("");

    const currentQty = cart[product.id] || 0;
    if (currentQty + 1 > product.stock) {
      setError(`Only ${product.stock} left for ${product.name}.`);
      return;
    }
    setCart((prev) => ({ ...prev, [product.id]: currentQty + 1 }));
    setFeedback(`${product.name} added to cart successfully.`);
  };

  const handleUpdateCartQty = (productId, nextQty) => {
    const safeQty = Math.max(Number(nextQty) || 0, 0);
    if (safeQty === 0) {
      setCart((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      return;
    }

    const product = products.find((item) => item.id === productId);
    if (!product || safeQty > product.stock) {
      return;
    }

    setCart((prev) => ({ ...prev, [productId]: safeQty }));
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handlePlaceOrder = async (cartLines, cartTotal) => {
    setLoadingCreate(true);
    setError("");
    setFeedback("");

    if (cartLines.length === 0) {
      setLoadingCreate(false);
      setError("Cart is empty.");
      return;
    }

    const payload = {
      customer_name: session.name,
      user_email: session.email,
      items: cartLines.flatMap((item) =>
        Array.from(
          { length: item.quantity },
          () => `[${item.id}] ${item.name} (Rs. ${item.price})`,
        ),
      ),
      total_price: Number(cartTotal.toFixed(2)),
    };

    try {
      const createResponse = await createOrder(payload);
      setProducts((prev) =>
        prev.map((product) => {
          const line = cartLines.find((item) => item.id === product.id);
          if (!line) {
            return product;
          }
          return {
            ...product,
            stock: Math.max(product.stock - line.quantity, 0),
          };
        }),
      );
      setCart({});
      setFeedback("Order placed successfully.");

      const createdOrderId = createResponse?.data?.id;
      if (createdOrderId) {
        try {
          const invoiceResponse = await getOrderById(createdOrderId);
          setSelectedInvoice(invoiceResponse.data);
        } catch {
          setSelectedInvoice(createResponse?.data || null);
        }
      }

      await loadOrders();
      await loadCustomerOrders();
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to create order.";
      setError(message);
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleOpenInvoice = async (orderId) => {
    try {
      const response = await getOrderById(orderId);
      setSelectedInvoice(response.data);
    } catch {
      setError("Failed to load invoice details.");
    }
  };

  const handleCloseInvoice = () => {
    setSelectedInvoice(null);
  };

  const previousDisabled = page <= 1;
  const nextDisabled = page >= totalPages;
  const role = session?.role || "customer";

  if (!session) {
    return (
      <LoginPanel
        loading={loadingAuth}
        onLogin={async ({ mode, name, email, password }) => {
          setError("");
          setFeedback("");
          setLoadingAuth(true);

          try {
            const response =
              mode === "signup"
                ? await signUp({ name, email, password })
                : await signIn({ email, password });

            const signedInUser = response.data;
            setSession(signedInUser);
          } catch (err) {
            setError(err.response?.data?.detail || "Authentication failed.");
          } finally {
            setLoadingAuth(false);
          }
        }}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className="dashboard-nav panel">
        <div className="dashboard-brand"></div>
        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            className="dashboard-search"
            value={role === "admin" ? searchInput : productSearch}
            onChange={(event) =>
              role === "admin"
                ? setSearchInput(event.target.value)
                : setProductSearch(event.target.value)
            }
            placeholder={
              role === "admin"
                ? "Search by order id, customer, item, or status"
                : "Search jewelry by name, category, or description"
            }
            style={{
              flex: 1,
              backgroundColor: isVoiceListening ? "#e8f5e9" : "white",
            }}
          />
          {voiceSupported && (
            <button
              type="button"
              onClick={() => {
                console.log(
                  "Dashboard voice button clicked, isListening:",
                  isVoiceListening,
                );
                if (isVoiceListening) {
                  console.log("Stopping voice recording...");
                  stopVoiceRecording();
                } else {
                  console.log("Starting voice recording for search...");
                  startVoiceRecording((finalTranscript) => {
                    console.log(
                      "Dashboard voice callback received:",
                      finalTranscript,
                    );
                    if (finalTranscript) {
                      console.log(
                        "Updating search field with:",
                        finalTranscript,
                      );
                      if (role === "admin") {
                        setSearchInput(finalTranscript);
                      } else {
                        setProductSearch(finalTranscript);
                      }
                    }
                  });
                }
              }}
              style={{
                position: "absolute",
                right: "12px",
                background: isVoiceListening ? "#4caf50" : "#ddd",
                color: isVoiceListening ? "white" : "#333",
                border: "none",
                borderRadius: "4px",
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: isVoiceListening ? "bold" : "normal",
              }}
              title="Click to use voice search"
            >
              🎤 {isVoiceListening ? "Listening..." : ""}
            </button>
          )}
        </div>
        <div className="dashboard-profile">
          <span>{session.name}</span>
        </div>
      </section>

      <section className="hero">
        <h1>
          {role === "admin" ? "Admin Dashboard" : `Welcome ${session.name}`}
        </h1>
        <div className="hero-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setSession(null);
              localStorage.removeItem(SESSION_STORAGE_KEY);
              setCart({});
              setCartHydrated(false);
              setCustomerOrders([]);
              setSelectedInvoice(null);
              setError("");
              setFeedback("");
            }}
          >
            Logout
          </button>
        </div>
      </section>

      {role === "customer" ? (
        <CustomerStorefront
          products={activeProducts}
          productSearch={productSearch}
          cart={cart}
          placingOrder={loadingCreate}
          onAddToCart={handleAddToCart}
          onUpdateCartQty={handleUpdateCartQty}
          onRemoveFromCart={handleRemoveFromCart}
          onPlaceOrder={handlePlaceOrder}
          customerOrders={customerOrders}
          ordersLoading={loadingCustomerOrders}
          onOpenInvoice={handleOpenInvoice}
          selectedInvoice={selectedInvoice}
          onCloseInvoice={handleCloseInvoice}
        />
      ) : (
        <>
          <section className="panel admin-section-switch">
            <button
              type="button"
              className={adminView === "orders" ? "active" : ""}
              onClick={() => setAdminView("orders")}
            >
              Order Management
            </button>
            <button
              type="button"
              className={adminView === "products" ? "active" : ""}
              onClick={() => setAdminView("products")}
            >
              Product Inventory
            </button>
          </section>

          {adminView === "products" ? (
            <AdminProductManager
              products={products}
              onAddProduct={handleAddProduct}
              onRemoveProduct={handleRemoveProduct}
              onUpdateProduct={handleUpdateProduct}
            />
          ) : (
            <section className="admin-order-layout">
              <div className="order-tools">
                <SearchBar
                  onClear={handleClearSearch}
                  status={statusFilter}
                  onStatusChange={setStatusFilter}
                />
              </div>

              <div className="panel order-results-panel">
                <div className="order-results-head">
                  <h2>Order Results</h2>
                  <div className="order-results-meta">
                    <span>
                      Page {page} of {totalPages} ({total} orders)
                    </span>
                    <span className="unique-orders-pill">
                      Unique Orders: {uniqueOrders}
                    </span>
                  </div>
                </div>

                {loadingList ? (
                  <div className="panel">Loading orders...</div>
                ) : (
                  <OrderList
                    orders={orders}
                    onStatusChange={handleStatusUpdate}
                    onDelete={handleDelete}
                  />
                )}

                <section className="pagination pagination-inline">
                  <div className="pagination-left">
                    <label>
                      Page Size
                      <select
                        value={pageSize}
                        onChange={(event) =>
                          setPageSize(Number(event.target.value))
                        }
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </label>
                  </div>
                  <div className="pagination-right">
                    <button
                      type="button"
                      onClick={() => setPage(1)}
                      disabled={previousDisabled}
                    >
                      First
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={previousDisabled}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={nextDisabled}
                    >
                      Next
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage(totalPages)}
                      disabled={nextDisabled}
                    >
                      Last
                    </button>
                  </div>
                </section>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default Home;
