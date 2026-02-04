import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";
import { MemberBadge, ChatButton, Toast } from "@/components/community";
import { communityConfig } from "@/config/community";

// Types
interface EventCreator {
  id: string;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
}

interface RsvpUser {
  id: string;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  status: string;
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

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
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

const HeaderSpacer = styled.div`
  height: 60px;
`;

const ContentArea = styled.div`
  flex: 1;
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
  padding: 0 1rem 6rem;
  animation: ${fadeIn} 0.4s ease-out;
`;

const EventImage = styled.div`
  position: relative;
  width: calc(100% + 2rem);
  margin: 0 -1rem;
  height: 250px;
  background: ${({ theme }) => theme.backgroundAlt};
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (min-width: 768px) {
    width: 100%;
    margin: 0;
    border-radius: 16px;
    margin-top: 1.5rem;
  }
`;

const DateBadge = styled.div`
  position: absolute;
  bottom: -20px;
  left: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.accent};
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  
  @media (min-width: 768px) {
    left: 1.5rem;
  }
`;

const DateMonth = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DateDay = styled.span`
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  line-height: 1;
`;

const PlaceholderImage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  color: ${({ theme }) => theme.textMuted};
`;

const EventContent = styled.div`
  padding-top: 2.5rem;
`;

const EventTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem;
`;

const EventMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
`;

const MetaIcon = styled.span`
  width: 1.25rem;
  text-align: center;
  flex-shrink: 0;
`;

const MetaContent = styled.div`
  flex: 1;
`;

const MetaLabel = styled.span`
  display: block;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.1rem;
`;

const EventDescription = styled.div`
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.7;
  margin-bottom: 2rem;
  white-space: pre-wrap;
`;

const ActionSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const RsvpButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 1rem;
  background: ${props => props.$active ? props.theme.accent : props.theme.surface};
  border: 1px solid ${props => props.$active ? props.theme.accent : props.theme.border};
  border-radius: 12px;
  color: ${props => props.$active ? 'white' : props.theme.text};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.$active ? props.theme.accentHover : props.theme.surfaceHover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ExternalLink = styled.a`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  
  &:hover {
    background: ${({ theme }) => theme.accentHover};
  }
`;

const AttendeesSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem;
`;

const AttendeesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const AttendeeChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px;
`;

const AttendeeAvatar = styled.div<{ $hasImage: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.$hasImage ? 'transparent' : props.theme.surfaceHover};
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
  font-size: 0.6rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
`;

const AttendeeName = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.text};
`;

const EmptyAttendees = styled.div`
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.9rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: ${({ theme }) => theme.textMuted};
`;

const NotFound = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${({ theme }) => theme.textMuted};
  
  h3 {
    margin: 0 0 0.5rem;
    color: ${({ theme }) => theme.text};
  }
`;

