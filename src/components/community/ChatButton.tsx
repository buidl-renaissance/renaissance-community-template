import React from 'react';
import styled from 'styled-components';

interface ChatButtonProps {
  onClick: () => void;
}

const Button = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent} 0%, ${({ theme }) => theme.accentHover} 100%);
  border: none;
  color: white;
  font-size: 1.4rem;
  cursor: pointer;
  box-shadow: 0 4px 20px ${({ theme }) => theme.accentGlow};
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 8px 30px ${({ theme }) => theme.accentGlow};
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
    right: 16px;
    width: 52px;
    height: 52px;
    font-size: 1.2rem;
  }
`;

export const ChatButton: React.FC<ChatButtonProps> = ({ onClick }) => {
  return (
    <Button onClick={onClick} aria-label="Open community chat">
      💬
    </Button>
  );
};

export default ChatButton;
