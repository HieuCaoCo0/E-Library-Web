import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import Header from "../../components/Header";
import styles from "./MyBooksPage.module.css";
import Footer from "../../components/Footer";
import ConfirmModal from "../../components/ConfirmModal";
import api, { getApiErrorMessage } from "../../plugins/axios";

export default function MyBooksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Danh sách các cuốn sách trong tủ sách cá nhân kèm thông tin chi tiết
  const [shelfItems, setShelfItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bộ lọc kệ hiện tại (all | read | reading | want_to_read)
  const activeShelf = searchParams.get("shelf") || "all";

  // Từ khóa tìm kiếm cục bộ trong kệ sách của người dùng
  const [searchQuery, setSearchQuery] = useState("");

  // Chế độ hiển thị: dạng bảng ("list") hoặc dạng lưới thẻ ("grid")
  const [viewMode, setViewMode] = useState("list");

  // Đối tượng sách được chọn để mở ConfirmModal xác nhận xóa
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Xử lý chuyển tab trạng thái kệ sách (cập nhật query URL ?shelf=...)
  const handleShelfChange = (key) => {
    const params = new URLSearchParams(searchParams);
    if (key === "all") {
      params.delete("shelf");
    } else {
      params.set("shelf", key);
    }
    setSearchParams(params);
  };

  // Nạp toàn bộ danh sách sách trong kệ người dùng (GET /api/user-library/) kèm thông tin chi tiết sách
  const loadUserLibrary = async () => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.get("/api/user-library/");
      const records = res.data || [];

      // Với mỗi bản ghi kệ sách, nạp thêm chi tiết cuốn sách từ GET /api/books/{book_id}/
      const bookPromises = records.map(async (rec) => {
        try {
          const bookRes = await api.get(`/api/books/${rec.book}/`);
          const b = bookRes.data;
          return {
            id: rec.id,
            bookId: rec.book,
            title: b.title,
            authorId: b.author_id,
            author: b.author,
            avg_rating: b.avg_rating || (b.rating ? Number(b.rating).toFixed(1) : "0.0"),
            status: rec.status.toLowerCase(),
            cover: b.cover_image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
          };
        } catch {
          return {
            id: rec.id,
            bookId: rec.book,
            title: `Book #${rec.book}`,
            authorId: null,
            author: "Unknown Author",
            avg_rating: "0.0",
            status: rec.status.toLowerCase(),
            cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
          };
        }
      });

      const loadedItems = await Promise.all(bookPromises);
      setShelfItems(loadedItems);
    } catch (err) {
      console.error("Lỗi khi tải tủ sách cá nhân:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Nạp dữ liệu lần đầu và lắng nghe sự kiện làm mới token để đồng bộ lại
  useEffect(() => {
    loadUserLibrary();
    window.addEventListener("auth_token_refreshed", loadUserLibrary);
    return () => {
      window.removeEventListener("auth_token_refreshed", loadUserLibrary);
    };
  }, []);

  // Tính số lượng sách tương ứng theo từng trạng thái đọc
  const countByStatus = (status) =>
    status === "all"
      ? shelfItems.length
      : shelfItems.filter((item) => item.status === status).length;

  // Lọc sách theo kệ đang chọn và theo chuỗi tìm kiếm tiêu đề/tác giả
  const filteredItems = shelfItems.filter((item) => {
    const matchShelf = activeShelf === "all" || item.status === activeShelf;
    const matchQuery =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchShelf && matchQuery;
  });

  // Cập nhật trạng thái đọc của cuốn sách (PATCH /api/user-library/{id}/)
  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/api/user-library/${id}/`, {
        status: newStatus.toUpperCase(),
      });
      setShelfItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item,
        ),
      );
      toast.success("Book status updated successfully!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to update book status."));
    }
  };

  // Xác nhận xóa sách khỏi kệ người dùng qua ConfirmModal (DELETE /api/user-library/{id}/)
  const handleConfirmRemove = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await api.delete(`/api/user-library/${deleteTarget.id}/`);
      setShelfItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast.info("Removed book from bookshelf.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to remove book from bookshelf."));
    } finally {
      setIsDeleting(false);
    }
  };

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("refresh_token");

  if (!token) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h2>You are not signed in</h2>
          <p style={{ color: "#666", margin: "16px 0 24px" }}>
            Please sign in to view and manage your personal bookshelf.
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "10px 24px",
              backgroundColor: "#382110",
              color: "#fff",
              border: "none",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            Sign in
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const SHELVES = [
    { key: "all", label: "All Books" },
    { key: "read", label: "Read" },
    { key: "reading", label: "Currently Reading" },
    { key: "want_to_read", label: "Want to Read" },
  ];

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>My Books</h1>
            <p className={styles.pageSubtitle}>
              Manage books you are currently reading, have read, or plan to read
            </p>
          </div>

          <div className={styles.controls}>
            <input
              type="text"
              placeholder="Search in your books..."
              className={styles.shelfSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className={styles.viewToggle}>
              <button
                onClick={() => setViewMode("list")}
                className={`${styles.viewBtn} ${
                  viewMode === "list" ? styles.viewBtnActive : ""
                }`}
                title="Table view"
              >
                ☰
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`${styles.viewBtn} ${
                  viewMode === "grid" ? styles.viewBtnActive : ""
                }`}
                title="Grid view"
              >
                ⊞
              </button>
            </div>
          </div>
        </div>

        <div className={styles.layout}>
          {/* LEFT COLUMN: Bookshelves */}
          <aside className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>Bookshelves</h2>
            <ul className={styles.shelfList}>
              {SHELVES.map((shelf) => (
                <li key={shelf.key} className={styles.shelfItem}>
                  <button
                    onClick={() => handleShelfChange(shelf.key)}
                    className={`${styles.shelfLink} ${
                      activeShelf === shelf.key ? styles.shelfLinkActive : ""
                    }`}
                  >
                    <span>{shelf.label}</span>
                    <span className={styles.shelfCount}>
                      ({countByStatus(shelf.key)})
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className={styles.statsBox}>
              <div>
                <strong>Reading Stats:</strong>
              </div>
              <div>
                • Read: <strong>{countByStatus("read")}</strong> books
              </div>
              <div>
                • Currently Reading: <strong>{countByStatus("reading")}</strong> books
              </div>
              <div>
                • Want to Read: <strong>{countByStatus("want_to_read")}</strong> books
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: Table or Grid View */}
          <section>
            {isLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                Loading your personal bookshelf...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className={styles.emptyBox}>
                <div>No books found on this shelf!</div>
                <Link to="/" className={styles.browseLink}>
                  + Explore and add books from Home
                </Link>
              </div>
            ) : viewMode === "list" ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Cover</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Avg Rating</th>
                    <th>Shelves</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link to={`/books/${item.bookId}`}>
                          <img
                            src={item.cover}
                            alt={item.title}
                            className={styles.coverThumb}
                          />
                        </Link>
                      </td>
                      <td>
                        <Link
                          to={`/books/${item.bookId}`}
                          className={styles.bookTitle}
                        >
                          {item.title}
                        </Link>
                      </td>
                      <td>
                        {item.authorId ? (
                          <Link
                            to={`/authors/${item.authorId}`}
                            className={styles.authorName}
                          >
                            {item.author}
                          </Link>
                        ) : (
                          item.author
                        )}
                      </td>
                      <td className={styles.avgRating}>★ {item.avg_rating}</td>
                      <td>
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(item.id, e.target.value)
                          }
                          className={styles.statusSelect}
                        >
                          <option value="want_to_read">Want to Read</option>
                          <option value="reading">Currently Reading</option>
                          <option value="read">Read</option>
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => setDeleteTarget({ id: item.id, title: item.title })}
                          className={styles.removeBtn}
                          title="Remove from shelf"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.gridContainer}>
                {filteredItems.map((item) => (
                  <div key={item.id} className={styles.gridCard}>
                    <Link to={`/books/${item.bookId}`}>
                      <img
                        src={item.cover}
                        alt={item.title}
                        className={styles.gridCover}
                      />
                    </Link>
                    <Link
                      to={`/books/${item.bookId}`}
                      className={styles.bookTitle}
                    >
                      {item.title}
                    </Link>
                    <div className={styles.gridAuthor}>by {item.author}</div>
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleStatusChange(item.id, e.target.value)
                      }
                      className={styles.statusSelect}
                      style={{ marginTop: "auto" }}
                    >
                      <option value="want_to_read">Want to Read</option>
                      <option value="reading">Currently Reading</option>
                      <option value="read">Read</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmRemove}
        title="Remove from Shelf"
        message={
          <span>
            Are you sure you want to remove <strong>&quot;{deleteTarget?.title}&quot;</strong> from your bookshelf?
          </span>
        }
        confirmText="Yes, Remove"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />

      <Footer />
    </div>
  );
}
