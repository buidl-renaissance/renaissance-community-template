import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import styled, { keyframes } from "styled-components";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";
import { TabBar, TabBarSpacer } from "@/components/navigation";
import { communityConfig } from "@/config/community";
// @ts-ignore - qrcode.react types
import { QRCodeSVG } from "qrcode.react";

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem 1rem 1rem;
`;

const PageTitle = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem 0;
  animation: ${fadeInUp} 0.4s ease-out both;

  @media (min-width: 600px) {
    font-size: 1.75rem;
  }
`;

const PageSubtitle = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0 0 2rem 0;
  animation: ${fadeInUp} 0.4s ease-out both;
  animation-delay: 0.05s;
`;

const Section = styled.section<{ $delay?: number }>`
  width: 100%;
  margin-bottom: 2rem;
  animation: ${fadeInUp} 0.4s ease-out both;
  animation-delay: ${({ $delay }) => $delay || 0.1}s;
`;

const SectionTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  overflow: hidden;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const Avatar = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${({ theme }) => theme.accent};
`;

const AvatarPlaceholder = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${({ theme }) => theme.surfaceHover};
  border: 3px solid ${({ theme }) => theme.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.text};
  font-size: 1.5rem;
  font-weight: 600;
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Username = styled.span`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const DisplayName = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
`;

const RoleBadge = styled.span<{ $role: string }>`
  display: inline-block;
  padding: 0.25rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 100px;
  margin-top: 0.25rem;
  background: ${({ $role, theme }) =>
    $role === 'admin' ? theme.danger + '20' :
    $role === 'organizer' ? theme.warning + '20' :
    theme.accent + '20'};
  color: ${({ $role, theme }) =>
    $role === 'admin' ? theme.danger :
    $role === 'organizer' ? theme.warning :
    theme.accent};
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
`;

const InfoValue = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  text-align: right;
  word-break: break-all;
  max-width: 60%;
`;

const InfoValueMuted = styled(InfoValue)`
  color: ${({ theme }) => theme.textMuted};
  font-style: italic;
`;

const AddressValue = styled(InfoValue)`
  font-family: monospace;
  font-size: 0.8rem;
  max-width: 50%;
`;

const ActionButton = styled.button<{ $variant?: 'danger' | 'primary' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  
  background: ${({ $variant, theme }) =>
    $variant === 'danger' ? theme.danger + '15' :
    $variant === 'primary' ? theme.accent :
    theme.surface};
  color: ${({ $variant, theme }) =>
    $variant === 'danger' ? theme.danger :
    $variant === 'primary' ? '#fff' :
    theme.text};
  border: 1px solid ${({ $variant, theme }) =>
    $variant === 'danger' ? theme.danger + '30' :
    $variant === 'primary' ? theme.accent :
    theme.border};

  &:hover {
    background: ${({ $variant, theme }) =>
      $variant === 'danger' ? theme.danger + '25' :
      $variant === 'primary' ? theme.accentHover :
      theme.surfaceHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Divider = styled.hr`
  width: 100%;
  border: none;
  border-top: 1px solid ${({ theme }) => theme.border};
  margin: 1.5rem 0;
`;

// Admin Components
const AdminCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  overflow: hidden;
`;

const AdminLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  text-decoration: none;
  transition: background 0.15s ease;
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
  }
`;

const AdminLinkIcon = styled.span`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.accent}15;
  border-radius: 10px;
  flex-shrink: 0;
  
  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.accent};
  }
`;

const AdminLinkContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const AdminLinkTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  font-size: 0.95rem;
`;

const AdminLinkDescription = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.125rem;
`;

const AdminLinkArrow = styled.span`
  color: ${({ theme }) => theme.textMuted};
  font-size: 1.1rem;
`;

// Login UI Components
const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  width: 100%;
  text-align: center;
  padding: 2rem 1rem;
`;

const LoginCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  animation: ${fadeInUp} 0.4s ease-out both;
`;

const LoginTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem 0;
`;

const LoginSubtitle = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

const QRCodeContainer = styled.div`
  background: white;
  padding: 1.25rem;
  border-radius: 12px;
  display: inline-block;
  margin-bottom: 1.25rem;
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid ${({ theme }) => theme.border};
  border-top-color: ${({ theme }) => theme.accent};
  border-radius: 50%;
  animation: ${rotate} 0.8s linear infinite;
  margin: 0 auto 1rem;
`;

const StatusText = styled.p<{ $type?: 'success' | 'error' | 'info' }>`
  font-size: 0.85rem;
  color: ${({ $type, theme }) =>
    $type === 'success' ? theme.success :
    $type === 'error' ? theme.danger :
    theme.textMuted};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const PulsingDot = styled.span`
  width: 8px;
  height: 8px;
  background: ${({ theme }) => theme.accent};
  border-radius: 50%;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const TimerText = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const RefreshButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.accent};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: background 0.2s;
  margin-top: 0.5rem;

  &:hover {
    background: ${({ theme }) => theme.accent}15;
  }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.85rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.border};
  }
