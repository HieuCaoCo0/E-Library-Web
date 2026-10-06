Deadline  
T2: database   
T5: 

- Frontend: xong giao diện frontend  
- Backend: Xong crud api

CN: 

- Làm các chức năng 1, 2, 3, 4  
- Xong api của recommendation

I \- Tổng quan  
Dự án của chúng ta dự kiến sẽ một **website quản lý và đề xuất sách dựa trên hành vi người dùng**, lấy dữ liệu sách từ Goodreads.  
II \- Ý tưởng

Xây dựng một website cho phép người dùng:

* Tìm kiếm và xem thông tin sách.  
* Lưu lại tủ sách cá nhân: Phân loại sách thành các danh mục như *Đang đọc (Currently Reading)*, *Đã đọc (Read)* và *Sẽ đọc (Want to Read)*.   
* Viết đánh giá chia sẻ cảm nhận, chấm điểm sao (từ 1 đến 5 sao) cho 1 cuốn sách   
* Nhận đề xuất sách phù hợp với sở thích cá nhân.

Hệ thống recommendation sử dụng các tín hiệu từ người dùng như:

* Rating.  
* Thể loại sách.  
* Tác giả.  
* Sách đang đọc.  
* Sách muốn đọc.  
* Sách đã đọc.

Từ đó tính toán mức độ phù hợp giữa người dùng và những cuốn sách chưa đọc.

III \- Các tính năng

1. Người dùng  
- Đăng ký: tạo tài khoản (User) bằng username, email, password  
- Đăng nhập: Người dùng đăng nhập để sử dụng các chức năng cá nhân. (AUTHENTICATION)   
- Xem tủ sách cá nhân  
2. Quản lý sách  
- Hiển thị theo trang (20 quyển 1 trang)  
- Hiển thị danh sách sách gồm các thông tin: tên sách, ảnh bìa, rating trung bình.  
- Hiển thị chi tiết các thông tin của sách: tên sách, ảnh bìa tác rating trung bình, tác giả, thể loại, mô tả, năm phát hành, số trang, các bình luận  
3. Tìm kiếm sách băng tiêu đề (sau sẽ mở rộng lên tìm bằng thể loại, tác giả)  
4. Gán reading-status và đánh giá  
- Người dùng có thể gắn các trạng thái cho sách: Read, reading, want to read  
- Người dùng viết bình luận và rating sách (từ 1 \-\> 5 sao)  
5. Đề xuất sách (Recommendation)

IV \- Công nghệ cần học

1. Backend  
- Python  
- Dijango  
- Dijango rest framework  
- Dijango orm  
- MySQL  
2. Frontend  
- Dijango  
- Dijango template  
- HTML \+ CSS

1. Dựng databases mySQL  
2. Backend (crud, recommendation)  
3. Frontend 

1. Đăng ký,đăng nhập  
2. User Profile (thông tin user, lưu sách theo status mà người dùng đặt)  
3. List sách (hiển thử các cuốn sách theo trang \- 20q/1trang, phân loại theo genre)  
4. Trang Admin

### **1\. CustomUser (Người dùng & Xác thực) \- Nguyễn Đức Tài**

* **Các API Endpoints:**  
  * `POST /api/auth/register/`: Đăng ký tài khoản mới. Trả về thông tin user và cặp Access/Refresh token. Mật khẩu được hash với Salt + Server Pepper (Seasoning).  
  * `POST /api/auth/login/`: Đăng nhập, trả về Access/Refresh Token (JWT) và thông tin user.  
  * `POST /api/auth/token/refresh/`: Làm mới Access Token khi token cũ hết hạn (Refresh Token Rotation).  
  * `POST /api/auth/logout/`: Đăng xuất, thu hồi (revoke/blacklist) Refresh Token trước thời hạn để không thể tái sử dụng.  
  * `GET /api/users/profile/`: Xem thông tin cá nhân của user đang đăng nhập (bao gồm avatar, bio).  
  * `PUT /api/users/profile/` hoặc `PATCH /api/users/profile/`: Cập nhật thông tin cá nhân, ảnh đại diện (avatar), tiểu sử (bio).  
* **Services & Cơ chế bảo mật liên quan:**  
  * *Password Seasoning (Pepper):* Sử dụng custom password hasher (`PepperedPBKDF2PasswordHasher`) kết hợp `HMAC-SHA256` với khóa bí mật (`PASSWORD_PEPPER`) trước khi lưu băm PBKDF2, giúp chống tấn công rainbow table ngay cả khi rò rỉ database.  
  * *Token Lifecycle & Revocation:* Quản lý thời hạn sống của Access Token (30 phút) và Refresh Token (7 ngày). Sử dụng `token_blacklist` để thu hồi (revoke) token trước thời hạn khi người dùng đăng xuất hoặc khi refresh token bị xoay vòng (Token Rotation).  
  * *User Service:* Quản lý logic cập nhật profile, upload file ảnh đại diện (`avatar`), xác thực quyền sở hữu tài nguyên.

