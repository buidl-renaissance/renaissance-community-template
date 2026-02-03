import React, { useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useUser } from '@/contexts/UserContext';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.surface};
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: ${slideUp} 0.3s ease;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const ModalTitle = styled.h3`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.textMuted};
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  
  &:hover {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.surfaceHover};
  }
`;

const ModalBody = styled.div`
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
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

const UserName = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  outline: none;
  
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }
  
  &:focus {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const CharCount = styled.div<{ $warning: boolean }>`
  text-align: right;
  font-size: 0.75rem;
  color: ${props => props.$warning ? props.theme.danger : props.theme.textMuted};
  margin-top: 0.5rem;
`;

const ImageSection = styled.div`
  margin-top: 1rem;
`;

const ImagePreview = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 0.75rem;
  
  img {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    display: block;
  }
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const AddImageButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  background: ${({ theme }) => theme.background};
  border: 2px dashed ${({ theme }) => theme.border};
  border-radius: 12px;
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const ModalFooter = styled.div`
  padding: 1rem 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.border};
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.text};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
  }
`;

const PostButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.danger};
  font-size: 0.85rem;
  margin-top: 0.5rem;
`;

// Helper
function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Component
export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useUser();
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_LENGTH = 2000;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      let imageUrl = null;

      // Upload image if present
      if (imagePreview) {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imagePreview, type: 'post' }),
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      // Create post
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create post');
      }

      const data = await res.json();
      onPostCreated(data.post);

      // Reset form
      setContent('');
      setImagePreview(null);
      setImageFile(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setContent('');
      setImagePreview(null);
      setImageFile(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !user) return null;

  const displayName = user.displayName || user.username || 'Anonymous';

  return (
    <Overlay onClick={handleClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Create Post</ModalTitle>
          <CloseButton onClick={handleClose}>✕</CloseButton>
        </ModalHeader>

        <ModalBody>
          <UserRow>
            <Avatar $hasImage={!!user.pfpUrl}>
              {user.pfpUrl ? (
                <img src={user.pfpUrl} alt={displayName} />
              ) : (
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              )}
            </Avatar>
            <UserName>{displayName}</UserName>
          </UserRow>

          <TextArea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={MAX_LENGTH}
            disabled={submitting}
          />
          <CharCount $warning={content.length > MAX_LENGTH - 100}>
            {content.length} / {MAX_LENGTH}
          </CharCount>

          <ImageSection>
            {imagePreview ? (
              <ImagePreview>
                <img src={imagePreview} alt="Preview" />
                <RemoveImageButton onClick={handleRemoveImage} disabled={submitting}>
                  ✕
                </RemoveImageButton>
              </ImagePreview>
            ) : (
              <AddImageButton onClick={() => fileInputRef.current?.click()} disabled={submitting}>
                📷 Add Photo
              </AddImageButton>
            )}
            <HiddenFileInput
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
            />
          </ImageSection>

          {error && <ErrorMessage>{error}</ErrorMessage>}
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={handleClose} disabled={submitting}>
            Cancel
          </CancelButton>
          <PostButton
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
          >
            {submitting ? 'Posting...' : 'Post'}
          </PostButton>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
};

export default CreatePostModal;
