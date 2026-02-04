/**
 * Community Configuration
 * 
 * This file provides the configuration for the community template.
 * In a multi-tenant setup, this config is loaded from the tenant configuration.
 * 
 * For standalone use, edit the defaultConfig below.
 * For multi-tenant use, the config is loaded via TenantProvider.
 */

// Default tenant ID - used when no tenant is specified
export const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'default';

/**
 * Default community configuration
 * This is used when no tenant-specific config is provided
 */
export const defaultCommunityConfig = {
  // Basic Info
  name: process.env.NEXT_PUBLIC_COMMUNITY_NAME || "Community",
  tagline: process.env.NEXT_PUBLIC_COMMUNITY_TAGLINE || "Connect, Share, Grow",
  description: "A community for people who share common interests and goals.",
  
  // Branding
  branding: {
    logo: null as string | null,
    favicon: "/favicon.ico",
  },
  
  // Home page copy
  home: {
    missionStatement: "A place to connect, share, and grow together.",
    whoIsThisFor: "Anyone who wants to participate and contribute.",
    whoIsThisNotFor: null as string | null,
    howToParticipate: [
      "Attend events",
      "Join the chat",
      "Introduce yourself",
      "Contribute to the feed",
    ],
    howToContributeLead: [
      "Volunteer",
      "Organize events",
      "Mentor others",
      "Help shape the community",
    ],
    memberValue: "Members get access to events, direct connection with others, and a say in how the community grows.",
    faqUrl: null as string | null,
    guidelinesUrl: null as string | null,
  },

  // Feature Toggles
  features: {
    members: true,
    chat: true,
    events: true,
    socialFeed: true,
    showLikes: false,
    showComments: true,
    memberDirectoryPublic: true,
    eventsPublic: true,
    attendeeVisibility: 'public' as 'public' | 'members' | 'attendees_only',
    externalEventsApi: null as string | null,
    autoEventRecap: false,
    chatChannels: 'single' as 'single' | 'event_based' | 'topic_based',
    allowPublicViewing: true,
    requireMembershipToPost: false,
    requireMembershipToChat: false,
    requireMembershipToRsvp: false,
  },
  
  // Theme customization
  theme: {
    primary: "#7B5CFF",
    primaryHover: "#8F73FF",
    accent: "#7B5CFF",
    background: "#0a0a0a",
    surface: "#1a1a1a",
    text: "#ffffff",
    textMuted: "#888888",
  },
  
  // Social links
  social: {
    twitter: null as string | null,
    discord: null as string | null,
    telegram: null as string | null,
    instagram: null as string | null,
    website: null as string | null,
  },
  
  // Contact info
  contact: {
    email: null as string | null,
    supportUrl: null as string | null,
  },
  
  // API configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    externalEventsApi: null as string | null,
  },
  
  // Limits
  limits: {
    maxPostLength: 2000,
    maxCommentLength: 500,
    maxChatMessageLength: 500,
    maxBioLength: 300,
  },
};

// Current active config (can be overridden by tenant config)
let activeConfig = { ...defaultCommunityConfig };

/**
 * Set the active community configuration
 * Called by TenantProvider when loading tenant-specific config
 */
export function setActiveConfig(config: Partial<CommunityConfig>): void {
  activeConfig = {
    ...defaultCommunityConfig,
    ...config,
    branding: { ...defaultCommunityConfig.branding, ...config.branding },
    home: { ...defaultCommunityConfig.home, ...config.home },
    features: { ...defaultCommunityConfig.features, ...config.features },
    theme: { ...defaultCommunityConfig.theme, ...config.theme },
    social: { ...defaultCommunityConfig.social, ...config.social },
    contact: { ...defaultCommunityConfig.contact, ...config.contact },
    api: { ...defaultCommunityConfig.api, ...config.api },
    limits: { ...defaultCommunityConfig.limits, ...config.limits },
  };
}

/**
 * Get the current community configuration
 */
export function getCommunityConfig(): CommunityConfig {
  return activeConfig;
}

/**
 * Reset to default config
 */
export function resetConfig(): void {
  activeConfig = { ...defaultCommunityConfig };
}

// Export as communityConfig for backward compatibility
export const communityConfig = activeConfig;

// Type for the config
export type CommunityConfig = typeof defaultCommunityConfig;

// Helper to check if a feature is enabled
export function isFeatureEnabled(feature: keyof typeof defaultCommunityConfig.features): boolean {
  return getCommunityConfig().features[feature] === true;
}

// Helper to get config value with fallback
export function getConfigValue<K extends keyof CommunityConfig>(
  key: K,
  fallback?: CommunityConfig[K]
): CommunityConfig[K] {
  const config = getCommunityConfig();
  return config[key] ?? fallback ?? defaultCommunityConfig[key];
}

// Helper to get theme value
export function getThemeValue(key: keyof CommunityConfig['theme']): string {
  return getCommunityConfig().theme[key] || defaultCommunityConfig.theme[key];
}

// Helper to get branding value
export function getBrandingValue<K extends keyof CommunityConfig['branding']>(
  key: K
): CommunityConfig['branding'][K] {
  return getCommunityConfig().branding[key];
}
