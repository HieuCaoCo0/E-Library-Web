import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import BookDetailPage from "./pages/BookDetailPage";
import MyBooksPage from "./pages/MyBooksPage";
import AuthorDetailPage from "./pages/AuthorDetailPage";
import AuthorsPage from "./pages/AuthorsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";

// Cấu hình hệ thống định tuyến (Routing) cho toàn bộ ứng dụng Single Page Application (SPA)
const router = createBrowserRouter([
  {
    path: "/", // Trang chủ: hiển thị danh mục sách, thể loại, sắp xếp, tìm kiếm và gợi ý cá nhân
    element: <HomePage />,
  },
  {
    path: "/login", // Trang đăng nhập tài khoản
    element: <LoginPage />,
  },
  {
    path: "/register", // Trang đăng ký tài khoản mới
    element: <RegisterPage />,
  },
  {
    path: "/books/:id", // Trang chi tiết sách: mô tả, tác giả, đánh giá cộng đồng và quản lý kệ sách
    element: <BookDetailPage />,
  },
  {
    path: "/my-books", // Trang tủ sách cá nhân: quản lý các kệ Read, Currently Reading, Want to Read
    element: <MyBooksPage />,
  },
  {
    path: "/authors/:id", // Trang chi tiết tác giả: tiểu sử và danh sách các tác phẩm đã xuất bản
    element: <AuthorDetailPage />,
  },
  {
    path: "/authors", // Trang danh bạ tác giả: tìm kiếm và duyệt danh sách tác giả
    element: <AuthorsPage />,
  },
  {
    path: "/profile", // Trang hồ sơ người dùng: cập nhật họ tên, bio, đổi avatar
    element: <ProfilePage />,
  },
  {
    path: "/admin", // Bảng điều khiển quản trị viên (Admin Dashboard): Quản lý Sách, Tác giả, Thể loại
    element: <AdminPage />,
  },
]);

// Khởi chạy ứng dụng React với StrictMode, RouterProvider và ToastContainer thông báo
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="light"
    />
  </StrictMode>,
);
