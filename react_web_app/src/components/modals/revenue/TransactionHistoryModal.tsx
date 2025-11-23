import { Calendar, CreditCard } from 'lucide-react';
import { RevenueData } from '../../../types/revenue';
import { Gradients } from '../../../constants/gradients';

interface TransactionHistoryModalProps {
  visible: boolean;
  transactions: RevenueData[];
  selectedDate: Date;
  onClose: () => void;
}

const TransactionHistoryModal = ({
  visible,
  transactions,
  selectedDate,
  onClose
}: TransactionHistoryModalProps) => {
  if (!visible) return null;

  // 회원권 타입 텍스트
  const getMembershipTypeText = (type: string) => {
    if (type === 'periodPass') return '장기 회원권';
    if (type === 'countPass') return '횟수권';
    return '기타';
  };

  // 회원권 기간 텍스트 (plan에서 추출)
  const getMembershipDuration = (plan: string) => {
    return plan || '회원권';
  };

  const formattedDate = selectedDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content transaction-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Calendar size={20} className="header-icon" />
            <h3>거래 내역</h3>
            <span className="header-date">{formattedDate}</span>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {transactions.length === 0 ? (
            <div className="empty-state">
              <CreditCard size={48} className="empty-icon" />
              <h4>거래 내역이 없습니다</h4>
              <p>선택한 날짜에 등록된 거래가 없습니다.</p>
            </div>
          ) : (
            <div className="transaction-cards">
              {transactions.map((transaction, index) => {
                const transactionDate = transaction.createdAt?.toDate?.() || new Date(transaction.createdAt || 0);
                const transactionDateStr = transactionDate.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
                
                const price = parseInt(transaction.price) || 0;
                const refundAmount = parseInt(transaction.refundAmount) || 0;
                const isCash = transaction.paymentType === 'cash';
                const isRefunded = refundAmount > 0;
                
                return (
                  <div key={index} className={`transaction-card ${isRefunded ? 'refunded' : ''}`}>
                    <div className="transaction-card-header">
                      <div className="transaction-member-name">{transaction.realName}</div>
                      <div className={`transaction-price ${isCash ? 'cash' : 'card'}`}>
                        {price.toLocaleString()}원
                      </div>
                    </div>
                    <div className="transaction-card-body">
                      <div className="transaction-info">
                        <div className="transaction-plan">{getMembershipDuration(transaction.plan)}</div>
                        <div className="transaction-date">{transactionDateStr}</div>
                        <div className="transaction-type">{getMembershipTypeText(transaction.type)}</div>
                        {isRefunded && (
                          <div className="transaction-refund">
                            <span className="refund-label">환불액:</span>
                            <span className="refund-amount">{refundAmount.toLocaleString()}원</span>
                          </div>
                        )}
                      </div>
                      <div className="transaction-payment-buttons">
                        <button className={`payment-button ${transaction.paymentType === 'cash' ? 'active cash' : 'cash'}`}>
                          현금
                        </button>
                        <button className={`payment-button ${transaction.paymentType === 'card' ? 'active card' : 'card'}`}>
                          카드
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

          .transaction-modal {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            max-width: 600px;
            width: 95%;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            background: ${Gradients.primary};
            color: white;
            border-bottom: none;
          }

          .header-title {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
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

          .header-date {
            margin-left: 12px;
            font-size: 14px;
            opacity: 0.9;
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
            padding: 24px;
            overflow-y: auto;
            flex: 1;
          }

          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
            color: #6b7280;
          }

          .empty-icon {
            margin-bottom: 16px;
            color: #9ca3af;
          }

          .empty-state h4 {
            margin: 0 0 8px 0;
            color: #374151;
            font-size: 16px;
          }

          .empty-state p {
            margin: 0;
            font-size: 14px;
          }

          .transaction-cards {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .transaction-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            transition: all 0.2s;
          }

          .transaction-card:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .transaction-card.refunded {
            border-left: 4px solid #dc2626;
            background: #fef2f2;
          }

          .transaction-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .transaction-member-name {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
          }

          .transaction-price {
            font-size: 18px;
            font-weight: 700;
          }

          .transaction-price.cash {
            color: #3b82f6; /* 파란색 */
          }

          .transaction-price.card {
            color: #10b981; /* 초록색 */
          }

          .transaction-card-body {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }

          .transaction-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .transaction-plan {
            font-size: 14px;
            font-weight: 500;
            color: #374151;
          }

          .transaction-date {
            font-size: 13px;
            color: #6b7280;
          }

          .transaction-type {
            font-size: 13px;
            color: #6b7280;
          }

          .transaction-refund {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 4px;
            padding: 4px 8px;
            background: #fee2e2;
            border-radius: 4px;
            width: fit-content;
          }

          .refund-label {
            font-size: 12px;
            color: #991b1b;
            font-weight: 500;
          }

          .refund-amount {
            font-size: 12px;
            color: #dc2626;
            font-weight: 700;
          }

          .transaction-payment-buttons {
            display: flex;
            gap: 8px;
          }

          .payment-button {
            padding: 6px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            font-size: 12px;
            font-weight: 500;
            color: #6b7280;
            cursor: default;
            transition: all 0.2s;
          }

          .payment-button.active.cash {
            background: #3b82f6;
            border-color: #3b82f6;
            color: white;
          }

          .payment-button.active.card {
            background: #10b981;
            border-color: #10b981;
            color: white;
          }

          .payment-button:not(.active) {
            background: #f3f4f6;
            color: #9ca3af;
          }
        `}</style>
      </div>
    </div>
  );
};

export default TransactionHistoryModal;

