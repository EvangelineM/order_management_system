import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const createOrder = (payload) => api.post("/orders", payload);

export const signUp = (payload) => api.post("/auth/signup", payload);

export const signIn = (payload) => api.post("/auth/signin", payload);

export const saveCart = (payload) => api.post("/cart", payload);

export const getCart = (email) =>
  api.get("/cart", {
    params: {
      email,
    },
  });

export const getOrders = ({
  page = 1,
  pageSize = 5,
  query = "",
  status = "all",
} = {}) =>
  api.get("/orders", {
    params: {
      page,
      page_size: pageSize,
      q: query,
      status: status === "all" ? undefined : status,
    },
  });

export const getUniqueCount = () => api.get("/orders/count");

export const searchOrders = (query, page = 1, pageSize = 5, status = "all") =>
  api.get("/orders/search", {
    params: {
      q: query,
      page,
      page_size: pageSize,
      status: status === "all" ? undefined : status,
    },
  });

export const updateOrderStatus = (orderId, status) =>
  api.patch(`/orders/${orderId}`, { status });

export const deleteOrder = (orderId) => api.delete(`/orders/${orderId}`);

export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);

export const getOrdersByUser = ({ email, page = 1, pageSize = 50 }) =>
  api.get("/orders/by-user", {
    params: {
      email,
      page,
      page_size: pageSize,
    },
  });

// Product endpoints
export const createProduct = (payload) => api.post("/products", payload);

export const getProducts = (activeOnly = true) =>
  api.get("/products", {
    params: {
      active_only: activeOnly,
    },
  });

export const searchProducts = (query) =>
  api.get("/products/search", {
    params: {
      q: query,
    },
  });

export const getProductById = (productId) =>
  api.get(`/products/${productId}`);

export const updateProduct = (productId, updates) =>
  api.patch(`/products/${productId}`, updates);

export const deleteProduct = (productId) =>
  api.delete(`/products/${productId}`);

export const updateProductStock = (productId, quantityChange) =>
  api.patch(`/products/${productId}/stock`, null, {
    params: {
      quantity_change: quantityChange,
    },
  });
