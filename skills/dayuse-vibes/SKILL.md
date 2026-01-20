---
name: dayuse-vibes
description: Use this skill when generating code, creating features, writing TypeScript, building components, implementing functionality, or helping with any coding task. Enforces professional standards for non-developers doing "vibe coding" - ensures DDD architecture, strict TypeScript (no any), systematic testing, linting, Zod validation, and Result pattern for errors.
---

# Dayuse Vibe Coding Standards

Ce skill garantit que le code généré pour des non-développeurs respecte des standards professionnels tout en restant compréhensible.

## Principes Fondamentaux

Lors de la génération de code, respecter OBLIGATOIREMENT :

1. **TypeScript uniquement** - Tout le code doit être en TypeScript strict
2. **Pas de type `any`** - Le type `any` est strictement interdit
3. **Architecture DDD** - Organiser le code selon Domain-Driven Design
4. **Tests systématiques** - Chaque fonctionnalité nécessite des tests
5. **Linting obligatoire** - Le code doit passer ESLint et Prettier
6. **Validation Zod** - Valider les entrées externes avec Zod
7. **Pattern Result** - Utiliser Result<T, E> au lieu de throw/catch

---

## Architecture DDD

Organiser le code en 4 couches distinctes :

```
src/
├── domain/           # Logique métier (LE QUOI)
│   ├── entities/     # Objets métier avec identité
│   ├── value-objects/# Objets immuables sans identité
│   ├── repositories/ # Interfaces d'accès aux données
│   └── services/     # Opérations métier complexes
│
├── application/      # Cas d'usage (LE COMMENT)
│   ├── use-cases/    # Opérations métier unitaires
│   └── dtos/         # Objets de transfert de données
│
├── infrastructure/   # Détails techniques (LE OÙ)
│   ├── repositories/ # Implémentations BDD/API
│   ├── services/     # Services externes
│   └── persistence/  # Configuration BDD
│
└── interfaces/       # Points d'entrée (LE QUI)
    ├── http/         # Contrôleurs REST
    ├── cli/          # Commandes CLI
    └── events/       # Gestionnaires d'événements
```

### Règles des Couches

| Couche | Dépend de | Contient |
|--------|-----------|----------|
| Domain | Rien | Entités, Value Objects, Interfaces Repository |
| Application | Domain | Use Cases, DTOs |
| Infrastructure | Domain | Implémentations Repository, Services externes |
| Interfaces | Application | Contrôleurs, CLI, Event Handlers |

---

## TypeScript Strict

### Configuration Requise

Tous les projets doivent avoir dans `tsconfig.json` :

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Alternatives au type `any`

| Au lieu de `any` | Utiliser | Quand |
|------------------|----------|-------|
| `any` | `unknown` | Type vraiment inconnu (nécessite type guard) |
| `any[]` | `T[]` | Tableaux typés |
| `any` | Interface spécifique | Structure connue |
| `any` | Union types | Plusieurs types possibles |
| `any` | Generic `<T>` | Composants réutilisables |
| `any` | `Record<string, unknown>` | Dictionnaires d'objets |

### Pattern de Type Guard

```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}
```

---

## Validation avec Zod

Utiliser Zod pour valider TOUTES les entrées externes :

```typescript
import { z } from 'zod';

// Définir le schéma
const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

// Inférer le type TypeScript
type CreateUserInput = z.infer<typeof CreateUserSchema>;

// Valider les données
function validateInput(data: unknown): Result<CreateUserInput, ValidationError> {
  const result = CreateUserSchema.safeParse(data);
  if (!result.success) {
    return err(new ValidationError(result.error.issues));
  }
  return ok(result.data);
}
```

---

## Pattern Result

Ne jamais utiliser throw/catch pour les erreurs métier. Utiliser le pattern Result :

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Helpers
const ok = <T>(data: T): Result<T, never> => ({ success: true, data });
const err = <E>(error: E): Result<never, E> => ({ success: false, error });

