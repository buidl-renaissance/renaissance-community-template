/**
 * API endpoint to load tenant configuration
 * 
 * GET /api/tenant/config?tenantId=xxx
 * Returns the tenant configuration for the specified tenant ID
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { defaultCommunityConfig, CommunityConfig } from '@/config/community';
import { DEFAULT_TENANT_ID } from '@/db/schema';

// Tenant configurations - in production, this would come from database
const tenantConfigs: Record<string, Partial<CommunityConfig>> = {
  // Default tenant uses default config
  [DEFAULT_TENANT_ID]: {},
  
  // Example: Renaissance City Detroit preset
  'renaissance-city-detroit': {
    name: 'Renaissance City',
    tagline: "Detroit's Digital Renaissance",
    description: 'A community platform for Detroit, connecting people and building the future together.',
    branding: {
      logo: '/images/renaissance-logo.png',
      favicon: '/favicon.ico',
    },
    theme: {
      primary: '#7B5CFF',
      primaryHover: '#8F73FF',
      accent: '#FFD700',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      text: '#ffffff',
      textMuted: '#888888',
    },
    home: {
      missionStatement: "Building Detroit's digital future together.",
      whoIsThisFor: 'Builders, creators, entrepreneurs, and anyone contributing to Detroit\'s renaissance.',
      whoIsThisNotFor: null,
      howToParticipate: [
        'Attend community events',
        'Join the conversation in chat',
        'Introduce yourself in the feed',
        'Connect with other members',
      ],
      howToContributeLead: [
        'Organize or host events',
        'Mentor new members',
        'Share your expertise',
        'Help shape community guidelines',
      ],
      memberValue: 'Members get direct access to Detroit\'s most active builders and early access to events.',
      faqUrl: null,
      guidelinesUrl: null,
    },
    social: {
      twitter: 'https://twitter.com/builddetroit',
      discord: null,
      telegram: null,
      instagram: null,
      website: 'https://builddetroit.xyz',
    },
    contact: {
      email: 'hello@builddetroit.xyz',
      supportUrl: null,
    },
  },
};

type ResponseData = {
  tenantId: string;
  config: Partial<CommunityConfig>;
} | {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const tenantId = (req.query.tenantId as string) || DEFAULT_TENANT_ID;

  // In production, load from database:
  // const config = await getTenantConfig(tenantId);
  
  // For now, use in-memory configs
  const config = tenantConfigs[tenantId];
  
  if (!config && tenantId !== DEFAULT_TENANT_ID) {
    // Tenant not found - return 404
    return res.status(404).json({ error: 'Tenant not found' });
  }

  return res.status(200).json({
    tenantId,
    config: config || {},
  });
}
