# Error Handling System

This document describes the comprehensive error handling system implemented in the OMAT application to ensure consistent and user-friendly error messages across the frontend and backend.

## Overview

The error handling system consists of three main components:

1. **Backend Exception Filters** - Catch and format all errors on the server side
2. **Frontend Error Handler** - Extract and display user-friendly messages from API errors
3. **React Hooks** - Simplify error handling in React components

## Backend (Server)

### Exception Filters

The backend uses multiple exception filters to catch and format errors consistently:

#### 1. HTTP Exception Filter
**Location:** `server/src/common/filters/http-exception.filter.ts`

Catches all HTTP exceptions (BadRequestException, UnauthorizedException, etc.) and formats them with:
- User-friendly error messages
- Consistent response structure
- Proper logging for debugging

#### 2. Prisma Exception Filter
**Location:** `server/src/prisma-client-exception/prisma-client-exception.filter.ts`

Handles Prisma-specific errors and converts them to user-friendly messages:
- **P2002** (Unique constraint) → "Un enregistrement avec ce {field} existe déjà"
- **P2025** (Record not found) → "L'enregistrement demandé n'existe pas"
- **P2003** (Foreign key constraint) → "Impossible de supprimer cet enregistrement car il est référencé ailleurs"
- **P2014** (Required relation) → "Une relation requise est manquante"

#### 3. All Exceptions Filter
**Location:** `server/src/common/filters/all-exceptions.filter.ts`

Catches any unhandled exceptions to prevent internal error details from leaking to the frontend.

### Standard Error Response Format

All errors from the backend now follow this structure:

```typescript
{
  statusCode: number;      // HTTP status code (400, 401, 404, etc.)
  message: string;         // User-friendly error message
  error: string;          // Error type in French
  timestamp: string;      // ISO timestamp
  path: string;          // Request path
}
```

### Usage in Backend

Simply throw standard NestJS exceptions:

```typescript
// services/controllers
throw new BadRequestException('Invalid role');
throw new NotFoundException('User not found');
throw new UnauthorizedException('Invalid credentials');
throw new ConflictException('Email already exists');
```

The filters will automatically format these into user-friendly responses.

## Frontend (Client)

### Error Handler Utility

**Location:** `client/src/helpers/errorHandler.ts`

Provides functions to extract user-friendly error messages from API errors:

```typescript
import { extractErrorMessage, isNetworkError, isAuthError } from 'helpers/errorHandler';

try {
  await http.post('/api/endpoint', data);
} catch (error) {
  const message = extractErrorMessage(error);
  console.log(message); // User-friendly message

  if (isNetworkError(error)) {
    // Handle network errors
  }

  if (isAuthError(error)) {
    // Handle auth errors (401, 403)
  }
}
```

### React Hooks

**Location:** `client/src/components/hooks/useErrorHandler.ts`

#### useErrorHandler

Simple hook for error handling:

```typescript
import { useErrorHandler } from 'components/hooks/useErrorHandler';

const MyComponent = () => {
  const handleError = useErrorHandler();

  const submitData = async () => {
    try {
      await http.post('/api/endpoint', data);
    } catch (error) {
      handleError(error); // Automatically shows error alert
    }
  };

  return <button onClick={submitData}>Submit</button>;
};
```

#### useApiHandler

Complete hook for success/error/warning/info messages:

```typescript
import { useApiHandler } from 'components/hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError, handleSuccess, handleWarning, handleInfo } = useApiHandler();

  const submitData = async () => {
    try {
      const response = await http.post('/api/endpoint', data);
      handleSuccess('Opération réussie');
    } catch (error) {
      handleError(error);
    }
  };

  return <button onClick={submitData}>Submit</button>;
};
```

### HTTP Interceptor

**Location:** `client/src/helpers/http.ts`

The axios instance includes automatic error handling:
- Automatically refreshes tokens on 401 errors
- Normalizes all error messages
- Logs out users when refresh fails
- Attaches user-friendly messages to error objects

## Error Message Translation

The system provides French error messages for common HTTP status codes:

| Status Code | Message |
|-------------|---------|
| 400 | Requête invalide |
| 401 | Vous devez vous connecter pour continuer |
| 403 | Vous n'avez pas les permissions nécessaires |
| 404 | Ressource introuvable |
| 409 | Cette ressource existe déjà |
| 422 | Données invalides |
| 429 | Trop de requêtes. Veuillez réessayer plus tard. |
| 500 | Erreur serveur. Veuillez réessayer plus tard. |
| 502 | Service temporairement indisponible |
| 503 | Service en maintenance |

## Migration Guide

### Before (Old Pattern)

```typescript
// ❌ Old way - inconsistent error handling
try {
  const res = await http.post('/api/endpoint', data);
  dispatch(setAlert({ msg: 'Success', type: AlertTypes.SUCCESS }));
} catch (err: any) {
  const msg = err?.response?.data?.message || err?.message || 'Error';
  dispatch(setAlert({ msg, type: AlertTypes.ERROR }));
}
```

### After (New Pattern)

```typescript
// ✅ New way - consistent and simple
import { useApiHandler } from 'components/hooks/useErrorHandler';

const { handleError, handleSuccess } = useApiHandler();

try {
  const res = await http.post('/api/endpoint', data);
  handleSuccess('Opération réussie');
} catch (error) {
  handleError(error); // Automatically extracts and displays user-friendly message
}
```

## Benefits

1. **Consistency** - All errors follow the same format across the application
2. **User-Friendly** - Technical errors are converted to readable French messages
3. **Developer-Friendly** - Simple hooks and utilities make error handling easy
4. **Security** - Internal error details never leak to the frontend
5. **Debugging** - Comprehensive logging in development mode
6. **Maintainability** - Centralized error handling logic

## Testing

### Testing Backend Errors

```bash
# Test Prisma unique constraint error
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@example.com"}'

# Expected response:
# {
#   "statusCode": 409,
#   "message": "Un enregistrement avec ce email existe déjà",
#   "error": "Conflit",
#   "timestamp": "2025-11-03T...",
#   "path": "/api/users"
# }
```

### Testing Frontend Error Handling

1. Open browser console
2. Trigger an error (e.g., submit invalid data)
3. Verify that:
   - User sees a French error message in an alert
   - Console shows detailed error (dev mode only)
   - No internal error details are exposed

## Future Improvements

- [ ] Add error tracking/monitoring service (e.g., Sentry)
- [ ] Implement retry logic for network errors
- [ ] Add offline detection and queuing
- [ ] Create error boundary components for React
- [ ] Add more specific Prisma error codes
- [ ] Implement rate limiting error handling