// Helper functions
function formatEventDate(date: Date): { month: string; day: number; fullDate: string } {
  const d = new Date(date);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    day: d.getDate(),
    fullDate: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

function formatTime(time: string | null): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const EventDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: isUserLoading } = useUser();
  const [event, setEvent] = useState<Event | null>(null);
  const [rsvps, setRsvps] = useState<RsvpUser[]>([]);
  const [canViewAttendees, setCanViewAttendees] = useState(true);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  // Fetch event
  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (response.ok) {
          const data = await response.json();
          setEvent(data.event);
          setRsvps((data.rsvps || []).filter((r: RsvpUser) => r.status === 'going'));
          setCanViewAttendees(data.canViewAttendees !== false);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleRsvp = async () => {
    if (!user || !event || rsvpLoading) return;

    setRsvpLoading(true);
    const isGoing = event.userRsvpStatus === 'going';
    const newStatus = isGoing ? null : 'going';

    try {
      if (newStatus) {
        const response = await fetch(`/api/events/${event.id}/rsvp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          setEvent(prev => prev ? { ...prev, userRsvpStatus: newStatus, rsvpCount: prev.rsvpCount + 1 } : null);
          setRsvps(prev => [...prev, {
            id: user.id,
            username: user.username || null,
            displayName: user.displayName || null,
            pfpUrl: user.pfpUrl || null,
            status: 'going',
          }]);
          setCanViewAttendees(true); // Now attending; can see list if attendees_only
          showToast('RSVP confirmed!');
        }
      } else {
        const response = await fetch(`/api/events/${event.id}/rsvp`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setEvent(prev => prev ? { ...prev, userRsvpStatus: null, rsvpCount: Math.max(0, prev.rsvpCount - 1) } : null);
          setRsvps(prev => prev.filter(r => r.id !== user.id));
          showToast('RSVP cancelled');
        }
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      showToast('Failed to update RSVP', 'error');
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading || isUserLoading) {
    return (
      <Container>
        <LoadingContainer>Loading...</LoadingContainer>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container>
        <Main>
          <Header>
            <HeaderLeft>
              <BackButton href="/events">←</BackButton>
              <PageTitle>Event</PageTitle>
            </HeaderLeft>
          </Header>
          <HeaderSpacer />
          <NotFound>
            <h3>Event not found</h3>
            <p>This event may have been deleted or doesn&apos;t exist.</p>
          </NotFound>
        </Main>
      </Container>
    );
  }

  const dateInfo = formatEventDate(event.eventDate);
  const isGoing = event.userRsvpStatus === 'going';

  return (
    <Container>
      <Head>
        <title>{event.title} | {communityConfig.name}</title>
        <meta name="description" content={event.description || `Event - ${communityConfig.name}`} />
        <link rel="icon" href={communityConfig.branding.favicon} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Main>
        <Header>
          <HeaderLeft>
            <BackButton href="/events">←</BackButton>
            <PageTitle>Event</PageTitle>
          </HeaderLeft>
        </Header>

        <HeaderSpacer />

        <ContentArea>
          <EventImage>
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} />
            ) : (
              <PlaceholderImage>📅</PlaceholderImage>
            )}
            <DateBadge>
              <DateMonth>{dateInfo.month}</DateMonth>
              <DateDay>{dateInfo.day}</DateDay>
            </DateBadge>
          </EventImage>

          <EventContent>
            <EventTitle>{event.title}</EventTitle>

            <EventMeta>
              <MetaItem>
                <MetaIcon>📅</MetaIcon>
                <MetaContent>
                  <MetaLabel>Date</MetaLabel>
                  {dateInfo.fullDate}
                </MetaContent>
              </MetaItem>
              
              {(event.startTime || event.endTime) && (
                <MetaItem>
                  <MetaIcon>🕐</MetaIcon>
                  <MetaContent>
                    <MetaLabel>Time</MetaLabel>
                    {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </MetaContent>
                </MetaItem>
              )}
              
              {event.location && (
                <MetaItem>
                  <MetaIcon>📍</MetaIcon>
                  <MetaContent>
                    <MetaLabel>Location</MetaLabel>
                    {event.location}
                  </MetaContent>
                </MetaItem>
              )}
            </EventMeta>

            <ActionSection>
              {event.isExternal && event.externalUrl ? (
                <ExternalLink href={event.externalUrl} target="_blank" rel="noopener noreferrer">
                  View Event →
                </ExternalLink>
              ) : user ? (
                <RsvpButton $active={isGoing} onClick={handleRsvp} disabled={rsvpLoading}>
                  {rsvpLoading ? 'Updating...' : isGoing ? '✓ Going' : 'RSVP'}
                </RsvpButton>
              ) : (
                <RsvpButton $active={false} disabled>
                  Sign in to RSVP
                </RsvpButton>
              )}
            </ActionSection>

            {event.description && (
              <EventDescription>{event.description}</EventDescription>
            )}

            <AttendeesSection>
              <SectionTitle>Attendees ({event.rsvpCount})</SectionTitle>
              {canViewAttendees ? (
                rsvps.length > 0 ? (
                  <AttendeesList>
                    {rsvps.map((attendee) => {
                      const name = attendee.displayName || attendee.username || 'Anonymous';
                      return (
                        <AttendeeChip key={attendee.id}>
                          <AttendeeAvatar $hasImage={!!attendee.pfpUrl}>
                            {attendee.pfpUrl ? (
                              <img src={attendee.pfpUrl} alt={name} />
                            ) : (
                              <AvatarFallback>{getInitials(name)}</AvatarFallback>
                            )}
                          </AttendeeAvatar>
                          <AttendeeName>{name}</AttendeeName>
                        </AttendeeChip>
                      );
                    })}
                  </AttendeesList>
                ) : (
                  <EmptyAttendees>No one has RSVP&apos;d yet. Be the first!</EmptyAttendees>
                )
              ) : (
                <EmptyAttendees>
                  {!user
                    ? "Sign in to see who's going"
                    : communityConfig.features.attendeeVisibility === 'attendees_only'
                      ? "Only attendees can see who's going"
                      : "Only members can see who's going"}
                </EmptyAttendees>
              )}
            </AttendeesSection>
          </EventContent>
        </ContentArea>
      </Main>

      {/* Floating UI */}
      {communityConfig.features.members && (
        <MemberBadge onClick={() => router.push('/members')} />
      )}

      {communityConfig.features.chat && user && (
        <ChatButton onClick={() => router.push('/chat')} />
      )}

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </Container>
  );
};

export default EventDetailPage;
