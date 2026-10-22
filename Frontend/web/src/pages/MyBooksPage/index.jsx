import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import Header from "../../components/Header";
import styles from "./MyBooksPage.module.css";
import Footer from "../../components/Footer";
import api, { getApiErrorMessage } from "../../plugins/axios";

export default function MyBooksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shelfItems, setShelfItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const activeShelf = searchParams.get("shelf") || "all";
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");

  const handleShelfChange = (key) => {
    const params = new URLSearchParams(searchParams);
    if (key === "all") {
      params.delete("shelf");
    } else {
      params.set("shelf", key);
    }
    setSearchParams(params);
  };

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

      // Lấy thông tin chi tiết từng cuốn sách
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
      console.error("Lỗi khi tải tủ sách:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserLibrary();
    window.addEventListener("auth_token_refreshed", loadUserLibrary);
    return () => {
      window.removeEventListener("auth_token_refreshed", loadUserLibrary);
    };
  }, []);

  const countByStatus = (status) =>
    status === "all"
      ? shelfItems.length
      : shelfItems.filter((item) => item.status === status).length;

  const filteredItems = shelfItems.filter((item) => {
    const matchShelf = activeShelf === "all" || item.status === activeShelf;
    const matchQuery =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchShelf && matchQuery;
  });

  // Đổi trạng thái kệ sách (PATCH /api/user-library/{id}/)
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
      toast.success("Đã cập nhật trạng thái sách!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể cập nhật trạng thái sách."));
    }
  };

  // Xóa sách khỏi tủ sách (DELETE /api/user-library/{id}/)
  const handleRemove = async (id, title) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa "${title}" khỏi tủ sách?`)) return;

    try {
      await api.delete(`/api/user-library/${id}/`);
      setShelfItems((prev) => prev.filter((item) => item.id !== id));
      toast.info("Đã xóa sách khỏi tủ sách.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xóa sách khỏi tủ sách."));
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
          <h2>Bạn chưa đăng nhập</h2>
          <p style={{ color: "#666", margin: "16px 0 24px" }}>
            Vui lòng đăng nhập để xem và quản lý tủ sách cá nhân (My Books) của bạn.
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
            Đi đến Đăng nhập
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
              Quản lý danh sách sách bạn đang đọc, đã đọc hoặc dự định đọc
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
          {/* CỘT TRÁI: Danh sách kệ sách */}
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
                <strong>Thống kê đọc sách:</strong>
              </div>
              <div>
                • Đã đọc xong: <strong>{countByStatus("read")}</strong> cuốn
              </div>
              <div>
                • Đang đọc: <strong>{countByStatus("reading")}</strong> cuốn
              </div>
              <div>
                • Muốn đọc: <strong>{countByStatus("want_to_read")}</strong> cuốn
              </div>
            </div>
          </aside>

          {/* CỘT PHẢI: Hiển thị Bảng hoặc Lưới sách */}
          <section>
            {isLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                Đang tải tủ sách cá nhân...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className={styles.emptyBox}>
                <div>Không có cuốn sách nào trong kệ này!</div>
                <Link to="/" className={styles.browseLink}>
                  + Khám phá và thêm sách từ Trang chủ
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
                          onClick={() => handleRemove(item.id, item.title)}
                          className={styles.removeBtn}
                          title="Xóa khỏi tủ sách"
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

      <Footer />
    </div>
  );
}
