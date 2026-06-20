import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';

import { isAdminAuthenticated } from '@/lib/auth/admin';

const supportTicketSchema = z.object({
  pageUrl: z.string().trim().min(1, 'Page or section is required.'),
  requesterName: z.string().trim().optional().default(''),
  requesterEmail: z.string().trim().optional().default(''),
  requestType: z.string().trim().min(1).default('other'),
  priority: z.string().trim().min(1).default('normal'),
  summary: z.string().trim().min(3, 'A short summary is required.'),
  details: z.string().trim().min(5, 'Request details are required.'),
  acknowledged: z.boolean(),
});

const envValue = (key: string, fallback: string) => {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : fallback;
};

const envList = (key: string, fallback: string[]) => {
  const value = process.env[key]?.trim();
  if (!value) return fallback;

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const configuredWebhookSecrets = () => {
  const secrets = [
    process.env.GHOST_WEB_HELPER_WEBHOOK_SECRET,
    process.env.GHOST_MISSION_CONTROL_WEBHOOK_SECRET,
  ]
    .map((value) => value?.trim() ?? '')
    .filter(Boolean);

  return Array.from(new Set(secrets));
};

const secretFingerprint = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 12);

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = supportTicketSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid support request.';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  if (!parsed.data.acknowledged) {
    return NextResponse.json({ error: 'Support request acknowledgement is required.' }, { status: 400 });
  }

  const webhookSecrets = configuredWebhookSecrets();
  if (!webhookSecrets.length) {
    return NextResponse.json({ error: 'Mission Control webhook secret is not configured.' }, { status: 500 });
  }

  const webhookUrl = envValue(
    'GHOST_MISSION_CONTROL_WEBHOOK_URL',
    'https://ghostmissioncontrol-production.up.railway.app/mission/web-helper-requests',
  );
  const site = envValue('GHOST_SITE_URL', 'https://www.peppersandvibes.com');
  const siteAliases = envList('GHOST_SITE_ALIASES', ['https://www.peppersnvibes.com']);
  const siteAliasSet = new Set([site, ...siteAliases]);

  const payload = {
    client: envValue('GHOST_CLIENT_NAME', 'Peppers and Vibes'),
    client_id: envValue('GHOST_CLIENT_ID', 'peppers-and-vibes'),
    site,
    site_aliases: Array.from(siteAliasSet),
    repo: envValue('GHOST_REPO', 'ghostaisolutions/peptides-ecommerce'),
    source: 'client_admin_dashboard',
    request_type: parsed.data.requestType,
    page_url: parsed.data.pageUrl,
    summary: parsed.data.summary,
    details: parsed.data.details,
    priority: parsed.data.priority,
    requester_name: parsed.data.requesterName,
    requester_email: parsed.data.requesterEmail,
    attachments: [],
    branch_policy: envValue('GHOST_WEB_HELPER_BRANCH_POLICY', 'testing_branch_only'),
    approval_required: envValue('GHOST_WEB_HELPER_APPROVAL_REQUIRED', 'true') !== 'false',
    web_helper_id: envValue('GHOST_WEB_HELPER_ID', 'peppers-and-vibes-web-helper'),
  };

  let response: Response | null = null;
  let result: unknown = null;

  for (const webhookSecret of webhookSecrets) {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ghost-Webhook-Secret': webhookSecret,
      },
      body: JSON.stringify(payload),
    });

    result = await response.json().catch(() => null);

    if (response.ok || response.status !== 401) {
      break;
    }
  }

  if (!response?.ok) {
    const missionResult = result as { error?: string; detail?: string } | null;
    return NextResponse.json(
      {
        error: missionResult?.error ?? 'Mission Control did not accept the support request.',
        detail: {
          mission_control: missionResult?.detail,
          webhook_url: webhookUrl,
          attempted_secret_count: webhookSecrets.length,
          attempted_secret_fingerprints: webhookSecrets.map(secretFingerprint),
        },
      },
      { status: response?.status ?? 502 },
    );
  }

  const missionResult = result as {
    ticketId?: string;
    id?: string;
    request?: { id?: string };
    ticket?: { id?: string };
  } | null;

  return NextResponse.json({
    success: true,
    ticketId: missionResult?.ticketId ?? missionResult?.id ?? missionResult?.request?.id ?? missionResult?.ticket?.id,
    missionControl: missionResult,
  });
}
