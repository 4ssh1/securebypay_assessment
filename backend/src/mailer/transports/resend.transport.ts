import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { MailMessage, MailTransport } from '../mail.transport';

@Injectable()
export class ResendMailTransport implements MailTransport {
  private readonly logger = new Logger('ResendMail');
  private readonly endpoint = 'https://api.resend.com/emails';

  constructor(private readonly config: AppConfigService) {}

  async send(message: MailMessage): Promise<void> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.mailFrom,
        to: message.to,
        template: {
          id: message.templateId,
          variables: message.variables,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Resend API error ${res.status}: ${body}`);
      throw new Error(`Resend API responded with ${res.status}`);
    }
  }
}