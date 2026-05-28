/**
 * Type declarations for Password-Protected URL Shortener
 */

export interface ShortenedUrl {
  id: string;
  originalUrl: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  visitCount: number;
  title?: string;
}

export interface ShortenedUrlPublicInfo {
  id: string;
  createdAt: string;
  visitCount: number;
  title?: string;
  hasPassword?: boolean;
}

export interface UrlCreationRequest {
  originalUrl: string;
  password?: string;
  customId?: string;
  title?: string;
}

export interface UrlVerificationRequest {
  id: string;
  password?: string;
}

export interface VerificationResponse {
  success: boolean;
  originalUrl?: string;
  error?: string;
}
