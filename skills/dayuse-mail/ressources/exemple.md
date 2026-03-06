# Dayuse Mail — Reference Examples

Complete code examples for the DTO pattern. See `SKILL.md` for principles and conventions.

## Root DTO — Complete Example

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

## Whole Objects vs Pre-Extracted Scalars — Comparison

### BAD — pre-extracted scalars by the parent

```php
// The parent decomposes the object into 6 scalars
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
// The DTO receives 6 scalars — it doesn't know where they come from
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
        return new self(...); // simple passthrough, no added value
    }
}
```

### GOOD — whole objects, the DTO extracts itself

```php
// The parent passes objects — clean signature
$hotelInformation = HotelInformationDTO::build(
    hotel: $hotel,
    domainConfig: $domainConfig,
);
```

```php
// The DTO extracts what it needs — encapsulated
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

**Acceptable scalars**: flags (`bool $isActive`), translation keys (`string $title`), isolated values (`string $locale`).

## Child DTO — Complete Example

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

## Child Template — Complete Example

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

## Child DTO Instantiated N Times — Complete Pattern

When a parent template includes the **same child template N times** with different data.

See `BookingInfosReinsuranceDTO` and `BookingInfosReinsuranceItemDTO` in the code for a real example of this pattern.

### Parent DTO

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

### Parent Template

```twig
{{ include('@emails/_parts/booking_infos/reinsurance/reinsurance_item.dto.html.twig', { data: data.cancellationItem }) }}
{% if data.paymentItem is not null %}
    {{ include('@emails/_parts/booking_infos/reinsurance/reinsurance_item.dto.html.twig', { data: data.paymentItem }) }}
{% endif %}
```

**Rule**: the rule "one DTO = one template" applies to the DTO **type**, not the number of instances. `BookingInfosReinsuranceItemDTO::build()` can be called N times to produce N instances of `BookingInfosReinsuranceItemDTO`.

## Notifier — Before / After

### Before (old pattern)

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

### After (new pattern)

```php
$dto = R7DTO::build($order, $hotel, $language);

$message = (new OrderMessageBuilder($this->translator, $order))
    ->withBody('@emails/hotel/reservation/r7-confirmed.dto.html.twig', ['data' => $dto])
    ->build();
```

- Replace `$dto->__toArray()` with `['data' => $dto]`.
- Replace the template path `.html.twig` with `.dto.html.twig`.
