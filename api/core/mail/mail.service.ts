import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import mjml2html from 'mjml';
import * as fs from 'fs';
import * as path from 'path';
import { getEnvOrThrow } from '../../shared/utils/env.util';
import { formatMinutes, minutesOfDay } from '../../shared/utils/date-time.util';
import { t } from '../../shared/utils/i18n.util';
import { BookingMailData, MailDealer } from './interfaces/mail.interface';

const RAW_HTML_VARS = new Set(['serviceRows']);
const TEMPLATE_PROBE_FILE = 'booking-confirmation.mjml';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly templatesDir: string;
  private readonly templateCache = new Map<string, string>();

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: getEnvOrThrow<string>(config, 'MAIL_HOST'),
      port: Number(getEnvOrThrow<string>(config, 'MAIL_PORT')),
      secure: false,
      auth: {
        user: getEnvOrThrow<string>(config, 'MAIL_USER'),
        pass: getEnvOrThrow<string>(config, 'MAIL_PASSWORD'),
      },
    });

    const candidates = [path.join(__dirname, 'templates'), path.join(process.cwd(), 'api', 'core', 'mail', 'templates')];
    this.templatesDir = candidates.find((dir) => fs.existsSync(path.join(dir, TEMPLATE_PROBE_FILE))) ?? candidates[candidates.length - 1];
  }

  async sendBookingConfirmation(data: BookingMailData): Promise<void> {
    const rows = data.services
      .map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${s.duration} min</td><td align="right">${s.price !== null ? `$${s.price.toFixed(2)}` : '-'}</td></tr>`)
      .join('');

    await this.send(data.to, t('MAIL_SUBJECT_BOOKING_CONFIRMATION', { id: data.bookingId }), 'booking-confirmation', {
      customerName: data.customerName,
      bookingId: String(data.bookingId),
      bookingDate: data.bookingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      bookingTime: formatMinutes(minutesOfDay(data.bookingDate)),
      vehicle: data.vehicle,
      serviceRows: rows,
      totalDuration: `${data.estimatedDuration} min`,
      totalPrice: data.estimatedPrice !== null ? `$${data.estimatedPrice.toFixed(2)}` : '-',
      technicianName: data.technicianName,
      customerNote: data.customerNote ?? '',
      ...this.dealerVars(data.dealer),
    });
  }

  async sendPasswordReset(to: string, customerName: string, token: string, dealer: MailDealer): Promise<void> {
    await this.send(to, t('MAIL_SUBJECT_PASSWORD_RESET'), 'password-reset', {
      customerName,
      resetPasswordUrl: this.resetPasswordUrl(token),
      ...this.dealerVars(dealer),
    });
  }

  async sendWelcome(to: string, customerName: string, dealer: MailDealer): Promise<void> {
    const frontendUrl = getEnvOrThrow<string>(this.config, 'FRONTEND_URL');
    await this.send(to, t('MAIL_SUBJECT_WELCOME', { dealer: dealer.name }), 'welcome', {
      customerName,
      bookingUrl: `${frontendUrl}/booking`,
      ...this.dealerVars(dealer),
    });
  }

  async sendWelcomeWithSetPassword(to: string, customerName: string, token: string, dealer: MailDealer): Promise<void> {
    await this.send(to, t('MAIL_SUBJECT_WELCOME_SET_PASSWORD', { dealer: dealer.name }), 'welcome-set-password', {
      customerName,
      setPasswordUrl: this.resetPasswordUrl(token),
      ...this.dealerVars(dealer),
    });
  }

  private resetPasswordUrl(token: string): string {
    const frontendUrl = getEnvOrThrow<string>(this.config, 'FRONTEND_URL');
    return `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  }

  private dealerVars(dealer: MailDealer): Record<string, string> {
    return {
      dealerName: dealer.name,
      dealerAddress: dealer.address,
      dealerPhone: dealer.phone ?? '',
      currentYear: String(new Date().getFullYear()),
    };
  }

  private loadTemplate(template: string): string {
    const cached = this.templateCache.get(template);
    if (cached) return cached;
    const source = fs.readFileSync(path.join(this.templatesDir, `${template}.mjml`), 'utf-8');
    this.templateCache.set(template, source);
    return source;
  }

  private async send(to: string, subject: string, template: string, vars: Record<string, string>): Promise<void> {
    const source = this.loadTemplate(template);
    const compiled = source.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = vars[key] ?? '';
      return RAW_HTML_VARS.has(key) ? value : escapeHtml(value);
    });
    const { html } = await mjml2html(compiled, { validationLevel: 'soft' });

    const fromName = getEnvOrThrow<string>(this.config, 'MAIL_FROM_NAME');
    const fromEmail = getEnvOrThrow<string>(this.config, 'MAIL_FROM_EMAIL');
    const info = await this.transporter.sendMail({ from: `"${fromName}" <${fromEmail}>`, to, subject, html });
    this.logger.log(t('MAIL_SENT', { template, to, id: info.messageId }));
  }
}
