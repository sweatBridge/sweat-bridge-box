import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Calendar, Plus, Info } from 'lucide-react';
import { Gradients } from '../constants/gradients';
import { AppColors } from '../constants/colors';
import { LockerService } from '../services/lockerService';
import { MemberService } from '../services/memberService';
import type { Lockers as LockerItem } from '../types/locker';
import type { Member } from '../types/member';
import { usePageContext } from '../contexts/PageContext';

type LockerState = 'used' | 'unused' | 'na' | 'deleted';
type LockerBox = { number: number; users: string[]; state: LockerState };

const stateRank: Record<LockerState, number> = { na: 3, deleted: 2, used: 1, unused: 0 };
const coalesceState = (a: LockerState, b: LockerState): LockerState =>
  stateRank[a] >= stateRank[b] ? a : b; // na > deleted > used > unused

const BOX_NAME = localStorage.getItem('boxName') || 'SWEAT';

const Locker: React.FC = () => {
  const { setPageInfo } = usePageContext();
  const [raw, setRaw] = useState<LockerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 일괄 추가 모달 상태
  const [showAdd, setShowAdd] = useState(false);
  const [startNo, setStartNo] = useState<string>('');
  const [endNo, setEndNo] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // 개별 편집 모달 상태
  const [showEdit, setShowEdit] = useState(false);
  const [selectedNo, setSelectedNo] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<LockerState>('unused');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStartDate, setEditStartDate] = useState(''); // YYYY-MM-DD
  const [editEndDate, setEditEndDate] = useState(''); // YYYY-MM-DD
  const [deleting, setDeleting] = useState(false);
  
  // 삭제 확인 모달 상태
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // 락커 해지 모달 상태
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [releasing, setReleasing] = useState(false);

  // 락커 수정 모달 상태
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateState, setUpdateState] = useState<'unused' | 'na'>('unused');
  const [updateNote, setUpdateNote] = useState('');
  const [updateAssignee, setUpdateAssignee] = useState('');
  const [updating, setUpdating] = useState(false);

  // 락커 히스토리 모달 상태
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<LockerItem[]>([]);

  // 락커 배정 모달 상태
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSearchText, setAssignSearchText] = useState('');
  const [assignSearchResults, setAssignSearchResults] = useState<Member[]>([]);
  const [assignSelectedMember, setAssignSelectedMember] = useState<Member | null>(null);
  const [assignStartDate, setAssignStartDate] = useState('');
  const [assignEndDate, setAssignEndDate] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [searching, setSearching] = useState(false);

  const loadLockers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lockers = await LockerService.getLockers(BOX_NAME);
      setRaw(lockers);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPageInfo({
      title: '락커 관리',
      subtitle: '락커 현황을 확인하고 관리하세요'
    });
  }, [setPageInfo]);

  useEffect(() => {
    loadLockers();
  }, [loadLockers]);

  // group by locker number → one box per locker
  const boxes = useMemo<LockerBox[]>(() => {
    const map = new Map<number, LockerBox>();
    for (const l of raw) {
      const num = l.number;
      const name = (l.userName || l.user || '').trim();
      
      // userName이나 user가 있으면 'used' 상태로 판단
      let nextState: LockerState;
      if (name) {
        nextState = 'used';
      } else if (l.state === 'used' || l.state === 'unused' || l.state === 'na' || l.state === 'deleted') {
        nextState = l.state;
      } else {
        nextState = 'unused';
      }

      if (!map.has(num)) {
        map.set(num, { number: num, users: name ? [name] : [], state: nextState });
      } else {
        const cur = map.get(num)!;
        cur.state = coalesceState(cur.state, nextState);
        if (name && !cur.users.includes(name)) cur.users.push(name);
      }
    }
    // deleted 상태인 락커는 화면에 표시하지 않음
    return Array.from(map.values())
      .filter(box => box.state !== 'deleted')
      .sort((a, b) => a.number - b.number);
  }, [raw]);

  const onOpenAdd = () => {
    setStartNo('');
    setEndNo('');
    setAddError(null);
    setShowAdd(true);
  };

  // 카드 클릭 → 편집 모달 열기 (기본값은 해당 번호의 첫 데이터로 프리필)
  const onOpenEdit = (number: number) => {
    const candidates = raw.filter(r => r.number === number);
    const firstWithName = candidates.find(c => (c.userName || c.user || '').trim().length > 0);
    const base = firstWithName ?? candidates[0]; // 없으면 첫 항목 참조(없을 수도 있음)

    // boxes에서 해당 락커의 상태 찾기
    const lockerBox = boxes.find(b => b.number === number);
    const lockerState = lockerBox?.state || 'unused';

    setSelectedNo(number);
    setSelectedState(lockerState);
    setEditName((base?.userName || base?.user || '').trim());
    setEditPhone(base?.phoneNumber || '');
    setEditStartDate(base?.startDate || '');
    setEditEndDate(base?.endDate || '');
    setShowEdit(true);
  };

  const onConfirmAdd = async () => {
    setAddError(null);
    const s = parseInt(startNo, 10);
    const e = parseInt(endNo, 10);
    if (Number.isNaN(s) || Number.isNaN(e)) {
      setAddError('숫자를 정확히 입력해 주세요.');
      return;
    }
    if (s < 1 || e < 1) {
      setAddError('번호는 1 이상이어야 합니다.');
      return;
    }

    setAdding(true);
    try {
      const { added, skipped } = await LockerService.addLockers(BOX_NAME, s, e);
      alert(`추가: ${added.length}개, 건너뜀(이미 존재): ${skipped.length}개`);
      setShowAdd(false);
      await loadLockers();
    } catch (err: any) {
      setAddError(err?.message ?? String(err));
    } finally {
      setAdding(false);
    }
  };

  const onDeleteLocker = () => {
    setShowDeleteConfirm(true);
  };

  const onConfirmDelete = async () => {
    if (selectedNo === null) return;

    setDeleting(true);
    try {
      await LockerService.deleteLocker(BOX_NAME, selectedNo);
      alert('락커가 삭제되었습니다.');
      setShowDeleteConfirm(false);
      setShowEdit(false);
      await loadLockers();
    } catch (err: any) {
      alert(`삭제 실패: ${err?.message ?? String(err)}`);
    } finally {
      setDeleting(false);
    }
  };

  const onReleaseLocker = () => {
    setShowReleaseConfirm(true);
  };

  const onConfirmRelease = async () => {
    if (selectedNo === null) return;

    setReleasing(true);
    try {
      // 해당 락커에 배정된 회원의 이메일을 찾기 위해 현재 데이터 확인
      const candidates = raw.filter(r => r.number === selectedNo);
      const currentLocker = candidates.find(c => (c.userName || c.user || '').trim().length > 0);
      
      await LockerService.releaseLocker(BOX_NAME, selectedNo);
      
      // 회원의 locker 필드 제거 (이메일로 찾아야 함)
      // 현재는 userName만 있으므로 회원 전체를 검색해서 해당 락커를 가진 회원 찾기
      if (currentLocker) {
        try {
          const allMembers = await MemberService.getMembers(BOX_NAME);
          const member = allMembers.find(m => m.realName === (currentLocker.userName || currentLocker.user));
          if (member) {
            await MemberService.unassignLockerFromMember(BOX_NAME, member.email);
          }
        } catch (err) {
          console.error('회원 락커 해제 실패:', err);
          // 락커는 해지되었으므로 계속 진행
        }
      }
      
      alert('락커가 해지되었습니다.');
      setShowReleaseConfirm(false);
      setShowEdit(false);
      await loadLockers();
    } catch (err: any) {
      alert(`해지 실패: ${err?.message ?? String(err)}`);
    } finally {
      setReleasing(false);
    }
  };

  const onOpenUpdateModal = () => {
    if (editName.trim()) {
      alert('회원을 먼저 해지하시기 바랍니다.');
      return;
    }

    // 현재 상태를 기본값으로 설정
    const currentState = selectedState === 'na' ? 'na' : 'unused';
    setUpdateState(currentState);
    
    // 입력 필드를 초기화
    setUpdateNote('');
    setUpdateAssignee('');
    
    setShowUpdateModal(true);
  };

  const onConfirmUpdate = async () => {
    if (selectedNo === null) return;

    setUpdating(true);
    try {
      await LockerService.updateLocker(BOX_NAME, selectedNo, updateState, updateNote, updateAssignee);
      alert('락커가 수정되었습니다.');
      setShowUpdateModal(false);
      setShowEdit(false);
      await loadLockers();
    } catch (err: any) {
      alert(`수정 실패: ${err?.message ?? String(err)}`);
    } finally {
      setUpdating(false);
    }
  };

  const onOpenHistory = async () => {
    if (selectedNo === null) return;

    try {
      // 해당 락커 번호의 모든 히스토리 가져오기
      const history = await LockerService.getLockerHistory(BOX_NAME, selectedNo);
      setHistoryData(history);
      setShowHistory(true);
    } catch (err: any) {
      alert(`히스토리 조회 실패: ${err?.message ?? String(err)}`);
    }
  };

  const onOpenAssignModal = () => {
    // 초기화
    setAssignSearchText('');
    setAssignSearchResults([]);
    setAssignSelectedMember(null);
    setAssignStartDate('');
    setAssignEndDate('');
    setShowAssignModal(true);
  };

  const onSearchMembers = async () => {
    if (!assignSearchText.trim()) {
      setAssignSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await MemberService.searchMembersByName(BOX_NAME, assignSearchText);
      setAssignSearchResults(results);
    } catch (err: any) {
      alert(`검색 실패: ${err?.message ?? String(err)}`);
    } finally {
      setSearching(false);
    }
  };

  const onSelectMember = (member: Member) => {
    setAssignSelectedMember(member);
    setAssignSearchResults([]);
  };

  const onConfirmAssign = async () => {
    if (selectedNo === null) return;
    
    if (!assignSelectedMember) {
      alert('회원을 선택해주세요.');
      return;
    }

    if (!assignStartDate || !assignEndDate) {
      alert('시작 날짜와 종료 날짜를 입력해주세요.');
      return;
    }

    setAssigning(true);
    try {
      const phone = assignSelectedMember.phone || '';
      
      // 락커에 회원 배정
      await LockerService.assignLocker(
        BOX_NAME,
        selectedNo,
        assignSelectedMember.realName,
        phone,
        assignStartDate,
        assignEndDate
      );
      
      // 회원에게 락커 번호 추가
      await MemberService.assignLockerToMember(
        BOX_NAME,
        assignSelectedMember.email,
        selectedNo
      );
      
      alert('락커가 배정되었습니다.');
      setShowAssignModal(false);
      setShowEdit(false);
      await loadLockers();
    } catch (err: any) {
      alert(`배정 실패: ${err?.message ?? String(err)}`);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="locker-page">
      <div className="content-card">
        <div className="card-header">
          <div className="header-left">
            <Calendar size={20} />
            <span>락커 현황</span>
          </div>
          <div className="header-actions">
            <button className="btn btn-white" onClick={onOpenAdd}>락커 일괄 추가</button>
          </div>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner" />
            <p>불러오는 중…</p>
          </div>
        )}

        {error && !loading && (
          <div className="error">오류: {error}</div>
        )}

        {!loading && !error && (
          <div className="locker-grid">
            {boxes.map(({ number, users, state }) => (
              <div
                key={number}
                className={`locker-card ${state}`}
                onClick={() => onOpenEdit(number)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenEdit(number)}
              >
                <div className="locker-number">#{number}</div>
                <div className="locker-users">
                  {users.length > 0 ? users.join(', ') : <span className="muted">—</span>}
                </div>
                <div className={`status-chip ${state}`}>
                  {state === 'used' ? '사용중' : state === 'unused' ? '사용 가능' : state === 'na' ? '고장' : '삭제됨'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 일괄 추가 모달 */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => !adding && setShowAdd(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title">
                <Plus size={20} className="header-icon" />
                <h3>락커 일괄 추가</h3>
              </div>
              <button className="close-button" onClick={() => !adding && setShowAdd(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-section">
                <div className="form-row">
                  <div className="form-group">
                    <label>시작 번호</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={startNo}
                      onChange={(e) => setStartNo(e.target.value)}
                      placeholder="예: 201"
                      disabled={adding}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>끝 번호</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={endNo}
                      onChange={(e) => setEndNo(e.target.value)}
                      placeholder="예: 220"
                      disabled={adding}
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="info-box">
                  예시: 201~220 입력 시 201, 202, ... 220까지 20개의 락커가 생성됩니다.
                </div>

                {addError && <div className="form-error">{addError}</div>}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)} disabled={adding}>취소</button>
              <button className="btn btn-primary" onClick={onConfirmAdd} disabled={adding}>
                {adding ? '추가 중…' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개별 편집 모달 (저장 동작은 아직 없음) */}
      {showEdit && selectedNo !== null && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title">
                <Info size={20} className="header-icon" />
                <h3>락커 #{selectedNo} 정보</h3>
              </div>
              <button className="close-button" onClick={() => setShowEdit(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {/* 액션 버튼 */}
              <div className="action-buttons">
                <button className="btn btn-action" onClick={onOpenUpdateModal}>수정</button>
                {!editName.trim() ? (
                  <button 
                    className="btn btn-action" 
                    onClick={onOpenAssignModal}
                    disabled={selectedState === 'na'}
                  >
                    락커 배정
                  </button>
                ) : (
                  <button 
                    className="btn btn-action" 
                    onClick={onReleaseLocker}
                    disabled={releasing}
                  >
                    {releasing ? '해지 중...' : '락커 해지'}
                  </button>
                )}
                <button 
                  className="btn btn-action" 
                  onClick={onDeleteLocker}
                  disabled={deleting || editName.trim().length > 0}
                >
                  {deleting ? '삭제 중...' : '락커 삭제'}
                </button>
              </div>

              <div className="form-section">
                <div className="form-group">
                  <label>회원 이름</label>
                  <input
                    type="text"
                    value={editName}
                    readOnly
                    placeholder="—"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>회원 전화 번호</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={editPhone}
                    readOnly
                    placeholder="—"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>사용 시작</label>
                  <input
                    type="date"
                    value={editStartDate}
                    readOnly
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>사용 종료</label>
                  <input
                    type="date"
                    value={editEndDate}
                    readOnly
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={onOpenHistory}>히스토리</button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && selectedNo !== null && (
        <div className="modal-overlay" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title">
                <Info size={20} className="header-icon" />
                <h3>락커 삭제 확인</h3>
              </div>
              <button className="close-button" onClick={() => !deleting && setShowDeleteConfirm(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="delete-message">
                <p className="delete-title">락커 #{selectedNo}를 삭제하시겠습니까?</p>
                <div className="delete-info-box">
                  <Info size={16} />
                  <span>락커 삭제 시에도 회원 히스토리/결제 기록은 유지됩니다.</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>취소</button>
              <button className="btn btn-danger" onClick={onConfirmDelete} disabled={deleting}>
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 락커 해지 확인 모달 */}
      {showReleaseConfirm && selectedNo !== null && (
        <div className="modal-overlay" onClick={() => !releasing && setShowReleaseConfirm(false)}>
          <div className="modal-content release-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title">
                <Info size={20} className="header-icon" />
                <h3>락커 해지 확인</h3>
              </div>
              <button className="close-button" onClick={() => !releasing && setShowReleaseConfirm(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="release-message">
                <p className="release-title">회원의 락커를 해지하시겠습니까?</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReleaseConfirm(false)} disabled={releasing}>취소</button>
              <button className="btn btn-primary" onClick={onConfirmRelease} disabled={releasing}>
                {releasing ? '해지 중…' : '해지'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 락커 수정 모달 */}
      {showUpdateModal && selectedNo !== null && (
        <div className="modal-overlay" onClick={() => !updating && setShowUpdateModal(false)}>
          <div className="modal-content update-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title">
                <Info size={20} className="header-icon" />
                <h3>락커 #{selectedNo} 수정</h3>
              </div>
              <button className="close-button" onClick={() => !updating && setShowUpdateModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-section">
                <div className="form-group">
                  <label>상태</label>
                  <select
                    className="form-input"
                    value={updateState}
                    onChange={(e) => setUpdateState(e.target.value as 'unused' | 'na')}
                    disabled={updating}
                  >
                    <option value="unused" disabled={selectedState === 'unused'}>사용 가능</option>
                    <option value="na" disabled={selectedState === 'na'}>고장</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>사유</label>
                  <textarea
                    className="form-input form-textarea"
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    placeholder="사유를 입력하세요"
                    disabled={updating}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>담당자</label>
                  <input
                    type="text"
                    className="form-input"
                    value={updateAssignee}
                    onChange={(e) => setUpdateAssignee(e.target.value)}
                    placeholder="담당자를 입력하세요"
                    disabled={updating}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowUpdateModal(false)} disabled={updating}>취소</button>
              <button className="btn btn-primary" onClick={onConfirmUpdate} disabled={updating}>
                {updating ? '수정 중…' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 락커 히스토리 모달 */}
      {showHistory && selectedNo !== null && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title">
                <Calendar size={20} className="header-icon" />
                <h3>락커 #{selectedNo} 히스토리</h3>
              </div>
              <button className="close-button" onClick={() => setShowHistory(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {historyData.length === 0 ? (
                <div className="empty-history">히스토리가 없습니다.</div>
              ) : (
                <div className="history-list">
                  {historyData.map((item, index) => (
                    <div key={index} className="history-item">
                      <div className="history-header">
                        <span className="history-index">#{historyData.length - index}</span>
                        <span className={`history-state-badge ${item.state}`}>
                          {item.state === 'used' ? '사용중' : 
                           item.state === 'unused' ? '사용 가능' : 
                           item.state === 'na' ? '고장' : '삭제됨'}
                        </span>
                      </div>
                      
                      <div className="history-details">
                        {(item.userName || item.user) && (
                          <div className="history-row">
                            <span className="history-label">회원:</span>
                            <span className="history-value">{item.userName || item.user}</span>
                          </div>
                        )}
                        {item.phoneNumber && (
                          <div className="history-row">
                            <span className="history-label">전화번호:</span>
                            <span className="history-value">{item.phoneNumber}</span>
                          </div>
                        )}
                        {item.startDate && (
                          <div className="history-row">
                            <span className="history-label">시작일:</span>
                            <span className="history-value">{item.startDate}</span>
                          </div>
                        )}
                        {item.endDate && (
                          <div className="history-row">
                            <span className="history-label">종료일:</span>
                            <span className="history-value">{item.endDate}</span>
                          </div>
                        )}
                        {item.note && (
                          <div className="history-row">
                            <span className="history-label">사유:</span>
                            <span className="history-value">{item.note}</span>
                          </div>
                        )}
                        {item.assignee && (
                          <div className="history-row">
                            <span className="history-label">담당자:</span>
                            <span className="history-value">{item.assignee}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowHistory(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 락커 배정 모달 */}
      {showAssignModal && selectedNo !== null && (
        <div className="modal-overlay" onClick={() => !assigning && setShowAssignModal(false)}>
          <div className="modal-content assign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title">
                <Plus size={20} className="header-icon" />
                <h3>락커 #{selectedNo} 배정</h3>
              </div>
              <button className="close-button" onClick={() => !assigning && setShowAssignModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-section">
                {/* 회원 검색 */}
                <div className="form-group">
                  <label>이름 검색</label>
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      className="form-input"
                      value={assignSearchText}
                      onChange={(e) => setAssignSearchText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onSearchMembers()}
                      placeholder="회원 이름을 입력하세요"
                      disabled={assigning}
                    />
                    <button 
                      className="btn btn-primary search-btn" 
                      onClick={onSearchMembers}
                      disabled={searching || assigning}
                    >
                      {searching ? '검색 중...' : '검색'}
                    </button>
                  </div>

                  {/* 선택된 회원 표시 */}
                  {assignSelectedMember && (
                    <div className="selected-member">
                      <div className="member-info">
                        <strong>{assignSelectedMember.realName}</strong>
                        <span className="member-detail">{assignSelectedMember.phone}</span>
                      </div>
                      <button 
                        className="clear-btn" 
                        onClick={() => setAssignSelectedMember(null)}
                        disabled={assigning}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* 검색 결과 */}
                  {assignSearchResults.length > 0 && !assignSelectedMember && (
                    <div className="search-results">
                      {assignSearchResults.map((member) => (
                        <div 
                          key={member.email} 
                          className="search-result-item"
                          onClick={() => onSelectMember(member)}
                        >
                          <div className="member-name">{member.realName}</div>
                          <div className="member-phone">{member.phone || member.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 시작 날짜 */}
                <div className="form-group">
                  <label>시작 날짜</label>
                  <input
                    type="date"
                    className="form-input"
                    value={assignStartDate}
                    onChange={(e) => setAssignStartDate(e.target.value)}
                    disabled={assigning}
                  />
                </div>

                {/* 종료 날짜 */}
                <div className="form-group">
                  <label>종료 날짜</label>
                  <input
                    type="date"
                    className="form-input"
                    value={assignEndDate}
                    onChange={(e) => setAssignEndDate(e.target.value)}
                    disabled={assigning}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)} disabled={assigning}>취소</button>
              <button className="btn btn-primary" onClick={onConfirmAssign} disabled={assigning}>
                {assigning ? '배정 중…' : '배정'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .content-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          padding: 20px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: ${Gradients.primary};
          color: #fff;
          border-radius: 8px;
          margin: -20px -20px 20px -20px;
          font-weight: 600;
        }
        .header-left { display: flex; gap: 8px; align-items: center; }
        .header-actions { display: flex; gap: 8px; }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn:disabled { 
          opacity: 0.6; 
          cursor: not-allowed; 
        }
        .btn-white {
          background: #fff;
          color: #111827;
          border: 1px solid #e5e7eb;
        }
        .btn-primary {
          background-color: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }
        .btn-primary:hover {
          background-color: ${AppColors.primary};
          border-color: ${AppColors.primary};
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
        .btn-action {
          background: #ffffff;
          color: #374151;
          border-color: #d1d5db;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          flex: 1;
        }
        .btn-action:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }
        .btn-action:disabled {
          background: #e5e7eb;
          color: #9ca3af;
          border: 1px solid #d1d5db;
          cursor: not-allowed;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .loading, .error {
          padding: 32px 12px;
          text-align: center;
          color: #475569;
        }
        .spinner {
          width: 28px; height: 28px; margin: 0 auto 10px;
          border: 3px solid #e5e7eb; border-top: 3px solid #6366f1; border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .locker-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr); /* 기본: 2개 (모바일) */
          gap: 12px;
        }
        
        /* 타블렛: 4개 */
        @media (min-width: 768px) {
          .locker-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        /* 중간 데스크탑: 6개 */
        @media (min-width: 1024px) {
          .locker-grid {
            grid-template-columns: repeat(6, 1fr);
          }
        }
        
        /* 데스크탑: 8개 */
        @media (min-width: 1280px) {
          .locker-grid {
            grid-template-columns: repeat(8, 1fr);
          }
        }
        
        /* 큰 데스크탑: 10개 */
        @media (min-width: 1536px) {
          .locker-grid {
            grid-template-columns: repeat(10, 1fr);
          }
        }
        
        /* 초대형 화면: 12개 */
        @media (min-width: 1920px) {
          .locker-grid {
            grid-template-columns: repeat(12, 1fr);
          }
        }
        .locker-card {
          position: relative;
          border-radius: 10px;
          padding: 12px;
          border: 1px solid rgba(0,0,0,0.06);
          min-height: 90px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          transition: transform .05s ease, box-shadow .1s ease;
        }
        .locker-card:hover { box-shadow: 0 2px 6px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .locker-card.used   { background: #dcfce7; } /* light green */
        .locker-card.unused { background: #e0f2fe; } /* light blue */
        .locker-card.na     { background: #fee2e2; } /* red */
        .locker-card.deleted { background: #f3f4f6; } /* gray */
        .locker-number {
          font-weight: 800;
          font-size: 18px;
          color: #111827;
        }
        .locker-users {
          font-size: 13px;
          color: #374151;
          line-height: 1.3;
          flex: 1;
          word-break: break-all;
        }
        .muted { color: #94a3b8; }

        .status-chip {
          position: absolute;
          right: 8px;
          bottom: 8px;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 10px;
          font-weight: 600;
          background: rgba(255,255,255,0.7);
        }
        .status-chip.used   { color: #065f46; }
        .status-chip.unused { color: #075985; }
        .status-chip.na     { color: #991b1b; }
        .status-chip.deleted { color: #6b7280; }

        /* modal */
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
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          width: 90%;
          max-width: 750px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: ${Gradients.primary};
          border-bottom: none;
          border-radius: 8px 8px 0 0;
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

        .form-section {
          margin-bottom: 20px;
        }

        .form-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .form-row .form-group {
          flex: 1;
          margin-bottom: 0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .info-box {
          padding: 12px 16px;
          background-color: #e0f2fe;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          color: #0c4a6e;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
          background-color: #fafbfc;
        }

        .form-input:focus {
          outline: none;
          border-color: ${AppColors.primary};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          background-color: white;
        }

        .form-input:read-only {
          background-color: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
          border-color: #e5e7eb;
        }

        .form-input:read-only:focus {
          border-color: #e5e7eb;
          box-shadow: none;
          background-color: #f3f4f6;
        }

        .form-error { 
          color: #b91c1c; 
          font-size: 13px; 
          margin-top: 8px; 
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        /* 삭제 확인 모달 스타일 */
        .delete-confirm-modal {
          max-width: 500px;
        }

        .delete-message {
          text-align: center;
          padding: 12px 0;
        }

        .delete-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 20px;
        }

        .delete-info-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background-color: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 8px;
          color: #92400e;
          font-size: 14px;
          line-height: 1.5;
          text-align: left;
        }

        .delete-info-box svg {
          flex-shrink: 0;
          color: #f59e0b;
        }

        .btn-danger {
          background-color: #dc2626;
          border-color: #dc2626;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background-color: #b91c1c;
          border-color: #b91c1c;
        }

        .btn-danger:disabled {
          background-color: #fca5a5;
          border-color: #fca5a5;
        }

        /* 락커 해지 확인 모달 스타일 */
        .release-confirm-modal {
          max-width: 500px;
        }

        .release-message {
          text-align: center;
          padding: 12px 0;
        }

        .release-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        /* 락커 수정 모달 스타일 */
        .update-modal {
          max-width: 500px;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .form-input option:disabled {
          color: #9ca3af;
          background-color: #f3f4f6;
        }

        select.form-input {
          cursor: pointer;
        }

        select.form-input:disabled {
          cursor: not-allowed;
        }

        /* 락커 히스토리 모달 스타일 */
        .history-modal {
          max-width: 600px;
        }

        .empty-history {
          text-align: center;
          padding: 40px 20px;
          color: #9ca3af;
          font-size: 16px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .history-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background-color: #fafbfc;
          transition: all 0.2s;
        }

        .history-item:hover {
          background-color: #f3f4f6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .history-index {
          font-weight: 700;
          font-size: 14px;
          color: #6b7280;
        }

        .history-state-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .history-state-badge.used {
          background-color: #dcfce7;
          color: #065f46;
        }

        .history-state-badge.unused {
          background-color: #e0f2fe;
          color: #075985;
        }

        .history-state-badge.na {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .history-state-badge.deleted {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        .history-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-row {
          display: flex;
          gap: 8px;
          font-size: 14px;
        }

        .history-label {
          font-weight: 600;
          color: #6b7280;
          min-width: 80px;
          flex-shrink: 0;
        }

        .history-value {
          color: #111827;
          word-break: break-word;
        }

        /* 락커 배정 모달 스타일 */
        .assign-modal {
          max-width: 500px;
        }

        .search-input-wrapper {
          display: flex;
          gap: 8px;
        }

        .search-input-wrapper .form-input {
          flex: 1;
        }

        .search-btn {
          padding: 12px 20px;
          white-space: nowrap;
        }

        .selected-member {
          margin-top: 12px;
          padding: 12px;
          background-color: #e0f2fe;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .member-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .member-detail {
          font-size: 13px;
          color: #64748b;
        }

        .clear-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #64748b;
          cursor: pointer;
          padding: 0 8px;
          line-height: 1;
          transition: color 0.2s;
        }

        .clear-btn:hover:not(:disabled) {
          color: #dc2626;
        }

        .clear-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .search-results {
          margin-top: 8px;
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
        }

        .search-result-item {
          padding: 12px;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .search-result-item:hover {
          background-color: #f9fafb;
        }

        .member-name {
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .member-phone {
          font-size: 13px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default Locker;

