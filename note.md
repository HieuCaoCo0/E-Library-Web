# 📓 WORKLOG & TODO LIST: MODULE USER REVIEW (MỤC 6)

## 📌 1. Thông tin chung & Tổng quan dự án

- **Dự án:** E-Library-Web (Website quản lý và đề xuất sách dựa trên hành vi người dùng, dữ liệu từ Goodreads).
- **Công nghệ Backend:** Python, Django, Django REST Framework (DRF), Django ORM, MySQL (`eLibDB`), JWT Authentication.
- **Người phụ trách:** Vũ Việt Hoàng.
- **Nhiệm vụ:** Backend Mục 6 - `UserReview` (Đánh giá & Bình luận sách).
- **Git Branch:** `feature/UserReview`
- **Mốc Deadline chung:**
  - **Thứ 2:** Xong Database.
  - **Thứ 5:** Backend xong toàn bộ CRUD API.
  - **Chủ Nhật:** Ghép nối chức năng 1, 2, 3, 4 & hoàn thiện API Recommendation.

### 🎯 Vai trò của Module `UserReview` trong hệ thống:

1. Cho phép người dùng chấm điểm (`rating` từ 1 đến 5 sao) và viết bình luận (`comment`) chia sẻ cảm nhận cho một cuốn sách.
2. Tự động tính toán lại **điểm đánh giá trung bình (`average_rating`)** và **số lượng đánh giá (`reviews_count`)** của cuốn sách mỗi khi có review được Thêm / Sửa / Xóa (phục vụ trực tiếp cho Mục 4 - `Book` của Đỗ Minh Hoàng).
3. Cung cấp tín hiệu `Rating` quan trọng cho **Hệ thống Recommendation** tính toán độ phù hợp sách cho người dùng.

---

## 🔖 Quy ước đánh dấu trạng thái (Legend)

> Trong quá trình làm việc, cập nhật trạng thái bằng cách sửa các ô vuông:

- `[ ]` : Chưa làm (To Do)
- `[~]` : Đang làm (In Progress)
- `[x]` : Đã hoàn thành / Test thành công (Done / Passed)
- `[!]` : Đang bị lỗi cần sửa gấp (Bug / Failed)

---

## 🏗️ 2. Cách tổ chức cấu trúc thư mục (Code Organization)

Dự án tách bạch rõ ràng phần xử lý nghiệp vụ (`services.py`), phân quyền (`permissions.py`) và giao tiếp API (`views.py`, `serializers.py`) để không làm phình to View và dễ bảo trì:

```text
main/                                # Thư mục chứa manage.py
├── main/                            # Thư mục cài đặt gốc (settings.py, urls.py)
└── reviews/                         # App quản lý UserReview (hoặc đặt trong app chung của nhóm)
    ├── migrations/
    ├── __init__.py
    ├── admin.py                     # Đăng ký bảng UserReview lên trang Admin
    ├── apps.py                      # Khai báo nạp signals (nếu dùng signals)
    ├── models.py                    # Định nghĩa bảng UserReview & Ràng buộc dữ liệu
    ├── serializers.py               # Validate dữ liệu đầu vào (rating 1-5) & format JSON trả về
    ├── permissions.py               # Custom Permission: IsOwnerOrReadOnly (chỉ chủ review được sửa/xóa)
    ├── services.py                  # Review Service: Xử lý tạo/sửa/xóa & cập nhật điểm trung bình Book
    ├── urls.py                      # Định tuyến các endpoints của Review
    ├── views.py                     # API Views nhận request & trả response
    └── tests.py                     # Viết Unit Test tự động cho các kịch bản
```

---

## 📋 3. Danh sách công việc cần làm (TODO List - Làm đến đâu tích đến đó)

### Giai đoạn 1: Khởi tạo Môi trường, Git & Database

- [x] Tạo và chuyển sang nhánh riêng: `git checkout -b feature/UserReview`
- [ ] Tạo môi trường ảo: `python -m venv .venv`
- [ ] Kích hoạt môi trường ảo: `.venv\Scripts\Activate.ps1`
- [ ] Nâng cấp pip và cài đặt thư viện: `python -m pip install --upgrade pip && pip install -r requirements.txt`
- [ ] Tạo schema MySQL tên `eLibDB` (user: `root`, pass: `root`) và kiểm tra kết nối trong `main/main/settings.py`.
- [ ] Chạy lệnh nạp dữ liệu (chú ý trong README ghi nhầm `magage.py`, gõ đúng là `manage.py`):
  - [ ] `python manage.py makemigrations`
  - [ ] `python manage.py migrate`
  - [ ] `python manage.py import_data`

