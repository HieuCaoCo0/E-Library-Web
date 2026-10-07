import { useState } from "react";
import { Link } from "react-router";
import styles from "./LoginPage.module.css";
import logo from "../../assets/logo.svg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Đăng nhập với:", { email, password, keepSignedIn });
  };

  return (
    <div className={styles.wrapper}>
      <Link to="/" className={styles.logo}>
        <img src={logo} alt="E Library" />
      </Link>

      <div className={styles.box}>
        <h1 className={styles.title}>Sign in</h1>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Password</label>
              <a href="#forgot" className={styles.link}>
                Password assistance
              </a>
            </div>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.btnPrimary}>
            Sign in
          </button>
        </form>

        <p className={styles.terms}>
          By signing in, you agree to the Goodreads{" "}
          <a href="#terms" className={styles.link}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#privacy" className={styles.link}>
            Privacy Policy
          </a>
          .
        </p>

        <div className={styles.checkboxRow}>
          <input
            type="checkbox"
            id="keepSignedIn"
            checked={keepSignedIn}
            onChange={(e) => setKeepSignedIn(e.target.checked)}
          />
          <label htmlFor="keepSignedIn">Keep me signed in.</label>
          <a href="#details" className={styles.link}>
            Details
          </a>
        </div>

        <div className={styles.divider}>
          <span>New to Goodreads?</span>
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
        <div>© 2026 Goodreads LLC</div>
      </footer>
    </div>
  );
}
