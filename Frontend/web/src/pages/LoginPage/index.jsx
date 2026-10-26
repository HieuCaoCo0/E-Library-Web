import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import styles from "./LoginPage.module.css";
import logo from "../../assets/logo.svg";
import api, { getApiErrorMessage } from "../../plugins/axios";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await api.post("/api/auth/login/", {
        username: username.trim(),
        password: password,
      });

      // Lưu JWT Token và User Profile
      if (res.data.access) {
        localStorage.setItem("access_token", res.data.access);
      }
      if (res.data.refresh) {
        localStorage.setItem("refresh_token", res.data.refresh);
      }
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      toast.success("Signed in successfully!");
      navigate("/");
    } catch (err) {
      const msg = getApiErrorMessage(err, "Incorrect username or password.");
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
        <h1 className={styles.title}>Sign in</h1>

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

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Password</label>
              <a href="#forgot" className={styles.link}>
                Password assistance
              </a>
            </div>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                className={styles.passwordInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          </div>

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className={styles.terms}>
          By signing in, you agree to the ELibrary{" "}
          <a href="#terms" className={styles.link}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#privacy" className={styles.link}>
            Privacy Policy
          </a>
          .
        </p>

        <div className={styles.divider}>
          <span>New to ELibrary?</span>
        </div>

        <Link to="/register" className={styles.btnSecondary}>
          Sign up
        </Link>
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