### Giai đoạn 2: Thiết kế Model `UserReview` (Deadline: Thứ 2)

- [x] Kiểm tra tên Model của `CustomUser` (Mục 1 - Nguyễn Đức Tài) và `Book` (Mục 4 - Đỗ Minh Hoàng) để liên kết khóa ngoại (`ForeignKey`) chính xác.
- [x] Kiểm tra trong Model `Book` đã có trường lưu điểm trung bình (VD: `average_rating`) và tổng số đánh giá (VD: `reviews_count` / `ratings_count`) chưa.
- [x] Viết Model `UserReview` trong `models.py` với các trường:
  - `user`: `ForeignKey` liên kết tới `settings.AUTH_USER_MODEL` (`on_delete=models.CASCADE`).
  - `book`: `ForeignKey` liên kết tới `Book` (`on_delete=models.CASCADE`, `related_name='reviews'`).
  - `rating`: `PositiveSmallIntegerField` (Validators: `MinValueValidator(1)`, `MaxValueValidator(5)`).
  - `comment`: `TextField(blank=True, null=True)`.
  - `created_at`: `DateTimeField(auto_now_add=True)`.
  - `updated_at`: `DateTimeField(auto_now=True)`.
- [x] Thiết lập `UniqueConstraint(fields=['user', 'book'], name='unique_user_book_review')` trong `class Meta` để đảm bảo mỗi user chỉ đánh giá 1 cuốn sách tối đa 1 lần.
- [x] Đăng ký `UserReview` vào `admin.py` để phục vụ Trang Admin.
- [ ] Chạy `makemigrations` và `migrate` cho bảng `UserReview`.

### Giai đoạn 3: Xây dựng `Review Service` & Permissions (Deadline: Thứ 5)

- [x] Viết `IsReviewOwnerOrReadOnly` trong `permissions.py`: Ai cũng xem được (`SAFE_METHODS`), nhưng chỉ chủ sở hữu (`obj.user == request.user`) mới được `PUT` / `DELETE`.
- [x] Viết hàm `recalculate_book_rating(book)` trong `services.py`:
  - Dùng `Avg('rating')` và `Count('id')` của Django ORM để tính điểm trung bình (làm tròn 2 chữ số thập phân) và tổng số lượng review của sách.
  - Lưu cập nhật vào bảng `Book`.
- [x] Viết hàm `create_review(user, book, rating, comment)` trong `services.py`:
  - Kiểm tra xem `user` đã review `book` này chưa (nếu có rồi thì báo lỗi `ValidationError` rõ ràng).
  - Tạo bản ghi `UserReview` trong `transaction.atomic()` và gọi `recalculate_book_rating(book)`.
- [x] Viết hàm `update_review(review, rating, comment)` và `delete_review(review)` trong `services.py`:
  - Cập nhật hoặc xóa bản ghi, sau đó gọi ngay `recalculate_book_rating(book)`.

### Giai đoạn 4: Xây dựng Serializers, API Views & URLs (Deadline: Thứ 5)

- [x] Viết `UserReviewSerializer` trong `serializers.py`:
  - Hiển thị thêm thông tin người bình luận (`username`, `avatar`) để Frontend hiển thị dưới trang chi tiết sách.
  - Validate `rating` phải là số nguyên từ `1` đến `5`.
- [x] Viết View xử lý **`GET /api/books/{id}/reviews/`** và **`POST /api/books/{id}/reviews/`**:
  - `GET`: Lấy toàn bộ danh sách đánh giá & bình luận của sách có `id` tương ứng (sắp xếp mới nhất lên đầu, dùng `select_related('user')` để tránh lỗi N+1 query).
  - `POST`: Yêu cầu đăng nhập (`IsAuthenticated`), nhận `rating` và `comment`, gọi `ReviewService.create_review`.
- [x] Viết View xử lý **`PUT /api/user-reviews/{id}/`** và **`DELETE /api/user-reviews/{id}/`**:
  - Yêu cầu đăng nhập (`IsAuthenticated`) + quyền chủ sở hữu (`IsReviewOwnerOrReadOnly`).
  - `PUT` (hỗ trợ cả `PATCH`): Sửa `rating` / `comment` của chính mình và tính lại điểm trung bình sách.
  - `DELETE`: Xóa đánh giá của chính mình và tính lại điểm trung bình sách.
- [x] Khai báo đường dẫn trong `urls.py` và nối vào `main/urls.py`.

### Giai đoạn 5: Tích hợp chung & Hỗ trợ Recommendation (Deadline: Chủ Nhật)

