from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser


class AuthenticationAndProfileTests(APITestCase):

    def setUp(self):
        # Đường dẫn tới các API (giả sử bạn đã đặt name trong urls.py, 
        # hoặc bạn có thể thay thế trực tiếp bằng chuỗi đường dẫn như '/api/auth/register/')
        self.register_url = "/api/auth/register/"
        self.login_url = "/api/auth/login/"
        self.token_refresh_url = "/api/auth/token/refresh/"
        self.logout_url = "/api/auth/logout/"
        self.profile_url = "/api/users/profile/"

        # Dữ liệu mẫu dùng cho đăng ký và đăng nhập
        self.user_data = {
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
        }
        
        # Tạo sẵn một user trong database cho các test cần đăng nhập trước
        self.user = CustomUser.objects.create_user(
            username="existinguser",
            email="existing@example.com",
            password="Password123@",
            bio="Hello World"
        )

    # ==================== 1. TEST REGISTER ====================
    def test_register_success(self):
        """Kiểm thử đăng ký tài khoản mới thành công và trả về tokens."""
        response = self.client.post(self.register_url, self.user_data, format="json")

        # # IN RA LỖI ĐỂ XEM DRF ĐANG BÁO GÌ
        # print("\n--- DEBUG REGISTER ERROR ---")
        # print(response.data)
        # print("----------------------------")
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertEqual(response.data["user"]["username"], self.user_data["username"])
        
        # Kiểm tra user đã được lưu vào DB
        self.assertTrue(CustomUser.objects.filter(username=self.user_data["username"]).exists())

    def test_register_missing_fields(self):
        """Kiểm thử đăng ký thất bại khi thiếu thông tin bắt buộc."""
        incomplete_data = {"username": "incomplete"}
        response = self.client.post(self.register_url, incomplete_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ==================== 2. TEST LOGIN ====================
    def test_login_success(self):
        """Kiểm thử đăng nhập thành công với thông tin hợp lệ."""
        login_data = {
            "username": "existinguser",
            "password": "Password123@",
        }
        response = self.client.post(self.login_url, login_data, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_wrong_password(self):
        """Kiểm thử đăng nhập thất bại khi sai mật khẩu."""
        login_data = {
            "username": "existinguser",
            "password": "WrongPassword!",
        }
        response = self.client.post(self.login_url, login_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================== 3. TEST TOKEN REFRESH ====================
    def test_token_refresh_success(self):
        """Kiểm thử cấp lại Access Token mới từ Refresh Token."""
        # Tạo refresh token hợp lệ cho user có sẵn
        refresh = RefreshToken.for_user(self.user)
        
        response = self.client.post(
            self.token_refresh_url, 
            {"refresh": str(refresh)}, 
            format="json"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    # ==================== 4. TEST LOGOUT ====================
    def test_logout_success(self):
        """Kiểm thử đăng xuất (đưa refresh token vào blacklist)."""
        # Xác thực user bằng JWT để gọi API yêu cầu IsAuthenticated
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        
        response = self.client.post(
            self.logout_url, 
            {"refresh": str(refresh)}, 
            format="json"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Thử dùng lại refresh token đó để lấy access token mới -> Phải thất bại (do đã bị blacklist)
        refresh_response = self.client.post(
            self.token_refresh_url, 
            {"refresh": str(refresh)}, 
            format="json"
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_unauthenticated(self):
        """Kiểm thử đăng xuất thất bại khi chưa đăng nhập (không có Access Token)."""
        response = self.client.post(self.logout_url, {"refresh": "some_token"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================== 5. TEST GET PROFILE ====================
    def test_get_profile_success(self):
        """Kiểm thử lấy thông tin cá nhân thành công khi đã đăng nhập."""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        
        response = self.client.get(self.profile_url, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.user.username)
        self.assertEqual(response.data["bio"], self.user.bio)

    def test_get_profile_unauthenticated(self):
        """Kiểm thử từ chối truy cập profile khi chưa đăng nhập."""
        response = self.client.get(self.profile_url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================== 6. TEST UPDATE PROFILE (PUT/PATCH) ====================
    def test_update_profile_put(self):
        """Kiểm thử cập nhật toàn bộ profile bằng phương thức PUT."""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        
        update_data = {
            "username": "existinguser",
            "email": "newemail@example.com",
            "bio": "Updated bio text via PUT"
        }
        response = self.client.put(self.profile_url, update_data, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["bio"], "Updated bio text via PUT")
        self.assertEqual(response.data["email"], "newemail@example.com")

    def test_update_profile_patch(self):
        """Kiểm thử cập nhật một phần profile bằng phương thức PATCH."""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        
        patch_data = {
            "bio": "Only updating bio via PATCH"
        }
        response = self.client.patch(self.profile_url, patch_data, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["bio"], "Only updating bio via PATCH")
        # Đảm bảo các trường khác không bị mất
        self.assertEqual(response.data["username"], self.user.username)