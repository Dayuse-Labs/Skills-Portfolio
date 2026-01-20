# Guide Validation avec Zod

Ce guide explique comment utiliser Zod pour valider les données entrantes.

## Pourquoi Zod ?

Zod offre deux avantages majeurs :
1. **Validation runtime** - Vérifie les données à l'exécution (pas juste au compile)
2. **Inférence de types** - Génère automatiquement les types TypeScript

```typescript
import { z } from 'zod';

// Définir un schéma
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

// TypeScript infère automatiquement le type
type User = z.infer<typeof UserSchema>;
// Équivalent à : { name: string; email: string }
```

---

## Installation

```bash
npm install zod
```

---

## Schémas de Base

### Types Primitifs

```typescript
import { z } from 'zod';

// Chaînes
const stringSchema = z.string();
const emailSchema = z.string().email();
const urlSchema = z.string().url();
const uuidSchema = z.string().uuid();

// Avec contraintes
const nameSchema = z.string().min(2).max(100);
const passwordSchema = z.string().min(8).regex(/[A-Z]/, 'Doit contenir une majuscule');

// Nombres
const numberSchema = z.number();
const positiveSchema = z.number().positive();
const intSchema = z.number().int();
const rangeSchema = z.number().min(0).max(100);

// Booléens
const boolSchema = z.boolean();

// Dates
const dateSchema = z.date();
const futureDateSchema = z.date().min(new Date());
```

### Objets

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

### Tableaux

```typescript
// Tableau de strings
const tagsSchema = z.array(z.string());

// Tableau avec contraintes
const itemsSchema = z.array(z.string()).min(1).max(10);

// Tableau d'objets
const usersSchema = z.array(UserSchema);
```

### Unions et Enums

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

// parse() - Throw une erreur si invalide
try {
  const user = UserSchema.parse(data);
  // user est typé comme { name: string; email: string }
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.issues);
  }
}

// safeParse() - Retourne un Result (RECOMMANDÉ)
const result = UserSchema.safeParse(data);

if (result.success) {
  // result.data est typé comme { name: string; email: string }
  console.log(result.data);
} else {
  // result.error contient les détails
  console.log(result.error.issues);
}
```

### Intégration avec le Pattern Result

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

// Utilisation
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
  // Continuer avec input typé...
}
```

---

## Schémas pour DTOs

### Input DTOs (Ce qu'on reçoit)

```typescript
// Création d'utilisateur
export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Le nom doit faire au moins 2 caractères').max(100),
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit faire au moins 8 caractères')
    .regex(/[A-Z]/, 'Doit contenir une majuscule')
    .regex(/[0-9]/, 'Doit contenir un chiffre'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// Mise à jour (tous les champs optionnels)
export const UpdateUserSchema = CreateUserSchema.partial().omit({
  password: true,
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// Requête avec pagination
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
// Les query params sont toujours des strings, utiliser coerce
export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  active: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
});

// Utilisation avec Express
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
// Normaliser un email
const EmailSchema = z
  .string()
  .email()
  .transform((email) => email.toLowerCase().trim());

// Parser une date depuis une string
const DateStringSchema = z.string().transform((str) => new Date(str));

// Extraire un champ
const UserIdSchema = z
  .object({ user: z.object({ id: z.string() }) })
  .transform((data) => data.user.id);
```

### Preprocess

```typescript
// Nettoyer avant validation
const CleanStringSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim() : val),
  z.string().min(1)
);

// Convertir null en undefined
const OptionalSchema = z.preprocess(
  (val) => (val === null ? undefined : val),
  z.string().optional()
);
```

---

## Validation Personnalisée

### Refine

```typescript
const PasswordSchema = z
  .string()
  .min(8)
  .refine((password) => /[A-Z]/.test(password), {
    message: 'Doit contenir au moins une majuscule',
  })
  .refine((password) => /[0-9]/.test(password), {
    message: 'Doit contenir au moins un chiffre',
  });

// Validation asynchrone
const UniqueEmailSchema = z.string().email().refine(
  async (email) => {
    const exists = await checkEmailExists(email);
    return !exists;
  },
  { message: 'Cet email est déjà utilisé' }
);
```

### SuperRefine (Accès au contexte)

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
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirmPassword'],
      });
    }
  });
```

---

## Messages d'Erreur Personnalisés

```typescript
const UserSchema = z.object({
  name: z.string({
    required_error: 'Le nom est requis',
    invalid_type_error: 'Le nom doit être une chaîne',
  }).min(2, { message: 'Le nom doit faire au moins 2 caractères' }),

  email: z.string().email({ message: 'Format d\'email invalide' }),

  age: z
    .number({ invalid_type_error: 'L\'âge doit être un nombre' })
    .int({ message: 'L\'âge doit être un entier' })
    .positive({ message: 'L\'âge doit être positif' }),
});
```

---

## Bonnes Pratiques

### 1. Valider à la Frontière

```typescript
// ✅ Valider dès l'entrée dans le système
app.post('/users', async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }
  // result.data est maintenant typé et validé
  const user = await createUserUseCase.execute(result.data);
});
```

### 2. Schémas Réutilisables

```typescript
// Définir des schémas de base
const EmailSchema = z.string().email().toLowerCase();
const NameSchema = z.string().min(2).max(100).trim();
const IdSchema = z.string().uuid();

// Composer pour les DTOs
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

### 3. Exporter Types et Schémas Ensemble

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

### 4. Ne Jamais Faire Confiance aux Données Externes

```typescript
// ❌ MAUVAIS - fait confiance aux données
async function handleWebhook(req: Request): Promise<void> {
  const { userId, action } = req.body;
  await processAction(userId, action);
}

// ✅ BON - valide toujours
const WebhookSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['created', 'updated', 'deleted']),
  timestamp: z.string().datetime(),
});

async function handleWebhook(req: Request): Promise<void> {
  const result = WebhookSchema.safeParse(req.body);
  if (!result.success) {
    throw new Error('Payload webhook invalide');
  }
  await processAction(result.data.userId, result.data.action);
}
```
