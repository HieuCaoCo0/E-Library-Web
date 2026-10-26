import { useEffect } from "react";
import styles from "./ConfirmModal.module.css";

/**
 * Component Popup Xác Nhận Dùng Chung (ConfirmModal)
 * Thay thế hoàn toàn dialog window.confirm() mặc định của trình duyệt với giao diện đồng bộ E-Library.
 *
 * @param {boolean} isOpen - Trạng thái hiển thị modal
 * @param {function} onClose - Hàm gọi khi đóng modal hoặc bấm Hủy
 * @param {function} onConfirm - Hàm gọi khi người dùng bấm nút Xác nhận
 * @param {string} title - Tiêu đề hộp thoại xác nhận
 * @param {string|React.ReactNode} message - Nội dung câu hỏi/cảnh báo xác nhận
 * @param {string} confirmText - Nhãn nút xác nhận (Mặc định: "Yes, Confirm")
 * @param {string} cancelText - Nhãn nút hủy bỏ (Mặc định: "Cancel")
 * @param {"danger" | "warning"} type - Giao diện nguy hiểm (đỏ) hoặc cảnh báo (cam)
 * @param {boolean} isLoading - Trạng thái đang xử lý API (vô hiệu hóa các nút)
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmText = "Yes, Confirm",
  cancelText = "Cancel",
  type = "danger",
  isLoading = false,
}) {
  // Lắng nghe phím Escape để đóng popup và khóa cuộn trang (body scroll lock) khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={() => {
        if (!isLoading) onClose();
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div
            className={`${styles.iconWrapper} ${
              type === "danger" ? styles.dangerIcon : styles.warningIcon
            }`}
          >
            {type === "danger" ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <h3 id="confirm-modal-title" className={styles.title}>
            {title}
          </h3>
        </div>

        <div id="confirm-modal-desc" className={styles.body}>
          {message}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

