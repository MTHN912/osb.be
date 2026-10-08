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

const RAW_HTML_VARS = new Set(['serviceRows', 'bookingDetailsHtml']);
const TEMPLATE_PROBE_FILE = 'booking-confirmation.mjml';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly templatesDir: string;
  private readonly assetsDir: string;
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
    this.assetsDir = path.join(path.dirname(this.templatesDir), 'assets');
  }

  async sendBookingConfirmation(data: BookingMailData): Promise<void> {
    const frontendUrl = getEnvOrThrow<string>(this.config, 'FRONTEND_URL');

    // Date formatted as: Saturday 10-10-2026
    const dayOfWeek = data.bookingDate.toLocaleDateString('en-US', { weekday: 'long' });
    const day = String(data.bookingDate.getDate()).padStart(2, '0');
    const month = String(data.bookingDate.getMonth() + 1).padStart(2, '0');
    const year = data.bookingDate.getFullYear();
    const bookingDayDate = `${dayOfWeek} ${day}-${month}-${year}`;

    // Time formatted as: 11:30
    const bookingTime = formatMinutes(minutesOfDay(data.bookingDate));

    const dealerMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.dealer.name}, ${data.dealer.address}`)}`;

    const serviceItems = (data.services || [])
      .map((s) => `<li style="margin-bottom: 4px; color: #272F3E; font-size: 14px;">${escapeHtml(s.name)}</li>`)
      .join('');

    const serviceListHtml = `
      <div style="font-size: 14px; font-weight: 500; color: #272F3E; margin-bottom: 4px;">Service (${data.services?.length || 0})</div>
      <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
        ${serviceItems || '<li style="margin-bottom: 4px; color: #272F3E; font-size: 14px;">Standard Service</li>'}
      </ul>
    `;

    const bookingDetailsHtml = `
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #272F3E; line-height: 22px;">
  <!-- Date & Time Row matching Image -->
  <tr>
    <td colspan="2" style="padding-bottom: 20px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td width="50%" valign="middle" style="padding-right: 12px;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="middle" style="width: 24px; padding-right: 8px;">
                  <img src="cid:icon-calendar" width="18" height="18" alt="📅" style="display: block; border: 0;" />
                </td>
                <td valign="middle" style="font-size: 15px; font-weight: 700; color: #272F3E; white-space: nowrap;">
                  ${escapeHtml(bookingDayDate)}
                </td>
              </tr>
            </table>
          </td>
          <td width="50%" valign="middle" style="padding-left: 12px;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="middle" style="width: 24px; padding-right: 8px;">
                  <img src="cid:icon-clock" width="18" height="18" alt="🕒" style="display: block; border: 0;" />
                </td>
                <td valign="middle" style="font-size: 15px; font-weight: 700; color: #272F3E; white-space: nowrap;">
                  Time ${escapeHtml(bookingTime)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Dealership Row matching Image -->
  <tr>
    <td valign="top" style="width: 26px; padding-top: 2px; padding-right: 8px;">
      <img src="cid:icon-dealer" width="18" height="18" alt="🏢" style="display: block; border: 0;" />
    </td>
    <td valign="top" style="padding-bottom: 20px;">
      <div style="font-size: 15px; font-weight: 700; color: #272F3E; margin-bottom: 3px;">${escapeHtml(data.dealer.name)}</div>
      <div>
        <a href="${escapeHtml(dealerMapsUrl)}" target="_blank" style="color: #2A53EE; text-decoration: underline; line-height: 20px;">${escapeHtml(data.dealer.address)}</a>
      </div>
    </td>
  </tr>

  <!-- Customer Row matching Image -->
  <tr>
    <td valign="top" style="width: 26px; padding-top: 2px; padding-right: 8px;">
      <img src="cid:icon-customer" width="18" height="18" alt="👤" style="display: block; border: 0;" />
    </td>
    <td valign="top" style="padding-bottom: 20px;">
      <div><strong style="color: #272F3E;">Name:</strong> ${escapeHtml(data.customerName)}</div>
      <div><strong style="color: #272F3E;">Email:</strong> <a href="mailto:${escapeHtml(data.customerEmail || data.to)}" style="color: #2A53EE; text-decoration: underline;">${escapeHtml(data.customerEmail || data.to)}</a></div>
      <div><strong style="color: #272F3E;">Mobile:</strong> ${escapeHtml(data.customerMobile || '-')}</div>
      <div><strong style="color: #272F3E;">Address:</strong> ${escapeHtml(data.customerAddress || '-')}</div>
    </td>
  </tr>

  <!-- Vehicle Row matching Image -->
  <tr>
    <td valign="top" style="width: 26px; padding-top: 3px; padding-right: 8px;">
      <img src="cid:icon-car" width="18" height="14" alt="🚗" style="display: block; border: 0;" />
    </td>
    <td valign="top" style="padding-bottom: 20px;">
      <div><strong style="color: #272F3E;">License Plate No:</strong> ${escapeHtml(data.licensePlate || '-')}</div>
      <div><strong style="color: #272F3E;">Make:</strong> ${escapeHtml(data.make || '-')}</div>
      <div><strong style="color: #272F3E;">Model:</strong> ${escapeHtml(data.model || '-')}</div>
      <div><strong style="color: #272F3E;">Year:</strong> ${escapeHtml(String(data.year || '-'))}</div>
      <div><strong style="color: #272F3E;">VIN:</strong> ${escapeHtml(data.vin || '-')}</div>
    </td>
  </tr>

  <!-- Services Row matching Image -->
  <tr>
    <td valign="top" style="width: 26px; padding-top: 2px; padding-right: 8px;">
      <img src="cid:icon-service" width="18" height="17" alt="🛠" style="display: block; border: 0;" />
    </td>
    <td valign="top" style="padding-bottom: 20px;">
      <div style="font-size: 15px; font-weight: 700; color: #272F3E; margin-bottom: 4px;">Services</div>
      <div style="padding-left: 28px;">
        ${serviceListHtml}
      </div>
    </td>
  </tr>

  <!-- Additional Comments Row matching Image -->
  <tr>
    <td valign="top" style="width: 26px; padding-top: 2px; padding-right: 8px;">
      <img src="cid:icon-comment" width="16" height="18" alt="📄" style="display: block; border: 0;" />
    </td>
    <td valign="top" style="padding-bottom: 8px;">
      <div style="font-size: 15px; font-weight: 700; color: #272F3E; margin-bottom: 4px;">Additional Comments</div>
      <div style="padding-left: 28px; color: #272F3E;">
        ${escapeHtml(data.customerNote && data.customerNote.trim().length > 0 ? data.customerNote : '-')}
      </div>
    </td>
  </tr>
</table>
    `;

    const iconNames = ['calendar', 'clock', 'dealer', 'customer', 'car', 'service', 'comment'];
    const attachments = iconNames
      .map((name) => ({
        filename: `icon-${name}.png`,
        path: path.join(this.assetsDir, `icon-${name}.png`),
        cid: `icon-${name}`,
      }))
      .filter((att) => fs.existsSync(att.path));

    await this.send(
      data.to,
      t('MAIL_SUBJECT_BOOKING_CONFIRMATION', { id: data.bookingId }),
      'booking-confirmation',
      {
        customerName: data.customerName,
        bookingId: String(data.bookingId),
        bookingDayDate,
        bookingTime,
        bookingDetailsHtml,
        manageUrl: `${frontendUrl}/manage`,
        customerNote: data.customerNote ?? '',
        ...this.dealerVars(data.dealer),
      },
      attachments,
    );
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
    const frontendUrl = getEnvOrThrow<string>(this.config, 'FRONTEND_URL');
    return {
      dealerName: dealer.name,
      dealerAddress: dealer.address,
      dealerPhone: dealer.phone ?? '',
      currentYear: String(new Date().getFullYear()),
      frontendUrl,
    };
  }

  private loadTemplate(template: string): string {
    const cached = this.templateCache.get(template);
    if (cached) return cached;
    let source = fs.readFileSync(path.join(this.templatesDir, `${template}.mjml`), 'utf-8');

    // Inlining includes before variable substitution ensures variables inside header.mjml and footer.mjml are substituted
    source = source.replace(/<mj-include\s+path=["']\.\/(.*?)["']\s*(?:\/>|>\s*<\/mj-include>)/g, (_, incPath) => {
      const fullPath = path.join(this.templatesDir, incPath);
      return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
    });

    this.templateCache.set(template, source);
    return source;
  }

  private async send(
    to: string,
    subject: string,
    template: string,
    vars: Record<string, string>,
    attachments?: nodemailer.SendMailOptions['attachments'],
  ): Promise<void> {
    const source = this.loadTemplate(template);
    const compiled = source.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = vars[key] ?? '';
      return RAW_HTML_VARS.has(key) ? value : escapeHtml(value);
    });
    const templatePath = path.join(this.templatesDir, `${template}.mjml`);
    const { html } = await mjml2html(compiled, { filePath: templatePath, validationLevel: 'soft' });

    const fromName = getEnvOrThrow<string>(this.config, 'MAIL_FROM_NAME');
    const fromEmail = getEnvOrThrow<string>(this.config, 'MAIL_FROM_EMAIL');
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    };

    const defaultAttachments: nodemailer.SendMailOptions['attachments'] = [];
    const logoPath = path.join(this.assetsDir, 'logo.png');
    if (fs.existsSync(logoPath)) {
      defaultAttachments.push({
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo',
      });
    }

    const allAttachments = [...defaultAttachments, ...(attachments || [])];
    if (allAttachments.length > 0) {
      mailOptions.attachments = allAttachments;
    }

    const info = await this.transporter.sendMail(mailOptions);
    this.logger.log(t('MAIL_SENT', { template, to, id: info.messageId }));
  }
}
