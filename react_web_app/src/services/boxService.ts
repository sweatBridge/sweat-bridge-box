import { BoxRepository } from '../repositories/boxRepository';
import { BoxInfo } from '../types/box';

export class BoxService {
  static async getBoxInfo(boxName: string): Promise<BoxInfo | null> {
    return BoxRepository.getBoxInfo(boxName);
  }

  static async updateBoxInfo(boxInfo: BoxInfo): Promise<void> {
    return BoxRepository.updateBoxInfo(boxInfo);
  }
}
