// frontend/src/components/common/ConfirmDialog.jsx
import React, { useEffect } from 'react';
import {
  TrashIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  AppIcon,
} from '../ui/icons';
import AccessibleClickable from './AccessibleClickable';
import { useTranslation } from '../../context/LanguageContext';

const ConfirmDialog = ({ 
  open, 
  title, 
  content, 
  onConfirm, 
  onCancel,
  confirmText,
  cancelText,
  type = 'warning'
}) => {
  const { t } = useTranslation();
  const resolvedConfirmText = confirmText ?? t('common.confirm');
  const resolvedCancelText = cancelText ?? t('common.cancel');
  
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && open) {
        onCancel();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onCancel]);

  if (!open) return null;

  const getTypeColors = () => {
    switch (type) {
      case 'danger':
        return {
          Icon: TrashIcon,
          iconBg: '#fee',
          iconColor: '#f44336',
          confirmBg: '#f44336',
          confirmHover: '#d32f2f'
        };
      case 'info':
        return {
          Icon: InformationCircleIcon,
          iconBg: '#e3f2fd',
          iconColor: '#2196f3',
          confirmBg: '#2196f3',
          confirmHover: '#1976d2'
        };
      case 'success':
        return {
          Icon: CheckCircleIcon,
          iconBg: '#e8f5e9',
          iconColor: '#4caf50',
          confirmBg: '#4caf50',
          confirmHover: '#45a049'
        };
      default:
        return {
          Icon: ExclamationTriangleIcon,
          iconBg: '#fff3e0',
          iconColor: '#ff9800',
          confirmBg: '#ff9800',
          confirmHover: '#f57c00'
        };
    }
  };

  const colors = getTypeColors();
  const DialogIcon = colors.Icon;

  return (
    <AccessibleClickable
      className="confirm-dialog-overlay"
      onClick={onCancel}
      ariaLabel={t('common.closeDialog')}
    >
      <style>{`
        .confirm-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .confirm-dialog {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 450px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease;
          overflow: hidden;
        }
        .dark .confirm-dialog {
          background: #0f172a;
          border: 1px solid #334155;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        @keyframes slideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .confirm-dialog-header {
          padding: 24px 24px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .confirm-icon {
          width: 48px;
          height: 48px;
          background: ${colors.iconBg};
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          color: ${colors.iconColor};
        }
        .confirm-title {
          font-size: 20px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0;
        }
        .dark .confirm-title {
          color: #f1f5f9;
        }
        .confirm-dialog-content {
          padding: 0 24px 24px;
        }
        .confirm-message {
          color: #555;
          line-height: 1.5;
          margin: 0;
          font-size: 15px;
        }
        .dark .confirm-message {
          color: #94a3b8;
        }
        .confirm-dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px 24px;
          border-top: 1px solid #eee;
          background: #fafafa;
        }
        .dark .confirm-dialog-actions {
          border-top-color: #334155;
          background: #1e293b;
        }
        .btn-cancel {
          padding: 10px 20px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #666;
        }
        .btn-cancel:hover {
          background: #f5f5f5;
          border-color: #ccc;
        }
        .dark .btn-cancel {
          background: #1f2937;
          border-color: #475569;
          color: #cbd5e1;
        }
        .dark .btn-cancel:hover {
          background: #273449;
          border-color: #64748b;
        }
        .btn-confirm {
          padding: 10px 24px;
          background: ${colors.confirmBg};
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          color: white;
        }
        .btn-confirm:hover {
          background: ${colors.confirmHover};
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .btn-confirm:active {
          transform: translateY(0);
        }
        @media (max-width: 480px) {
          .confirm-dialog {
            width: 95%;
          }
          .confirm-dialog-header {
            padding: 20px 20px 12px;
          }
          .confirm-icon {
            width: 40px;
            height: 40px;
          }
          .confirm-title {
            font-size: 18px;
          }
          .confirm-dialog-content {
            padding: 0 20px 20px;
          }
          .confirm-dialog-actions {
            padding: 12px 20px 20px;
          }
          .btn-cancel, .btn-confirm {
            padding: 8px 16px;
          }
        }
      `}</style>
      
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <div className="confirm-icon">
            <AppIcon icon={DialogIcon} size="lg" />
          </div>
          <h3 className="confirm-title">{title}</h3>
        </div>
        
        <div className="confirm-dialog-content">
          <p className="confirm-message">{content}</p>
        </div>
        
        <div className="confirm-dialog-actions">
          <button className="btn-cancel" onClick={onCancel}>
            {resolvedCancelText}
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            {resolvedConfirmText}
          </button>
        </div>
      </div>
    </AccessibleClickable>
  );
};

export default ConfirmDialog;
