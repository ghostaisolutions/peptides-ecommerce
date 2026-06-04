import type { StoredOrderRequest } from '@/lib/types';
import { siteConfig } from '@/lib/config/site-config';
import { currency } from '@/lib/utils/format';

const logTemplate = (event: string, payload: Record<string, unknown>) => {
  console.info(`[email-stub:${event}]`, payload);
};

const fromAddress = process.env.EMAIL_FROM ?? siteConfig.supportEmail;
const adminEmail = process.env.ADMIN_EMAIL ?? siteConfig.supportEmail;
const resendApiKey = process.env.RESEND_API_KEY;
const requiresEmailDelivery = process.env.NODE_ENV === 'production';

type EmailPayload = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  idempotencyKey?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const paragraphize = (value: string) =>
  escapeHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)
    .join('');

const sendEmail = async (event: string, payload: EmailPayload) => {
  if (!resendApiKey) {
    if (requiresEmailDelivery) {
      throw new Error('Resend email delivery is not configured. Set RESEND_API_KEY in Vercel.');
    }

    logTemplate(event, { from: fromAddress, ...payload, resendConfigured: false });
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      ...(payload.idempotencyKey ? { 'Idempotency-Key': payload.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: fromAddress,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      reply_to: payload.replyTo,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => 'Unknown Resend error');
    let message = body;

    try {
      const parsed = JSON.parse(body) as { message?: string };
      message = parsed.message ?? body;
    } catch {
      message = body;
    }

    throw new Error(`Email delivery warning: ${message}`);
  }
};

const getOrderEmailBlock = (order: StoredOrderRequest) => {
  const items = order.items.map((item) => ({
    name: item.variantName ? `${item.productName} (${item.variantName})` : item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.unitPrice * item.quantity,
  }));

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    orderId: order.orderReference,
    items,
    total,
  };
};