- [ ] Phối hợp với **Đỗ Minh Hoàng (Mục 4 - Book)**: Đảm bảo API `GET /api/books/{id}/` trả về đúng `average_rating`, `reviews_count` và danh sách bình luận khi có review mới.
- [ ] Phối hợp với **Nguyễn Đức Tài (Mục 1 - Auth)**: Kiểm tra gửi JWT Bearer Token trên Header hoạt động trơn tru với các API `POST`, `PUT`, `DELETE`.
- [x] Cung cấp hàm truy vấn dữ liệu `(user_id, book_id, rating)` cho nhóm làm thuật toán **Recommendation**.

---

## 💻 4. Hướng dẫn cách Code chi tiết (Implementation Guide)

### 4.1. Code `models.py`

```python
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class UserReview(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_reviews'
    )
    # Lưu ý: Sửa 'books.Book' theo đúng tên app chứa model Book của nhóm
    book = models.ForeignKey(
        'books.Book',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Điểm đánh giá từ 1 đến 5 sao"
    )
    comment = models.TextField(blank=True, null=True, help_text="Nội dung bình luận")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_reviews'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'book'],
                name='unique_user_book_review'
            )
        ]

    def __str__(self):
        return f"User {self.user_id} - Book {self.book_id} ({self.rating}★)"
```

### 4.2. Code `services.py` (Review Service)

```python
from django.db import transaction
from django.db.models import Avg, Count
from rest_framework.exceptions import ValidationError
from .models import UserReview

class ReviewService:
    @staticmethod
    def recalculate_book_rating(book):
        """
        Tính toán lại điểm trung bình (average_rating) và tổng số review cho sách.
        """
        stats = UserReview.objects.filter(book=book).aggregate(
            avg_rating=Avg('rating'),
            total_reviews=Count('id')
        )
        avg = round(stats['avg_rating'], 2) if stats['avg_rating'] is not None else 0.0
        total = stats['total_reviews'] or 0

        # Lưu ý: Kiểm tra đúng tên trường trong model Book của Đỗ Minh Hoàng
        update_fields = []
        if hasattr(book, 'average_rating'):
            book.average_rating = avg
            update_fields.append('average_rating')
        if hasattr(book, 'reviews_count'):
            book.reviews_count = total
            update_fields.append('reviews_count')

        if update_fields:
            book.save(update_fields=update_fields)
        return avg, total

    @classmethod
    @transaction.atomic
    def create_review(cls, user, book, rating, comment=""):
        if UserReview.objects.filter(user=user, book=book).exists():
            raise ValidationError({"detail": "Bạn đã đánh giá cuốn sách này rồi. Vui lòng sửa đánh giá cũ."})

        review = UserReview.objects.create(
            user=user,
            book=book,
            rating=rating,
            comment=comment
        )
        cls.recalculate_book_rating(book)
        return review

    @classmethod
    @transaction.atomic
    def update_review(cls, review, rating=None, comment=None):
        if rating is not None:
            review.rating = rating
        if comment is not None:
            review.comment = comment
        review.save()
        cls.recalculate_book_rating(review.book)
        return review

    @classmethod
    @transaction.atomic
    def delete_review(cls, review):
        book = review.book
        review.delete()
        cls.recalculate_book_rating(book)
```

### 4.3. Code `permissions.py` & `serializers.py`

```python
# permissions.py
from rest_framework import permissions

class IsReviewOwnerOrReadOnly(permissions.BasePermission):
    """
    Chỉ cho phép chủ nhân của review được phép sửa (PUT/PATCH) hoặc xóa (DELETE).
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user
```

```python
# serializers.py
from rest_framework import serializers
from .models import UserReview

class UserReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserReview
        fields = ['id', 'user', 'username', 'book', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'username', 'book', 'created_at', 'updated_at']

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Điểm đánh giá (rating) phải nằm trong khoảng từ 1 đến 5 sao.")
        return value
```

### 4.4. Code `views.py` & `urls.py`

