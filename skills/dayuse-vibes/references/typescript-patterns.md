# TypeScript Patterns for Vibe Coders

This guide helps non-developers write correct TypeScript without using `any`.

## The Golden Rule: No `any`

The `any` type defeats the purpose of TypeScript. It's like buying a guard dog and leaving it locked outside.

---

## Pattern 1: Unknown vs Any

When you truly don't know the type, use `unknown`:

```typescript
// ❌ BAD - any bypasses all checks
function processData(data: any) {
  return data.name; // No error, but can crash at runtime
}

// ✅ GOOD - unknown requires a type check
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    return (data as { name: string }).name;
  }
  throw new Error('Invalid data structure');
}
```

---

## Pattern 2: Type Guards

Create functions that narrow types:

```typescript
// Define what a User looks like
interface User {
  id: string;
  name: string;
  email: string;
}

// Type guard function
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).name === 'string' &&
    typeof (value as User).email === 'string'
  );
}

// Usage
function handleUserData(data: unknown): User {
  if (isUser(data)) {
    return data; // TypeScript now knows this is a User
  }
  throw new Error('Invalid user data');
}
```

---

## Pattern 3: Generics for Reusability

Instead of `any` for flexible functions:

```typescript
// ❌ BAD - any loses type information
function firstElement(arr: any[]): any {
  return arr[0];
}

// ✅ GOOD - generic preserves the type
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Usage - TypeScript knows the return type
const numbers = [1, 2, 3];
const first = firstElement(numbers); // Type: number | undefined

const names = ['Alice', 'Bob'];
const firstName = firstElement(names); // Type: string | undefined
```

### Common Generics Examples

```typescript
// Generic mapping function
function mapArray<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}

// Generic filtering function
function filterArray<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  return arr.filter(predicate);
}

// Generic class
class Container<T> {
  constructor(private value: T) {}

  getValue(): T {
    return this.value;
  }

  map<U>(fn: (value: T) => U): Container<U> {
    return new Container(fn(this.value));
  }
}
```

---

## Pattern 4: Union Types

When a value can be one of several specific types:

```typescript
// ❌ BAD
function formatValue(value: any): string {
  return String(value);
}

// ✅ GOOD
function formatValue(value: string | number | boolean): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return value ? 'Yes' : 'No';
}
```

### Union with Objects (Discriminated Unions)

```typescript
// Define different result types
interface SuccessResult {
  status: 'success';
  data: User;
}

interface ErrorResult {
  status: 'error';
  message: string;
}

type ApiResult = SuccessResult | ErrorResult;

// Usage - TypeScript narrows based on status
function handleResult(result: ApiResult): void {
  if (result.status === 'success') {
    console.log(result.data.name); // TypeScript knows data exists
  } else {
    console.error(result.message); // TypeScript knows message exists
  }
}
```

---

## Pattern 5: Record Types

For object dictionaries:

```typescript
// ❌ BAD
const config: any = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};

// ✅ GOOD - when keys are known
interface Config {
  apiUrl: string;
  timeout: number;
  retries?: number;
}

const config: Config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};

// ✅ GOOD - when keys are dynamic
const userScores: Record<string, number> = {
  alice: 100,
  bob: 85,
};

// Record with more complex types
interface UserProfile {
  name: string;
  score: number;
}

const profiles: Record<string, UserProfile> = {
  user1: { name: 'Alice', score: 100 },
  user2: { name: 'Bob', score: 85 },
};
```

---

## Pattern 6: Function Types

Always type function parameters and return values:

```typescript
// ❌ BAD
const calculate = (a, b) => a + b;

// ✅ GOOD
const calculate = (a: number, b: number): number => a + b;

// For callbacks
interface ButtonProps {
  onClick: (event: MouseEvent) => void;
  label: string;
}

// Reusable function type
type AsyncHandler<T> = (data: T) => Promise<void>;

const handleUser: AsyncHandler<User> = async (user) => {
  console.log(user.name);
};
```

---

## Pattern 7: Handling API Responses

```typescript
// Define the expected response shape
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface User {
  id: string;
  name: string;
}

// Type guard for ApiResponse
function isApiResponse<T>(
  value: unknown,
  isData: (v: unknown) => v is T
): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'status' in value &&
    'message' in value &&
    typeof (value as ApiResponse<T>).status === 'number' &&
    typeof (value as ApiResponse<T>).message === 'string' &&
    isData((value as ApiResponse<T>).data)
  );
}

// Typed fetch wrapper
async function fetchUser(id: string): Promise<ApiResponse<User>> {
  const response = await fetch(`/api/users/${id}`);
  const json: unknown = await response.json();

  if (!isApiResponse<User>(json, isUser)) {
    throw new Error('Invalid API response');
  }

  return json;
}
```

---

## Pattern 8: Utility Types

Utility types for flexibility:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// For updates - all fields optional
type UpdateUserDTO = Partial<Omit<User, 'id'>>;
// Result: { name?: string; email?: string; avatar?: string }

// For creation - require specific fields
type CreateUserDTO = Pick<User, 'name' | 'email'>;
// Result: { name: string; email: string }

// Make optional fields required
type CompleteUser = Required<User>;
// Result: { id: string; name: string; email: string; avatar: string }

// Read-only
type ReadonlyUser = Readonly<User>;
// All fields become readonly
```

---

## Pattern 9: Const Assertions

For literal types:

```typescript
// Without const assertion - type is string[]
const ROLES = ['admin', 'user', 'guest'];

// With const assertion - type is readonly ['admin', 'user', 'guest']
const ROLES = ['admin', 'user', 'guest'] as const;

// Now we can derive a type
type Role = (typeof ROLES)[number]; // 'admin' | 'user' | 'guest'

// Usage
function setRole(role: Role): void {
  // Only accepts 'admin', 'user', or 'guest'
}

// For objects too
const STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];
// 'pending' | 'active' | 'inactive'
```

---

## Pattern 10: Narrowing with Assertions

```typescript
// Non-null assertion
function getUser(id: string): User | null {
  // ...
}

const user = getUser('123');
// user is User | null

if (user) {
  // TypeScript knows user is User here
  console.log(user.name);
}

// With assertion (use with caution)
const user = getUser('123')!; // Force non-null
// Prefer an explicit check

// Type assertion
const input = document.getElementById('email') as HTMLInputElement;
input.value = 'test@example.com';
```

---

## Quick Reference: Alternatives to `any`

| Situation | Use |
|-----------|-----|
| Unknown type | `unknown` + type guard |
| Array of mixed types | Union type `(string \| number)[]` |
| Object with dynamic keys | `Record<string, T>` |
| Flexible function | Generics `<T>` |
| Multiple possible shapes | Discriminated union |
| JSON from an API | Interface + validation (Zod) |
| Event handlers | Appropriate event types |
| Third-party data | Type guards |
| Optional value | `T \| undefined` or `T \| null` |
| Callback | Explicit function type |

---

## Anti-Patterns to Avoid

```typescript
// ❌ Cast to any to bypass errors
const data = someValue as any;

// ❌ Type assertion without validation
const user = response as User;

// ❌ Ignoring TypeScript errors
// @ts-ignore
const value = problematicCode();

// ❌ Implicit any (untyped parameters)
function process(data) {
  // data is implicitly any
}

// ✅ Always type explicitly
function process(data: ProcessInput): ProcessOutput {
  // ...
}
```
