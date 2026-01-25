import React, { useState } from 'react';
import { Search, User, Mail, Phone, UserPlus, X } from 'lucide-react';
import { Gradients } from '../../../constants/gradients';
import { AppColors } from '../../../constants/colors';
import { MemberService } from '../../../services/memberService';

interface AddReserveMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMember: (member: UserData) => void;
  reservedMembers: string[];
  boxName: string;
}

interface UserData {
  email: string;
  realName: string;
  nickName: string;
  phone: string;
}

type TabType = 'realName' | 'email' | 'phone';

const AddReserveMemberModal = ({
  visible,
  onClose,
  onAddMember,
  reservedMembers,
  boxName
}: AddReserveMemberModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('realName');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [user, setUser] = useState<UserData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const resetSearch = () => {
    setUser(null);
    setUsers([]);
    setSearchName('');
    setSearchEmail('');
    setSearchPhone('');
  };

  const setActiveTabHandler = (tab: TabType) => {
    setActiveTab(tab);
    resetSearch();
  };

  const searchUserByName = async () => {
    if (!searchName.trim()) {
      alert('이름을 입력하세요.');
      return;
    }

    setIsSearching(true);
    try {
      const userData = await MemberService.getUserByRealName(searchName.trim());
      if (userData && userData.length > 0) {
        setUsers(userData);
        setUser(null);
      } else {
        setUsers([]);
        setUser(null);
        alert('해당 사용자를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      alert('사용자 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const searchUserByEmail = async () => {
    if (!searchEmail.trim()) {
      alert('이메일을 입력하세요.');
      return;
    }

    setIsSearching(true);
    try {
      const userData = await MemberService.getUserByEmail(searchEmail.trim());
      if (userData) {
        setUser(userData);
        setUsers([]);
      } else {
        setUser(null);
        setUsers([]);
        alert('해당 사용자를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      alert('사용자 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const searchUserByPhone = async () => {
    if (!searchPhone.trim()) {
      alert('전화번호를 입력하세요.');
      return;
    }

    setIsSearching(true);
    try {
      const userData = await MemberService.getUserByPhone(searchPhone.trim());
      if (userData) {
        setUser(userData);
        setUsers([]);
      } else {
        setUser(null);
        setUsers([]);
        alert('해당 사용자를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      alert('사용자 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const isClassMember = (targetUser: UserData) => {
    if (!targetUser?.email || !Array.isArray(reservedMembers)) return false;
    return reservedMembers.some(r => r.includes(targetUser.email));
  };

  const handleAddMember = (targetUser: UserData) => {
    if (isClassMember(targetUser)) {
      alert('이미 추가된 회원입니다.');
      return;
    }
    onAddMember(targetUser);
    handleClose();
  };

  const handleClose = () => {
    resetSearch();
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent, searchFn: () => void) => {
    if (e.key === 'Enter') {
      searchFn();
    }
  };

  if (!visible) return null;

  const renderUserCard = (targetUser: UserData, index?: number) => {
    const alreadyAdded = isClassMember(targetUser);

    return (
      <div key={index ?? 'single'} className="user-card">
        <div className="user-card-header">
          <User size={20} className="user-icon" />
          <span className="card-title">검색 결과</span>
        </div>
        <div className="user-card-body">
          <div className="user-info-row">
            <strong>이름:</strong>
            <span>{targetUser.realName}</span>
            {alreadyAdded && <span className="badge-added">이미 추가된 회원</span>}
          </div>
          <div className="user-info-row">
            <strong>연락처:</strong>
            <span>{targetUser.phone}</span>
          </div>
          <div className="user-info-row">
            <strong>이메일:</strong>
            <span>{targetUser.email}</span>
          </div>
        </div>
        <div className="user-card-footer">
          <button
            className="btn btn-success"
            onClick={() => handleAddMember(targetUser)}
            disabled={alreadyAdded}
          >
            <UserPlus size={16} />
            추가
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <UserPlus size={20} className="header-icon" />
            <h3>회원 추가</h3>
          </div>
          <button className="close-button" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* 탭 네비게이션 */}
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === 'realName' ? 'active' : ''}`}
              onClick={() => setActiveTabHandler('realName')}
            >
              <User size={16} />
              이름으로 찾기
            </button>
            <button
              className={`tab-button ${activeTab === 'email' ? 'active' : ''}`}
              onClick={() => setActiveTabHandler('email')}
            >
              <Mail size={16} />
              이메일로 찾기
            </button>
            <button
              className={`tab-button ${activeTab === 'phone' ? 'active' : ''}`}
              onClick={() => setActiveTabHandler('phone')}
            >
              <Phone size={16} />
              전화번호로 찾기
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="tab-content">
            {/* 이름 검색 탭 */}
            {activeTab === 'realName' && (
              <div className="search-row">
                <label>이름</label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, searchUserByName)}
                  placeholder="이름을 입력하세요."
                  disabled={isSearching}
                />
                <button
                  className="btn btn-primary"
                  onClick={searchUserByName}
                  disabled={isSearching}
                >
                  <Search size={16} />
                  검색
                </button>
              </div>
            )}

            {/* 이메일 검색 탭 */}
            {activeTab === 'email' && (
              <div className="search-row">
                <label>이메일</label>
                <input
                  type="text"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, searchUserByEmail)}
                  placeholder="이메일을 입력하세요."
                  disabled={isSearching}
                />
                <button
                  className="btn btn-primary"
                  onClick={searchUserByEmail}
                  disabled={isSearching}
                >
                  <Search size={16} />
                  검색
                </button>
              </div>
            )}

            {/* 전화번호 검색 탭 */}
            {activeTab === 'phone' && (
              <div className="search-row">
                <label>전화번호</label>
                <input
                  type="text"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, searchUserByPhone)}
                  placeholder="핸드폰 번호를 입력하세요.(- 제외)"
                  disabled={isSearching}
                />
                <button
                  className="btn btn-primary"
                  onClick={searchUserByPhone}
                  disabled={isSearching}
                >
                  <Search size={16} />
                  검색
                </button>
              </div>
            )}
          </div>

          {/* 검색 결과 영역 */}
          <div className="results-area">
            {/* 단일 사용자 */}
            {user && renderUserCard(user)}

            {/* 여러 사용자 */}
            {users.length > 0 && (
              <div className="users-grid">
                {users.map((u, index) => renderUserCard(u, index))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
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
          z-index: 1001;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          animation: modalSlideIn 0.2s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: ${Gradients.primary};
          border-bottom: none;
          border-radius: 12px 12px 0 0;
          box-shadow: 0 2px 10px rgba(102, 126, 234, 0.15);
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
          cursor: pointer;
          color: white;
          opacity: 0.8;
          padding: 4px;
          width: 32px;
          height: 32px;
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
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s;
        }

        .tab-button:hover {
          color: ${AppColors.primary};
          background-color: rgba(102, 126, 234, 0.05);
        }

        .tab-button.active {
          color: ${AppColors.primary};
          border-bottom-color: ${AppColors.primary};
        }

        .tab-content {
          margin-bottom: 24px;
        }

        .search-row {
          display: grid;
          grid-template-columns: 80px 1fr auto;
          gap: 12px;
          align-items: center;
        }

        .search-row label {
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .search-row input {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .search-row input:focus {
          outline: none;
          border-color: ${AppColors.primary};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .search-row input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }

        .results-area {
          min-height: 100px;
        }

        .users-grid {
          display: grid;
          gap: 16px;
        }

        .user-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }

        .user-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .user-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e5e7eb;
        }

        .user-icon {
          color: ${AppColors.primary};
        }

        .card-title {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }

        .user-card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .user-info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .user-info-row strong {
          min-width: 60px;
          color: #6b7280;
          font-weight: 500;
        }

        .user-info-row span {
          color: #1f2937;
        }

        .badge-added {
          background: #fef3c7;
          color: #92400e;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-left: auto;
        }

        .user-card-footer {
          padding: 12px 16px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: ${AppColors.primary};
          border-color: ${AppColors.primary};
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #4f63d7;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
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

        .btn-success {
          background-color: #10b981;
          border-color: #10b981;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background-color: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-success:disabled {
          background-color: #d1d5db;
          border-color: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default AddReserveMemberModal;
