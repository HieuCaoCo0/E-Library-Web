import { useState } from "react";
import { useParams, Link } from "react-router";
import Header from "../../components/Header";
import styles from "./AuthorDetailPage.module.css";

// Dữ liệu giả lập khớp với API GET /api/authors/{id}/ của Đào Duy Khánh
const AUTHORS_DATA = {
  1: {
    id: 1,
    name: "Nguyễn Nhật Ánh",
    born: "07/05/1955 — Quảng Nam, Việt Nam",
    genres: "Vietnamese Literature, Young Adult",
    avgRating: 4.78,
    totalReviews: 1420,
    bio: "Nguyễn Nhật Ánh là một trong những nhà văn hiện đại nổi tiếng và được yêu thích nhất tại Việt Nam. Các tác phẩm của ông chuyên viết về tuổi mới lớn, tình bạn, tình yêu học trò trong sáng gắn liền với ký ức tuổi thơ của nhiều thế hệ độc giả Việt Nam như Mắt Biếc, Tôi Thấy Hoa Vàng Trên Cỏ Xanh, Cho Tôi Xin Một Vé Đi Tuổi Thơ.",
    books: [
      {
        id: 2,
        title: "Mắt Biếc",
        avg_rating: 4.7,
        reviews_count: 518,
        cover:
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
        description:
          "Chuyện tình đơn phương trong trẻo nhưng đầy day dứt của Ngạn dành cho Hà Lan gắn liền với ngôi làng Đo Đo.",
      },
    ],
  },
  2: {
    id: 2,
    name: "Robert C. Martin",
    born: "05/12/1952 — Hoa Kỳ",
    genres: "Programming, Software Engineering",
    avgRating: 4.82,
    totalReviews: 980,
    bio: "Robert Cecil Martin (thường được cộng đồng lập trình viên gọi thân mật là Uncle Bob) là kỹ sư phần mềm, giảng viên và tác giả người Mỹ. Ông là một trong những người đồng sáng lập Tuyên ngôn Agile (Agile Manifesto) và là cha đẻ của nguyên lý thiết kế hướng đối tượng SOLID cùng bộ sách gối đầu giường Clean Code, Clean Architecture.",
    books: [
      {
        id: 1,
        title: "Clean Code: A Handbook of Agile Software Craftsmanship",
        avg_rating: 4.8,
        reviews_count: 342,
        cover:
          "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80",
        description:
          "Cuốn sách kinh điển giúp lập trình viên rèn luyện tư duy viết code rõ ràng, dễ bảo trì và mở rộng.",
      },
    ],
  },
  3: {
    id: 3,
    name: "J.K. Rowling",
    born: "31/07/1965 — Yate, Vương quốc Anh",
    genres: "Fantasy, Fiction, Young Adult",
    avgRating: 4.91,
    totalReviews: 3250,
    bio: "Joanne Rowling (bút danh J.K. Rowling) là nữ tiểu thuyết gia người Anh, tác giả của bộ truyện giả tưởng nổi tiếng toàn cầu Harry Potter. Bộ sách đã bán được hơn 600 triệu bản và được dịch ra hơn 80 ngôn ngữ trên thế giới.",
    books: [
      {
        id: 4,
        title: "Harry Potter and the Sorcerer's Stone",
        avg_rating: 4.9,
        reviews_count: 1240,
        cover:
          "https://images.unsplash.com/photo-1618666012174-83b441c0bc76?auto=format&fit=crop&w=400&q=80",
        description:
          "Hành trình cậu bé phù thủy Harry Potter khám phá thế giới phép thuật kỳ diệu tại trường Hogwarts.",
      },
    ],
  },
  4: {
    id: 4,
    name: "Tô Hoài",
    born: "27/09/1920 — Hà Nội, Việt Nam",
    genres: "Vietnamese Literature, Children's Literature",
    avgRating: 4.88,
    totalReviews: 860,
    bio: "Tô Hoài (tên thật Nguyễn Sen) là một cây đại thụ của nền văn học Việt Nam hiện đại. Với vốn sống phong phú và lối viết hóm hỉnh, sinh động, ông đã để lại hàng trăm tác phẩm giá trị, nổi bật nhất là kiệt tác văn học thiếu nhi Dế Mèn Phiêu Lưu Ký.",
    books: [
      {
        id: 3,
        title: "Dế Mèn Phiêu Lưu Ký",
        avg_rating: 4.9,
        reviews_count: 610,
        cover:
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80",
        description:
          "Những chuyến phiêu lưu kỳ thú và bài học đường đời sâu sắc của chú Dế Mèn.",
      },
    ],
  },
};

export default function AuthorDetailPage() {
  const { id } = useParams();
  const author = AUTHORS_DATA[id] || AUTHORS_DATA[1];

  const [isFollowing, setIsFollowing] = useState(false);
  const [savedBooks, setSavedBooks] = useState([2]);

  const toggleShelf = (bookId) => {
    setSavedBooks((prev) =>
      prev.includes(bookId)
        ? prev.filter((item) => item !== bookId)
        : [...prev, bookId],
    );
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        {/* CỘT TRÁI: Avatar & Thông tin tóm tắt */}
        <aside className={styles.leftCol}>
          <div className={styles.avatarBox}>{author.name.charAt(0)}</div>

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
              <span className={styles.infoLabel}>Born</span>
              <span className={styles.infoValue}>{author.born}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Genres</span>
              <span className={styles.infoValue}>{author.genres}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Published Books</span>
              <span className={styles.infoValue}>
                {author.books.length} books in library
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
              <strong>{author.avgRating}</strong> avg rating
            </span>
            <span>•</span>
            <span>{author.totalReviews} community reviews</span>
          </div>

          <h2 className={styles.bioTitle}>About the Author</h2>
          <p className={styles.bioText}>{author.bio}</p>

          {/* Danh sách sách của tác giả */}
          <div className={styles.booksSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {author.name}&apos;s Books ({author.books.length})
              </h2>
            </div>

            <div className={styles.bookList}>
              {author.books.map((book) => {
                const isAdded = savedBooks.includes(book.id);
                return (
                  <div key={book.id} className={styles.bookItem}>
                    <div className={styles.bookLeft}>
                      <Link to={`/books/${book.id}`}>
                        <img
                          src={book.cover}
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
                            {book.avg_rating} avg rating ({book.reviews_count}{" "}
                            reviews)
                          </span>
                        </div>
                        <p className={styles.bookDesc}>{book.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleShelf(book.id)}
                      className={`${styles.shelfBtn} ${
                        isAdded ? styles.shelfBtnAdded : ""
                      }`}
                    >
                      {isAdded ? "✓ Want to Read" : "+ Want to Read"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        © 2026 E-Library — Hệ thống quản lý đọc sách & đánh giá trực tuyến
      </footer>
    </div>
  );
}