`;

const MobileAppButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s;
  background: ${({ theme }) => theme.accent};
  color: #fff;
  border: 1px solid ${({ theme }) => theme.accent};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.accentHover};
    border-color: ${({ theme }) => theme.accentHover};
  }
`;

const DesktopOnlySection = styled.div`
  @media (max-width: 767px) {
    display: none;
  }
`;

const MobileSection = styled.div`
  display: none;

  @media (max-width: 767px) {
    display: block;
  }
`;

const AlternativeLoginLink = styled(Link)`
  display: block;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

// Deep link for Renaissance app
const APP_DEEP_LINK = 'renaissance://';
const APP_AUTH_DEEP_LINK = 'renaissance://authenticate';

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, signOut, refreshUser } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Login state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Create a new auth session for QR code
  const createSession = useCallback(async () => {
    setIsCreatingSession(true);
    setLoginError(null);
    
    try {
      const response = await fetch('/api/auth/session', { method: 'POST' });
      const data = await response.json();
      
      if (data.success && data.token) {
        setSessionToken(data.token);
        setSessionExpiresAt(data.expiresAt);
        console.log('🔑 Created auth session:', data.token.slice(0, 8) + '...');
      } else {
        setLoginError('Failed to create login session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setLoginError('Failed to create login session');
    } finally {
      setIsCreatingSession(false);
    }
  }, []);

  // Create session when component mounts (if not logged in)
  useEffect(() => {
    if (!isLoading && !user && !sessionToken && !isCreatingSession) {
      createSession();
    }
  }, [isLoading, user, sessionToken, isCreatingSession, createSession]);

  // Poll for session authentication
  useEffect(() => {
    if (!sessionToken || user) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/auth/session?token=${sessionToken}`);
        const data = await response.json();

        if (data.authenticated) {
          console.log('✅ Session authenticated!');
          // Refresh user data
          await refreshUser();
          // Clear session state
          setSessionToken(null);
          setSessionExpiresAt(null);
        } else if (data.expired) {
          // Session expired, create a new one
          setSessionToken(null);
          setSessionExpiresAt(null);
          createSession();
        }
      } catch (error) {
        console.error('Error polling session:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [sessionToken, user, refreshUser, createSession]);

  // Update time remaining
  useEffect(() => {
    if (!sessionExpiresAt) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining === 0 && sessionToken) {
        // Session expired
        setSessionToken(null);
        setSessionExpiresAt(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sessionExpiresAt, sessionToken]);

  // Generate QR code URL
  const getQRCodeUrl = () => {
    if (!sessionToken) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/api/auth/qr-authenticate?token=${sessionToken}`;
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle opening the mobile app
  const handleOpenApp = () => {
    if (sessionToken) {
      window.location.href = `${APP_AUTH_DEEP_LINK}?token=${sessionToken}&callback=${encodeURIComponent(window.location.origin)}`;
    } else {
      window.location.href = APP_DEEP_LINK;
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  const formatAddress = (address: string | null | undefined) => {
    if (!address) return null;
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  // Loading state
  if (isLoading) {
    return <Loading text="Loading..." />;
  }

  // Show login UI if not logged in
  if (!user) {
    return (
      <Container>
        <Head>
          <title>Sign In | {communityConfig.name}</title>
          <meta name="description" content={`Sign in to ${communityConfig.name}`} />
          <link rel="icon" href={communityConfig.branding.favicon} />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>

        <Main>
          <LoginContainer>
            <LoginCard>
              <LoginTitle>Sign In</LoginTitle>
              
              {/* Desktop: Show QR Code */}
              <DesktopOnlySection>
                <LoginSubtitle>
                  Scan this QR code with the Renaissance app to sign in
                </LoginSubtitle>
                
                {isCreatingSession ? (
                  <>
                    <LoadingSpinner />
                    <StatusText>Creating session...</StatusText>
                  </>
                ) : loginError ? (
                  <>
                    <StatusText $type="error">{loginError}</StatusText>
                    <RefreshButton onClick={createSession}>
                      Try Again
                    </RefreshButton>
                  </>
                ) : sessionToken ? (
                  <>
                    <QRCodeContainer>
                      <QRCodeSVG
                        value={getQRCodeUrl()}
                        size={200}
                        level="M"
                        includeMargin={false}
                      />
                    </QRCodeContainer>
                    <StatusText>
                      <PulsingDot />
                      Waiting for authentication...
                    </StatusText>
                    {timeRemaining > 0 && (
                      <TimerText>
                        Expires in {formatTime(timeRemaining)}
                      </TimerText>
                    )}
                    {timeRemaining === 0 && (
                      <RefreshButton onClick={createSession}>
                        Refresh QR Code
                      </RefreshButton>
                    )}
                  </>
                ) : null}
              </DesktopOnlySection>

              {/* Mobile: Show button to open app */}
              <MobileSection>
                <LoginSubtitle>
                  Open the Renaissance app to sign in to your account
                </LoginSubtitle>
                
                <MobileAppButton onClick={handleOpenApp}>
                  📱 Open Renaissance App
                </MobileAppButton>

                <OrDivider>or</OrDivider>

                {isCreatingSession ? (
                  <>
                    <LoadingSpinner />
                    <StatusText>Creating session...</StatusText>
                  </>
                ) : sessionToken ? (
                  <>
                    <StatusText $type="info" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      Show this QR code to another device
                    </StatusText>
                    <QRCodeContainer>
                      <QRCodeSVG
                        value={getQRCodeUrl()}
                        size={160}
                        level="M"
                        includeMargin={false}
                      />
                    </QRCodeContainer>
                    <StatusText>
                      <PulsingDot />
                      Waiting...
                    </StatusText>
                  </>
                ) : null}
              </MobileSection>

              <AlternativeLoginLink href="/login">
                Sign in with phone number →
              </AlternativeLoginLink>
            </LoginCard>
          </LoginContainer>
        </Main>
      </Container>
    );
  }

  // Show account page if logged in
  const displayName = user.displayName || user.username || 'User';
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const isRenaissanceUser = !!user.renaissanceId;

  return (
    <Container>
      <Head>
        <title>Account | {communityConfig.name}</title>
        <meta name="description" content="Manage your account settings" />
        <link rel="icon" href={communityConfig.branding.favicon} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Main>
        <PageTitle>Account</PageTitle>
        <PageSubtitle>Manage your account settings</PageSubtitle>

        <Section $delay={0.1}>
          <SectionTitle>Profile</SectionTitle>
          <Card>
            <ProfileHeader>
              {user.pfpUrl && !imageError ? (
                <Avatar
                  src={user.pfpUrl}
                  alt={displayName}
                  onError={() => setImageError(true)}
                />
              ) : (
                <AvatarPlaceholder>
                  {initials || '?'}
                </AvatarPlaceholder>
              )}
              <ProfileInfo>
                <Username>@{user.username || 'anonymous'}</Username>
                {user.displayName && user.displayName !== user.username && (
                  <DisplayName>{user.displayName}</DisplayName>
                )}
                <RoleBadge $role={user.role || 'user'}>
                  {user.role || 'user'}
                </RoleBadge>
              </ProfileInfo>
            </ProfileHeader>
            <InfoList>
              <InfoRow>
                <InfoLabel>Email</InfoLabel>
                {user.email ? (
                  <InfoValue>{user.email}</InfoValue>
                ) : (
                  <InfoValueMuted>Not set</InfoValueMuted>
                )}
              </InfoRow>
              <InfoRow>
                <InfoLabel>Phone</InfoLabel>
                {user.phone ? (
                  <InfoValue>{user.phone}</InfoValue>
                ) : (
                  <InfoValueMuted>Not set</InfoValueMuted>
                )}
              </InfoRow>
              <InfoRow>
                <InfoLabel>Wallet</InfoLabel>
                {user.accountAddress ? (
                  <AddressValue title={user.accountAddress}>
                    {formatAddress(user.accountAddress)}
                  </AddressValue>
                ) : (
                  <InfoValueMuted>Not connected</InfoValueMuted>
                )}
              </InfoRow>
              {user.createdAt && (
                <InfoRow>
                  <InfoLabel>Member since</InfoLabel>
                  <InfoValue>{formatDate(user.createdAt)}</InfoValue>
                </InfoRow>
              )}
            </InfoList>
          </Card>
        </Section>

        {user.role === 'admin' && (
          <>
            <Divider />

            <Section $delay={0.15}>
              <SectionTitle>Admin</SectionTitle>
              <AdminCard>
                <AdminLink href="/admin/broadcasts">
                  <AdminLinkIcon>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </AdminLinkIcon>
                  <AdminLinkContent>
                    <AdminLinkTitle>Email Broadcasts</AdminLinkTitle>
                    <AdminLinkDescription>Send messages to all members</AdminLinkDescription>
                  </AdminLinkContent>
                  <AdminLinkArrow>→</AdminLinkArrow>
                </AdminLink>
              </AdminCard>
            </Section>
          </>
        )}

        <Divider />

        <Section $delay={0.2}>
          <SectionTitle>Session</SectionTitle>
          {!isRenaissanceUser && (
            <ActionButton
              $variant="danger"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </ActionButton>
          )}
          {isRenaissanceUser && (
            <Card>
              <InfoRow>
                <InfoLabel>Signed in via</InfoLabel>
                <InfoValue>Renaissance App</InfoValue>
              </InfoRow>
            </Card>
          )}
        </Section>
      </Main>

      {/* Tab Bar Navigation */}
      <TabBarSpacer />
      <TabBar />
    </Container>
  );
}
