# E-Library-Web

## Hướng dẫn sử dụng github
1. fork repo
2. tải git https://git-scm.com/install/
3. vào repo trong tài khoản của mình
4. tạo folder mới
5. kéo folder vào terminal
6. git clone 
7. setup môi trường và csdl theo hướng dẫn bên dưới
## Cách gửi code lên github
1. git add .
2. git commit -m"messege"
3. git push 
4. tạo pull request
## Cách setup môi trường
- chạy các lệnh sau trong cmd:
1. python -m venv .venv
2. .venv\Scripts\Activate.ps1
3. python -m pip install --upgrade pip
4. pip install -r requirements.txt
```powershell
cd E-Library-Web
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Cách setup CSDL
- video hướng dẫn: https://youtu.be/Oa7bpIZ6RxI?si=RY8Qvx6saUQyVfjo
- đặt username và mật khẩu đều là root
- tạo schema tên là eLibDB
- (nếu đặt khác thì chỉnh trong main/main/settings)
- Chạy lệnh sau trong cmd (cd vào folder chứa file mangage.py) để nạp dữ liệu vào mysql: 
1. python magage.py makemigrations
2. python manage.py migrate
3. python manage.py import_data
```powershell
cd E-Library-Web\main
python magage.py makemigrations
python manage.py migrate
python manage.py import_data
```

## Chạy server

```powershell
cd E-Library-Web\main
python manage.py runserver
```

Base URL: `http://127.0.0.1:8000`

Header khi đã đăng nhập:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

- GET catalog (books, authors, genres, reviews) không cần token.
- POST/PUT/PATCH/DELETE catalog (books, authors, genres) cần user **staff/admin**.
- Library và tạo/sửa/xóa review cần user đã đăng nhập.
- Chỉ **chủ review** mới sửa/xóa review của mình.

## API endpoints

### Auth

| Method | Endpoint | Auth | Request example |
|---|---|---|---|
| POST | `/api/auth/register/` | Không | `{"username": "user_a", "email": "a@example.com", "password": "Password123!", "password_confirm": "Password123!", "first_name": "A", "last_name": "Nguyen"}` |
| POST | `/api/auth/login/` | Không | `{"username": "user_a", "password": "Password123!"}` |
| POST | `/api/auth/token/refresh/` | Không | `{"refresh": "<refresh_token>"}` |
| POST | `/api/auth/logout/` | Bearer | `{"refresh": "<refresh_token>"}` |

Login/register trả về `access` và `refresh`. Access sống 30 phút, refresh 7 ngày.

### User profile

| Method | Endpoint | Auth | Request example |
|---|---|---|---|
| GET | `/api/users/profile/` | Bearer | (không body) |
| PUT | `/api/users/profile/` | Bearer | `{"email": "a@example.com", "first_name": "A", "last_name": "Nguyen", "bio": "Hello"}` |
| PATCH | `/api/users/profile/` | Bearer | `{"bio": "Doc sach moi ngay"}` |

`username` không sửa được. Upload avatar dùng `multipart/form-data`, field `avatar`.

### Books

| Method | Endpoint | Auth | Request example |
|---|---|---|---|
| GET | `/api/books/` | Không | Query: `?search=hunger&genre=1&author=2&ordering=-rating&page=1` |
| POST | `/api/books/` | Admin | `{"title": "New Book", "author": 1, "genres": [1, 2], "description": "...", "pages": 300, "publish_date": "2008-09-14", "cover_image": "https://...", "source_url": "https://..."}` |
| GET | `/api/books/<id>/` | Không | `GET /api/books/1/` |
| PUT | `/api/books/<id>/` | Admin | `{"title": "Updated", "author": 1, "genres": [1], "description": "...", "pages": 320, "publish_date": "2008-09-14", "cover_image": "https://...", "source_url": "https://..."}` |
| PATCH | `/api/books/<id>/` | Admin | `{"title": "Updated title"}` |
| DELETE | `/api/books/<id>/` | Admin | (không body) |

