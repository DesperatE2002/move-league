// Custom Error Classes for Move League API
// Standart hata yönetimi için error sınıfları

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Yetkisiz erişim. Lütfen giriş yapın.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Bu işlem için yetkiniz yok.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Kayıt bulunamadı.') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class DatabaseError extends ApiError {
  constructor(message = 'Veritabanı hatası oluştu.', details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

// Error handler utility
export function handleApiError(error: unknown): { message: string; statusCode: number; code?: string } {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    // Prisma errors
    if (error.message.includes('Unique constraint')) {
      return {
        message: 'Bu kayıt zaten mevcut.',
        statusCode: 409,
        code: 'UNIQUE_CONSTRAINT',
      };
    }
    
    if (error.message.includes('Foreign key constraint')) {
      return {
        message: 'İlişkili kayıt bulunamadı.',
        statusCode: 400,
        code: 'FOREIGN_KEY_ERROR',
      };
    }

    return {
      message: error.message || 'Beklenmeyen bir hata oluştu.',
      statusCode: 500,
      code: 'INTERNAL_ERROR',
    };
  }

  return {
    message: 'Bilinmeyen bir hata oluştu.',
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
  };
}
