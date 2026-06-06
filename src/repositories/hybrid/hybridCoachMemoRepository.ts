import { serverRead, serverWrite } from '../../data/apiClient';
import { CoachMemoRepository } from '../coachMemoRepository';
import { ServerCoachMemoRepository } from '../server/serverCoachMemoRepository';

export class HybridCoachMemoRepository {
  // ServerCoachMemoRepository.getMemo는 404도 ''로 반환하므로
  // null이 아닌 모든 결과(빈 문자열 포함)를 서버 응답으로 채택한다.
  static async getMemo(boxName: string): Promise<string> {
    const serverMemo = await serverRead(
      () => ServerCoachMemoRepository.getMemo(boxName),
      `CoachMemo.get(${boxName})`
    );
    if (serverMemo !== null) return serverMemo;
    return CoachMemoRepository.getMemo(boxName);
  }

  static async saveMemo(boxName: string, content: string): Promise<void> {
    await CoachMemoRepository.saveMemo(boxName, content);
    serverWrite(
      () => ServerCoachMemoRepository.upsertMemo(boxName, content),
      `CoachMemo.upsert(${boxName})`
    );
  }
}
