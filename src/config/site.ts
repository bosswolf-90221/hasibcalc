// Central configuration. Everything environment-specific comes from PUBLIC_* variables (see .env.example).
const env = import.meta.env;

export const SITE = {
  name: 'حاسِب',
  tagline: 'الحساب الواضح، من أول رقم',
  url: (env.PUBLIC_SITE_URL || 'https://www.example.com').replace(/\/$/, ''),
  urlIsPlaceholder: !env.PUBLIC_SITE_URL,
  locale: 'ar_AE',
  contactEmail: env.PUBLIC_CONTACT_EMAIL || 'contact@hasibcalc.com',
  contactFormEndpoint: env.PUBLIC_CONTACT_FORM_ENDPOINT || '',
  /** Date the formulas were last checked against the cited sources. Update when you re-check. */
  lastReviewed: '2026-10-17',
};

export const ADS = {
  // Real ads only when explicitly enabled AND a real publisher id is set AND this is a production build.
  enabled: env.PUBLIC_ADS_ENABLED === 'true' && /^ca-pub-\d{10,20}$/.test(env.PUBLIC_ADSENSE_CLIENT_ID || '') && env.PROD,
  client: env.PUBLIC_ADSENSE_CLIENT_ID || '',
  slots: {
    afterCalculator: env.PUBLIC_ADSENSE_SLOT_AFTER_CALC || '',
  },
};

export const ANALYTICS = {
  /** GA4 tracking is not wired in yet; flip only after adding the tag and a consent flow. */
  integrated: false,
  gaId: env.PUBLIC_GA4_ID || '',
  searchConsoleToken: env.PUBLIC_GSC_VERIFICATION || '',
};
