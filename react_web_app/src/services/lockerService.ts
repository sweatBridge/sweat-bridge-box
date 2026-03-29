import { getLatestLocker, hasActiveAssignedUser, toLocker } from '../models/lockerModel';
import { LockerRepository } from '../repositories/lockerRepository';
import { Locker, LOCKER_STATE, LockerDocumentData, LockerDocumentEntry, LockerState } from '../types/locker';
import { formatDateToString } from '../utils/dateUtils';

export class LockerService {
  /**
   * Firebase 원시 락커 데이터를 `Locker` 타입으로 변환합니다.
   */
  static toLocker = toLocker;

  /**
   * 최신 락커 엔트리 기준으로 현재 활성 배정 회원이 있는지 확인합니다.
   * 만료된 배정은 활성 사용자로 간주하지 않습니다.
   */
  static hasActiveAssignedUser = hasActiveAssignedUser;

  /**
   * 기본 락커 엔트리를 생성합니다.
   *
   * 공통 필드를 기본값으로 채운 뒤 필요한 필드만 덮어써서
   * 상태 변경용 엔트리를 일관되게 만들기 위해 사용합니다.
   *
   * @param number 락커 번호
   * @param overrides 기본값 위에 덮어쓸 필드
   * @returns 정규화된 락커 엔트리
   */
  private static createLockerEntry(number: number, overrides: Partial<Locker> = {}): Locker {
    return {
      number,
      state: LOCKER_STATE.UNUSED,
      id: '',
      realName: '',
      phone: '',
      assignee: '',
      note: '',
      startDate: '',
      endDate: '',
      createdAt: new Date().toISOString().split('T')[0],
      key: '',
      ...overrides
    };
  }

  /**
   * 문서 데이터에서 특정 락커 번호의 엔트리를 조회합니다.
   *
   * @param data 락커 문서 전체 데이터
   * @param lockerNumber 조회할 락커 번호
   * @returns 해당 락커의 단일 엔트리 또는 히스토리 배열
   * @throws 해당 락커 번호가 존재하지 않으면 에러를 던집니다.
   */
  private static getLockerEntry(data: LockerDocumentData, lockerNumber: number): LockerDocumentEntry {
    const key = String(lockerNumber);

    if (!Object.prototype.hasOwnProperty.call(data, key)) {
      throw new Error('해당 락커 번호를 찾을 수 없습니다.');
    }

    return data[key];
  }

  /**
   * 박스의 전체 락커 목록을 조회합니다.
   *
   * 각 락커 번호별 최신 엔트리만 추출해 번호순으로 반환합니다.
   *
   * @param box 박스 이름
   * @returns 최신 상태 기준의 락커 목록
   */
  static async getLockers(box: string): Promise<Locker[]> {
    const { exists, data } = await LockerRepository.getLockerDocument(box);
    if (!exists) return [];

    const lockers: Locker[] = [];

    for (const [key, value] of Object.entries(data)) {
      const lockerNumber = Number(key);
      if (!Number.isFinite(lockerNumber)) continue;

      const latestLocker = getLatestLocker(value, lockerNumber);
      if (latestLocker) {
        lockers.push(latestLocker);
      }
    }

    lockers.sort((a, b) => a.number - b.number);
    return lockers;
  }

  /**
   * 지정한 번호 범위의 락커를 일괄 추가합니다.
   *
   * 이미 존재하는 락커는 건너뛰고, 삭제 상태인 락커는 다시 활성화합니다.
   *
   * @param box 박스 이름
   * @param start 시작 번호
   * @param end 종료 번호
   * @returns 추가된 번호와 건너뛴 번호 목록
   */
  static async addLockers(box: string, start: number, end: number): Promise<{ added: number[]; skipped: number[] }> {
    const from = Math.min(start, end);
    const to = Math.max(start, end);

    return LockerRepository.runLockerDocumentTransaction(box, ({ data }) => {
      const payload: LockerDocumentData = {};
      const added: number[] = [];
      const skipped: number[] = [];

      for (let lockerNumber = from; lockerNumber <= to; lockerNumber++) {
        const key = String(lockerNumber);
        const defaultEntry = this.createLockerEntry(lockerNumber);
        const entry = data[key];

        if (!Object.prototype.hasOwnProperty.call(data, key)) {
          payload[key] = [defaultEntry];
          added.push(lockerNumber);
          continue;
        }

        if (Array.isArray(entry)) {
          const lastEntry = entry[entry.length - 1] as Partial<Locker> | undefined;

          if (lastEntry?.state === LOCKER_STATE.DELETED) {
            payload[key] = [...entry, defaultEntry];
            added.push(lockerNumber);
          } else {
            skipped.push(lockerNumber);
          }
          continue;
        }

        if (entry && typeof entry === 'object') {
          if ((entry as Partial<Locker>).state === LOCKER_STATE.DELETED) {
            payload[key] = [entry, defaultEntry];
            added.push(lockerNumber);
          } else {
            skipped.push(lockerNumber);
          }
          continue;
        }

        payload[key] = [defaultEntry];
        added.push(lockerNumber);
      }

      return { result: { added, skipped }, payload };
    });
  }

