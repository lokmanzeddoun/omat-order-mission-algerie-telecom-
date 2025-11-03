# Error Handling Migration Checklist

Quick guide for migrating existing code to use the new error handling system.

## For Frontend Components

### Step 1: Import the hook

Replace:
```typescript
import { setAlert } from 'components/alert/alert.reducer';
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'store';
import { AlertTypes } from 'constants/alert';
```

With:
```typescript
import { useApiHandler } from 'components/hooks/useErrorHandler';
// OR for error-only handling:
import { useErrorHandler } from 'components/hooks/useErrorHandler';
```

### Step 2: Update the hook usage

Replace:
```typescript
const dispatch = useDispatch<AppDispatch>();
```

With:
```typescript
const { handleError, handleSuccess } = useApiHandler();
// OR for error-only:
const handleError = useErrorHandler();
```

### Step 3: Update error handling

Replace:
```typescript
catch (err: any) {
  const msg = err?.response?.data?.message || err?.message || 'Error';
  dispatch(setAlert({ msg, type: AlertTypes.ERROR }));
}
```

With:
```typescript
catch (error) {
  handleError(error);
}
```

### Step 4: Update success messages

Replace:
```typescript
dispatch(setAlert({ msg: 'Success!', type: AlertTypes.SUCCESS }));
```

With:
```typescript
handleSuccess('Opération réussie');
```

## Complete Example

### Before:
```typescript
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'store';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import http from 'helpers/http';

const MyComponent = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await http.post('/api/endpoint', data);
      dispatch(setAlert({
        msg: 'Data saved successfully',
        type: AlertTypes.SUCCESS
      }));
    } catch (err: any) {
      const msg = err?.response?.data?.message ||
                  err?.message ||
                  'Failed to save data';
      dispatch(setAlert({ msg, type: AlertTypes.ERROR }));
    } finally {
      setLoading(false);
    }
  };

  return <button onClick={() => handleSubmit({})}>Submit</button>;
};
```

### After:
```typescript
import { useState } from 'react';
import { useApiHandler } from 'components/hooks/useErrorHandler';
import http from 'helpers/http';

const MyComponent = () => {
  const [loading, setLoading] = useState(false);
  const { handleError, handleSuccess } = useApiHandler();

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await http.post('/api/endpoint', data);
      handleSuccess('Données enregistrées avec succès');
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return <button onClick={() => handleSubmit({})}>Submit</button>;
};
```

## Files to Update

Search for these patterns in your codebase:

### Pattern 1: Direct dispatch of alerts
```bash
# Find files using old pattern
grep -r "dispatch(setAlert" client/src/
```

### Pattern 2: Manual error message extraction
```bash
# Find files with manual error handling
grep -r "err?.response?.data?.message" client/src/
```

### Pattern 3: AlertTypes usage
```bash
# Find files importing AlertTypes
grep -r "AlertTypes" client/src/
```

## Already Migrated Files

✅ `/client/src/pages/authentication/ForgotPassword.tsx`
✅ `/client/src/pages/admin/Comments.tsx`

## Files Pending Migration

Search the codebase for files using the old pattern:

```bash
cd client/src
# Find components with old error handling
grep -l "err?.response?.data?.message\|dispatch(setAlert" pages/**/*.tsx components/**/*.tsx
```

## Backend - No Migration Needed! 🎉

The backend exception filters automatically handle all errors. You don't need to change existing error throwing code:

```typescript
// This already works perfectly
throw new BadRequestException('Invalid data');
throw new NotFoundException('User not found');
throw new UnauthorizedException('Invalid token');
```

The filters will automatically convert these to user-friendly responses.

## Testing Checklist

After migrating a component:

- [ ] Trigger a successful action - verify success message appears
- [ ] Trigger a validation error - verify user-friendly message appears
- [ ] Trigger a network error (disconnect internet) - verify appropriate message
- [ ] Trigger an auth error (expired token) - verify auto-refresh works
- [ ] Check browser console - no error leaks in production mode
- [ ] Check that error messages are in French
- [ ] Verify error messages are clear and actionable

## Common Patterns

### Pattern: Multiple try-catch blocks
```typescript
// ✅ Good
const { handleError, handleSuccess } = useApiHandler();

const loadData = async () => {
  try {
    const data = await http.get('/api/data');
    setData(data);
  } catch (error) {
    handleError(error);
  }
};

const saveData = async () => {
  try {
    await http.post('/api/data', formData);
    handleSuccess('Enregistré');
  } catch (error) {
    handleError(error);
  }
};
```

### Pattern: Custom error messages
```typescript
// ✅ When you need a custom message
const { handleError } = useErrorHandler();

try {
  await http.delete(`/api/users/${userId}`);
} catch (error) {
  handleError(error, 'Impossible de supprimer cet utilisateur');
  //              ^^^^^ Custom message overrides extracted message
}
```

### Pattern: Error with additional handling
```typescript
// ✅ When you need to do something else on error
const { handleError } = useErrorHandler();

try {
  await http.post('/api/submit', data);
} catch (error) {
  handleError(error); // Shows the alert
  setFormValid(false); // Additional custom logic
  resetForm();
}
```

## Questions?

- See full documentation: `/docs/error-handling.md`
- See examples: `/docs/error-handling-examples.md`
- Check the implementation:
  - Frontend: `/client/src/helpers/errorHandler.ts`
  - Backend: `/server/src/common/filters/`
