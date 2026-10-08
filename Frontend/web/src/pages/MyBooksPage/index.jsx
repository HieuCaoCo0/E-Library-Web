import { useState } from "react";
import { Link } from "react-router";
import Header from "../../components/Header";
import styles from "./MyBooksPage.module.css";
import Footer from "../../components/Footer";

// Dữ liệu giả lập cho Tủ sách cá nhân (Khớp với API /api/user-library/ của Nguyễn Ngọc Huy)
const INITIAL_SHELF_BOOKS = [
  {
    id: 1,
    bookId: 1,
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    authorId: 2,
    author: "Robert C. Martin",
    avg_rating: 4.8,
    userRating: 5,
    status: "reading",
    dateAdded: "01/10/2026",
    dateRead: "-",
    cover:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    bookId: 2,
    title: "Mắt Biếc",
    authorId: 1,
    author: "Nguyễn Nhật Ánh",
    avg_rating: 4.7,
    userRating: 5,
    status: "read",
    dateAdded: "15/09/2026",
    dateRead: "22/09/2026",
    cover:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 3,
    bookId: 3,
    title: "Dế Mèn Phiêu Lưu Ký",
    authorId: 4,
    author: "Tô Hoài",
    avg_rating: 4.9,
    userRating: 4,
    status: "read",
    dateAdded: "10/09/2026",
    dateRead: "14/09/2026",
    cover:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 4,
    bookId: 4,
    title: "Harry Potter and the Sorcerer's Stone",
    authorId: 3,
    author: "J.K. Rowling",
    avg_rating: 4.9,
    userRating: 0,
    status: "want_to_read",
    dateAdded: "05/10/2026",
    dateRead: "-",
    cover:
      "https://images.unsplash.com/photo-1618666012174-83b441c0bc76?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 5,
    bookId: 5,
    title: "Atomic Habits: Thay Đổi Tí Hon Hiệu Quả Bất Ngờ",
    authorId: 5,
    author: "James Clear",
    avg_rating: 4.8,
    userRating: 0,
    status: "want_to_read",
    dateAdded: "07/10/2026",
    dateRead: "-",
    cover:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80",
  },
];

export default function MyBooksPage() {
  const [shelfItems, setShelfItems] = useState(INITIAL_SHELF_BOOKS);
  const [activeShelf, setActiveShelf] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list"); // 'list' hoặc 'grid'

  // Đếm số lượng sách theo từng trạng thái kệ
  const countByStatus = (status) =>
    status === "all"
      ? shelfItems.length
      : shelfItems.filter((item) => item.status === status).length;

  // Lọc sách theo kệ bên trái và ô tìm kiếm bên phải
  const filteredItems = shelfItems.filter((item) => {
    const matchShelf = activeShelf === "all" || item.status === activeShelf;
    const matchQuery =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchShelf && matchQuery;
  });

  // Đổi trạng thái kệ sách (PATCH /api/user-library/{id}/)
  const handleStatusChange = (id, newStatus) => {
    setShelfItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: newStatus,
              dateRead: newStatus === "read" ? "08/10/2026" : "-",
            }
          : item,
      ),
    );
  };

  // Chấm sao nhanh ngay trên bảng
  const handleRateBook = (id, rating) => {
    setShelfItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, userRating: rating } : item,
      ),
    );
  };

  // Xóa sách khỏi tủ cá nhân (DELETE /api/user-library/{id}/)
  const handleRemove = (id, title) => {
    if (
      window.confirm(`Bạn có chắc muốn xóa "${title}" khỏi tủ sách cá nhân?`)
    ) {
      setShelfItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const shelves = [
    { key: "all", label: "All" },
    { key: "want_to_read", label: "Want to Read" },
    { key: "reading", label: "Currently Reading" },
    { key: "read", label: "Read" },
  ];

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        {/* Thanh tiêu đề My Books & Công cụ lọc */}
        <div className={styles.topBar}>
          <h1 className={styles.pageTitle}>My Books</h1>

          <div className={styles.controls}>
            <input
              type="text"
              placeholder="Search and filter my books..."
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
                title="List View"
              >
                ☰ List
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`${styles.viewBtn} ${
                  viewMode === "grid" ? styles.viewBtnActive : ""
                }`}
                title="Grid View"
              >
                ⊞ Grid
              </button>
            </div>
          </div>
        </div>

        <div className={styles.layout}>
          {/* CỘT TRÁI: Danh mục kệ sách (Bookshelves) */}
          <aside>
            <h2 className={styles.sidebarTitle}>Bookshelves</h2>
            <ul className={styles.shelfList}>
              {shelves.map((s) => (
                <li key={s.key} className={styles.shelfItem}>
                  <button
                    onClick={() => setActiveShelf(s.key)}
                    className={`${styles.shelfLink} ${
                      activeShelf === s.key ? styles.shelfLinkActive : ""
                    }`}
                  >
                    <span>{s.label}</span>
                    <span>({countByStatus(s.key)})</span>
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
                • Muốn đọc: <strong>{countByStatus("want_to_read")}</strong>{" "}
                cuốn
              </div>
            </div>
          </aside>

          {/* CỘT PHẢI: Hiển thị Bảng hoặc Lưới sách */}
          <section>
            {filteredItems.length === 0 ? (
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
                    <th>My Rating</th>
                    <th>Shelves</th>
                    <th>Date Read</th>
                    <th>Date Added</th>
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
                        <Link
                          to={`/authors/${item.authorId}`}
                          className={styles.authorName}
                        >
                          {item.author}
                        </Link>
                      </td>
                      <td className={styles.avgRating}>★ {item.avg_rating}</td>
                      <td>
                        <div className={styles.starGroup}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRateBook(item.id, star)}
                              className={`${styles.starBtn} ${
                                star <= item.userRating
                                  ? styles.starFilled
                                  : styles.starEmpty
                              }`}
                              title={`Chấm ${star} sao`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </td>
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
                      <td className={styles.dateCell}>{item.dateRead}</td>
                      <td className={styles.dateCell}>{item.dateAdded}</td>
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
