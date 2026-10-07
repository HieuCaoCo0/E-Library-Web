import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
});

export const getApiErrorMessage = (error, fallback = "Đã xảy ra lỗi") => {
  const responseData = error.response?.data;
  const detail = responseData?.detail;

  if (responseData?.message) return responseData.message;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  if (error.request && !error.response) {
    return "Không thể kết nối tới máy chủ. Vui lòng thử lại.";
  }

  return fallback;
};

api.interceptors.request.use(function (config) {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (error.response && error.response.status === 401) {
      console.log("Token hết hạn, ép người dùng văng ra màn hình Đăng nhập!");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);
export default api;
