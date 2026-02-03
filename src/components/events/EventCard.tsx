import React, { useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';

interface EventCreator {
  id: string;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  imageUrl: string | null;
  eventDate: Date;
  startTime: string | null;
  endTime: string | null;
  isExternal: boolean;
  externalUrl: string | null;
  creator: EventCreator;
  rsvpCount: number;
  userRsvpStatus?: string | null;
}

interface EventCardProps {
  event: Event;
  compact?: boolean;
  onRsvpChange?: (eventId: string, status: string | null, newCount: number) => void;
}

// Styled Components
const Card = styled.div<{ $compact?: boolean }>`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${props => props.$compact ? '8px' : '12px'};
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const CardImage = styled.div<{ $compact?: boolean }>`
  position: relative;
  height: ${props => props.$compact ? '72px' : '160px'};
  background: ${({ theme }) => theme.backgroundAlt};
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DateBadge = styled.div<{ $compact?: boolean }>`
  position: absolute;
  top: ${props => props.$compact ? '0.4rem' : '1rem'};
  left: ${props => props.$compact ? '0.4rem' : '1rem'};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${props => props.$compact ? '0.25rem 0.4rem' : '0.5rem 0.75rem'};
  background: ${({ theme }) => theme.accent};
  border-radius: ${props => props.$compact ? '4px' : '8px'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const DateMonth = styled.span<{ $compact?: boolean }>`
  font-size: ${props => props.$compact ? '0.5rem' : '0.65rem'};
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DateDay = styled.span<{ $compact?: boolean }>`
  font-size: ${props => props.$compact ? '0.95rem' : '1.5rem'};
  font-weight: 700;
  color: white;
  line-height: 1;
`;

const ExternalBadge = styled.span<{ $compact?: boolean }>`
  position: absolute;
  top: ${props => props.$compact ? '0.4rem' : '1rem'};
  right: ${props => props.$compact ? '0.4rem' : '1rem'};
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: ${props => props.$compact ? '0.6rem' : '0.7rem'};
  border-radius: 4px;
`;

const CardContent = styled.div<{ $compact?: boolean }>`
  padding: ${props => props.$compact ? '0.5rem 0.75rem' : '1rem'};
`;

const EventTitle = styled(Link)<{ $compact?: boolean }>`
  display: block;
  font-family: 'Space Grotesk', sans-serif;
  font-size: ${props => props.$compact ? '0.9rem' : '1.1rem'};
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: ${props => props.$compact ? '0.25rem' : '0.5rem'};
  text-decoration: none;
  line-height: 1.3;
  
  &:hover {
    color: ${({ theme }) => theme.accent};
  }
`;

const EventMeta = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.$compact ? '0.15rem' : '0.35rem'};
  margin-bottom: ${props => props.$compact ? '0' : '1rem'};
`;

const MetaItem = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${props => props.$compact ? '0.75rem' : '0.85rem'};
  color: ${({ theme }) => theme.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MetaIcon = styled.span`
  width: 1rem;
  text-align: center;
  flex-shrink: 0;
`;

const EventDescription = styled.p<{ $compact?: boolean }>`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  
  ${props => props.$compact && `
    display: none;
  `}
`;

const CardFooter = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.$compact ? '0.4rem 0.75rem' : '0.75rem 1rem'};
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const RsvpCount = styled.span<{ $compact?: boolean }>`
  font-size: ${props => props.$compact ? '0.75rem' : '0.85rem'};
  color: ${({ theme }) => theme.textMuted};
