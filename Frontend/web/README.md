# 📚 Hướng Dẫn Làm Việc Nhóm Frontend - E-Library Web

Tài liệu này hướng dẫn cách chạy dự án, cấu trúc thư mục và quy tắc viết code dành cho các thành viên team Frontend (React + Vite).

---

## 1. Cách chạy dự án (Chỉ cần cài Docker)

Các bạn dùng **Windows, macOS hay Linux** không cần cài đặt Node.js thủ công trên máy, chỉ cần cài và bật sẵn **Docker Desktop** rồi làm theo 3 bước sau:

**Bước 1:** Mở Terminal trong VS Code, di chuyển vào thư mục `Frontend`:

```bash
cd Frontend
```

**Bước 2:** Bật dự án bằng Docker Compose:

```bash
docker compose up
```

_(Lần đầu chạy Docker sẽ tự động tải các thư viện cần thiết, vui lòng đợi khoảng 1-2 phút cho đến khi hiện dòng `VITE ready`)._

**Bước 3:** Mở trình duyệt và truy cập vào địa chỉ:
👉 **http://localhost:5173**

> **Lưu ý khi chạy:**
>
> - **Khi muốn tắt server:** Nhấn tổ hợp phím `Ctrl + C` tại cửa sổ Terminal đang chạy.
> - **Khi kéo code mới về (`git pull`):** Nếu thấy có cập nhật thêm thư viện mới, hãy tắt Docker (`Ctrl + C`) rồi chạy lại `docker compose up` để Docker tự cài đặt thư viện mới.

---

## 2. Cấu trúc thư mục & Chỗ viết code

Toàn bộ phần code giao diện của chúng ta nằm trong thư mục **`Frontend/web/src/`**:

```text
Frontend/
├── docker-compose.yml       # File cấu hình Docker (KHÔNG SỬA)
└── web/
    ├── public/              # Chứa ảnh/icon tĩnh giữ nguyên tên gốc
    ├── src/                 # 🔥 NƠI LÀM VIỆC CHÍNH CỦA TEAM FE
    │   ├── assets/          # Chứa hình ảnh, logo, font chữ dùng trong giao diện
    │   ├── components/      # Chứa các thành phần nhỏ dùng chung (Navbar, Footer, BookCard, Button...)
    │   ├── pages/           # Chứa các trang hoàn chỉnh (HomePage, LoginPage, BookDetailPage...)
    │   ├── App.jsx          # Khung giao diện gốc của ứng dụng
    │   ├── App.css          # File CSS của App
    │   ├── index.css        # File CSS toàn cục (Global CSS)
    │   └── main.jsx         # File cấu hình đường dẫn chuyển trang (React Router)
    └── package.json         # Danh sách các thư viện đã cài (axios, react-router...)
```

### Quy tắc: Ai làm phần nào thì tạo file ở đâu?

1. **Nếu bạn được giao làm 1 TRANG MỚI** (Ví dụ: Trang Chi Tiết Sách, Trang Đăng Nhập, Trang Tủ Sách):
   - Vào thư mục **`src/pages/`**, tạo file mới viết hoa chữ cái đầu (ví dụ: `BookDetailPage.jsx`, `MyShelfPage.jsx`).
   - Tuyệt đối không viết chung tất cả các trang vào trong `App.jsx` để tránh đè code của nhau.
2. **Nếu bạn làm 1 KHỐI GIAO DIỆN DÙNG LẠI NHIỀU LẦN** (Ví dụ: Thanh Menu, Khung hiển thị 1 cuốn sách, Chân trang):
   - Vào thư mục **`src/components/`**, tạo file mới (ví dụ: `Header.jsx`, `Footer.jsx`, `BookCard.jsx`).

---

## 3. Hướng dẫn cách viết code cơ bản (Dành cho người mới)

### A. Mẫu tạo 1 Trang (Page) hoặc Component mới

Khi tạo một file `.jsx` mới trong `src/pages/` hoặc `src/components/`, hãy copy khung chuẩn này vào rồi viết HTML vào bên trong lệnh `return`:

```jsx
// Ví dụ file: src/pages/BookDetailPage.jsx

export default function BookDetailPage() {
  return (
    <div className="book-detail-container">
      <h1>Tên cuốn sách</h1>
      <p>Tác giả: Nguyễn Nhật Ánh</p>
      <button>Đọc ngay</button>
    </div>
  );
}
```

### B. 3 Khác biệt nhỏ giữa HTML thường và React (JSX) cần nhớ:

1. Đổi chữ `class="..."` trong HTML thành **`className="..."`**.
2. Các thẻ đơn bắt buộc phải có dấu đóng **`/`** ở cuối (ví dụ: `<img src="..." />`, `<input type="text" />`, `<br />`).
3. Toàn bộ nội dung trong `return (...)` phải được bọc trong **1 thẻ cha duy nhất** (ví dụ bọc trong `<div>...</div>` hoặc thẻ trống `<>...</>`).

### C. Cách thêm đường dẫn (Route) để xem trang bạn vừa tạo

Sau khi tạo trang mới trong `src/pages/`, bạn mở file **`src/main.jsx`** để khai báo đường dẫn:

```jsx
import BookDetailPage from "./pages/BookDetailPage.jsx"; // 1. Import trang của bạn

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  // 2. Thêm đường dẫn mới vào đây:
  {
    path: "/book-detail",
    element: <BookDetailPage />,
  },
]);
```

Sau khi lưu lại, bạn mở trình duyệt vào `http://localhost:5173/book-detail` sẽ thấy ngay trang của mình!

---

## 4. Quy trình lấy code và đẩy code lên Git (Tránh lỗi xung đột)

Trước khi bắt đầu code mỗi ngày:

```bash
git checkout FE
git pull origin FE
```

Sau khi code xong phần của mình:

```bash
git add .
git commit -m "feat(fe): hoàn thành giao diện trang ..."
git push origin FE
```
