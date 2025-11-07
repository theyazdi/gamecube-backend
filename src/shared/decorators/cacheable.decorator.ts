/**
 * Decorator برای cache کردن خودکار نتایج متدها
 * استفاده:
 * @Cacheable('key-prefix', ttl: 3600)
 * async myMethod() { ... }
 */

export function Cacheable(keyPrefix: string, options: { ttl?: number } = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // در حال حاضر فقط متد اصلی را اجرا می‌کند
      // بعداً با Cache Manager یکپارچه می‌شود
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
