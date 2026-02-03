import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useUser } from '@/contexts/UserContext';

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

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Tab bar height (matches TabBarSpacer)
const TAB_BAR_HEIGHT = '70px';

// Animations
const slideUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideDown = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
`;

// Styled Components
const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: calc(${TAB_BAR_HEIGHT} + env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, 0.3);
  z-index: 99;
  opacity: ${props => props.$isOpen ? 1 : 0};
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
  transition: opacity 0.25s ease;
`;

const Panel = styled.div<{ $isOpen: boolean; $keyboardHeight: number }>`
  position: fixed;
  left: 0.75rem;
  right: 0.75rem;
  bottom: calc(${TAB_BAR_HEIGHT} + env(safe-area-inset-bottom) + 0.75rem + ${props => props.$keyboardHeight}px);
  max-height: min(500px, 60vh);
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  z-index: 99;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.2);
  animation: ${props => props.$isOpen ? slideUp : slideDown} 0.25s ease forwards;
  transition: bottom 0.2s ease;
  
  @media (min-width: 600px) {
    left: auto;
    right: 1rem;
    width: 380px;
    max-height: 500px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: ${({ theme }) => theme.background};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  flex-shrink: 0;
  
  h3 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.text};
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.textMuted};
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 6px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
  }
  
  &:hover {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.surfaceHover};
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  
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

const MessageItem = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.surface};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border};
`;

const MessageAvatar = styled.div<{ $hasImage: boolean }>`
  width: 36px;
  height: 36px;
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
  font-size: 0.8rem;
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
  font-size: 0.9rem;
  line-height: 1.5;
  word-break: break-word;
`;

const ComposeForm = styled.form`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.background};
  border-top: 1px solid ${({ theme }) => theme.border};
  flex-shrink: 0;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 0.625rem 0.875rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px;
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
  width: 36px;
  height: 36px;
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
    width: 18px;
    height: 18px;
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
  padding: 3rem 1rem;
  color: ${({ theme }) => theme.textMuted};
  
  p {
    margin: 0;
    font-size: 0.95rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 2rem;
  color: ${({ theme }) => theme.textMuted};
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

// Component
export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard visibility on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use visualViewport API for better keyboard detection
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      // Calculate keyboard height from viewport difference
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

  // Fetch messages when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [isOpen, messages]);

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

  if (!isOpen) return null;

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={onClose} />
      <Panel $isOpen={isOpen} $keyboardHeight={keyboardHeight}>
        <Header>
          <h3>Chat</h3>
          <CloseButton onClick={onClose} aria-label="Close chat">
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </CloseButton>
        </Header>

        <MessagesContainer ref={messagesRef}>
          {loading ? (
            <LoadingContainer>Loading messages...</LoadingContainer>
          ) : messages.length === 0 ? (
            <EmptyMessages>
              <p>No messages yet. Be the first to say hello!</p>
            </EmptyMessages>
          ) : (
            messages.map((message) => (
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
            ))
          )}
        </MessagesContainer>

        {user ? (
          <ComposeForm onSubmit={handleSend}>
            <ChatInput
              ref={inputRef}
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
          <ComposeForm as="div">
            <ChatInput as="div" style={{ color: 'var(--text-muted)', cursor: 'default' }}>
              Sign in to chat
            </ChatInput>
          </ComposeForm>
        )}
      </Panel>
    </>
  );
};

export default ChatPanel;
