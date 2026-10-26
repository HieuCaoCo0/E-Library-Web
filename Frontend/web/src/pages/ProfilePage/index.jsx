import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import Header from "../../components/Header";
import styles from "./ProfilePage.module.css";
import Footer from "../../components/Footer";
import api, { getApiErrorMessage } from "../../plugins/axios";

export default function ProfilePage() {
  const navigate = useNavigate();

  // Dữ liệu hồ sơ người dùng từ API GET /api/users/profile/
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Trạng thái bật/tắt chế độ biểu mẫu chỉnh sửa thông tin
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    bio: "",
  });

  // Thông báo phản hồi sau khi lưu thông tin
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Nạp dữ liệu hồ sơ cá nhân của người dùng hiện tại (GET /api/users/profile/)
  const loadProfile = () => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    api
      .get("/api/users/profile/")
      .then((res) => {
        setProfile(res.data);
        setFormData({
          first_name: res.data.first_name || "",
          last_name: res.data.last_name || "",
          email: res.data.email || "",
          bio: res.data.bio || "",
        });
      })
      .catch((err) => {
        console.error("Lỗi khi tải thông tin hồ sơ:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Nạp hồ sơ khi render và đăng ký lắng nghe sự kiện token refresh
  useEffect(() => {
    loadProfile();
    window.addEventListener("auth_token_refreshed", loadProfile);
    return () => {
      window.removeEventListener("auth_token_refreshed", loadProfile);
    };
  }, []);

  // 2. Xử lý tải ảnh đại diện avatar (gửi file multipart/form-data qua PATCH /api/users/profile/)
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("avatar", file);

    try {
      const res = await api.patch("/api/users/profile/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(res.data);
      setSaveMessage("Profile picture updated successfully!");
      toast.success("Profile picture updated successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Unable to upload profile photo.");
      setErrorMessage(msg);
      toast.error(msg);
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  // 3. Xử lý lưu thông tin hồ sơ cá nhân: họ tên, email, bio (PATCH /api/users/profile/)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveMessage("");
    setErrorMessage("");

    try {
      const res = await api.patch("/api/users/profile/", formData);
      setProfile(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      setIsEditing(false);
      setSaveMessage("Profile updated successfully!");
      toast.success("Profile updated successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Unable to update profile.");
      setErrorMessage(msg);
      toast.error(msg);
      setTimeout(() => setErrorMessage(""), 4000);
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
          <h2>You are not signed in</h2>
          <p style={{ color: "#666", margin: "16px 0 24px" }}>
            Please sign in to view and manage your profile.
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
            Sign in
          </button>
        </div>
        <Footer />
      </div>
    );
  }

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
          Loading profile information...
        </div>
        <Footer />
      </div>
    );
  }

  const fullName =
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
    profile?.username ||
    "Member";

  const isAdmin = Boolean(
    profile?.is_staff ||
      profile?.is_superuser ||
      profile?.username === "admin"
  );

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        {/* LEFT COLUMN: Profile Card & Avatar */}
        <aside>
          <div className={styles.profileCard}>
            <div className={styles.avatarWrapper}>
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={fullName}
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {fullName.charAt(0).toUpperCase()}
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

            <h2 className={styles.userName}>{fullName}</h2>
            <p className={styles.userEmail}>@{profile?.username}</p>
            <p className={styles.userEmail}>{profile?.email}</p>
            <span
              className={`${styles.roleBadge} ${
                isAdmin ? styles.adminRoleBadge : ""
              }`}
            >
              {isAdmin ? "Administrator / Staff" : "E-Library Reader"}
            </span>

            <div className={styles.metaInfo}>
              <div>
                <strong>Joined:</strong>{" "}
                {profile?.date_joined
                  ? new Date(profile.date_joined).toLocaleDateString("en-US")
                  : "Recently"}
              </div>
              <div style={{ marginTop: "12px" }}>
                <Link to="/my-books" style={{ color: "#00635d" }}>
                  View My Books →
                </Link>
              </div>
              {isAdmin && (
                <div style={{ marginTop: "8px" }}>
                  <Link
                    to="/admin"
                    style={{
                      color: "#276749",
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    Admin Dashboard →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: Bio Details & Edit Form */}
        <section>
          <div className={styles.headerRow}>
            <h1 className={styles.pageTitle}>My Profile</h1>
            {!isEditing && (
              <button
                onClick={() => {
                  setFormData({
                    first_name: profile?.first_name || "",
                    last_name: profile?.last_name || "",
                    email: profile?.email || "",
                    bio: profile?.bio || "",
                  });
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

          {errorMessage && (
            <div style={{ padding: "10px 14px", backgroundColor: "#fdf2f2", color: "#c81e1e", borderRadius: "6px", marginBottom: "16px" }}>
              ✕ {errorMessage}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className={styles.editForm}>
              <div className={styles.field}>
                <label className={styles.label}>First Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Last Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  className={styles.input}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>About Me (Bio)</label>
                <textarea
                  className={styles.textarea}
                  value={formData.bio}
                  placeholder="Share a little bit about your reading interests..."
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                />
              </div>

              <div className={styles.btnRow}>
                <button type="submit" className={styles.saveBtn}>
                  Save Profile
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
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", color: "#382110", marginBottom: "8px" }}>Bio</h3>
                <p style={{ color: "#555", lineHeight: "1.6" }}>
                  {profile?.bio || "You have not added a bio yet. Click 'Edit Profile' to introduce yourself!"}
                </p>
              </div>

              <div style={{ padding: "16px", background: "#f9f7f2", borderRadius: "8px", border: "1px solid #e8e3d8" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#382110" }}>Account Details</h4>
                <div style={{ fontSize: "14px", color: "#666", lineHeight: "1.8" }}>
                  <div><strong>Username:</strong> {profile?.username}</div>
                  <div><strong>Email:</strong> {profile?.email}</div>
                  <div><strong>User ID:</strong> #{profile?.id}</div>
                  <div><strong>Role:</strong> {isAdmin ? "Administrator / Staff" : "Reader"}</div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
