import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import Header from "../../components/Header";
import styles from "./AuthorsPage.module.css";
import Footer from "../../components/Footer";
import api from "../../plugins/axios";

const ITEMS_PER_PAGE = 8;

const getPaginationItems = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = [1];
  if (current > 3) {
    pages.push("ellipsis-start");
  }
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (current < total - 2) {
    pages.push("ellipsis-end");
  }
  pages.push(total);
  return pages;
};

export default function AuthorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
  const searchTerm = searchParams.get("search") || "";

  const [authors, setAuthors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lấy danh sách tác giả từ API GET /api/authors/?search=
  useEffect(() => {
    setIsLoading(true);
    const params = {};
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    api
      .get("/api/authors/", { params })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        setAuthors(list);
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách tác giả:", err);
        setAuthors([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchTerm]);

  const totalPages = Math.ceil(authors.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAuthors = authors.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (val.trim()) {
      params.set("search", val);
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    if (newPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", newPage);
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        {/* Tiêu đề & Ô tìm kiếm tên tác giả */}
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Authors Directory</h1>
            <p className={styles.pageSubtitle}>
              Khám phá các tác giả nổi tiếng và tác phẩm trong thư viện
            </p>
          </div>

          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search authors by name..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Danh sách tác giả */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            Đang tải danh sách tác giả...
          </div>
        ) : paginatedAuthors.length === 0 ? (
          <div className={styles.emptyState}>
            Không tìm thấy tác giả nào có tên khớp với &ldquo;{searchTerm}&rdquo;.
          </div>
        ) : (
          <>
            <div className={styles.authorGrid}>
              {paginatedAuthors.map((author) => (
                <div key={author.id} className={styles.authorCard}>
                  <div>
                    <div className={styles.cardTop}>
                      <Link
                        to={`/authors/${author.id}`}
                        className={styles.avatar}
                      >
                        {author.name ? author.name.charAt(0) : "A"}
                      </Link>
                      <div>
                        <Link
                          to={`/authors/${author.id}`}
                          className={styles.authorName}
                        >
                          {author.name}
                        </Link>
                        <div className={styles.authorGenre}>
                          Author ID #{author.id}
                        </div>
                      </div>
                    </div>

                    <p className={styles.authorBio}>
                      Tác giả được độc giả yêu mến trong hệ thống thư viện E-Library.
                    </p>
                  </div>

                  <div className={styles.cardFooter}>
                    <span>
                      📚 Author in catalog
                    </span>
                    <Link
                      to={`/authors/${author.id}`}
                      className={styles.viewLink}
                    >
                      View profile & books →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Thanh Phân trang (Pagination) */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className={styles.pageBtn}
                >
                  ← Trước
                </button>

                {getPaginationItems(currentPage, totalPages).map((item, idx) => {
                  if (typeof item === "string") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        style={{ padding: "0 6px", color: "#888", display: "inline-flex", alignItems: "center" }}
                      >
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={`page-${item}`}
                      onClick={() => handlePageChange(item)}
                      className={`${styles.pageBtn} ${
                        item === currentPage ? styles.pageBtnActive : ""
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className={styles.pageBtn}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
