import type { DeviceOutputs } from "@solar-energy-app/types";

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/** Backend error contract. */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  code?: string;
  details?: unknown;
}

/** API record shape (dates as ISO strings). */
export interface SerializedRecord {
  id: string;
  timestamp: string;
  outputs: DeviceOutputs;
  correctedAt?: string;
  correctionReason?: string;
  originalOutputs?: DeviceOutputs;
  deletedAt?: string;
  version?: string;
}

export interface GetRecordsParams {
  start?: string;
  end?: string;
  device?: string;
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
}

export interface GetRecordsResponse {
  records: SerializedRecord[];
  totalEnergy: number;
  recordCount: number;
}

export interface UploadRecordsResponse {
  count: number;
}

export interface UpdateRecordBody {
  outputs?: Partial<DeviceOutputs>;
  correctionReason?: string;
}
