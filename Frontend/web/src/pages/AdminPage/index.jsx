import { useState } from "react";
import Header from "../../components/Header";
import styles from "./AdminPage.module.css";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("books"); // 'books' | 'authors' | 'genres'

  // 1. State Quản lý Sách (POST/PUT/DELETE /api/books/ - Đỗ Minh Hoàng)
  const [books, setBooks] = useState([
    {
      id: 1,
      title: "Clean Code",
      author: "Robert C. Martin",
      genre: "Programming & Tech",
    },
    {
      id: 2,
      title: "Mắt Biếc",
      author: "Nguyễn Nhật Ánh",
      genre: "Vietnamese Literature",
    },
    {
      id: 3,
      title: "Dế Mèn Phiêu Lưu Ký",
      author: "Tô Hoài",
      genre: "Vietnamese Literature",
    },
  ]);
  const [bookForm, setBookForm] = useState({
    id: null,
    title: "",
    author: "",
    genre: "",
  });

  // 2. State Quản lý Tác giả (POST/PUT/DELETE /api/authors/ - Đào Duy Khánh)
  const [authors, setAuthors] = useState([
    {
      id: 1,
      name: "Nguyễn Nhật Ánh",
      bio: "Nhà văn chuyên viết cho tuổi mới lớn tại Việt Nam.",
    },
    {
      id: 2,
      name: "Robert C. Martin",
      bio: "Kỹ sư phần mềm người Mỹ, tác giả Clean Code.",
    },
  ]);
  const [authorForm, setAuthorForm] = useState({ id: null, name: "", bio: "" });

  // 3. State Quản lý Thể loại (POST/PUT/DELETE /api/genres/ - Trần Hữu Huy)
  const [genres, setGenres] = useState([
    {
      id: 1,
      name: "Programming & Tech",
      description: "Sách lập trình và công nghệ phần mềm",
    },
    {
      id: 2,
      name: "Vietnamese Literature",
      description: "Văn học Việt Nam hiện đại và kinh điển",
    },
  ]);
  const [genreForm, setGenreForm] = useState({
    id: null,
    name: "",
    description: "",
  });

  // Xử lý Lưu Sách
  const handleSaveBook = (e) => {
    e.preventDefault();
    if (bookForm.id) {
      setBooks(books.map((b) => (b.id === bookForm.id ? bookForm : b)));
    } else {
      setBooks([...books, { ...bookForm, id: Date.now() }]);
    }
    setBookForm({ id: null, title: "", author: "", genre: "" });
  };

  // Xử lý Lưu Tác giả
  const handleSaveAuthor = (e) => {
    e.preventDefault();
    if (authorForm.id) {
      setAuthors(authors.map((a) => (a.id === authorForm.id ? authorForm : a)));
    } else {
      setAuthors([...authors, { ...authorForm, id: Date.now() }]);
    }
    setAuthorForm({ id: null, name: "", bio: "" });
  };

  // Xử lý Lưu Thể loại
  const handleSaveGenre = (e) => {
    e.preventDefault();
    if (genreForm.id) {
      setGenres(genres.map((g) => (g.id === genreForm.id ? genreForm : g)));
    } else {
      setGenres([...genres, { ...genreForm, id: Date.now() }]);
    }
    setGenreForm({ id: null, name: "", description: "" });
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.container}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Admin Dashboard</h1>
            <p className={styles.subtitle}>
              Quản lý toàn bộ Đầu sách, Tác giả và Thể loại trong hệ thống
              E-Library
            </p>
          </div>
        </div>

        {/* Thanh chuyển đổi 3 Tab */}
        <div className={styles.tabBar}>
          <button
            onClick={() => setActiveTab("books")}
            className={`${styles.tabBtn} ${activeTab === "books" ? styles.tabBtnActive : ""}`}
          >
            📚 Manage Books ({books.length})
          </button>
          <button
            onClick={() => setActiveTab("authors")}
            className={`${styles.tabBtn} ${activeTab === "authors" ? styles.tabBtnActive : ""}`}
          >
            ✍️ Manage Authors ({authors.length})
          </button>
          <button
            onClick={() => setActiveTab("genres")}
            className={`${styles.tabBtn} ${activeTab === "genres" ? styles.tabBtnActive : ""}`}
          >
            🏷️ Manage Genres ({genres.length})
          </button>
        </div>

        {/* TAB 1: QUẢN LÝ SÁCH */}
        {activeTab === "books" && (
          <div className={styles.contentGrid}>
            <form onSubmit={handleSaveBook} className={styles.formCard}>
              <h2 className={styles.formTitle}>
                {bookForm.id ? "Edit Book" : "Add New Book"}
              </h2>
              <div className={styles.field}>
                <label className={styles.label}>Book Title</label>
                <input
                  type="text"
                  className={styles.input}
                  value={bookForm.title}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Author Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={bookForm.author}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, author: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Genre</label>
                <input
                  type="text"
                  className={styles.input}
                  value={bookForm.genre}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, genre: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.btnRow}>
                <button type="submit" className={styles.submitBtn}>
                  {bookForm.id ? "Update Book" : "+ Create Book"}
                </button>
                {bookForm.id && (
                  <button
                    type="button"
                    onClick={() =>
                      setBookForm({
                        id: null,
                        title: "",
                        author: "",
                        genre: "",
                      })
                    }
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Book Title</th>
                    <th>Author</th>
                    <th>Genre</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td>#{book.id}</td>
                      <td className={styles.itemName}>{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.genre}</td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button
                            onClick={() => setBookForm(book)}
                            className={styles.editBtn}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setBooks(books.filter((b) => b.id !== book.id))
                            }
                            className={styles.deleteBtn}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ TÁC GIẢ */}
        {activeTab === "authors" && (
          <div className={styles.contentGrid}>
            <form onSubmit={handleSaveAuthor} className={styles.formCard}>
              <h2 className={styles.formTitle}>
                {authorForm.id ? "Edit Author" : "Add New Author"}
              </h2>
              <div className={styles.field}>
                <label className={styles.label}>Author Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={authorForm.name}
                  onChange={(e) =>
                    setAuthorForm({ ...authorForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Biography</label>
                <textarea
                  className={styles.textarea}
                  value={authorForm.bio}
                  onChange={(e) =>
                    setAuthorForm({ ...authorForm, bio: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.btnRow}>
                <button type="submit" className={styles.submitBtn}>
                  {authorForm.id ? "Update Author" : "+ Create Author"}
                </button>
                {authorForm.id && (
                  <button
                    type="button"
                    onClick={() =>
                      setAuthorForm({ id: null, name: "", bio: "" })
                    }
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Author Name</th>
                    <th>Biography</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {authors.map((author) => (
                    <tr key={author.id}>
                      <td>#{author.id}</td>
                      <td className={styles.itemName}>{author.name}</td>
                      <td>{author.bio}</td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button
                            onClick={() => setAuthorForm(author)}
                            className={styles.editBtn}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setAuthors(
                                authors.filter((a) => a.id !== author.id),
                              )
                            }
                            className={styles.deleteBtn}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: QUẢN LÝ THỂ LOẠI */}
        {activeTab === "genres" && (
          <div className={styles.contentGrid}>
            <form onSubmit={handleSaveGenre} className={styles.formCard}>
              <h2 className={styles.formTitle}>
                {genreForm.id ? "Edit Genre" : "Add New Genre"}
              </h2>
              <div className={styles.field}>
                <label className={styles.label}>Genre Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={genreForm.name}
                  onChange={(e) =>
                    setGenreForm({ ...genreForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  value={genreForm.description}
                  onChange={(e) =>
                    setGenreForm({ ...genreForm, description: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.btnRow}>
                <button type="submit" className={styles.submitBtn}>
                  {genreForm.id ? "Update Genre" : "+ Create Genre"}
                </button>
                {genreForm.id && (
                  <button
                    type="button"
                    onClick={() =>
                      setGenreForm({ id: null, name: "", description: "" })
                    }
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Genre Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {genres.map((genre) => (
                    <tr key={genre.id}>
                      <td>#{genre.id}</td>
                      <td className={styles.itemName}>{genre.name}</td>
                      <td>{genre.description}</td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button
                            onClick={() => setGenreForm(genre)}
                            className={styles.editBtn}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setGenres(genres.filter((g) => g.id !== genre.id))
                            }
                            className={styles.deleteBtn}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        © 2026 E-Library — Hệ thống quản lý đọc sách & đánh giá trực tuyến
      </footer>
    </div>
  );
}
