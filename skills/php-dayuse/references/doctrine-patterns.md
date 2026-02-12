# Doctrine ORM Patterns

## Entités avec Attributs

```php
<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\DoctrineUserRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: DoctrineUserRepository::class)]
#[ORM\Table(name: 'users')]
#[ORM\Index(columns: ['email'], name: 'idx_user_email')]
#[ORM\Index(columns: ['status'], name: 'idx_user_status')]
class User
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 180, unique: true)]
    private string $email;

    #[ORM\Column(type: Types::STRING)]
    private string $password;

    #[ORM\Column(type: Types::STRING, length: 20, enumType: UserStatus::class)]
    private UserStatus $status;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct(string $email, string $password)
    {
        $this->email = $email;
        $this->password = $password;
        $this->status = UserStatus::ACTIVE;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getStatus(): UserStatus
    {
        return $this->status;
    }

    public function suspend(): void
    {
        $this->status = UserStatus::SUSPENDED;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function activate(): void
    {
        $this->status = UserStatus::ACTIVE;
        $this->updatedAt = new \DateTimeImmutable();
    }
}
```

## Value Objects Embeddable

```php
<?php

declare(strict_types=1);

namespace App\Entity\ValueObject;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Embeddable]
final readonly class Money
{
    #[ORM\Column(type: 'integer')]
    public int $amount;

    #[ORM\Column(type: 'string', length: 3)]
    public string $currency;

    public function __construct(int $amount, string $currency)
    {
        if ($amount < 0) {
            throw new \InvalidArgumentException('Amount cannot be negative');
        }
        $this->amount = $amount;
        $this->currency = strtoupper($currency);
    }

    public function add(self $other): self
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException('Currency mismatch');
        }
        return new self($this->amount + $other->amount, $this->currency);
    }

    public function equals(self $other): bool
    {
        return $this->amount === $other->amount
            && $this->currency === $other->currency;
    }
}

// Utilisation dans une entité
#[ORM\Entity]
class Booking
{
    #[ORM\Embedded(class: Money::class, columnPrefix: 'price_')]
    private Money $price;

    public function getPrice(): Money
    {
        return $this->price;
    }
}
```

## Relations

```php
<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
class Hotel
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $name;

    // OneToMany - côté inverse
    /** @var Collection<int, Room> */
    #[ORM\OneToMany(targetEntity: Room::class, mappedBy: 'hotel', cascade: ['persist', 'remove'])]
    private Collection $rooms;

    // ManyToMany avec table pivot
    /** @var Collection<int, Tag> */
    #[ORM\ManyToMany(targetEntity: Tag::class)]
    #[ORM\JoinTable(name: 'hotel_tags')]
    private Collection $tags;

    public function __construct(string $name)
    {
        $this->name = $name;
        $this->rooms = new ArrayCollection();
        $this->tags = new ArrayCollection();
    }

    public function addRoom(Room $room): void
    {
        if (!$this->rooms->contains($room)) {
            $this->rooms->add($room);
            $room->setHotel($this);
        }
    }

    public function removeRoom(Room $room): void
    {
        if ($this->rooms->removeElement($room)) {
            $room->setHotel(null);
        }
    }

    /**
     * @return Collection<int, Room>
     */
    public function getRooms(): Collection
    {
        return $this->rooms;
    }
}

#[ORM\Entity]
class Room
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // ManyToOne - côté propriétaire
    #[ORM\ManyToOne(targetEntity: Hotel::class, inversedBy: 'rooms')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Hotel $hotel = null;

    #[ORM\Column(length: 50)]
    private string $number;

    public function setHotel(?Hotel $hotel): void
    {
        $this->hotel = $hotel;
    }
}
```

## Repository Pattern (Interface + Implementation)

```php
<?php

declare(strict_types=1);

// Interface dans le domaine
namespace App\Domain\Repository;

use App\Entity\User;

interface UserRepositoryInterface
{
    public function findById(int $id): ?User;
    public function findByEmail(string $email): ?User;
    /** @return User[] */
    public function findActive(): array;
    public function save(User $user): void;
    public function remove(User $user): void;
}

// Implémentation Doctrine dans l'infrastructure
namespace App\Infrastructure\Repository;

use App\Domain\Repository\UserRepositoryInterface;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<User>
 */
final class DoctrineUserRepository extends ServiceEntityRepository implements UserRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function findById(int $id): ?User
    {
        return $this->find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return $this->findOneBy(['email' => $email]);
    }

    /**
     * @return User[]
     */
    public function findActive(): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.status = :status')
            ->setParameter('status', UserStatus::ACTIVE)
            ->orderBy('u.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function save(User $user): void
    {
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    public function remove(User $user): void
    {
        $this->getEntityManager()->remove($user);
        $this->getEntityManager()->flush();
    }
}
```

