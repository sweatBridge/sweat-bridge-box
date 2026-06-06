import { CoachMemoRepository } from '../repositories';

export class DashboardMemoService {
  static async getCoachMemo(boxName: string): Promise<string> {
    if (!boxName) return '';
    return CoachMemoRepository.getMemo(boxName);
  }

  static async saveCoachMemo(boxName: string, coachMemo: string): Promise<void> {
    if (!boxName) throw new Error('박스 이름이 없습니다.');
    await CoachMemoRepository.saveMemo(boxName, coachMemo);
  }
}
