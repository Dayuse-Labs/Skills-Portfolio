# Result Pattern for Error Handling

This guide explains how to use the Result pattern instead of throw/catch.

## Why Avoid Exceptions?

### Problems with throw/catch

```typescript
// ❌ Problems with exceptions
function createUser(input: CreateUserInput): User {
  if (!isValidEmail(input.email)) {
    throw new Error('Invalid email'); // 1. We don't know it can throw
  }
  if (await emailExists(input.email)) {
    throw new Error('Email already in use'); // 2. Multiple error types mixed together
  }
  return new User(input);
}

// The caller doesn't know it needs to handle errors
const user = createUser(input); // Can blow up!
```

### Benefits of the Result Pattern

```typescript
// ✅ With Result, errors are explicit
function createUser(input: CreateUserInput): Result<User, CreateUserError> {
  if (!isValidEmail(input.email)) {
    return err({ type: 'INVALID_EMAIL', email: input.email });
  }
  // ...
  return ok(new User(input));
}

// The caller MUST handle the result
const result = createUser(input);
if (!result.success) {
  // Handle the error - TypeScript requires it
}
```

---

## Result Type Implementation

```typescript
// src/shared/result.ts

/**
 * Result type for explicit error handling
 * Inspired by Rust and other functional languages
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Creates a successful result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Creates an error result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Checks if a result is a success (type guard)
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Checks if a result is an error (type guard)
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}
```

---

## Basic Usage

### Returning a Result

```typescript
import { Result, ok, err } from '../shared/result';

interface DivisionError {
  type: 'DIVISION_BY_ZERO';
}

function divide(a: number, b: number): Result<number, DivisionError> {
  if (b === 0) {
    return err({ type: 'DIVISION_BY_ZERO' });
  }
  return ok(a / b);
}
```

### Consuming a Result

```typescript
const result = divide(10, 2);

// Pattern 1: if/else
if (result.success) {
  console.log(`Result: ${result.data}`);
} else {
  console.error(`Error: ${result.error.type}`);
}

// Pattern 2: Early return
if (!result.success) {
  return handleError(result.error);
}
// Here result.data is available and typed
console.log(result.data);
```

---

## Structured Error Types

### Defining Error Types

```typescript
// Specific error types for a use case
export type CreateUserError =
  | { type: 'VALIDATION_ERROR'; message: string; field?: string }
  | { type: 'EMAIL_EXISTS'; email: string }
  | { type: 'INVALID_EMAIL'; email: string }
  | { type: 'DATABASE_ERROR'; cause: Error };

// Usage
function createUser(input: unknown): Result<User, CreateUserError> {
  // Validation
  const parseResult = CreateUserSchema.safeParse(input);
  if (!parseResult.success) {
    return err({
      type: 'VALIDATION_ERROR',
      message: parseResult.error.message,
    });
  }

  // Email verification
  const emailResult = Email.create(parseResult.data.email);
  if (!emailResult.success) {
    return err({
      type: 'INVALID_EMAIL',
      email: parseResult.data.email,
    });
  }

  // ... rest of the logic
  return ok(user);
}
```

### Handling Errors by Type

```typescript
const result = await createUser(input);

if (!result.success) {
  switch (result.error.type) {
    case 'VALIDATION_ERROR':
      return res.status(400).json({
        error: 'Invalid data',
        message: result.error.message,
      });

    case 'EMAIL_EXISTS':
      return res.status(409).json({
        error: 'Conflict',
        message: `The email ${result.error.email} is already in use`,
      });

    case 'INVALID_EMAIL':
      return res.status(400).json({
        error: 'Invalid email',
        email: result.error.email,
      });

    case 'DATABASE_ERROR':
      console.error('Database error:', result.error.cause);
      return res.status(500).json({
        error: 'Internal error',
      });
  }
}

// Success
return res.status(201).json(result.data);
```

---

## Chaining Results

### Map - Transforming the Value

```typescript
/**
 * Transforms the value of a successful Result
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.data));
  }
  return result;
}

// Usage
const numberResult = divide(10, 2); // Result<number, DivisionError>
const stringResult = map(numberResult, (n) => n.toString()); // Result<string, DivisionError>
```

### FlatMap - Chaining Operations

```typescript
/**
 * Chains operations that return Results
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.data);
  }
  return result;
}

// Usage
function parseNumber(str: string): Result<number, ParseError> {
  const num = Number(str);
  if (isNaN(num)) {
    return err({ type: 'PARSE_ERROR', value: str });
  }
  return ok(num);
}

function divideStrings(a: string, b: string): Result<number, ParseError | DivisionError> {
  const numA = parseNumber(a);
  if (!numA.success) return numA;

  const numB = parseNumber(b);
  if (!numB.success) return numB;

  return divide(numA.data, numB.data);
}
```

