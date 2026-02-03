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

// Mock Resources Data
const RESOURCES = {
  quickLinks: [
    { id: '1', title: 'Community Guidelines', icon: '📋', href: '#guidelines', description: 'Rules and best practices' },
    { id: '2', title: 'Getting Started', icon: '🚀', href: '#getting-started', description: 'New here? Start here!' },
    { id: '3', title: 'Events', icon: '📅', href: '/events', description: 'Upcoming events' },
    { id: '4', title: 'FAQs', icon: '❓', href: '#faqs', description: 'Common questions answered' },
    { id: '5', title: 'Contact Support', icon: '💬', href: '#support', description: 'Get help from our team' },
  ],
  guides: [
    { id: '1', title: 'Welcome to the Community', description: 'Learn how to make the most of your membership and connect with others.', icon: '👋', category: 'Getting Started' },
    { id: '2', title: 'How to Create Your First Post', description: 'Share your thoughts, ideas, and updates with the community.', icon: '✏️', category: 'Getting Started' },
    { id: '3', title: 'Attending Events', description: 'Discover how to find, RSVP, and participate in community events.', icon: '📅', category: 'Events' },
    { id: '4', title: 'Connecting with Members', description: 'Tips for networking and building meaningful relationships.', icon: '🤝', category: 'Networking' },
  ],
  usefulLinks: [
    { id: '1', title: 'Discord Server', url: 'https://discord.gg', icon: '💬' },
    { id: '2', title: 'Twitter / X', url: 'https://twitter.com', icon: '🐦' },
    { id: '3', title: 'Newsletter Archive', url: '#newsletter', icon: '📧' },
    { id: '4', title: 'Resource Library', url: '#library', icon: '📚' },
  ],
  faqs: [
    { id: '1', question: 'How do I update my profile?', answer: 'Go to the Account tab and you can view and manage your profile information there.' },
    { id: '2', question: 'How do I RSVP to an event?', answer: 'Navigate to the Events tab, find the event you want to attend, and tap the RSVP button.' },
    { id: '3', question: 'Can I invite friends to join?', answer: 'Yes! Share the community link with anyone you think would be a great fit.' },
    { id: '4', question: 'How do I contact an admin?', answer: 'You can reach out through the community chat or use the Contact Support link above.' },
  ],
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

const QuickLinksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  
  @media (min-width: 600px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const QuickLinkCard = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.15s ease;
  text-align: center;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.accent}15;
  }
`;

const QuickLinkIcon = styled.span`
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
`;

const QuickLinkTitle = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.25rem;
`;

const QuickLinkDesc = styled.span`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textMuted};
`;

const GuidesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const GuideCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const GuideIcon = styled.span`
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const GuideContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const GuideTitle = styled.h3`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.25rem 0;
`;

const GuideDescription = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
  line-height: 1.4;
`;

const GuideCategory = styled.span`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: ${({ theme }) => theme.accent}15;
  color: ${({ theme }) => theme.accent};
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 4px;
  margin-top: 0.5rem;
`;

const LinksRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const UsefulLink = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
  transition: all 0.15s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
  }
`;

const LinkIcon = styled.span`
  font-size: 1.1rem;
`;

const FAQList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FAQItem = styled.div<{ $expanded: boolean }>`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  overflow: hidden;
`;

const FAQQuestion = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
  }
`;

const FAQArrow = styled.span<{ $expanded: boolean }>`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  transition: transform 0.2s ease;
  transform: rotate(${props => props.$expanded ? '180deg' : '0deg'});
`;

const FAQAnswer = styled.div<{ $expanded: boolean }>`
  max-height: ${props => props.$expanded ? '200px' : '0'};
  overflow: hidden;
  transition: max-height 0.2s ease;
  
  p {
    padding: 0 1rem 1rem;
    margin: 0;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.textMuted};
    line-height: 1.5;
  }
`;

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [events, setEvents] = useState<EventPreview[]>([]);

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
            <WelcomeSubtitle>Here are some resources to help you get the most out of {communityConfig.name}</WelcomeSubtitle>
          </WelcomeSection>

          {communityConfig.features.events && (
            <Section>
              <SectionHeader>
                <SectionTitle>Upcoming Events</SectionTitle>
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
            <SectionTitle>Quick Links</SectionTitle>
            <QuickLinksGrid>
              {RESOURCES.quickLinks.map((link) => (
                <QuickLinkCard key={link.id} href={link.href}>
                  <QuickLinkIcon>{link.icon}</QuickLinkIcon>
                  <QuickLinkTitle>{link.title}</QuickLinkTitle>
                  <QuickLinkDesc>{link.description}</QuickLinkDesc>
                </QuickLinkCard>
              ))}
            </QuickLinksGrid>
          </Section>

          <Section>
            <SectionTitle>📖 Guides</SectionTitle>
            <GuidesList>
              {RESOURCES.guides.map((guide) => (
                <GuideCard key={guide.id}>
                  <GuideIcon>{guide.icon}</GuideIcon>
                  <GuideContent>
                    <GuideTitle>{guide.title}</GuideTitle>
                    <GuideDescription>{guide.description}</GuideDescription>
                    <GuideCategory>{guide.category}</GuideCategory>
                  </GuideContent>
                </GuideCard>
              ))}
            </GuidesList>
          </Section>

          <Section>
            <SectionTitle>🔗 Useful Links</SectionTitle>
            <LinksRow>
              {RESOURCES.usefulLinks.map((link) => (
                <UsefulLink key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
                  <LinkIcon>{link.icon}</LinkIcon>
                  {link.title}
                </UsefulLink>
              ))}
            </LinksRow>
          </Section>

          <Section>
            <SectionTitle>❓ Frequently Asked Questions</SectionTitle>
            <FAQList>
              {RESOURCES.faqs.map((faq) => (
                <FAQItem key={faq.id} $expanded={expandedFaq === faq.id}>
                  <FAQQuestion onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}>
                    {faq.question}
                    <FAQArrow $expanded={expandedFaq === faq.id}>▼</FAQArrow>
                  </FAQQuestion>
                  <FAQAnswer $expanded={expandedFaq === faq.id}>
                    <p>{faq.answer}</p>
                  </FAQAnswer>
                </FAQItem>
              ))}
            </FAQList>
          </Section>
        </ContentArea>
      </Main>

      <TabBarSpacer />
      <TabBar />
    </Container>
  );
};

export default DashboardPage;
