const LS_KEY = 'config_doctor_premium_token';

export function getPremiumToken() {
  return localStorage.getItem(LS_KEY) || '';
}

export function isPremiumUnlocked() {
  return Boolean(getPremiumToken());
}

export function setPremiumToken(token) {
  if (!token) return;
  localStorage.setItem(LS_KEY, token);
}

export function clearPremium() {
  localStorage.removeItem(LS_KEY);
}
