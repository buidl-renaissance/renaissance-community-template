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

// Helper functions
function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatMemberSince(date: Date): string {
  const d = new Date(date);
  return `Member since ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
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
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });

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

      const response = await fetch(`/api/members/list?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
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
                        <MemberName>{displayName}</MemberName>
                        {member.username && member.displayName && (
                          <MemberUsername>@{member.username}</MemberUsername>
                        )}
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
