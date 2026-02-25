---
name: dayuse-mail
description: "Use when a Twig template uses `reservationData` or `array<string, mixed>`, when a Notifier calls `$dto->__toArray()`, or when creating a new transactional email template `.dto.html.twig`."
---

# Dayuse Mail — Pattern DTO

## Overview

Pattern de modernisation des emails transactionnels Dayuse : remplacer les tableaux non structurés (`reservationData`, `array<string, mixed>`) par des DTO PHP strictement typés (`final readonly class`), des Builders dédiés et des templates `.dto.html.twig` à zéro logique métier.

## Quand utiliser ce Skill

- Refactoring d'anciens templates d'emails transactionnels (`.html.twig`).
- Migration de templates vers l'extension `.dto.html.twig`.
- Remplacement du tableau global non structuré `reservationData` (et des autres tableaux `array<string, mixed>`) par des DTO spécifiques avec des propriétés typées.
- Construction de classes Builder (`R7DTOBuilder`, etc.) pour assembler les DTO.
- Mise à jour des Notifiers (`ConfirmationEmailNotifier`, etc.) pour utiliser les builders.

### Quand NE PAS utiliser

- Emails marketing ou newsletters (gérés par un autre système).
- Templates sans données dynamiques (pas besoin de DTO).
- Modification d'un template `.html.twig` existant qui n'est pas en cours de migration (ne pas casser les anciens emails).

## Contexte : Ancien vs Nouveau Pattern

| Critère | Ancien pattern | Nouveau pattern (cible) |
|---|---|---|
| Extension template | `.html.twig` | `.dto.html.twig` |
| Variable Twig | `reservationData.xxx`, `language`, etc. (variables plates) | `data.xxx` (une seule variable typée) |
| Passage au template | `$dto->__toArray()` | `['data' => $dto]` |
| Propriétés DTO | `reservationData: array<string, mixed>` | Propriétés typées (ex: `bookingNumber: string`) |
| Logique dans Twig | Conditions complexes possibles | Zéro logique métier, résultats booléens pré-calculés |

## Quick Reference

| Élément | Convention |
|---------|-----------|
| Extension template | `.dto.html.twig` |
| Variable extérieure à Twig | `data` (uniquement) |
| Typage template | `{# @var data \Dayuse\Email\DTO\XxxDTO #}` |
| DTO racine | `src/Email/DTO/` |
| DTO enfant | `src/Email/DTO/PartDTO/` |
| Builder racine | `src/Email/DTOBuilder/` |
| Builder enfant | `src/Email/DTOBuilder/Part/` |
| Passage au template | `['data' => $dto]` |
| Classe DTO | `final readonly class` |
| Propriétés DTO | `public` uniquement |

## Principes Fondamentaux & Workflow

### 0. Stratégie Depth-First (Feuilles d'abord)

**Principe cardinal : toujours traiter les feuilles avant les parents.**

Avant de refactoriser un template, identifier **tous** ses templates enfants (via `include`). Si un enfant a lui-même des enfants, descendre encore. Commencer par les feuilles (templates sans `include`) et remonter vers la racine.

**Cet ordre s'applique à chaque couche :**

| Étape | Ordre |
|-------|-------|
| Templates | Feuille `.dto.html.twig` → … → Racine `.dto.html.twig` |
| DTOs | DTO feuille → … → DTO racine (qui imbrique les enfants) |
| Builders | Builder feuille → … → Builder racine (qui appelle les enfants) |

**Workflow récursif pour un template donné :**

1. Lister tous les `include` du template.
2. Pour chaque enfant, appliquer récursivement ce même workflow (étape 1).
3. Une fois **tous les enfants traités** (template `.dto.html.twig` + DTO + Builder créés), traiter le parent :
   - Créer le template parent `.dto.html.twig` (qui `include` les enfants déjà migrés).
   - Créer le DTO parent (qui référence les DTOs enfants comme propriétés typées).
   - Créer le Builder parent (qui injecte et appelle les Builders enfants).

**Exemple — Arbre à 3 niveaux :**

```
r7-confirmed.html.twig                          ← racine
  ├── _parts/booking_header_block.html.twig      ← enfant niveau 1
  │     └── _parts/hotel_info.html.twig          ← feuille (niveau 2)
  └── _parts/payment_summary.html.twig           ← feuille (niveau 1)
```

