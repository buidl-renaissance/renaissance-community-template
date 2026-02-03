import React, { useState } from 'react';
import styled from 'styled-components';
import { useUser } from '@/contexts/UserContext';

// SVG Icons
const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

interface PostUser {
  id: string;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: PostUser;
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

interface PostCardProps {
  post: Post;
  onLikeToggle?: (postId: string, liked: boolean, newCount: number) => void;
  onCommentAdded?: (postId: string, newCount: number) => void;
}

// Styled Components
const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
`;

const Avatar = styled.div<{ $hasImage: boolean }>`
  width: 40px;
  height: 40px;
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
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  font-size: 0.95rem;
`;

const PostTime = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
`;

const CardContent = styled.div`
  padding: 0 1rem 1rem;
`;

const PostText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.text};
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
`;

const PostImage = styled.div`
  margin-top: 1rem;
  border-radius: 8px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const ActionButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  color: ${props => props.$active ? props.theme.accent : props.theme.textMuted};
  cursor: pointer;
  transition: all 0.15s ease;
  
  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
    color: ${props => props.$active ? props.theme.accent : props.theme.text};
  }
  
  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

const CommentsSection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
  padding: 1rem;
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const CommentItem = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const CommentAvatar = styled.div<{ $hasImage: boolean }>`
  width: 32px;
  height: 32px;
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

const CommentContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CommentBubble = styled.div`
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
  display: inline-block;
`;

const CommentAuthor = styled.span`
  font-weight: 600;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.text};
  margin-right: 0.5rem;
`;

const CommentText = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.text};
`;

const CommentTime = styled.div`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.25rem;
  padding-left: 0.75rem;
`;

const CommentForm = styled.form`
  display: flex;
  gap: 0.5rem;
`;

const CommentInput = styled.input`
  flex: 1;
  padding: 0.6rem 0.75rem;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px;
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

const CommentSubmit = styled.button`
  padding: 0.6rem 1rem;
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadMoreComments = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.accent};
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.5rem 0;
  
  &:hover {
    text-decoration: underline;
  }
`;

// Helper functions
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now.getTime() - postDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return postDate.toLocaleDateString();
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Component
export const PostCard: React.FC<PostCardProps> = ({ post, onLikeToggle, onCommentAdded }) => {
  const { user } = useUser();
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);

  const handleLike = async () => {
    if (!user) return;

    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: newLiked ? 'POST' : 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.likeCount);
        onLikeToggle?.(post.id, data.liked, data.likeCount);
      } else {
        // Revert on error
        setLiked(!newLiked);
        setLikeCount(prev => newLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      // Revert on error
      setLiked(!newLiked);
      setLikeCount(prev => newLiked ? prev - 1 : prev + 1);
    }
  };

  const loadComments = async () => {
    if (loadingComments) return;
    setLoadingComments(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    const newShowComments = !showComments;
    setShowComments(newShowComments);
    if (newShowComments && comments.length === 0) {
      loadComments();
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentInput.trim() || submittingComment) return;

    setSubmittingComment(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentInput.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setCommentInput('');
        setCommentCount(prev => prev + 1);
        onCommentAdded?.(post.id, commentCount + 1);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const displayName = post.user.displayName || post.user.username || 'Anonymous';

  return (
    <Card id={`post-${post.id}`}>
      <CardHeader>
        <Avatar $hasImage={!!post.user.pfpUrl}>
          {post.user.pfpUrl ? (
            <img src={post.user.pfpUrl} alt={displayName} />
          ) : (
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          )}
        </Avatar>
        <UserInfo>
          <UserName>{displayName}</UserName>
          <PostTime>{formatRelativeTime(post.createdAt)}</PostTime>
        </UserInfo>
      </CardHeader>

      <CardContent>
        <PostText>{post.content}</PostText>
        {post.imageUrl && (
          <PostImage>
            <img src={post.imageUrl} alt="Post image" />
          </PostImage>
        )}
      </CardContent>

      <CardActions>
        <ActionButton $active={liked} onClick={handleLike} disabled={!user}>
          <HeartIcon filled={liked} /> {likeCount}
        </ActionButton>
        <ActionButton onClick={handleToggleComments}>
          <CommentIcon /> {commentCount}
        </ActionButton>
      </CardActions>

      {showComments && (
        <CommentsSection>
          {loadingComments ? (
            <div style={{ textAlign: 'center', color: 'gray' }}>Loading comments...</div>
          ) : (
            <>
              {comments.length > 0 && (
                <CommentsList>
                  {comments.map((comment) => {
                    const commentDisplayName = comment.user.displayName || comment.user.username || 'Anonymous';
                    return (
                      <CommentItem key={comment.id}>
                        <CommentAvatar $hasImage={!!comment.user.pfpUrl}>
                          {comment.user.pfpUrl ? (
                            <img src={comment.user.pfpUrl} alt={commentDisplayName} />
                          ) : (
                            <AvatarFallback style={{ fontSize: '0.7rem' }}>
                              {getInitials(commentDisplayName)}
                            </AvatarFallback>
                          )}
                        </CommentAvatar>
                        <CommentContent>
                          <CommentBubble>
                            <CommentAuthor>{commentDisplayName}</CommentAuthor>
                            <CommentText>{comment.content}</CommentText>
                          </CommentBubble>
                          <CommentTime>{formatRelativeTime(comment.createdAt)}</CommentTime>
                        </CommentContent>
                      </CommentItem>
                    );
                  })}
                </CommentsList>
              )}

              {user && (
                <CommentForm onSubmit={handleSubmitComment}>
                  <CommentInput
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    maxLength={500}
                    disabled={submittingComment}
                  />
                  <CommentSubmit type="submit" disabled={!commentInput.trim() || submittingComment}>
                    Post
                  </CommentSubmit>
                </CommentForm>
              )}
            </>
          )}
        </CommentsSection>
      )}
    </Card>
  );
};

export default PostCard;