  /**
   * 특정 락커를 삭제 상태로 변경합니다.
   *
   * 배정 이력이 있는 경우 삭제 히스토리를 추가하고,
   * 비어 있는 락커는 최신 엔트리의 상태만 삭제로 바꿉니다.
   *
   * @param box 박스 이름
   * @param lockerNumber 삭제할 락커 번호
   * @throws 락커 문서나 대상 번호를 찾지 못하면 에러를 던집니다.
   */
  static async deleteLocker(box: string, lockerNumber: number): Promise<void> {
    return LockerRepository.runLockerDocumentTransaction(box, ({ exists, data }) => {
      if (!exists) {
        throw new Error('락커 문서를 찾을 수 없습니다.');
      }

      const key = String(lockerNumber);
      const lockerEntry = this.getLockerEntry(data, lockerNumber);
      const deletedEntry = this.createLockerEntry(lockerNumber, { state: LOCKER_STATE.DELETED });

      let nextValue: unknown;

      if (Array.isArray(lockerEntry)) {
        const lastEntry = lockerEntry[lockerEntry.length - 1] as Partial<Locker> | undefined;
        const hasName = (lastEntry?.realName || '').trim().length > 0;

        if (hasName) {
          nextValue = [...lockerEntry, deletedEntry];
        } else {
          const updated = [...lockerEntry];
          updated[updated.length - 1] = { ...lastEntry, state: LOCKER_STATE.DELETED };
          nextValue = updated;
        }
      } else if (lockerEntry && typeof lockerEntry === 'object') {
        const hasName = (((lockerEntry as Partial<Locker>).realName) || '').trim().length > 0;
        nextValue = hasName ? [lockerEntry, deletedEntry] : { ...lockerEntry, state: LOCKER_STATE.DELETED };
      } else {
        throw new Error('잘못된 락커 데이터 형식입니다.');
      }

      return {
        result: undefined,
        payload: { [key]: nextValue }
      };
    });
  }

  /**
   * 사용 중이던 락커를 해지하고 사용 가능 상태 엔트리를 추가합니다.
   *
   * 해지 메모가 있으면 `[해지]` 접두사를 붙여 저장합니다.
   *
   * @param box 박스 이름
   * @param lockerNumber 해지할 락커 번호
   * @param note 해지 사유 메모
   * @param assignee 처리자 이름
   * @throws 락커 문서나 대상 번호를 찾지 못하면 에러를 던집니다.
   */
  static async releaseLocker(box: string, lockerNumber: number, note: string = '', assignee: string = ''): Promise<void> {
    return LockerRepository.runLockerDocumentTransaction(box, ({ exists, data }) => {
      if (!exists) {
        throw new Error('락커 문서를 찾을 수 없습니다.');
      }

      const key = String(lockerNumber);
      const lockerEntry = this.getLockerEntry(data, lockerNumber);
      const releaseNote = note.trim() ? `[해지] ${note}` : note;
      const unusedEntry = this.createLockerEntry(lockerNumber, {
        state: LOCKER_STATE.UNUSED,
        note: releaseNote,
        assignee
      });

      let nextValue: unknown;

      if (Array.isArray(lockerEntry)) {
        nextValue = [...lockerEntry, unusedEntry];
      } else if (lockerEntry && typeof lockerEntry === 'object') {
        nextValue = [lockerEntry, unusedEntry];
      } else {
        throw new Error('잘못된 락커 데이터 형식입니다.');
      }

      return {
        result: undefined,
        payload: { [key]: nextValue }
      };
    });
  }