// Utilisation
function createUser(input: CreateUserInput): Result<User, UserError> {
  if (await userExists(input.email)) {
    return err(new EmailAlreadyExistsError(input.email));
  }
  const user = new User(generateId(), input.name, input.email);
  return ok(user);
}

// Consommation
const result = createUser(input);
if (!result.success) {
  // Gérer l'erreur
  return handleError(result.error);
}
// Utiliser result.data
```

---

## Tests avec Vitest

### Localisation des Tests

Placer les tests à côté des fichiers source :

```
src/domain/entities/
├── user.ts
└── user.test.ts
```

### Structure des Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('User', () => {
  describe('changeName', () => {
    it('should update name when valid', () => {
      // Arrange
      const user = new User('1', 'John', email);

      // Act
      user.changeName('Jane');

      // Assert
      expect(user.name).toBe('Jane');
    });

    it('should return error when name too short', () => {
      const user = new User('1', 'John', email);
      const result = user.changeName('J');
      expect(result.success).toBe(false);
    });
  });
});
```

### Tests Requis Pour

- Toutes les entités et value objects du domaine
- Tous les use cases de l'application
- Toutes les fonctions publiques
- Les cas limites et la gestion d'erreurs

---

## Linting

### Commandes à Exécuter

Avant de terminer TOUTE tâche de code :

```bash
npm run lint        # Vérifier les problèmes
npm run lint:fix    # Corriger automatiquement
npm run format      # Formater avec Prettier
npm run test        # Lancer les tests
```

### Script de Vérification Complète

```bash
npm run lint:fix && npm run format && npm run test
```

---

## Workflow de Génération de Code

Pour chaque nouvelle fonctionnalité :

### 1. Déterminer la Couche
- Logique métier pure ? → `domain/`
- Orchestration d'opérations ? → `application/`
- Intégration externe ? → `infrastructure/`
- Point d'entrée ? → `interfaces/`

### 2. Créer avec les Bons Types
- Définir les interfaces en premier
- Utiliser des types explicites partout
- Jamais utiliser `any`
- Valider les entrées avec Zod

### 3. Gérer les Erreurs avec Result
- Définir les types d'erreur spécifiques
- Retourner Result au lieu de throw
- Documenter les cas d'erreur

### 4. Écrire les Tests
- Créer le fichier test à côté du source
- Tester le chemin nominal
- Tester les cas d'erreur

### 5. Vérifier la Qualité
```bash
npm run lint:fix && npm run format && npm run test
```

---

## Conventions de Nommage

| Type | Convention | Exemple |
|------|------------|---------|
| Fichiers | kebab-case | `user-repository.ts` |
| Classes | PascalCase | `UserRepository` |
| Interfaces | PascalCase | `UserRepository` |
| Fonctions | camelCase | `createUser` |
| Constantes | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| Types | PascalCase | `CreateUserDTO` |
| Schémas Zod | PascalCase + Schema | `CreateUserSchema` |

---

## Ressources Additionnelles

Pour des guides détaillés, consulter :

- **[references/ddd-architecture.md](references/ddd-architecture.md)** - Patterns DDD complets
- **[references/typescript-patterns.md](references/typescript-patterns.md)** - Alternatives au type any
- **[references/testing-guide.md](references/testing-guide.md)** - Guide complet Vitest
- **[references/linting-setup.md](references/linting-setup.md)** - Configuration ESLint/Prettier
- **[references/zod-validation.md](references/zod-validation.md)** - Validation avec Zod
- **[references/result-pattern.md](references/result-pattern.md)** - Pattern Result détaillé

---

## Quick Reference

```
TOUJOURS :
✓ TypeScript strict
✓ Types explicites partout
✓ Tests pour tout le code
✓ Linter avant de terminer
✓ Structure DDD
✓ Zod pour les entrées externes
✓ Result pour les erreurs métier

JAMAIS :
✗ Type any
✗ Sauter les tests
✗ Ignorer les erreurs linter
✗ Logique infra dans le domaine
✗ throw/catch pour erreurs métier
✗ Données non validées
```
