import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import Header from "../../components/Header";
import styles from "./BookDetailPage.module.css";
import Footer from "../../components/Footer";
import ConfirmModal from "../../components/ConfirmModal";
import avatarDefault from "../../assets/avatar.png";
import api, { getApiErrorMessage } from "../../plugins/axios";

// Định dạng ngày xuất bản dạng dd/mm/yyyy hoặc tên tháng
const formatPublishDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const parts = String(dateStr).split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// Chuẩn hóa đường dẫn avatar từ API (xử lý cả URL tuyệt đối lẫn tương đối)
const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }
  const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  return `${baseUrl}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
};

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Dữ liệu chi tiết cuốn sách từ API GET /api/books/{id}/
  const [book, setBook] = useState(null);
  const [isLoadingBook, setIsLoadingBook] = useState(true);

  // Danh sách đánh giá của bạn đọc từ API GET /api/books/{id}/reviews/
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  // Quản lý trạng thái kệ sách cá nhân của người dùng (want_to_read, reading, read)
  const [shelfStatus, setShelfStatus] = useState("want_to_read");
  const [libraryRecordId, setLibraryRecordId] = useState(null); // ID bản ghi kệ sách để xóa nếu cần
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown chọn trạng thái kệ sách khi bấm chuột ra ngoài menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trạng thái cho form gửi/sửa bài đánh giá (Review)
  const [myRating, setMyRating] = useState(5); // Số sao đánh giá (1 - 5)
  const [myComment, setMyComment] = useState(""); // Nội dung bình luận
  const [editingId, setEditingId] = useState(null); // ID của review đang chỉnh sửa (nếu có)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Thông tin tài khoản người dùng đang đăng nhập
  const [reviewToDelete, setReviewToDelete] = useState(null); // ID review được chọn để chuẩn bị xác nhận xóa
  const [isDeletingReview, setIsDeletingReview] = useState(false);

  // Nạp thông tin người dùng hiện tại từ localStorage hoặc gọi API GET /api/users/profile/
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {
        // bỏ qua nếu dữ liệu lưu bị hỏng
      }
    } else {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("refresh_token");
      if (token) {
        api
          .get("/api/users/profile/")
          .then((res) => {
            setCurrentUser(res.data);
            localStorage.setItem("user", JSON.stringify(res.data));
          })
          .catch(() => {});
      }
    }
  }, []);

  // 1. Nạp dữ liệu chi tiết sách từ API GET /api/books/{id}/
  useEffect(() => {
    setIsLoadingBook(true);
    api
      .get(`/api/books/${id}/`)
      .then((res) => {
        setBook(res.data);
      })
      .catch((err) => {
        console.error("Lỗi khi tải chi tiết sách:", err);
      })
      .finally(() => {
        setIsLoadingBook(false);
      });
  }, [id]);

  // 2. Nạp danh sách các bài đánh giá cho cuốn sách từ API GET /api/books/{id}/reviews/
  const loadReviews = () => {
    setIsLoadingReviews(true);
    api
      .get(`/api/books/${id}/reviews/`)
      .then((res) => {
        setReviews(res.data || []);
      })
      .catch((err) => {
        console.error("Lỗi khi tải danh sách đánh giá:", err);
        setReviews([]);
      })
      .finally(() => {
        setIsLoadingReviews(false);
      });
  };

  useEffect(() => {
    loadReviews();
  }, [id]);

  // Tìm bài đánh giá đã tồn tại của người dùng hiện tại đối với cuốn sách này
  const myExistingReview = reviews.find(
    (rev) =>
      currentUser &&
      (rev.user === currentUser.id || rev.username === currentUser.username)
  );

  // Tự động điền dữ liệu review cũ vào form để chuyển sang chế độ cập nhật (Update Review)
  useEffect(() => {
    if (!currentUser || isLoadingReviews) return;

    if (myExistingReview) {
      setEditingId(myExistingReview.id);
      setMyRating(myExistingReview.rating);
      setMyComment(myExistingReview.comment);
    } else {
      setEditingId(null);
      setMyRating(5);
      setMyComment("");
    }
  }, [currentUser?.id, currentUser?.username, myExistingReview?.id, isLoadingReviews]);

  // 3. Kiểm tra xem cuốn sách này đã có trong kệ cá nhân của người dùng chưa (GET /api/user-library/)
  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");
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

  // Xử lý thay đổi hoặc thêm trạng thái đọc vào kệ sách (POST /api/user-library/)
  const handleShelfChange = async (newStatus) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");
    if (!token) {
      toast.info("Please sign in to update your reading shelf.");
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
      toast.success("Reading shelf updated!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to update reading shelf."));
    }
  };

  // Xử lý xóa sách hoàn toàn khỏi kệ sách cá nhân (DELETE /api/user-library/{id}/)
  const handleRemoveFromShelf = async () => {
    if (!libraryRecordId) return;
    try {
      await api.delete(`/api/user-library/${libraryRecordId}/`);
      setLibraryRecordId(null);
      setShelfStatus("want_to_read");
      toast.info("Removed book from shelf!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to remove book from shelf."));
    }
  };

  // Danh mục các lựa chọn kệ đọc sách
  const SHELF_OPTIONS = [
    { value: "want_to_read", label: "Want to Read" },
    { value: "reading", label: "Currently Reading" },
    { value: "read", label: "Read" },
  ];

  const currentShelfLabel =
    SHELF_OPTIONS.find((o) => o.value === shelfStatus)?.label || "Want to Read";

  // Tính điểm đánh giá trung bình hiển thị (ưu tiên avg_rating -> trung bình reviews -> rating gốc -> 0.0)
  const avgRating =
    book?.avg_rating ||
    (reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : book?.rating
        ? Number(book.rating).toFixed(1)
        : "0.0");

  // Xử lý gửi biểu mẫu đánh giá: nếu đã có review thì cập nhật (PUT), nếu chưa thì tạo mới (POST)
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!myComment.trim()) return;

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");
    if (!token) {
      toast.info("Please sign in to write a review.");
      navigate("/login");
      return;
    }

    setIsSubmittingReview(true);

    try {
      if (editingId) {
        // Cập nhật bài đánh giá hiện có: PUT /api/user-reviews/{id}/
        await api.put(`/api/user-reviews/${editingId}/`, {
          rating: myRating,
          comment: myComment.trim(),
        });
        toast.success("Review updated successfully!");
      } else {
        // Tạo bài đánh giá mới: POST /api/books/{id}/reviews/
        await api.post(`/api/books/${id}/reviews/`, {
          rating: myRating,
          comment: myComment.trim(),
        });
        toast.success("Review posted successfully!");
      }
      loadReviews();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to submit review. Please try again."));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Điền bài review của người dùng vào form và cuộn mượt xuống vị trí form
  const handleEdit = (rev) => {
    setEditingId(rev.id);
    setMyRating(rev.rating);
    setMyComment(rev.comment);
    const formSection = document.getElementById("review-form-section");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  };

  // Xác nhận xóa bài đánh giá qua popup ConfirmModal (DELETE /api/user-reviews/{id}/)
  const handleConfirmDeleteReview = async () => {
    if (!reviewToDelete) return;

    setIsDeletingReview(true);
    try {
      await api.delete(`/api/user-reviews/${reviewToDelete}/`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete));
      if (editingId === reviewToDelete) {
        setEditingId(null);
        setMyRating(5);
        setMyComment("");
      }
      toast.info("Review deleted.");
      setReviewToDelete(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to delete review."));
    } finally {
      setIsDeletingReview(false);
    }
  };

  if (isLoadingBook) {
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
          Loading book details...
        </div>
        <Footer />
      </div>
    );
  }

  if (!book) {
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
          <h2>Book not found!</h2>
          <Link to="/" style={{ color: "#382110", textDecoration: "underline" }}>
            Back to Home
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
        {/* LEFT COLUMN: Cover Image & Shelf Status */}
        <aside className={styles.leftCol}>
          <img
            src={book.cover_image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80"}
            alt={book.title}
            className={styles.coverImg}
          />

          {/* Custom Bookshelf Dropdown */}
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

        {/* RIGHT COLUMN: Book Details & Reviews */}
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
              ({book.review_count ?? reviews.length} reviews • {book.pages ? `${book.pages} pages` : "N/A"})
            </span>
          </div>

          <div className={styles.metaRow}>
            <div className={styles.genreTag}>Genres: {genreName}</div>
            {book.publish_date && (
              <span className={styles.metaInfoBadge}>
                📅 Published: {formatPublishDate(book.publish_date)}
              </span>
            )}
            {book.source_url && (
              <a
                href={book.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceLinkBadge}
                title="View original work on Goodreads/Internet"
              >
                🔗 Original Source ↗
              </a>
            )}
          </div>

          <p className={styles.description}>
            {book.description || "No detailed description available for this book."}
          </p>

          {/* COMMUNITY REVIEWS */}
          <div className={styles.reviewSection} id="review-form-section">
            <h2 className={styles.sectionTitle}>Community Reviews</h2>

            {myExistingReview && (
              <div className={styles.existingReviewNotice}>
                <span className={styles.noticeIcon}>ℹ️</span>
                <span>
                  You have already reviewed this book. Modifying your rating or comment below will update your review.
                </span>
              </div>
            )}

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

              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
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
                {myExistingReview ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMyRating(myExistingReview.rating);
                        setMyComment(myExistingReview.comment);
                        toast.info("Reset to your saved review.");
                      }}
                      className={styles.resetBtn}
                      title="Reset changes back to your saved review"
                    >
                      Reset Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewToDelete(myExistingReview.id)}
                      className={styles.deleteReviewBtn}
                      title="Delete your review"
                    >
                      Delete Review
                    </button>
                  </>
                ) : (
                  editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setMyComment("");
                        setMyRating(5);
                      }}
                      className={styles.resetBtn}
                    >
                      Cancel Edit
                    </button>
                  )
                )}
              </div>
            </form>

            <div className={styles.reviewList}>
              {isLoadingReviews ? (
                <div style={{ color: "#666", padding: "16px 0" }}>Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div style={{ color: "#666", padding: "16px 0" }}>
                  No reviews for this book yet. Be the first to share your thoughts!
                </div>
              ) : (
                reviews.map((rev) => {
                  const isOwner =
                    currentUser &&
                    (rev.user === currentUser.id ||
                      rev.username === currentUser.username);
                  const avatarUrl = getAvatarUrl(rev.avatar);
                  const firstLetter = (rev.username || rev.user?.username || "U")
                    .charAt(0)
                    .toUpperCase();

                  return (
                    <div key={rev.id} className={styles.reviewCard}>
                      <div className={styles.reviewerAvatarCol}>
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={rev.username || "Reviewer"}
                            className={styles.reviewerAvatar}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = avatarDefault;
                            }}
                          />
                        ) : (
                          <div className={styles.reviewerAvatarFallback}>
                            {firstLetter}
                          </div>
                        )}
                      </div>

                      <div className={styles.reviewBody}>
                        <div className={styles.reviewHeader}>
                          <div className={styles.reviewerInfo}>
                            <span className={styles.reviewerName}>
                              {rev.username || rev.user?.username || "Reader"}
                            </span>
                            <span className={styles.reviewStars}>
                              {"★".repeat(rev.rating)}
                            </span>
                          </div>
                          <span className={styles.reviewDate}>
                            {rev.created_at
                              ? new Date(rev.created_at).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "Recently"}
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
                              onClick={() => setReviewToDelete(rev.id)}
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>

      <ConfirmModal
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleConfirmDeleteReview}
        title="Delete Review"
        message="Are you sure you want to delete your review for this book? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeletingReview}
      />

      <Footer />
    </div>
  );
}
