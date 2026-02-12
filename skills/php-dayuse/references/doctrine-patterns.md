# Doctrine ORM Patterns

## Entities with Attributes

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

## Embeddable Value Objects

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

// Usage in an entity
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

    // OneToMany - inverse side
    /** @var Collection<int, Room> */
    #[ORM\OneToMany(targetEntity: Room::class, mappedBy: 'hotel', cascade: ['persist', 'remove'])]
    private Collection $rooms;

    // ManyToMany with join table
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

    // ManyToOne - owning side
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

// Interface in the domain layer
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

// Doctrine implementation in the infrastructure layer
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

## Advanced QueryBuilder

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
            ->addSelect('h'); // Eager load to avoid N+1

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
# Generate a migration from entity changes
php bin/console doctrine:migrations:diff

# Apply migrations
php bin/console doctrine:migrations:migrate

# Roll back
php bin/console doctrine:migrations:migrate prev

# Migration status
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

## Doctrine Performance

### Avoiding the N+1 Problem

```php
<?php

declare(strict_types=1);

// N+1: 1 query for hotels + N queries for rooms
$hotels = $hotelRepository->findAll();
foreach ($hotels as $hotel) {
    $hotel->getRooms(); // Lazy load = 1 query per hotel
}

// Eager loading with JOIN
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

// Batch processing for large volumes
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

### Second Level Cache

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

// Enable cache on an entity
#[ORM\Entity]
#[ORM\Cache(usage: 'READ_ONLY')]
class Country
{
    // Rarely modified entity -> effective cache
}
```

## Quick Reference

| Operation | Command |
|-----------|---------|
| Generate migration | `php bin/console doctrine:migrations:diff` |
| Apply migration | `php bin/console doctrine:migrations:migrate` |
| Validate schema | `php bin/console doctrine:schema:validate` |
| Create database | `php bin/console doctrine:database:create` |
| Load fixtures | `php bin/console doctrine:fixtures:load` |

| Pattern | When to use |
|---------|-------------|
| Embeddable | Value objects (Money, Address, DateRange) |
| Repository interface | Domain / infrastructure decoupling |
| QueryBuilder | Dynamic queries with criteria |
| DQL | Complex queries with joins |
| Native SQL | Critical performance, MySQL-specific queries |
| Batch processing | Massive data import/export |
| Second level cache | Rarely modified entities (countries, categories) |
