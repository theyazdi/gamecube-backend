import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class CleanPricingsPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' && value && value.pricings && Array.isArray(value.pricings)) {
      // Remove extra fields (id, stationId, createdAt, updatedAt) from pricings
      value.pricings = value.pricings.map((p: any) => ({
        playerCount: p.playerCount,
        price: p.price,
      }));
    }
    return value;
  }
}

