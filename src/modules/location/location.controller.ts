import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { LocationService } from './location.service';
import { Response } from 'express';

@Controller()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // GET /api/location-search?q=...
  @Get('location-search')
  async locationSearch(@Query('q') q: string, @Res() res: Response) {
    if (!q) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Query parameter "q" is required' });
    }
    try {
      const result = await this.locationService.search(q);
      return res.json(result);
    } catch (error) {
      return res.status(error.status || 502).json(error.response || { error: 'Location lookup failed' });
    }
  }

  // GET /api/location-reverse?lat=..&lon=..&accept-language=fa
  @Get('location-reverse')
  async locationReverse(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('accept-language') language: string,
    @Res() res: Response,
  ) {
    if (!lat || !lon) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Query parameters "lat" and "lon" are required' });
    }
    try {
      const result = await this.locationService.reverse(lat, lon, language);
      return res.json(result);
    } catch (error) {
      return res.status(error.status || 502).json(error.response || { error: 'Reverse geocoding failed' });
    }
  }
}