`search` tìm theo title hoặc tên tác giả. `genre` và `author` là id số nguyên. `ordering` hợp lệ: `id`, `title`, `rating`, `publish_date`, `avg_rating` (thêm `-` để giảm dần). Mỗi trang 12 sách.

### Authors

| Method | Endpoint | Auth | Request example |
|---|---|---|---|
| GET | `/api/authors/` | Không | `GET /api/authors/?search=Rowling` |
| POST | `/api/authors/` | Admin | `{"name": "New Author"}` |
| GET | `/api/authors/<id>/` | Không | `GET /api/authors/1/` |
| PUT | `/api/authors/<id>/` | Admin | `{"name": "Updated Author"}` |
| PATCH | `/api/authors/<id>/` | Admin | `{"name": "Updated Author"}` |
| DELETE | `/api/authors/<id>/` | Admin | (không body) |

Chi tiết tác giả gồm danh sách sách của tác giả đó.

### Genres

| Method | Endpoint | Auth | Request example |
|---|---|---|---|
| GET | `/api/genres/` | Không | `GET /api/genres/?search=Fantasy` |
| POST | `/api/genres/` | Admin | `{"name": "Mystery"}` |
| GET | `/api/genres/<id>/` | Không | `GET /api/genres/1/?page=1&ordering=-rating` |
| PUT | `/api/genres/<id>/` | Admin | `{"name": "Updated Genre"}` |
| PATCH | `/api/genres/<id>/` | Admin | `{"name": "Updated Genre"}` |
| DELETE | `/api/genres/<id>/` | Admin | (không body) |

Chi tiết thể loại trả về thông tin genre + danh sách sách (phân trang 20). `ordering` sách: `title`, `rating`, `publish_date` (thêm `-` để giảm dần).

### User library (trạng thái đọc)

Cần đăng nhập. Mỗi user chỉ có 1 trạng thái cho 1 cuốn sách. Status hợp lệ: `WANT_TO_READ`, `READING`, `READ` (gửi chữ thường cũng được).

| Method | Endpoint | Auth | Request example |
|---|---|---|---|
| GET | `/api/user-library/` | Bearer | `GET /api/user-library/?status=READING` |
| POST | `/api/user-library/` | Bearer | `{"book": 1, "status": "WANT_TO_READ"}` |
| PATCH | `/api/user-library/<id>/` | Bearer | `{"status": "READ"}` |
| DELETE | `/api/user-library/<id>/` | Bearer | (không body) |

POST sách đã có trong thư viện sẽ **cập nhật** status (200) thay vì tạo trùng (201). Không được đổi `book` khi PATCH.

### Reviews

| Method | Endpoint | Auth | Request example |
|---|---|---|---|
| GET | `/api/books/<book_id>/reviews/` | Không | `GET /api/books/1/reviews/` |
| POST | `/api/books/<book_id>/reviews/` | Bearer | `{"rating": 5, "comment": "Sach rat hay!"}` |
| GET | `/api/user-reviews/<id>/` | Không | `GET /api/user-reviews/10/` |
| PUT | `/api/user-reviews/<id>/` | Owner | `{"rating": 4, "comment": "Doc lai thay kha hay"}` |
| PATCH | `/api/user-reviews/<id>/` | Owner | `{"rating": 4}` |
| DELETE | `/api/user-reviews/<id>/` | Owner | (không body) |

`rating` phải từ 1 đến 5. Mỗi user chỉ review 1 lần / sách; lần sau phải PUT/PATCH. Tạo/sửa/xóa review sẽ tính lại `Book.rating` (trung bình). Xóa review cuối cùng thì `Book.rating = 0`.

### Admin

| Method | Endpoint | Auth | Request example |
|---|---|---|---|
| GET | `/admin/` | Session admin | Mở trên trình duyệt, đăng nhập superuser |