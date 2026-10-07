import { useState } from "react";
import { Link } from "react-router";
import styles from "./RegisterPage.module.css";
import logo from "../../assets/logo.svg";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }
    console.log("Đăng ký tài khoản:", formData);
  };

  return (
    <div className={styles.wrapper}>
      <Link to="/" className={styles.logo}>
        <img src={logo} alt="E Library" />
      </Link>

      <div className={styles.box}>
        <h1 className={styles.title}>Create Account</h1>

        <form onSubmit={handleSubmit}>
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
            <input
              type="password"
              name="password"
              placeholder="At least 6 characters"
              className={styles.input}
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              required
            />
            <div className={styles.hint}>
              <span className={styles.hintIcon}>i</span>
              <span>Passwords must be at least 6 characters.</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Re-enter password</label>
            <input
              type="password"
              name="confirmPassword"
              className={styles.input}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className={styles.btnPrimary}>
            Create account
          </button>
        </form>

        <p className={styles.terms}>
          By creating an account, you agree to the Goodreads{" "}
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
        <div>© 2026 Goodreads LLC</div>
      </footer>
    </div>
  );
}
