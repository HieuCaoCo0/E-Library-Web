import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import styles from "./AdminPage.module.css";
import api, { getApiErrorMessage } from "../../plugins/axios";

// Hàm tiện ích chuẩn hóa điểm đánh giá: mặc định là "0.0" nếu thiếu, null, 0 hoặc bị lỗi
function formatRating(val) {
  if (val == null || val === "" || isNaN(val)) return "0.0";
  const num = Number(val);
  return num === 0 ? "0.0" : String(num);
}

// Hàm sinh danh sách các nút phân trang thu gọn kèm dấu ba chấm (1 ... 4 5 6 ... 15)
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

  // Đọc thông số tab, trang, và từ khóa tìm kiếm trực tiếp từ URL query parameters
  const activeTab = searchParams.get("tab") || "books"; // 'books' | 'authors' | 'genres'
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
  const activeSearch = searchParams.get("search") || "";

  // Thông tin tài khoản người dùng hiện tại
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

  // Trạng thái bật/tắt Modal tạo/chỉnh sửa cho 3 tab quản lý
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);

  // Giá trị nhập tìm kiếm tạm thời trước khi người dùng bấm Enter/Submit
  const [searchInput, setSearchInput] = useState(activeSearch);

  useEffect(() => {
    setSearchInput(activeSearch);
  }, [activeSearch, activeTab]);

  // Chuyển tab quản lý (cập nhật ?tab=... trên URL, reset trang và từ khóa tìm kiếm)
  const handleTabChange = (newTab) => {
    const params = new URLSearchParams();
    if (newTab !== "books") {
      params.set("tab", newTab);
    }
    setSearchParams(params);
  };

  // Chuyển trang phân trang (cập nhật ?page=... trên URL và cuộn lên đầu)
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

  // Xử lý gửi tìm kiếm (cập nhật ?search=... trên URL, tự động quay về trang 1)
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

  // Xóa bộ lọc tìm kiếm
  const handleClearSearch = () => {
    setSearchInput("");
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    params.delete("page");
    setSearchParams(params);
  };

  // 1. Xác thực tài khoản hiện tại và kiểm tra quyền Quản trị viên (Admin)
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
        // Token không hợp lệ hoặc hết hạn
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  // Xác định người dùng có quyền quản trị hay không
  const isAdmin = Boolean(
    currentUser?.is_staff ||
    currentUser?.is_superuser ||
    currentUser?.username === "admin",
  );

  // -------------------------------------------------------------
  // DỮ LIỆU TỔNG QUAN: TÁC GIẢ & THỂ LOẠI (Dùng cho dropdown và thống kê)
  // -------------------------------------------------------------
  const [allAuthors, setAllAuthors] = useState([]);
  const [allGenresList, setAllGenresList] = useState([]);

  // Nạp toàn bộ danh sách tác giả (API GET /api/authors/)
  const fetchAllAuthors = async () => {
    try {
      const res = await api.get("/api/authors/");
      setAllAuthors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách tác giả:", err);
    }
  };

  // Nạp toàn bộ thể loại sách để người dùng chọn trong form tạo/sửa sách
  const fetchAllGenresForPicker = async () => {
    try {
      const res = await api.get("/api/genres/?page_size=500");
      const list = res.data?.results || res.data || [];
      setAllGenresList(list);
      setGenreTotalCount(res.data?.count || list.length);
    } catch (err) {
      console.error("Lỗi khi tải danh sách thể loại:", err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllAuthors();
      fetchAllGenresForPicker();
    }
  }, [isAdmin]);

  // -------------------------------------------------------------
  // 1. CHỨC NĂNG QUẢN LÝ SÁCH (API GET/POST/PATCH/DELETE /api/books/)
  // -------------------------------------------------------------
  const [books, setBooks] = useState([]);
  const [bookTotalCount, setBookTotalCount] = useState(0);
  const [bookTotalPages, setBookTotalPages] = useState(1);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeletingTarget, setIsDeletingTarget] = useState(false);

  // Cấu trúc form dữ liệu sách
  const initialBookForm = {
    id: null,
    title: "",
    author: "",
    genres: [],
    pages: "",
    rating: "",
    publish_date: "",
    cover_image: "",
    source_url: "",
    description: "",
  };
  const [bookForm, setBookForm] = useState(initialBookForm);

  // Nạp danh sách sách theo trang và từ khóa tìm kiếm (GET /api/books/)
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
      toast.error(getApiErrorMessage(err, "Unable to load books list"));
    } finally {
      setIsLoadingBooks(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === "books") {
      fetchBooks(currentPage, activeSearch);
    }
  }, [isAdmin, activeTab, currentPage, activeSearch]);

  // Chọn hoặc bỏ chọn thể loại cho cuốn sách trong form
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

  // Mở modal chỉnh sửa sách và điền thông tin hiện tại vào form
  const handleStartEditBook = (book) => {
    setBookForm({
      id: book.id,
      title: book.title || "",
      author: book.author_id || "",
      genres: book.genre_ids || [],
      pages: book.pages ?? "",
      rating: book.rating ?? "",
      publish_date: book.publish_date || "",
      cover_image: book.cover_image || "",
      source_url: book.source_url || "",
      description: book.description || "",
    });
    setIsBookModalOpen(true);
  };

  // Lưu thông tin sách: Cập nhật (PATCH) hoặc Tạo mới (POST)
  const handleSaveBook = async (e) => {
    e.preventDefault();

    if (!bookForm.author) {
      toast.warning("Please select an author for the book!");
      return;
    }

    setIsSubmittingBook(true);

    const payload = {
      title: bookForm.title.trim(),
      author: Number(bookForm.author),
      genres: bookForm.genres,
      pages: bookForm.pages ? Number(bookForm.pages) : null,
      rating:
        bookForm.rating !== "" && bookForm.rating != null
          ? Number(bookForm.rating)
          : null,
      publish_date: bookForm.publish_date || null,
      cover_image: bookForm.cover_image.trim(),
      source_url: bookForm.source_url.trim() || null,
      description: bookForm.description.trim(),
    };

    try {
      if (bookForm.id) {
        await api.patch(`/api/books/${bookForm.id}/`, payload);
        toast.success(`Successfully updated book "${payload.title}"!`);
      } else {
        await api.post("/api/books/", payload);
        toast.success(`Successfully created book "${payload.title}"!`);
      }
      setIsBookModalOpen(false);
      setBookForm(initialBookForm);
      fetchBooks(currentPage, activeSearch);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save book details"));
    } finally {
      setIsSubmittingBook(false);
    }
  };

  // Kích hoạt ConfirmModal để xác nhận xóa sách
  const handleDeleteBook = (book) => {
    setDeleteTarget({
      type: "book",
      item: book,
      title: "Delete Book",
      message: (
        <span>
          Are you sure you want to delete the book <strong>&quot;{book.title}&quot;</strong> (ID: #{book.id})? This action cannot be undone.
        </span>
      ),
    });
  };

  // -------------------------------------------------------------
  // 2. CHỨC NĂNG QUẢN LÝ TÁC GIẢ (API GET/POST/PUT/DELETE /api/authors/)
  // -------------------------------------------------------------
  const authorsPerPage = 12;
  const [isSubmittingAuthor, setIsSubmittingAuthor] = useState(false);

  const initialAuthorForm = { id: null, name: "" };
  const [authorForm, setAuthorForm] = useState(initialAuthorForm);

  // Lọc tác giả theo từ khóa tìm kiếm
  const filteredAuthors = allAuthors.filter((a) =>
    activeSearch
      ? a.name.toLowerCase().includes(activeSearch.toLowerCase())
      : true,
  );

  const authorTotalPages = Math.max(
    1,
    Math.ceil(filteredAuthors.length / authorsPerPage),
  );
  const paginatedAuthors = filteredAuthors.slice(
    (currentPage - 1) * authorsPerPage,
    currentPage * authorsPerPage,
  );

  // Mở modal chỉnh sửa tác giả
  const handleStartEditAuthor = (author) => {
    setAuthorForm({ id: author.id, name: author.name });
    setIsAuthorModalOpen(true);
  };

  // Lưu thông tin tác giả: Cập nhật (PUT) hoặc Tạo mới (POST)
  const handleSaveAuthor = async (e) => {
    e.preventDefault();
    if (!authorForm.name.trim()) return;

    setIsSubmittingAuthor(true);
    const payload = { name: authorForm.name.trim() };

    try {
      if (authorForm.id) {
        await api.put(`/api/authors/${authorForm.id}/`, payload);
        toast.success(`Successfully updated author "${payload.name}"!`);
      } else {
        await api.post("/api/authors/", payload);
        toast.success(`Successfully created author "${payload.name}"!`);
      }
      setIsAuthorModalOpen(false);
      setAuthorForm(initialAuthorForm);
      await fetchAllAuthors();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save author"));
    } finally {
      setIsSubmittingAuthor(false);
    }
  };

  // Kích hoạt ConfirmModal để xác nhận xóa tác giả
  const handleDeleteAuthor = (author) => {
    setDeleteTarget({
      type: "author",
      item: author,
      title: "Delete Author",
      message: (
        <span>
          Are you sure you want to delete author <strong>&quot;{author.name}&quot;</strong> (ID: #{author.id})? If this author has linked books, the server may reject the deletion.
        </span>
      ),
    });
  };

  // -------------------------------------------------------------
  // 3. CHỨC NĂNG QUẢN LÝ THỂ LOẠI (API GET/POST/PUT/DELETE /api/genres/)
  // -------------------------------------------------------------
  const [genres, setGenres] = useState([]);
  const [genreTotalCount, setGenreTotalCount] = useState(0);
  const [genreTotalPages, setGenreTotalPages] = useState(1);
  const [isLoadingGenres, setIsLoadingGenres] = useState(false);
  const [isSubmittingGenre, setIsSubmittingGenre] = useState(false);

  const initialGenreForm = { id: null, name: "" };
  const [genreForm, setGenreForm] = useState(initialGenreForm);

  // Nạp danh sách thể loại theo trang và tìm kiếm (GET /api/genres/)
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
      toast.error(getApiErrorMessage(err, "Unable to load genres list"));
    } finally {
      setIsLoadingGenres(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === "genres") {
      fetchGenres(currentPage, activeSearch);
    }
  }, [isAdmin, activeTab, currentPage, activeSearch]);

  // Mở modal chỉnh sửa thể loại
  const handleStartEditGenre = (genre) => {
    setGenreForm({ id: genre.id, name: genre.name });
    setIsGenreModalOpen(true);
  };

  // Lưu thông tin thể loại: Cập nhật (PUT) hoặc Tạo mới (POST)
  const handleSaveGenre = async (e) => {
    e.preventDefault();
    if (!genreForm.name.trim()) return;

    setIsSubmittingGenre(true);
    const payload = { name: genreForm.name.trim() };

    try {
      if (genreForm.id) {
        await api.put(`/api/genres/${genreForm.id}/`, payload);
        toast.success(`Successfully updated genre "${payload.name}"!`);
      } else {
        await api.post("/api/genres/", payload);
        toast.success(`Successfully created genre "${payload.name}"!`);
      }
      setIsGenreModalOpen(false);
      setGenreForm(initialGenreForm);
      fetchGenres(currentPage, activeSearch);
      fetchAllGenresForPicker();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save genre"));
    } finally {
      setIsSubmittingGenre(false);
    }
  };

  // Kích hoạt ConfirmModal để xác nhận xóa thể loại
  const handleDeleteGenre = (genre) => {
    setDeleteTarget({
      type: "genre",
      item: genre,
      title: "Delete Genre",
      message: (
        <span>
          Are you sure you want to delete genre <strong>&quot;{genre.name}&quot;</strong> (ID: #{genre.id})? Linked books will have this genre unassigned.
        </span>
      ),
    });
  };

  // Hàm xử lý xác nhận xóa tập trung cho toàn bộ các đối tượng trong Admin (Sách, Tác giả, Thể loại)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeletingTarget(true);
    try {
      if (deleteTarget.type === "book") {
        await api.delete(`/api/books/${deleteTarget.item.id}/`);
        toast.success(`Successfully deleted book "${deleteTarget.item.title}"!`);
        if (bookForm.id === deleteTarget.item.id) {
          setBookForm(initialBookForm);
        }
        fetchBooks(currentPage, activeSearch);
      } else if (deleteTarget.type === "author") {
        await api.delete(`/api/authors/${deleteTarget.item.id}/`);
        toast.success(`Successfully deleted author "${deleteTarget.item.name}"!`);
        if (authorForm.id === deleteTarget.item.id) {
          setAuthorForm(initialAuthorForm);
        }
        await fetchAllAuthors();
      } else if (deleteTarget.type === "genre") {
        await api.delete(`/api/genres/${deleteTarget.item.id}/`);
        toast.success(`Successfully deleted genre "${deleteTarget.item.name}"!`);
        if (genreForm.id === deleteTarget.item.id) {
          setGenreForm(initialGenreForm);
        }
        fetchGenres(currentPage, activeSearch);
        fetchAllGenresForPicker();
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, `Unable to delete ${deleteTarget.type}`));
    } finally {
      setIsDeletingTarget(false);
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
          Verifying Administrator access...
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
            Access Denied (403 Forbidden)
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
            The Admin Dashboard is restricted to Administrator accounts (Staff /
            Superuser). Please sign in with an authorized account to access this
            page.
          </p>
          <div
            style={{
              display: "flex",
              gap: "14px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
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
              Admin Sign In
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
              Back to Home
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
        {/* ADMIN DASHBOARD HEADER */}
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Admin Dashboard</h1>
            <p className={styles.subtitle}>
              Manage all Books, Authors, and Genres across the E-Library catalog
            </p>
          </div>
        </div>

        {/* ADMIN ACCESS BANNER */}
        <div className={styles.authBannerSuccess}>
          <span>🟢</span>
          <span>
            Operating as Administrator:{" "}
            <strong>{currentUser?.username || "admin"}</strong> (Staff /
            Superuser) — Full catalog management permissions.
          </span>
        </div>

        {/* OVERVIEW STATS CARDS */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📚</div>
            <div>
              <div className={styles.statValue}>{bookTotalCount}</div>
              <div className={styles.statLabel}>Books in catalog</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✍️</div>
            <div>
              <div className={styles.statValue}>{allAuthors.length}</div>
              <div className={styles.statLabel}>Registered Authors</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏷️</div>
            <div>
              <div className={styles.statValue}>
                {genreTotalCount || allGenresList.length}
              </div>
              <div className={styles.statLabel}>Book Genres</div>
            </div>
          </div>
        </div>

        {/* 3-TAB NAVIGATION BAR (Linked to ?tab= on URL) */}
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
        {/* TAB 1: BOOKS MANAGEMENT (Books Management)                      */}
        {/* ============================================================== */}
        {activeTab === "books" && (
          <div className={styles.tableColumn}>
            {/* TOOLBAR: SEARCH LEFT - ADD NEW BOOK BUTTON RIGHT */}
            <div className={styles.tableToolbar}>
              <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search books by title or author..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" className={styles.searchActionBtn}>
                  Search
                </button>
                {activeSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={styles.clearSearchBtn}
                  >
                    Clear
                  </button>
                )}
              </form>

              {/* + ADD NEW BOOK BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setBookForm(initialBookForm);
                  setIsBookModalOpen(true);
                }}
                className={styles.addNewBtn}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add New Book</span>
              </button>
            </div>

            {/* BOOKS DATA TABLE */}
            <div className={styles.tableWrapper}>
              {isLoadingBooks ? (
                <div className={styles.loadingState}>
                  Loading books from server...
                </div>
              ) : books.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>📖</div>
                  <div>No books found matching your criteria.</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>ID</th>
                      <th style={{ width: "50px" }}>Cover</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Genres</th>
                      <th>Rating / Pages</th>
                      <th style={{ width: "130px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <tr key={book.id}>
                        <td>#{book.id}</td>
                        <td className={styles.bookThumbCell}>
                          <img
                            src={
                              book.cover_image ||
                              "https://placehold.co/40x60?text=No+Cover"
                            }
                            alt={book.title}
                            className={styles.bookThumb}
                            onError={(e) => {
                              e.target.src =
                                "https://placehold.co/40x60?text=Cover";
                            }}
                          />
                        </td>
                        <td className={styles.itemName}>
                          <Link
                            to={`/books/${book.id}`}
                            className={styles.bookLink}
                          >
                            {book.title}
                          </Link>
                        </td>
                        <td>{book.author || "Unknown"}</td>
                        <td>
                          <div className={styles.genreTags}>
                            {Array.isArray(book.genres) &&
                            book.genres.length > 0 ? (
                              book.genres.slice(0, 3).map((g, idx) => (
                                <span key={idx} className={styles.genreTag}>
                                  {g}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: "#999", fontSize: "12px" }}>
                                None
                              </span>
                            )}
                            {Array.isArray(book.genres) &&
                              book.genres.length > 3 && (
                                <span className={styles.genreTag}>
                                  +{book.genres.length - 3}
                                </span>
                              )}
                          </div>
                        </td>
                        <td style={{ fontSize: "13px" }}>
                          ⭐ {formatRating(book.avg_rating ?? book.rating)}
                          <br />
                          <span style={{ color: "#777" }}>
                            {book.pages ? `${book.pages} pages` : "N/A"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionGroup}>
                            <button
                              onClick={() => handleStartEditBook(book)}
                              className={styles.editBtn}
                              title="Edit book details"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book)}
                              className={styles.deleteBtn}
                              title="Delete book from database"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* PAGINATION FOR BOOKS (?page=X) */}
            <div className={styles.paginationRow}>
              <div className={styles.pageInfo}>
                Showing page <strong>{currentPage}</strong> of{" "}
                <strong>{bookTotalPages}</strong> ({bookTotalCount} books)
              </div>
              {bookTotalPages > 1 && (
                <div className={styles.pageButtons}>
                  <button
                    type="button"
                    disabled={currentPage <= 1 || isLoadingBooks}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={styles.pageBtn}
                  >
                    « Previous
                  </button>

                  {getPaginationItems(currentPage, bookTotalPages).map(
                    (item, idx) => {
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
                    },
                  )}

                  <button
                    type="button"
                    disabled={currentPage >= bookTotalPages || isLoadingBooks}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={styles.pageBtn}
                  >
                    Next »
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: AUTHORS MANAGEMENT (Authors Management)                  */}
        {/* ============================================================== */}
        {activeTab === "authors" && (
          <div className={styles.tableColumn}>
            <div className={styles.tableToolbar}>
              <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search authors by name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" className={styles.searchActionBtn}>
                  Search
                </button>
                {activeSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={styles.clearSearchBtn}
                  >
                    Clear
                  </button>
                )}
              </form>

              {/* + ADD NEW AUTHOR BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setAuthorForm(initialAuthorForm);
                  setIsAuthorModalOpen(true);
                }}
                className={styles.addNewBtn}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
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
                  <div>No authors found matching your criteria.</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>ID</th>
                      <th>Author Name</th>
                      <th style={{ width: "160px" }}>Detail Page</th>
                      <th style={{ width: "140px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAuthors.map((author) => (
                      <tr key={author.id}>
                        <td>#{author.id}</td>
                        <td className={styles.itemName}>{author.name}</td>
                        <td>
                          <Link
                            to={`/authors/${author.id}`}
                            className={styles.bookLink}
                          >
                            View Author Profile ↗
                          </Link>
                        </td>
                        <td>
                          <div className={styles.actionGroup}>
                            <button
                              onClick={() => handleStartEditAuthor(author)}
                              className={styles.editBtn}
                              title="Edit author name"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAuthor(author)}
                              className={styles.deleteBtn}
                              title="Delete author from database"
                            >
                              Delete
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
                Showing page <strong>{currentPage}</strong> of{" "}
                <strong>{authorTotalPages}</strong> ({filteredAuthors.length}{" "}
                authors)
              </div>
              {authorTotalPages > 1 && (
                <div className={styles.pageButtons}>
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={styles.pageBtn}
                  >
                    « Previous
                  </button>

                  {getPaginationItems(currentPage, authorTotalPages).map(
                    (item, idx) => {
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
                    },
                  )}

                  <button
                    type="button"
                    disabled={currentPage >= authorTotalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={styles.pageBtn}
                  >
                    Next »
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: GENRES MANAGEMENT (Genres Management)                     */}
        {/* ============================================================== */}
        {activeTab === "genres" && (
          <div className={styles.tableColumn}>
            <div className={styles.tableToolbar}>
              <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search genres by name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" className={styles.searchActionBtn}>
                  Search
                </button>
                {activeSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={styles.clearSearchBtn}
                  >
                    Clear
                  </button>
                )}
              </form>

              {/* + ADD NEW GENRE BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setGenreForm(initialGenreForm);
                  setIsGenreModalOpen(true);
                }}
                className={styles.addNewBtn}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add New Genre</span>
              </button>
            </div>

            <div className={styles.tableWrapper}>
              {isLoadingGenres ? (
                <div className={styles.loadingState}>
                  Loading genres from server...
                </div>
              ) : genres.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>🏷️</div>
                  <div>No genres found matching your criteria.</div>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>ID</th>
                      <th>Genre Name</th>
                      <th>Book Count</th>
                      <th style={{ width: "140px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genres.map((genre) => (
                      <tr key={genre.id}>
                        <td>#{genre.id}</td>
                        <td className={styles.itemName}>{genre.name}</td>
                        <td>
                          <span style={{ fontWeight: 600 }}>
                            {genre.book_count ?? 0}
                          </span>{" "}
                          books
                        </td>
                        <td>
                          <div className={styles.actionGroup}>
                            <button
                              onClick={() => handleStartEditGenre(genre)}
                              className={styles.editBtn}
                              title="Edit genre name"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteGenre(genre)}
                              className={styles.deleteBtn}
                              title="Delete genre from database"
                            >
                              Delete
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
                Showing page <strong>{currentPage}</strong> of{" "}
                <strong>{genreTotalPages}</strong> ({genreTotalCount} genres)
              </div>
              {genreTotalPages > 1 && (
                <div className={styles.pageButtons}>
                  <button
                    type="button"
                    disabled={currentPage <= 1 || isLoadingGenres}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={styles.pageBtn}
                  >
                    « Previous
                  </button>

                  {getPaginationItems(currentPage, genreTotalPages).map(
                    (item, idx) => {
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
                    },
                  )}

                  <button
                    type="button"
                    disabled={currentPage >= genreTotalPages || isLoadingGenres}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={styles.pageBtn}
                  >
                    Next »
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* POPUP MODAL 1: ADD / EDIT BOOK                                  */}
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
              placeholder="e.g. A Brief History of Time"
              value={bookForm.title}
              onChange={(e) =>
                setBookForm({ ...bookForm, title: e.target.value })
              }
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Author *</label>
            <select
              className={styles.select}
              value={bookForm.author}
              onChange={(e) =>
                setBookForm({ ...bookForm, author: e.target.value })
              }
              required
            >
              <option value="">-- Select an Author --</option>
              {allAuthors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name} (ID: #{author.id})
                </option>
              ))}
            </select>
            <span className={styles.helperText}>
              Author not listed? Switch to "Manage Authors" tab to add them.
            </span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Genres (Click to toggle)</label>
            <div className={styles.genrePickerBox}>
              {allGenresList.map((g) => {
                const isSelected = bookForm.genres.includes(g.id);
                return (
                  <span
                    key={g.id}
                    onClick={() => handleToggleGenre(g.id)}
                    className={`${styles.genreChip} ${isSelected ? styles.genreChipSelected : ""}`}
                    title={isSelected ? "Click to deselect" : "Click to select"}
                  >
                    {isSelected ? `✓ ${g.name}` : g.name}
                  </span>
                );
              })}
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Rating (0 - 5)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.01"
                className={styles.input}
                placeholder="4.5"
                value={bookForm.rating}
                onChange={(e) =>
                  setBookForm({ ...bookForm, rating: e.target.value })
                }
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Pages</label>
              <input
                type="number"
                min="1"
                className={styles.input}
                placeholder="320"
                value={bookForm.pages}
                onChange={(e) =>
                  setBookForm({ ...bookForm, pages: e.target.value })
                }
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Publish Date</label>
              <input
                type="date"
                className={styles.input}
                value={bookForm.publish_date}
                onChange={(e) =>
                  setBookForm({ ...bookForm, publish_date: e.target.value })
                }
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
              onChange={(e) =>
                setBookForm({ ...bookForm, cover_image: e.target.value })
              }
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
                <span style={{ fontSize: "12px", color: "#666" }}>
                  Cover Image Preview
                </span>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Source URL (Original book / purchase link)
            </label>
            <input
              type="url"
              className={styles.input}
              placeholder="https://..."
              value={bookForm.source_url}
              onChange={(e) =>
                setBookForm({ ...bookForm, source_url: e.target.value })
              }
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              placeholder="Brief description or synopsis of the book..."
              value={bookForm.description}
              onChange={(e) =>
                setBookForm({ ...bookForm, description: e.target.value })
              }
            />
          </div>

          <div className={styles.btnRow}>
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingBook}
              className={styles.submitBtn}
            >
              {isSubmittingBook
                ? "Saving..."
                : bookForm.id
                  ? "Update Book"
                  : "+ Create Book"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* POPUP MODAL 2: ADD / EDIT AUTHOR                                */}
      {/* ============================================================== */}
      <Modal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        title={
          authorForm.id ? `Edit Author #${authorForm.id}` : "Add New Author"
        }
        maxWidth="480px"
      >
        <form onSubmit={handleSaveAuthor}>
          <div className={styles.field}>
            <label className={styles.label}>Author Name *</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. J.K. Rowling"
              value={authorForm.name}
              onChange={(e) =>
                setAuthorForm({ ...authorForm, name: e.target.value })
              }
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingAuthor}
              className={styles.submitBtn}
            >
              {isSubmittingAuthor
                ? "Saving..."
                : authorForm.id
                  ? "Update Author"
                  : "+ Create Author"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* POPUP MODAL 3: ADD / EDIT GENRE                                 */}
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
              placeholder="e.g. Science Fiction, Dystopia..."
              value={genreForm.name}
              onChange={(e) =>
                setGenreForm({ ...genreForm, name: e.target.value })
              }
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingGenre}
              className={styles.submitBtn}
            >
              {isSubmittingGenre
                ? "Saving..."
                : genreForm.id
                  ? "Update Genre"
                  : "+ Create Genre"}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRMATION POPUP FOR ALL ADMIN DELETE ACTIONS */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.title || "Confirm Deletion"}
        message={deleteTarget?.message}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeletingTarget}
      />

      <Footer />
    </div>
  );
}
