let cachedBenefits = null;

export function getCachedBenefits() {
  return cachedBenefits;
}

export function setCachedBenefits(value) {
  cachedBenefits = value;
}

export function clearCachedBenefits() {
  cachedBenefits = null;
}
