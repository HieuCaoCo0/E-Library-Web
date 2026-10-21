import { useState, useEffect } from "react";
import { Link } from "react-router";
import Header from "../../components/Header";
import styles from "./AuthorsPage.module.css";
import Footer from "../../components/Footer";
import api from "../../plugins/axios";

const ITEMS_PER_PAGE = 8;

export default function AuthorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
    setSearchTerm(e.target.value);
    setCurrentPage(1);
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
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                  className={styles.pageBtn}
                >
                  ← Prev
                </button>

                <span style={{ display: "flex", alignItems: "center", padding: "0 12px", fontSize: "14px", color: "#555" }}>
                  Trang {currentPage} / {totalPages} ({authors.length} tác giả)
                </span>

                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === totalPages}
                  className={styles.pageBtn}
                >
                  Next →
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
