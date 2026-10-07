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

## Cách setup CSDL
- video hướng dẫn: https://youtu.be/Oa7bpIZ6RxI?si=RY8Qvx6saUQyVfjo
- đặt username và mật khẩu đều là root
- tạo schema tên là eLibDB
- (nếu đặt khác thì chỉnh trong main/main/settings)
- Chạy lệnh sau trong cmd (cd vào folder chứa file mangage.py) để nạp dữ liệu vào mysql: 
1. python magage.py makemigrations
2. python manage.py migrate
3. python manage.py import_data