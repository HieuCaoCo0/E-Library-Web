import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import "./index.css";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import BookDetailPage from "./pages/BookDetailPage";
import MyBooksPage from "./pages/MyBooksPage";
import AuthorDetailPage from "./pages/AuthorDetailPage";
import AuthorsPage from "./pages/AuthorsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/books/:id",
    element: <BookDetailPage />,
  },
  {
    path: "/my-books",
    element: <MyBooksPage />,
  },
  {
    path: "/authors/:id",
    element: <AuthorDetailPage />,
  },
  {
    path: "/authors",
    element: <AuthorsPage />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
