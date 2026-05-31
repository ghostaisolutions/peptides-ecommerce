import { hasDatabaseUrl, prisma } from '@/lib/db';

export const SETTING_DEFAULTS: Record<string, string> = {
  'contact.supportMessage': 'Will reply within 24 hours upon sending inquiries.',
  'contact.infoEmail': 'info@peppersandvibes.com',
  'contact.supportEmail': 'support@peppersandvibes.com',
  'contact.address': '8092 S Yale #1057, Tulsa, OK 74136, United States',
  'legal.privacyText':
    'Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.',
  'legal.disclaimerText':
    'Peppers & Vibes provides research chemicals exclusively for laboratory research and scientific exploration. These products are not intended for human or animal consumption. They are designed for use in controlled, professional research settings and are exempt from certain regulations under Title 21 of the Code of Federal Regulations (21CFR).\n\nWe are committed to ensuring that our customers use these materials responsibly and in accordance with all applicable safety protocols and ethical guidelines. By purchasing from Peppers & Vibes, you acknowledge that these chemicals are for research purposes only and will be handled by qualified individuals in appropriate laboratory environments.',
  'shipping.policyText': 'Orders fulfilled within 24–48 hours after payment received.',
  'store.fulfillmentHours': '24-48',
  'store.kitThreshold': '1',
  'store.freeShippingThreshold': '',
  'store.disableCategories': 'true',
  'products.bottleMockupsEnabled': 'false',
  'checkout.taxEnabled': 'false',
  'checkout.taxRate': '0',
  'branding.siteName': 'Peppers & Vibes',
  'branding.logoUrl': '',
  'branding.footerLogoUrl': '',
  'branding.ogImageUrl': '',
};

export const getSetting = async (key: string): Promise<string> => {
  if (!hasDatabaseUrl) return SETTING_DEFAULTS[key] ?? '';
  try {
    const row = await prisma!.siteSetting.findUnique({ where: { key } });
    return row?.value ?? SETTING_DEFAULTS[key] ?? '';
  } catch {
    return SETTING_DEFAULTS[key] ?? '';
  }
};

export const upsertSetting = async (key: string, value: string): Promise<{ ok: boolean; message?: string }> => {
  if (!hasDatabaseUrl) return { ok: false, message: 'DATABASE_URL not configured.' };
  const section = key.split('.')[0] ?? 'general';
  try {
    await prisma!.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, section },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: String(error) };
  }
};

export const bulkUpsertSettings = async (
  entries: Record<string, string>,
): Promise<{ ok: boolean; message?: string }> => {
  if (!hasDatabaseUrl) return { ok: false, message: 'DATABASE_URL not configured.' };
  try {
    await Promise.all(
      Object.entries(entries).map(([key, value]) =>
        upsertSetting(key, value),
      ),
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, message: String(error) };
  }
};

export const getAllSettings = async (): Promise<Record<string, string>> => {
  const defaults = { ...SETTING_DEFAULTS };
  if (!hasDatabaseUrl) return defaults;
  try {
    const rows = await prisma!.siteSetting.findMany();
    for (const row of rows) {
      defaults[row.key] = row.value;
    }
  } catch {
    // fall through to defaults
  }
  return defaults;
};