  /**
   * 비어 있는 락커의 상태를 변경합니다.
   *
   * `unused`와 `na` 상태만 허용하며, 현재 활성 배정 회원이 있는 락커는 변경할 수 없습니다.
   *
   * @param box 박스 이름
   * @param lockerNumber 변경할 락커 번호
   * @param state 변경할 상태
   * @param note 변경 사유 메모
   * @param assignee 처리자 이름
   * @throws 지원하지 않는 상태이거나, 활성 배정 회원이 있으면 에러를 던집니다.
   */
  static async updateLocker(
    box: string,
    lockerNumber: number,
    state: LockerState,
    note: string,
    assignee: string
  ): Promise<void> {
    if (state !== LOCKER_STATE.UNUSED && state !== LOCKER_STATE.NA) {
      throw new Error('지원하지 않는 락커 상태입니다.');
    }

    return LockerRepository.runLockerDocumentTransaction(box, ({ exists, data }) => {
      if (!exists) {
        throw new Error('락커 문서를 찾을 수 없습니다.');
      }

      const key = String(lockerNumber);
      const lockerEntry = this.getLockerEntry(data, lockerNumber);

      if (hasActiveAssignedUser(lockerEntry, lockerNumber)) {
        throw new Error('회원을 먼저 해지하시기 바랍니다.');
      }

      const updatedEntry = this.createLockerEntry(lockerNumber, {
        state,
        note,
        assignee
      });

      let nextValue: unknown;
      const hasNote = note.trim().length > 0;

      if (Array.isArray(lockerEntry)) {
        if (hasNote) {
          nextValue = [...lockerEntry, updatedEntry];
        } else {
          const updated = [...lockerEntry];
          updated[updated.length - 1] = updatedEntry;
          nextValue = updated;
        }
      } else if (lockerEntry && typeof lockerEntry === 'object') {
        nextValue = hasNote ? [lockerEntry, updatedEntry] : updatedEntry;
      } else {
        throw new Error('잘못된 락커 데이터 형식입니다.');
      }

      return {
        result: undefined,
        payload: { [key]: nextValue }
      };
    });
  }

  /**
   * 특정 락커의 전체 히스토리를 조회합니다.
   *
   * 단일 엔트리 문서와 배열 히스토리 문서를 모두 `Locker[]`로 정규화해 반환합니다.
   *
   * @param box 박스 이름
   * @param lockerNumber 조회할 락커 번호
   * @returns 오래된 순서대로 정리된 락커 히스토리
   */
  static async getLockerHistory(box: string, lockerNumber: number): Promise<Locker[]> {
    const { exists, data } = await LockerRepository.getLockerDocument(box);
    if (!exists) return [];

    const key = String(lockerNumber);
    if (!Object.prototype.hasOwnProperty.call(data, key)) {
      return [];
    }

    const lockerEntry = data[key];

    if (Array.isArray(lockerEntry)) {
      return lockerEntry.map((entry) => toLocker(entry, lockerNumber));
    }

    if (lockerEntry && typeof lockerEntry === 'object') {
      return [toLocker(lockerEntry, lockerNumber)];
    }

    return [];
  }

