# DDD Architecture Guide

This guide explains DDD concepts in a simple way for non-developers.

## Why DDD?

DDD (Domain-Driven Design) helps organize code so that:
- Business rules are centralized (Domain Layer)
- Technical details do not pollute business logic
- Code is easy to understand and maintain
- Changes in one area do not affect others

---

## The 4 Layers Explained

### 1. Domain Layer - The Heart of the Application

This is the "rule book" of your business. It contains:

**Entities** - Objects with a unique identity that matters

```typescript
// src/domain/entities/user.ts
import { Email } from '../value-objects/email';
import { Result, ok, err } from '../../shared/result';

export class User {
  private _name: string;
  private _email: Email;
  private readonly _createdAt: Date;

  constructor(
    public readonly id: string,
    name: string,
    email: Email,
    createdAt: Date = new Date()
  ) {
    this._name = name;
    this._email = email;
    this._createdAt = createdAt;
  }

  get name(): string {
    return this._name;
  }

  get email(): Email {
    return this._email;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  changeName(newName: string): Result<void, string> {
    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      return err('Name must be at least 2 characters');
    }
    if (trimmed.length > 100) {
      return err('Name cannot exceed 100 characters');
    }
    this._name = trimmed;
    return ok(undefined);
  }

  changeEmail(newEmail: Email): void {
    this._email = newEmail;
  }

  get accountAgeInDays(): number {
    const now = new Date();
    const diffMs = now.getTime() - this._createdAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  equals(other: User): boolean {
    return this.id === other.id;
  }
}
```

**Value Objects** - Objects defined by their values, not their identity

```typescript
// src/domain/value-objects/email.ts
import { Result, ok, err } from '../../shared/result';

export class Email {
  private constructor(public readonly value: string) {}

  static create(email: string): Result<Email, string> {
    const normalized = email.toLowerCase().trim();

    if (!normalized) {
      return err('Email cannot be empty');
    }

    if (!normalized.includes('@')) {
      return err('Email must contain @');
    }

    const parts = normalized.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return err('Invalid email format');
    }

    if (!parts[1].includes('.')) {
      return err('Domain must contain a dot');
    }

    return ok(new Email(normalized));
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  get domain(): string {
    return this.value.split('@')[1] ?? '';
  }

  toString(): string {
    return this.value;
  }
}
```

**Repository Interfaces** - Contracts for data access (NO implementation here)

```typescript
// src/domain/repositories/user-repository.interface.ts
import { User } from '../entities/user';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
}
```

---

### 2. Application Layer - The Orchestrator

Contains the use cases that coordinate business operations:

```typescript
// src/application/use-cases/create-user.use-case.ts
import { z } from 'zod';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { UserRepository } from '../../domain/repositories/user-repository.interface';
import { Result, ok, err } from '../../shared/result';

// Zod validation schema
export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export interface CreateUserOutput {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export type CreateUserError =
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'EMAIL_EXISTS'; email: string }
  | { type: 'INVALID_EMAIL'; message: string };

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    rawInput: unknown
  ): Promise<Result<CreateUserOutput, CreateUserError>> {
    // 1. Validate input with Zod
    const parseResult = CreateUserSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return err({
        type: 'VALIDATION_ERROR',
        message: parseResult.error.issues.map(i => i.message).join(', '),
      });
    }
    const input = parseResult.data;

    // 2. Create the Email value object
    const emailResult = Email.create(input.email);
    if (!emailResult.success) {
      return err({ type: 'INVALID_EMAIL', message: emailResult.error });
    }

    // 3. Check business rules
    const exists = await this.userRepository.existsByEmail(
      emailResult.data.value
    );
    if (exists) {
      return err({ type: 'EMAIL_EXISTS', email: input.email });
    }

    // 4. Create the entity
    const user = new User(
      crypto.randomUUID(),
      input.name,
      emailResult.data,
      new Date()
    );

    // 5. Persist
    await this.userRepository.save(user);

    // 6. Return the output DTO
    return ok({
      id: user.id,
      name: user.name,
      email: user.email.value,
      createdAt: user.createdAt,
    });
  }
}
```

---

### 3. Infrastructure Layer - The Technical Details

Implements the interfaces defined in the domain:

