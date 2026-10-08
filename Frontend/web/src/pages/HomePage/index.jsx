import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import Header from "../../components/Header";
import styles from "./HomePage.module.css";

// Dữ liệu giả lập khớp với API Module 3 (Genre), Module 4 (Book), Module 2 (Author)
const MOCK_GENRES = [
  { id: "all", name: "All Genres", count: 6 },
  { id: "programming", name: "Programming & Tech", count: 2 },
  { id: "literature", name: "Vietnamese Literature", count: 2 },
  { id: "fantasy", name: "Fantasy & Sci-Fi", count: 1 },
  { id: "self-help", name: "Self Help & Psychology", count: 1 },
];

const MOCK_BOOKS = [
  {
    id: 1,
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    genre: "programming",
    avg_rating: 4.8,
    reviews_count: 342,
    cover:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    title: "Mắt Biếc",
    author: "Nguyễn Nhật Ánh",
    genre: "literature",
    avg_rating: 4.7,
    reviews_count: 518,
    cover:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 3,
    title: "Dế Mèn Phiêu Lưu Ký",
    author: "Tô Hoài",
    genre: "literature",
    avg_rating: 4.9,
    reviews_count: 610,
    cover:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 4,
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    genre: "fantasy",
    avg_rating: 4.9,
    reviews_count: 1240,
    cover:
      "https://images.unsplash.com/photo-1618666012174-83b441c0bc76?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 5,
    title: "Atomic Habits: Thay Đổi Tí Hon Hiệu Quả Bất Ngờ",
    author: "James Clear",
    genre: "self-help",
    avg_rating: 4.8,
    reviews_count: 890,
    cover:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 6,
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt",
    genre: "programming",
    avg_rating: 4.7,
    reviews_count: 275,
    cover:
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=80",
  },
];

const MOCK_AUTHORS = [
  { id: 1, name: "Nguyễn Nhật Ánh", booksCount: 45 },
  { id: 2, name: "Robert C. Martin", booksCount: 12 },
  { id: 3, name: "J.K. Rowling", booksCount: 18 },
  { id: 4, name: "Tô Hoài", booksCount: 32 },
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Lưu danh sách ID sách đã bấm "Want to Read" (sau này nối với POST /api/user-library/)
  const [savedBooks, setSavedBooks] = useState([2]);

  const searchKeyword = searchParams.get("search") || "";
  const selectedGenre = searchParams.get("genre") || "all";

  // Lọc sách theo cả từ khóa tìm kiếm (?search=) và thể loại (?genre=)
  const filteredBooks = MOCK_BOOKS.filter((book) => {
    const matchGenre = selectedGenre === "all" || book.genre === selectedGenre;
    const matchSearch =
      !searchKeyword ||
      book.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      book.author.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchGenre && matchSearch;
  });

  const handleSelectGenre = (genreId) => {
    const params = new URLSearchParams(searchParams);
    if (genreId === "all") {
      params.delete("genre");
    } else {
      params.set("genre", genreId);
    }
    setSearchParams(params);
  };

  const toggleShelf = (bookId) => {
    setSavedBooks((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId],
    );
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
              Khám phá kho sách, lưu vào tủ sách cá nhân và chia sẻ đánh giá
              cùng cộng đồng E-Library.
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
            {MOCK_GENRES.map((genre) => (
              <li key={genre.id} className={styles.genreItem}>
                <button
                  onClick={() => handleSelectGenre(genre.id)}
                  className={`${styles.genreBtn} ${
                    selectedGenre === genre.id ? styles.genreBtnActive : ""
                  }`}
                >
                  <span>{genre.name}</span>
                  <span>({genre.count})</span>
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
                  : MOCK_GENRES.find((g) => g.id === selectedGenre)?.name}
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

          {filteredBooks.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Không tìm thấy cuốn sách nào khớp với từ khóa của bạn.</p>
              <button
                onClick={() => setSearchParams({})}
                className={styles.clearBtn}
              >
                Xem tất cả sách
              </button>
            </div>
          ) : (
            <div className={styles.bookGrid}>
              {filteredBooks.map((book) => {
                const isAdded = savedBooks.includes(book.id);
                return (
                  <div key={book.id} className={styles.bookCard}>
                    <Link
                      to={`/books/${book.id}`}
                      className={styles.coverWrapper}
                    >
                      <img
                        src={book.cover}
                        alt={book.title}
                        className={styles.coverImg}
                      />
                    </Link>

                    <Link to={`/books/${book.id}`} className={styles.bookTitle}>
                      {book.title}
                    </Link>
                    <div className={styles.bookAuthor}>by {book.author}</div>

                    <div className={styles.ratingRow}>
                      <span className={styles.stars}>★★★★★</span>
                      <span>
                        {book.avg_rating} ({book.reviews_count})
                      </span>
                    </div>

                    <button
                      onClick={() => toggleShelf(book.id)}
                      className={`${styles.shelfBtn} ${isAdded ? styles.shelfBtnAdded : ""}`}
                    >
                      {isAdded ? "✓ Want to Read" : "+ Want to Read"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CỘT PHẢI: Tác giả nổi bật (API GET /api/authors/) */}
        <aside>
          <h2 className={styles.sectionTitle}>Featured Authors</h2>
          <div className={styles.authorList}>
            {MOCK_AUTHORS.map((author) => (
              <Link
                key={author.id}
                to={`/authors/${author.id}`}
                className={styles.authorCard}
              >
                <div className={styles.authorAvatar}>
                  {author.name.charAt(0)}
                </div>
                <div>
                  <div className={styles.authorName}>{author.name}</div>
                  <div className={styles.authorMeta}>
                    {author.booksCount} published books
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className={styles.challengeBox}>
            <h3 className={styles.challengeTitle}>My Personal Shelf</h3>
            <p className={styles.challengeText}>
              Bạn đang có <strong>{savedBooks.length} cuốn sách</strong> trong
              danh sách muốn đọc.
            </p>
            <Link to="/my-books" className={styles.challengeLink}>
              Go to My Books →
            </Link>
          </div>
        </aside>
      </main>

      <footer className={styles.footer}>
        © 2026 E-Library — Hệ thống quản lý đọc sách & đánh giá trực tuyến
      </footer>
    </div>
  );
}