## QueryBuilder Avancé

```php
<?php

declare(strict_types=1);

namespace App\Repository;

use App\DTO\BookingSearchCriteria;
use App\Entity\Booking;
use Doctrine\ORM\QueryBuilder;

final class DoctrineBookingRepository extends ServiceEntityRepository
{
    /**
     * @return Booking[]
     */
    public function search(BookingSearchCriteria $criteria): array
    {
        $qb = $this->createQueryBuilder('b')
            ->join('b.hotel', 'h')
            ->addSelect('h'); // Eager load pour éviter N+1

        if ($criteria->hotelId !== null) {
            $qb->andWhere('h.id = :hotelId')
                ->setParameter('hotelId', $criteria->hotelId);
        }

        if ($criteria->dateFrom !== null) {
            $qb->andWhere('b.checkIn >= :dateFrom')
                ->setParameter('dateFrom', $criteria->dateFrom);
        }

        if ($criteria->dateTo !== null) {
            $qb->andWhere('b.checkOut <= :dateTo')
                ->setParameter('dateTo', $criteria->dateTo);
        }

        if ($criteria->status !== null) {
            $qb->andWhere('b.status = :status')
                ->setParameter('status', $criteria->status);
        }

        $qb->orderBy('b.createdAt', 'DESC')
            ->setMaxResults($criteria->limit)
            ->setFirstResult($criteria->offset);

        return $qb->getQuery()->getResult();
    }
}
```

## Migrations

```bash
# Générer une migration à partir des changements d'entité
php bin/console doctrine:migrations:diff

# Appliquer les migrations
php bin/console doctrine:migrations:migrate

# Revenir en arrière
php bin/console doctrine:migrations:migrate prev

# Statut des migrations
php bin/console doctrine:migrations:status
```

```php
<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240101000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create users table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE users (
            id INT AUTO_INCREMENT NOT NULL,
            email VARCHAR(180) NOT NULL,
            password VARCHAR(255) NOT NULL,
            status VARCHAR(20) NOT NULL,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            updated_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            UNIQUE INDEX UNIQ_1483A5E9E7927C74 (email),
            INDEX idx_user_status (status),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE users');
    }
}
```

## Performance Doctrine

### Éviter le N+1 Problem

```php
<?php

declare(strict_types=1);

// ❌ N+1 : 1 requête pour les hôtels + N requêtes pour les rooms
$hotels = $hotelRepository->findAll();
foreach ($hotels as $hotel) {
    $hotel->getRooms(); // Lazy load = 1 requête par hôtel
}

// ✅ Eager loading avec JOIN
$hotels = $hotelRepository->createQueryBuilder('h')
    ->leftJoin('h.rooms', 'r')
    ->addSelect('r')
    ->getQuery()
    ->getResult();
```

### Batch Processing

```php
<?php

declare(strict_types=1);

// ✅ Traitement par lots pour les grosses volumétries
$batchSize = 100;
$i = 0;

$query = $em->createQuery('SELECT u FROM App\Entity\User u WHERE u.status = :status');
$query->setParameter('status', 'pending');

foreach ($query->toIterable() as $user) {
    $user->activate();
    $i++;

    if (($i % $batchSize) === 0) {
        $em->flush();
        $em->clear();
    }
}

$em->flush();
$em->clear();
```

### Cache de Second Niveau

```yaml
# config/packages/doctrine.yaml
doctrine:
    orm:
        second_level_cache:
            enabled: true
            region_cache_driver:
                type: pool
                pool: cache.doctrine.second_level
            regions:
                default:
                    lifetime: 3600
                    cache_driver:
                        type: pool
                        pool: cache.doctrine.second_level
```

```php
<?php

// Activer le cache sur une entité
#[ORM\Entity]
#[ORM\Cache(usage: 'READ_ONLY')]
class Country
{
    // Entité rarement modifiée → cache efficace
}
```

## Quick Reference

| Opération | Commande |
|-----------|----------|
| Générer migration | `php bin/console doctrine:migrations:diff` |
| Appliquer migration | `php bin/console doctrine:migrations:migrate` |
| Valider le schéma | `php bin/console doctrine:schema:validate` |
| Créer la BDD | `php bin/console doctrine:database:create` |
| Charger fixtures | `php bin/console doctrine:fixtures:load` |

| Pattern | Quand l'utiliser |
|---------|-----------------|
| Embeddable | Value objects (Money, Address, DateRange) |
| Repository interface | Découplage domaine / infrastructure |
| QueryBuilder | Requêtes dynamiques avec critères |
| DQL | Requêtes complexes avec jointures |
| Native SQL | Performance critique, requêtes spécifiques MySQL |
| Batch processing | Import/export de données massives |
| Second level cache | Entités rarement modifiées (pays, catégories) |
