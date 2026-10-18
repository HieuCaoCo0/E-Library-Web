from .models import UserBookStatus


def get_user_library(user, status=None):
    qs = UserBookStatus.objects.filter(user=user).order_by("-id")
    if status:
        qs = qs.filter(status=status)
    return qs

def add_or_update_book(user, book, status):
    """Mỗi user chỉ có 1 trạng thái cho 1 cuốn sách:
    chưa có thì tạo mới, có rồi thì cập nhật."""
    obj, created = UserBookStatus.objects.update_or_create(
        user=user,
        book=book,
        defaults={"status": status},
    )
    return obj, created