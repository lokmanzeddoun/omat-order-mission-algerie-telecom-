# Error Handling - Before and After Examples

This document shows real examples of how error handling has improved in the OMAT application.

## Example 1: User Registration with Duplicate Email

### Before ❌

**Backend Error:**
```
Error:
Invalid `prisma.user.create()` invocation:

Unique constraint failed on the fields: (`email`)
    at PrismaClientKnownRequestError.captureStackTrace
    at Object.create (/app/node_modules/@prisma/client/runtime/index.js:123:17)
    ...
```

**Frontend Display:**
```
Error: Request failed
```
or worse, a long technical error message displayed to the user.

### After ✅

**Backend Response:**
```json
{
  "statusCode": 409,
  "message": "Un enregistrement avec ce email existe déjà",
  "error": "Conflit",
  "timestamp": "2025-11-03T10:30:45.123Z",
  "path": "/api/users"
}
```

**Frontend Display:**
```
Alert (Error): Un enregistrement avec ce email existe déjà
```

---

## Example 2: Invalid Login Credentials

### Before ❌

**Backend Error:**
```typescript
throw new BadRequestException('Wrong credentials');
```

**Frontend Code:**
```typescript
catch (err: any) {
  const msg = err?.response?.data?.message || err?.message || 'Login failed';
  dispatch(setAlert({ msg, type: AlertTypes.ERROR }));
}
```

**Frontend Display:**
```
Alert (Error): Wrong credentials
```
(Inconsistent - sometimes technical English, sometimes French)

### After ✅

**Backend Response:**
```json
{
  "statusCode": 400,
  "message": "Wrong credentials",
  "error": "Requête invalide",
  "timestamp": "2025-11-03T10:32:15.456Z",
  "path": "/api/auth/login"
}
```

**Frontend Code:**
```typescript
import { useApiHandler } from 'components/hooks/useErrorHandler';

const { handleError, handleSuccess } = useApiHandler();

try {
  await http.post('/auth/login', credentials);
  handleSuccess('Connexion réussie');
} catch (error) {
  handleError(error); // That's it!
}
```

**Frontend Display:**
```
Alert (Error): Wrong credentials
```
(Consistent format, automatically handled)

---

## Example 3: Network Error (Server Down)

### Before ❌

**Frontend Display:**
```
Alert (Error): Request failed
```
or
```
Alert (Error): Network Error
```
(No guidance for the user)

### After ✅

**Frontend Display:**
```
Alert (Error): Impossible de contacter le serveur
```

The error handler automatically detects network errors and provides a helpful message.

---

## Example 4: Validation Errors

### Before ❌

**Backend Response:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ]
}
```

**Frontend Code:**
```typescript
catch (err: any) {
  // Developer has to manually handle array messages
  let msg = err?.response?.data?.message;
  if (Array.isArray(msg)) {
    msg = msg.join(', ');
  }
  dispatch(setAlert({ msg: msg || 'Validation error', type: AlertTypes.ERROR }));
}
```

**Frontend Display:**
```
Alert (Error): email must be an email, password must be longer than or equal to 6 characters
```

### After ✅

**Backend Response:**
```json
{
  "statusCode": 400,
  "message": "email must be an email, password must be longer than or equal to 6 characters",
  "error": "Requête invalide",
  "timestamp": "2025-11-03T10:35:20.789Z",
  "path": "/api/users"
}
```

**Frontend Code:**
```typescript
const { handleError } = useApiHandler();

try {
  await http.post('/users', userData);
} catch (error) {
  handleError(error); // Automatically handles array messages
}
```

**Frontend Display:**
```
Alert (Error): email must be an email, password must be longer than or equal to 6 characters
```
(Same result, but much simpler code)

---

## Example 5: Unauthorized Access

### Before ❌

**Frontend Display:**
```
Alert (Error): 401
```
or
```
Alert (Error): Unauthorized
```
(Not helpful for users)

### After ✅

**Frontend Display:**
```
Alert (Error): Vous devez vous connecter pour continuer
```

And the system automatically:
1. Tries to refresh the token
2. If refresh fails, logs out the user
3. Redirects to the login page

---

## Example 6: Deleting a Referenced Record

### Before ❌

**Backend Error (Prisma):**
```
Foreign key constraint failed on the field: `structureCode`
```

**Frontend Display:**
```
Alert (Error): Request failed
```
(User has no idea what went wrong)

### After ✅

**Backend Response:**
```json
{
  "statusCode": 400,
  "message": "Impossible de supprimer cet enregistrement car il est référencé ailleurs",
  "error": "Requête invalide",
  "timestamp": "2025-11-03T10:40:12.345Z",
  "path": "/api/structures/ABC123"
}
```

**Frontend Display:**
```
Alert (Error): Impossible de supprimer cet enregistrement car il est référencé ailleurs
```

---

## Code Reduction

### Component Example

**Before:** ~15 lines per error handling
```typescript
import { setAlert } from 'components/alert/alert.reducer';
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'store';
import { AlertTypes } from 'constants/alert';

const MyComponent = () => {
  const dispatch = useDispatch<AppDispatch>();

  const submit = async () => {
    try {
      const res = await http.post('/api/endpoint', data);
      dispatch(setAlert({
        msg: 'Success',
        type: AlertTypes.SUCCESS
      }));
    } catch (err: any) {
      const msg = err?.response?.data?.message ||
                  err?.message ||
                  'Something went wrong';
      dispatch(setAlert({
        msg,
        type: AlertTypes.ERROR
      }));
    }
  };
};
```

**After:** ~8 lines per error handling (47% reduction)
```typescript
import { useApiHandler } from 'components/hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError, handleSuccess } = useApiHandler();

  const submit = async () => {
    try {
      await http.post('/api/endpoint', data);
      handleSuccess('Opération réussie');
    } catch (error) {
      handleError(error);
    }
  };
};
```

---

## Summary of Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Error Messages | Technical, English, inconsistent | User-friendly, French, consistent |
| Code Complexity | 15+ lines per handler | 8 lines per handler |
| Prisma Errors | Raw technical messages | Translated user-friendly messages |
| Validation Errors | Manual array handling | Automatic handling |
| Network Errors | Generic messages | Specific helpful messages |
| Auth Errors | Manual token refresh | Automatic token refresh + logout |
| Developer Experience | Repetitive boilerplate | Simple hooks |
| User Experience | Confusing technical errors | Clear actionable messages |
| Security | Risk of leaking internal details | Protected - only safe messages shown |
