# Patterns TypeScript pour Vibe Coders

Ce guide aide les non-développeurs à écrire du TypeScript correct sans utiliser `any`.

## La Règle d'Or : Pas de `any`

Le type `any` annule l'intérêt de TypeScript. C'est comme acheter un chien de garde et le laisser enfermé dehors.

---

## Pattern 1 : Unknown vs Any

Quand vous ne connaissez vraiment pas le type, utilisez `unknown` :

```typescript
// ❌ MAUVAIS - any contourne toute vérification
function processData(data: any) {
  return data.name; // Pas d'erreur, mais peut planter à l'exécution
}

// ✅ BON - unknown exige une vérification de type
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    return (data as { name: string }).name;
  }
  throw new Error('Structure de données invalide');
}
```

---

## Pattern 2 : Type Guards

Créer des fonctions qui affinent les types :

```typescript
// Définir à quoi ressemble un User
interface User {
  id: string;
  name: string;
  email: string;
}

// Fonction type guard
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

// Utilisation
function handleUserData(data: unknown): User {
  if (isUser(data)) {
    return data; // TypeScript sait maintenant que c'est un User
  }
  throw new Error('Données utilisateur invalides');
}
```

---

## Pattern 3 : Generics pour la Réutilisabilité

Au lieu de `any` pour les fonctions flexibles :

```typescript
// ❌ MAUVAIS - any perd l'information de type
function firstElement(arr: any[]): any {
  return arr[0];
}

// ✅ BON - generic préserve le type
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Utilisation - TypeScript connaît le type de retour
const numbers = [1, 2, 3];
const first = firstElement(numbers); // Type: number | undefined

const names = ['Alice', 'Bob'];
const firstName = firstElement(names); // Type: string | undefined
```

### Exemples Courants de Generics

```typescript
// Fonction de mapping générique
function mapArray<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}

// Fonction de filtrage générique
function filterArray<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  return arr.filter(predicate);
}

// Classe générique
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

## Pattern 4 : Union Types

Quand une valeur peut être de plusieurs types spécifiques :

```typescript
// ❌ MAUVAIS
function formatValue(value: any): string {
  return String(value);
}

// ✅ BON
function formatValue(value: string | number | boolean): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return value ? 'Oui' : 'Non';
}
```

### Union avec Objets (Discriminated Unions)

```typescript
// Définir différents types de résultat
interface SuccessResult {
  status: 'success';
  data: User;
}

interface ErrorResult {
  status: 'error';
  message: string;
}

type ApiResult = SuccessResult | ErrorResult;

// Utilisation - TypeScript affine selon le status
function handleResult(result: ApiResult): void {
  if (result.status === 'success') {
    console.log(result.data.name); // TypeScript sait que data existe
  } else {
    console.error(result.message); // TypeScript sait que message existe
  }
}
```

---

## Pattern 5 : Record Types

Pour les dictionnaires d'objets :

```typescript
// ❌ MAUVAIS
const config: any = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};

// ✅ BON - quand les clés sont connues
interface Config {
  apiUrl: string;
  timeout: number;
  retries?: number;
}

const config: Config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};

// ✅ BON - quand les clés sont dynamiques
const userScores: Record<string, number> = {
  alice: 100,
  bob: 85,
};

// Record avec types plus complexes
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

## Pattern 6 : Types de Fonctions

Toujours typer les paramètres et retours de fonctions :

```typescript
// ❌ MAUVAIS
const calculate = (a, b) => a + b;

// ✅ BON
const calculate = (a: number, b: number): number => a + b;

// Pour les callbacks
interface ButtonProps {
  onClick: (event: MouseEvent) => void;
  label: string;
}

// Type de fonction réutilisable
type AsyncHandler<T> = (data: T) => Promise<void>;

const handleUser: AsyncHandler<User> = async (user) => {
  console.log(user.name);
};
```

---

## Pattern 7 : Gestion des Réponses API

```typescript
// Définir la forme de réponse attendue
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface User {
  id: string;
  name: string;
}

// Type guard pour ApiResponse
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

// Wrapper fetch typé
async function fetchUser(id: string): Promise<ApiResponse<User>> {
  const response = await fetch(`/api/users/${id}`);
  const json: unknown = await response.json();

  if (!isApiResponse<User>(json, isUser)) {
    throw new Error('Réponse API invalide');
  }

  return json;
}
```

---

## Pattern 8 : Utility Types

Types utilitaires pour la flexibilité :

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Pour les mises à jour - tous les champs optionnels
type UpdateUserDTO = Partial<Omit<User, 'id'>>;
// Résultat: { name?: string; email?: string; avatar?: string }

// Pour la création - exiger des champs spécifiques
type CreateUserDTO = Pick<User, 'name' | 'email'>;
// Résultat: { name: string; email: string }

// Rendre les champs optionnels requis
type CompleteUser = Required<User>;
// Résultat: { id: string; name: string; email: string; avatar: string }

// Lecture seule
type ReadonlyUser = Readonly<User>;
// Tous les champs deviennent readonly
```

---

## Pattern 9 : Const Assertions

Pour les types littéraux :

```typescript
// Sans const assertion - type est string[]
const ROLES = ['admin', 'user', 'guest'];

// Avec const assertion - type est readonly ['admin', 'user', 'guest']
const ROLES = ['admin', 'user', 'guest'] as const;

// Maintenant on peut dériver un type
type Role = (typeof ROLES)[number]; // 'admin' | 'user' | 'guest'

// Utilisation
function setRole(role: Role): void {
  // N'accepte que 'admin', 'user', ou 'guest'
}

// Pour les objets aussi
const STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];
// 'pending' | 'active' | 'inactive'
```

---

## Pattern 10 : Narrowing avec Assertions

```typescript
// Assertion de non-null
function getUser(id: string): User | null {
  // ...
}

const user = getUser('123');
// user est User | null

if (user) {
  // TypeScript sait que user est User ici
  console.log(user.name);
}

// Avec assertion (à utiliser avec précaution)
const user = getUser('123')!; // Force non-null
// Préférer une vérification explicite

// Assertion de type
const input = document.getElementById('email') as HTMLInputElement;
input.value = 'test@example.com';
```

---

## Référence Rapide : Alternatives à `any`

| Situation | Utiliser |
|-----------|----------|
| Type inconnu | `unknown` + type guard |
| Tableau de types mixtes | Union type `(string \| number)[]` |
| Objet avec clés dynamiques | `Record<string, T>` |
| Fonction flexible | Generics `<T>` |
| Plusieurs formes possibles | Discriminated union |
| JSON d'une API | Interface + validation (Zod) |
| Event handlers | Types d'événements appropriés |
| Données tierces | Type guards |
| Valeur optionnelle | `T \| undefined` ou `T \| null` |
| Callback | Type de fonction explicite |

---

## Anti-Patterns à Éviter

```typescript
// ❌ Cast vers any pour contourner les erreurs
const data = someValue as any;

// ❌ Type assertion sans validation
const user = response as User;

// ❌ Ignorer les erreurs TypeScript
// @ts-ignore
const value = problematicCode();

// ❌ any implicite (paramètres non typés)
function process(data) {
  // data est implicitement any
}

// ✅ Toujours typer explicitement
function process(data: ProcessInput): ProcessOutput {
  // ...
}
```
