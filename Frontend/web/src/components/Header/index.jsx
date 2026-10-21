import { useState, useEffect } from "react";
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
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch {
          setCurrentUser({ username: "User" });
        }
      } else {
        // Lấy thông tin user profile từ API nếu chưa có trong localStorage
        api
          .get("/api/users/profile/")
          .then((res) => {
            setCurrentUser(res.data);
            localStorage.setItem("user", JSON.stringify(res.data));
          })
          .catch(() => {
            setCurrentUser({ username: "User" });
          });
      }
    } else {
      setCurrentUser(null);
    }
  }, []);

  // Đồng bộ lại ô input khi URL thay đổi (ví dụ bấm nút Xóa lọc)
  useEffect(() => {
    setKeyword(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
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
      toast.info("Đã đăng xuất thành công.");
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
            <Link to="/admin" className={styles.navLink}>
              Admin
            </Link>
          </nav>
        </div>

        {/* Thanh tìm kiếm sách */}
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
            <>
              <Link to="/profile" className={styles.profileBtn} title={`My Profile (${currentUser.username || ""})`}>
                <img
                  src={currentUser.avatar || avatarDefault}
                  alt="Profile"
                  className={styles.avatarImg}
                />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={styles.signInBtn}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                Sign Out
              </button>
            </>
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
