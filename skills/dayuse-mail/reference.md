# Dayuse Mail — Exemples de référence

Exemples de code complets pour le pattern DTO. Voir `SKILL.md` pour les principes et conventions.

## DTO racine — Exemple complet

```php
<?php

declare(strict_types=1);

namespace Dayuse\Email\DTO;

use Dayuse\Email\DTO\PartDTO\BookingHeaderBlockDTO;
use Dayuse\Hotels\Entity\Hotel;
use Dayuse\Locale\Entity\Language;
use Dayuse\Order\Entity\Order;

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
        public BookingHeaderBlockDTO $bookingHeader,
        public ?string $taxInformation,
    ) {
    }

    public static function build(Order $order, Hotel $hotel, Language $language): self
    {
        $orderItem = $order->getParentOrderItem();

        return new self(
            bookingNumber: $order->getBookingNumber(),
            hotelName: $hotel->getName(),
            isPrepaid: $order->isPrepaid(),
            checkInDate: \DateTimeImmutable::createFromMutable($orderItem->getCheckinDatetime()),
            checkOutDate: \DateTimeImmutable::createFromMutable($orderItem->getCheckoutDatetime()),
            locale: $language->getLocale(),
            bookingHeader: BookingHeaderBlockDTO::build($order, $hotel, $language),
            taxInformation: $hotel->willCollectLocalSalesTax() ? 'email.tax.information' : null,
        );
    }
}
```

## Objets entiers vs scalaires pré-extraits — Comparaison

### ❌ Éviter — scalaires pré-extraits par le parent

```php
// Le parent décompose l'objet en 6 scalaires
$hotelInformation = HotelInformationDTO::build(
    hotelName: $hotel->getName(),
    hotelAddress: $hotel->getAddress(),
    hotelRating: $hotel->getStarRating(),
    hotelPhotoUrl: $hotel->getMainPhoto()?->getUrl() ?? '',
    hotelUrl: $hotel->getUrl(),
    contactPhoneNumber: $domainConfig->getContactPhoneNumber() ?? '',
);
```

```php
// Le DTO reçoit 6 scalaires — il ne sait pas d'où ils viennent
final readonly class HotelInformationDTO
{
    public function __construct(
        public string $hotelName,
        public string $hotelAddress,
        public int $hotelRating,
        public string $hotelPhotoUrl,
        public string $hotelUrl,
        public string $contactPhoneNumber,
    ) {
    }

    public static function build(
        string $hotelName,
        string $hotelAddress,
        int $hotelRating,
        string $hotelPhotoUrl,
        string $hotelUrl,
        string $contactPhoneNumber,
    ): self {
        return new self(...); // simple passthrough, pas de valeur ajoutée
    }
}
```

### ✅ Préférer — objets entiers, le DTO extrait lui-même

```php
// Le parent passe les objets — signature propre
$hotelInformation = HotelInformationDTO::build(
    hotel: $hotel,
    domainConfig: $domainConfig,
);
```

```php
// Le DTO extrait ce dont il a besoin — encapsulé
final readonly class HotelInformationDTO
{
    public function __construct(
        public string $hotelName,
        public string $hotelAddress,
        public int $hotelRating,
        public string $hotelPhotoUrl,
        public string $hotelUrl,
        public string $contactPhoneNumber,
    ) {
    }

    public static function build(Hotel $hotel, DomainConfig $domainConfig): self
    {
        return new self(
            hotelName: $hotel->getName(),
            hotelAddress: $hotel->getAddress(),
            hotelRating: $hotel->getStarRating(),
            hotelPhotoUrl: $hotel->getMainPhoto()?->getUrl() ?? '',
            hotelUrl: $hotel->getUrl(),
            contactPhoneNumber: $domainConfig->getContactPhoneNumber() ?? '',
        );
    }
}
```

**Scalaires acceptables** : flags (`bool $isActive`), clés de traduction (`string $title`), valeurs isolées (`string $locale`).

## DTO enfant — Exemple complet

