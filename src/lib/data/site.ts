import type { Category, FaqItem, LegalContent, PaymentMethod, Product } from '@/lib/types';
import { productImageMap } from '@/lib/config/images';
import { siteConfig } from '@/lib/config/site-config';

export const brand = {
  name: siteConfig.brandName,
  email: siteConfig.supportEmail,
  infoEmail: siteConfig.infoEmail,
  address: siteConfig.supportAddress,
};

export const categories: Category[] = [
  {
    id: 'cat-glp',
    name: 'GLP Products',
    slug: 'glp-products',
    description: 'Flagship research compounds curated for advanced laboratory workflows.',
    isFuture: false,
  },
  {
    id: 'cat-anti-aging',
    name: 'Anti-Aging',
    slug: 'anti-aging',
    description: 'Compounds targeting cellular aging pathways and metabolic optimization.',
    isFuture: false,
  },
  {
    id: 'cat-skin-support',
    name: 'Skin Support',
    slug: 'skin-support',
    description: 'Future category for dermal and tissue support research.',
    isFuture: true,
  },
  {
    id: 'cat-recovery',
    name: 'Recovery',
    slug: 'recovery',
    description: 'Research compounds focused on tissue repair, healing response, and cellular resilience.',
    isFuture: false,
  },
  {
    id: 'cat-muscle-support',
    name: 'Muscle Support',
    slug: 'muscle-support',
    description: 'Future category for muscle performance and retention research.',
    isFuture: true,
  },
  {
    id: 'cat-accessories',
    name: 'Accessories & Supplies',
    slug: 'accessories',
    description: 'Laboratory accessories and handling essentials.',
    isFuture: false,
  },
];

export const complimentaryKitItems = [
  '1 x 3mL bacteriostatic water',
  '1 x 3mL luer lock syringe',
  '1 x 22G needle',
  '10 x alcohol prep pads',
  '6 x insulin syringes',
  '1 x silicone vial cap',
  '1 x 5mL 91% alcohol antiseptic spray',
];

