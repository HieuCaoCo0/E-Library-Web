import { useState } from "react";
import { useParams, Link } from "react-router";
import Header from "../../components/Header";
import styles from "./BookDetailPage.module.css";

const MOCK_BOOKS = {
  1: {
    id: 1,
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    authorId: 2,
    author: "Robert C. Martin",
    genre: "Programming & Tech",
    cover:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80",
    description:
      "Ngay cả một đoạn code tồi cũng có thể chạy được. Nhưng nếu code không sạch, nó có thể làm sụp đổ cả một dự án phát triển phần mềm. Cuốn sách kinh điển giúp lập trình viên rèn luyện tư duy viết code rõ ràng, dễ bảo trì và mở rộng.",
  },
  2: {
    id: 2,
    title: "Mắt Biếc",
    authorId: 1,
    author: "Nguyễn Nhật Ánh",
    genre: "Vietnamese Literature",
    cover:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
    description:
      "Tác phẩm tiêu biểu của nhà văn Nguyễn Nhật Ánh kể về mối tình đơn phương trong trẻo nhưng đầy day dứt của Ngạn dành cho Hà Lan — cô gái có đôi mắt biếc gắn liền với ngôi làng Đo Đo bình yên.",
  },
};

export default function BookDetailPage() {
  const { id } = useParams();
  const book = MOCK_BOOKS[id] || MOCK_BOOKS[1];

  // State kệ sách cá nhân (Module 5 - Nguyễn Ngọc Huy)
  const [shelfStatus, setShelfStatus] = useState("want_to_read");

  // State Đánh giá & Bình luận (Module 6 - Vũ Việt Hoàng)
  const [reviews, setReviews] = useState([
    {
      id: 101,
      user: "Nguyễn Đức Tài",
      rating: 5,
      comment:
        "Sách cực kỳ đáng đọc, trình bày dễ hiểu và nhiều ví dụ thực tế!",
      date: "08/10/2026",
      isOwner: false,
    },
  ]);

  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Tự động tính lại điểm trung bình mỗi khi thêm/sửa/xóa review
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "0.0";

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!myComment.trim()) return;

    // Nếu đang sửa đánh giá của chính mình (PUT /api/user-reviews/{id}/)
    if (editingId) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? { ...r, rating: myRating, comment: myComment }
            : r,
        ),
      );
      setEditingId(null);
      setMyComment("");
      return;
    }

    // Ràng buộc: Mỗi user chỉ được review 1 lần / 1 cuốn sách
    if (reviews.some((r) => r.isOwner)) {
      alert(
        "Bạn đã đánh giá cuốn sách này rồi! Hãy bấm 'Sửa' ở bình luận của bạn.",
      );
      return;
    }

    // Thêm đánh giá mới (POST /api/books/{id}/reviews/)
    const newReview = {
      id: Date.now(),
      user: "Vũ Việt Hoàng (Bạn)",
      rating: myRating,
      comment: myComment,
      date: "Hôm nay",
      isOwner: true,
    };
    setReviews([newReview, ...reviews]);
    setMyComment("");
  };

  const handleEdit = (review) => {
    setEditingId(review.id);
    setMyRating(review.rating);
    setMyComment(review.comment);
  };

  const handleDelete = (reviewId) => {
    // DELETE /api/user-reviews/{id}/
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        {/* CỘT TRÁI: Ảnh bìa & Trạng thái đọc */}
        <aside className={styles.leftCol}>
          <img src={book.cover} alt={book.title} className={styles.coverImg} />

          <select
            value={shelfStatus}
            onChange={(e) => setShelfStatus(e.target.value)}
            className={styles.statusSelect}
          >
            <option value="want_to_read">Want to Read</option>
            <option value="reading">Currently Reading</option>
            <option value="read">Read</option>
          </select>
        </aside>

        {/* CỘT PHẢI: Chi tiết sách & Bình luận */}
        <section>
          <h1 className={styles.bookTitle}>{book.title}</h1>
          <Link to={`/authors/${book.authorId}`} className={styles.authorLink}>
            by {book.author}
          </Link>

          <div className={styles.ratingBar}>
            <span className={styles.stars}>★★★★★</span>
            <span className={styles.avgNumber}>{avgRating}</span>
            <span className={styles.metaCount}>({reviews.length} reviews)</span>
          </div>

          <div className={styles.genreTag}>Genre: {book.genre}</div>
          <p className={styles.description}>{book.description}</p>

          {/* KHU VỰC REVIEW CỦA VŨ VIỆT HOÀNG */}
          <div className={styles.reviewSection}>
            <h2 className={styles.sectionTitle}>Community Reviews</h2>

            <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
              <div className={styles.starPicker}>
                <span>Your rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setMyRating(star)}
                    className={`${styles.starBtn} ${
                      star <= myRating ? styles.starActive : styles.starInactive
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                className={styles.textarea}
                placeholder="What did you think of this book? Write a review..."
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                required
              />

              <button type="submit" className={styles.submitBtn}>
                {editingId ? "Update Review" : "Post Review"}
              </button>
            </form>

            <div className={styles.reviewList}>
              {reviews.map((rev) => (
                <div key={rev.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewerName}>
                      {rev.user} —{" "}
                      <span style={{ color: "#e87400" }}>
                        {"★".repeat(rev.rating)}
                      </span>
                    </span>
                    <span className={styles.reviewDate}>{rev.date}</span>
                  </div>
                  <p className={styles.reviewComment}>{rev.comment}</p>

                  {rev.isOwner && (
                    <div className={styles.actionRow}>
                      <button
                        onClick={() => handleEdit(rev)}
                        className={styles.actionBtn}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rev.id)}
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
