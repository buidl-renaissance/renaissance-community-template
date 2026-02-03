import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import styled, { keyframes } from 'styled-components';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';
import { TabBar, TabBarSpacer } from '@/components/navigation';
import { communityConfig } from '@/config/community';

// Types
interface ChatMessage {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
    pfpUrl: string | null;
  };
}

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const Container = styled.div`
  height: 100vh;
  height: 100dvh;
  max-height: -webkit-fill-available;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
  overflow: hidden;
  overscroll-behavior: none;
`;

const Main = styled.main`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  overflow: hidden;
`;

const MessagesContainer = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
  padding: 1rem;
  padding-bottom: 80px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.75rem;
  animation: ${fadeIn} 0.4s ease-out;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.background};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 3px;
  }
`;

const MessagesInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: min-content;
`;

const MessageItem = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.875rem;
  background: ${({ theme }) => theme.surface};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.border};
`;

const MessageAvatar = styled.div<{ $hasImage: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$hasImage ? 'transparent' : props.theme.surfaceHover};
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarFallback = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
`;

const MessageContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const MessageUsername = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  font-size: 0.9rem;
`;

const MessageTime = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const MessageText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.95rem;
  line-height: 1.5;
  word-break: break-word;
`;

const ComposeForm = styled.form<{ $keyboardHeight: number }>`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.surface};
  border-top: 1px solid ${({ theme }) => theme.border};
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(70px + env(safe-area-inset-bottom) + ${props => props.$keyboardHeight}px);
  transition: bottom 0.2s ease;
  max-width: 800px;
  margin: 0 auto;
  z-index: 50;
  pointer-events: none;
  
  & > * {
    pointer-events: auto;
  }
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 24px;
  color: ${({ theme }) => theme.text};
  font-size: 16px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease;
  
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }
  
  &:focus {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const SendButton = styled.button`
  width: 42px;
  height: 42px;
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 20px;
    height: 20px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
  }
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
    transform: scale(1.05);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyMessages = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  color: ${({ theme }) => theme.textMuted};
  
  span {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
  }
  
  p {
    margin: 0;
    font-size: 1rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 4rem;
  color: ${({ theme }) => theme.textMuted};
`;

const SignInPrompt = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.surface};
  border-top: 1px solid ${({ theme }) => theme.border};
  text-align: center;
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.9rem;
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(70px + env(safe-area-inset-bottom));
  max-width: 800px;
  margin: 0 auto;
  z-index: 50;
`;

// Helper functions
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return messageDate.toLocaleDateString();
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const ChatPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const touchStartedOnInputArea = useRef(false);

  // Lock body scroll so only the messages area scrolls
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Prevent page scroll when user scrolls/touches over the input area
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (formRef.current?.contains(e.target as Node)) {
        touchStartedOnInputArea.current = true;
      }
    };

    const handleTouchEnd = () => {
      touchStartedOnInputArea.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartedOnInputArea.current) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { capture: true });
    document.addEventListener('touchend', handleTouchEnd, { capture: true });
    document.addEventListener('touchcancel', handleTouchEnd, { capture: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart, { capture: true });
      document.removeEventListener('touchend', handleTouchEnd, { capture: true });
      document.removeEventListener('touchcancel', handleTouchEnd, { capture: true });
      document.removeEventListener('touchmove', handleTouchMove, { capture: true });
    };
  }, []);

  // Handle keyboard visibility on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const keyboardH = window.innerHeight - viewport.height;
      setKeyboardHeight(Math.max(0, keyboardH));
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages on mount
  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Redirect to /app if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/app');
    }
  }, [isUserLoading, user, router]);

  // Handle sending message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !user) return;

    setSending(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setInput('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Loading state
  if (isUserLoading && !user) {
    return <Loading text="Loading..." />;
  }

  if (!isUserLoading && !user) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <Container>
      <Head>
        <title>Chat - {communityConfig.name}</title>
        <meta name="description" content={`Community chat for ${communityConfig.name}`} />
        <link rel="icon" href={communityConfig.branding.favicon} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Main>
        <MessagesContainer ref={messagesRef}>
          {loading ? (
            <LoadingContainer>Loading messages...</LoadingContainer>
          ) : messages.length === 0 ? (
            <EmptyMessages>
              <span>💬</span>
              <p>No messages yet. Be the first to say hello!</p>
            </EmptyMessages>
          ) : (
            <MessagesInner>
              {messages.map((message) => (
                <MessageItem key={message.id}>
                  <MessageAvatar $hasImage={!!message.user.pfpUrl}>
                    {message.user.pfpUrl ? (
                      <img src={message.user.pfpUrl} alt={message.user.username || 'User'} />
                    ) : (
                      <AvatarFallback>
                        {getInitials(message.user.displayName || message.user.username)}
                      </AvatarFallback>
                    )}
                  </MessageAvatar>
                  <MessageContent>
                    <MessageHeader>
                      <MessageUsername>
                        {message.user.displayName || message.user.username || 'Anonymous'}
                      </MessageUsername>
                      <MessageTime>{formatRelativeTime(message.createdAt)}</MessageTime>
                    </MessageHeader>
                    <MessageText>{message.content}</MessageText>
                  </MessageContent>
                </MessageItem>
              ))}
            </MessagesInner>
          )}
        </MessagesContainer>

        {user ? (
          <ComposeForm ref={formRef} onSubmit={handleSend} $keyboardHeight={keyboardHeight}>
            <ChatInput
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              disabled={sending}
              enterKeyHint="send"
            />
            <SendButton type="submit" disabled={!input.trim() || sending} aria-label="Send message">
              <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </SendButton>
          </ComposeForm>
        ) : (
          <SignInPrompt>Sign in to chat</SignInPrompt>
        )}
      </Main>

      <TabBarSpacer />
      <TabBar />
    </Container>
  );
};

export default ChatPage;
