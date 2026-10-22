import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Modal from "../../components/Modal";
import styles from "./AdminPage.module.css";
import api, { getApiErrorMessage } from "../../plugins/axios";

// Helper tạo danh sách số trang rút gọn
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

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc tab, page và search trực tiếp từ URL Query Parameters
  const activeTab = searchParams.get("tab") || "books"; // 'books' | 'authors' | 'genres'
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
  const activeSearch = searchParams.get("search") || "";

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");
    return Boolean(token);
  });

  // Trạng thái đóng/mở Popup Modal cho 3 chức năng
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);

  // Ô input tìm kiếm tạm thời trước khi bấm nút Tìm kiếm
  const [searchInput, setSearchInput] = useState(activeSearch);

  useEffect(() => {
    setSearchInput(activeSearch);
  }, [activeSearch, activeTab]);

  // Chuyển Tab (Cập nhật ?tab=... trên URL, reset page và search)
  const handleTabChange = (newTab) => {
    const params = new URLSearchParams();
    if (newTab !== "books") {
      params.set("tab", newTab);
    }
    setSearchParams(params);
  };

  // Chuyển Trang (Cập nhật ?page=... trên URL)
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

  // Tìm kiếm (Cập nhật ?search=... trên URL, reset về trang 1)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (searchInput.trim()) {
      params.set("search", searchInput.trim());
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  };

  // Xóa lọc tìm kiếm
  const handleClearSearch = () => {
    setSearchInput("");
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    params.delete("page");
    setSearchParams(params);
  };

  // 1. Kiểm tra tài khoản hiện tại & quyền Admin
  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");

    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    api
      .get("/api/users/profile/")
      .then((res) => {
        setCurrentUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      })
      .catch(() => {
        // Token không hợp lệ
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  const isAdmin = Boolean(
    currentUser?.is_staff ||
      currentUser?.is_superuser ||
      currentUser?.username === "admin"
  );

  // -------------------------------------------------------------
  // DỮ LIỆU TỔNG QUAN: TÁC GIẢ & THỂ LOẠI (Dùng cho cả dropdown và Tab)
  // -------------------------------------------------------------
  const [allAuthors, setAllAuthors] = useState([]);
  const [allGenresList, setAllGenresList] = useState([]);

  // Lấy toàn bộ danh sách tác giả (API /api/authors/)
  const fetchAllAuthors = async () => {
    try {
      const res = await api.get("/api/authors/");
      setAllAuthors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách tác giả:", err);
    }
  };

  // Lấy danh sách thể loại dùng cho việc chọn thể loại khi thêm/sửa sách
  const fetchAllGenresForPicker = async () => {
    try {
      const res = await api.get("/api/genres/?page=1");
      const list = res.data?.results || res.data || [];
      setAllGenresList(list);
    } catch (err) {
      console.error("Lỗi khi tải danh mục thể loại:", err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllAuthors();
      fetchAllGenresForPicker();
    }
  }, [isAdmin]);

  // -------------------------------------------------------------
  // 1. QUẢN LÝ SÁCH (POST/PUT/DELETE /api/books/)
  // -------------------------------------------------------------
  const [books, setBooks] = useState([]);
  const [bookTotalCount, setBookTotalCount] = useState(0);
  const [bookTotalPages, setBookTotalPages] = useState(1);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);

  const initialBookForm = {
    id: null,
    title: "",
    author: "",
    genres: [],
    pages: "",
    publish_date: "",
    cover_image: "",
    source_url: "",
    description: "",
  };
  const [bookForm, setBookForm] = useState(initialBookForm);

  const fetchBooks = async (page = 1, search = "") => {
    setIsLoadingBooks(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const res = await api.get(`/api/books/?${params.toString()}`);
      setBooks(res.data?.results || []);
      setBookTotalCount(res.data?.count || 0);
      setBookTotalPages(res.data?.total_pages || 1);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tải danh sách sách"));
    } finally {
      setIsLoadingBooks(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === "books") {
      fetchBooks(currentPage, activeSearch);
    }
  }, [isAdmin, activeTab, currentPage, activeSearch]);

  // Toggle chọn/bỏ chọn thể loại cho sách
  const handleToggleGenre = (genreId) => {
    const current = bookForm.genres || [];
    if (current.includes(genreId)) {
      setBookForm({
        ...bookForm,
        genres: current.filter((id) => id !== genreId),
      });
    } else {
      setBookForm({
        ...bookForm,
        genres: [...current, genreId],
      });
    }
  };

  // Bắt đầu chỉnh sửa sách (mở Popup)
  const handleStartEditBook = (book) => {
    setBookForm({
      id: book.id,
      title: book.title || "",
      author: book.author_id || "",
      genres: book.genre_ids || [],
      pages: book.pages ?? "",
      publish_date: book.publish_date || "",
      cover_image: book.cover_image || "",
      source_url: book.source_url || "",
      description: book.description || "",
    });
    setIsBookModalOpen(true);
  };

  // Lưu Sách (Thêm mới POST hoặc Cập nhật PUT)
  const handleSaveBook = async (e) => {
    e.preventDefault();

    if (!bookForm.author) {
      toast.warning("Vui lòng chọn Tác giả cho cuốn sách!");
      return;
    }

    setIsSubmittingBook(true);

    const payload = {
      title: bookForm.title.trim(),
      author: Number(bookForm.author),
      genres: bookForm.genres,
      pages: bookForm.pages ? Number(bookForm.pages) : null,
      publish_date: bookForm.publish_date || null,
      cover_image: bookForm.cover_image.trim(),
      source_url: bookForm.source_url.trim(),
      description: bookForm.description.trim(),
    };

    try {
      if (bookForm.id) {
        await api.put(`/api/books/${bookForm.id}/`, payload);
        toast.success(`Cập nhật thành công cuốn sách "${payload.title}"!`);
      } else {
        await api.post("/api/books/", payload);
        toast.success(`Thêm mới thành công cuốn sách "${payload.title}"!`);
      }
      setIsBookModalOpen(false);
      setBookForm(initialBookForm);
      fetchBooks(currentPage, activeSearch);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Lỗi khi lưu thông tin sách"));
    } finally {
      setIsSubmittingBook(false);
    }
  };

  // Xóa Sách (DELETE /api/books/<id>/)
  const handleDeleteBook = async (book) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa cuốn sách "${book.title}" (ID: #${book.id}) khỏi hệ thống? Thao tác này không thể hoàn tác.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/books/${book.id}/`);
      toast.success(`Đã xóa thành công cuốn sách "${book.title}"!`);
      if (bookForm.id === book.id) {
        setBookForm(initialBookForm);
      }
      fetchBooks(currentPage, activeSearch);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xóa cuốn sách"));
    }
  };

  // -------------------------------------------------------------
  // 2. QUẢN LÝ TÁC GIẢ (POST/PUT/DELETE /api/authors/)
  // -------------------------------------------------------------
  const authorsPerPage = 12;
  const [isSubmittingAuthor, setIsSubmittingAuthor] = useState(false);

  const initialAuthorForm = { id: null, name: "" };
  const [authorForm, setAuthorForm] = useState(initialAuthorForm);

  // Lọc tác giả theo từ khóa
  const filteredAuthors = allAuthors.filter((a) =>
    activeSearch ? a.name.toLowerCase().includes(activeSearch.toLowerCase()) : true
  );

  const authorTotalPages = Math.max(
    1,
    Math.ceil(filteredAuthors.length / authorsPerPage)
  );
  const paginatedAuthors = filteredAuthors.slice(
    (currentPage - 1) * authorsPerPage,
    currentPage * authorsPerPage
  );

  // Bắt đầu chỉnh sửa tác giả (mở Popup)
  const handleStartEditAuthor = (author) => {
    setAuthorForm({ id: author.id, name: author.name });
    setIsAuthorModalOpen(true);
  };

  // Lưu Tác giả (POST /api/authors/ hoặc PUT /api/authors/<id>/)
  const handleSaveAuthor = async (e) => {
    e.preventDefault();
    if (!authorForm.name.trim()) return;

    setIsSubmittingAuthor(true);
    const payload = { name: authorForm.name.trim() };

    try {
      if (authorForm.id) {
        await api.put(`/api/authors/${authorForm.id}/`, payload);
        toast.success(`Cập nhật tác giả "${payload.name}" thành công!`);
      } else {
        await api.post("/api/authors/", payload);
        toast.success(`Thêm mới tác giả "${payload.name}" thành công!`);
      }
      setIsAuthorModalOpen(false);
      setAuthorForm(initialAuthorForm);
      await fetchAllAuthors();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Lỗi khi lưu tác giả"));
    } finally {
      setIsSubmittingAuthor(false);
    }
  };

  // Xóa Tác giả (DELETE /api/authors/<id>/)
  const handleDeleteAuthor = async (author) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa tác giả "${author.name}" (ID: #${author.id})? Lưu ý: Nếu tác giả đang liên kết với sách, thao tác có thể bị từ chối.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/authors/${author.id}/`);
      toast.success(`Đã xóa tác giả "${author.name}"!`);
      if (authorForm.id === author.id) {
        setAuthorForm(initialAuthorForm);
      }
      await fetchAllAuthors();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xóa tác giả"));
    }
  };

  // -------------------------------------------------------------
  // 3. QUẢN LÝ THỂ LOẠI (POST/PUT/DELETE /api/genres/)
  // -------------------------------------------------------------
  const [genres, setGenres] = useState([]);
  const [genreTotalCount, setGenreTotalCount] = useState(0);
  const [genreTotalPages, setGenreTotalPages] = useState(1);
  const [isLoadingGenres, setIsLoadingGenres] = useState(false);
  const [isSubmittingGenre, setIsSubmittingGenre] = useState(false);

  const initialGenreForm = { id: null, name: "" };
  const [genreForm, setGenreForm] = useState(initialGenreForm);

  const fetchGenres = async (page = 1, search = "") => {
    setIsLoadingGenres(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const res = await api.get(`/api/genres/?${params.toString()}`);
      const list = res.data?.results || res.data || [];
      setGenres(list);
      setGenreTotalCount(res.data?.count || list.length);
      const totalP = res.data?.count ? Math.ceil(res.data.count / 20) : 1;
      setGenreTotalPages(totalP);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tải danh sách thể loại"));
    } finally {
      setIsLoadingGenres(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === "genres") {
      fetchGenres(currentPage, activeSearch);
    }
  }, [isAdmin, activeTab, currentPage, activeSearch]);

  // Bắt đầu chỉnh sửa thể loại (mở Popup)
  const handleStartEditGenre = (genre) => {
    setGenreForm({ id: genre.id, name: genre.name });
    setIsGenreModalOpen(true);
  };

  // Lưu Thể loại (POST /api/genres/ hoặc PUT /api/genres/<id>/)
  const handleSaveGenre = async (e) => {
    e.preventDefault();
    if (!genreForm.name.trim()) return;

    setIsSubmittingGenre(true);
    const payload = { name: genreForm.name.trim() };

    try {
      if (genreForm.id) {
        await api.put(`/api/genres/${genreForm.id}/`, payload);
        toast.success(`Cập nhật thể loại "${payload.name}" thành công!`);
      } else {
        await api.post("/api/genres/", payload);
        toast.success(`Thêm mới thể loại "${payload.name}" thành công!`);
      }
      setIsGenreModalOpen(false);
      setGenreForm(initialGenreForm);
      fetchGenres(currentPage, activeSearch);
      fetchAllGenresForPicker();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Lỗi khi lưu thể loại"));
    } finally {
      setIsSubmittingGenre(false);
    }
  };

  // Xóa Thể loại (DELETE /api/genres/<id>/)
  const handleDeleteGenre = async (genre) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa thể loại "${genre.name}" (ID: #${genre.id})? Lưu ý: Nếu có sách thuộc thể loại này, liên kết sẽ được gỡ bỏ.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/genres/${genre.id}/`);
      toast.success(`Đã xóa thể loại "${genre.name}"!`);
      if (genreForm.id === genre.id) {
        setGenreForm(initialGenreForm);
      }
      fetchGenres(currentPage, activeSearch);
      fetchAllGenresForPicker();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xóa thể loại"));
    }
  };

  if (isCheckingAuth) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            color: "#666",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
          }}
        >
          Đang xác thực quyền Quản trị viên...
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <div
          style={{
            textAlign: "center",
            padding: "80px 24px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔒</div>
          <h1
            style={{
              color: "#c81e1e",
              fontSize: "28px",
              marginBottom: "12px",
              fontFamily: "var(--font-serif)",
            }}
          >
            Truy cập bị từ chối (403 Forbidden)
          </h1>
          <p
            style={{
              color: "#666",
              maxWidth: "520px",
              margin: "0 auto 28px",
              lineHeight: "1.6",
              fontSize: "16px",
            }}
          >
            Trang Quản trị chỉ dành riêng cho tài khoản Quản trị viên (Staff / Superuser).
            Vui lòng đăng nhập bằng tài khoản có thẩm quyền để truy cập trang này.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/login"
              style={{
                padding: "10px 24px",
                backgroundColor: "#382110",
                color: "#ffffff",
                textDecoration: "none",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: "15px",
              }}
            >
              Đăng nhập Quản trị viên
            </Link>
            <Link
              to="/"
              style={{
                padding: "10px 24px",
                backgroundColor: "#f4f1ea",
                color: "#382110",
                textDecoration: "none",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: "15px",
                border: "1px solid #dcd6cc",
              }}
            >
              Về Trang chủ
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        {/* TIÊU ĐỀ ADMIN DASHBOARD */}
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Admin Dashboard</h1>
            <p className={styles.subtitle}>
              Quản lý toàn bộ Đầu sách, Tác giả và Thể loại trong hệ thống E-Library
            </p>
          </div>
        </div>

        {/* THÔNG BÁO QUYỀN TRUY CẬP ADMIN */}
        <div className={styles.authBannerSuccess}>
          <span>🟢</span>
          <span>
            Đang thao tác với quyền Quản trị viên: <strong>{currentUser?.username || "admin"}</strong>{" "}
            (Staff / Superuser) — Toàn quyền Thêm, Sửa, Xóa Catalog.
          </span>
        </div>

        {/* CÁC THẺ THỐNG KÊ TỔNG QUAN */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📚</div>
            <div>
              <div className={styles.statValue}>{bookTotalCount}</div>
              <div className={styles.statLabel}>Đầu sách trong thư viện</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✍️</div>
            <div>
              <div className={styles.statValue}>{allAuthors.length}</div>
              <div className={styles.statLabel}>Tác giả đã đăng ký</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏷️</div>
            <div>
              <div className={styles.statValue}>{genreTotalCount || allGenresList.length}</div>
              <div className={styles.statLabel}>Thể loại sách</div>
            </div>
          </div>
        </div>

        {/* THANH CHUYỂN ĐỔI 3 TAB (Gắn liền với ?tab= trên URL) */}
        <div className={styles.tabBar}>
          <button
            onClick={() => handleTabChange("books")}
            className={`${styles.tabBtn} ${activeTab === "books" ? styles.tabBtnActive : ""}`}
          >
            📚 Manage Books ({bookTotalCount})
          </button>
          <button
            onClick={() => handleTabChange("authors")}
            className={`${styles.tabBtn} ${activeTab === "authors" ? styles.tabBtnActive : ""}`}
          >
            ✍️ Manage Authors ({allAuthors.length})
          </button>
          <button
            onClick={() => handleTabChange("genres")}
            className={`${styles.tabBtn} ${activeTab === "genres" ? styles.tabBtnActive : ""}`}
          >
            🏷️ Manage Genres ({genreTotalCount})
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: QUẢN LÝ SÁCH (Books Management)                          */}
        {/* ============================================================== */}
        {activeTab === "books" && (
          <div className={styles.tableColumn}>
            {/* THANH CÔNG CỤ: TÌM KIẾM BÊN TRÁI - NÚT ADD NEW BOOK BÊN PHẢI */}
            <div className={styles.tableToolbar}>
              <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Tìm theo tên sách hoặc tác giả..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" className={styles.searchActionBtn}>
                  Tìm kiếm
                </button>
                {activeSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={styles.clearSearchBtn}
                  >
                    Xóa lọc
                  </button>
                )}
              </form>

              {/* NÚT + ADD NEW BOOK */}
              <button
                type="button"
                onClick={() => {
                  setBookForm(initialBookForm);
                  setIsBookModalOpen(true);
                }}
                className={styles.addNewBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add New Book</span>
              </button>
            </div>

            {/* BẢNG DỮ LIỆU SÁCH */}
            <div className={styles.tableWrapper}>
              {isLoadingBooks ? (
                <div className={styles.loadingState}>Đang tải danh sách sách từ máy chủ...</div>
              ) : books.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>📖</div>
                  <div>Không tìm thấy cuốn sách nào phù hợp.</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>ID</th>
                      <th style={{ width: "50px" }}>Ảnh</th>
                      <th>Tựa đề</th>
                      <th>Tác giả</th>
                      <th>Thể loại</th>
                      <th>Đánh giá / Trang</th>
                      <th style={{ width: "130px" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <tr key={book.id}>
                        <td>#{book.id}</td>
                        <td className={styles.bookThumbCell}>
                          <img
                            src={book.cover_image || "https://placehold.co/40x60?text=No+Cover"}
                            alt={book.title}
                            className={styles.bookThumb}
                            onError={(e) => {
                              e.target.src = "https://placehold.co/40x60?text=Cover";
                            }}
                          />
                        </td>
                        <td className={styles.itemName}>
                          <Link to={`/books/${book.id}`} className={styles.bookLink}>
                            {book.title}
                          </Link>
                        </td>
                        <td>{book.author || "Chưa rõ"}</td>
                        <td>
                          <div className={styles.genreTags}>
                            {Array.isArray(book.genres) && book.genres.length > 0 ? (
                              book.genres.slice(0, 3).map((g, idx) => (
                                <span key={idx} className={styles.genreTag}>
                                  {g}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: "#999", fontSize: "12px" }}>Không có</span>
                            )}
                            {Array.isArray(book.genres) && book.genres.length > 3 && (
                              <span className={styles.genreTag}>+{book.genres.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: "13px" }}>
                          ⭐ {book.avg_rating || book.rating || "Chưa có"}
                          <br />
                          <span style={{ color: "#777" }}>{book.pages ? `${book.pages} trang` : "N/A"}</span>
                        </td>
                        <td>
                          <div className={styles.actionGroup}>
                            <button
                              onClick={() => handleStartEditBook(book)}
                              className={styles.editBtn}
                              title="Chỉnh sửa thông tin sách"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book)}
                              className={styles.deleteBtn}
                              title="Xóa cuốn sách khỏi cơ sở dữ liệu"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* PHÂN TRANG CHO SÁCH (?page=X) */}
            <div className={styles.paginationRow}>
              <div className={styles.pageInfo}>
                Hiển thị trang <strong>{currentPage}</strong> trên tổng số <strong>{bookTotalPages}</strong> trang ({bookTotalCount} sách)
              </div>
              {bookTotalPages > 1 && (
                <div className={styles.pageButtons}>
                  <button
                    type="button"
                    disabled={currentPage <= 1 || isLoadingBooks}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={styles.pageBtn}
                  >
                    « Trang trước
                  </button>

                  {getPaginationItems(currentPage, bookTotalPages).map((item, idx) => {
                    if (typeof item === "string") {
                      return (
                        <span key={`dots-${idx}`} className={styles.ellipsis}>
                          ...
                        </span>
                      );
                    }
                    const isCur = item === currentPage;
                    return (
                      <button
                        key={`page-${item}`}
                        type="button"
                        onClick={() => handlePageChange(item)}
                        className={`${styles.pageBtn} ${isCur ? styles.pageBtnActive : ""}`}
                      >
                        {item}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage >= bookTotalPages || isLoadingBooks}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={styles.pageBtn}
                  >
                    Trang sau »
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: QUẢN LÝ TÁC GIẢ (Authors Management)                     */}
        {/* ============================================================== */}
        {activeTab === "authors" && (
          <div className={styles.tableColumn}>
            <div className={styles.tableToolbar}>
              <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Tìm kiếm tác giả theo tên..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" className={styles.searchActionBtn}>
                  Tìm kiếm
                </button>
                {activeSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={styles.clearSearchBtn}
                  >
                    Xóa lọc
                  </button>
                )}
              </form>

              {/* NÚT + ADD NEW AUTHOR */}
              <button
                type="button"
                onClick={() => {
                  setAuthorForm(initialAuthorForm);
                  setIsAuthorModalOpen(true);
                }}
                className={styles.addNewBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add New Author</span>
              </button>
            </div>

            <div className={styles.tableWrapper}>
              {paginatedAuthors.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>✍️</div>
                  <div>Không tìm thấy tác giả nào phù hợp.</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>ID</th>
                      <th>Tên Tác giả</th>
                      <th style={{ width: "160px" }}>Trang chi tiết</th>
                      <th style={{ width: "140px" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAuthors.map((author) => (
                      <tr key={author.id}>
                        <td>#{author.id}</td>
                        <td className={styles.itemName}>{author.name}</td>
                        <td>
                          <Link to={`/authors/${author.id}`} className={styles.bookLink}>
                            Xem hồ sơ tác giả ↗
                          </Link>
                        </td>
                        <td>
                          <div className={styles.actionGroup}>
                            <button
                              onClick={() => handleStartEditAuthor(author)}
                              className={styles.editBtn}
                              title="Chỉnh sửa tên tác giả"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteAuthor(author)}
                              className={styles.deleteBtn}
                              title="Xóa tác giả khỏi cơ sở dữ liệu"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.paginationRow}>
              <div className={styles.pageInfo}>
                Hiển thị trang <strong>{currentPage}</strong> trên tổng số <strong>{authorTotalPages}</strong> trang ({filteredAuthors.length} tác giả)
              </div>
              {authorTotalPages > 1 && (
                <div className={styles.pageButtons}>
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={styles.pageBtn}
                  >
                    « Trang trước
                  </button>

                  {getPaginationItems(currentPage, authorTotalPages).map((item, idx) => {
                    if (typeof item === "string") {
                      return (
                        <span key={`dots-${idx}`} className={styles.ellipsis}>
                          ...
                        </span>
                      );
                    }
                    const isCur = item === currentPage;
                    return (
                      <button
                        key={`page-${item}`}
                        type="button"
                        onClick={() => handlePageChange(item)}
                        className={`${styles.pageBtn} ${isCur ? styles.pageBtnActive : ""}`}
                      >
                        {item}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage >= authorTotalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={styles.pageBtn}
                  >
                    Trang sau »
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: QUẢN LÝ THỂ LOẠI (Genres Management)                     */}
        {/* ============================================================== */}
        {activeTab === "genres" && (
          <div className={styles.tableColumn}>
            <div className={styles.tableToolbar}>
              <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Tìm kiếm thể loại..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" className={styles.searchActionBtn}>
                  Tìm kiếm
                </button>
                {activeSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={styles.clearSearchBtn}
                  >
                    Xóa lọc
                  </button>
                )}
              </form>

              {/* NÚT + ADD NEW GENRE */}
              <button
                type="button"
                onClick={() => {
                  setGenreForm(initialGenreForm);
                  setIsGenreModalOpen(true);
                }}
                className={styles.addNewBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add New Genre</span>
              </button>
            </div>

            <div className={styles.tableWrapper}>
              {isLoadingGenres ? (
                <div className={styles.loadingState}>Đang tải danh sách thể loại từ máy chủ...</div>
              ) : genres.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>🏷️</div>
                  <div>Không tìm thấy thể loại nào phù hợp.</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>ID</th>
                      <th>Tên Thể loại</th>
                      <th>Số lượng sách</th>
                      <th style={{ width: "140px" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genres.map((genre) => (
                      <tr key={genre.id}>
                        <td>#{genre.id}</td>
                        <td className={styles.itemName}>{genre.name}</td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{genre.book_count ?? 0}</span> cuốn sách
                        </td>
                        <td>
                          <div className={styles.actionGroup}>
                            <button
                              onClick={() => handleStartEditGenre(genre)}
                              className={styles.editBtn}
                              title="Chỉnh sửa tên thể loại"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteGenre(genre)}
                              className={styles.deleteBtn}
                              title="Xóa thể loại khỏi cơ sở dữ liệu"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.paginationRow}>
              <div className={styles.pageInfo}>
                Hiển thị trang <strong>{currentPage}</strong> trên tổng số <strong>{genreTotalPages}</strong> trang ({genreTotalCount} thể loại)
              </div>
              {genreTotalPages > 1 && (
                <div className={styles.pageButtons}>
                  <button
                    type="button"
                    disabled={currentPage <= 1 || isLoadingGenres}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={styles.pageBtn}
                  >
                    « Trang trước
                  </button>

                  {getPaginationItems(currentPage, genreTotalPages).map((item, idx) => {
                    if (typeof item === "string") {
                      return (
                        <span key={`dots-${idx}`} className={styles.ellipsis}>
                          ...
                        </span>
                      );
                    }
                    const isCur = item === currentPage;
                    return (
                      <button
                        key={`page-${item}`}
                        type="button"
                        onClick={() => handlePageChange(item)}
                        className={`${styles.pageBtn} ${isCur ? styles.pageBtnActive : ""}`}
                      >
                        {item}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage >= genreTotalPages || isLoadingGenres}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={styles.pageBtn}
                  >
                    Trang sau »
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* POPUP MODAL 1: THÊM / SỬA SÁCH (Tái sử dụng Component Modal)  */}
      {/* ============================================================== */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title={bookForm.id ? `Edit Book #${bookForm.id}` : "Add New Book"}
        maxWidth="680px"
      >
        <form onSubmit={handleSaveBook}>
          <div className={styles.field}>
            <label className={styles.label}>Book Title *</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ví dụ: Lược Sử Thời Gian"
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Author *</label>
            <select
              className={styles.select}
              value={bookForm.author}
              onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
              required
            >
              <option value="">-- Chọn tác giả --</option>
              {allAuthors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name} (ID: #{author.id})
                </option>
              ))}
            </select>
            <span className={styles.helperText}>
              Chưa có tác giả? Chuyển sang Tab "Manage Authors" để thêm mới.
            </span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Genres (Click để chọn/bỏ chọn)</label>
            <div className={styles.genrePickerBox}>
              {allGenresList.map((g) => {
                const isSelected = bookForm.genres.includes(g.id);
                return (
                  <span
                    key={g.id}
                    onClick={() => handleToggleGenre(g.id)}
                    className={`${styles.genreChip} ${isSelected ? styles.genreChipSelected : ""}`}
                    title={isSelected ? "Bấm để bỏ chọn" : "Bấm để chọn"}
                  >
                    {isSelected ? `✓ ${g.name}` : g.name}
                  </span>
                );
              })}
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Pages (Số trang)</label>
              <input
                type="number"
                min="1"
                className={styles.input}
                placeholder="320"
                value={bookForm.pages}
                onChange={(e) => setBookForm({ ...bookForm, pages: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Publish Date</label>
              <input
                type="date"
                className={styles.input}
                value={bookForm.publish_date}
                onChange={(e) => setBookForm({ ...bookForm, publish_date: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Cover Image URL</label>
            <input
              type="url"
              className={styles.input}
              placeholder="https://images.example.com/cover.jpg"
              value={bookForm.cover_image}
              onChange={(e) => setBookForm({ ...bookForm, cover_image: e.target.value })}
            />
            {bookForm.cover_image && (
              <div className={styles.imagePreviewRow}>
                <img
                  src={bookForm.cover_image}
                  alt="Preview"
                  className={styles.previewThumb}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <span style={{ fontSize: "12px", color: "#666" }}>Xem trước ảnh bìa sách</span>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Source URL (Đường dẫn sách/mua hàng)</label>
            <input
              type="url"
              className={styles.input}
              placeholder="https://..."
              value={bookForm.source_url}
              onChange={(e) => setBookForm({ ...bookForm, source_url: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description (Mô tả sách)</label>
            <textarea
              className={styles.textarea}
              placeholder="Nội dung giới thiệu ngắn về cuốn sách..."
              value={bookForm.description}
              onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
            />
          </div>

          <div className={styles.btnRow}>
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className={styles.cancelBtn}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmittingBook}
              className={styles.submitBtn}
            >
              {isSubmittingBook
                ? "Đang lưu..."
                : bookForm.id
                ? "Cập nhật Sách"
                : "+ Thêm mới Sách"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* POPUP MODAL 2: THÊM / SỬA TÁC GIẢ (Tái sử dụng Component Modal) */}
      {/* ============================================================== */}
      <Modal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        title={authorForm.id ? `Edit Author #${authorForm.id}` : "Add New Author"}
        maxWidth="480px"
      >
        <form onSubmit={handleSaveAuthor}>
          <div className={styles.field}>
            <label className={styles.label}>Author Name *</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ví dụ: J.K. Rowling"
              value={authorForm.name}
              onChange={(e) => setAuthorForm({ ...authorForm, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className={styles.btnRow}>
            <button
              type="button"
              onClick={() => setIsAuthorModalOpen(false)}
              className={styles.cancelBtn}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmittingAuthor}
              className={styles.submitBtn}
            >
              {isSubmittingAuthor
                ? "Đang lưu..."
                : authorForm.id
                ? "Cập nhật Tác giả"
                : "+ Thêm mới Tác giả"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* POPUP MODAL 3: THÊM / SỬA THỂ LOẠI (Tái sử dụng Component Modal)*/}
      {/* ============================================================== */}
      <Modal
        isOpen={isGenreModalOpen}
        onClose={() => setIsGenreModalOpen(false)}
        title={genreForm.id ? `Edit Genre #${genreForm.id}` : "Add New Genre"}
        maxWidth="480px"
      >
        <form onSubmit={handleSaveGenre}>
          <div className={styles.field}>
            <label className={styles.label}>Genre Name *</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ví dụ: Science Fiction, Dystopia..."
              value={genreForm.name}
              onChange={(e) => setGenreForm({ ...genreForm, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className={styles.btnRow}>
            <button
              type="button"
              onClick={() => setIsGenreModalOpen(false)}
              className={styles.cancelBtn}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmittingGenre}
              className={styles.submitBtn}
            >
              {isSubmittingGenre
                ? "Đang lưu..."
                : genreForm.id
                ? "Cập nhật Thể loại"
                : "+ Thêm mới Thể loại"}
            </button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
}
