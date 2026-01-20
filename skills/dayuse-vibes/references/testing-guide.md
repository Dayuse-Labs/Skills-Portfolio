# Guide de Tests avec Vitest

Ce guide explique comment écrire des tests pour les vibe coders.

## Pourquoi Tester ?

Les tests sont comme un filet de sécurité. Ils :
- Attrapent les bugs avant les utilisateurs
- Permettent de modifier le code en confiance
- Documentent comment le code doit fonctionner
- Économisent du temps à long terme

---

## Installation

### Installer Vitest

```bash
npm install -D vitest @vitest/coverage-v8
```

### Configurer Vitest

Créer `vitest.config.ts` :

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

### Ajouter les Scripts au package.json

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

## Écrire des Tests

### Localisation des Fichiers de Test

Placer les tests à côté du code qu'ils testent :

```
src/
├── domain/
│   └── entities/
│       ├── user.ts
│       └── user.test.ts    # Tests pour user.ts
```

### Structure de Base

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { User } from './user';
import { Email } from '../value-objects/email';

describe('User', () => {
  // Grouper les tests liés
  describe('constructor', () => {
    it('should create a user with valid data', () => {
      // Arrange - préparer les données de test
      const id = '123';
      const name = 'John';
      const emailResult = Email.create('john@example.com');
      if (!emailResult.success) throw new Error('Email invalide');

      // Act - effectuer l'action
      const user = new User(id, name, emailResult.data, new Date());

      // Assert - vérifier le résultat
      expect(user.id).toBe(id);
      expect(user.name).toBe(name);
      expect(user.email.value).toBe('john@example.com');
    });
  });

  describe('changeName', () => {
    let user: User;
    let email: Email;

    beforeEach(() => {
      // Nouveau user pour chaque test
      const emailResult = Email.create('john@example.com');
      if (!emailResult.success) throw new Error('Email invalide');
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
        expect(result.error).toContain('2 caractères');
      }
    });
  });
});
```

---

## Patterns de Tests

### Tester les Value Objects

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
        throw new Error('Emails invalides');
      }

      expect(email1Result.data.equals(email2Result.data)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1Result = Email.create('test@example.com');
      const email2Result = Email.create('other@example.com');

      if (!email1Result.success || !email2Result.success) {
        throw new Error('Emails invalides');
      }

      expect(email1Result.data.equals(email2Result.data)).toBe(false);
    });
  });
});
```

### Tester les Use Cases

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
    // Créer un mock du repository
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

## Assertions Courantes

```typescript
// Égalité
expect(value).toBe(expected); // Égalité stricte (===)
expect(value).toEqual(expected); // Égalité profonde pour objets
expect(value).not.toBe(unexpected); // Négation

// Véracité
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Nombres
expect(value).toBeGreaterThan(number);
expect(value).toBeLessThan(number);
expect(value).toBeCloseTo(number, decimals);

// Chaînes
expect(value).toContain('substring');
expect(value).toMatch(/regex/);

// Tableaux
expect(array).toContain(item);
expect(array).toHaveLength(number);

// Objets
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject(partialObject);

// Erreurs (avec fonctions qui throw)
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('message');
expect(() => fn()).toThrow(ErrorClass);

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow('error');
```

---

## Mocking

### Mock de Fonctions

```typescript
import { vi } from 'vitest';

// Créer un mock
const mockFn = vi.fn();

// Configurer la valeur de retour
mockFn.mockReturnValue('value');
mockFn.mockResolvedValue('async value'); // Pour les promesses

// Vérifier les appels
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(2);
```

### Mock de Modules

```typescript
import { vi } from 'vitest';

// Mock d'un module entier
vi.mock('../services/email.service', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

// Import après le mock
import { sendEmail } from '../services/email.service';

it('should send email', async () => {
  await sendEmail('test@example.com', 'Hello');
  expect(sendEmail).toHaveBeenCalledWith('test@example.com', 'Hello');
});
```

---

## Checklist de Test

Pour chaque fonctionnalité, tester :

- [ ] Chemin nominal (opération normale)
- [ ] Cas limites (chaînes vides, zéro, null)
- [ ] Cas d'erreur (entrée invalide, données manquantes)
- [ ] Conditions aux limites (valeurs max/min)

### Exemples de Cas à Tester

```typescript
describe('User.changeName', () => {
  // Chemin nominal
  it('should update name with valid input', () => {});

  // Cas limites
  it('should trim whitespace from name', () => {});
  it('should accept name at minimum length (2)', () => {});
  it('should accept name at maximum length (100)', () => {});

  // Cas d'erreur
  it('should return error for empty name', () => {});
  it('should return error for name too short', () => {});
  it('should return error for name too long', () => {});
  it('should return error for whitespace-only name', () => {});
});
```

---

## Exécuter les Tests

```bash
# Exécuter tous les tests une fois
npm run test

# Exécuter en mode watch (re-lance sur modifications)
npm run test:watch

# Exécuter avec rapport de couverture
npm run test:coverage

# Exécuter un fichier spécifique
npx vitest run src/domain/entities/user.test.ts

# Exécuter les tests correspondant à un pattern
npx vitest run -t "should create"
```

---

## Bonnes Pratiques

### 1. Un Test = Une Assertion Logique

```typescript
// ❌ MAUVAIS - teste plusieurs choses
it('should create and validate user', () => {
  const user = createUser(input);
  expect(user.name).toBe('John');
  expect(user.email).toBe('john@example.com');
  expect(user.id).toBeDefined();
  const validation = validateUser(user);
  expect(validation.valid).toBe(true);
});

// ✅ BON - tests séparés
it('should create user with correct name', () => {
  const user = createUser(input);
  expect(user.name).toBe('John');
});

it('should create user with correct email', () => {
  const user = createUser(input);
  expect(user.email).toBe('john@example.com');
});
```

### 2. Noms de Tests Descriptifs

```typescript
// ❌ MAUVAIS
it('test1', () => {});
it('works', () => {});

// ✅ BON
it('should return error when email format is invalid', () => {});
it('should update name when new name has valid length', () => {});
```

### 3. Arrange-Act-Assert (AAA)

```typescript
it('should calculate total with discount', () => {
  // Arrange - Préparer
  const cart = new Cart();
  cart.addItem({ price: 100, quantity: 2 });
  const discount = 0.1; // 10%

  // Act - Agir
  const total = cart.calculateTotal(discount);

  // Assert - Vérifier
  expect(total).toBe(180);
});
```

### 4. Tests Indépendants

```typescript
// ❌ MAUVAIS - tests dépendants
let user: User;

it('should create user', () => {
  user = createUser(input);
  expect(user).toBeDefined();
});

it('should update user name', () => {
  user.changeName('Jane'); // Dépend du test précédent
  expect(user.name).toBe('Jane');
});

// ✅ BON - tests indépendants avec beforeEach
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
