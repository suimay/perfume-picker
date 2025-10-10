import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  backgroundColor?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', backgroundColor, onClick }: CardProps) {
  const style = backgroundColor ? { backgroundColor } : {};

  return (
    <div
      className={`rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      } ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
