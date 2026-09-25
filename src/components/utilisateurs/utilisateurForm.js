export const PHONE_PREFIXES = ['+243', '+242', '+244', '+250', '+257', '+256', '+254', '+255', '+260', '+27', '+237', '+225', '+221', '+229', '+234', '+212', '+213', '+216', '+33', '+32', '+41', '+44', '+49', '+351', '+1', '+7', '+20', '+30', '+31', '+34', '+36', '+39', '+40', '+43', '+45', '+46', '+47', '+48', '+51', '+52', '+53', '+54', '+55', '+56', '+57', '+58', '+60', '+61', '+62', '+63', '+64', '+65', '+66', '+81', '+82', '+84', '+86', '+90', '+91', '+92', '+93', '+94', '+95', '+98'];

export const cleanLocalPhone = (value) => value.replace(/[^0-9]/g, '').slice(0, 10);

export const splitPhone = (value = '') => {
  if (!value) return { prefix: '+243', number: '' };
  const prefix = [...PHONE_PREFIXES].sort((a, b) => b.length - a.length).find((code) => value.startsWith(code));
  if (prefix) return { prefix, number: value.slice(prefix.length) };
  // Preserve unlisted international numbers; their prefix remains editable.
  if (/^\+[1-9][0-9]{6,14}$/.test(value)) return { prefix: value.slice(0, 4), number: value.slice(4) };
  return { prefix: '+243', number: value };
};

export const buildPhone = (prefix, number) => {
  if (!number) return null;
  if (!/^\+[1-9][0-9]{0,2}$/.test(prefix) || !/^[0-9]{1,10}$/.test(number)) return undefined;
  const phone = prefix + number;
  return /^\+[1-9][0-9]{6,14}$/.test(phone) ? phone : undefined;
};

export const userErrorMessage = (error, fallback) => {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg || item.message).filter(Boolean).join(', ') || fallback;
  return error.message || fallback;
};