export const products: Product[] = [
  {
    id: 'p-glp-001',
    name: 'PAV-Sem (Semaglutide)',
    slug: 'pav-sem',
    category: 'glp-products',
    subtitle: 'Semaglutide with selectable strengths.',
    shortDescription: 'Single product card with selectable Semaglutide strength and price.',
    longDescription: 'PAV-Sem groups Semaglutide strengths into one product with variant-based pricing and stock.',
    price: 25,
    images: { primary: productImageMap['reta-5']?.primary ?? '/images/products/reta-5.png' },
    stockQuantity: 109,
    sku: 'GLP-PAV-SEM',
    includesComplimentaryKit: true,
    attributes: [
      { label: 'Compound', value: 'Semaglutide' },
      { label: 'Use', value: 'Laboratory research only' },
    ],
    variants: [
      { id: 'v-pav-sem-2mg', productId: 'p-glp-001', name: '2mg', sku: 'GLP-SEM-002', price: 25, stock: 42, active: true, isDefault: true, sortOrder: 0 },
      { id: 'v-pav-sem-5mg', productId: 'p-glp-001', name: '5mg', sku: 'GLP-SEM-005', price: 30, stock: 38, active: true, sortOrder: 1 },
      { id: 'v-pav-sem-10mg', productId: 'p-glp-001', name: '10mg', sku: 'GLP-SEM-010', price: 40, stock: 29, active: true, sortOrder: 2 },
    ],
    isActive: true,
    isFeatured: true,
  },
  {
    id: 'p-glp-002',
    name: 'PAV-Ret (Retatrutide)',
    slug: 'pav-ret',
    category: 'glp-products',
    subtitle: 'Retatrutide with selectable strengths.',
    shortDescription: 'Single product card with selectable Retatrutide strength and price.',
    longDescription: 'PAV-Ret groups Retatrutide strengths into one product with variant-based pricing and stock.',
    price: 40,
    images: { primary: productImageMap['reta-10']?.primary ?? '/images/products/reta-10.png' },
    stockQuantity: 73,
    sku: 'GLP-PAV-RET',
    includesComplimentaryKit: true,
    attributes: [
      { label: 'Compound', value: 'Retatrutide' },
      { label: 'Use', value: 'Laboratory research only' },
    ],
    variants: [
      { id: 'v-pav-ret-5mg', productId: 'p-glp-002', name: '5mg', sku: 'GLP-RET-005', price: 40, stock: 33, active: true, isDefault: true, sortOrder: 0 },
      { id: 'v-pav-ret-10mg', productId: 'p-glp-002', name: '10mg', sku: 'GLP-RET-010', price: 55, stock: 24, active: true, sortOrder: 1 },
      { id: 'v-pav-ret-20mg', productId: 'p-glp-002', name: '20mg', sku: 'GLP-RET-020', price: 70, stock: 16, active: true, sortOrder: 2 },
    ],
    isActive: true,
    isFeatured: true,
  },
  {
    id: 'p-glp-003',
    name: 'PAV-Tir (Tirzepatide)',
    slug: 'pav-tir',
    category: 'glp-products',
    subtitle: 'Tirzepatide with selectable strengths.',
    shortDescription: 'Single product card with selectable Tirzepatide strength and price.',
    longDescription: 'PAV-Tir groups Tirzepatide strengths into one product with variant-based pricing and stock.',
    price: 39.99,
    images: { primary: productImageMap['tirz-10']?.primary ?? '/images/products/tirz-10.png' },
    stockQuantity: 36,
    sku: 'GLP-PAV-TIR',
    includesComplimentaryKit: true,
    attributes: [
      { label: 'Compound', value: 'Tirzepatide' },
      { label: 'Use', value: 'Laboratory research only' },
    ],
    variants: [
      { id: 'v-pav-tir-10mg', productId: 'p-glp-003', name: '10mg', sku: 'GLP-TIR-010', price: 39.99, stock: 22, active: true, isDefault: true, sortOrder: 0 },
      { id: 'v-pav-tir-20mg', productId: 'p-glp-003', name: '20mg', sku: 'GLP-TIR-020', price: 60, stock: 14, active: true, sortOrder: 1 },
    ],
    isActive: true,
    isFeatured: false,
  },
  {
    id: 'p-rec-001',
    name: 'Cagri',
    slug: 'cagri-5mg',
    category: 'recovery',
    subtitle: 'Cagri with selectable strength.',
    shortDescription: 'Current Cagri offering.',
    longDescription: 'Cagri is represented as one product with one managed strength option.',
    price: 50,
    images: { primary: productImageMap['bpc-157-5']?.primary ?? '/images/products/bpc-157-5.png' },
    stockQuantity: 20,
    sku: 'REC-CAGRI-PARENT',
    includesComplimentaryKit: true,
    attributes: [
      { label: 'Compound', value: 'Cagrilintide' },
      { label: 'Use', value: 'Laboratory research only' },
    ],
    variants: [
      { id: 'v-cagri-5mg', productId: 'p-rec-001', name: '5mg', sku: 'REC-CAGRI-005', price: 50, stock: 20, active: true, isDefault: true, sortOrder: 0 },
    ],
    isActive: true,
    isFeatured: false,
  },
  {
    id: 'p-anti-001',
    name: 'Semax',
    slug: 'semax-5mg',
    category: 'anti-aging',
    subtitle: 'Semax with selectable strength.',
    shortDescription: 'Current Semax offering.',
    longDescription: 'Semax is represented as one product with one managed strength option.',
    price: 35,
    images: { primary: productImageMap['aod-5']?.primary ?? '/images/products/aod-5.png' },
    stockQuantity: 18,
    sku: 'ANTI-SEMAX-PARENT',
    includesComplimentaryKit: true,
    attributes: [
      { label: 'Compound', value: 'Semax' },
      { label: 'Use', value: 'Laboratory research only' },
    ],
    variants: [
      { id: 'v-semax-5mg', productId: 'p-anti-001', name: '5mg', sku: 'ANTI-SEMAX-005', price: 35, stock: 18, active: true, isDefault: true, sortOrder: 0 },
    ],
    isActive: true,
    isFeatured: false,
  },
  {
    id: 'p-anti-002',
    name: 'Selank',
    slug: 'selank-5mg',
    category: 'anti-aging',
    subtitle: 'Selank with selectable strength.',
    shortDescription: 'Current Selank offering.',
    longDescription: 'Selank is represented as one product with one managed strength option.',
    price: 35,
    images: { primary: productImageMap['aod-5']?.primary ?? '/images/products/aod-5.png' },
    stockQuantity: 18,
    sku: 'ANTI-SELANK-PARENT',
    includesComplimentaryKit: true,
    attributes: [
      { label: 'Compound', value: 'Selank' },
      { label: 'Use', value: 'Laboratory research only' },
    ],
    variants: [
      { id: 'v-selank-5mg', productId: 'p-anti-002', name: '5mg', sku: 'ANTI-SELANK-005', price: 35, stock: 18, active: true, isDefault: true, sortOrder: 0 },
    ],
    isActive: true,
    isFeatured: false,
  },
  {
    id: 'p-anti-003',
    name: '5AM',
    slug: '5am',
    category: 'anti-aging',
    subtitle: '5AM standard offering.',
    shortDescription: 'Current 5AM offering.',
    longDescription: '5AM is represented as one product with one managed option.',
    price: 45,
    images: { primary: productImageMap['5-amino']?.primary ?? '/images/products/5-amino.png' },
    stockQuantity: 27,
    sku: 'ANTI-5AM-PARENT',
    includesComplimentaryKit: true,
    attributes: [
      { label: 'Compound', value: '5AM' },
      { label: 'Use', value: 'Laboratory research only' },
    ],
    variants: [
      { id: 'v-5am-standard', productId: 'p-anti-003', name: 'Standard', sku: 'ANTI-5AM-STD', price: 45, stock: 27, active: true, isDefault: true, sortOrder: 0 },
    ],
    isActive: true,
    isFeatured: false,
  },
  {
    id: 'p-anti-004',
    name: 'MotsC',
    slug: 'motsc',
    category: 'anti-aging',
    subtitle: 'MotsC standard offering.',
    shortDescription: 'Current MotsC offering.',
    longDescription: 'MotsC is represented as one product with one managed option.',
    price: 65,
    images: { primary: productImageMap['bpc-157-10']?.primary ?? '/images/products/bpc-157-10.png' },
    stockQuantity: 12,
    sku: 'ANTI-MOTSC-PARENT',
    includesComplimentaryKit: true,
    attributes: [
      { label: 'Compound', value: 'MotsC' },
      { label: 'Use', value: 'Laboratory research only' },
    ],
    variants: [
      { id: 'v-motsc-standard', productId: 'p-anti-004', name: 'Standard', sku: 'ANTI-MOTSC-STD', price: 65, stock: 12, active: true, isDefault: true, sortOrder: 0 },
    ],
    isActive: true,
    isFeatured: false,
  },
  {
    id: 'p-acc-001',
    name: 'Bacteriostatic Water 10mL',
    slug: 'bacteriostatic-water-10ml',
    category: 'accessories',
    subtitle: 'Sterile accessory supply.',
    shortDescription: 'Current Bacteriostatic Water offering.',
    longDescription: 'Bacteriostatic Water is represented as one product with one managed size option.',
    price: 6,
    images: { primary: productImageMap['bacteriostatic-water-10ml']?.primary ?? '/images/accessories/bac-water-10ml.png' },
    stockQuantity: 120,
    sku: 'ACC-BW-010-PARENT',
    includesComplimentaryKit: false,
    attributes: [
      { label: 'Volume', value: '10mL' },
      { label: 'Category', value: 'Accessory' },
    ],
    variants: [
      { id: 'v-bw-10ml', productId: 'p-acc-001', name: '10mL', sku: 'ACC-BW-010', price: 6, stock: 120, active: true, isDefault: true, sortOrder: 0 },
    ],
    isActive: true,
    isFeatured: false,
  },
];

