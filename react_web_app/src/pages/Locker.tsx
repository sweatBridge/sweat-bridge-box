import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { Gradients } from '../constants/gradients';
import { LockerService } from '../services/lockerService';
import type { Lockers as LockerItem } from '../types/locker';
import { usePageContext } from '../contexts/PageContext';

type LockerState = 'used' | 'unused' | 'na';
type LockerBox = { number: number; users: string[]; state: LockerState };

const stateRank: Record<LockerState, number> = { na: 2, used: 1, unused: 0 };
const coalesceState = (a: LockerState, b: LockerState): LockerState =>
  stateRank[a] >= stateRank[b] ? a : b; // na > used > unused

const BOX_NAME = 'SWEAT'; // 필요 시 교체/컨텍스트로 이동

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
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDate, setEditDate] = useState(''); // YYYY-MM-DD

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
      const nextState: LockerState =
        l.state === 'used' || l.state === 'unused' || l.state === 'na' ? l.state : 'unused';
      const name = (l.userName || l.user || '').trim();

      if (!map.has(num)) {
        map.set(num, { number: num, users: name ? [name] : [], state: nextState });
      } else {
        const cur = map.get(num)!;
        cur.state = coalesceState(cur.state, nextState);
        if (name && !cur.users.includes(name)) cur.users.push(name);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.number - b.number);
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

    setSelectedNo(number);
    setEditName((base?.userName || base?.user || '').trim());
    setEditPhone(base?.phoneNumber || '');
    setEditDate(''); // 아직 저장 미구현이므로 공란
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
                  {state === 'used' ? '사용중' : state === 'unused' ? '사용 가능' : '고장'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 일괄 추가 모달 */}
      {showAdd && (
        <div className="modal-backdrop" onClick={() => !adding && setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>락커 일괄 추가</h3>
            <div className="field">
              <label>시작 번호</label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={startNo}
                onChange={(e) => setStartNo(e.target.value)}
                placeholder="예: 1"
                disabled={adding}
              />
            </div>
            <div className="field">
              <label>끝 번호</label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={endNo}
                onChange={(e) => setEndNo(e.target.value)}
                placeholder="예: 100"
                disabled={adding}
              />
            </div>
            {addError && <div className="form-error">{addError}</div>}
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowAdd(false)} disabled={adding}>취소</button>
              <button className="btn btn-primary" onClick={onConfirmAdd} disabled={adding}>
                {adding ? '추가 중…' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개별 편집 모달 (저장 동작은 아직 없음) */}
      {showEdit && selectedNo !== null && (
        <div className="modal-backdrop" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>락커 #{selectedNo} 정보</h3>
            <div className="field">
              <label>회원 이름</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="예: 홍길동"
              />
            </div>
            <div className="field">
              <label>회원 전화 번호</label>
              <input
                type="tel"
                inputMode="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="예: 010-1234-5678"
              />
            </div>
            <div className="field">
              <label>사용 기한</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => setShowEdit(false)}>닫기</button>
              <button className="btn btn-primary" disabled title="아직 미구현입니다.">저장 (준비중)</button>
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
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.6);
          background: transparent;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
        }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-white {
          background: #fff;
          color: #111827;
          border: 1px solid #e5e7eb;
        }
        .btn-primary {
          background: #4f46e5;
          color: #fff;
          border: 1px solid #4338ca;
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
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
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

        /* modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }
        .modal {
          background: #fff;
          width: 100%;
          max-width: 380px;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        .modal h3 {
          margin: 0 0 12px;
          font-size: 18px;
          color: #111827;
        }
        .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
        .field label { font-size: 13px; color: #374151; }
        .field input {
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
        }
        .form-error { color: #b91c1c; font-size: 13px; margin-top: 4px; }
        .modal-actions {
          display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;
        }
      `}</style>
    </div>
  );
};

export default Locker;
