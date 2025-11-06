import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

export interface SmsPattern {
  patternCode: string;
  parameters: Record<string, string>;
}

export interface SmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface FarazSmsRequest {
  sending_type: 'pattern';
  from_number: string;
  code: string;
  recipients: string[];
  params: Record<string, string>;
  phonebook?: {
    id?: number;
    name?: string;
    pre?: string;
    email?: string;
    options?: Record<string, string>;
  };
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly baseUrl = 'https://edge.ippanel.com/v1/api/send';
  private readonly token: string;
  private readonly fromNumber: string;

  constructor(private configService: ConfigService) {
    // Read token from environment variables
    this.token = this.configService.get<string>('FARAZSMS_TOKEN') || 'YTAzMjZjNTAtNDM5MC00YjM5LTg0MGEtZGNjODAxZjU1YjlkZTI4NjAxNTE4MjViMmFhOTgxYTYxN2FjY2U1N2JiODU=';
    this.fromNumber = this.configService.get<string>('FARAZSMS_FROM_NUMBER') || '+983000505';
    
    this.logger.log(`SMS Service initialized with token: ${this.token.substring(0, 20)}...`);
    this.logger.log(`SMS Service initialized with fromNumber: ${this.fromNumber}`);
  }

  /**
   * Send SMS based on pattern with new FarazSMS format
   * @param phoneNumber Destination phone number
   * @param patternCode Pattern code
   * @param parameters Pattern parameters
   * @returns SMS sending result
   */
  async sendPatternSms(phoneNumber: string, patternCode: string, parameters: Record<string, string>): Promise<SmsResponse> {
    try {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Prepare request data with new format
      const requestData: FarazSmsRequest = {
        sending_type: 'pattern',
        from_number: this.fromNumber,
        code: patternCode,
        recipients: [formattedPhone],
        params: parameters,
      };

      this.logger.log(`Sending SMS to ${formattedPhone} with pattern ${patternCode}`);
      this.logger.log(`Request URL: ${this.baseUrl}`);
      this.logger.log(`Request Data: ${JSON.stringify(requestData, null, 2)}`);
      this.logger.log(`Authorization Token: ${this.token}`);

      // Send request to FarazSMS
      const response: AxiosResponse = await axios.post(this.baseUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.token,
        },
        timeout: 10000, // 10 seconds timeout
      });

      // Check response
      this.logger.log(`Response Status: ${response.status}`);
      this.logger.log(`Response Headers: ${JSON.stringify(response.headers, null, 2)}`);
      this.logger.log(`Response Data: ${JSON.stringify(response.data, null, 2)}`);

      if (response.data && response.data.meta && response.data.meta.status === true) {
        this.logger.log(`SMS sent successfully to ${formattedPhone}`);
        return {
          success: true,
          messageId: response.data.data?.message_outbox_ids?.[0] || 'unknown',
        };
      } else {
        this.logger.error(`SMS sending failed: ${response.data?.meta?.message || 'Unknown error'}`);
        return {
          success: false,
          error: response.data?.meta?.message || 'Unknown error',
        };
      }
    } catch (error) {
      this.logger.error(`SMS sending error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Format phone number for FarazSMS
   * @param phoneNumber Phone number
   * @returns Formatted phone number
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove spaces and extra characters
    let cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '');
    
    // If starts with 0, remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // If doesn't start with 98, add it
    if (!cleaned.startsWith('98')) {
      cleaned = '98' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Send OTP code for login
   * @param phoneNumber Phone number
   * @param otpCode OTP code
   * @returns Sending result
   */
  async sendOtpCode(phoneNumber: string, otpCode: string): Promise<SmsResponse> {
    return this.sendPatternSms(phoneNumber, 'zdfaettgzd3pg7c', {
      code: otpCode,
    });
  }

  /**
   * Send phone verification SMS
   * @param phoneNumber Phone number
   * @param verificationCode Verification code
   * @returns Sending result
   */
  async sendVerificationCode(phoneNumber: string, verificationCode: string): Promise<SmsResponse> {
    return this.sendPatternSms(phoneNumber, 'verification', {
      code: verificationCode,
    });
  }

  /**
   * Send welcome SMS
   * @param phoneNumber Phone number
   * @param userName User name
   * @returns Sending result
   */
  async sendWelcomeMessage(phoneNumber: string, userName: string): Promise<SmsResponse> {
    return this.sendPatternSms(phoneNumber, 'welcome', {
      name: userName,
    });
  }

  /**
   * Send notification SMS
   * @param phoneNumber Phone number
   * @param message Message
   * @returns Sending result
   */
  async sendNotification(phoneNumber: string, message: string): Promise<SmsResponse> {
    return this.sendPatternSms(phoneNumber, 'notification', {
      message: message,
    });
  }
}
