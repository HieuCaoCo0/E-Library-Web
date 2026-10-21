import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import Header from "../../components/Header";
import styles from "./AdminPage.module.css";
import api, { getApiErrorMessage } from "../../plugins/axios";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("books"); // 'books' | 'authors' | 'genres'
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggingInAdmin, setIsLoggingInAdmin] = useState(false);

  // Tham chiếu cuộn lên Form khi bấm Edit
  const formRef = useRef(null);

  // 1. Kiểm tra tài khoản hiện tại
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {
        // ignore
      }
    }

    const token = localStorage.getItem("access_token");
    if (token) {
      api
        .get("/api/users/profile/")
        .then((res) => {
          setCurrentUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        })
        .catch(() => {});
    }
  }, []);

  const isAdmin = Boolean(
    currentUser?.is_staff ||
      currentUser?.is_superuser ||
      currentUser?.username === "admin"
  );

  // Nút đăng nhập nhanh tài khoản Admin tiện lợi cho người dùng
  const handleQuickAdminLogin = async () => {
    setIsLoggingInAdmin(true);
    try {
      const res = await api.post("/api/auth/login/", {
        username: "admin",
        password: "Admin123!",
      });
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setCurrentUser(res.data.user);
      toast.success("Đăng nhập tài khoản Quản trị viên (admin) thành công!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể đăng nhập tài khoản Admin"));
    } finally {
      setIsLoggingInAdmin(false);
    }
  };

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
    fetchAllAuthors();
    fetchAllGenresForPicker();
  }, []);

  // -------------------------------------------------------------
  // 1. QUẢN LÝ SÁCH (POST/PUT/DELETE /api/books/)
  // -------------------------------------------------------------
  const [books, setBooks] = useState([]);
  const [bookTotalCount, setBookTotalCount] = useState(0);
  const [bookTotalPages, setBookTotalPages] = useState(1);
  const [bookPage, setBookPage] = useState(1);
  const [bookSearchInput, setBookSearchInput] = useState("");
  const [bookActiveSearch, setBookActiveSearch] = useState("");
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
      setBookPage(res.data?.page || page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tải danh sách sách"));
    } finally {
      setIsLoadingBooks(false);
    }
  };

  useEffect(() => {
    fetchBooks(bookPage, bookActiveSearch);
  }, [bookPage, bookActiveSearch]);

  const handleSearchBook = (e) => {
    e.preventDefault();
    setBookPage(1);
    setBookActiveSearch(bookSearchInput);
  };

  const handleClearSearchBook = () => {
    setBookSearchInput("");
    setBookActiveSearch("");
    setBookPage(1);
  };

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

  // Bắt đầu chỉnh sửa sách
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
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
        // Cập nhật Sách (PUT /api/books/<id>/)
        await api.put(`/api/books/${bookForm.id}/`, payload);
        toast.success(`Cập nhật thành công cuốn sách "${payload.title}"!`);
      } else {
        // Thêm mới Sách (POST /api/books/)
        await api.post("/api/books/", payload);
        toast.success(`Thêm mới thành công cuốn sách "${payload.title}"!`);
      }
      setBookForm(initialBookForm);
      fetchBooks(bookPage, bookActiveSearch);
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
      fetchBooks(bookPage, bookActiveSearch);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xóa cuốn sách"));
    }
  };

  // -------------------------------------------------------------
  // 2. QUẢN LÝ TÁC GIẢ (POST/PUT/DELETE /api/authors/)
  // -------------------------------------------------------------
  const [authorSearchInput, setAuthorSearchInput] = useState("");
  const [authorActiveSearch, setAuthorActiveSearch] = useState("");
  const [authorPage, setAuthorPage] = useState(1);
  const authorsPerPage = 12;
  const [isSubmittingAuthor, setIsSubmittingAuthor] = useState(false);

  const initialAuthorForm = { id: null, name: "" };
  const [authorForm, setAuthorForm] = useState(initialAuthorForm);

  const handleSearchAuthor = (e) => {
    e.preventDefault();
    setAuthorPage(1);
    setAuthorActiveSearch(authorSearchInput.trim().toLowerCase());
  };

  const handleClearSearchAuthor = () => {
    setAuthorSearchInput("");
    setAuthorActiveSearch("");
    setAuthorPage(1);
  };

  // Lọc tác giả theo từ khóa
  const filteredAuthors = allAuthors.filter((a) =>
    authorActiveSearch
      ? a.name.toLowerCase().includes(authorActiveSearch)
      : true
  );

  const authorTotalPages = Math.max(
    1,
    Math.ceil(filteredAuthors.length / authorsPerPage)
  );
  const paginatedAuthors = filteredAuthors.slice(
    (authorPage - 1) * authorsPerPage,
    authorPage * authorsPerPage
  );

  // Bắt đầu chỉnh sửa tác giả
  const handleStartEditAuthor = (author) => {
    setAuthorForm({ id: author.id, name: author.name });
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
  const [genrePage, setGenrePage] = useState(1);
  const [genreSearchInput, setGenreSearchInput] = useState("");
  const [genreActiveSearch, setGenreActiveSearch] = useState("");
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
      setGenrePage(page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tải danh sách thể loại"));
    } finally {
      setIsLoadingGenres(false);
    }
  };

  useEffect(() => {
    fetchGenres(genrePage, genreActiveSearch);
  }, [genrePage, genreActiveSearch]);

  const handleSearchGenre = (e) => {
    e.preventDefault();
    setGenrePage(1);
    setGenreActiveSearch(genreSearchInput);
  };

  const handleClearSearchGenre = () => {
    setGenreSearchInput("");
    setGenreActiveSearch("");
    setGenrePage(1);
  };

  // Bắt đầu chỉnh sửa thể loại
  const handleStartEditGenre = (genre) => {
    setGenreForm({ id: genre.id, name: genre.name });
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
      setGenreForm(initialGenreForm);
      fetchGenres(genrePage, genreActiveSearch);
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
      fetchGenres(genrePage, genreActiveSearch);
      fetchAllGenresForPicker();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xóa thể loại"));
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        {/* TIÊU ĐỀ & NÚT TRUY CẬP DJANGO ADMIN */}
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Admin Dashboard</h1>
            <p className={styles.subtitle}>
              Quản lý toàn bộ Đầu sách, Tác giả và Thể loại trong hệ thống E-Library
            </p>
          </div>

          <div className={styles.headerActions}>
            <a
              href="http://127.0.0.1:8000/admin/"
              target="_blank"
              rel="noreferrer"
              className={styles.djangoAdminBtn}
              title="Mở giao diện quản trị viên Django Superuser Portal trong tab mới"
            >
              <span>Django Superuser Portal</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>

        {/* THÔNG BÁO QUYỀN TRUY CẬP ADMIN */}
        {isAdmin ? (
          <div className={styles.authBannerSuccess}>
            <span>🟢</span>
            <span>
              Đang thao tác với quyền Quản trị viên: <strong>{currentUser?.username || "admin"}</strong>{" "}
              (Staff / Superuser) — Toàn quyền Thêm, Sửa, Xóa Catalog.
            </span>
          </div>
        ) : (
          <div className={styles.authBanner}>
            <div>
              <strong>⚠️ Chế độ xem trước Admin:</strong> Bạn chưa đăng nhập tài khoản Quản trị viên.
              Bạn có thể xem dữ liệu, nhưng thao tác Thêm / Sửa / Xóa yêu cầu quyền Quản trị viên (IsAdminUser).
            </div>
            <button
              type="button"
              onClick={handleQuickAdminLogin}
              disabled={isLoggingInAdmin}
              className={styles.quickLoginBtn}
            >
              {isLoggingInAdmin ? "Đang đăng nhập..." : "Đăng nhập nhanh Admin"}
            </button>
          </div>
        )}

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

        {/* THANH CHUYỂN ĐỔI 3 TAB */}
        <div className={styles.tabBar}>
          <button
            onClick={() => setActiveTab("books")}
            className={`${styles.tabBtn} ${activeTab === "books" ? styles.tabBtnActive : ""}`}
          >
            📚 Manage Books ({bookTotalCount})
          </button>
          <button
            onClick={() => setActiveTab("authors")}
            className={`${styles.tabBtn} ${activeTab === "authors" ? styles.tabBtnActive : ""}`}
          >
            ✍️ Manage Authors ({allAuthors.length})
          </button>
          <button
            onClick={() => setActiveTab("genres")}
            className={`${styles.tabBtn} ${activeTab === "genres" ? styles.tabBtnActive : ""}`}
          >
            🏷️ Manage Genres ({genreTotalCount})
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: QUẢN LÝ SÁCH (Books Management)                          */}
        {/* ============================================================== */}
        {activeTab === "books" && (
          <div className={styles.contentGrid}>
            {/* CỘT TRÁI: FORM THÊM / SỬA SÁCH */}
            <form ref={formRef} onSubmit={handleSaveBook} className={styles.formCard}>
              <h2 className={styles.formTitle}>
                <span>{bookForm.id ? "Edit Book" : "Add New Book"}</span>
                {bookForm.id && <span className={styles.editBadge}>#{bookForm.id}</span>}
              </h2>

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
                {bookForm.id && (
                  <button
                    type="button"
                    onClick={() => setBookForm(initialBookForm)}
                    className={styles.cancelBtn}
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>

            {/* CỘT PHẢI: BẢNG DANH SÁCH SÁCH & PHÂN TRANG */}
            <div className={styles.tableColumn}>
              {/* THANH TÌM KIẾM */}
              <div className={styles.tableToolbar}>
                <form onSubmit={handleSearchBook} className={styles.searchBox}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Tìm theo tên sách hoặc tác giả..."
                    value={bookSearchInput}
                    onChange={(e) => setBookSearchInput(e.target.value)}
                  />
                  <button type="submit" className={styles.searchActionBtn}>
                    Tìm kiếm
                  </button>
                  {bookActiveSearch && (
                    <button
                      type="button"
                      onClick={handleClearSearchBook}
                      className={styles.clearSearchBtn}
                    >
                      Xóa lọc
                    </button>
                  )}
                </form>

                <div className={styles.tableCountInfo}>
                  Trang {bookPage}/{bookTotalPages} ({bookTotalCount} sách)
                </div>
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
                        <th style={{ width: "120px" }}>Thao tác</th>
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

              {/* PHÂN TRANG CHO SÁCH */}
              {bookTotalPages > 1 && (
                <div className={styles.paginationRow}>
                  <div className={styles.pageInfo}>
                    Hiển thị trang <strong>{bookPage}</strong> trên tổng số <strong>{bookTotalPages}</strong> trang
                  </div>
                  <div className={styles.pageButtons}>
                    <button
                      type="button"
                      disabled={bookPage <= 1 || isLoadingBooks}
                      onClick={() => setBookPage((prev) => Math.max(1, prev - 1))}
                      className={styles.pageBtn}
                    >
                      « Trang trước
                    </button>
                    <button
                      type="button"
                      disabled={bookPage >= bookTotalPages || isLoadingBooks}
                      onClick={() => setBookPage((prev) => Math.min(bookTotalPages, prev + 1))}
                      className={styles.pageBtn}
                    >
                      Trang sau »
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: QUẢN LÝ TÁC GIẢ (Authors Management)                     */}
        {/* ============================================================== */}
        {activeTab === "authors" && (
          <div className={styles.contentGrid}>
            {/* CỘT TRÁI: FORM THÊM / SỬA TÁC GIẢ */}
            <form ref={formRef} onSubmit={handleSaveAuthor} className={styles.formCard}>
              <h2 className={styles.formTitle}>
                <span>{authorForm.id ? "Edit Author" : "Add New Author"}</span>
                {authorForm.id && <span className={styles.editBadge}>#{authorForm.id}</span>}
              </h2>

              <div className={styles.field}>
                <label className={styles.label}>Author Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ví dụ: J.K. Rowling"
                  value={authorForm.name}
                  onChange={(e) => setAuthorForm({ ...authorForm, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.btnRow}>
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
                {authorForm.id && (
                  <button
                    type="button"
                    onClick={() => setAuthorForm(initialAuthorForm)}
                    className={styles.cancelBtn}
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>

            {/* CỘT PHẢI: BẢNG DANH SÁCH TÁC GIẢ */}
            <div className={styles.tableColumn}>
              <div className={styles.tableToolbar}>
                <form onSubmit={handleSearchAuthor} className={styles.searchBox}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Tìm kiếm tác giả theo tên..."
                    value={authorSearchInput}
                    onChange={(e) => setAuthorSearchInput(e.target.value)}
                  />
                  <button type="submit" className={styles.searchActionBtn}>
                    Tìm kiếm
                  </button>
                  {authorActiveSearch && (
                    <button
                      type="button"
                      onClick={handleClearSearchAuthor}
                      className={styles.clearSearchBtn}
                    >
                      Xóa lọc
                    </button>
                  )}
                </form>

                <div className={styles.tableCountInfo}>
                  Trang {authorPage}/{authorTotalPages} ({filteredAuthors.length} tác giả)
                </div>
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

              {authorTotalPages > 1 && (
                <div className={styles.paginationRow}>
                  <div className={styles.pageInfo}>
                    Hiển thị trang <strong>{authorPage}</strong> trên tổng số <strong>{authorTotalPages}</strong> trang
                  </div>
                  <div className={styles.pageButtons}>
                    <button
                      type="button"
                      disabled={authorPage <= 1}
                      onClick={() => setAuthorPage((prev) => Math.max(1, prev - 1))}
                      className={styles.pageBtn}
                    >
                      « Trang trước
                    </button>
                    <button
                      type="button"
                      disabled={authorPage >= authorTotalPages}
                      onClick={() => setAuthorPage((prev) => Math.min(authorTotalPages, prev + 1))}
                      className={styles.pageBtn}
                    >
                      Trang sau »
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: QUẢN LÝ THỂ LOẠI (Genres Management)                     */}
        {/* ============================================================== */}
        {activeTab === "genres" && (
          <div className={styles.contentGrid}>
            {/* CỘT TRÁI: FORM THÊM / SỬA THỂ LOẠI */}
            <form ref={formRef} onSubmit={handleSaveGenre} className={styles.formCard}>
              <h2 className={styles.formTitle}>
                <span>{genreForm.id ? "Edit Genre" : "Add New Genre"}</span>
                {genreForm.id && <span className={styles.editBadge}>#{genreForm.id}</span>}
              </h2>

              <div className={styles.field}>
                <label className={styles.label}>Genre Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ví dụ: Science Fiction, Dystopia..."
                  value={genreForm.name}
                  onChange={(e) => setGenreForm({ ...genreForm, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.btnRow}>
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
                {genreForm.id && (
                  <button
                    type="button"
                    onClick={() => setGenreForm(initialGenreForm)}
                    className={styles.cancelBtn}
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>

            {/* CỘT PHẢI: BẢNG DANH SÁCH THỂ LOẠI */}
            <div className={styles.tableColumn}>
              <div className={styles.tableToolbar}>
                <form onSubmit={handleSearchGenre} className={styles.searchBox}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Tìm kiếm thể loại..."
                    value={genreSearchInput}
                    onChange={(e) => setGenreSearchInput(e.target.value)}
                  />
                  <button type="submit" className={styles.searchActionBtn}>
                    Tìm kiếm
                  </button>
                  {genreActiveSearch && (
                    <button
                      type="button"
                      onClick={handleClearSearchGenre}
                      className={styles.clearSearchBtn}
                    >
                      Xóa lọc
                    </button>
                  )}
                </form>

                <div className={styles.tableCountInfo}>
                  Trang {genrePage}/{genreTotalPages} ({genreTotalCount} thể loại)
                </div>
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

              {genreTotalPages > 1 && (
                <div className={styles.paginationRow}>
                  <div className={styles.pageInfo}>
                    Hiển thị trang <strong>{genrePage}</strong> trên tổng số <strong>{genreTotalPages}</strong> trang
                  </div>
                  <div className={styles.pageButtons}>
                    <button
                      type="button"
                      disabled={genrePage <= 1 || isLoadingGenres}
                      onClick={() => setGenrePage((prev) => Math.max(1, prev - 1))}
                      className={styles.pageBtn}
                    >
                      « Trang trước
                    </button>
                    <button
                      type="button"
                      disabled={genrePage >= genreTotalPages || isLoadingGenres}
                      onClick={() => setGenrePage((prev) => Math.min(genreTotalPages, prev + 1))}
                      className={styles.pageBtn}
                    >
                      Trang sau »
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        © 2026 E-Library — Hệ thống quản trị nội dung & thư viện trực tuyến
      </footer>
    </div>
  );
}
