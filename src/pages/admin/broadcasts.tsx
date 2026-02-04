import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";
import { Toast } from "@/components/community";
import { communityConfig } from "@/config/community";

// Types
interface Broadcast {
  id: string;
  subject: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt: Date | null;
  createdAt: Date;
}

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
`;

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.text};
  text-decoration: none;
  
  svg {
    width: 20px;
    height: 20px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
  }
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
  }
`;

const PageTitle = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const AdminBadge = styled.span`
  background: ${({ theme }) => theme.danger}20;
  color: ${({ theme }) => theme.danger};
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
`;

const HeaderSpacer = styled.div`
  height: 60px;
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
  animation: ${fadeIn} 0.4s ease-out;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  font-family: inherit;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.text};
  transition: border-color 0.2s;
  
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  font-family: inherit;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.text};
  resize: vertical;
  transition: border-color 0.2s;
  
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const HelpText = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0.5rem 0 0 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 0.875rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  
  background: ${({ $variant, theme }) =>
    $variant === 'primary' ? theme.accent : theme.surface};
  color: ${({ $variant, theme }) =>
    $variant === 'primary' ? '#fff' : theme.text};
  border: 1px solid ${({ $variant, theme }) =>
    $variant === 'primary' ? theme.accent : theme.border};
  
  &:hover:not(:disabled) {
    background: ${({ $variant, theme }) =>
      $variant === 'primary' ? theme.accentHover : theme.surfaceHover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BroadcastList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const BroadcastItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

const BroadcastInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const BroadcastSubject = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BroadcastMeta = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
  
  background: ${({ $status, theme }) =>
    $status === 'sent' ? theme.success + '20' :
    $status === 'sending' ? theme.warning + '20' :
    $status === 'failed' ? theme.danger + '20' :
    theme.textMuted + '20'};
  color: ${({ $status, theme }) =>
    $status === 'sent' ? theme.success :
    $status === 'sending' ? theme.warning :
    $status === 'failed' ? theme.danger :
    theme.textMuted};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: ${({ theme }) => theme.textMuted};
`;

const AccessDenied = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  text-align: center;
  padding: 2rem;
  
  h2 {
    color: ${({ theme }) => theme.text};
    margin: 0 0 0.5rem 0;
  }
  
  p {
    color: ${({ theme }) => theme.textMuted};
    margin: 0 0 1.5rem 0;
  }
`;

const PreviewCard = styled.div`
  background: #fff;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
  color: #333;
  
  h3 {
    margin: 0 0 1rem 0;
    color: #111;
  }
`;

// Helper functions
function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function BroadcastsPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);
  }, []);

  // Fetch broadcasts
  const fetchBroadcasts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/broadcasts');
      if (response.ok) {
        const data = await response.json();
        setBroadcasts(data.broadcasts);
      }
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchBroadcasts();
    } else {
      setLoading(false);
    }
  }, [user, fetchBroadcasts]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/admin/broadcasts');
    }
  }, [isUserLoading, user, router]);

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      showToast('Please fill in subject and content', 'error');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content, sendNow: true }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Broadcast sent! ${data.sent}/${data.total} emails delivered.`);
        setSubject('');
        setContent('');
        fetchBroadcasts();
      } else {
        showToast(data.error || 'Failed to send broadcast', 'error');
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      showToast('Failed to send broadcast', 'error');
    } finally {
      setSending(false);
    }
  };

  if (isUserLoading) {
    return <Loading text="Loading..." />;
  }

  if (!user) {
    return null;
  }

  // Check if user is admin
  if (user.role !== 'admin') {
    return (
      <Container>
        <Head>
          <title>Access Denied | {communityConfig.name}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <Header>
          <HeaderLeft>
            <BackButton href="/dashboard">
              <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </BackButton>
            <PageTitle>Broadcasts</PageTitle>
          </HeaderLeft>
        </Header>
        <HeaderSpacer />
        <Main>
          <AccessDenied>
            <h2>Access Denied</h2>
            <p>You need admin privileges to access this page.</p>
            <Button as={Link} href="/dashboard">
              Return to Dashboard
            </Button>
          </AccessDenied>
        </Main>
      </Container>
    );
  }

  return (
    <Container>
      <Head>
        <title>Broadcasts | {communityConfig.name}</title>
        <meta name="description" content="Send email broadcasts to community members" />
        <link rel="icon" href={communityConfig.branding.favicon} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Header>
        <HeaderLeft>
          <BackButton href="/dashboard">
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </BackButton>
          <PageTitle>Broadcasts</PageTitle>
          <AdminBadge>Admin</AdminBadge>
        </HeaderLeft>
      </Header>

      <HeaderSpacer />

      <Main>
        <Section>
          <SectionTitle>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Compose Broadcast
          </SectionTitle>
          <Card>
            <FormGroup>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                type="text"
                placeholder="Enter email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="content">Message Content</Label>
              <Textarea
                id="content"
                placeholder="Write your message here... HTML is supported."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <HelpText>
                You can use basic HTML tags like &lt;b&gt;, &lt;i&gt;, &lt;a href=&quot;...&quot;&gt;, &lt;p&gt;, &lt;br&gt;
              </HelpText>
            </FormGroup>

            {showPreview && content && (
              <PreviewCard>
                <h3>Preview</h3>
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </PreviewCard>
            )}

            <ButtonGroup>
              <Button
                $variant="secondary"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!content}
              >
                {showPreview ? 'Hide Preview' : 'Preview'}
              </Button>
              <Button
                $variant="primary"
                onClick={handleSend}
                disabled={sending || !subject.trim() || !content.trim()}
              >
                {sending ? 'Sending...' : 'Send Broadcast'}
              </Button>
            </ButtonGroup>
          </Card>
        </Section>

        <Section>
          <SectionTitle>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Recent Broadcasts
          </SectionTitle>

          {loading ? (
            <EmptyState>Loading broadcasts...</EmptyState>
          ) : broadcasts.length > 0 ? (
            <BroadcastList>
              {broadcasts.map((broadcast) => (
                <BroadcastItem key={broadcast.id}>
                  <BroadcastInfo>
                    <BroadcastSubject>{broadcast.subject}</BroadcastSubject>
                    <BroadcastMeta>
                      <StatusBadge $status={broadcast.status}>
                        {broadcast.status}
                      </StatusBadge>
                      <span>
                        {broadcast.sentCount}/{broadcast.recipientCount} delivered
                      </span>
                      {broadcast.sentAt && (
                        <span>{formatDate(broadcast.sentAt)}</span>
                      )}
                    </BroadcastMeta>
                  </BroadcastInfo>
                </BroadcastItem>
              ))}
            </BroadcastList>
          ) : (
            <EmptyState>
              No broadcasts sent yet. Create your first one above!
            </EmptyState>
          )}
        </Section>
      </Main>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </Container>
  );
}