```python
# views.py
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import UserReview
from .serializers import UserReviewSerializer
from .permissions import IsReviewOwnerOrReadOnly
from .services import ReviewService
from books.models import Book  # Chỉnh lại theo đúng tên app Book của nhóm

class BookReviewListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  /api/books/{book_id}/reviews/ : Lấy danh sách đánh giá của 1 cuốn sách
    POST /api/books/{book_id}/reviews/ : Gửi đánh giá (rating 1-5) và bình luận
    """
    serializer_class = UserReviewSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        book_id = self.kwargs.get('book_id')
        get_object_or_404(Book, pk=book_id)
        return UserReview.objects.filter(book_id=book_id).select_related('user')

    def create(self, request, *args, **kwargs):
        book = get_object_or_404(Book, pk=self.kwargs.get('book_id'))
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = ReviewService.create_review(
            user=request.user,
            book=book,
            rating=serializer.validated_data['rating'],
            comment=serializer.validated_data.get('comment', '')
        )
        output_serializer = self.get_serializer(review)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class UserReviewDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    PUT    /api/user-reviews/{id}/ : Sửa đánh giá của chính mình
    DELETE /api/user-reviews/{id}/ : Xóa đánh giá của chính mình
    """
    queryset = UserReview.objects.select_related('user', 'book').all()
    serializer_class = UserReviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsReviewOwnerOrReadOnly]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        updated_review = ReviewService.update_review(
            review=instance,
            rating=serializer.validated_data.get('rating'),
            comment=serializer.validated_data.get('comment')
        )
        return Response(self.get_serializer(updated_review).data, status=status.HTTP_200_OK)

    def perform_destroy(self, instance):
        ReviewService.delete_review(instance)
```

```python
# urls.py
from django.urls import path
from .views import BookReviewListCreateAPIView, UserReviewDetailAPIView

urlpatterns = [
    path('api/books/<int:book_id>/reviews/', BookReviewListCreateAPIView.as_view(), name='book-reviews'),
    path('api/user-reviews/<int:pk>/', UserReviewDetailAPIView.as_view(), name='user-review-detail'),
]
```

---

## 🧪 5. Kế hoạch Kiểm thử & Bảng theo dõi Test (Testing Checklist)

### 5.1. Cách thức Test

1. **Test thủ công bằng Postman / Thunder Client (VS Code):**
   - Bật server: `python manage.py runserver`
   - Gọi `POST /api/auth/login/` để lấy `access_token` của **User A** và **User B**.
   - Gắn vào Header: `Authorization: Bearer <access_token>`.
2. **Test tự động bằng Django Test Runner:**
   - Chạy lệnh: `python manage.py test userReview`

### 5.2. Bảng Checklist Test Cases (Test được tích `[x]`, lỗi tích `[!]`)

| Mã TC    | Endpoint                         | Kịch bản kiểm thử (Test Scenario)                                                         | Dữ liệu đầu vào (Input)                               | Kết quả kỳ vọng (Expected Output)                                                             | Trạng thái (`[ ]`/`[x]`/`[!]`) | Ghi chú / Lỗi gặp phải |
| :------- | :------------------------------- | :---------------------------------------------------------------------------------------- | :---------------------------------------------------- | :-------------------------------------------------------------------------------------------- | :----------------------------: | :--------------------- |
| **TC01** | `GET /api/books/{id}/reviews/`   | Xem danh sách review của sách hợp lệ (không cần đăng nhập)                                | `book_id = 1`                                         | `200 OK`, trả về mảng JSON các review của sách 1                                              |             `[x]`              | Đạt                    |
| **TC02** | `GET /api/books/{id}/reviews/`   | Xem danh sách review của sách không tồn tại                                               | `book_id = 999999`                                    | `404 Not Found`                                                                               |             `[x]`              | Đạt                    |
| **TC03** | `POST /api/books/{id}/reviews/`  | Gửi đánh giá mới hợp lệ (User A đã đăng nhập)                                             | `{"rating": 5, "comment": "Sách rất hay!"}`           | `201 Created`, tạo bản ghi thành công & cập nhật `average_rating` của sách = 5.0              |             `[x]`              | Đạt                    |
| **TC04** | `POST /api/books/{id}/reviews/`  | Gửi đánh giá khi **chưa đăng nhập** (không có token)                                      | `{"rating": 4, "comment": "Tốt"}`                     | `401 Unauthorized`                                                                            |             `[x]`              | Đạt sau khi sửa BUG-03 |
| **TC05** | `POST /api/books/{id}/reviews/`  | Ràng buộc: User A đánh giá **lần thứ 2** trên cùng 1 cuốn sách                            | `{"rating": 3, "comment": "Đánh giá lại"}`            | `400 Bad Request` (Báo lỗi chỉ được review 1 lần/1 sách)                                      |             `[x]`              | Đạt                    |
| **TC06** | `POST /api/books/{id}/reviews/`  | Validate điểm số: Gửi `rating` ngoài khoảng 1-5 (`0` hoặc `6`)                            | `{"rating": 6, "comment": "Quá đỉnh"}`                | `400 Bad Request` (Báo lỗi rating từ 1 đến 5)                                                 |             `[x]`              | Đạt                    |
| **TC07** | `POST /api/books/{id}/reviews/`  | Kiểm tra tính `average_rating`: User B vào đánh giá 3 sao cho sách (User A đã chấm 5 sao) | `{"rating": 3, "comment": "Tạm ổn"}`                  | `201 Created`, `average_rating` của sách tự động cập nhật thành `(5+3)/2 = 4.0`               |             `[x]`              | Đạt                    |
| **TC08** | `PUT /api/user-reviews/{id}/`    | Chủ sở hữu (User B) tự sửa đánh giá của mình từ 3 sao lên 4 sao                           | `{"rating": 4, "comment": "Đọc kỹ lại thấy khá hay"}` | `200 OK`, `average_rating` của sách tự động cập nhật thành `(5+4)/2 = 4.5`                    |             `[x]`              | Đạt                    |
| **TC09** | `PUT /api/user-reviews/{id}/`    | Phân quyền: User A cố tình sửa review của User B                                          | `review_id` của User B, Token của User A              | `403 Forbidden` (Không có quyền sửa review người khác)                                        |             `[x]`              | Đạt                    |
| **TC10** | `DELETE /api/user-reviews/{id}/` | Phân quyền: User A cố tình xóa review của User B                                          | `review_id` của User B, Token của User A              | `403 Forbidden`                                                                               |             `[x]`              | Đạt                    |
| **TC11** | `DELETE /api/user-reviews/{id}/` | Chủ sở hữu (User B) xóa review của chính mình                                             | `review_id` của User B, Token của User B              | `204 No Content`, review bị xóa, `average_rating` của sách quay về `5.0` (chỉ còn của User A) |             `[x]`              | Đạt                    |
| **TC12** | `DELETE /api/user-reviews/{id}/` | Xóa nốt review cuối cùng của cuốn sách (User A xóa)                                       | `review_id` của User A, Token của User A              | `204 No Content`, `average_rating` của sách về `0.0` (không bị lỗi chia cho 0 hay `None`)     |             `[x]`              | Đạt                    |

