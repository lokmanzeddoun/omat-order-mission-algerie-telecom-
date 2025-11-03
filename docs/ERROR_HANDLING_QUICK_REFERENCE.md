# Error Handling Quick Reference

## Frontend Usage

### Simple Error Handling
```typescript
import { useErrorHandler } from 'components/hooks/useErrorHandler';

const handleError = useErrorHandler();

try {
  await http.get('/api/data');
} catch (error) {
  handleError(error);
}
```

### Complete API Handling
```typescript
import { useApiHandler } from 'components/hooks/useErrorHandler';

const { handleError, handleSuccess, handleWarning, handleInfo } = useApiHandler();

try {
  await http.post('/api/data', payload);
  handleSuccess('Opération réussie');
} catch (error) {
  handleError(error);
}
```

### Custom Error Message
```typescript
handleError(error, 'Message personnalisé');
```

### Direct Error Extraction
```typescript
import { extractErrorMessage } from 'helpers/errorHandler';

const message = extractErrorMessage(error);
console.log(message); // User-friendly message
```

## Backend Usage

### Throw Standard Exceptions
```typescript
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException
} from '@nestjs/common';

// Filters automatically convert these to user-friendly responses
throw new BadRequestException('Invalid data');
throw new NotFoundException('User not found');
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Access denied');
throw new ConflictException('Resource already exists');
```

### Custom Messages
```typescript
// Single message
throw new BadRequestException('Ce champ est requis');

// Multiple messages (for validation)
throw new BadRequestException([
  'Email invalide',
  'Mot de passe trop court'
]);
// Frontend will show: "Email invalide, Mot de passe trop court"
```

## Error Response Format

All API errors return:
```typescript
{
  statusCode: number;
  message: string;        // User-friendly message
  error: string;         // Error type (French)
  timestamp: string;     // ISO timestamp
  path: string;         // Request path
}
```

## Common Patterns

### Loading State with Error
```typescript
const [loading, setLoading] = useState(false);
const { handleError, handleSuccess } = useApiHandler();

const loadData = async () => {
  setLoading(true);
  try {
    const response = await http.get('/api/data');
    setData(response.data);
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
};
```

### Form Submission
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await http.post('/api/submit', formData);
    handleSuccess('Formulaire soumis avec succès');
    resetForm();
  } catch (error) {
    handleError(error);
  }
};
```

### Delete with Confirmation
```typescript
const handleDelete = async (id) => {
  if (!confirm('Êtes-vous sûr?')) return;

  try {
    await http.delete(`/api/items/${id}`);
    handleSuccess('Supprimé avec succès');
    refreshList();
  } catch (error) {
    handleError(error);
  }
};
```

## Prisma Error Codes

| Code | Meaning | User Message |
|------|---------|-------------|
| P2002 | Unique constraint | "Un enregistrement avec ce {field} existe déjà" |
| P2025 | Record not found | "L'enregistrement demandé n'existe pas" |
| P2003 | Foreign key constraint | "Impossible de supprimer cet enregistrement car il est référencé ailleurs" |
| P2014 | Required relation | "Une relation requise est manquante" |

## HTTP Status Codes

| Code | User Message |
|------|-------------|
| 400 | "Requête invalide" |
| 401 | "Vous devez vous connecter pour continuer" |
| 403 | "Vous n'avez pas les permissions nécessaires" |
| 404 | "Ressource introuvable" |
| 409 | "Cette ressource existe déjà" |
| 500 | "Erreur serveur. Veuillez réessayer plus tard." |

## Utility Functions

### Check Error Type
```typescript
import { isNetworkError, isAuthError } from 'helpers/errorHandler';

if (isNetworkError(error)) {
  // Handle network error
}

if (isAuthError(error)) {
  // Handle auth error (401/403)
}
```

### Get Debug Details
```typescript
import { getErrorDetails } from 'helpers/errorHandler';

if (import.meta.env.DEV) {
  console.log(getErrorDetails(error));
}
```

## Migration Pattern

### Before
```typescript
import { useDispatch } from 'react-redux';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';

const dispatch = useDispatch<AppDispatch>();

try {
  await http.post('/api/data', payload);
  dispatch(setAlert({ msg: 'Success', type: AlertTypes.SUCCESS }));
} catch (err: any) {
  const msg = err?.response?.data?.message || err?.message || 'Error';
  dispatch(setAlert({ msg, type: AlertTypes.ERROR }));
}
```

### After
```typescript
import { useApiHandler } from 'components/hooks/useErrorHandler';

const { handleError, handleSuccess } = useApiHandler();

try {
  await http.post('/api/data', payload);
  handleSuccess('Opération réussie');
} catch (error) {
  handleError(error);
}
```

## Auto-Handled Features

The system automatically handles:
- ✅ Token refresh on 401 errors
- ✅ Logout on refresh failure
- ✅ Array message joining
- ✅ Blob error parsing
- ✅ Network error detection
- ✅ Error message normalization

## Documentation

- 📚 Full Guide: `/docs/error-handling.md`
- 📋 Examples: `/docs/error-handling-examples.md`
- 🔄 Migration: `/docs/error-handling-migration.md`
- 📊 Summary: `/docs/IMPLEMENTATION_SUMMARY.md`
