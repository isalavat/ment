import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info" | "success";
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = "warning",
}) => {
  const { t } = useLanguage();
  const resolvedConfirmText = confirmText ?? t.common.confirm;
  const resolvedCancelText = cancelText ?? t.common.cancel;

  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-dialog-header confirm-dialog-header-${type}`}>
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>
        <div className="confirm-dialog-body">
          <p>{message}</p>
        </div>
        <div className="confirm-dialog-footer">
          <button className="btn btn-outline" onClick={onCancel}>
            {resolvedCancelText}
          </button>
          <button
            className={`btn ${
              type === "danger" ? "btn-danger" : "btn-primary"
            }`}
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {resolvedConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
