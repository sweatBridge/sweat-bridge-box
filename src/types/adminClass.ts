import { BoxStatus } from './box';

export interface AdminClassItem {
  id: string;
  startTime: string;
  endTime: string;
  coach: string;
  capacity: number;
  reservedCount: number;
}

export interface AdminBoxClassStatus {
  boxName: string;
  boxStatus: BoxStatus;
  classes: AdminClassItem[];
  totalCapacity: number;
  reservedCount: number;
}

export interface AdminClassStatusResult {
  boxes: AdminBoxClassStatus[];
  failedBoxNames: string[];
}
