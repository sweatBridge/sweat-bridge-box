export interface ClassEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    coach: string;
    cap: number;
    reserved: string[];
  };
}

export interface SaveClassModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (result: SaveClassResult) => void;
  selectInfo?: DateSelectInfo;
}

export interface ManageClassModalProps {
  visible: boolean;
  event: ClassEvent | null;
  onClose: () => void;
  onUpdate: (result: UpdateClassResult) => void;
  onDelete: (result: DeleteClassResult) => void;
}

export interface SaveClassResult {
  startTime: string;
  endTime: string;
  startStr?: string;
  endStr?: string;
  coach: string;
  cap: number;
  capacity?: number;
  applyToFourWeeks: boolean;
}

export interface UpdateClassResult {
  coach: string;
  cap: number;
}

export interface DeleteClassResult {
  confirmed: boolean;
}

export interface DateSelectInfo {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
  allDay: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  message: string;
}

export interface ToastMessageProps {
  onCreateToast: (createToastFn: (toast: ToastMessageType) => void) => void;
}

export type ToastMessageType = Omit<ToastMessage, 'id'>; 