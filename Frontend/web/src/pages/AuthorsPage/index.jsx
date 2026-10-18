import { useState } from "react";
import { Link } from "react-router";
import Header from "../../components/Header";
import styles from "./AuthorsPage.module.css";
import Footer from "../../components/Footer";

// Dữ liệu giả lập 8 tác giả để test Tìm kiếm và Phân trang (GET /api/authors/?search=&page=)
const ALL_AUTHORS = [
  {
    id: 1,
    name: "Nguyễn Nhật Ánh",
    genres: "Vietnamese Literature, Young Adult",
    booksCount: 45,
    avgRating: 4.8,
    bio: "Nhà văn hiện đại được yêu thích nhất tại Việt Nam với các tác phẩm viết về tuổi học trò như Mắt Biếc, Tôi Thấy Hoa Vàng Trên Cỏ Xanh.",
  },
  {
    id: 2,
    name: "Robert C. Martin",
    genres: "Programming, Software Engineering",
    booksCount: 12,
    avgRating: 4.8,
    bio: "Kỹ sư phần mềm người Mỹ (Uncle Bob), đồng sáng lập Tuyên ngôn Agile và là tác giả bộ sách kinh điển Clean Code, Clean Architecture.",
  },
  {
    id: 3,
    name: "J.K. Rowling",
    genres: "Fantasy, Fiction",
    booksCount: 18,
    avgRating: 4.9,
    bio: "Nữ tiểu thuyết gia người Anh, tác giả của bộ truyện giả tưởng nổi tiếng toàn cầu Harry Potter với hơn 600 triệu bản in.",
  },
  {
    id: 4,
    name: "Tô Hoài",
    genres: "Vietnamese Literature, Children",
    booksCount: 32,
    avgRating: 4.9,
    bio: "Cây đại thụ của nền văn học Việt Nam hiện đại, nổi tiếng với kiệt tác văn học thiếu nhi Dế Mèn Phiêu Lưu Ký.",
  },
  {
    id: 5,
    name: "James Clear",
    genres: "Self Help, Psychology",
    booksCount: 5,
    avgRating: 4.8,
    bio: "Tác giả và diễn giả người Mỹ chuyên nghiên cứu về thói quen, ra quyết định và cải thiện bản thân với cuốn sách Atomic Habits.",
  },
  {
    id: 6,
    name: "Andrew Hunt",
    genres: "Programming, Technology",
    booksCount: 9,
    avgRating: 4.7,
    bio: "Đồng tác giả cuốn sách The Pragmatic Programmer và là một trong 17 người sáng lập Tuyên ngôn phát triển phần mềm Agile.",
  },
  {
    id: 7,
    name: "Haruki Murakami",
    genres: "Contemporary Fiction, Magical Realism",
    booksCount: 28,
    avgRating: 4.6,
    bio: "Nhà văn đương đại nổi tiếng người Nhật Bản với phong cách hiện thực huyền ảo qua Rừng Na Uy, Kafka Bên Bờ Biển.",
  },
  {
    id: 8,
    name: "Nam Cao",
    genres: "Vietnamese Classic Literature",
    booksCount: 24,
    avgRating: 4.9,
    bio: "Nhà văn hiện thực xuất sắc của văn học Việt Nam trước 1945 với các tác phẩm Chí Phèo, Lão Hạc, Đời Thừa.",
  },
];

const ITEMS_PER_PAGE = 6; // Hiển thị 6 tác giả mỗi trang để thấy rõ nút Phân trang

export default function AuthorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Lọc theo tên tác giả (Mô phỏng ?search=...)
  const filteredAuthors = ALL_AUTHORS.filter(
    (author) =>
      author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      author.genres.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // 2. Tính toán Phân trang (Mô phỏng ?page=...)
  const totalPages = Math.ceil(filteredAuthors.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAuthors = filteredAuthors.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Quay về trang 1 khi gõ tìm kiếm mới
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        {/* Tiêu đề & Ô tìm kiếm tên tác giả */}
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Authors Directory</h1>
            <p className={styles.pageSubtitle}>
              Khám phá {filteredAuthors.length} tác giả và các đầu sách tiêu
              biểu trong thư viện
            </p>
          </div>

          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search authors by name..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Danh sách tác giả */}
        {paginatedAuthors.length === 0 ? (
          <div className={styles.emptyState}>
            Không tìm thấy tác giả nào có tên khớp với &ldquo;{searchTerm}
            &rdquo;.
          </div>
        ) : (
          <>
            <div className={styles.authorGrid}>
              {paginatedAuthors.map((author) => (
                <div key={author.id} className={styles.authorCard}>
                  <div>
                    <div className={styles.cardTop}>
                      <Link
                        to={`/authors/${author.id}`}
                        className={styles.avatar}
                      >
                        {author.name.charAt(0)}
                      </Link>
                      <div>
                        <Link
                          to={`/authors/${author.id}`}
                          className={styles.authorName}
                        >
                          {author.name}
                        </Link>
                        <div className={styles.authorGenre}>
                          {author.genres}
                        </div>
                      </div>
                    </div>

                    <p className={styles.authorBio}>{author.bio}</p>
                  </div>

                  <div className={styles.cardFooter}>
                    <span>
                      📚 <strong>{author.booksCount}</strong> books • ★{" "}
                      <strong>{author.avgRating}</strong>
                    </span>
                    <Link
                      to={`/authors/${author.id}`}
                      className={styles.viewLink}
                    >
                      View profile →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Thanh Phân trang (Pagination) */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={styles.pageBtn}
                >
                  ← Prev
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`${styles.pageBtn} ${
                        currentPage === page ? styles.pageBtnActive : ""
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={styles.pageBtn}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
