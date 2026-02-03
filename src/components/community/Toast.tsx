import React from 'react';
import styled from 'styled-components';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
}

const ToastContainer = styled.div<{ $visible: boolean; $type: string }>`
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%) translateY(${props => props.$visible ? '0' : '20px'});
  background: ${props => {
    switch (props.$type) {
      case 'success': return props.theme.success;
      case 'error': return props.theme.danger;
      default: return props.theme.accent;
    }
  }};
  color: white;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 20px ${({ theme }) => theme.shadow};
  z-index: 2000;
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 90vw;
  text-align: center;
`;

export const Toast: React.FC<ToastProps> = ({ visible, message, type = 'success' }) => {
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  
  return (
    <ToastContainer $visible={visible} $type={type}>
      <span>{icon}</span>
      {message}
    </ToastContainer>
  );
};

export default Toast;
