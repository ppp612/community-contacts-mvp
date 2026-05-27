export const LANGUAGE_OPTIONS = ["English", "Chinese", "Korean", "Vietnamese", "Other"] as const;

export const MAIN_CONCERN_OPTIONS = [
  "Parking",
  "Traffic",
  "Safety",
  "Roads",
  "Parks",
  "Cleanliness",
  "Seniors",
  "Youth",
  "Local Business",
  "Community Facilities",
  "Other"
] as const;

export const SOURCE_OPTIONS = [
  "Meet with Residents",
  "Facebook",
  "TikTok",
  "WeChat",
  "Community Event",
  "Local Business Walk",
  "Friend Referral",
  "Other"
] as const;

export const FOLLOW_UP_STATUS_OPTIONS = [
  "new",
  "contacted",
  "in_progress",
  "resolved",
  "archived"
] as const;

export const INTERACTION_TYPE_OPTIONS = [
  "call",
  "sms",
  "email",
  "in_person",
  "social_media",
  "other"
] as const;

export const CONSENT_TEXT =
  "By submitting this form, I agree to receive community updates and follow-up messages. I understand I can unsubscribe or request removal at any time.";