**Ordre de traitement :**
1. `hotel_info` (feuille) → `HotelInfoDTO` → `HotelInfoDTOBuilder`
2. `booking_header_block` (ses enfants sont faits) → `BookingHeaderBlockDTO` → `BookingHeaderBlockDTOBuilder`
3. `payment_summary` (feuille) → `PaymentSummaryDTO` → `PaymentSummaryDTOBuilder`
4. `r7-confirmed` (tous ses enfants sont faits) → `R7DTO` → `R7DTOBuilder`

**Interdit :**
- Créer un DTO parent avant que ses DTOs enfants existent.
- Créer un Builder parent avant que ses Builders enfants existent.
- Créer un template parent `.dto.html.twig` qui `include` un enfant non encore migré.

### 1. Templating (`.dto.html.twig`)

- **Convention de nommage** : Suffixe `.dto.html.twig` (ex: `r7-confirmed.dto.html.twig`, `manage_cb_block.dto.html.twig`).
- **Ne jamais modifier** ou **supprimer** les templates originaux `.html.twig` — les créer à côté en `.dto.html.twig`.
- **Typage PHP DocBlock** : Toujours typer `data` en première ligne du fichier :

```twig
{# @var data \Dayuse\Email\DTO\R7DTO #}
```

- Un seul typage par template. La variable est **toujours** nommée `data`.
- **Zéro logique métier** : Pas de calcul, pas de condition complexe. Les filtres Twig de formatage sont autorisés (`format_date`, `formatPrice`, `trans`, etc.).
- **Accès aux données** : `data.bookingNumber`, `data.hotelName`, `data.isPrepaid`, etc.
- **Logique déportée en PHP** : Les conditions Twig complexes deviennent des booléens sur le DTO.
- Les templates ont la responsabilité de traduire les clés de traduction.
- Toutes les données utilisées dans le template sont déclarées dans le DTO du template, ou initialisées dans le template lui-même (via `{% set %}` avec logique calculée).
- Les variables déclarées avec `{% set %}` sont obligatoirement utilisées dans le template.
- Interdit : initialiser une variable sans logique ajoutée.

```twig
{# ✅ OK — set avec logique calculée #}
{% set totalWithTax = data.price + data.tax %}

{# ❌ INTERDIT — set sans valeur ajoutée #}
{% set hotelName = data.hotelName %}
```

**Exemple — Template enfant :**
```twig
{# @var data \Dayuse\Email\DTO\PartDTO\BookingHeaderBlockDTO #}
{% trans_default_domain 'transactional_emails' %}

<table>
    <tr>
        <td>{{ data.hotelName }}</td>
        <td>{{ data.bookingNumber }}</td>
        <td>{{ data.checkInDate|format_date('short', locale=data.locale) }}</td>
    </tr>
    {% if data.isPrepaid %}
        <tr><td>{{ 'email.prepaid.label'|trans }}</td></tr>
    {% endif %}
</table>
```

### 2. Imbrication & Templates Enfants

Lorsqu'un template parent inclut un composant enfant, passer explicitement le DTO imbriqué :

```twig
{{ include('@emails/_parts/booking_header_block.dto.html.twig', { data: data.bookingHeader }) }}
```

- Dupliquer `_parts/xyz.html.twig` → `_parts/xyz.dto.html.twig` et refactoriser le nouveau.
- Ne jamais modifier l'original pour ne pas casser les anciens emails qui en dépendent.

### 3. Data Transfer Objects (DTOs)

**Deux types de DTO :**
- **DTO racine** — appliqué au template appelé depuis une classe PHP.
- **DTO enfant** — déclaré par un DTO racine ou un autre DTO enfant.

**Emplacements :**
- DTO racine (template principal) : `src/Email/DTO/`
- DTO enfant (template `_parts/`) : `src/Email/DTO/PartDTO/`

**Structure obligatoire :**

```php
<?php

declare(strict_types=1);

namespace Dayuse\Email\DTO;

/**
 * @see templates/transactional-emails/hotel/reservation/r7-confirmed.dto.html.twig
 */
final readonly class R7DTO
{
    public function __construct(
        public string $bookingNumber,
        public string $hotelName,
        public bool $isPrepaid,
        public \DateTimeImmutable $checkInDate,
        public \DateTimeImmutable $checkOutDate,
        public string $locale,
        public BookingHeaderDTO $bookingHeader,
        public ?string $taxInformation,
    ) {
    }
}
```

