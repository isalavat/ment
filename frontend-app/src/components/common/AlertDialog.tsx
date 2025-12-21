import React from "react";
import "./ConfirmDialog.css";

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onClose: () => void;
  type?: "danger" | "warning" | "info" | "success";
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = "OK",
  onClose,
  type = "info",
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onClose}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-dialog-header confirm-dialog-header-${type}`}>
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>
        <div className="confirm-dialog-body">
          <p>{message}</p>
        </div>
        <div className="confirm-dialog-footer">
          <button
            className="btn btn-primary"
            onClick={onClose}
            style={{ width: "100px" }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
