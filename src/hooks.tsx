import { useEffect } from 'react';

export const useTitle = (title: string) => {
  useEffect(() => {
    const oldTitle = document.title;
    title && (document.title = title);
    // Reset title on unmount
    return () => {
      document.title = oldTitle;
    }
  }, [title]);
};