### Complete Chaining Example

```typescript
type UserCreationError =
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'EMAIL_INVALID'; email: string }
  | { type: 'EMAIL_EXISTS'; email: string }
  | { type: 'DATABASE_ERROR'; cause: Error };

async function createUser(
  rawInput: unknown
): Promise<Result<User, UserCreationError>> {
  // Step 1: Validate the input
  const validationResult = validate(CreateUserSchema, rawInput);
  if (!validationResult.success) {
    return err({
      type: 'VALIDATION_ERROR',
      message: validationResult.error.message,
    });
  }
  const input = validationResult.data;

  // Step 2: Create the Email Value Object
  const emailResult = Email.create(input.email);
  if (!emailResult.success) {
    return err({
      type: 'EMAIL_INVALID',
      email: input.email,
    });
  }

  // Step 3: Check uniqueness
  const exists = await userRepository.existsByEmail(emailResult.data.value);
  if (exists) {
    return err({
      type: 'EMAIL_EXISTS',
      email: input.email,
    });
  }

  // Step 4: Create and save
  const user = new User(generateId(), input.name, emailResult.data);

  try {
    await userRepository.save(user);
  } catch (cause) {
    return err({
      type: 'DATABASE_ERROR',
      cause: cause instanceof Error ? cause : new Error(String(cause)),
    });
  }

  return ok(user);
}
```

---

## Useful Helpers

### FromPromise - Promise Wrapper

```typescript
/**
 * Converts a Promise into a Result
 */
export async function fromPromise<T, E = Error>(
  promise: Promise<T>,
  mapError?: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return ok(data);
  } catch (error) {
    if (mapError) {
      return err(mapError(error));
    }
    return err(error as E);
  }
}

// Usage
const result = await fromPromise(
  fetch('/api/users').then((r) => r.json()),
  (error) => ({ type: 'FETCH_ERROR' as const, cause: error })
);
```

### Combine - Combining Multiple Results

```typescript
/**
 * Combines multiple Results into one
 * Fails as soon as one Result fails
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (!result.success) {
      return result;
    }
    values.push(result.data);
  }

  return ok(values);
}

// Usage
const emailResults = [
  Email.create('a@example.com'),
  Email.create('b@example.com'),
  Email.create('invalid'),
];

const combined = combine(emailResults);
// If one fails, returns the error
// If all succeed, returns ok([Email, Email, Email])
```

### GetOrDefault - Default Value

```typescript
/**
 * Returns the value or a default if error
 */
export function getOrDefault<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.data : defaultValue;
}

// Usage
const count = getOrDefault(parseNumber(input), 0);
```

---

## When to Use Result vs Exceptions

### Use Result For

- Predictable business errors (email exists, validation failed)
- Cases where the error is part of the normal flow
- When the caller must handle the error

```typescript
// ✅ Business error = Result
function withdraw(amount: number): Result<void, InsufficientFunds> {
  if (this.balance < amount) {
    return err({ type: 'INSUFFICIENT_FUNDS', balance: this.balance, requested: amount });
  }
  this.balance -= amount;
  return ok(undefined);
}
```

### Use Exceptions For

- Bugs and programming errors
- Truly exceptional situations
- Unrecoverable errors

```typescript
// ✅ Bug = Exception
function getElementById(id: string): Element {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element ${id} not found - this is a bug`);
  }
  return element;
}
```

---

## Best Practices

### 1. Always Type Your Errors

```typescript
// ❌ BAD - untyped error
function process(): Result<Data, Error> { ... }

// ✅ GOOD - explicitly typed error
type ProcessError =
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'NOT_FOUND'; id: string };

function process(): Result<Data, ProcessError> { ... }
```

### 2. Name Error Types Descriptively

```typescript
// ❌ BAD
type Error = { type: 'ERROR_1' | 'ERROR_2' };

// ✅ GOOD
type CreateOrderError =
  | { type: 'PRODUCT_NOT_FOUND'; productId: string }
  | { type: 'INSUFFICIENT_STOCK'; available: number; requested: number }
  | { type: 'INVALID_QUANTITY'; quantity: number };
```

### 3. Include Context in Errors

```typescript
// ❌ BAD - no context
return err({ type: 'NOT_FOUND' });

// ✅ GOOD - context included
return err({
  type: 'USER_NOT_FOUND',
  userId: id,
  searchedAt: new Date(),
});
```