`;

const RsvpButton = styled.button<{ $active: boolean; $compact?: boolean }>`
  padding: ${props => props.$compact ? '0.3rem 0.6rem' : '0.5rem 1rem'};
  background: ${props => props.$active ? props.theme.accent : 'transparent'};
  border: 1px solid ${props => props.$active ? props.theme.accent : props.theme.border};
  border-radius: 6px;
  color: ${props => props.$active ? 'white' : props.theme.text};
  font-size: ${props => props.$compact ? '0.75rem' : '0.85rem'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.$active ? props.theme.accentHover : props.theme.surfaceHover};
    border-color: ${props => props.$active ? props.theme.accentHover : props.theme.textMuted};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ExternalLink = styled.a<{ $compact?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: ${props => props.$compact ? '0.3rem 0.6rem' : '0.5rem 1rem'};
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: 6px;
  color: white;
  font-size: ${props => props.$compact ? '0.75rem' : '0.85rem'};
  font-weight: 500;
  text-decoration: none;
  
  &:hover {
    background: ${({ theme }) => theme.accentHover};
  }
`;

const PlaceholderImage = styled.div<{ $compact?: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.$compact ? '1.5rem' : '3rem'};
  color: ${({ theme }) => theme.textMuted};
`;

// Helper functions
function formatEventDate(date: Date): { month: string; day: number } {
  const d = new Date(date);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    day: d.getDate(),
  };
}

function formatTime(time: string | null): string {
  if (!time) return '';
  // Assume time is in HH:MM format
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Component
export const EventCard: React.FC<EventCardProps> = ({ event, compact, onRsvpChange }) => {
  const { user } = useUser();
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(event.userRsvpStatus || null);
  const [rsvpCount, setRsvpCount] = useState(event.rsvpCount);
  const [loading, setLoading] = useState(false);

  const isGoing = rsvpStatus === 'going';
  const dateInfo = formatEventDate(event.eventDate);

  const handleRsvp = async () => {
    if (!user || loading) return;

    setLoading(true);
    const newStatus = isGoing ? null : 'going';

    try {
      if (newStatus) {
        const response = await fetch(`/api/events/${event.id}/rsvp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          setRsvpStatus(newStatus);
          setRsvpCount(prev => prev + 1);
          onRsvpChange?.(event.id, newStatus, rsvpCount + 1);
        }
      } else {
        const response = await fetch(`/api/events/${event.id}/rsvp`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setRsvpStatus(null);
          setRsvpCount(prev => Math.max(0, prev - 1));
          onRsvpChange?.(event.id, null, Math.max(0, rsvpCount - 1));
        }
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card $compact={compact}>
      <CardImage $compact={compact}>
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} />
        ) : (
          <PlaceholderImage $compact={compact}>📅</PlaceholderImage>
        )}
        <DateBadge $compact={compact}>
          <DateMonth $compact={compact}>{dateInfo.month}</DateMonth>
          <DateDay $compact={compact}>{dateInfo.day}</DateDay>
        </DateBadge>
        {event.isExternal && <ExternalBadge $compact={compact}>External</ExternalBadge>}
      </CardImage>

      <CardContent $compact={compact}>
        <EventTitle href={`/events/${event.id}`} $compact={compact}>{event.title}</EventTitle>
        
        <EventMeta $compact={compact}>
          {(event.startTime || event.endTime) && (
            <MetaItem $compact={compact}>
              <MetaIcon>🕐</MetaIcon>
              {formatTime(event.startTime)}
              {event.endTime && ` - ${formatTime(event.endTime)}`}
            </MetaItem>
          )}
          {event.location && (
            <MetaItem $compact={compact}>
              <MetaIcon>📍</MetaIcon>
              {event.location}
            </MetaItem>
          )}
        </EventMeta>

        {event.description && !compact && (
          <EventDescription>{event.description}</EventDescription>
        )}
      </CardContent>

      <CardFooter $compact={compact}>
        <RsvpCount $compact={compact}>{rsvpCount} going</RsvpCount>
        
        {event.isExternal && event.externalUrl ? (
          <ExternalLink href={event.externalUrl} target="_blank" rel="noopener noreferrer" $compact={compact}>
            View Event →
          </ExternalLink>
        ) : user ? (
          <RsvpButton $active={isGoing} $compact={compact} onClick={handleRsvp} disabled={loading}>
            {loading ? '...' : isGoing ? '✓ Going' : 'RSVP'}
          </RsvpButton>
        ) : (
          <RsvpButton $active={false} $compact={compact} disabled>
            Sign in to RSVP
          </RsvpButton>
        )}
      </CardFooter>
    </Card>
  );
};

export default EventCard;
