import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LocationService {
  async search(q: string): Promise<any> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'NestJS-Proxy' },
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        error?.response?.data || 'Failed to fetch from Nominatim',
        error?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async reverse(lat: string | number, lon: string | number, language?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.set('format', 'json');
      params.set('lat', String(lat));
      params.set('lon', String(lon));
      if (language) params.set('accept-language', language);

      const url = `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'NestJS-Proxy' },
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        error?.response?.data || 'Failed to fetch from Nominatim (reverse)',
        error?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

