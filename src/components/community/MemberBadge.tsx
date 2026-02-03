import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useUser } from '@/contexts/UserContext';

interface MemberPreview {
  id: string;
  pfpUrl: string | null;
  username: string | null;
  displayName: string | null;
}

interface MembersData {
  count: number;
  recentMembers: MemberPreview[];
  isMember?: boolean;
}

interface MemberBadgeProps {
  onClick?: () => void;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Badge = styled.div`
  position: fixed;
  bottom: 24px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: ${({ theme }) => theme.surface};
  padding: 0.625rem 1rem;
  border-radius: 50px;
  border: 1px solid ${({ theme }) => theme.border};
  box-shadow: 0 4px 20px ${({ theme }) => theme.shadow};
  z-index: 1000;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.5s ease-out;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    transform: translateY(-2px);
    box-shadow: 0 8px 30px ${({ theme }) => theme.shadow};
  }
  
  @media (max-width: 768px) {
    bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
    left: 16px;
    padding: 0.5rem 0.875rem;
  }
`;

const AvatarStack = styled.div`
  display: flex;
  align-items: center;
`;

const AvatarImage = styled.div<{ $index: number; $hasImage: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.surface};
  background: ${props => props.$hasImage ? 'transparent' : props.theme.surfaceHover};
  margin-left: ${props => props.$index > 0 ? '-8px' : '0'};
  position: relative;
  z-index: ${props => 10 - props.$index};
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
  font-size: 0.65rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
`;

const MemberCount = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  white-space: nowrap;
`;

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export const MemberBadge: React.FC<MemberBadgeProps> = ({ onClick }) => {
  const { user } = useUser();
  const [membersData, setMembersData] = useState<MembersData>({
    count: 0,
    recentMembers: [],
    isMember: false,
  });

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/members');
      if (response.ok) {
        const data: MembersData = await response.json();
        setMembersData(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers, user]);

  return (
    <Badge onClick={onClick}>
      <AvatarStack>
        {membersData.recentMembers.slice(0, 5).map((member, index) => (
          <AvatarImage key={member.id} $index={index} $hasImage={!!member.pfpUrl}>
            {member.pfpUrl ? (
              <img src={member.pfpUrl} alt={member.username || 'Member'} />
            ) : (
              <AvatarFallback>
                {getInitials(member.displayName || member.username)}
              </AvatarFallback>
            )}
          </AvatarImage>
        ))}
        {membersData.recentMembers.length === 0 && (
          <AvatarImage $index={0} $hasImage={false}>
            <AvatarFallback>👥</AvatarFallback>
          </AvatarImage>
        )}
      </AvatarStack>
      <MemberCount>
        {membersData.count} {membersData.count === 1 ? 'member' : 'members'}
      </MemberCount>
    </Badge>
  );
};

export default MemberBadge;
