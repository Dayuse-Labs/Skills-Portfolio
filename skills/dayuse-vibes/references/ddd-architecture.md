# Guide Architecture DDD

Ce guide explique les concepts DDD de manière simple pour les non-développeurs.

## Pourquoi DDD ?

DDD (Domain-Driven Design) aide à organiser le code pour que :
- Les règles métier soient centralisées (couche domain)
- Les détails techniques ne polluent pas la logique métier
- Le code soit facile à comprendre et maintenir
- Les changements dans une zone n'affectent pas les autres

---

## Les 4 Couches Expliquées

### 1. Domain Layer - Le Cœur de l'Application

C'est le "livre de règles" de votre métier. Elle contient :

**Entités** - Objets avec une identité unique qui compte

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
      return err('Le nom doit faire au moins 2 caractères');
    }
    if (trimmed.length > 100) {
      return err('Le nom ne peut pas dépasser 100 caractères');
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

**Value Objects** - Objets définis par leurs valeurs, pas leur identité

```typescript
// src/domain/value-objects/email.ts
import { Result, ok, err } from '../../shared/result';

export class Email {
  private constructor(public readonly value: string) {}

  static create(email: string): Result<Email, string> {
    const normalized = email.toLowerCase().trim();

    if (!normalized) {
      return err('L\'email ne peut pas être vide');
    }

    if (!normalized.includes('@')) {
      return err('L\'email doit contenir @');
    }

    const parts = normalized.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return err('Format d\'email invalide');
    }

    if (!parts[1].includes('.')) {
      return err('Le domaine doit contenir un point');
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

**Interfaces Repository** - Contrats pour l'accès aux données (PAS d'implémentation ici)

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

### 2. Application Layer - L'Orchestrateur

Contient les use cases qui coordonnent les opérations métier :

```typescript
// src/application/use-cases/create-user.use-case.ts
import { z } from 'zod';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { UserRepository } from '../../domain/repositories/user-repository.interface';
import { Result, ok, err } from '../../shared/result';

// Schéma de validation Zod
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
    // 1. Valider l'entrée avec Zod
    const parseResult = CreateUserSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return err({
        type: 'VALIDATION_ERROR',
        message: parseResult.error.issues.map(i => i.message).join(', '),
      });
    }
    const input = parseResult.data;

    // 2. Créer le value object Email
    const emailResult = Email.create(input.email);
    if (!emailResult.success) {
      return err({ type: 'INVALID_EMAIL', message: emailResult.error });
    }

    // 3. Vérifier les règles métier
    const exists = await this.userRepository.existsByEmail(
      emailResult.data.value
    );
    if (exists) {
      return err({ type: 'EMAIL_EXISTS', email: input.email });
    }

    // 4. Créer l'entité
    const user = new User(
      crypto.randomUUID(),
      input.name,
      emailResult.data,
      new Date()
    );

    // 5. Persister
    await this.userRepository.save(user);

    // 6. Retourner le DTO de sortie
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

### 3. Infrastructure Layer - Les Détails Techniques

Implémente les interfaces définies dans le domaine :

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
      throw new Error(`Email invalide en BDD: ${row.email}`);
    }
    return new User(row.id, row.name, emailResult.data, row.created_at);
  }
}
```

---

### 4. Interfaces Layer - Points d'Entrée

Comment les utilisateurs/systèmes interagissent avec l'application :

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
            error: `L'email ${result.error.email} est déjà utilisé`,
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

## Organisation des Fichiers

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

## Erreurs Courantes à Éviter

### 1. Code BDD dans la couche domaine

```typescript
// ❌ MAUVAIS - L'entité appelle la BDD
class User {
  async save(): Promise<void> {
    await db.query('INSERT INTO users...');
  }
}

// ✅ BON - L'entité est pure, le repository gère la persistence
class User {
  // Logique métier uniquement
}

// Dans le use case
await userRepository.save(user);
```

### 2. Logique métier dans les contrôleurs

```typescript
// ❌ MAUVAIS - Validation et règles dans le contrôleur HTTP
app.post('/users', async (req, res) => {
  if (req.body.name.length < 2) {
    return res.status(400).json({ error: 'Nom trop court' });
  }
  const existing = await db.query('SELECT * FROM users WHERE email = ?', [
    req.body.email,
  ]);
  if (existing) {
    return res.status(409).json({ error: 'Email déjà utilisé' });
  }
  // ...
});

// ✅ BON - Toute la logique dans le use case
app.post('/users', async (req, res) => {
  const result = await createUserUseCase.execute(req.body);
  // Juste gérer la réponse HTTP
});
```

### 3. Dépendances directes entre couches

```typescript
// ❌ MAUVAIS - Le domaine importe de l'infrastructure
import { PostgresUserRepository } from '../../infrastructure/repositories';

class User {
  constructor(private repo: PostgresUserRepository) {}
}

// ✅ BON - Le domaine définit l'interface, l'infrastructure l'implémente
// domain/repositories/user-repository.interface.ts
export interface UserRepository {
  save(user: User): Promise<void>;
}

// infrastructure/repositories/postgres-user.repository.ts
export class PostgresUserRepository implements UserRepository {
  async save(user: User): Promise<void> { /* ... */ }
}
```

### 4. Sauter la couche application

```typescript
// ❌ MAUVAIS - Le contrôleur appelle directement le domaine
app.post('/users', async (req, res) => {
  const user = new User(id, req.body.name, email);
  await userRepository.save(user);
  res.json(user);
});

// ✅ BON - Le contrôleur appelle le use case
app.post('/users', async (req, res) => {
  const result = await createUserUseCase.execute(req.body);
  // ...
});
```

---

## Quand Utiliser Quoi

| Situation | Couche | Exemple |
|-----------|--------|---------|
| Règle métier | Domain | "Un utilisateur doit avoir un email valide" |
| Validation de format | Domain (Value Object) | Email.create() valide le format |
| Orchestration | Application | CreateUserUseCase coordonne la création |
| Accès BDD | Infrastructure | PostgresUserRepository.save() |
| Réponse HTTP | Interfaces | UserController.create() |
| Validation d'entrée | Application | Zod schema dans le use case |
