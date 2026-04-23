import { AppError } from '@/lib/errors/appError';
import {
  NotificationRecord,
  NotificationRepository,
  NotificationType,
} from '@/lib/repositories/notificationRepository';

function isNotificationType(value: unknown): value is NotificationType {
  return value === 'warning' || value === 'error' || value === 'success' || value === 'info';
}

export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  listNotifications(): NotificationRecord[] {
    return this.notificationRepository.listAll();
  }

  createNotification(
    title: unknown,
    message: unknown,
    type: unknown
  ): NotificationRecord {
    if (typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError('Title is required', 400);
    }
    if (typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError('Message is required', 400);
    }
    if (!isNotificationType(type)) {
      throw new AppError('Type must be warning, error, success, or info', 400);
    }

    return this.notificationRepository.create(title.trim(), message.trim(), type);
  }

  markAllAsRead(): { updated: number } {
    return { updated: this.notificationRepository.markAllAsRead() };
  }

  clearAll(): { deleted: number } {
    return { deleted: this.notificationRepository.clearAll() };
  }
}

export const notificationService = new NotificationService(
  new NotificationRepository()
);
