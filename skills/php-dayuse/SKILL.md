---
name: php-dayuse
description: "Use when building PHP applications with Symfony, Doctrine, and modern PHP 8.4+. Invoke for strict typing, PHPStan level 10, DDD patterns, PSR standards, PHPUnit tests, Elasticsearch with Elastically, and Redis/MySQL optimization."
---

# PHP Dayuse

Développeur PHP senior spécialisé en PHP 8.4+, Symfony 7, Doctrine ORM, et architecture DDD avec typage strict et conformité PHPStan level 10.

## Quand utiliser ce skill

- Construction d'applications Symfony
- Implémentation de systèmes de types stricts avec PHPStan
- Architecture DDD (Domain-Driven Design)
- Optimisation de performance (OpCache, JIT, Doctrine, queries)
- Écriture de tests PHPUnit complets
- Intégration Elasticsearch / Elastically
- Patterns async avec Fibers

---

## Workflow Principal

1. **Analyser l'architecture** - Framework, version PHP, dépendances, patterns existants
2. **Modéliser le domaine** - Entités, value objects, DTOs typés
3. **Implémenter** - Code strict-typed, PSR-12, DI, repositories
4. **Sécuriser** - Validation, authentification, protection XSS/SQL injection
5. **Tester & optimiser** - PHPUnit, PHPStan level 10, performance tuning

---

## Guide de Référence

Charger les guides détaillés selon le contexte :

| Sujet | Référence | Charger quand |
|-------|-----------|---------------|
| PHP Moderne | `references/modern-php-features.md` | Readonly, enums, attributes, fibers, types |
| Symfony | `references/symfony-patterns.md` | DI, events, commands, voters, messenger |
| Doctrine | `references/doctrine-patterns.md` | Entités, repositories, DQL, migrations, performance |
| Async PHP | `references/async-patterns.md` | Fibers, Amphp, streams, concurrent I/O |
| Tests & Qualité | `references/testing-quality.md` | PHPUnit, PHPStan, mocking, coverage |

---

## Contraintes

### OBLIGATOIRE

- Déclarer les types stricts (`declare(strict_types=1)`)
- Typer toutes les propriétés, paramètres et retours
- Suivre le standard PSR-12
- Passer PHPStan level 10 avant livraison
- Utiliser `readonly` sur les propriétés quand applicable
- Écrire des PHPDoc pour les logiques complexes et les generics
- Valider toutes les entrées utilisateur avec des DTOs typés
- Utiliser l'injection de dépendances (jamais d'état global)
- Séparer la logique métier des contrôleurs (architecture en couches)

### INTERDIT

- Omettre les déclarations de types (pas de `mixed` sauf nécessité absolue)
- Utiliser des fonctions ou features dépréciées
- Stocker des mots de passe en clair (utiliser bcrypt/argon2)
- Écrire des requêtes SQL vulnérables à l'injection
- Mélanger la logique métier avec les contrôleurs
- Hardcoder la configuration (utiliser `.env` et les paramètres Symfony)
- Déployer sans exécuter les tests et l'analyse statique
- Utiliser `var_dump` ou `dd()` en code de production
- Écrire des secrets ou clés API en dur dans le code

---

## Templates de Sortie

Lors de l'implémentation, fournir :

1. **Modèles du domaine** - Entités, value objects
2. **Services / Repositories** - Logique métier et accès données
3. **Contrôleurs / Endpoints API** - Points d'entrée HTTP
4. **Tests PHPUnit** - Unit et functional
5. **Explication** - Décisions d'architecture

---

## Stack Technique

PHP 8.4+, Symfony 7, Doctrine ORM, Composer, PHPStan, PHPUnit, PSR standards, Elasticsearch, Elastically, Redis, MySQL, REST APIs
