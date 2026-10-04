import json
import os
import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def crawl_books(page_start, page_end, keyword):
    # Định nghĩa đường dẫn

    # output_dir = os.path.join("E-Library-Web", "main","dataScraper", "data")
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.abspath(os.path.join(current_dir, "..", "data"))
    os.makedirs(output_dir, exist_ok=True)  # Tự động tạo thư mục
    output_file = os.path.join(output_dir, "books.json")
    # output_file = os.path.join(output_dir, "exmaple2.json")

    # Cấu hình Selenium WebDriver
    options = Options()
    # options.add_argument("--headless")  # Bỏ comment nếu muốn chạy ẩn trình duyệt
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")  
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )

    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()), options=options
    )

    books_list = []

    try:
        for page in range(page_start, page_end + 1):
        # for page in range(1, 2):
            formatted_keyword = keyword.replace(" ", "+")
            url = f"https://www.goodreads.com/list/show/{formatted_keyword}?page={page}"
            # if page == 1:
            #     url = f"https://www.goodreads.com/list/show/{formatted_keyword}"

            print(f"Crawling with keyword: '{keyword}' - Page {page}: {url}")
            driver.get(url)
            time.sleep(4)  # Đợi trang danh sách tải xong

            soup = BeautifulSoup(driver.page_source, "html.parser")
            book_rows = soup.select("tr[itemtype='http://schema.org/Book']")

            if not book_rows:
                print(f"Cannot find book at page {page} for keyword '{keyword}'")
                break

            # Lấy danh sách link chi tiết sách trên trang hiện tại
            book_links = []
            for row in book_rows:
                # if len(book_links) == 3: break

                link_tag = row.select_one("a.bookTitle")
                if link_tag and link_tag.has_attr("href"):
                    full_link = "https://www.goodreads.com" + link_tag["href"]
                    book_links.append(full_link)

            print(f"Tìm thấy {len(book_links)} sách ở trang {page}. Đang cào chi tiết...")

            # Duyệt qua từng link để lấy thông tin chi tiết
            for link in book_links:
                try:
                    driver.get(link)
                    time.sleep(3)  # Đợi trang chi tiết tải xong

                    detail_soup = BeautifulSoup(driver.page_source, "html.parser")

                    # 1. Tên sách
                    title_tag = detail_soup.select_one("h1[data-testid='bookTitle']")
                    title = title_tag.get_text(strip=True) if title_tag else "N/A"

                    # 2. Tác giả
                    author_tag = detail_soup.select_one("span.ContributorLink__name, span[data-testid='name']")
                    author = author_tag.get_text(strip=True) if author_tag else "N/A"

                    # 3. Rating trung bình
                    rating_tag = detail_soup.select_one("div.RatingStatistics__rating, div[data-testid='ratingScore']")
                    rating = rating_tag.get_text(strip=True) if rating_tag else "N/A"

                    # 4. Ảnh bìa
                    img_tag = detail_soup.select_one("img.ResponsiveImage, div.BookCover__image img")
                    cover_image = img_tag["src"] if img_tag and img_tag.has_attr("src") else "N/A"

                    # 5. Mô tả

                    # desc_tag = detail_soup.select_one("div.BookPageMetadataSection__description div.Formatted")
                    desc_tag = detail_soup.select_one(
                        "div[data-testid='description'] div.Formatted, div.BookPageMetadataSection__description div.Formatted, div[data-testid='description']"
                        )
                    description = desc_tag.get_text(separator=" ", strip=True) if desc_tag else "N/A"

                    # 6. Số trang & Năm phát hành
                    pages = "N/A"
                    publish_date = "N/A"
                    
                    details_info = detail_soup.select("p[data-testid='pagesFormat']")
                    if details_info:
                        text_info = details_info[0].get_text()
                        if "pages" in text_info:
                            pages = text_info.split("pages")[0].strip()

                    pub_tag = detail_soup.select_one("p[data-testid='publicationInfo']")
                    if pub_tag:
                        publish_date = pub_tag.get_text(strip=True)

                    # 7. Thể loại (Genres)
                    genres = []
                    genre_tags = detail_soup.select("span.BookPageMetadataSection__genreButton")
                    for g in genre_tags:
                        genre_text = g.get_text(strip=True)
                        if genre_text and genre_text not in genres:
                            genres.append(genre_text)

                    # Gom nhóm dữ liệu
                    book_item = {
                        "title": title,
                        "author": author,
                        "rating": rating,
                        "cover_image": cover_image,
                        "description": description,
                        "pages": pages,
                        "publish_date": publish_date,
                        "genres": genres,
                        "source_url": link
                    }
                    books_list.append(book_item)
                    print(f"Đã lấy xong dữ liệu của '{title}'")

                except Exception as e:
                    print(f"Lỗi khi cào link {link}: {e}")

            time.sleep(2)  # Nghỉ giữa các trang

    except Exception as e:
        print(f"Đã xảy ra lỗi chung: {e}")
    finally:
        # Đóng trình duyệt
        driver.quit()

        # Lưu toàn bộ danh sách vào file JSON
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(books_list, f, ensure_ascii=False, indent=4)
        
        print(f"Hoàn thành! Đã lưu tổng cộng {len(books_list)} cuốn sách vào: {output_file}")

if __name__ == "__main__":
    crawl_books(page_start=1, page_end=3, keyword="1.Best_Books_Ever")