**Kết quả Full Regression ngày 07/10/2026:** `12/12` test case đạt, lệnh `python manage.py test userReview` trả về `OK`.

---

## 🐞 6. Nhật ký Lỗi & Cách khắc phục (Bug Tracker Log)

_(Khi test case nào bị `[!]`, ghi chi tiết vào bảng dưới đây để tiện theo dõi và fix)_

| Ngày  | Mã lỗi / Liên kết TC           | Mô tả hiện tượng lỗi (Traceback / Status Code)                                                 | Nguyên nhân gốc (Root Cause)                                                                      | Cách khắc phục (Solution)                                                                         |  Trạng thái  |
| :---- | :----------------------------- | :--------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------ | :----------: |
| 06/10 | _Ví dụ: BUG-01 (TC12)_         | _Lỗi khi xóa hết review của sách thì `average_rating` bị `None` gây lỗi 500_                   | _Hàm `Avg('rating')` trả về `None` khi bảng trống_                                                | _Thêm điều kiện `if stats['avg_rating'] is not None else 0.0` trong `services.py`_                | `[x] Đã fix` |
| 07/10 | BUG-02 (TC03, TC05, TC07-TC12) | `django.db.utils.OperationalError: table userReview_userreview has no column named created_at` | Migration `0001_initial` không tạo hai trường timestamp có trong model                            | Thêm migration `0002_add_review_timestamps_and_rating_validation.py` và chạy lại test database    | `[x] Đã fix` |
| 07/10 | BUG-03 (TC04)                  | `AssertionError: 403 != 401` khi POST review không xác thực                                    | DRF dùng `SessionAuthentication`, trả 403 khi anonymous request không có authentication challenge | Cấu hình `BasicAuthentication` cho `BookReviewListCreateAPIView` để trả 401                       | `[x] Đã fix` |
| 07/10 | BUG-04 (TC01-TC12)             | `CommandError: Conflicting migrations detected; multiple leaf nodes in the migration graph`    | Tồn tại hai file migration `0002` trùng dependency và cùng operations                             | Xóa migration trùng `0002_userreview_rating_timestamps.py`, giữ migration hợp lệ và chạy lại test | `[x] Đã fix` |

---

## 🔄 7. Quy trình làm việc với Git trên nhánh `feature/UserReview`

- Kiểm tra trạng thái file trước khi commit:
  ```bash
  git status
  ```
- Lưu code theo từng mốc nhỏ (Model -> Service -> API -> Test):
  ```bash
  git add .
  git commit -m "feat(UserReview): implement model, service and CRUD endpoints"
  ```
- Cập nhật code mới nhất từ nhánh chính (`main` hoặc `develop`) trước khi tạo Pull Request:
  ```bash
  git fetch origin
  git merge origin/main
  git push -u origin feature/UserReview
  ```
