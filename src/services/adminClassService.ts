import { extractDateTimeFromDocKey } from '../models/classModel';
import { AdminBoxRepository, ClassRepository } from '../repositories';
import { AdminBoxClassStatus, AdminClassItem, AdminClassStatusResult } from '../types/adminClass';
import { BoxInfo } from '../types/box';
import { FirebaseClassDocument } from '../repositories/classRepository';

const MAX_CONCURRENT_BOX_REQUESTS = 6;

function toClassItem(document: FirebaseClassDocument): AdminClassItem {
  const parsed = extractDateTimeFromDocKey(document.docKey);
  return {
    id: document.docKey,
    startTime: `${parsed.startHour}:${parsed.startMin}`,
    endTime: `${parsed.endHour}:${parsed.endMin}`,
    coach: document.data.coach || '-',
    capacity: document.data.cap || 0,
    reservedCount: document.data.reserved?.length ?? 0,
  };
}

function toStatus(box: BoxInfo, documents: FirebaseClassDocument[]): AdminBoxClassStatus {
  const classes = documents
    .map(toClassItem)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return {
    boxName: box.boxName,
    boxStatus: box.status ?? 'active',
    classes,
    totalCapacity: classes.reduce((sum, item) => sum + item.capacity, 0),
    reservedCount: classes.reduce((sum, item) => sum + item.reservedCount, 0),
  };
}

export class AdminClassService {
  /**
   * 전체 고객사의 하루 수업 등록 현황을 조회합니다.
   * 박스별 API/Firestore 조회가 필요하므로 동시 요청 수를 제한하고,
   * 개별 박스 실패는 전체 조회 실패로 전파하지 않습니다.
   */
  static async getDailyStatus(date: Date): Promise<AdminClassStatusResult> {
    const boxes = await AdminBoxRepository.listAllBoxes();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const statuses: Array<AdminBoxClassStatus | undefined> = new Array(boxes.length);
    const failedBoxNames: string[] = [];
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < boxes.length) {
        const index = nextIndex;
        nextIndex += 1;
        const box = boxes[index];
        try {
          const documents = await ClassRepository.getClassesInRange(box.boxName, start, end);
          statuses[index] = toStatus(box, documents);
        } catch {
          failedBoxNames.push(box.boxName);
          statuses[index] = toStatus(box, []);
        }
      }
    };

    const workerCount = Math.min(MAX_CONCURRENT_BOX_REQUESTS, Math.max(boxes.length, 1));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return {
      boxes: statuses
        .filter((status): status is AdminBoxClassStatus => status !== undefined)
        .sort((a, b) => a.boxName.localeCompare(b.boxName, 'ko')),
      failedBoxNames: failedBoxNames.sort((a, b) => a.localeCompare(b, 'ko')),
    };
  }
}
