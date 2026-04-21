import { useState, useEffect, useCallback } from 'react';
import { Building, MapPin, User, Phone, Mail, Users, Plus, Trash2, Search, Pencil, RefreshCw } from 'lucide-react';
import { BoxInfo, Coach } from '../types/box';
import { useBoxManagement } from '../hooks/useBoxManagement';
import { usePageContext } from '../contexts/PageContext';
import { formatPhoneNumber, normalizePhoneNumber } from '../utils/phoneUtils';
import ToastMessage from '../components/ToastMessage';
import { ToastMessageType } from '../types/member';
import { Gradients } from '../constants/gradients';
import { AppColors } from '../constants/colors';

// Daum 우편번호 서비스 타입 정의
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          zonecode: string;
          roadAddress: string;
        }) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

const BoxSettings = () => {
  const { setPageInfo } = usePageContext();
  const {
    boxInfo,
    loading,
    error,
    loadBoxInfo,
    updateBoxInfo,
    clearError
  } = useBoxManagement();

  // 폼 상태
  const [formData, setFormData] = useState<BoxInfo>({
    boxName: '',
    email: '',
    representative: '',
    phone: '',
    address: {
      zoneCode: '',
      roadAddress: '',
      detailAddress: ''
    },
    description: '',
    coaches: []
  });

  // 코치 추가 폼 상태
  const [newCoach, setNewCoach] = useState<Coach>({
    name: '',
    phone: '',
    email: ''
  });

  // UI 상태
  const [isUpdating, setIsUpdating] = useState(false);
  const [createToast, setCreateToast] = useState<((toast: ToastMessageType) => void) | null>(null);

  // 페이지 정보 설정
  useEffect(() => {
    setPageInfo({
      title: '박스 설정',
      subtitle: '박스 정보를 관리하고 수정하세요'
    });
  }, [setPageInfo]);

  // 박스 정보 로드
  useEffect(() => {
    loadBoxInfo();
  }, [loadBoxInfo]);

  // 박스 정보가 로드되면 폼 데이터 설정
  useEffect(() => {
    if (boxInfo) {
      setFormData({
        ...boxInfo,
        phone: normalizePhoneNumber(boxInfo.phone),
        coaches: (boxInfo.coaches || []).map((coach) => ({
          ...coach,
          phone: normalizePhoneNumber(coach.phone)
        }))
      });
    }
  }, [boxInfo]);

  // 에러 처리
  useEffect(() => {
    if (error && createToast) {
      createToast({
        type: 'danger',
        message: error
      });
      clearError();
    }
  }, [error, createToast, clearError]);

  // 폼 데이터 변경 핸들러
  const handleInputChange = useCallback((field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, []);

  // 전화번호 변경 핸들러
  const handlePhoneChange = useCallback((field: string, value: string) => {
    handleInputChange(field, normalizePhoneNumber(value));
  }, [handleInputChange]);

  // 우편번호 검색
  const handlePostcodeSearch = useCallback(() => {
    if (window.daum) {
      new window.daum.Postcode({
        oncomplete: function(data) {
          setFormData(prev => ({
            ...prev,
            address: {
              ...prev.address,
              zoneCode: data.zonecode,
              roadAddress: data.roadAddress
            }
          }));
        }
      }).open();
    } else {
      if (createToast) {
        createToast({
          type: 'danger',
          message: '우편번호 서비스를 불러올 수 없습니다.'
        });
      }
    }
  }, [createToast]);

  // 새 코치 입력 변경
  const handleNewCoachChange = useCallback((field: keyof Coach, value: string) => {
    if (field === 'phone') {
      setNewCoach(prev => ({
        ...prev,
        [field]: normalizePhoneNumber(value)
      }));
    } else {
      setNewCoach(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, []);

  // 코치 추가
  const handleAddCoach = useCallback(() => {
    if (!newCoach.name.trim() || !newCoach.phone.trim() || !newCoach.email.trim()) {
      if (createToast) {
        createToast({
          type: 'danger',
          message: '모든 코치 정보를 입력해주세요.'
        });
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      coaches: [...prev.coaches, { ...newCoach }]
    }));

    setNewCoach({
      name: '',
      phone: '',
      email: ''
    });

    if (createToast) {
      createToast({
        type: 'success',
        message: '코치가 추가되었습니다.'
      });
    }
  }, [newCoach, createToast]);

  // 코치 삭제
  const handleRemoveCoach = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      coaches: prev.coaches.filter((_, i) => i !== index)
    }));

    if (createToast) {
      createToast({
        type: 'success',
        message: '코치가 삭제되었습니다.'
      });
    }
  }, [createToast]);

  // 박스 정보 수정
  const handleUpdate = useCallback(async () => {
    if (!formData.representative.trim()) {
      if (createToast) {
        createToast({
          type: 'danger',
          message: '대표 코치 이름을 입력해주세요.'
        });
      }
      return;
    }

    setIsUpdating(true);
    
    try {
      await updateBoxInfo(formData);
      if (createToast) {
        createToast({
          type: 'success',
          message: '박스 정보가 성공적으로 수정되었습니다.'
        });
      }
    } catch (error) {
      console.error('Failed to update box info', error);
      if (createToast) {
        createToast({
          type: 'danger',
          message: '박스 정보 수정에 실패했습니다.'
        });
      }
    } finally {
      setIsUpdating(false);
    }
  }, [formData, updateBoxInfo, createToast]);

  // 새로고침
  const handleRefresh = useCallback(() => {
    loadBoxInfo();
    if (createToast) {
      createToast({
        type: 'info',
        message: '박스 정보를 새로고침했습니다.'
      });
    }
  }, [loadBoxInfo, createToast]);

  return (
    <div className="dashboard box-settings-page">
      {/* 컨트롤 카드 */}
      <div className="content-card">
        <div className="card-header">
          <div className="header-left">
            <Building size={20} />
            <span>{formData.boxName || '박스 설정'}</span>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              새로고침
            </button>
            <button 
              className="btn btn-outline" 
              onClick={handleUpdate} 
              disabled={isUpdating || loading}
            >
              <Pencil size={16} />
              {isUpdating ? '저장 중...' : '수정'}
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      {loading ? (
        <div className="content-card">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>박스 정보를 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <div className="settings-container">
          {/* 기본 정보 카드 */}
          <div className="content-card">
            <div className="section-header">
              <Building size={18} />
              <h3>기본 정보</h3>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>박스명</label>
                <div className="input-group">
                  <Building size={18} className="input-icon" />
                  <input
                    type="text"
                    value={formData.boxName}
                    readOnly
                    className="form-input readonly"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>이메일</label>
                <div className="input-group">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    className="form-input readonly"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>대표 코치</label>
                <div className="input-group">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="대표 코치 이름을 입력하세요"
                    value={formData.representative}
                    onChange={(e) => handleInputChange('representative', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>연락처</label>
                <div className="input-group">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="'-'를 제외하고 숫자만 입력"
                    value={formatPhoneNumber(formData.phone)}
                    onChange={(e) => handlePhoneChange('phone', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 주소 정보 카드 */}
          <div className="content-card">
            <div className="section-header">
              <MapPin size={18} />
              <h3>주소</h3>
              <button className="btn btn-sm btn-primary" onClick={handlePostcodeSearch}>
                <Search size={14} />
                검색
              </button>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>우편번호</label>
                <input
                  type="text"
                  value={formData.address.zoneCode}
                  readOnly
                  className="form-input readonly"
                />
              </div>

              <div className="form-group full-width">
                <label>도로명 주소</label>
                <input
                  type="text"
                  value={formData.address.roadAddress}
                  readOnly
                  className="form-input readonly"
                />
              </div>

              <div className="form-group full-width">
                <label>상세 주소</label>
                <input
                  type="text"
                  placeholder="상세 주소를 입력하세요"
                  value={formData.address.detailAddress}
                  onChange={(e) => handleInputChange('address.detailAddress', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* 코치진 관리 카드 */}
          <div className="content-card">
            <div className="section-header">
              <Users size={18} />
              <h3>코치진</h3>
            </div>
            
            {/* 코치 추가 폼 */}
            <div className="coach-add-form">
              <div className="form-row">
                <div className="form-group">
                  <label>이름</label>
                  <input
                    type="text"
                    placeholder="코치 이름"
                    value={newCoach.name}
                    onChange={(e) => handleNewCoachChange('name', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>연락처</label>
                  <input
                    type="text"
                    placeholder="01012345678"
                    value={formatPhoneNumber(newCoach.phone)}
                    onChange={(e) => handleNewCoachChange('phone', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>이메일</label>
                  <input
                    type="email"
                    placeholder="이메일"
                    value={newCoach.email}
                    onChange={(e) => handleNewCoachChange('email', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <button className="btn btn-primary add-coach-btn" onClick={handleAddCoach}>
                    <Plus size={16} />
                    추가
                  </button>
                </div>
              </div>
            </div>

            {/* 코치 목록 */}
            {formData.coaches.length > 0 ? (
              <div className="coaches-table">
                <div className="table-header">
                  <div className="table-cell">이름</div>
                  <div className="table-cell">연락처</div>
                  <div className="table-cell">이메일</div>
                  <div className="table-cell">기능</div>
                </div>
                
                {formData.coaches.map((coach, index) => (
                  <div key={index} className="table-row">
                    <div className="table-cell">
                      <div className="coach-name-cell">
                        <div className="coach-avatar">
                          <User size={14} />
                        </div>
                        <span>{coach.name}</span>
                      </div>
                    </div>
                    <div className="table-cell">{formatPhoneNumber(coach.phone)}</div>
                    <div className="table-cell">{coach.email}</div>
                    <div className="table-cell">
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemoveCoach(index)}
                        title="코치 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-coaches">
                <Users size={48} className="empty-icon" />
                <h4>등록된 코치가 없습니다</h4>
                <p>위 폼을 사용하여 코치를 추가해보세요.</p>
              </div>
            )}
          </div>

          {/* 박스 소개 카드 */}
          <div className="content-card">
            <div className="section-header">
              <Building size={18} />
              <h3>박스 소개</h3>
            </div>
            
            <div className="form-group">
              <textarea
                placeholder="박스 소개 문구를 입력하세요"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="form-textarea"
                rows={4}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Messages */}
      <ToastMessage
        onCreateToast={(createToastFn: (toast: ToastMessageType) => void) => setCreateToast(() => createToastFn)}
      />

      <style>{`
        .settings-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: ${Gradients.primary};
          color: white;
          border-radius: 8px 8px 0 0;
          margin: -20px -20px 20px -20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .btn-outline {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 14px;
          padding: 6px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-outline:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .btn-outline:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e5e7eb;
        }

        .section-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          flex: 1;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .input-group {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          z-index: 1;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .input-group .form-input {
          padding-left: 40px;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-input.readonly {
          background-color: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .form-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          min-height: 100px;
          transition: all 0.2s;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .coach-add-form {
          background-color: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 16px;
          align-items: end;
        }

        .add-coach-btn {
          height: 38px;
          margin-top: 22px;
        }

        .box-settings-page .coaches-table {
          width: 100%;
        }

        .box-settings-page .table-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 80px;
          gap: 16px;
          padding: 16px;
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .box-settings-page .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 80px;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          transition: all 0.2s;
        }

        .box-settings-page .table-row:hover {
          background-color: #f9fafb;
        }

        .box-settings-page .table-cell {
          display: flex;
          align-items: center;
          font-size: 14px;
          color: #374151;
        }

        .coach-name-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .coach-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: ${Gradients.primary};
          color: white;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .empty-coaches {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .empty-icon {
          color: #9ca3af;
          margin-bottom: 16px;
        }

        .empty-coaches h4 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 18px;
        }

        .empty-coaches p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }

        .btn-sm {
          padding: 6px 8px;
          font-size: 12px;
        }

        .btn-primary {
          background-color: ${AppColors.primary};
          border-color: ${AppColors.primary};
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: ${AppColors.primary};
          border-color: ${AppColors.primary};
        }

        .btn-danger {
          background-color: #dc2626;
          border-color: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background-color: #b91c1c;
          border-color: #b91c1c;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-container p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .add-coach-btn {
            margin-top: 12px;
          }

          .box-settings-page .table-header,
          .box-settings-page .table-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .box-settings-page .table-cell {
            padding: 8px 0;
          }
        }
      `}</style>
    </div>
  );
};

export default BoxSettings; 
