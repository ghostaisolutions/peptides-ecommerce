import { NextResponse } from 'next/server';
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

  const webhookSecret = process.env.GHOST_MISSION_CONTROL_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
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

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Ghost-Webhook-Secret': webhookSecret,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      {
        error: result?.error ?? 'Mission Control did not accept the support request.',
        detail: result?.detail,
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    success: true,
    ticketId: result?.ticketId ?? result?.id ?? result?.request?.id ?? result?.ticket?.id,
    missionControl: result,
  });
}
