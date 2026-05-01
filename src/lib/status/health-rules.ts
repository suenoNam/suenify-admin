export type HealthRuleKey = "nas" | "jellyfin" | "main-domain" | "api";

export type HealthRule = {
  key: HealthRuleKey;
  title: string;
  description: string;
  expectedPatterns: string[];
  timeoutMs: number;
  successStatusRange: [number, number];
};

export const HEALTH_RULES: Record<HealthRuleKey, HealthRule> = {
  nas: {
    key: "nas",
    title: "NAS Health Rule",
    description: "Checks local NAS route accessibility and basic response.",
    expectedPatterns: ["192.168.", "http://", "https://"],
    timeoutMs: 4000,
    successStatusRange: [200, 399],
  },
  jellyfin: {
    key: "jellyfin",
    title: "Jellyfin Health Rule",
    description: "Checks Jellyfin route and reverse proxy path validity.",
    expectedPatterns: ["/jellyfin", "http://", "https://"],
    timeoutMs: 5000,
    successStatusRange: [200, 399],
  },
  "main-domain": {
    key: "main-domain",
    title: "Main Domain Health Rule",
    description: "Checks primary external domain accessibility.",
    expectedPatterns: ["http://", "https://"],
    timeoutMs: 4500,
    successStatusRange: [200, 399],
  },
  api: {
    key: "api",
    title: "API Health Rule",
    description: "Checks backend/API endpoint response availability.",
    expectedPatterns: ["http://", "https://", "/api"],
    timeoutMs: 5000,
    successStatusRange: [200, 499],
  },
};

export function validateUrlByRule(
  ruleKey: HealthRuleKey,
  url: string
): { valid: boolean; reason?: string } {
  const rule = HEALTH_RULES[ruleKey];
  const normalizedUrl = url.trim();

  if (!normalizedUrl) {
    return { valid: false, reason: "URL is empty." };
  }

  const hasExpectedPattern = rule.expectedPatterns.some((pattern) =>
    normalizedUrl.includes(pattern)
  );

  if (!hasExpectedPattern) {
    return {
      valid: false,
      reason: `URL does not match expected ${rule.key} rule pattern.`,
    };
  }

  return { valid: true };
}