```php
<?php

declare(strict_types=1);

namespace Dayuse\Email\DTO\PartDTO;

use Dayuse\Hotels\Entity\Hotel;
use Dayuse\Order\Entity\Order;

/**
 * @see templates/transactional-emails/_parts/booking_header_block.dto.html.twig
 */
final readonly class BookingHeaderBlockDTO
{
    public function __construct(
        public string $title,
        public string $subtitle,
        public ?string $subtitle2,
        public ?string $imgUrl,
        public bool $isSingapore,
        public ?BookingInfosReinsuranceDTO $bookingInfosReinsuranceDTO,
    ) {
    }

    public static function build(
        Order $order,
        Hotel $hotel,
        string $locale,
        string $staticBaseUrl,
        string $title,
        string $subtitle,
        ?string $subtitle2 = null,
        ?string $imgUrl = null,
        bool $hasReinsurance = true,
    ): self {
        $parentOrderItem = $order->getParentOrderItem();

        $bookingInfosReinsuranceDTO = null;
        if ($hasReinsurance && null !== $parentOrderItem) {
            $bookingInfosReinsuranceDTO = BookingInfosReinsuranceDTO::build($order, $parentOrderItem, $locale, $staticBaseUrl);
        }

        return new self(
            title: $title,
            subtitle: $subtitle,
            subtitle2: $subtitle2,
            imgUrl: $imgUrl,
            isSingapore: 'SGP' === $hotel->getCountry()?->getIsoCode(),
            bookingInfosReinsuranceDTO: $bookingInfosReinsuranceDTO,
        );
    }
}
```

## Template enfant — Exemple complet

```twig
{# @var data \Dayuse\Email\DTO\PartDTO\BookingHeaderBlockDTO #}
{% trans_default_domain 'transactional_emails' %}

<table style="width: 100%">
    {% if data.imgUrl is not null %}
        <tr>
            <td style="text-align:center;">
                <img src={{data.imgUrl}} alt="dayuse" style="display: block;margin: 0 auto;" width="160px"/>
            </td>
        </tr>
    {% endif %}
    <tr>
        <td>{{ data.title }}</td>
        <td>{{ data.subtitle }}</td>
        {% if data.subtitle2 is not null %}
            <td>{{ data.subtitle2 }}</td>
        {% endif %}
    </tr>
    {% if data.bookingInfosReinsuranceDTO is not null %}
        <tr>
            <td>
                {{ include('@emails/_parts/booking_infos/reinsurance/reinsurance.dto.html.twig', { data: data.bookingInfosReinsuranceDTO }) }}
            </td>
        </tr>
    {% endif %}
</table>
```

## DTO enfant instancié N fois — Pattern complet

Quand un template parent inclut le **même template enfant N fois** avec des données différentes.

Voir `BookingInfosReinsuranceDTO` et `BookingInfosReinsuranceItemDTO` dans le code pour un exemple réel de ce pattern.

### DTO parent

```php
final readonly class BookingInfosReinsuranceDTO
{
    public function __construct(
        public BookingInfosReinsuranceItemDTO  $cancellationItem,
        public ?BookingInfosReinsuranceItemDTO $paymentItem,
    ) {
    }

    public static function build(Order $order, HotelAssetOrderItem $parentOrderItem, string $locale, string $staticBaseUrl): self
    {
        return new self(
            cancellationItem: self::buildCancellationItem($parentOrderItem, $locale, $staticBaseUrl),
            paymentItem: self::buildPaymentItem($order, $staticBaseUrl),
        );
    }
}
```

### Template parent

```twig
{{ include('@emails/_parts/booking_infos/reinsurance/reinsurance_item.dto.html.twig', { data: data.cancellationItem }) }}
{% if data.paymentItem is not null %}
    {{ include('@emails/_parts/booking_infos/reinsurance/reinsurance_item.dto.html.twig', { data: data.paymentItem }) }}
{% endif %}
```

**Règle** : la règle « un DTO = un seul template » s'applique au **type** de DTO, pas au nombre d'instances. `BookingInfosReinsuranceItemDTO::build()` peut être appelé N fois pour produire N instances de `BookingInfosReinsuranceItemDTO`.

## Notifier — Avant / Après

### Avant (ancien pattern)

```php
$dto = new R7OrderConfirmedHotelEmailDTO(
    utmTags: [...],
    reservationData: $this->orderInfoViewModelBuilder->getInfo(...),
    willCollectTax: $hotel->willCollectLocalSalesTax(),
    // ...
);

$message = (new OrderMessageBuilder($this->translator, $order))
    ->withBody('@emails/hotel/reservation/r7-confirmed.html.twig', $dto->__toArray())
    ->build();
```

### Après (nouveau pattern)

```php
$dto = R7DTO::build($order, $hotel, $language);

$message = (new OrderMessageBuilder($this->translator, $order))
    ->withBody('@emails/hotel/reservation/r7-confirmed.dto.html.twig', ['data' => $dto])
    ->build();
```

- Remplacer `$dto->__toArray()` par `['data' => $dto]`.
- Remplacer le chemin template `.html.twig` par `.dto.html.twig`.