export const faqs: FaqItem[] = [
  {
    question: 'Are your products for medical or personal treatment use?',
    answer:
      'No. All products are offered for laboratory and research-use purposes only. They are not represented as medical treatment products.',
  },
  {
    question: 'What does the complimentary kit include?',
    answer:
      'Each qualifying peptide purchase includes a premium complimentary research kit with preparation and handling accessories.',
  },
  {
    question: 'Can I purchase accessories separately?',
    answer:
      'Yes. Accessories are available as standalone products in the Accessories & Supplies section.',
  },
  {
    question: 'How does payment work during MVP checkout?',
    answer:
      'Orders are submitted as requests. The selected payment method determines whether you receive manual instructions, invoice details, or future processor options.',
  },
  {
    question: 'Do you provide dosing guidance?',
    answer:
      'No. We do not provide treatment, dosing, or individualized clinical guidance. Calculator tools are strictly mathematical and informational.',
  },
];

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'venmo',
    label: 'Venmo',
    description: 'Receive Venmo payment instructions after order review.',
    enabled: true,
    mode: 'manual',
  },
  {
    id: 'cash-app',
    label: 'Cash App',
    description: 'Receive Cash App payment instructions after order review.',
    enabled: true,
    mode: 'manual',
  },
  {
    id: 'chime',
    label: 'Chime',
    description: 'Receive Chime transfer instructions after order review.',
    enabled: true,
    mode: 'manual',
  },
  {
    id: 'zelle',
    label: 'Zelle',
    description: 'Receive Zelle payment instructions after order review.',
    enabled: true,
    mode: 'manual',
  },
  {
    id: 'apple-pay',
    label: 'Apple Pay',
    description: 'Receive Apple Pay-compatible instructions after order review.',
    enabled: true,
    mode: 'manual',
  },
];

