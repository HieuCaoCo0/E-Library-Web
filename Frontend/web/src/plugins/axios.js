import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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

// Kiểm tra xem trình duyệt có lưu token đăng nhập (access_token hoặc refresh_token) không
export const getStoredToken = () => {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("refresh_token")
  );
};

// Singleton promise quản lý quá trình refresh token để tránh xung đột khi nhiều request gửi cùng lúc
let refreshPromise = null;

export const refreshAuthToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  // Nếu đã có 1 request đang gọi refresh API, các request khác chỉ việc tái sử dụng Promise này
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
        refresh: refreshToken,
      });

      const newAccessToken = res.data.access;
      // Backend bật ROTATE_REFRESH_TOKENS = True nên trả về cả refresh_token mới (token cũ bị blacklist)
      const newRefreshToken = res.data.refresh || refreshToken;

      localStorage.setItem("access_token", newAccessToken);
      localStorage.setItem("refresh_token", newRefreshToken);

      // Bắn event để Header và các Component biết access_token đã được khôi phục
      window.dispatchEvent(new Event("auth_token_refreshed"));

      return newAccessToken;
    } catch (err) {
      console.warn("Phiên đăng nhập đã hết hạn hoặc refresh_token không hợp lệ:", err);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth_logout"));
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// 1. REQUEST INTERCEPTOR: Tự động gắn Access Token vào mọi request
// Nếu access_token bị xóa hoặc hết hạn nhưng vẫn còn refresh_token, tự động khôi phục trước khi gửi
api.interceptors.request.use(
  async function (config) {
    const isAuthEndpoint =
      config?.url?.includes("/api/auth/login") ||
      config?.url?.includes("/api/auth/token/refresh");

    if (isAuthEndpoint) {
      return config;
    }

    let token = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    // Nếu không có access_token nhưng còn refresh_token: Tự động khôi phục access_token mới
    if (!token && refreshToken) {
      token = await refreshAuthToken();
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// 2. RESPONSE INTERCEPTOR: Tự động gọi refresh token khi gặp 401 Unauthorized giữa chừng
api.interceptors.response.use(
  function (response) {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;

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
        const newAccessToken = await refreshAuthToken();

        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          window.location.href = "/login";
        }
      } else {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
