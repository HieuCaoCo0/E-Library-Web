import { useState } from "react";
import { Link } from "react-router";
import Header from "../../components/Header";
import styles from "./ProfilePage.module.css";
import Footer from "../../components/Footer";

export default function ProfilePage() {
  // Dữ liệu giả lập khớp với GET /api/users/profile/ của Nguyễn Đức Tài
  const [profile, setProfile] = useState({
    name: "Vũ Việt Hoàng",
    email: "hoang.vv@elibrary.edu.vn",
    role: "Frontend Lead & Reviewer",
    joinedDate: "September 2026",
    favoriteGenres: "Programming, Software Architecture, Vietnamese Literature",
    bio: "Sinh viên ngành Công nghệ Thông tin, đam mê phát triển Web với React và xây dựng hệ thống quản lý thư viện trực tuyến E-Library. Thích đọc các đầu sách về Clean Code và văn học Việt Nam.",
    avatarUrl: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [saveMessage, setSaveMessage] = useState("");

  // Xử lý chọn file ảnh đại diện từ máy tính (Preview ảnh ngay lập tức)
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, avatarUrl: previewUrl }));
      setProfile((prev) => ({ ...prev, avatarUrl: previewUrl }));
      setSaveMessage("Đã cập nhật ảnh đại diện mới!");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  // Xử lý lưu thông tin cá nhân (PUT /api/users/profile/)
  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile(formData);
    setIsEditing(false);
    setSaveMessage("Cập nhật hồ sơ cá nhân thành công!");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const recentReviews = [
    {
      id: 1,
      bookId: 1,
      bookTitle: "Clean Code: A Handbook of Agile Software Craftsmanship",
      rating: 5,
      comment:
        "Sách gối đầu giường cho mọi lập trình viên muốn viết code sạch và dễ bảo trì.",
      date: "08/10/2026",
    },
    {
      id: 2,
      bookId: 2,
      bookTitle: "Mắt Biếc",
      rating: 5,
      comment: "Cốt truyện nhẹ nhàng, giàu cảm xúc và đậm chất thơ.",
      date: "22/09/2026",
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        {/* CỘT TRÁI: Thẻ thông tin cá nhân & Ảnh đại diện */}
        <aside>
          <div className={styles.profileCard}>
            <div className={styles.avatarWrapper}>
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {profile.name.charAt(0)}
                </div>
              )}
            </div>

            <label className={styles.uploadLabel}>
              📷 Change Avatar Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className={styles.fileInput}
              />
            </label>

            <h2 className={styles.userName}>{profile.name}</h2>
            <p className={styles.userEmail}>{profile.email}</p>
            <span className={styles.roleBadge}>{profile.role}</span>

            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>5</span>
                <span className={styles.statLabel}>Books</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>2</span>
                <span className={styles.statLabel}>Read</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>2</span>
                <span className={styles.statLabel}>Reviews</span>
              </div>
            </div>

            <div className={styles.metaInfo}>
              <div>
                <strong>Joined:</strong> {profile.joinedDate}
              </div>
              <div>
                <strong>Shelves:</strong>{" "}
                <Link to="/my-books" style={{ color: "#00635d" }}>
                  View My Books →
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* CỘT PHẢI: Chi tiết Bio, Form cập nhật & Đánh giá gần đây */}
        <section>
          <div className={styles.headerRow}>
            <h1 className={styles.pageTitle}>My Profile</h1>
            {!isEditing && (
              <button
                onClick={() => {
                  setFormData(profile);
                  setIsEditing(true);
                }}
                className={styles.editBtn}
              >
                ✎ Edit Profile
              </button>
            )}
          </div>

          {saveMessage && (
            <div className={styles.alertSuccess}>✓ {saveMessage}</div>
          )}

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className={styles.editForm}>
              <div className={styles.field}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Favorite Genres</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.favoriteGenres}
                  onChange={(e) =>
                    setFormData({ ...formData, favoriteGenres: e.target.value })
                  }
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/my-avatar.jpg"
                  className={styles.input}
                  value={formData.avatarUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, avatarUrl: e.target.value })
                  }
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>About Me (Bio)</label>
                <textarea
                  className={styles.textarea}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                />
              </div>

              <div className={styles.btnGroup}>
                <button type="submit" className={styles.saveBtn}>
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className={styles.sectionBlock}>
                <h3 className={styles.blockTitle}>About Me</h3>
                <div className={styles.bioBox}>{profile.bio}</div>
              </div>

              <div className={styles.sectionBlock}>
                <h3 className={styles.blockTitle}>Favorite Genres</h3>
                <div className={styles.bioBox}>{profile.favoriteGenres}</div>
              </div>
            </>
          )}

          {/* Danh sách đánh giá gần đây của User */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.blockTitle}>My Recent Reviews</h3>
            <div className={styles.activityList}>
              {recentReviews.map((rev) => (
                <div key={rev.id} className={styles.activityCard}>
                  <div>
                    <Link
                      to={`/books/${rev.bookId}`}
                      className={styles.activityBook}
                    >
                      {rev.bookTitle}
                    </Link>
                    <p className={styles.activityComment}>{rev.comment}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className={styles.stars}>{"★".repeat(rev.rating)}</div>
                    <div style={{ fontSize: "13px", color: "#706b63" }}>
                      {rev.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