  /**
   * 회원을 락커에 배정합니다.
   *
   * 현재 활성 배정 회원이 없는 경우에만 배정할 수 있으며,
   * 최신 엔트리 상태에 따라 덮어쓰기 또는 히스토리 추가를 수행합니다.
   *
   * @param box 박스 이름
   * @param lockerNumber 배정할 락커 번호
   * @param userId 회원 식별자
   * @param userName 회원 이름
   * @param phoneNumber 회원 연락처
   * @param startDate 사용 시작일
   * @param endDate 사용 종료일
   * @param key 락커 배정 고유 키
   * @param price 결제 금액
   * @param paymentType 결제 수단
   * @throws 이미 활성 배정 회원이 있으면 에러를 던집니다.
   */
  static async assignLocker(
    box: string,
    lockerNumber: number,
    userId: string,
    userName: string,
    phoneNumber: string,
    startDate: string,
    endDate: string,
    key: string,
    price: string,
    paymentType: 'cash' | 'card'
  ): Promise<void> {
    return LockerRepository.runLockerDocumentTransaction(box, ({ exists, data }) => {
      if (!exists) {
        throw new Error('락커 문서를 찾을 수 없습니다.');
      }

      const lockerKey = String(lockerNumber);
      const lockerEntry = this.getLockerEntry(data, lockerNumber);

      if (hasActiveAssignedUser(lockerEntry, lockerNumber)) {
        throw new Error('이미 회원이 배정되어 있습니다. 먼저 해지해주세요.');
      }

      const assignedEntry = this.createLockerEntry(lockerNumber, {
        state: LOCKER_STATE.USED,
        id: userId,
        realName: userName,
        phone: phoneNumber || '',
        startDate: startDate || '',
        endDate: endDate || '',
        key,
        price,
        paymentType
      });

      let nextValue: unknown;

      if (Array.isArray(lockerEntry)) {
        const lastEntry = lockerEntry[lockerEntry.length - 1] as Partial<Locker> | undefined;
        const isClean = lastEntry?.state === LOCKER_STATE.UNUSED && (!lastEntry?.note || lastEntry.note.trim() === '');

        if (isClean) {
          const updated = [...lockerEntry];
          updated[updated.length - 1] = assignedEntry;
          nextValue = updated;
        } else {
          nextValue = [...lockerEntry, assignedEntry];
        }
      } else if (lockerEntry && typeof lockerEntry === 'object') {
        const objectEntry = lockerEntry as Partial<Locker>;
        const isClean = objectEntry.state === LOCKER_STATE.UNUSED && (!objectEntry.note || objectEntry.note.trim() === '');
        nextValue = isClean ? assignedEntry : [lockerEntry, assignedEntry];
      } else {
        throw new Error('잘못된 락커 데이터 형식입니다.');
      }

      return {
        result: undefined,
        payload: { [lockerKey]: nextValue }
      };
    });
  }

  /**
   * 현재 사용 중인 모든 락커의 만료일을 일괄 연장합니다.
   *
   * 오늘 기준으로 아직 만료되지 않은 `used` 상태 락커만 연장하며,
   * 후속 회원 히스토리 갱신에 필요한 최소 정보도 함께 반환합니다.
   *
   * @param box 박스 이름
   * @param days 연장할 일수
   * @returns 연장된 개수와 연장된 락커 정보 목록
   */
  static async extendAllLockers(
    box: string,
    days: number
  ): Promise<{
    extendedCount: number;
    extendedLockers: Array<{ id: string; key: string; endDate: string }>;
  }> {
    return LockerRepository.runLockerDocumentTransaction(box, ({ exists, data }) => {
      if (!exists) {
        return {
          result: { extendedCount: 0, extendedLockers: [] }
        };
      }

      const updates: Record<string, unknown> = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let extendedCount = 0;
      const extendedLockers: Array<{ id: string; key: string; endDate: string }> = [];

      for (const [key, value] of Object.entries(data)) {
        const lockerNumber = Number(key);
        if (!Number.isFinite(lockerNumber)) continue;

        const latestLocker = getLatestLocker(value, lockerNumber);
        if (!latestLocker || latestLocker.state !== LOCKER_STATE.USED || !latestLocker.endDate) {
          continue;
        }

        const endDate = new Date(latestLocker.endDate);
        endDate.setHours(0, 0, 0, 0);

        if (endDate < today) {
          continue;
        }

        const newEndDate = new Date(endDate.getTime() + days * 24 * 60 * 60 * 1000);
        const newEndDateStr = formatDateToString(newEndDate);
        const updatedLocker: Locker = {
          ...latestLocker,
          endDate: newEndDateStr
        };

        if (Array.isArray(value)) {
          const updated = [...value];
          updated[updated.length - 1] = updatedLocker;
          updates[key] = updated;
        } else {
          updates[key] = updatedLocker;
        }

        if (latestLocker.id && latestLocker.key) {
          extendedLockers.push({
            id: latestLocker.id,
            key: latestLocker.key,
            endDate: newEndDateStr
          });
        }

        extendedCount++;
      }

      return {
        result: { extendedCount, extendedLockers },
        payload: updates,
        operation: 'update'
      };
    });
  }
}
