import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { toast } from "react-toastify";
import Header from "../../components/Header";
import styles from "./AuthorDetailPage.module.css";
import Footer from "../../components/Footer";
import api, { getApiErrorMessage } from "../../plugins/axios";

export default function AuthorDetailPage() {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [savedBooks, setSavedBooks] = useState([]);

  // Lấy chi tiết tác giả từ API GET /api/authors/{id}/
  useEffect(() => {
    setIsLoading(true);
    api
      .get(`/api/authors/${id}/`)
      .then((res) => {
        setAuthor(res.data);
      })
      .catch((err) => {
        console.error("Lỗi tải chi tiết tác giả:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  // Lấy danh sách kệ sách cá nhân
  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");
    if (!token) return;

    api
      .get("/api/user-library/")
      .then((res) => {
        const items = res.data || [];
        setSavedBooks(items.map((i) => i.book));
      })
      .catch(() => {});
  }, []);

  const toggleShelf = async (bookId) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");
    if (!token) {
      toast.info("Bạn cần đăng nhập để lưu sách vào kệ!");
      return;
    }

    try {
      await api.post("/api/user-library/", {
        book: bookId,
        status: "WANT_TO_READ",
      });
      setSavedBooks((prev) =>
        prev.includes(bookId) ? prev : [...prev, bookId],
      );
      toast.success("Đã lưu sách vào kệ muốn đọc!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể lưu sách vào kệ."));
    }
  };

  if (isLoading) {
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
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Đang tải thông tin tác giả...
        </div>
        <Footer />
      </div>
    );
  }

  if (!author) {
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
          <h2>Không tìm thấy thông tin tác giả!</h2>
          <Link to="/authors" style={{ color: "#382110", textDecoration: "underline" }}>
            Quay lại danh sách tác giả
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const booksList = author.book || author.books || [];

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        {/* CỘT TRÁI: Avatar & Thông tin tóm tắt */}
        <aside className={styles.leftCol}>
          <div className={styles.avatarBox}>
            {author.name ? author.name.charAt(0) : "A"}
          </div>

          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`${styles.followBtn} ${
              isFollowing ? styles.followingBtn : ""
            }`}
          >
            {isFollowing ? "✓ Following Author" : "+ Follow Author"}
          </button>

          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Published Books</span>
              <span className={styles.infoValue}>
                {booksList.length} books in library
              </span>
            </div>
          </div>
        </aside>

        {/* CỘT PHẢI: Tiểu sử & Danh sách sách của tác giả */}
        <section>
          <h1 className={styles.authorName}>{author.name}</h1>

          <div className={styles.statsBar}>
            <span className={styles.stars}>★★★★★</span>
            <span>
              <strong>{booksList.length}</strong> đầu sách trong hệ thống
            </span>
          </div>

          <h2 className={styles.bioTitle}>About the Author</h2>
          <p className={styles.bioText}>
            {author.bio || `${author.name} là tác giả có nhiều đầu sách được bạn đọc yêu thích tại E-Library.`}
          </p>

          {/* Danh sách sách của tác giả */}
          <div className={styles.booksSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {author.name}&apos;s Books ({booksList.length})
              </h2>
            </div>

            {booksList.length === 0 ? (
              <p style={{ color: "#666" }}>Chưa có cuốn sách nào của tác giả này trong thư viện.</p>
            ) : (
              <div className={styles.bookList}>
                {booksList.map((book) => {
                  const isAdded = savedBooks.includes(book.id);
                  return (
                    <div key={book.id} className={styles.bookItem}>
                      <div className={styles.bookLeft}>
                        <Link to={`/books/${book.id}`}>
                          <img
                            src={book.cover_image || book.cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80"}
                            alt={book.title}
                            className={styles.bookCover}
                          />
                        </Link>
                        <div>
                          <Link
                            to={`/books/${book.id}`}
                            className={styles.bookTitle}
                          >
                            {book.title}
                          </Link>
                          <div className={styles.bookRating}>
                            <span className={styles.stars}>★★★★★</span>
                            <span>
                              {book.rating ? Number(book.rating).toFixed(1) : "0.0"} rating ({book.pages || "N/A"} pages)
                            </span>
                          </div>
                          <p className={styles.bookDesc}>{book.description || `Xuất bản: ${book.publish_date || "N/A"}`}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleShelf(book.id)}
                        className={`${styles.shelfBtn} ${
                          isAdded ? styles.shelfBtnAdded : ""
                        }`}
                      >
                        {isAdded ? "✓ In My Shelf" : "+ Want to Read"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
