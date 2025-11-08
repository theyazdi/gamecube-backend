# آپدیت فیلد Description برای Organization

## خلاصه تغییرات

یک فیلد جدید `description` به جدول `Organization` اضافه شده است که کاربران می‌توانند تا 400 کاراکتر توضیحات فارسی برای گیم نت خود وارد کنند.

## تغییرات Backend

### 1. Schema (Database)
- فیلد `description` به جدول `organizations` اضافه شد
- نوع: `VARCHAR(400)` (اختیاری)
- Migration: `20251108204456_add_description_to_organizations`

### 2. DTOs
- `CreateOrganizationDto`: فیلد `description` اضافه شد (اختیاری، حداکثر 400 کاراکتر)
- `UpdateOrganizationDto`: فیلد `description` اضافه شد (اختیاری، حداکثر 400 کاراکتر)
- `OrganizationResponseDto`: فیلد `description` اضافه شد
- `OrganizationDetailsResponseDto`: فیلد `description` اضافه شد

### 3. Endpoints
تمام endpoint های زیر به‌روزرسانی شدند:

#### POST `/organizations`
- می‌تواند `description` را در body دریافت کند
- Validation: حداکثر 400 کاراکتر

#### PUT `/organizations/:id`
- می‌تواند `description` را در body دریافت کند
- Validation: حداکثر 400 کاراکتر

#### PUT `/organizations/uuid/:uuid`
- می‌تواند `description` را در body دریافت کند
- Validation: حداکثر 400 کاراکتر

#### POST `/organizations/details`
- در response، فیلد `description` برگردانده می‌شود

#### GET `/organizations`
- در response، فیلد `description` برگردانده می‌شود

#### GET `/organizations/:id`
- در response، فیلد `description` برگردانده می‌شود

#### GET `/organizations/uuid/:uuid`
- در response، فیلد `description` برگردانده می‌شود

#### GET `/organizations/username/:username`
- در response، فیلد `description` برگردانده می‌شود

## تغییرات مورد نیاز Frontend

### 1. فرم ساخت Organization
- یک فیلد `textarea` یا `input` برای `description` اضافه کنید
- حداکثر 400 کاراکتر
- نمایش تعداد کاراکترهای باقی‌مانده
- Validation: اگر بیشتر از 400 کاراکتر بود، خطا نمایش دهید

### 2. فرم ویرایش Organization
- فیلد `description` را به فرم ویرایش اضافه کنید
- مقدار فعلی را از response دریافت کرده و در فیلد نمایش دهید
- Validation: حداکثر 400 کاراکتر

### 3. نمایش Organization Details
- در صفحه جزئیات گیم نت، فیلد `description` را نمایش دهید
- می‌توانید در بخش "درباره ما" یا "توضیحات" نمایش دهید

### 4. لیست Organizations
- در صورت نیاز، می‌توانید `description` را در کارت‌های لیست نمایش دهید (مثلاً به صورت خلاصه)

## مثال Request/Response

### POST `/organizations`
```json
{
  "name": "گیم نت تهران",
  "province": "تهران",
  "city": "تهران",
  "phoneNumber": "02112345678",
  "description": "گیم نت مدرن با بهترین تجهیزات و فضای راحت برای بازی"
}
```

### Response
```json
{
  "id": 1,
  "uuid": "...",
  "name": "گیم نت تهران",
  "description": "گیم نت مدرن با بهترین تجهیزات و فضای راحت برای بازی",
  ...
}
```

## Validation Rules

- **نوع**: String
- **حداکثر طول**: 400 کاراکتر
- **اختیاری**: بله (می‌تواند `null` باشد)
- **زبان**: فارسی (پشتیبانی کامل از کاراکترهای فارسی)

## نکات مهم

1. فیلد `description` اختیاری است، پس اگر در response `null` یا `undefined` بود، نباید خطا بدهید
2. حتماً validation سمت frontend هم پیاده‌سازی کنید تا کاربر بیش از 400 کاراکتر نتواند وارد کند
3. در صورت نیاز، می‌توانید کاراکترهای باقی‌مانده را به کاربر نمایش دهید (مثلاً: "350/400")

## Migration

برای اعمال تغییرات در دیتابیس، migration زیر را اجرا کنید:

```bash
npx prisma migrate deploy
```

یا اگر در محیط development هستید:

```bash
npx prisma migrate dev
```