```typescript
// src/infrastructure/repositories/postgres-user.repository.ts
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { UserRepository } from '../../domain/repositories/user-repository.interface';
import { db } from '../persistence/database';

interface UserRow {
  id: string;
  name: string;
  email: string;
  created_at: Date;
}

export class PostgresUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await db.queryOne<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await db.queryOne<UserRow>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return row ? this.toDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    await db.query(
      `INSERT INTO users (id, name, email, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
       SET name = $2, email = $3`,
      [user.id, user.name, user.email.value, user.createdAt]
    );
  }

  async delete(id: string): Promise<void> {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await db.queryOne<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists',
      [email]
    );
    return result?.exists ?? false;
  }

  private toDomain(row: UserRow): User {
    const emailResult = Email.create(row.email);
    if (!emailResult.success) {
      throw new Error(`Invalid email in database: ${row.email}`);
    }
    return new User(row.id, row.name, emailResult.data, row.created_at);
  }
}
```

---

### 4. Interfaces Layer - Entry Points

How users/systems interact with the application:

```typescript
// src/interfaces/http/controllers/user.controller.ts
import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../../application/use-cases/create-user.use-case';

export class UserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async create(req: Request, res: Response): Promise<void> {
    const result = await this.createUserUseCase.execute(req.body);

    if (!result.success) {
      switch (result.error.type) {
        case 'VALIDATION_ERROR':
          res.status(400).json({ error: result.error.message });
          return;
        case 'EMAIL_EXISTS':
          res.status(409).json({
            error: `Email ${result.error.email} is already in use`,
          });
          return;
        case 'INVALID_EMAIL':
          res.status(400).json({ error: result.error.message });
          return;
      }
    }

    res.status(201).json(result.data);
  }
}
```

---

## File Organization

```
src/
├── domain/
│   ├── entities/
│   │   ├── user.ts
│   │   ├── user.test.ts
│   │   ├── order.ts
│   │   └── order.test.ts
│   ├── value-objects/
│   │   ├── email.ts
│   │   ├── email.test.ts
│   │   ├── money.ts
│   │   └── money.test.ts
│   ├── repositories/
│   │   ├── user-repository.interface.ts
│   │   └── order-repository.interface.ts
│   └── services/
│       ├── pricing.service.ts
│       └── pricing.service.test.ts
│
├── application/
│   ├── use-cases/
│   │   ├── create-user.use-case.ts
│   │   ├── create-user.use-case.test.ts
│   │   ├── place-order.use-case.ts
│   │   └── place-order.use-case.test.ts
│   └── dtos/
│       ├── user.dto.ts
│       └── order.dto.ts
│
├── infrastructure/
│   ├── repositories/
│   │   ├── postgres-user.repository.ts
│   │   └── postgres-order.repository.ts
│   ├── services/
│   │   └── stripe-payment.service.ts
│   └── persistence/
│       └── database.ts
│
├── interfaces/
│   ├── http/
│   │   ├── controllers/
│   │   │   └── user.controller.ts
│   │   └── routes/
│   │       └── user.routes.ts
│   └── cli/
│       └── commands/
│           └── seed.command.ts
│
└── shared/
    └── result.ts
```

---

## Common Mistakes to Avoid

### 1. Database code in the Domain Layer

```typescript
// BAD - The entity calls the database
class User {
  async save(): Promise<void> {
    await db.query('INSERT INTO users...');
  }
}

// GOOD - The entity is pure, the repository handles persistence
class User {
  // Business logic only
}

// In the use case
await userRepository.save(user);
```

### 2. Business logic in controllers

```typescript
// BAD - Validation and rules in the HTTP controller
app.post('/users', async (req, res) => {
  if (req.body.name.length < 2) {
    return res.status(400).json({ error: 'Name too short' });
  }
  const existing = await db.query('SELECT * FROM users WHERE email = ?', [
    req.body.email,
  ]);
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }
  // ...
});

// GOOD - All logic in the use case
app.post('/users', async (req, res) => {
  const result = await createUserUseCase.execute(req.body);
  // Just handle the HTTP response
});
```

### 3. Direct dependencies between layers

```typescript
// BAD - The domain imports from the infrastructure
import { PostgresUserRepository } from '../../infrastructure/repositories';

class User {
  constructor(private repo: PostgresUserRepository) {}
}

// GOOD - The domain defines the interface, the infrastructure implements it
// domain/repositories/user-repository.interface.ts
export interface UserRepository {
  save(user: User): Promise<void>;
}

// infrastructure/repositories/postgres-user.repository.ts
export class PostgresUserRepository implements UserRepository {
  async save(user: User): Promise<void> { /* ... */ }
}
```

### 4. Skipping the Application Layer

```typescript
// BAD - The controller calls the domain directly
app.post('/users', async (req, res) => {
  const user = new User(id, req.body.name, email);
  await userRepository.save(user);
  res.json(user);
});

// GOOD - The controller calls the use case
app.post('/users', async (req, res) => {
  const result = await createUserUseCase.execute(req.body);
  // ...
});
```

---

## When to Use What

| Situation | Layer | Example |
|-----------|-------|---------|
| Business rule | Domain | "A user must have a valid email" |
| Format validation | Domain (Value Object) | Email.create() validates the format |
| Orchestration | Application | CreateUserUseCase coordinates the creation |
| Database access | Infrastructure | PostgresUserRepository.save() |
| HTTP response | Interfaces | UserController.create() |
| Input validation | Application | Zod schema in the use case |
