import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";
import { EventCard } from "@/components/events";
import { Toast } from "@/components/community";
import { TabBar, TabBarSpacer } from "@/components/navigation";
import { communityConfig } from "@/config/community";

// Types
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

const ContentArea = styled.div`
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  padding: 1.5rem 1rem 1rem;
  animation: ${fadeIn} 0.4s ease-out;
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  background: ${props => props.$active ? props.theme.accent : props.theme.surface};
  border: 1px solid ${props => props.$active ? props.theme.accent : props.theme.border};
  border-radius: 20px;
  color: ${props => props.$active ? 'white' : props.theme.text};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${({ theme }) => theme.textMuted};
  
  h3 {
    margin: 0 0 0.5rem;
    color: ${({ theme }) => theme.text};
  }
  
  p {
    margin: 0;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${({ theme }) => theme.textMuted};
`;

const EventsPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'past') {
        params.set('past', 'true');
      }
      
      const response = await fetch(`/api/events?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Redirect if not authenticated and viewing is restricted
  useEffect(() => {
    if (!isUserLoading && !user && !communityConfig.features.allowPublicViewing) {
      router.push('/app');
    }
  }, [isUserLoading, user, router]);

  const handleRsvpChange = (eventId: string, status: string | null, newCount: number) => {
    setEvents(prev =>
      prev.map(e =>
        e.id === eventId ? { ...e, userRsvpStatus: status, rsvpCount: newCount } : e
      )
    );
    showToast(status ? 'RSVP confirmed!' : 'RSVP cancelled');
  };

  if (isUserLoading) {
    return <Loading text="Loading..." />;
  }

  return (
    <Container>
      <Head>
        <title>Events | {communityConfig.name}</title>
        <meta name="description" content={`Community events - ${communityConfig.name}`} />
        <link rel="icon" href={communityConfig.branding.favicon} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Main>
        <ContentArea>
          <FilterBar>
            <FilterButton
              $active={filter === 'upcoming'}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </FilterButton>
            <FilterButton
              $active={filter === 'past'}
              onClick={() => setFilter('past')}
            >
              Past Events
            </FilterButton>
          </FilterBar>

          {loading ? (
            <LoadingContainer>Loading events...</LoadingContainer>
          ) : events.length > 0 ? (
            <EventsGrid>
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRsvpChange={handleRsvpChange}
                />
              ))}
            </EventsGrid>
          ) : (
            <EmptyState>
              <h3>No {filter} events</h3>
              <p>
                {filter === 'upcoming'
                  ? 'Check back soon for upcoming events!'
                  : 'No past events to show.'}
              </p>
            </EmptyState>
          )}
        </ContentArea>

        <TabBarSpacer />
        <TabBar />
      </Main>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </Container>
  );
};

export default EventsPage;
