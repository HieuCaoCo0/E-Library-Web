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

  // Danh sách thể loại nạp từ API GET /api/genres/?page_size=500
  const [genres, setGenres] = useState([]);
  // Danh sách sách nạp từ API GET /api/books/
  const [books, setBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0); // Tổng số sách theo bộ lọc hiện tại
  const [overallTotalBooks, setOverallTotalBooks] = useState(300); // Tổng số sách toàn thư viện
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);

  // Danh sách sách gợi ý cá nhân hóa từ API GET /api/recommendations/
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [isColdStart, setIsColdStart] = useState(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return Boolean(
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token")
    );
  });
  // Danh sách ID các cuốn sách user đã lưu vào kệ cá nhân (API GET /api/user-library/)
  const [savedBooks, setSavedBooks] = useState([]);
  const [libraryRecords, setLibraryRecords] = useState({}); // Bản đồ ánh xạ: bookId -> recordId

  const searchKeyword = searchParams.get("search") || "";
  const selectedGenre = searchParams.get("genre") || "all";
  const currentOrdering = searchParams.get("ordering") || "id";
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;

  // 1. Nạp toàn bộ 140 thể loại từ Backend để hiển thị ở thanh bên trái
  useEffect(() => {
    api
      .get("/api/genres/?page_size=500")
      .then((res) => {
        const results = res.data?.results || res.data || [];
        setGenres(results);
      })
      .catch((err) => {
        console.error("Lỗi khi tải danh sách thể loại:", err);
      });
  }, []);

  // 2. Nạp danh sách sách trên kệ cá nhân của người dùng (nếu đã đăng nhập)
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

  // 3. Nạp danh sách sách gợi ý cá nhân hóa (API GET /api/recommendations/)
  const loadRecommendations = () => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");

    if (!token) {
      setIsLoggedIn(false);
      setRecommendedBooks([]);
      setIsLoadingRecs(false);
      return;
    }

    setIsLoggedIn(true);
    setIsLoadingRecs(true);

    api
      .get("/api/recommendations/")
      .then((res) => {
        setRecommendedBooks(res.data?.results || []);
        setIsColdStart(Boolean(res.data?.cold_start));
      })
      .catch((err) => {
        console.error("Lỗi khi tải gợi ý sách:", err);
        setRecommendedBooks([]);
      })
      .finally(() => {
        setIsLoadingRecs(false);
      });
  };

  // Lắng nghe sự kiện đăng nhập, đăng xuất, và làm mới token để tự động cập nhật dữ liệu
  useEffect(() => {
    loadUserLibrary();
    loadRecommendations();

    const handleAuthRefreshed = () => {
      loadUserLibrary();
      loadRecommendations();
    };

    const handleAuthLogout = () => {
      setIsLoggedIn(false);
      setSavedBooks([]);
      setLibraryRecords({});
      loadRecommendations();
    };

    window.addEventListener("auth_token_refreshed", handleAuthRefreshed);
    window.addEventListener("auth_logout", handleAuthLogout);
    return () => {
      window.removeEventListener("auth_token_refreshed", handleAuthRefreshed);
      window.removeEventListener("auth_logout", handleAuthLogout);
    };
  }, []);

  // 4. Nạp danh sách sách theo bộ lọc: tìm kiếm, thể loại, sắp xếp, và số trang
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
    if (currentOrdering && currentOrdering !== "id") {
      params.ordering = currentOrdering;
    }

    api
      .get("/api/books/", { params })
      .then((res) => {
        setBooks(res.data.results || []);
        const count = res.data.count || 0;
        setTotalBooks(count);
        setTotalPages(res.data.total_pages || 1);
        if (!searchKeyword && (!selectedGenre || selectedGenre === "all")) {
          setOverallTotalBooks(count);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải danh sách sách:", err);
        setBooks([]);
      })
      .finally(() => {
        setIsLoadingBooks(false);
      });
  }, [searchKeyword, selectedGenre, page, currentOrdering]);

  // Xử lý chuyển trang (?page=X) và cuộn mượt lên đầu trang
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

  // Xử lý lọc theo thể loại (tự động reset về trang 1)
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

  // Xử lý thay đổi tiêu chí sắp xếp (Điểm cao, Mới nhất, Tên A-Z, v.v., tự động reset về trang 1)
  const handleSortChange = (newOrdering) => {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (newOrdering === "id" || !newOrdering) {
      params.delete("ordering");
    } else {
      params.set("ordering", newOrdering);
    }
    setSearchParams(params);
  };

  // Thêm hoặc Xoá sách khỏi kệ 'Want to Read' của người dùng
  const toggleShelf = async (bookId) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");
    if (!token) {
      toast.info("Please sign in to save books to your personal shelf.");
      navigate("/login");
      return;
    }

    const isAdded = savedBooks.includes(bookId);

    if (isAdded && libraryRecords[bookId]) {
      // Đã có trong kệ -> Bấm lại để xoá khỏi kệ cá nhân (DELETE /api/user-library/{id}/)
      try {
        await api.delete(`/api/user-library/${libraryRecords[bookId]}/`);
        setSavedBooks((prev) => prev.filter((id) => id !== bookId));
        setLibraryRecords((prev) => {
          const updated = { ...prev };
          delete updated[bookId];
          return updated;
        });
        toast.info("Removed book from personal shelf.");
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Unable to remove book from shelf."));
      }
    } else {
      // Chưa có trong kệ -> Thêm vào kệ với trạng thái WANT_TO_READ (POST /api/user-library/)
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
        toast.success("Added book to 'Want to Read' shelf!");
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Unable to add book to shelf."));
      }
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />

      {/* Hero Banner */}
      <section className={styles.banner}>
        <div className={styles.bannerInner}>
          <div>
            <h1 className={styles.bannerTitle}>
              Meet your next favorite book.
            </h1>
            <p className={styles.bannerDesc}>
              Discover a curated collection of over {overallTotalBooks || 300} books, save them to your personal bookshelf, and share reviews with the E-Library community.
            </p>
          </div>
        </div>
      </section>

      {/* Standard 3-column Goodreads-inspired layout */}
      <main className={styles.mainContainer}>
        {/* LEFT COLUMN: Genres Directory (API GET /api/genres/) */}
        <aside>
          <h2 className={styles.sectionTitle}>Browse Genres</h2>
          <ul className={styles.genreList}>
            <li className={`${styles.genreItem} ${styles.allGenresItem}`}>
              <button
                onClick={() => handleSelectGenre("all")}
                className={`${styles.genreBtn} ${
                  selectedGenre === "all" ? styles.genreBtnActive : ""
                }`}
              >
                <span>All Genres</span>
                <span>({overallTotalBooks || 300})</span>
              </button>
            </li>
            {genres.map((genre) => (
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

        {/* CENTER COLUMN: Books Catalog (API GET /api/books/?search=&genre=) */}
        <section>
          <div className={styles.filterHeader}>
            <div className={styles.filterTitleArea}>
              <h2 className={styles.resultTitle}>
                {searchKeyword
                  ? `Search results for "${searchKeyword}"`
                  : selectedGenre === "all"
                    ? "Popular & Featured Books"
                    : genres.find((g) => String(g.id) === String(selectedGenre))?.name || "Books"}
              </h2>
              <span className={styles.booksCountBadge}>
                ({totalBooks} {totalBooks === 1 ? "book" : "books"} found)
              </span>
            </div>

            <div className={styles.filterControlsRow}>
              <div className={styles.sortWrapper}>
                <label htmlFor="sort-select" className={styles.sortLabel}>
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  className={styles.sortSelect}
                  value={currentOrdering}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="id">Default</option>
                  <option value="-rating">Highest Rating</option>
                  <option value="-avg_rating">Top Community Reviews</option>
                  <option value="-publish_date">Publication Date: Newest</option>
                  <option value="publish_date">Publication Date: Oldest</option>
                  <option value="title">Title: A to Z</option>
                  <option value="-title">Title: Z to A</option>
                  <option value="-id">Recently Added</option>
                </select>
              </div>

              {(searchKeyword || selectedGenre !== "all" || (currentOrdering && currentOrdering !== "id")) && (
                <button
                  onClick={() => setSearchParams({})}
                  className={styles.clearBtn}
                  title="Reset all filters and sorting"
                >
                  Clear filters ✕
                </button>
              )}
            </div>
          </div>

          {isLoadingBooks ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              Loading books from server...
            </div>
          ) : books.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No books found matching your criteria.</p>
              <button
                onClick={() => setSearchParams({})}
                className={styles.clearBtn}
              >
                View all books
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

              {/* Pagination URL (?page=X) */}
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

        {/* RIGHT COLUMN: Book Recommendations */}
        <aside>
          <div className={styles.recContainer}>
            <div className={styles.recHeader}>
              <h2 className={styles.recTitle}>
                {isColdStart ? (
                  <span>★ Top Rated Books</span>
                ) : (
                  <span>✨ Recommended For You</span>
                )}
              </h2>
            </div>

            {isLoadingRecs ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "#888", fontSize: "13px" }}>
                Finding recommendations...
              </div>
            ) : recommendedBooks.length === 0 ? (
              <div style={{ padding: "16px 0", color: "#666", fontSize: "13px" }}>
                No recommendations yet. Add books to your shelf to receive personalized suggestions!
              </div>
            ) : (
              <div className={styles.recList}>
                {recommendedBooks.slice(0, 10).map((book) => {
                  const isSaved = savedBooks.includes(book.id);
                  const matchPercent = book.preference_score
                    ? Math.round(book.preference_score * 100)
                    : null;

                  return (
                    <div key={book.id} className={styles.recCard}>
                      <Link to={`/books/${book.id}`} className={styles.recCoverLink}>
                        <img
                          src={
                            book.cover_image ||
                            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&q=80"
                          }
                          alt={book.title}
                          className={styles.recCover}
                        />
                      </Link>

                      <div className={styles.recInfo}>
                        <Link to={`/books/${book.id}`} className={styles.recBookTitle} title={book.title}>
                          {book.title}
                        </Link>

                        <div className={styles.recAuthor}>
                          by{" "}
                          {book.author_id ? (
                            <Link to={`/authors/${book.author_id}`} style={{ color: "inherit", textDecoration: "none" }}>
                              {book.author}
                            </Link>
                          ) : (
                            book.author
                          )}
                        </div>

                        <div className={styles.recMetaRow}>
                          <span className={styles.recRating}>
                            ★ {book.avg_rating || (book.rating ? Number(book.rating).toFixed(1) : "0.0")}
                          </span>
                          {!isColdStart && matchPercent !== null && matchPercent > 0 && (
                            <span className={styles.recScoreMatch} title="Reading preference affinity score">
                              {matchPercent}% Match
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleShelf(book.id)}
                          className={`${styles.recBtnShelf} ${isSaved ? styles.recBtnShelfSaved : ""}`}
                        >
                          {isSaved ? "✓ On Shelf" : "+ Want to Read"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.challengeBox}>
            <h3 className={styles.challengeTitle}>My Personal Shelf</h3>
            <p className={styles.challengeText}>
              You have <strong>{savedBooks.length} book{savedBooks.length === 1 ? "" : "s"}</strong> on your personal shelf.
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
