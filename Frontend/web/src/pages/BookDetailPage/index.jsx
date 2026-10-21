import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import Header from "../../components/Header";
import styles from "./BookDetailPage.module.css";
import Footer from "../../components/Footer";
import api, { getApiErrorMessage } from "../../plugins/axios";

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [isLoadingBook, setIsLoadingBook] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  // Kệ sách cá nhân (WANT_TO_READ, READING, READ)
  const [shelfStatus, setShelfStatus] = useState("want_to_read");
  const [libraryRecordId, setLibraryRecordId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Form review
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {
        // ignore
      }
    }
  }, []);

  // 1. Lấy chi tiết sách từ API GET /api/books/{id}/
  useEffect(() => {
    setIsLoadingBook(true);
    api
      .get(`/api/books/${id}/`)
      .then((res) => {
        setBook(res.data);
      })
      .catch((err) => {
        console.error("Lỗi tải chi tiết sách:", err);
      })
      .finally(() => {
        setIsLoadingBook(false);
      });
  }, [id]);

  // 2. Lấy danh sách reviews từ API GET /api/books/{id}/reviews/
  const loadReviews = () => {
    setIsLoadingReviews(true);
    api
      .get(`/api/books/${id}/reviews/`)
      .then((res) => {
        setReviews(res.data || []);
      })
      .catch((err) => {
        console.error("Lỗi tải đánh giá:", err);
        setReviews([]);
      })
      .finally(() => {
        setIsLoadingReviews(false);
      });
  };

  useEffect(() => {
    loadReviews();
  }, [id]);

  // 3. Kiểm tra trạng thái kệ sách hiện tại của user cho cuốn sách này
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    api
      .get("/api/user-library/")
      .then((res) => {
        const items = res.data || [];
        const record = items.find((item) => String(item.book) === String(id));
        if (record) {
          setShelfStatus(record.status.toLowerCase());
          setLibraryRecordId(record.id);
        }
      })
      .catch(() => {});
  }, [id]);

  // Xử lý thay đổi trạng thái đọc
  const handleShelfChange = async (newStatus) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.info("Vui lòng đăng nhập để lưu trạng thái đọc.");
      navigate("/login");
      return;
    }

    try {
      const res = await api.post("/api/user-library/", {
        book: Number(id),
        status: newStatus.toUpperCase(),
      });
      setShelfStatus(newStatus);
      setLibraryRecordId(res.data.id);
      toast.success("Đã cập nhật trạng thái tủ sách!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể cập nhật trạng thái đọc."));
    }
  };

  const handleRemoveFromShelf = async () => {
    if (!libraryRecordId) return;
    try {
      await api.delete(`/api/user-library/${libraryRecordId}/`);
      setLibraryRecordId(null);
      setShelfStatus("want_to_read");
      toast.info("Đã xóa sách khỏi kệ cá nhân!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xóa sách khỏi kệ."));
    }
  };

  const SHELF_OPTIONS = [
    { value: "want_to_read", label: "Want to Read" },
    { value: "reading", label: "Currently Reading" },
    { value: "read", label: "Read" },
  ];

  const currentShelfLabel =
    SHELF_OPTIONS.find((o) => o.value === shelfStatus)?.label || "Want to Read";

  // Tính rating hiển thị
  const avgRating =
    book?.avg_rating ||
    (reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : book?.rating
        ? Number(book.rating).toFixed(1)
        : "0.0");

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!myComment.trim()) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.info("Vui lòng đăng nhập để viết đánh giá.");
      navigate("/login");
      return;
    }

    setIsSubmittingReview(true);

    try {
      if (editingId) {
        // Cập nhật review: PUT /api/user-reviews/{id}/
        await api.put(`/api/user-reviews/${editingId}/`, {
          rating: myRating,
          comment: myComment.trim(),
        });
        setEditingId(null);
        setMyComment("");
        toast.success("Cập nhật đánh giá thành công!");
      } else {
        // Tạo review mới: POST /api/books/{id}/reviews/
        await api.post(`/api/books/${id}/reviews/`, {
          rating: myRating,
          comment: myComment.trim(),
        });
        setMyComment("");
        toast.success("Đăng đánh giá thành công!");
      }
      loadReviews();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể gửi đánh giá. Vui lòng thử lại."));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleEdit = (rev) => {
    setEditingId(rev.id);
    setMyRating(rev.rating);
    setMyComment(rev.comment);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleDelete = async (reviewId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài đánh giá này?")) return;

    try {
      await api.delete(`/api/user-reviews/${reviewId}/`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.info("Đã xóa bài đánh giá.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể xóa bài đánh giá."));
    }
  };

  if (isLoadingBook) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#666" }}>
          Đang tải thông tin cuốn sách...
        </div>
        <Footer />
      </div>
    );
  }

  if (!book) {
    return (
      <div className={styles.pageWrapper}>
        <Header />
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <h2>Không tìm thấy cuốn sách này!</h2>
          <Link to="/" style={{ color: "#382110", textDecoration: "underline" }}>
            Quay lại trang chủ
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const genreName =
    Array.isArray(book.genres) && book.genres.length > 0
      ? book.genres.join(", ")
      : "General";

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        {/* CỘT TRÁI: Ảnh bìa & Trạng thái đọc */}
        <aside className={styles.leftCol}>
          <img
            src={book.cover_image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80"}
            alt={book.title}
            className={styles.coverImg}
          />

          {/* Custom Dropdown Kệ Sách */}
          <div className={styles.dropdownWrapper} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={styles.dropdownTrigger}
            >
              <span>{currentShelfLabel}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                {SHELF_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      handleShelfChange(opt.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`${styles.dropdownItem} ${
                      shelfStatus === opt.value ? styles.dropdownItemActive : ""
                    }`}
                  >
                    <span>{opt.label}</span>
                    {shelfStatus === opt.value && (
                      <span style={{ color: "#2b7752", fontWeight: "bold" }}>✓</span>
                    )}
                  </button>
                ))}

                {libraryRecordId && (
                  <>
                    <div className={styles.dropdownDivider} />
                    <button
                      type="button"
                      onClick={() => {
                        handleRemoveFromShelf();
                        setIsDropdownOpen(false);
                      }}
                      className={styles.dropdownRemoveBtn}
                    >
                      <span>Remove from shelf</span>
                      <span>✕</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* CỘT PHẢI: Chi tiết sách & Bình luận */}
        <section>
          <h1 className={styles.bookTitle}>{book.title}</h1>
          <div style={{ marginBottom: "12px" }}>
            by{" "}
            {book.author_id ? (
              <Link to={`/authors/${book.author_id}`} className={styles.authorLink}>
                {book.author}
              </Link>
            ) : (
              <span className={styles.authorLink}>{book.author}</span>
            )}
          </div>

          <div className={styles.ratingBar}>
            <span className={styles.stars}>★★★★★</span>
            <span className={styles.avgNumber}>{avgRating}</span>
            <span className={styles.metaCount}>
              ({reviews.length} reviews • {book.pages || "N/A"} pages)
            </span>
          </div>

          <div className={styles.genreTag}>Genres: {genreName}</div>
          <p className={styles.description}>
            {book.description || "Chưa có thông tin mô tả chi tiết cho cuốn sách này."}
          </p>

          {/* KHU VỰC REVIEW */}
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

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview
                    ? "Submitting..."
                    : editingId
                      ? "Update Review"
                      : "Post Review"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setMyComment("");
                    }}
                    style={{
                      padding: "8px 14px",
                      background: "#f4f1ea",
                      border: "1px solid #d8d4c8",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            <div className={styles.reviewList}>
              {isLoadingReviews ? (
                <div style={{ color: "#666", padding: "16px 0" }}>Đang tải đánh giá...</div>
              ) : reviews.length === 0 ? (
                <div style={{ color: "#666", padding: "16px 0" }}>
                  Chưa có bài đánh giá nào cho cuốn sách này. Hãy là người đầu tiên chia sẻ cảm nhận!
                </div>
              ) : (
                reviews.map((rev) => {
                  const isOwner =
                    currentUser &&
                    (rev.user === currentUser.id ||
                      rev.username === currentUser.username);

                  return (
                    <div key={rev.id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <span className={styles.reviewerName}>
                          {rev.username || rev.user?.username || "Độc giả"} —{" "}
                          <span style={{ color: "#e87400" }}>
                            {"★".repeat(rev.rating)}
                          </span>
                        </span>
                        <span className={styles.reviewDate}>
                          {rev.created_at
                            ? new Date(rev.created_at).toLocaleDateString("vi-VN")
                            : "Gần đây"}
                        </span>
                      </div>
                      <p className={styles.reviewComment}>{rev.comment}</p>

                      {isOwner && (
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
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
