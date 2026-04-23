import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '@/lib/errors/appError';
import { AuthRepository } from '@/lib/repositories/authRepository';

const JWT_SECRET = process.env.JWT_SECRET || 'vms-secret-key-2024';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
    full_name: string | null;
  };
}

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  login(username: unknown, password: unknown): LoginResponse {
    if (typeof username !== 'string' || username.trim().length === 0) {
      throw new AppError('Username is required', 400);
    }
    if (typeof password !== 'string' || password.length === 0) {
      throw new AppError('Password is required', 400);
    }

    const user = this.authRepository.findByUsername(username.trim());
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
      },
    };
  }

  register(username: unknown, password: unknown, fullName: unknown): { success: true } {
    if (typeof username !== 'string' || username.trim().length < 3) {
      throw new AppError('Username must be at least 3 characters', 400);
    }
    if (typeof password !== 'string' || password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }
    if (typeof fullName !== 'string' || fullName.trim().length === 0) {
      throw new AppError('Full name is required', 400);
    }

    const normalizedUsername = username.trim();
    if (this.authRepository.findByUsername(normalizedUsername)) {
      throw new AppError('Username already exists', 400);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    this.authRepository.createUser(normalizedUsername, hashedPassword, fullName.trim());
    return { success: true };
  }

  forgotPassword(username: unknown): { success: true; message: string } {
    if (typeof username !== 'string' || username.trim().length === 0) {
      throw new AppError('Username is required', 400);
    }

    const user = this.authRepository.findByUsername(username.trim());
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      success: true,
      message: 'Recovery instructions sent',
    };
  }
}

export const authService = new AuthService(new AuthRepository());
