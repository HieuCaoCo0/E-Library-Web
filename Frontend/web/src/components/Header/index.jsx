import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import logo from "../../assets/logo.svg";
import styles from "./Header.module.css";
import avatarDefault from "../../assets/avatar.png";
import api from "../../plugins/axios";

export default function Header() {
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("search") || "");
  const [currentUser, setCurrentUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Đóng dropdown khi click ra ngoài hoặc bấm Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    // 1. Khởi tạo thông tin người dùng khi nạp trang (On-Mount)
    const hasAuth =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");

    if (hasAuth) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch {
          setCurrentUser({ username: "User" });
        }
      }
      // Đồng bộ thông tin profile khi trang vừa mở
      api
        .get("/api/users/profile/")
        .then((res) => {
          setCurrentUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        })
        .catch(() => {});
    } else {
      setCurrentUser(null);
    }

    // 2. Chỉ phản ứng khi Đăng xuất đa tab (chuẩn Cách 2 - On-Demand)
    const handleStorageChange = (e) => {
      const stillHasAuth =
        localStorage.getItem("access_token") ||
        localStorage.getItem("refresh_token");

      if (!stillHasAuth) {
        // Cả 2 token đều bị xóa (người dùng bấm Đăng xuất ở tab khác)
        setCurrentUser(null);
      } else if (e.key === "user" && e.newValue) {
        try {
          setCurrentUser(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("auth_logout", () => setCurrentUser(null));
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("auth_logout", () => setCurrentUser(null));
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Đồng bộ lại ô input khi URL thay đổi (ví dụ bấm nút Xóa lọc)
  useEffect(() => {
    setKeyword(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (keyword.trim()) {
      params.set("search", keyword.trim());
    } else {
      params.delete("search");
    }
    navigate(`/?${params.toString()}`);
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await api.post("/api/auth/logout/", { refresh: refreshToken });
      }
    } catch {
      // Bỏ qua lỗi khi logout nếu token đã hết hạn
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setCurrentUser(null);
      toast.info("Signed out successfully.");
      navigate("/login");
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Link to="/" className={styles.logo}>
            <img src={logo} alt="E Library" />
          </Link>

          <nav className={styles.nav}>
            <Link to="/" className={styles.navLink}>
              Home
            </Link>
            <Link to="/my-books" className={styles.navLink}>
              My Books
            </Link>
            <Link to="/authors" className={styles.navLink}>
              Authors
            </Link>
            {Boolean(
              currentUser?.is_staff ||
                currentUser?.is_superuser ||
                currentUser?.username === "admin"
            ) && (
              <Link to="/admin" className={styles.navLink}>
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Book search input */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search books by title or author..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn} title="Search">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>

        <div className={styles.rightSection}>
          {currentUser ? (
            <div className={styles.userMenuContainer} ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className={`${styles.avatarToggleBtn} ${isMenuOpen ? styles.avatarToggleBtnActive : ""}`}
                title={`Account: ${currentUser.username || ""}`}
                aria-label="User account menu"
                aria-expanded={isMenuOpen}
              >
                <img
                  src={currentUser.avatar || avatarDefault}
                  alt={currentUser.username || "Profile"}
                  className={styles.avatarImg}
                />
              </button>

              {isMenuOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.userHeader}>
                    <div className={styles.userDisplayName}>
                      {currentUser.first_name || currentUser.last_name
                        ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim()
                        : currentUser.username || "Member"}
                    </div>
                    <div className={styles.userUsername}>@{currentUser.username || "user"}</div>
                  </div>

                  <div className={styles.menuDivider} />

                  <Link
                    to="/profile"
                    className={styles.menuItem}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Profile</span>
                  </Link>

                  <Link
                    to="/my-books"
                    className={styles.menuItem}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <span>My Books</span>
                  </Link>

                  {Boolean(currentUser.is_staff || currentUser.is_superuser || currentUser.username === "admin") && (
                    <Link
                      to="/admin"
                      className={styles.menuItem}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <div className={styles.menuDivider} />

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className={`${styles.menuItem} ${styles.logoutItem}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className={styles.signInBtn}>
                Sign In
              </Link>
              <Link to="/register" className={styles.registerBtn}>
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
