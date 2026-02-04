import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";
import { Toast } from "@/components/community";
import { TabBar, TabBarSpacer } from "@/components/navigation";
import { communityConfig } from "@/config/community";

// Types
interface Member {
  id: string;
  userId: string;
  bio: string | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  role: string;
  profileVisibility: string;
  eventCount: number;
  postCount: number;
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

const SearchBar = styled.div`
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  color: ${({ theme }) => theme.text};
  font-size: 16px;
  outline: none;
  
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }
  
  &:focus {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const MembersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const MemberCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  transition: all 0.15s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const MemberAvatar = styled.div<{ $hasImage: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${props => props.$hasImage ? 'transparent' : props.theme.surfaceHover};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarFallback = styled.span`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
`;

const MemberInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MemberName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MemberUsername = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.25rem;
`;

const MemberRole = styled.span`
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: ${({ theme }) => theme.accent};
  margin-left: 0.5rem;
`;

const MemberParticipation = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.25rem;
`;

const MemberBio = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MemberSince = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.25rem;
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

const LoadMoreButton = styled.button`
  display: block;
  width: 100%;
  padding: 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.accent};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1.5rem;
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const JoinBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  background: ${({ theme }) => theme.accent}12;
  border: 1px solid ${({ theme }) => theme.accent}30;
  border-radius: 12px;
`;

const JoinBannerText = styled.div`
  flex: 1;
  min-width: 0;
  p {
    margin: 0;
    font-size: 0.95rem;
    color: ${({ theme }) => theme.text};
  }
  p + p {
    margin-top: 0.25rem;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.textMuted};
  }
`;

const JoinBannerButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${({ theme }) => theme.accent};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Helper functions
function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatMemberSince(date: Date): string {
  const d = new Date(date);
  return `Member since ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
}

function formatRole(role: string): string {
  const labels: Record<string, string> = {
    user: 'Member',
    organizer: 'Organizer',
    mentor: 'Mentor',
    admin: 'Admin',
  };
  return labels[role] ?? role;
}

const MembersPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });
  const [canView, setCanView] = useState(true);
  const [viewerIsMember, setViewerIsMember] = useState(false);
  const [joining, setJoining] = useState(false);

  const pageSize = 20;

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  // Fetch members
  const fetchMembers = useCallback(async (pageNum: number, searchQuery: string, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: pageSize.toString(),
      });
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const response = await fetch(`/api/members/list?${params.toString()}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCanView(data.canView !== false);
        setViewerIsMember(data.viewerIsMember === true);
        if (append) {
          setMembers(prev => [...prev, ...data.members]);
        } else {
          setMembers(data.members);
        }
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMembers(1, search);
  }, [fetchMembers, search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchMembers(1, search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, fetchMembers]);

  // Redirect if not authenticated and viewing is restricted
  useEffect(() => {
    if (!isUserLoading && !user && !communityConfig.features.allowPublicViewing) {
      router.push('/app');
    }
  }, [isUserLoading, user, router]);

  const handleLoadMore = () => {
    if (loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMembers(nextPage, search, true);
  };

  const hasMore = members.length < total;

  if (isUserLoading) {
    return <Loading text="Loading..." />;
  }

  return (
    <Container>
      <Head>
        <title>Members | {communityConfig.name}</title>
        <meta name="description" content={`Community members - ${communityConfig.name}`} />
        <link rel="icon" href={communityConfig.branding.favicon} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Main>
        <ContentArea>
          {user && !viewerIsMember && (
            <JoinBanner>
              <JoinBannerText>
                <p>You&apos;re not a member yet</p>
                <p>Join the community to get the full experience and appear in the directory.</p>
              </JoinBannerText>
              <JoinBannerButton
                type="button"
                disabled={joining}
                onClick={async () => {
                  setJoining(true);
                  try {
                    const res = await fetch('/api/members', { method: 'POST', credentials: 'include' });
                    const data = await res.json();
                    if (res.ok) {
                      showToast(data.alreadyMember ? 'You are already a member!' : 'Welcome! You are now a member.');
                      setViewerIsMember(true);
                      fetchMembers(1, search);
                    } else {
                      showToast(data.error || 'Failed to join.', 'error');
                    }
                  } catch {
                    showToast('Failed to join.', 'error');
                  } finally {
                    setJoining(false);
                  }
                }}
              >
                {joining ? 'Joining…' : 'Join community'}
              </JoinBannerButton>
            </JoinBanner>
          )}
          <SearchBar>
            <SearchInput
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchBar>

          {loading ? (
            <LoadingContainer>Loading members...</LoadingContainer>
          ) : !canView ? (
            <EmptyState>
              <h3>Member directory</h3>
              <p>Join the community to see the member directory.</p>
              {user && (
                <form
                  method="post"
                  action="/api/members"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch('/api/members', { method: 'POST' });
                      const data = await res.json();
                      if (res.ok) {
                        showToast(data.alreadyMember ? 'You are already a member!' : 'Welcome! You are now a member.');
                        setCanView(true);
                        fetchMembers(1, search);
                      }
                    } catch {
                      showToast('Failed to join.', 'error');
                    }
                  }}
                  style={{ marginTop: '1rem' }}
                >
                  <button
                    type="submit"
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'var(--accent)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Join community
                  </button>
                </form>
              )}
            </EmptyState>
          ) : members.length > 0 ? (
            <>
              <MembersGrid>
                {members.map((member) => {
                  const displayName = member.displayName || member.username || 'Anonymous';
                  return (
                    <MemberCard key={member.id}>
                      <MemberAvatar $hasImage={!!member.pfpUrl}>
                        {member.pfpUrl ? (
                          <img src={member.pfpUrl} alt={displayName} />
                        ) : (
                          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                        )}
                      </MemberAvatar>
                      <MemberInfo>
                        <MemberName>
                          {displayName}
                          <MemberRole>{formatRole(member.role)}</MemberRole>
                        </MemberName>
                        {member.username && member.displayName && (
                          <MemberUsername>@{member.username}</MemberUsername>
                        )}
                        <MemberParticipation>
                          {member.eventCount} events attended · {member.postCount} posts
                        </MemberParticipation>
                        {member.bio && <MemberBio>{member.bio}</MemberBio>}
                        <MemberSince>{formatMemberSince(member.createdAt)}</MemberSince>
                      </MemberInfo>
                    </MemberCard>
                  );
                })}
              </MembersGrid>

              {hasMore && (
                <LoadMoreButton onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : 'Load More'}
                </LoadMoreButton>
              )}
            </>
          ) : (
            <EmptyState>
              <h3>{search ? 'No members found' : 'No members yet'}</h3>
              <p>
                {search
                  ? 'Try a different search term.'
                  : 'Be the first to join the community!'}
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

export default MembersPage;
