/**
 * Community Configuration
 * 
 * Customize these settings to brand your community template.
 * These values are used throughout the app for branding, features, and theming.
 */

export const communityConfig = {
  // Basic Info
  name: "Community",
  tagline: "Connect, Share, Grow",
  description: "A community for people who share common interests and goals.",
  
  // Branding
  branding: {
    logo: null as string | null, // Path to logo image, e.g., "/images/logo.png"
    favicon: "/favicon.ico",
  },
  
  // Home page copy (editable per community)
  home: {
    missionStatement: "A place to connect, share, and grow together.",
    whoIsThisFor: "Anyone who wants to participate and contribute.",
    whoIsThisNotFor: null as string | null, // Optional: "Not for X"
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
    faqUrl: null as string | null,   // Link only; not foregrounded
    guidelinesUrl: null as string | null,
  },

  // Feature Toggles
  features: {
    // Enable/disable major features
    members: true,        // Member directory and membership
    chat: true,           // Community chat
    events: true,         // Events system
    socialFeed: true,     // Social feed with posts

    // Engagement (spec: no metrics by default)
    showLikes: false,     // When true, show like button and count on posts

    // Visibility and safety (defaults favor opt-in / safety)
    memberDirectoryPublic: false,  // When false, only members see the directory
    eventsPublic: true,           // Events list visible to non-members
    attendeeVisibility: 'public' as 'public' | 'members' | 'attendees_only', // Who can see event attendee list

    // Events
    externalEventsApi: null as string | null, // URL to external events API (e.g., Meetup)
    autoEventRecap: false,        // When enabled, a system post can be created after event end (implementation deferred)

    // Chat: single channel in v1; future: 'event_based' | 'topic_based'
    chatChannels: 'single' as 'single',

    // Permissions
    allowPublicViewing: true,      // Allow non-members to view content
    requireMembershipToPost: false, // Require membership to create posts
    requireMembershipToChat: false, // Require membership to use chat
  },
  
  // Theme customization (extends the default theme)
  theme: {
    // Primary brand color
    primary: "#7B5CFF",
    primaryHover: "#8F73FF",
    
    // You can add custom colors here
    // They'll be merged with the default theme
  },
  
  // Social links
  social: {
    twitter: null as string | null,
    discord: null as string | null,
    telegram: null as string | null,
    website: null as string | null,
  },
  
  // Contact info
  contact: {
    email: null as string | null,
    supportUrl: null as string | null,
  },
  
  // Limits
  limits: {
    maxPostLength: 2000,
    maxCommentLength: 500,
    maxChatMessageLength: 500,
    maxBioLength: 300,
  },
};

// Type for the config
export type CommunityConfig = typeof communityConfig;

// Helper to check if a feature is enabled
export function isFeatureEnabled(feature: keyof typeof communityConfig.features): boolean {
  return communityConfig.features[feature] === true;
}

// Helper to get config value with fallback
export function getConfigValue<K extends keyof CommunityConfig>(
  key: K,
  fallback?: CommunityConfig[K]
): CommunityConfig[K] {
  return communityConfig[key] ?? fallback ?? communityConfig[key];
}