const buildEmailShell = ({
  preview,
  heading,
  body,
}: {
  preview: string;
  heading: string;
  body: string;
}) => `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(preview)}</title>
  </head>
  <body style="margin:0;background:#f8f5f0;color:#1a1a1a;font-family:Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5f0;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e6d7a7;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#7a0c12;color:#f8f5f0;padding:24px 28px;">
                <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#d4af37;">${escapeHtml(siteConfig.brandName)}</p>
                <h1 style="margin:0;font-family:Georgia,serif;font-size:30px;line-height:1.1;">${escapeHtml(heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:#1a1a1a;font-size:15px;line-height:1.6;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="background:#231619;color:#d8c9a7;padding:18px 28px;font-size:12px;line-height:1.5;">
                ${escapeHtml(siteConfig.brandName)} &bull; ${escapeHtml(siteConfig.supportEmail)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const buildItemsTable = (order: StoredOrderRequest) => {
  const rows = order.items
    .map((item) => {
      const name = item.variantName ? `${item.productName} (${item.variantName})` : item.productName;
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;color:#1a1a1a;">${escapeHtml(name)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;color:#1a1a1a;">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;color:#1a1a1a;">${currency(item.unitPrice * item.quantity)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border-collapse:collapse;">
      <thead>
        <tr>
          <th align="left" style="padding:0 0 8px;border-bottom:2px solid #d4af37;color:#7a0c12;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Item</th>
          <th style="padding:0 0 8px;border-bottom:2px solid #d4af37;color:#7a0c12;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Qty</th>
          <th align="right" style="padding:0 0 8px;border-bottom:2px solid #d4af37;color:#7a0c12;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

const getOrderTotal = (order: StoredOrderRequest) => {
  const itemTotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return itemTotal - (order.discountAmount ?? 0) + (order.shippingAmount ?? 0) + (order.taxAmount ?? 0);
};

export const sendOrderReceivedEmail = async (order: StoredOrderRequest) => {
  const subject = `Order request received: ${order.orderReference}`;
  await sendEmail('order-received', {
    to: order.email,
    subject,
    text: `Your order request ${order.orderReference} has been received and is pending review.`,
    html: buildEmailShell({
      preview: subject,
      heading: 'Order Request Received',
      body: `
        <p>Your order request <strong>${escapeHtml(order.orderReference)}</strong> has been received and is pending review.</p>
        ${buildItemsTable(order)}
        <p>We will follow up with payment instructions after review.</p>
      `,
    }),
    idempotencyKey: `order-received-${order.orderReference}`,
  });
};

export const sendOrderApprovedEmail = async (order: StoredOrderRequest) => {
  const subject = `Order approved: ${order.orderReference}`;
  await sendEmail('order-approved', {
    to: order.email,
    subject,
    text: `Your order ${order.orderReference} has been approved and is moving to payment preparation.`,
    html: buildEmailShell({
      preview: subject,
      heading: 'Order Approved',
      body: `
        <p>Your order <strong>${escapeHtml(order.orderReference)}</strong> has been approved and is moving to payment preparation.</p>
        <p>You will receive payment instructions shortly.</p>
      `,
    }),
    idempotencyKey: `order-approved-${order.orderReference}`,
  });
};

export const sendPaymentInstructionsEmail = async (order: StoredOrderRequest) => {
  const orderBlock = getOrderEmailBlock(order);
  const total = getOrderTotal(order);
  const subject = `Invoice and payment instructions for ${order.orderReference}`;
  const instructions = order.paymentInstructions?.trim() || 'Payment instructions will be provided by our team.';
  const paymentLinkHtml = order.paymentLink
    ? `<p><a href="${escapeHtml(order.paymentLink)}" style="display:inline-block;background:#d4af37;color:#1a1a1a;text-decoration:none;border-radius:10px;padding:12px 18px;font-weight:bold;">Open Payment Link</a></p>`
    : '';

  await sendEmail('payment-instructions', {
    to: order.email,
    subject,
    text: [
      `Order ${order.orderReference} is ready for payment.`,
      `Total: ${currency(total)}`,
      `Payment preference: ${order.paymentMethodLabel}`,
      '',
      instructions,
      order.paymentLink ? `Payment link: ${order.paymentLink}` : '',
    ].filter(Boolean).join('\n'),
    html: buildEmailShell({
      preview: subject,
      heading: 'Invoice & Payment Instructions',
      body: `
        <p>Order <strong>${escapeHtml(order.orderReference)}</strong> is approved and ready for payment.</p>
        ${buildItemsTable(order)}
        <p style="font-size:18px;"><strong>Total due: ${currency(total)}</strong></p>
        <p><strong>Payment preference:</strong> ${escapeHtml(order.paymentMethodLabel)}</p>
        <div style="margin:18px 0;padding:16px;border:1px solid #e6d7a7;border-radius:12px;background:#fffaf0;">
          <h2 style="margin:0 0 8px;font-size:16px;color:#7a0c12;">Payment instructions</h2>
          ${paragraphize(instructions)}
        </div>
        ${paymentLinkHtml}
        <p style="font-size:13px;color:#6b5f45;">This invoice is for order request ${escapeHtml(orderBlock.orderId)}.</p>
      `,
    }),
    idempotencyKey: `payment-instructions-${order.orderReference}-${order.timeline.paymentSentAt ?? 'pending'}`,
  });
};

export const sendOrderCompletedEmail = async (order: StoredOrderRequest) => {
  const subject = `Order completed: ${order.orderReference}`;
  await sendEmail('order-completed', {
    to: order.email,
    subject,
    text: `Your order workflow ${order.orderReference} has been completed. Thank you for your order request.`,
    html: buildEmailShell({
      preview: subject,
      heading: 'Order Completed',
      body: `<p>Your order workflow <strong>${escapeHtml(order.orderReference)}</strong> has been completed. Thank you for your order request.</p>`,
    }),
    idempotencyKey: `order-completed-${order.orderReference}`,
  });
};

export const sendAdminNotification = async (order: StoredOrderRequest, event: string) => {
  await sendEmail('admin-notification', {
    to: adminEmail,
    subject: `${siteConfig.brandName} admin notice: ${event}`,
    text: `Order ${order.orderReference}\nCustomer: ${order.customerName}\nStatus: ${order.status}\nPayment preference: ${order.paymentMethodLabel}`,
    html: buildEmailShell({
      preview: `${event} for ${order.orderReference}`,
      heading: 'Admin Order Notice',
      body: `
        <p><strong>Event:</strong> ${escapeHtml(event)}</p>
        <p><strong>Order:</strong> ${escapeHtml(order.orderReference)}</p>
        <p><strong>Customer:</strong> ${escapeHtml(order.customerName)}</p>
        <p><strong>Status:</strong> ${escapeHtml(order.status)}</p>
        <p><strong>Payment preference:</strong> ${escapeHtml(order.paymentMethodLabel)}</p>
      `,
    }),
    replyTo: order.email,
    idempotencyKey: `admin-${event}-${order.orderReference}-${order.updatedAt}`,
  });
};

export const sendOrderConfirmation = sendOrderReceivedEmail;