### **2\. Author (Tác giả) \- Đào Duy Khánh**

* **Các API Endpoints:**  
  * `GET /api/authors/`: Lấy danh sách toàn bộ tác giả (hỗ trợ phân trang, tìm kiếm tên tác giả).  
  * `GET /api/authors/{id}/`: Xem chi tiết thông tin tác giả và danh sách các cuốn sách của tác giả đó.  
  * *(Admin)* `POST /api/authors/`, `PUT /api/authors/{id}/`, `DELETE /api/authors/{id}/`: Thêm, sửa, xóa tác giả.  
* **Services liên quan:**  
  * *Author Service:* Xử lý truy vấn dữ liệu tác giả kết hợp với danh sách sách liên quan (tối ưu hóa câu lệnh SQL bằng `select_related`/`prefetch_related`).

### **3\. Genre (Thể loại sách) \- Trần Hữu Huy**

* **Các API Endpoints:**  
  * `GET /api/genres/`: Lấy danh sách các thể loại sách có trong hệ thống.  
  * `GET /api/genres/{id}/`: Xem chi tiết thể loại và các đầu sách thuộc thể loại này.  
  * *(Admin)* `POST /api/genres/`, `PUT /api/genres/{id}/`, `DELETE /api/genres/{id}/`: Quản lý thể loại.  
* **Services liên quan:**  
  * *Genre Service:* Xử lý lọc và gom nhóm sách theo thể loại phục vụ trang danh mục hoặc bộ lọc.

### **4\. Book (Sách) \- Đỗ Minh Hoàng**

* **Các API Endpoints:**  
  * `GET /api/books/`: Lấy danh sách sách, hỗ trợ lọc theo `genre`, `author` và tìm kiếm (`?search=title_or_author`).  
  * `GET /api/books/{id}/`: Xem chi tiết thông tin sách (bao gồm mô tả, điểm đánh giá trung bình, số lượng review).  
  * *(Admin)* `POST /api/books/`, `PUT /api/books/{id}/`, `DELETE /api/books/{id}/`: Thêm, cập nhật, xóa đầu sách.  
* **Services liên quan:**  
  * *Book Service:* Xử lý logic tìm kiếm toàn văn (`SearchFilter`), sắp xếp, phân trang và tính toán điểm đánh giá trung bình cho mỗi cuốn sách.

### **5\. UserBookStatus (Tủ sách cá nhân) \- Nguyễn Ngọc Huy**

* **Các API Endpoints:**  
  * `GET /api/user-library/`: Lấy danh sách sách cá nhân của user hiện tại (có thể lọc theo trạng thái: `?status=reading`, `read`, hoặc `want_to_read`).  
  * `POST /api/user-library/`: Thêm sách vào tủ sách hoặc cập nhật trạng thái đọc.  
  * `PATCH /api/user-library/{id}/`: Cập nhật trạng thái của một cuốn sách (ví dụ: chuyển từ `want_to_read` sang `reading`).  
  * `DELETE /api/user-library/{id}/`: Xóa sách khỏi tủ sách cá nhân.  
* **Services liên quan:**  
  * *UserLibrary Service:* Đảm bảo tính ràng buộc dữ liệu (mỗi user chỉ có 1 trạng thái duy nhất cho 1 cuốn sách), kiểm tra phân quyền để user chỉ xem/sửa được tủ sách của chính mình.

### **6\. UserReview (Đánh giá & Bình luận) \- Nguyễn Việt Hoàng**

* **Các API Endpoints:**  
  * `GET /api/books/{id}/reviews/`: Lấy danh sách toàn bộ các đánh giá và bình luận của một cuốn sách cụ thể.  
  * `POST /api/books/{id}/reviews/`: Người dùng gửi đánh giá (rating từ 1-5) và viết bình luận cho sách.  
  * `PUT /api/user-reviews/{id}/` hoặc `DELETE /api/user-reviews/{id}/`: Sửa hoặc xóa đánh giá của chính mình.  
* **Services liên quan:**  
  * *Review Service:* Xử lý ràng buộc mỗi user chỉ được review 1 lần/1 cuốn sách, đồng thời kích hoạt việc tính toán lại điểm trung bình (`average rating`) cho cuốn sách đó mỗi khi có review mới được thêm/sửa/xóa.