export const legal: Record<string, LegalContent> = {
  research: {
    title: 'Research Disclaimer',
    intro:
      'All products presented on this website are supplied for laboratory research and analytical purposes only.',
    sections: [
      {
        heading: 'No Medical Claims',
        body: 'No statements on this site should be interpreted as medical claims, treatment recommendations, or clinical guidance.',
      },
      {
        heading: 'User Responsibility',
        body: 'By purchasing, you confirm you understand applicable laws and proper laboratory handling requirements in your jurisdiction.',
      },
      {
        heading: 'Age Requirement',
        body: 'Access and purchases are restricted to individuals 21 years of age or older.',
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    intro: 'These terms govern use of the site and all submitted order requests.',
    sections: [
      {
        heading: 'Order Requests',
        body: 'Checkout submissions are order requests and may be reviewed before payment instructions are issued.',
      },
      {
        heading: 'Account Accuracy',
        body: 'You are responsible for accurate contact, shipping, and legal acknowledgement information.',
      },
      {
        heading: 'Risk & Liability',
        body: 'You agree to follow safe laboratory practices and acknowledge all research-use limitations.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'We collect only the information required to process account registrations and order requests.',
    sections: [
      {
        heading: 'Data We Collect',
        body: 'Contact details, shipping/billing information, and acknowledgement records submitted through site forms.',
      },
      {
        heading: 'How We Use Data',
        body: 'To communicate order status, deliver payment instructions, and maintain required legal records.',
      },
      {
        heading: 'Data Retention',
        body: 'Records are retained according to operational and legal business requirements.',
      },
    ],
  },
};
