export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');

export interface MailMessage {
  to: string;
  templateId: string;
  variables: Record<string, string | number>;
}

export interface MailTransport {
  send(message: MailMessage): Promise<void>;
}