**Règles :**
- `final readonly class` — toujours.
- **Propriétés `public`** — obligatoire pour que Twig puisse y accéder via `data.property`.
- Typage natif PHP sur chaque propriété. Pas de `array<string, mixed>`, pas de `mixed`.
- Les noms de propriétés correspondent exactement aux noms utilisés dans le template.
- Pas de traduction dans le DTO — uniquement les clés de traduction sous forme de `string`.
- Un DTO = un seul template.
- Indique en commentaire le template auquel il s'applique
- Pas de tableau, uniquement des objets, qui seront dans le dossier `src/Email/DTO/`

#### Nommage

- Le DTO reprend le nom du template sur lequel il s'applique, au singulier.
- Si le template racine : `hotel/reservation/r7-confirmed.dto.html.twig` => `R7DTO`
- Si le template est dans un sous-dossier de `transactional-emails/`, les dossiers parents sont préfixés :

| Template | DTO |
|---|---|
| `_parts/booking_header_block.dto.html.twig` | `BookingHeaderBlockDTO` |
| `_parts/payment/_parts/inclusive_taxes.dto.html.twig` | `PaymentInclusiveTaxesDTO` |

### 4. DTOBuilder

#### Type de builder
**Deux types de builders :**
- **Builder racine** — builder du template appelé depuis une classe PHP.
- **Builder enfant** — appelé par le builder racine ou un autre builder enfant.
**Exemple :**
- Le template `hotel/reservation/r7-confirmed.dto.html.twig` => `R7DTO` => `R7DTOBuilder`, c'est un builder racine
- Le template `_parts/booking_header_block.dto.html.twig` => `BookingHeaderBlockDTO` => `BookingHeaderBlockDTOBuilder`, c'est un builder enfant

#### Emplacement
- Les builders racines sont dans `src/Email/DTOBuilder/`.
- Les builders enfants sont dans `src/Email/DTOBuilder/Part/`.
  **Exemple :**
- Le builder `R7DTOBuilder` => `src/Email/DTOBuilder/`
- Le builder `BookingHeaderBlockDTOBuilder` => `src/Email/DTOBuilder/Part/`

**Nommage :** `[NomDuDTO]Builder` (ex: `R7DTOBuilder`).

**Règles :**
- Méthode `build()` avec les paramètres nécessaires à l'assemblage (objets métier : `Order`, `DomainConfig`, `Language`, etc. ou scalaires sans calcul préalable).
- **Interdit** : prendre en paramètre des données issues de `\Dayuse\Order\Service\OrderInfoViewModelBuilder::getInfo()`.
- **Interdit** : calculer les données des DTO enfants — appeler leurs builders respectifs.
- **Construction récursive depth-first** : le builder parent appelle les builders enfants, qui appellent leurs propres builders enfants, et ainsi de suite jusqu'aux feuilles. Un builder ne construit **jamais** le DTO d'un autre niveau — il délègue toujours au builder du niveau inférieur.
- Pas de traduction dans le builder.
- Chaque DTO a un builder, un builder ne peut pas construire plus d'un DTO.
- Le builder racine reçoit par injection (DI Symfony) les builders enfants dont il a besoin.
- **Calculs dupliqués acceptés** : si deux DTOs distincts ont besoin de la même information calculée (ex: `isPrepaidPayment`), chaque builder calcule cette information indépendamment. On ne partage pas de données calculées entre builders.

**Exemple :**

```php
<?php

declare(strict_types=1);

namespace Dayuse\Email\DTOBuilder;

use Dayuse\Email\DTO\R7DTO;
use Dayuse\Email\DTOBuilder\Part\BookingHeaderBlockDTOBuilder;
use Dayuse\Hotels\Entity\Hotel;
use Dayuse\Locale\Entity\Language;
use Dayuse\Order\Entity\Order;

final readonly class R7DTOBuilder
{
    public function __construct(
        private readonly BookingHeaderBlockDTOBuilder $bookingHeaderBuilder,
    ) {
    }

    public function build(Order $order, Hotel $hotel, Language $language): R7DTO
    {
        $orderItem = $order->getParentOrderItem();

        return new R7DTO(
            bookingNumber: $order->getBookingNumber(),
            hotelName: $hotel->getName(),
            isPrepaid: $order->isPrepaid(),
            checkInDate: \DateTimeImmutable::createFromMutable($orderItem->getCheckinDatetime()),
            checkOutDate: \DateTimeImmutable::createFromMutable($orderItem->getCheckoutDatetime()),
            locale: $language->getLocale(),
            bookingHeader: $this->bookingHeaderBuilder->build($order, $hotel, $language),
            taxInformation: $hotel->willCollectLocalSalesTax() ? 'email.tax.information' : null,
        );
    }
}
```

