const parsePaymentHandles = (raw: string | undefined) => {
  if (!raw) {
    return {
      cashApp: 'configure-via-env',
      zelle: 'configure-via-env',
      venmo: 'configure-via-env',
      chime: 'configure-via-env',
      applePay: 'configure-via-env',
    };
  }

  const entries = raw
    .split(/[;,]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const separator = chunk.includes('=') ? '=' : ':';
      const [key, ...rest] = chunk.split(separator);
      return [key.trim().toLowerCase(), rest.join(separator).trim()] as const;
    });

  const map = new Map(entries);

  return {
    cashApp: map.get('cashapp') ?? map.get('cash_app') ?? map.get('cash-app') ?? 'configure-via-env',
    zelle: map.get('zelle') ?? 'configure-via-env',
    venmo: map.get('venmo') ?? 'configure-via-env',
    chime: map.get('chime') ?? 'configure-via-env',
    applePay: map.get('applepay') ?? map.get('apple_pay') ?? map.get('apple-pay') ?? 'configure-via-env',
  };
};

const paymentHandles = parsePaymentHandles(process.env.PAYMENT_HANDLES);

export const paymentProfiles = {
  default: {
    methods: [
      {
        name: 'Cash App',
        instructions: `Send payment to ${paymentHandles.cashApp}`,
      },
      {
        name: 'Zelle',
        instructions: `Send payment to ${paymentHandles.zelle}`,
      },
      {
        name: 'Venmo',
        instructions: `Send payment to ${paymentHandles.venmo}`,
      },
      {
        name: 'Chime',
        instructions: `Send payment to ${paymentHandles.chime}`,
      },
      {
        name: 'Apple Pay',
        instructions: `Send payment to ${paymentHandles.applePay}`,
      },
    ],
  },
} as const;

export const buildPaymentInstructionsFromProfile = (preferredMethod?: string) => {
  const methods = paymentProfiles.default.methods;
  const lines = methods.map((method, index) => `${index + 1}. ${method.name}: ${method.instructions}`);

  if (preferredMethod) {
    lines.unshift(`Preferred method selected: ${preferredMethod}`);
  }

  return lines.join('\n');
};
