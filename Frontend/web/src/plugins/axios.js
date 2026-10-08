import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getApiErrorMessage = (error, fallback = "Đã xảy ra lỗi") => {
  const responseData = error.response?.data;
  const detail = responseData?.detail;

  if (responseData?.message) return responseData.message;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;

  // Bắt lỗi Validation theo từng trường của Django REST Framework (VD: { email: ["Email đã tồn tại"] })
  if (responseData && typeof responseData === "object") {
    const firstKey = Object.keys(responseData)[0];
    const firstError = responseData[firstKey];
    if (Array.isArray(firstError) && typeof firstError[0] === "string") {
      return `${firstKey}: ${firstError[0]}`;
    }
    if (typeof firstError === "string") {
      return firstError;
    }
  }

  if (error.request && !error.response) {
    return "Không thể kết nối tới máy chủ. Vui lòng thử lại.";
  }

  return fallback;
};

// 1. REQUEST INTERCEPTOR: Tự động gắn Access Token vào mọi request
api.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

// 2. RESPONSE INTERCEPTOR: Tự động gọi /api/auth/token/refresh/ khi hết hạn (401)
api.interceptors.response.use(
  function (response) {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;

    // Không tự động redirect hay refresh nếu lỗi 401 xảy ra ngay tại API đăng nhập / làm mới token
    const isAuthEndpoint =
      originalRequest?.url?.includes("/api/auth/login") ||
      originalRequest?.url?.includes("/api/auth/token/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          // Gọi API làm mới token của Nguyễn Đức Tài
          const res = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = res.data.access;
          localStorage.setItem("access_token", newAccessToken);

          // Gắn lại token mới và gửi lại request vừa bị lỗi
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Nếu cả refresh_token cũng hết hạn thì mới xóa sạch và đưa về /login
          console.warn("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
