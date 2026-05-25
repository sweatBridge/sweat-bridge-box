import { DollarSign, Calendar, FileText, User } from 'lucide-react';

interface RefundInfoModalProps {
  visible: boolean;
  refundAt: Date;
  refundAmount: number;
  reason: string;
  assignee: string | null;
  membershipPlan: string;
  onClose: () => void;
}

const RefundInfoModal = ({
  visible,
  refundAt,
  refundAmount,
  reason,
  assignee,
  membershipPlan,
  onClose
}: RefundInfoModalProps) => {
  if (!visible) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content refund-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <DollarSign size={20} className="header-icon" />
            <h3>환불 정보</h3>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="refund-badge">
            환불 완료
          </div>

          <div className="membership-info">
            <div className="info-label">플랜</div>
            <div className="info-value">{membershipPlan}</div>
          </div>

          <div className="refund-details">
            <div className="detail-item">
              <div className="detail-icon">
                <Calendar size={16} />
              </div>
              <div className="detail-content">
                <span className="detail-label">환불 일시</span>
                <span className="detail-value">{formatDate(refundAt)}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <DollarSign size={16} />
              </div>
              <div className="detail-content">
                <span className="detail-label">환불 금액</span>
                <span className="detail-value price">{refundAmount.toLocaleString()}원</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <FileText size={16} />
              </div>
              <div className="detail-content">
                <span className="detail-label">환불 사유</span>
                <span className="detail-value">{reason}</span>
              </div>
            </div>

            {assignee && (
              <div className="detail-item">
                <div className="detail-icon">
                  <User size={16} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">담당자</span>
                  <span className="detail-value">{assignee}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          overflow-y: auto;
        }

        .refund-info-modal {
          max-width: 450px;
          width: 95%;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          box-shadow: 0 2px 10px rgba(249, 115, 22, 0.15);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon {
          color: white;
          opacity: 0.9;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: white;
          opacity: 0.8;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
          opacity: 1;
          transform: scale(1.1);
        }

        .modal-body {
          padding: 20px;
        }

        .refund-badge {
          display: inline-block;
          padding: 8px 16px;
          background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
          border: 1px solid #fb923c;
          border-radius: 20px;
          color: #7c2d12;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .membership-info {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          text-align: center;
        }

        .info-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .refund-details {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .detail-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
          border: 1px solid #fdba74;
          border-radius: 8px;
        }

        .detail-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: white;
          border-radius: 50%;
          color: #f97316;
          flex-shrink: 0;
        }

        .detail-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .detail-label {
          font-size: 12px;
          font-weight: 500;
          color: #7c2d12;
        }

        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #9a3412;
        }

        .detail-value.price {
          font-size: 18px;
          color: #f97316;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          border: 1px solid;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }

        .btn-secondary {
          background-color: #ffffff;
          border-color: #d1d5db;
          color: #374151;
        }

        .btn-secondary:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default RefundInfoModal;

