from django.shortcuts import render, redirect, get_object_or_404
from .models import Book


def login_view(request):
    return render(request, 'users/login.html')


def register_view(request):
    return render(request, 'users/register.html')

def custom_admin_view(request):
    books = Book.objects.all()
    return render(request, 'users/admin_dashboard.html', {'books': books})

def delete_book(request, id):
    book = get_object_or_404(Book, id=id)
    book.delete()
    return redirect('custom_admin')


def edit_book(request, id):
    book = get_object_or_404(Book, id=id)

    if request.method == "POST":
        book.title = request.POST.get('title')
        book.author = request.POST.get('author')
        book.save()
        return redirect('custom_admin')

    return render(request, 'users/edit_book.html', {'book': book})