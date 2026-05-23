import React, { useState, useEffect, useCallback } from 'react';
import { ToastMessageProps, ToastMessage as ToastMessageType } from '../types/class';

const ToastMessage = ({ onCreateToast }: ToastMessageProps) => {
  const [toasts, setToasts] = useState<ToastMessageType[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const createToast = useCallback((toast: Omit<ToastMessageType, 'id'>) => {
    const newToast: ToastMessageType = {
      ...toast,
      id: Date.now().toString(),
    };
    setToasts(prev => [...prev, newToast]);

    // 3초 후 자동 제거
    setTimeout(() => {
      removeToast(newToast.id);
    }, 3000);
  }, [removeToast]);

  useEffect(() => {
    onCreateToast(createToast);
  }, [onCreateToast, createToast]);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="toast-content">
            {toast.message}
          </div>
          <button
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
          >
            ×
          </button>
        </div>
      ))}

      <style>{`
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .toast {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 300px;
          max-width: 500px;
        }

        .toast:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .toast-success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .toast-danger {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .toast-warning {
          background-color: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .toast-info {
          background-color: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .toast-content {
          flex: 1;
          font-weight: 500;
        }

        .toast-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          margin-left: 10px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .toast-close:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default ToastMessage; 