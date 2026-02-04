import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";
import { PostCard, CreatePostModal } from "@/components/feed";
import { Toast } from "@/components/community";
import { TabBar, TabBarSpacer } from "@/components/navigation";
import { communityConfig } from "@/config/community";

// Types
interface PostUser {
  id: string;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
}

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  type?: string;
  eventId?: string | null;
  createdAt: Date;
  user: PostUser;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
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
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  padding: 1.5rem 1rem 1rem;
  animation: ${fadeIn} 0.4s ease-out;
`;

const FloatingPostBubble = styled.button`
  position: fixed;
  right: 1.25rem;
  bottom: calc(70px + env(safe-area-inset-bottom) + 0.75rem);
  z-index: 50;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${({ theme }) => theme.accent};
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  svg {
    width: 24px;
    height: 24px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

const PostsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  margin-top: 1rem;
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingMore = styled.div`
  text-align: center;
  padding: 1rem;
  color: ${({ theme }) => theme.textMuted};
`;

// Helper
function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const FeedPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async (offset = 0) => {
    try {
      const response = await fetch(`/api/posts?limit=20&offset=${offset}`);
      if (response.ok) {
        const data = await response.json();
        if (offset === 0) {
          setPosts(data.posts);
        } else {
          setPosts(prev => [...prev, ...data.posts]);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (user || !communityConfig.features.requireMembershipToPost) {
      fetchPosts();
    }
  }, [user, fetchPosts]);

  // Redirect if not authenticated and viewing is restricted
  useEffect(() => {
    if (!isUserLoading && !user && !communityConfig.features.allowPublicViewing) {
      router.push('/app');
    }
  }, [isUserLoading, user, router]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchPosts(posts.length);
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    showToast('Post created!');
  };

  const handleLikeToggle = (postId: string, liked: boolean, newCount: number) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, isLiked: liked, likeCount: newCount } : p
      )
    );
  };

  const handleCommentAdded = (postId: string, newCount: number) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, commentCount: newCount } : p
      )
    );
  };

  if (isUserLoading) {
    return <Loading text="Loading..." />;
  }

  return (
    <Container>
      <Head>
        <title>Feed | {communityConfig.name}</title>
        <meta name="description" content={`Community feed - ${communityConfig.name}`} />
        <link rel="icon" href={communityConfig.branding.favicon} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Main>
        <ContentArea>
          {loading ? (
            <LoadingMore>Loading posts...</LoadingMore>
          ) : posts.length > 0 ? (
            <PostsList>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLikeToggle={handleLikeToggle}
                  onCommentAdded={handleCommentAdded}
                />
              ))}
            </PostsList>
          ) : (
            <EmptyState>
              <h3>No posts yet</h3>
              <p>Be the first to share something with the community!</p>
            </EmptyState>
          )}

          {hasMore && !loading && (
            <LoadMoreButton onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load More'}
            </LoadMoreButton>
          )}

          {loadingMore && <LoadingMore>Loading more posts...</LoadingMore>}
        </ContentArea>

        <TabBarSpacer />
        <TabBar />
      </Main>

      {user && (
        <FloatingPostBubble onClick={() => setCreateModalOpen(true)} aria-label="Create post">
          <svg viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </FloatingPostBubble>
      )}

      <CreatePostModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </Container>
  );
};

export default FeedPage;
