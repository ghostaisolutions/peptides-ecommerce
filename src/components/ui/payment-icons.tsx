/** Inline SVG brand mark components for payment methods. */

export const PayPalIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PayPal">
    <rect width="36" height="36" rx="8" fill="#003087" />
    <path d="M23.5 11C23.5 11 24.5 11 24.5 13C24.5 16 22 17.5 19.5 17.5H18L17 22H14.5L16.5 11H23.5Z" fill="#009CDE" />
    <path d="M12.5 14H19.5C22 14 24.5 15.5 24.5 18.5C24.5 21.5 22 23 19.5 23H18L17 27H13.5L15.5 14H12.5Z" fill="#FFFFFF" opacity="0.85" />
    <path d="M15.5 14H19.5C22 14 23.5 15.5 23.5 18C23.5 20.5 21.5 22.5 19 22.5H17.5L16.5 27H13.5L15.5 14Z" fill="#FFFFFF" />
  </svg>
);

export const VenmoIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Venmo">
    <rect width="36" height="36" rx="8" fill="#3D95CE" />
    <path d="M26 10C26.5 10.9 26.7 11.9 26.7 13.1C26.7 17 23.5 22 21 25H15.5L13 11.3L18.5 10.8L19.8 21C21.1 18.8 22.7 15.5 22.7 13.2C22.7 11.8 22.4 10.8 22 10H26Z" fill="white" />
  </svg>
);

export const CashAppIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Cash App">
    <rect width="36" height="36" rx="8" fill="#00C244" />
    <path d="M20.3 14.2C19.7 13.9 19.1 13.7 18.5 13.7C17.5 13.7 17 14.1 17 14.7C17 15.4 17.8 15.7 18.7 16C20.2 16.5 22 17.2 22 19.3C22 21.1 20.7 22.3 18.7 22.5V24H16.8V22.5C15.6 22.3 14.5 21.7 13.8 20.9L15.1 19.7C15.7 20.3 16.5 20.7 17.3 20.7C18.4 20.7 19 20.2 19 19.5C19 18.7 18.1 18.4 17.2 18.1C15.7 17.6 14 16.9 14 14.8C14 13.1 15.2 11.9 16.9 11.7V10H18.8V11.7C19.8 11.9 20.7 12.4 21.4 13.1L20.3 14.2Z" fill="white" />
  </svg>
);

export const ChimeIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Chime">
    <rect width="36" height="36" rx="8" fill="#00CC65" />
    <path d="M18 9C13 9 9 13 9 18C9 23 13 27 18 27C21.5 27 24.5 25 26 22H22.5C21.4 23.2 19.8 24 18 24C14.7 24 12 21.3 12 18C12 14.7 14.7 12 18 12C19.8 12 21.4 12.8 22.5 14H26C24.5 11 21.5 9 18 9Z" fill="white" />
  </svg>
);

export const ZelleIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Zelle">
    <rect width="36" height="36" rx="8" fill="#6D1ED4" />
    <path d="M11 12H24L17 19.5H24V24H11L18 16.5H11V12Z" fill="white" />
  </svg>
);

export const ApplePayIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Apple Pay">
    <rect width="36" height="36" rx="8" fill="#000000" />
    <path d="M14.5 12.3C14.1 12.8 13.5 13.2 12.9 13.1C12.8 12.5 13.1 11.9 13.5 11.4C13.9 10.9 14.6 10.5 15.1 10.5C15.2 11.1 15 11.8 14.5 12.3Z" fill="white" />
    <path d="M15.1 13.2C14.2 13.1 13.4 13.7 13 13.7C12.5 13.7 11.8 13.2 11.1 13.2C10.1 13.3 9.1 13.8 8.6 14.7C7.6 16.5 8.3 19.2 9.3 20.7C9.8 21.4 10.4 22.2 11.2 22.2C12 22.2 12.3 21.7 13.2 21.7C14.1 21.7 14.4 22.2 15.2 22.1C16 22.1 16.6 21.4 17.1 20.7C17.6 20 17.8 19.3 17.8 19.3C17.8 19.3 16.3 18.7 16.3 17C16.3 15.5 17.5 14.7 17.5 14.7C16.8 13.7 15.7 13.2 15.1 13.2Z" fill="white" />
    <text x="19" y="20.5" fontFamily="system-ui, -apple-system, sans-serif" fontSize="6.5" fontWeight="600" fill="white">Pay</text>
  </svg>
);
