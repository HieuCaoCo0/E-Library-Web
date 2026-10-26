import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { toast } from "react-toastify";
import Header from "../../components/Header";
import styles from "./AuthorDetailPage.module.css";
import Footer from "../../components/Footer";
import api, { getApiErrorMessage } from "../../plugins/axios";

export default function AuthorDetailPage() {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedBooks, setSavedBooks] = useState([]);

  // Lấy chi tiết tác giả từ API GET /api/authors/{id}/
  useEffect(() => {
    setIsLoading(true);
    api
      .get(`/api/authors/${id}/`)
      .then((res) => {
        setAuthor(res.data);
      })
      .catch((err) => {
        console.error("Failed to load author details:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  // Lấy danh sách kệ sách cá nhân
  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");
    if (!token) return;

    api
      .get("/api/user-library/")
      .then((res) => {
        const items = res.data || [];
        setSavedBooks(items.map((i) => i.book));
      })
      .catch(() => {});
  }, []);

  const toggleShelf = async (bookId) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("refresh_token");
    if (!token) {
      toast.info("Please sign in to save books to your shelf!");
      return;
    }

    try {
      await api.post("/api/user-library/", {
        book: bookId,
        status: "WANT_TO_READ",
      });
      setSavedBooks((prev) =>
        prev.includes(bookId) ? prev : [...prev, bookId],
      );
      toast.success("Saved book to Want to Read shelf!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to save book to shelf."));
    }
  };

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
          Loading author details...
        </div>
        <Footer />
      </div>
    );
  }

  if (!author) {
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
          <h2>Author not found!</h2>
          <Link to="/authors" style={{ color: "#382110", textDecoration: "underline" }}>
            Back to Authors Directory
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const booksList = author.book || author.books || [];

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        {/* LEFT COLUMN: Avatar & Summary Info */}
        <aside className={styles.leftCol}>
          <div className={styles.avatarBox}>
            {author.name ? author.name.charAt(0) : "A"}
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Published Books</span>
              <span className={styles.infoValue}>
                {booksList.length} books in library
              </span>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: Bio & Author's Books */}
        <section>
          <h1 className={styles.authorName}>{author.name}</h1>

          <div className={styles.statsBar}>
            <span className={styles.stars}>★★★★★</span>
            <span>
              <strong>{booksList.length}</strong> books in library
            </span>
          </div>

          <h2 className={styles.bioTitle}>About the Author</h2>
          <p className={styles.bioText}>
            {author.bio || `${author.name} is a renowned author with popular works in the E-Library catalog.`}
          </p>

          {/* Author's Books List */}
          <div className={styles.booksSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {author.name}&apos;s Books ({booksList.length})
              </h2>
            </div>

            {booksList.length === 0 ? (
              <p style={{ color: "#666" }}>No books found for this author in the library.</p>
            ) : (
              <div className={styles.bookList}>
                {booksList.map((book) => {
                  const isAdded = savedBooks.includes(book.id);
                  return (
                    <div key={book.id} className={styles.bookItem}>
                      <div className={styles.bookLeft}>
                        <Link to={`/books/${book.id}`}>
                          <img
                            src={book.cover_image || book.cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80"}
                            alt={book.title}
                            className={styles.bookCover}
                          />
                        </Link>
                        <div>
                          <Link
                            to={`/books/${book.id}`}
                            className={styles.bookTitle}
                          >
                            {book.title}
                          </Link>
                          <div className={styles.bookRating}>
                            <span className={styles.stars}>★★★★★</span>
                            <span>
                              {book.rating ? Number(book.rating).toFixed(1) : "0.0"} rating ({book.pages || "N/A"} pages)
                            </span>
                          </div>
                          <p className={styles.bookDesc}>{book.description || `Published: ${book.publish_date || "N/A"}`}</p>
                          {book.source_url && (
                            <div style={{ marginTop: "8px" }}>
                              <a
                                href={book.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.sourceLinkBadge}
                                title="View original work on Goodreads/Internet"
                              >
                                🔗 Original Source ↗
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleShelf(book.id)}
                        className={`${styles.shelfBtn} ${
                          isAdded ? styles.shelfBtnAdded : ""
                        }`}
                      >
                        {isAdded ? "✓ In My Shelf" : "+ Want to Read"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
