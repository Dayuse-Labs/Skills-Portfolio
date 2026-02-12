# Testing Guide with Vitest

This guide explains how to write tests for vibe coders.

## Why Test?

Tests are like a safety net. They:
- Catch bugs before users do
- Allow you to modify code with confidence
- Document how the code should work
- Save time in the long run

---

## Installation

### Install Vitest

```bash
npm install -D vitest @vitest/coverage-v8
```

### Configure Vitest

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'src/**/*.test.ts'],
    },
  },
});
```

### Add Scripts to package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Writing Tests

### Test File Location

Place tests next to the code they test:

```
src/
├── domain/
│   └── entities/
│       ├── user.ts
│       └── user.test.ts    # Tests for user.ts
```

### Basic Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { User } from './user';
import { Email } from '../value-objects/email';

describe('User', () => {
  // Group related tests
  describe('constructor', () => {
    it('should create a user with valid data', () => {
      // Arrange - prepare test data
      const id = '123';
      const name = 'John';
      const emailResult = Email.create('john@example.com');
      if (!emailResult.success) throw new Error('Invalid email');

      // Act - perform the action
      const user = new User(id, name, emailResult.data, new Date());

      // Assert - verify the result
      expect(user.id).toBe(id);
      expect(user.name).toBe(name);
      expect(user.email.value).toBe('john@example.com');
    });
  });

  describe('changeName', () => {
    let user: User;
    let email: Email;

    beforeEach(() => {
      // New user for each test
      const emailResult = Email.create('john@example.com');
      if (!emailResult.success) throw new Error('Invalid email');
      email = emailResult.data;
      user = new User('123', 'John', email, new Date());
    });

    it('should update name when valid', () => {
      const result = user.changeName('Jane');
      expect(result.success).toBe(true);
      expect(user.name).toBe('Jane');
    });

    it('should return error when name is too short', () => {
      const result = user.changeName('J');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('2 characters');
      }
    });
  });
});
```

---

## Test Patterns

### Testing Value Objects

```typescript
import { describe, it, expect } from 'vitest';
import { Email } from './email';

describe('Email', () => {
  describe('create', () => {
    it('should create email with valid format', () => {
      const result = Email.create('test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe('test@example.com');
      }
    });

    it('should normalize email to lowercase', () => {
      const result = Email.create('TEST@EXAMPLE.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe('test@example.com');
      }
    });

    it('should return error for invalid email format', () => {
      const result = Email.create('invalid');
      expect(result.success).toBe(false);
    });

    it('should return error for email without domain dot', () => {
      const result = Email.create('test@example');
      expect(result.success).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same email', () => {
      const email1Result = Email.create('test@example.com');
      const email2Result = Email.create('test@example.com');

      if (!email1Result.success || !email2Result.success) {
        throw new Error('Invalid emails');
      }

      expect(email1Result.data.equals(email2Result.data)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1Result = Email.create('test@example.com');
      const email2Result = Email.create('other@example.com');

      if (!email1Result.success || !email2Result.success) {
        throw new Error('Invalid emails');
      }

      expect(email1Result.data.equals(email2Result.data)).toBe(false);
    });
  });
});
```

### Testing Use Cases

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateUserUseCase } from './create-user.use-case';
import { UserRepository } from '../../domain/repositories/user-repository.interface';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';

describe('CreateUserUseCase', () => {
  let mockUserRepository: UserRepository;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    // Create a mock of the repository
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      existsByEmail: vi.fn(),
    };
    useCase = new CreateUserUseCase(mockUserRepository);
  });

  it('should create user when email is not taken', async () => {
    // Arrange
    vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false);
    vi.mocked(mockUserRepository.save).mockResolvedValue();

    const input = { name: 'John', email: 'john@example.com' };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John');
      expect(result.data.email).toBe('john@example.com');
    }
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it('should return error when email already exists', async () => {
    // Arrange
    vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(true);

    const input = { name: 'John', email: 'john@example.com' };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('EMAIL_EXISTS');
    }
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('should return validation error for invalid input', async () => {
    // Arrange
    const input = { name: 'J', email: 'invalid' };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('VALIDATION_ERROR');
    }
  });
});
```

---

## Security Tests (Abuse Cases)

Don't only test what the user SHOULD do, but also what they SHOULD NOT be able to do.

### 1. Authorization Tests

Verify that a user cannot access another user's data.

```typescript
it('should fail when accessing other user data', async () => {
  // Arrange
  const user1Id = 'user-1';
  const targetId = 'user-2';

  // Act
  const result = await useCase.execute({ currentUserId: user1Id, targetId });

  // Assert
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.type).toBe('UNAUTHORIZED');
  }
});
```

### 2. Injection and Malicious Data Tests

Verify resistance to dangerous inputs.

```typescript
it('should reject malicious HTML input (XSS)', () => {
  const maliciousInput = '<script>alert("xss")</script>';
  const result = schema.safeParse(maliciousInput);
  expect(result.success).toBe(false);
});

