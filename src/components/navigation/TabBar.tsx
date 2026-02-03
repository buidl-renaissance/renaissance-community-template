import React from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';

// SVG Icons
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const FeedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const MembersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const AccountIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const TabBarContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: ${({ theme }) => theme.surface};
  border-top: 1px solid ${({ theme }) => theme.border};
  padding: 0.5rem 0;
  padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
`;

const TabList = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  max-width: 500px;
  margin: 0 auto;
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 60px;
  
  color: ${({ $active, theme }) => $active ? theme.accent : theme.textMuted};
  
  &:hover {
    color: ${({ $active, theme }) => $active ? theme.accent : theme.text};
  }
`;

const TabIconWrapper = styled.span<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transition: transform 0.15s ease;
  
  svg {
    width: 100%;
    height: 100%;
  }
  
  ${TabButton}:hover & {
    transform: scale(1.1);
  }
`;

const TabLabel = styled.span<{ $active: boolean }>`
  font-size: 0.65rem;
  font-weight: ${({ $active }) => $active ? 600 : 500};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

export const TabBar: React.FC = () => {
  const router = useRouter();
  const currentPath = router.pathname;
  
  const tabs: Tab[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <HomeIcon />,
      href: '/dashboard',
    },
    {
      id: 'feed',
      label: 'Feed',
      icon: <FeedIcon />,
      href: '/feed',
    },
    {
      id: 'members',
      label: 'Members',
      icon: <MembersIcon />,
      href: '/members',
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <ChatIcon />,
      href: '/chat',
    },
    {
      id: 'account',
      label: 'Account',
      icon: <AccountIcon />,
      href: '/account',
    },
  ];
  
  const handleTabClick = (tab: Tab) => {
    router.push(tab.href);
  };
  
  const isActive = (tab: Tab) => {
    if (tab.href === '/dashboard') {
      return currentPath === '/dashboard' || currentPath === '/';
    }
    return currentPath.startsWith(tab.href);
  };
  
  return (
    <TabBarContainer>
      <TabList>
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <TabButton
              key={tab.id}
              $active={active}
              onClick={() => handleTabClick(tab)}
              aria-label={tab.label}
            >
              <TabIconWrapper $active={active}>{tab.icon}</TabIconWrapper>
              <TabLabel $active={active}>{tab.label}</TabLabel>
            </TabButton>
          );
        })}
      </TabList>
    </TabBarContainer>
  );
};

// Spacer to prevent content from being hidden behind the tab bar
export const TabBarSpacer = styled.div`
  height: calc(70px + env(safe-area-inset-bottom));
`;

export default TabBar;
