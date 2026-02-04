/**
 * Tenant Context for Community Template
 * 
 * Provides tenant configuration to all components.
 * Loads config from environment or API and injects theme variables.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { 
  CommunityConfig, 
  defaultCommunityConfig, 
  setActiveConfig,
  DEFAULT_TENANT_ID,
} from '@/config/community';

interface TenantContextValue {
  tenantId: string;
  config: CommunityConfig;
  isLoading: boolean;
  error: Error | null;
  isFeatureEnabled: (feature: keyof CommunityConfig['features']) => boolean;
  getThemeColor: (key: keyof CommunityConfig['theme']) => string;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
  children: ReactNode;
  tenantId?: string;
  initialConfig?: Partial<CommunityConfig>;
}

/**
 * Provider component that loads and provides tenant configuration
 */
export function TenantProvider({ 
  children, 
  tenantId = DEFAULT_TENANT_ID,
  initialConfig,
}: TenantProviderProps) {
  const [config, setConfig] = useState<CommunityConfig>(() => {
    if (initialConfig) {
      return { ...defaultCommunityConfig, ...initialConfig };
    }
    return defaultCommunityConfig;
  });
  const [isLoading, setIsLoading] = useState(!initialConfig);
  const [error, setError] = useState<Error | null>(null);

  // Load tenant config on mount or when tenantId changes
  useEffect(() => {
    if (initialConfig) {
      // Config provided directly, no need to fetch
      setActiveConfig(initialConfig);
      return;
    }

    async function loadConfig() {
      try {
        setIsLoading(true);
        setError(null);

        // Try to load config from API
        const response = await fetch(`/api/tenant/config?tenantId=${tenantId}`);
        
        if (response.ok) {
          const data = await response.json();
          const loadedConfig = { ...defaultCommunityConfig, ...data.config };
          setConfig(loadedConfig);
          setActiveConfig(loadedConfig);
        } else if (response.status === 404) {
          // No tenant config found, use defaults
          console.log(`No tenant config for ${tenantId}, using defaults`);
          setConfig(defaultCommunityConfig);
          setActiveConfig(defaultCommunityConfig);
        } else {
          throw new Error(`Failed to load tenant config: ${response.statusText}`);
        }
      } catch (err) {
        console.error('Error loading tenant config:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        // Fall back to defaults on error
        setConfig(defaultCommunityConfig);
        setActiveConfig(defaultCommunityConfig);
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, [tenantId, initialConfig]);

  // Inject CSS variables when config changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Set theme CSS variables
      root.style.setProperty('--color-primary', config.theme.primary);
      root.style.setProperty('--color-primary-hover', config.theme.primaryHover);
      root.style.setProperty('--color-accent', config.theme.accent || config.theme.primary);
      root.style.setProperty('--color-background', config.theme.background);
      root.style.setProperty('--color-surface', config.theme.surface);
      root.style.setProperty('--color-text', config.theme.text);
      root.style.setProperty('--color-text-muted', config.theme.textMuted);
    }
  }, [config.theme]);

  const value = useMemo<TenantContextValue>(() => ({
    tenantId,
    config,
    isLoading,
    error,
    isFeatureEnabled: (feature) => config.features[feature] === true,
    getThemeColor: (key) => config.theme[key] || defaultCommunityConfig.theme[key],
  }), [tenantId, config, isLoading, error]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to access tenant context
 */
export function useTenantConfig(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantConfig must be used within a TenantProvider');
  }
  return context;
}

/**
 * Hook to access tenant config (returns defaults if not in provider)
 */
export function useTenantConfigOptional(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    return {
      tenantId: DEFAULT_TENANT_ID,
      config: defaultCommunityConfig,
      isLoading: false,
      error: null,
      isFeatureEnabled: (feature) => defaultCommunityConfig.features[feature] === true,
      getThemeColor: (key) => defaultCommunityConfig.theme[key],
    };
  }
  return context;
}

/**
 * Hook to check if a feature is enabled
 */
export function useFeature(feature: keyof CommunityConfig['features']): boolean {
  const { isFeatureEnabled } = useTenantConfigOptional();
  return isFeatureEnabled(feature);
}

/**
 * Component that only renders if feature is enabled
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback = null 
}: { 
  feature: keyof CommunityConfig['features']; 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const enabled = useFeature(feature);
  return enabled ? <>{children}</> : <>{fallback}</>;
}
