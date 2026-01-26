import { z } from 'zod';

// GraphQL Error class for GraphQL-specific errors
// Named AppGraphQLError to avoid shadowing the native GraphQLError from graphql package
export class AppGraphQLError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly extensions?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppGraphQLError';
  }

  static isAppGraphQLError(error: unknown): error is AppGraphQLError {
    return error instanceof AppGraphQLError;
  }

  static fromGraphQLError(
    error: { message: string; extensions?: Record<string, unknown> & { http?: { status?: number } } }
  ): AppGraphQLError {
    const code = error.extensions?.code as string | undefined;
    const status = 
      (error.extensions?.status as number) || 
      (error.extensions?.http?.status as number) || 
      500;
    const message = error.message || getDefaultErrorMessage(status);
    
    return new AppGraphQLError(message, status, code, error.extensions);
  }
}

// API Error class for consistent error handling (reused from lib/api/errors.ts)
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  static fromResponse(
    status: number, 
    data?: { message?: string; code?: string; details?: unknown }
  ): ApiError {
    const message = data?.message || getDefaultErrorMessage(status);
    return new ApiError(message, status, data?.code, data?.details);
  }
}

function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400: return 'Invalid request';
    case 401: return 'Authentication required';
    case 403: return 'Access denied';
    case 404: return 'Resource not found';
    case 422: return 'Validation failed';
    case 429: return 'Too many requests';
    case 500: return 'Server error';
    case 502: return 'Service unavailable';
    case 503: return 'Service temporarily unavailable';
    default: return 'An unexpected error occurred';
  }
}

// Network error for connection failures
export class NetworkError extends Error {
  constructor(message = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }

  static isNetworkError(error: unknown): error is NetworkError {
    return error instanceof NetworkError;
  }
}

// Zod schema for GraphQL error response
export const graphqlErrorResponseSchema = z.object({
  message: z.string(),
  extensions: z.object({
    code: z.string().optional(),
    status: z.number().optional(),
    http: z.object({
      status: z.number().optional(),
    }).optional(),
  }).optional(),
});

export type GraphQLErrorResponse = z.infer<typeof graphqlErrorResponseSchema>;

// Helper to extract error message from Apollo/GraphQL errors
export function getErrorMessage(error: unknown): string {
  if (AppGraphQLError.isAppGraphQLError(error)) {
    return error.message;
  }
  
  if (ApiError.isApiError(error)) {
    return error.message;
  }
  
  if (NetworkError.isNetworkError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

// Helper to check if error is authentication-related
export function isAuthError(error: unknown): boolean {
  if (AppGraphQLError.isAppGraphQLError(error)) {
    return error.status === 401 || error.status === 403;
  }
  
  if (ApiError.isApiError(error)) {
    return error.status === 401 || error.status === 403;
  }
  
  return false;
}

/**
 * Check if a status code indicates an authentication/authorization error.
 * Use this for raw status codes from GraphQL extensions or HTTP responses.
 * 
 * @param status - HTTP status code
 * @returns true if status is 401 (Unauthorized) or 403 (Forbidden)
 */
export function isAuthStatus(status: number | undefined | null): boolean {
  return status === 401 || status === 403;
}