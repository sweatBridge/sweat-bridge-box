import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Gradients } from '../../../constants/gradients';
import { X, UserPlus, Search } from 'lucide-react';
import { MemberService } from '../../../services/memberService';
import DateInput from '../../DateInput';
import { format } from 'date-fns';

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

type SearchType = 'email' | 'phone' | 'realName' | 'nickName';

const AddMemberModal = ({ visible, onClose, onSuccess, onError }: AddMemberModalProps) => {
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('email');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // 폼 상태 (수동 입력)
  const [formData, setFormData] = useState({
    email: '',
    realName: '',
    nickName: '',
    phone: '',
    gender: 'M' as 'M' | 'F'
  });
  const [birthDate, setBirthDate] = useState<Date | null>(null);

  const [isManualMode, setIsManualMode] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      if (onError) onError('검색어를 입력하세요.');
      return;
    }

    try {
      setLoading(true);
      let results: any[] = [];

      switch (searchType) {
        case 'email':
          const userByEmail = await MemberService.getUserByEmail(searchValue);
          if (userByEmail) results = [userByEmail];
          break;
        case 'phone':
          const userByPhone = await MemberService.getUserByPhone(searchValue);
          if (userByPhone) results = [userByPhone];
          break;
        case 'realName':
          results = await MemberService.getUserByRealName(searchValue);
          break;
        case 'nickName':
          results = await MemberService.getUserByNickName(searchValue);
          break;
      }

      setSearchResults(results);

      if (results.length === 0) {
        if (onError) onError('검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('Search error:', error);
      if (onError) onError('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setShowConfirmation(true);
  };

  const handleConfirmAdd = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      const boxName = localStorage.getItem('boxName') || '';

      // 기존 boxName 확인 및 처리
      let boxPlaceholder = selectedUser.boxName;
      selectedUser.boxName = boxName;

      // memberships 필드가 있으면 제거
      if (selectedUser.hasOwnProperty('memberships')) {
        delete selectedUser.memberships;
      }

      // 가입일 추가
      selectedUser.joinedAt = Timestamp.now();

      // user 도큐먼트 업데이트
      await MemberService.updateUser(selectedUser.email, selectedUser);

      // 신청자 목록에서 제거 (? 로 시작하는 경우)
      if (boxPlaceholder?.startsWith('?')) {
        await MemberService.removeApplication(selectedUser.email, boxPlaceholder.slice(1));
      }

      // member 도큐먼트 생성
      await MemberService.createMember(boxName, selectedUser);

      if (onSuccess) {
        onSuccess('회원이 성공적으로 추가되었습니다.');
      }

      // 모달 초기화 및 닫기
      resetModal();
      onClose();
    } catch (error) {
      console.error('Failed to add member:', error);
      if (onError) {
        onError('회원 추가에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async () => {
    // 유효성 검사
    if (!formData.email.trim()) {
      if (onError) onError('이메일을 입력하세요.');
      return;
    }
    if (!formData.realName.trim()) {
      if (onError) onError('이름을 입력하세요.');
      return;
    }
    if (!formData.nickName.trim()) {
      if (onError) onError('닉네임을 입력하세요.');
      return;
    }
    if (!formData.phone.trim()) {
      if (onError) onError('전화번호를 입력하세요.');
      return;
    }
    if (!birthDate) {
      if (onError) onError('생년월일을 입력하세요.');
      return;
    }

    try {
      setLoading(true);
      const boxName = localStorage.getItem('boxName') || '';

      const memberData = {
        ...formData,
        birthDate: format(birthDate, 'yyyy-MM-dd'),
        boxName: boxName,
        joinedAt: Timestamp.now()
      };

      await MemberService.createMember(boxName, memberData);

      if (onSuccess) {
        onSuccess('회원이 성공적으로 추가되었습니다.');
      }

      resetModal();
      onClose();
    } catch (error) {
      console.error('Failed to add member manually:', error);
      if (onError) {
        onError('회원 추가에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setSearchValue('');
    setSearchResults([]);
    setSelectedUser(null);
    setShowConfirmation(false);
    setIsManualMode(false);
    setFormData({
      email: '',
      realName: '',
      nickName: '',
      phone: '',
      gender: 'M'
    });
    setBirthDate(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <UserPlus size={20} />
            회원 추가
          </h2>
          <button className="close-button" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* 모드 선택 버튼 */}
          <div className="mode-selector">
            <button
              className={`mode-btn ${!isManualMode ? 'active' : ''}`}
              onClick={() => {
                setIsManualMode(false);
                setShowConfirmation(false);
              }}
            >
              검색하여 추가
            </button>
            <button
              className={`mode-btn ${isManualMode ? 'active' : ''}`}
              onClick={() => {
                setIsManualMode(true);
                setSearchResults([]);
                setShowConfirmation(false);
              }}
            >
              직접 입력
            </button>
          </div>

          {!isManualMode ? (
            // 검색 모드
            <>
              {!showConfirmation ? (
                <>
                  <div className="search-section">
                    <div className="form-row">
                      <div className="form-group">
                        <label>검색 타입</label>
                        <select
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value as SearchType)}
                          className="form-select"
                        >
                          <option value="email">이메일</option>
                          <option value="phone">전화번호</option>
                          <option value="realName">이름</option>
                          <option value="nickName">닉네임</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>검색어</label>
                        <input
                          type="text"
                          placeholder={`${searchType === 'email' ? '이메일' : searchType === 'phone' ? '전화번호' : searchType === 'realName' ? '이름' : '닉네임'}을(를) 입력하세요`}
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          className="form-input"
                        />
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={handleSearch}
                        disabled={loading}
                        style={{ marginTop: '24px' }}
                      >
                        <Search size={16} />
                        검색
                      </button>
                    </div>
                  </div>

                  {/* 검색 결과 */}
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      <h3>검색 결과</h3>
                      <div className="results-table">
                        <div className="table-header">
                          <div className="table-cell">이름</div>
                          <div className="table-cell">닉네임</div>
                          <div className="table-cell">이메일</div>
                          <div className="table-cell">전화번호</div>
                          <div className="table-cell">선택</div>
                        </div>
                        {searchResults.map((user, index) => (
                          <div key={index} className="table-row">
                            <div className="table-cell">{user.realName}</div>
                            <div className="table-cell">{user.nickName}</div>
                            <div className="table-cell">{user.email}</div>
                            <div className="table-cell">{user.phone}</div>
                            <div className="table-cell">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleSelectUser(user)}
                              >
                                선택
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // 확인 화면
                <div className="confirmation-section">
                  <h3>회원 추가 확인</h3>
                  <div className="confirmation-content">
                    <p>
                      <strong>{selectedUser?.realName}</strong> 님을 추가하시겠습니까?
                    </p>
                    <div className="user-info">
                      <div className="info-row">
                        <span className="info-label">이메일:</span>
                        <span className="info-value">{selectedUser?.email}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">닉네임:</span>
                        <span className="info-value">{selectedUser?.nickName}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">전화번호:</span>
                        <span className="info-value">{selectedUser?.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="confirmation-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowConfirmation(false)}
                    >
                      취소
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleConfirmAdd}
                      disabled={loading}
                    >
                      <UserPlus size={16} />
                      확인
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            // 수동 입력 모드
            <div className="manual-form">
              <div className="form-row">
                <div className="form-group">
                  <label>이메일 *</label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>이름 *</label>
                  <input
                    type="text"
                    placeholder="홍길동"
                    value={formData.realName}
                    onChange={(e) => handleInputChange('realName', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>닉네임 *</label>
                  <input
                    type="text"
                    placeholder="닉네임"
                    value={formData.nickName}
                    onChange={(e) => handleInputChange('nickName', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>전화번호 *</label>
                  <input
                    type="tel"
                    placeholder="010-1234-5678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>성별 *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="form-select"
                  >
                    <option value="M">남성</option>
                    <option value="F">여성</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>생년월일 *</label>
                  <DateInput
                    selected={birthDate}
                    onChange={(date) => setBirthDate(date)}
                    placeholder="생년월일 선택"
                    isBirthDate={true}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleManualAdd}
                  disabled={loading}
                >
                  <UserPlus size={16} />
                  추가
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            닫기
          </button>
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
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow: hidden;
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
          }

          .modal-title {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .close-button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: background-color 0.2s;
          }

          .close-button:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }

          .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
          }

          .mode-selector {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
          }

          .mode-btn {
            flex: 1;
            padding: 12px 20px;
            border: 2px solid #e2e8f0;
            background: white;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s;
          }

          .mode-btn:hover {
            border-color: #cbd5e1;
            background-color: #f8fafc;
          }

          .mode-btn.active {
            background: ${Gradients.primary};
            border-color: #667eea;
            color: white;
          }

          .search-section {
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            background-color: #f8fafc;
            margin-bottom: 24px;
          }

          .manual-form {
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            background-color: #f8fafc;
          }

          .form-row {
            display: flex;
            gap: 16px;
            margin-bottom: 16px;
          }

          .form-group {
            flex: 1;
          }

          .form-group label {
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
            color: #374151;
            font-size: 14px;
          }

          .form-input, .form-select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
          }

          .form-input:focus, .form-select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          .form-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 16px;
          }

          .search-results {
            margin-top: 24px;
          }

          .search-results h3 {
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 600;
            color: #374151;
          }

          .results-table {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
          }

          .table-header {
            display: grid;
            grid-template-columns: 1fr 1fr 2fr 1.5fr 100px;
            gap: 16px;
            padding: 12px 16px;
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
          }

          .table-row {
            display: grid;
            grid-template-columns: 1fr 1fr 2fr 1.5fr 100px;
            gap: 16px;
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            transition: background-color 0.2s;
          }

          .table-row:hover {
            background-color: #f9fafb;
          }

          .table-row:last-child {
            border-bottom: none;
          }

          .table-cell {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: #374151;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .confirmation-section {
            text-align: center;
            padding: 20px;
          }

          .confirmation-section h3 {
            margin: 0 0 20px 0;
            font-size: 18px;
            font-weight: 600;
            color: #374151;
          }

          .confirmation-content {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
          }

          .confirmation-content p {
            margin: 0 0 20px 0;
            font-size: 16px;
            color: #374151;
          }

          .user-info {
            text-align: left;
          }

          .info-row {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }

          .info-row:last-child {
            border-bottom: none;
          }

          .info-label {
            font-weight: 600;
            color: #6b7280;
            min-width: 100px;
          }

          .info-value {
            color: #374151;
          }

          .confirmation-actions {
            display: flex;
            justify-content: center;
            gap: 12px;
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

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .btn-sm {
            padding: 6px 12px;
            font-size: 12px;
          }

          .btn-primary {
            background: ${Gradients.primary};
            border-color: #667eea;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: ${Gradients.primaryHover};
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }

          .btn-secondary {
            background-color: #f8fafc;
            border-color: #e2e8f0;
            color: #64748b;
          }

          .btn-secondary:hover {
            background-color: #f1f5f9;
            border-color: #cbd5e1;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 20px 24px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AddMemberModal;

