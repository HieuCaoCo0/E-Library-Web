from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView  # Thêm dòng này để dùng chức năng chuyển hướng

admin.site.site_header = "Book Admin"
admin.site.site_title = "Quản trị Book Admin"
admin.site.index_title = "Bảng điều khiển hệ thống"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', include('users.urls')),

    # Thêm dòng này: Khi vào trang chủ (''), tự động chuyển sang trang đăng nhập
    path('', RedirectView.as_view(url='/users/login/', permanent=True)),
]