it('should reject negative quantities', () => {
  const result = ProductSchema.safeParse({ quantity: -5 });
  expect(result.success).toBe(false);
});
```

---

## Common Assertions

```typescript
// Equality
expect(value).toBe(expected); // Strict equality (===)
expect(value).toEqual(expected); // Deep equality for objects
expect(value).not.toBe(unexpected); // Negation

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(number);
expect(value).toBeLessThan(number);
expect(value).toBeCloseTo(number, decimals);

// Strings
expect(value).toContain('substring');
expect(value).toMatch(/regex/);

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(number);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject(partialObject);

// Errors (with functions that throw)
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('message');
expect(() => fn()).toThrow(ErrorClass);

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow('error');
```

---

## Mocking

### Function Mocks

```typescript
import { vi } from 'vitest';

// Create a mock
const mockFn = vi.fn();

// Configure the return value
mockFn.mockReturnValue('value');
mockFn.mockResolvedValue('async value'); // For promises

// Verify calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(2);
```

### Module Mocks

```typescript
import { vi } from 'vitest';

// Mock an entire module
vi.mock('../services/email.service', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

// Import after the mock
import { sendEmail } from '../services/email.service';

it('should send email', async () => {
  await sendEmail('test@example.com', 'Hello');
  expect(sendEmail).toHaveBeenCalledWith('test@example.com', 'Hello');
});
```

---

## Test Checklist

For each feature, test:

- [ ] Happy path (normal operation)
- [ ] Edge cases (empty strings, zero, null)
- [ ] Error cases (invalid input, missing data)
- [ ] Boundary conditions (max/min values)
- [ ] Authorization tests (who is allowed to do what)
- [ ] Malicious data injection tests

### Examples of Cases to Test

```typescript
describe('User.changeName', () => {
  // Happy path
  it('should update name with valid input', () => {});

  // Edge cases
  it('should trim whitespace from name', () => {});
  it('should accept name at minimum length (2)', () => {});
  it('should accept name at maximum length (100)', () => {});

  // Error cases
  it('should return error for empty name', () => {});
  it('should return error for name too short', () => {});
  it('should return error for name too long', () => {});
  it('should return error for whitespace-only name', () => {});
});
```

---

## Running Tests

```bash
# Run all tests once
npm run test

# Run in watch mode (re-runs on changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run a specific file
npx vitest run src/domain/entities/user.test.ts

# Run tests matching a pattern
npx vitest run -t "should create"
```

---

## Best Practices

### 1. One Test = One Logical Assertion

```typescript
// BAD - tests multiple things
it('should create and validate user', () => {
  const user = createUser(input);
  expect(user.name).toBe('John');
  expect(user.email).toBe('john@example.com');
  expect(user.id).toBeDefined();
  const validation = validateUser(user);
  expect(validation.valid).toBe(true);
});

// GOOD - separate tests
it('should create user with correct name', () => {
  const user = createUser(input);
  expect(user.name).toBe('John');
});

it('should create user with correct email', () => {
  const user = createUser(input);
  expect(user.email).toBe('john@example.com');
});
```

### 2. Descriptive Test Names

```typescript
// BAD
it('test1', () => {});
it('works', () => {});

// GOOD
it('should return error when email format is invalid', () => {});
it('should update name when new name has valid length', () => {});
```

### 3. Arrange-Act-Assert (AAA)

```typescript
it('should calculate total with discount', () => {
  // Arrange - Prepare
  const cart = new Cart();
  cart.addItem({ price: 100, quantity: 2 });
  const discount = 0.1; // 10%

  // Act - Execute
  const total = cart.calculateTotal(discount);

  // Assert - Verify
  expect(total).toBe(180);
});
```

### 4. Independent Tests

```typescript
// BAD - dependent tests
let user: User;

it('should create user', () => {
  user = createUser(input);
  expect(user).toBeDefined();
});

it('should update user name', () => {
  user.changeName('Jane'); // Depends on the previous test
  expect(user.name).toBe('Jane');
});

// GOOD - independent tests with beforeEach
let user: User;

beforeEach(() => {
  user = createUser(input);
});

it('should create user', () => {
  expect(user).toBeDefined();
});

it('should update user name', () => {
  user.changeName('Jane');
  expect(user.name).toBe('Jane');
});
```
