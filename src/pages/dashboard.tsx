import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";
import { EventCard } from "@/components/events";
import { TabBar, TabBarSpacer } from "@/components/navigation";
import { communityConfig } from "@/config/community";

// Event type from API
interface EventPreview {
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
  creator: {
    id: string;
    username: string | null;
    displayName: string | null;
    pfpUrl: string | null;
  };
  rsvpCount: number;
  userRsvpStatus?: string | null;
}

// How to Participate: map config strings to optional links
const PARTICIPATE_LINKS: Record<string, string> = {
  'Attend events': '/events',
  'Join the chat': '/chat',
  'Join chat': '/chat',
  'Introduce yourself': '/members',
  'Contribute to the feed': '/feed',
  'Contribute': '/feed',
};

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
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  padding: 1.5rem 1rem 1rem;
  animation: ${fadeIn} 0.4s ease-out;
`;

const WelcomeSection = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}15 0%, ${({ theme }) => theme.accent}05 100%);
  border: 1px solid ${({ theme }) => theme.accent}30;
  border-radius: 16px;
`;

const WelcomeTitle = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem 0;
  
  @media (min-width: 600px) {
    font-size: 1.75rem;
  }
`;

const WelcomeSubtitle = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const SeeAllLink = styled(Link)`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const EmptyEvents = styled.div`
  padding: 1.5rem;
  text-align: center;
  color: ${({ theme }) => theme.textMuted};
  background: ${({ theme }) => theme.surface};
  border: 1px dashed ${({ theme }) => theme.border};
  border-radius: 12px;
  font-size: 0.9rem;
`;

const IdentityBlock = styled.div`
  margin-bottom: 1rem;
`;

const IdentityMission = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.text};
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
`;

const IdentityWho = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
  line-height: 1.5;
`;

const BulletList = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  list-style: disc;
`;

const BulletItem = styled.li`
  margin-bottom: 0.35rem;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
  line-height: 1.5;
`;

const BulletLink = styled(Link)`
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const MemberValueBlock = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
  line-height: 1.5;
  margin: 0;
`;

const QuickLinksRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const QuickLink = styled(Link)`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const QuickLinkExternal = styled.a`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [events, setEvents] = useState<EventPreview[]>([]);
  const home = communityConfig.home;

  // Redirect to /app if not authenticated
  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/app');
    }
  }, [isUserLoading, user, router]);

  // Fetch upcoming events for home page
  useEffect(() => {
    if (!communityConfig.features.events || !user) return;
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          setEvents((data.events || []).slice(0, 2));
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };
    fetchEvents();
  }, [user]);

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

  const displayName = user.displayName || user.username || 'there';

  return (
    <Container>
      <Head>
        <title>{communityConfig.name}</title>
        <meta name="description" content={communityConfig.description} />
        <link rel="icon" href={communityConfig.branding.favicon} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Main>
        <ContentArea>
          <WelcomeSection>
            <WelcomeTitle>Welcome, {displayName}!</WelcomeTitle>
            <WelcomeSubtitle>Here&apos;s what {communityConfig.name} is about and how you can participate.</WelcomeSubtitle>
          </WelcomeSection>

          <Section>
            <SectionTitle>Community Identity</SectionTitle>
            <IdentityBlock>
              <IdentityMission>{home.missionStatement}</IdentityMission>
              <IdentityWho>Who this is for: {home.whoIsThisFor}</IdentityWho>
              {home.whoIsThisNotFor && (
                <IdentityWho style={{ marginTop: '0.25rem' }}>Not for: {home.whoIsThisNotFor}</IdentityWho>
              )}
            </IdentityBlock>
          </Section>

          <Section>
            <SectionTitle>How to Participate</SectionTitle>
            <BulletList>
              {home.howToParticipate.map((item) => {
                const href = PARTICIPATE_LINKS[item];
                return (
                  <BulletItem key={item}>
                    {href ? <BulletLink href={href}>{item}</BulletLink> : item}
                  </BulletItem>
                );
              })}
            </BulletList>
          </Section>

          <Section>
            <SectionTitle>How to Contribute / Lead</SectionTitle>
            <BulletList>
              {home.howToContributeLead.map((item) => (
                <BulletItem key={item}>{item}</BulletItem>
              ))}
            </BulletList>
          </Section>

          <Section>
            <SectionTitle>Member Value</SectionTitle>
            <MemberValueBlock>{home.memberValue}</MemberValueBlock>
          </Section>

          {communityConfig.features.events && (
            <Section>
              <SectionHeader>
                <SectionTitle>
                  {events.length > 0 ? 'Next event' : 'Upcoming Events'}
                </SectionTitle>
                <SeeAllLink href="/events">See all →</SeeAllLink>
              </SectionHeader>
              {events.length > 0 ? (
                <EventsList>
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} compact />
                  ))}
                </EventsList>
              ) : (
                <EmptyEvents>No upcoming events. Check back soon!</EmptyEvents>
              )}
            </Section>
          )}

          <Section>
            <SectionTitle>Quick links</SectionTitle>
            <QuickLinksRow>
              <QuickLink href="/events">Events</QuickLink>
              {home.guidelinesUrl && (
                <QuickLinkExternal href={home.guidelinesUrl} target="_blank" rel="noopener noreferrer">Guidelines</QuickLinkExternal>
              )}
              {home.faqUrl && (
                <QuickLinkExternal href={home.faqUrl} target="_blank" rel="noopener noreferrer">FAQs</QuickLinkExternal>
              )}
            </QuickLinksRow>
          </Section>
        </ContentArea>
      </Main>

      <TabBarSpacer />
      <TabBar />
    </Container>
  );
};

export default DashboardPage;
