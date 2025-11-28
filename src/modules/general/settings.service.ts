import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { UpdateTaxSettingsDto } from './dto';

export interface TaxSettings {
  enabled: boolean;
  rate: number;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private taxSettingsCache: TaxSettings | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute cache

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get tax settings with caching
   * Cache TTL: 1 minute
   * Automatically initializes defaults if not found
   */
  async getTaxSettings(): Promise<TaxSettings> {
    const now = Date.now();

    // Return cached value if still valid
    if (this.taxSettingsCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.taxSettingsCache;
    }

    // Fetch from database
    const settings = await this.prisma.systemSettings.findMany({
      where: {
        category: 'tax',
        isActive: true,
      },
    });

    // If no settings found, initialize defaults
    if (settings.length === 0) {
      this.logger.warn('Tax settings not found in database, initializing defaults...');
      await this.initializeDefaultSettings();
      // Fetch again after initialization
      const newSettings = await this.prisma.systemSettings.findMany({
        where: {
          category: 'tax',
          isActive: true,
        },
      });
      return this.parseSettings(newSettings, now);
    }

    return this.parseSettings(settings, now);
  }

  /**
   * Parse settings array into TaxSettings object
   */
  private parseSettings(settings: any[], now: number): TaxSettings {
    const taxSettings: TaxSettings = {
      enabled: this.parseBoolean(settings.find(s => s.key === 'tax_enabled')?.value, false),
      rate: this.parseNumber(settings.find(s => s.key === 'tax_rate')?.value, 10),
    };

    // Update cache
    this.taxSettingsCache = taxSettings;
    this.cacheTimestamp = now;

    this.logger.debug(`Tax settings loaded: ${JSON.stringify(taxSettings)}`);

    return taxSettings;
  }

  /**
   * Update tax settings
   */
  async updateTaxSettings(dto: UpdateTaxSettingsDto): Promise<TaxSettings> {
    const updates: Array<{ key: string; value: string }> = [];

    if (dto.taxEnabled !== undefined) {
      updates.push({ key: 'tax_enabled', value: dto.taxEnabled.toString() });
    }

    if (dto.taxRate !== undefined) {
      updates.push({ key: 'tax_rate', value: dto.taxRate.toString() });
    }

    // Update all settings in transaction
    await this.prisma.$transaction(
      updates.map(({ key, value }) =>
        this.prisma.systemSettings.upsert({
          where: { key },
          create: {
            key,
            value,
            dataType: key === 'tax_enabled' ? 'boolean' : 'percentage',
            category: 'tax',
            label: this.getLabelForKey(key),
            isActive: true,
          },
          update: {
            value,
            updatedAt: new Date(),
          },
        }),
      ),
    );

    // Clear cache to force reload
    this.invalidateCache();

    this.logger.log(`Tax settings updated: ${JSON.stringify(dto)}`);

    // Return updated settings
    return this.getTaxSettings();
  }

  /**
   * Calculate tax amount based on current settings
   */
  async calculateTax(baseAmount: number): Promise<{ taxAmount: number; totalAmount: number }> {
    const settings = await this.getTaxSettings();

    if (!settings.enabled) {
      return {
        taxAmount: 0,
        totalAmount: baseAmount,
      };
    }

    // Calculate tax as percentage
    const taxAmount = Math.round(baseAmount * (settings.rate / 100));

    return {
      taxAmount,
      totalAmount: baseAmount + taxAmount,
    };
  }

  /**
   * Initialize default tax settings
   * Called automatically when settings are not found in database
   * Can also be called manually if needed
   */
  private async initializeDefaultSettings(): Promise<void> {
    const defaultSettings = [
      {
        key: 'tax_enabled',
        value: 'false',
        dataType: 'boolean',
        category: 'tax',
        label: 'فعال‌سازی مالیات',
        description: 'فعال یا غیرفعال کردن محاسبه مالیات روی فاکتورها',
      },
      {
        key: 'tax_rate',
        value: '10',
        dataType: 'percentage',
        category: 'tax',
        label: 'نرخ مالیات',
        description: 'درصد مالیات (0-100)',
      },
    ];

    for (const setting of defaultSettings) {
      await this.prisma.systemSettings.upsert({
        where: { key: setting.key },
        create: {
          ...setting,
          isActive: true,
        },
        update: {}, // Don't update if exists
      });
    }

    this.invalidateCache();
    this.logger.log('Default tax settings initialized');
  }

  /**
   * Invalidate cache
   */
  private invalidateCache(): void {
    this.taxSettingsCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Helper: Parse boolean
   */
  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  /**
   * Helper: Parse number
   */
  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Helper: Get label for key
   */
  private getLabelForKey(key: string): string {
    const labels: Record<string, string> = {
      tax_enabled: 'فعال‌سازی مالیات',
      tax_rate: 'نرخ مالیات',
    };
    return labels[key] || key;
  }
}