### 5. Notifiers

Remplacer le passage de `$dto->__toArray()` par `['data' => $dto]` :

**Avant (ancien pattern) :**
```php
$dto = new R7DTO(..., reservationData: $this->orderInfoViewModelBuilder->getInfo(...), ...);

$message = (new OrderMessageBuilder($this->translator, $order))
    ->withBody('@emails/hotel/reservation/r7-confirmed.html.twig', $dto->__toArray())
    ->build();
```

**Après (nouveau pattern) :**
```php
$dto = $this->r7DtoBuilder->build($order, $hotel, $language);

$message = (new OrderMessageBuilder($this->translator, $order))
    ->withBody('@emails/hotel/reservation/r7-confirmed.dto.html.twig', ['data' => $dto])
    ->build();
```

- Injecter les builders via le constructeur du Notifier.

## Checklist de migration d'un email

### Phase 1 — Cartographie (top-down)

1. [ ] Identifier le template racine original (`.html.twig`) et les variables Twig qu'il utilise.
2. [ ] Identifier toutes les propriétés de `reservationData` utilisées dans le template.
3. [ ] Lister **tous** les `include` du template (enfants directs).
4. [ ] Pour chaque enfant, lister récursivement ses propres `include` → construire l'arbre complet.
5. [ ] Identifier les feuilles (templates sans `include`).

### Phase 2 — Construction récursive (bottom-up, feuilles d'abord)

**Pour chaque template, en partant des feuilles et en remontant vers la racine :**

6. [ ] Créer le template `.dto.html.twig` (copie refactorisée) — ne pas modifier l'original.
7. [ ] Créer le DTO correspondant (`src/Email/DTO/PartDTO/` pour les enfants, `src/Email/DTO/` pour la racine).
8. [ ] Créer le Builder correspondant (`src/Email/DTOBuilder/Part/` pour les enfants, `src/Email/DTOBuilder/` pour la racine).
9. [ ] Si le template a des enfants : vérifier que le DTO référence les DTOs enfants comme propriétés typées et que le Builder injecte et appelle les Builders enfants.

**Répéter les étapes 6-9 en remontant l'arbre jusqu'au template racine.**

### Phase 3 — Intégration

10. [ ] Mettre à jour le Notifier pour utiliser le builder racine et passer `['data' => $dto]`.
11. [ ] Vérifier PHPStan niveau 10 (`inv phpstan`).
12. [ ] Vérifier le lint Twig (`inv lint`).

## Erreurs fréquentes

| Erreur | Correction |
|--------|-----------|
| `private string $bookingNumber` dans le DTO | `public string $bookingNumber` — Twig ne peut pas accéder aux propriétés privées |
| Builder appelle `OrderInfoViewModelBuilder::getInfo()` | Builder reçoit `Order`, `Hotel`, `Language` en paramètre direct |
| Template enfant inclus sans passer le sous-DTO | `{ data: data.bookingHeader }` — toujours passer le DTO enfant explicitement |
| `{% set hotelName = data.hotelName %}` sans logique | Supprimer — les `{% set %}` sans valeur ajoutée sont interdits |
| Méthode d'entité devinée (ex: `getStars()`) | Vérifier l'entité réelle — ex: `$hotel->getStarRating()` |
| Builder enfant calcule une donnée du DTO voisin | Chaque builder calcule indépendamment — les données calculées ne se partagent pas |
| DTO parent créé avant les DTOs enfants | Respecter l'ordre depth-first : créer les DTOs feuilles d'abord, puis remonter |
| Builder parent construit le DTO d'un enfant directement | Toujours déléguer au Builder enfant — jamais de `new EnfantDTO(...)` dans le builder parent |
| Template parent `.dto.html.twig` inclut un enfant non migré (`.html.twig`) | Migrer les enfants d'abord — un template `.dto.html.twig` ne doit inclure que des `.dto.html.twig` |

