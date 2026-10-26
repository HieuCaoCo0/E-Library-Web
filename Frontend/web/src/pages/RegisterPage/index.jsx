import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import styles from "./RegisterPage.module.css";
import logo from "../../assets/logo.svg";
import api, { getApiErrorMessage } from "../../plugins/axios";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    // Split name into first_name and last_name
    const nameParts = formData.name.trim().split(" ");
    const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

    try {
      await api.post("/api/auth/register/", {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: firstName,
        last_name: lastName,
      });

      setSuccessMsg("Account registered successfully! Redirecting to sign in...");
      toast.success("Account registered successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Registration failed. Please try again.");
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Link to="/">
        <img src={logo} alt="E Library" />
      </Link>

      <div className={styles.box}>
        <h1 className={styles.title}>Create Account</h1>

        {errorMsg && (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: "16px",
              backgroundColor: "#fdf2f2",
              color: "#c81e1e",
              border: "1px solid #f8b4b4",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: "16px",
              backgroundColor: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Choose a unique username"
              className={styles.input}
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Your name</label>
            <input
              type="text"
              name="name"
              placeholder="First and last name"
              className={styles.input}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              className={styles.input}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="At least 8 characters"
                className={styles.passwordInput}
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={styles.togglePasswordBtn}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <div className={styles.hint}>
              <span className={styles.hintIcon}>i</span>
              <span>Passwords must be at least 8 characters.</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Re-enter password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter your password"
                className={styles.passwordInput}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className={styles.togglePasswordBtn}
                title={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className={styles.terms}>
          By creating an account, you agree to the ELibrary{" "}
          <a href="#terms" className={styles.link}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#privacy" className={styles.link}>
            Privacy Policy
          </a>
          .
        </p>

        <div className={styles.switchRow}>
          Already have an account?{" "}
          <Link to="/login" className={styles.link}>
            Sign in
          </Link>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <a href="#terms">Terms of Service</a>
          <a href="#privacy">Privacy</a>
          <a href="#help">Help</a>
        </div>
        <div>© 2026 ELibrary LLC</div>
      </footer>
    </div>
  );
}
