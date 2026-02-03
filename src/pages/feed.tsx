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

const CreatePostButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const CreatePostAvatar = styled.div<{ $hasImage: boolean }>`
  width: 40px;
  height: 40px;
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
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
`;

const CreatePostPlaceholder = styled.span`
  flex: 1;
  text-align: left;
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.95rem;
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
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });

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

  const displayName = user?.displayName || user?.username || '';

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
          {user && (
            <CreatePostButton onClick={() => setCreateModalOpen(true)}>
              <CreatePostAvatar $hasImage={!!user.pfpUrl}>
                {user.pfpUrl ? (
                  <img src={user.pfpUrl} alt={displayName} />
                ) : (
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                )}
              </CreatePostAvatar>
              <CreatePostPlaceholder>What&apos;s on your mind?</CreatePostPlaceholder>
            </CreatePostButton>
          )}

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

      {/* Create Post Modal */}
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
