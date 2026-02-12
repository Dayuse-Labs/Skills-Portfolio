# Validation Guide with Zod

This guide explains how to use Zod to validate incoming data.

## Why Zod?

Zod offers two major advantages:
1. **Runtime validation** - Checks data at runtime (not just at compile time)
2. **Type inference** - Automatically generates TypeScript types

```typescript
import { z } from 'zod';

// Define a schema
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

// TypeScript automatically infers the type
type User = z.infer<typeof UserSchema>;
// Equivalent to: { name: string; email: string }
```

---

## Installation

```bash
npm install zod
```

---

## Basic Schemas

### Primitive Types

```typescript
import { z } from 'zod';

// Strings
const stringSchema = z.string();
const emailSchema = z.string().email();
const urlSchema = z.string().url();
const uuidSchema = z.string().uuid();

// With constraints
const nameSchema = z.string().min(2).max(100);
const passwordSchema = z.string().min(8).regex(/[A-Z]/, 'Must contain an uppercase letter');

// Numbers
const numberSchema = z.number();
const positiveSchema = z.number().positive(); // Recommended for IDs, quantities
const priceSchema = z.number().nonnegative(); // Recommended for prices
const intSchema = z.number().int();
const rangeSchema = z.number().min(0).max(100);

// Booleans
const boolSchema = z.boolean();

// Dates
const dateSchema = z.date();
const futureDateSchema = z.date().min(new Date());
```

### Objects

```typescript
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  role: z.enum(['admin', 'user', 'guest']),
  createdAt: z.date().default(() => new Date()),
});

type User = z.infer<typeof UserSchema>;
```

### Arrays

```typescript
// Array of strings
const tagsSchema = z.array(z.string());

// Array with constraints
const itemsSchema = z.array(z.string()).min(1).max(10);

// Array of objects
const usersSchema = z.array(UserSchema);
```

### Unions and Enums

```typescript
// Enum
const RoleSchema = z.enum(['admin', 'user', 'guest']);
type Role = z.infer<typeof RoleSchema>; // 'admin' | 'user' | 'guest'

// Union
const IdSchema = z.union([z.string().uuid(), z.number().int()]);
type Id = z.infer<typeof IdSchema>; // string | number

// Discriminated Union
const EventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('click'), x: z.number(), y: z.number() }),
  z.object({ type: z.literal('scroll'), distance: z.number() }),
]);
```

---

## Validation

### Parse vs SafeParse

```typescript
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

// parse() - Throws an error if invalid
try {
  const user = UserSchema.parse(data);
  // user is typed as { name: string; email: string }
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.issues);
  }
}

// safeParse() - Returns a Result (RECOMMENDED)
const result = UserSchema.safeParse(data);

if (result.success) {
  // result.data is typed as { name: string; email: string }
  console.log(result.data);
} else {
  // result.error contains the details
  console.log(result.error.issues);
}
```

### Integration with the Result Pattern

```typescript
import { z } from 'zod';
import { Result, ok, err } from '../shared/result';

interface ValidationError {
  type: 'VALIDATION_ERROR';
  issues: z.ZodIssue[];
  message: string;
}

function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Result<T, ValidationError> {
  const result = schema.safeParse(data);

  if (result.success) {
    return ok(result.data);
  }

  return err({
    type: 'VALIDATION_ERROR',
    issues: result.error.issues,
    message: result.error.issues.map((i) => i.message).join(', '),
  });
}

// Usage
const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

function createUser(rawInput: unknown): Result<User, CreateUserError> {
  const validationResult = validate(CreateUserSchema, rawInput);

  if (!validationResult.success) {
    return err({
      type: 'VALIDATION_ERROR',
      message: validationResult.error.message,
    });
  }

  const input = validationResult.data;
  // Continue with typed input...
}
```

---

## Schemas for DTOs

### Input DTOs (What we receive)

```typescript
// User creation
export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a digit'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// Update (all fields optional)
export const UpdateUserSchema = CreateUserSchema.partial().omit({
  password: true,
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// Request with pagination
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
```

### Query Parameters

