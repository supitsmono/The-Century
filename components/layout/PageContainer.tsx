import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Golden Page Wrapper - Single source of truth for page content centering and spacing
 * - Centers content: mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8
 * - Controls vertical rhythm: py-10 (or py-8 sm:py-10)
 * - Provides consistent spacing between sections
 */
export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`} style={{ marginLeft: 'auto', marginRight: 'auto' }}>
      {children}
    </div>
  );
};

