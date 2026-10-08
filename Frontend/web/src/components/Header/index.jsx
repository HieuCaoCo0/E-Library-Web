import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import logo from "../../assets/logo.svg";
import styles from "./Header.module.css";

export default function Header() {
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("search") || "");
  const navigate = useNavigate();

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
          <Link to="/login" className={styles.signInBtn}>
            Sign In
          </Link>
          <Link to="/register" className={styles.registerBtn}>
            Join
          </Link>
        </div>
      </div>
    </header>
  );
}