```typescript
// Query params are always strings, use coerce
export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  active: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
});

// Usage with Express
app.get('/users', (req, res) => {
  const result = SearchQuerySchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }
  const { q, page, limit, active } = result.data;
  // ...
});
```

---

## Transformations

### Transform

```typescript
// Normalize an email
const EmailSchema = z
  .string()
  .email()
  .transform((email) => email.toLowerCase().trim());

// Parse a date from a string
const DateStringSchema = z.string().transform((str) => new Date(str));

// Extract a field
const UserIdSchema = z
  .object({ user: z.object({ id: z.string() }) })
  .transform((data) => data.user.id);
```

### Preprocess

```typescript
// Clean before validation
const CleanStringSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim() : val),
  z.string().min(1)
);

// Convert null to undefined
const OptionalSchema = z.preprocess(
  (val) => (val === null ? undefined : val),
  z.string().optional()
);
```

---

## Sanitization and Security

### Input Cleaning

Use `transform` or `regex` to clean dangerous inputs (XSS, injections).

```typescript
// Remove HTML tags (XSS)
const BioSchema = z.string()
  .transform((val) => val.replace(/<[^>]*>/g, ''));

// Character whitelist (basic SQL Injection protection)
const UsernameSchema = z.string()
  .regex(/^[a-zA-Z0-9_-]+$/, 'Special characters are not allowed');
```

### Securing Numbers

To prevent business logic flaws (e.g., buying -5 items to receive a credit), ALWAYS restrict numbers.

```typescript
// BAD
const QuantitySchema = z.number();

// GOOD
const QuantitySchema = z.number().int().positive(); // > 0
const PriceSchema = z.number().nonnegative(); // >= 0
```

---

## Custom Validation

### Refine

```typescript
const PasswordSchema = z
  .string()
  .min(8)
  .refine((password) => /[A-Z]/.test(password), {
    message: 'Must contain at least one uppercase letter',
  })
  .refine((password) => /[0-9]/.test(password), {
    message: 'Must contain at least one digit',
  });

// Async validation
const UniqueEmailSchema = z.string().email().refine(
  async (email) => {
    const exists = await checkEmailExists(email);
    return !exists;
  },
  { message: 'This email is already in use' }
);
```

### SuperRefine (Context Access)

```typescript
const PasswordConfirmSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });
```

---

## Custom Error Messages

```typescript
const UserSchema = z.object({
  name: z.string({
    required_error: 'Name is required',
    invalid_type_error: 'Name must be a string',
  }).min(2, { message: 'Name must be at least 2 characters' }),

  email: z.string().email({ message: 'Invalid email format' }),

  age: z
    .number({ invalid_type_error: 'Age must be a number' })
    .int({ message: 'Age must be an integer' })
    .positive({ message: 'Age must be positive' }),
});
```

---

## Best Practices

### 1. Validate at the Boundary

```typescript
// Validate as soon as data enters the system
app.post('/users', async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }
  // result.data is now typed and validated
  const user = await createUserUseCase.execute(result.data);
});
```

### 2. Reusable Schemas

```typescript
// Define base schemas
const EmailSchema = z.string().email().toLowerCase();
const NameSchema = z.string().min(2).max(100).trim();
const IdSchema = z.string().uuid();

// Compose for DTOs
const CreateUserSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
});

const UserSchema = z.object({
  id: IdSchema,
  name: NameSchema,
  email: EmailSchema,
  createdAt: z.date(),
});
```

### 3. Export Types and Schemas Together

```typescript
// user.schemas.ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  createdAt: z.date(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
```

### 4. Never Trust External Data

```typescript
// BAD - trusts the data
async function handleWebhook(req: Request): Promise<void> {
  const { userId, action } = req.body;
  await processAction(userId, action);
}

// GOOD - always validate
const WebhookSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['created', 'updated', 'deleted']),
  timestamp: z.string().datetime(),
});

async function handleWebhook(req: Request): Promise<void> {
  const result = WebhookSchema.safeParse(req.body);
  if (!result.success) {
    throw new Error('Invalid webhook payload');
  }
  await processAction(result.data.userId, result.data.action);
}
```
