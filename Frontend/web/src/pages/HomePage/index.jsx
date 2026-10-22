import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import styles from "./HomePage.module.css";
import api, { getApiErrorMessage } from "../../plugins/axios";

function getPaginationItems(current, total) {
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
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Danh sách thể loại từ API /api/genres/
  const [genres, setGenres] = useState([]);
  // Danh sách sách từ API /api/books/
  const [books, setBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);

  // Tác giả nổi bật từ API /api/authors/
  const [featuredAuthors, setFeaturedAuthors] = useState([]);
  // Danh sách ID sách trong kệ cá nhân từ API /api/user-library/
  const [savedBooks, setSavedBooks] = useState([]);
  const [libraryRecords, setLibraryRecords] = useState({}); // bookId -> recordId

  const searchKeyword = searchParams.get("search") || "";
  const selectedGenre = searchParams.get("genre") || "all";
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;

  // 1. Lấy danh sách thể loại
  useEffect(() => {
    api
      .get("/api/genres/")
      .then((res) => {
        const results = res.data?.results || res.data || [];
        setGenres(results);
      })
      .catch((err) => {
        console.error("Lỗi khi tải thể loại:", err);
      });
  }, []);

  // 2. Lấy danh sách tác giả nổi bật
  useEffect(() => {
    api
      .get("/api/authors/")
      .then((res) => {
        const results = Array.isArray(res.data)
          ? res.data.slice(0, 5)
          : res.data?.results?.slice(0, 5) || [];
        setFeaturedAuthors(results);
      })
      .catch((err) => {
        console.error("Lỗi khi tải tác giả:", err);
      });
  }, []);

  // 3. Lấy danh sách sách của user nếu đã đăng nhập
  const loadUserLibrary = () => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");
    if (!token) {
      setSavedBooks([]);
      setLibraryRecords({});
      return;
    }

    api
      .get("/api/user-library/")
      .then((res) => {
        const items = res.data || [];
        const bookIds = items.map((item) => item.book);
        const map = {};
        items.forEach((item) => {
          map[item.book] = item.id;
        });
        setSavedBooks(bookIds);
        setLibraryRecords(map);
      })
      .catch(() => {
        // Có thể chưa đăng nhập hoặc token hết hạn
      });
  };

  useEffect(() => {
    loadUserLibrary();
    window.addEventListener("auth_token_refreshed", loadUserLibrary);
    window.addEventListener("auth_logout", () => {
      setSavedBooks([]);
      setLibraryRecords({});
    });
    return () => {
      window.removeEventListener("auth_token_refreshed", loadUserLibrary);
    };
  }, []);

  // 4. Lấy danh sách sách theo bộ lọc (?search= & ?genre= & page)
  useEffect(() => {
    setIsLoadingBooks(true);
    const params = {
      page: page,
    };
    if (searchKeyword.trim()) {
      params.search = searchKeyword.trim();
    }
    if (selectedGenre && selectedGenre !== "all") {
      params.genre = selectedGenre;
    }

    api
      .get("/api/books/", { params })
      .then((res) => {
        setBooks(res.data.results || []);
        setTotalBooks(res.data.count || 0);
        setTotalPages(res.data.total_pages || 1);
      })
      .catch((err) => {
        console.error("Lỗi khi tải sách:", err);
        setBooks([]);
      })
      .finally(() => {
        setIsLoadingBooks(false);
      });
  }, [searchKeyword, selectedGenre, page]);

  // Xử lý chuyển trang qua URL (?page=X)
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

  // Xử lý chọn thể loại (luôn reset về trang 1)
  const handleSelectGenre = (genreId) => {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (genreId === "all") {
      params.delete("genre");
    } else {
      params.set("genre", genreId);
    }
    setSearchParams(params);
  };

  // Thêm/Xóa sách khỏi kệ cá nhân
  const toggleShelf = async (bookId) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");
    if (!token) {
      toast.info("Vui lòng đăng nhập để lưu sách vào kệ cá nhân.");
      navigate("/login");
      return;
    }

    const isAdded = savedBooks.includes(bookId);

    if (isAdded && libraryRecords[bookId]) {
      // Xóa khỏi kệ
      try {
        await api.delete(`/api/user-library/${libraryRecords[bookId]}/`);
        setSavedBooks((prev) => prev.filter((id) => id !== bookId));
        setLibraryRecords((prev) => {
          const updated = { ...prev };
          delete updated[bookId];
          return updated;
        });
        toast.info("Đã bỏ lưu cuốn sách khỏi kệ cá nhân.");
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Không thể xóa sách khỏi kệ."));
      }
    } else {
      // Thêm vào kệ (WANT_TO_READ)
      try {
        const res = await api.post("/api/user-library/", {
          book: bookId,
          status: "WANT_TO_READ",
        });
        setSavedBooks((prev) => [...prev, bookId]);
        setLibraryRecords((prev) => ({
          ...prev,
          [bookId]: res.data.id,
        }));
        toast.success("Đã thêm sách vào kệ 'Muốn đọc'!");
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Không thể thêm sách vào kệ."));
      }
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />

      {/* Banner giới thiệu đầu trang */}
      <section className={styles.banner}>
        <div className={styles.bannerInner}>
          <div>
            <h1 className={styles.bannerTitle}>
              Meet your next favorite book.
            </h1>
            <p className={styles.bannerDesc}>
              Khám phá kho sách với hơn {totalBooks || 300} đầu sách chọn lọc, lưu vào tủ sách cá nhân và chia sẻ đánh giá cùng cộng đồng E-Library.
            </p>
          </div>
        </div>
      </section>

      {/* Bố cục 3 cột chuẩn Goodreads */}
      <main className={styles.mainContainer}>
        {/* CỘT TRÁI: Danh mục Thể loại (API GET /api/genres/) */}
        <aside>
          <h2 className={styles.sectionTitle}>Browse Genres</h2>
          <ul className={styles.genreList}>
            <li className={styles.genreItem}>
              <button
                onClick={() => handleSelectGenre("all")}
                className={`${styles.genreBtn} ${
                  selectedGenre === "all" ? styles.genreBtnActive : ""
                }`}
              >
                <span>All Genres</span>
                <span>({totalBooks})</span>
              </button>
            </li>
            {genres.slice(0, 15).map((genre) => (
              <li key={genre.id} className={styles.genreItem}>
                <button
                  onClick={() => handleSelectGenre(String(genre.id))}
                  className={`${styles.genreBtn} ${
                    String(selectedGenre) === String(genre.id) ? styles.genreBtnActive : ""
                  }`}
                >
                  <span>{genre.name}</span>
                  <span>({genre.book_count})</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* CỘT GIỮA: Danh sách Sách (API GET /api/books/?search=&genre=) */}
        <section>
          <div className={styles.filterHeader}>
            <h2 className={styles.resultTitle}>
              {searchKeyword
                ? `Search results for "${searchKeyword}"`
                : selectedGenre === "all"
                  ? "Popular & Featured Books"
                  : genres.find((g) => String(g.id) === String(selectedGenre))?.name || "Books"}
              <span style={{ fontSize: "14px", fontWeight: "normal", color: "#666", marginLeft: "8px" }}>
                ({totalBooks} books found)
              </span>
            </h2>

            {(searchKeyword || selectedGenre !== "all") && (
              <button
                onClick={() => setSearchParams({})}
                className={styles.clearBtn}
              >
                Clear filters ✕
              </button>
            )}
          </div>

          {isLoadingBooks ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              Đang tải danh sách sách từ máy chủ...
            </div>
          ) : books.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Không tìm thấy cuốn sách nào khớp với yêu cầu của bạn.</p>
              <button
                onClick={() => setSearchParams({})}
                className={styles.clearBtn}
              >
                Xem tất cả sách
              </button>
            </div>
          ) : (
            <>
              <div className={styles.bookGrid}>
                {books.map((book) => {
                  const isAdded = savedBooks.includes(book.id);
                  const ratingVal = Number(book.avg_rating || book.rating || 0).toFixed(1);
                  const reviewsCount = book.review_count || 0;

                  return (
                    <div key={book.id} className={styles.bookCard}>
                      <Link
                        to={`/books/${book.id}`}
                        className={styles.coverWrapper}
                      >
                        <img
                          src={book.cover_image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80"}
                          alt={book.title}
                          className={styles.coverImg}
                          loading="lazy"
                        />
                      </Link>

                      <Link to={`/books/${book.id}`} className={styles.bookTitle}>
                        {book.title}
                      </Link>
                      <div className={styles.bookAuthor}>
                        by {book.author_id ? (
                          <Link to={`/authors/${book.author_id}`} style={{ color: "inherit", textDecoration: "none" }}>
                            {book.author}
                          </Link>
                        ) : (
                          book.author
                        )}
                      </div>

                      <div className={styles.ratingRow}>
                        <span className={styles.stars}>★★★★★</span>
                        <span>
                          {ratingVal} ({reviewsCount})
                        </span>
                      </div>

                      <button
                        onClick={() => toggleShelf(book.id)}
                        className={`${styles.shelfBtn} ${isAdded ? styles.shelfBtnAdded : ""}`}
                      >
                        {isAdded ? "✓ In My Shelf" : "+ Want to Read"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Phân trang URL (?page=X) */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "36px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "6px",
                      border: "1px solid #d8d4c8",
                      background: page <= 1 ? "#f4f1ea" : "#ffffff",
                      color: page <= 1 ? "#999" : "#382110",
                      cursor: page <= 1 ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    ← Previous
                  </button>

                  {getPaginationItems(page, totalPages).map((item, idx) => {
                    if (typeof item === "string") {
                      return (
                        <span
                          key={`dots-${idx}`}
                          style={{
                            padding: "0 6px",
                            color: "#888",
                            fontSize: "14px",
                          }}
                        >
                          ...
                        </span>
                      );
                    }

                    const isCurrent = item === page;
                    return (
                      <button
                        key={`page-${item}`}
                        onClick={() => handlePageChange(item)}
                        style={{
                          minWidth: "36px",
                          height: "36px",
                          padding: "0 8px",
                          borderRadius: "6px",
                          border: isCurrent ? "1px solid #382110" : "1px solid #d8d4c8",
                          background: isCurrent ? "#382110" : "#ffffff",
                          color: isCurrent ? "#ffffff" : "#382110",
                          cursor: "pointer",
                          fontWeight: isCurrent ? "700" : "500",
                          fontSize: "14px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.12s",
                        }}
                      >
                        {item}
                      </button>
                    );
                  })}

                  <button
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "6px",
                      border: "1px solid #d8d4c8",
                      background: page >= totalPages ? "#f4f1ea" : "#ffffff",
                      color: page >= totalPages ? "#999" : "#382110",
                      cursor: page >= totalPages ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* CỘT PHẢI: Tác giả nổi bật (API GET /api/authors/) */}
        <aside>
          <h2 className={styles.sectionTitle}>Featured Authors</h2>
          <div className={styles.authorList}>
            {featuredAuthors.map((author) => (
              <Link
                key={author.id}
                to={`/authors/${author.id}`}
                className={styles.authorCard}
              >
                <div className={styles.authorAvatar}>
                  {author.name ? author.name.charAt(0) : "A"}
                </div>
                <div>
                  <div className={styles.authorName}>{author.name}</div>
                  <div className={styles.authorMeta}>
                    View published books →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className={styles.challengeBox}>
            <h3 className={styles.challengeTitle}>My Personal Shelf</h3>
            <p className={styles.challengeText}>
              Bạn đang có <strong>{savedBooks.length} cuốn sách</strong> trong
              kệ sách cá nhân.
            </p>
            <Link to="/my-books" className={styles.challengeLink}>
              Go to My Books →
            </Link>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}
