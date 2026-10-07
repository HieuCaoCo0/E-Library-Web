# E-Library-Web

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