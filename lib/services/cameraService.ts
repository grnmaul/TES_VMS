import { AppError } from '@/lib/errors/appError';
import {
  CameraPayload,
  CameraRecord,
  CameraRepository,
  CameraStatus,
} from '@/lib/repositories/cameraRepository';
import { wsHub } from '@/lib/realtime/wsHub';
import { rtspToHlsService } from '@/lib/stream/rtspToHlsService';

function isCameraStatus(value: unknown): value is CameraStatus {
  return value === 'online' || value === 'offline';
}

function asNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  return value.trim();
}

function parseId(id: unknown): number {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new AppError('Invalid camera id', 400);
  }
  return numericId;
}

export class CameraService {
  constructor(private readonly cameraRepository: CameraRepository) {}

  listCameras(): Array<CameraRecord & { stream_url: string | null; rtsp_url: string | null }> {
    return this.cameraRepository.listAll().map((camera) => ({
      ...camera,
      rtsp_url: camera.stream_url,
      stream_url: camera.hls_url || camera.stream_url,
    }));
  }

  createCamera(input: {
    name: unknown;
    location: unknown;
    ip_address: unknown;
    stream_url?: unknown;
    status: unknown;
  }): CameraRecord {
    const payload = this.buildPayload(input);
    const created = this.cameraRepository.create(payload);
    rtspToHlsService.sync(created);
    wsHub.broadcast({ type: 'camera:created', payload: created });
    return created;
  }

  updateCamera(
    id: unknown,
    input: {
      name: unknown;
      location: unknown;
      ip_address: unknown;
      stream_url?: unknown;
      status: unknown;
    }
  ): CameraRecord {
    const cameraId = parseId(id);
    const payload = this.buildPayload(input);
    const updated = this.cameraRepository.update(cameraId, payload);

    if (!updated) {
      throw new AppError('Camera not found', 404);
    }

    rtspToHlsService.sync(updated);
    wsHub.broadcast({ type: 'camera:updated', payload: updated });
    return updated;
  }

  deleteCamera(id: unknown): { success: true } {
    const cameraId = parseId(id);
    rtspToHlsService.stop(cameraId);
    const deleted = this.cameraRepository.delete(cameraId);
    if (!deleted) {
      throw new AppError('Camera not found', 404);
    }
    wsHub.broadcast({ type: 'camera:deleted', payload: { id: cameraId } });
    return { success: true };
  }

  private buildPayload(input: {
    name: unknown;
    location: unknown;
    ip_address: unknown;
    stream_url?: unknown;
    status: unknown;
  }): CameraPayload {
    const name = asNonEmptyString(input.name, 'Name');
    const location = asNonEmptyString(input.location, 'Location');
    const ipAddress = asNonEmptyString(input.ip_address, 'IP address');

    if (!isCameraStatus(input.status)) {
      throw new AppError('Status must be online or offline', 400);
    }

    let streamUrl: string | null = null;
    if (typeof input.stream_url === 'string' && input.stream_url.trim().length > 0) {
      streamUrl = input.stream_url.trim();
      // Validate RTSP URL format
      if (!streamUrl.toLowerCase().startsWith('rtsp://') && !streamUrl.toLowerCase().startsWith('rtsps://')) {
        throw new AppError('Stream URL must be a valid RTSP URL (rtsp:// or rtsps://)', 400);
      }
    }

    return {
      name,
      location,
      ip_address: ipAddress,
      stream_url: streamUrl,
      hls_url: null,
      status: input.status,
    };
  }
}

export const cameraService = new CameraService(new CameraRepository());
