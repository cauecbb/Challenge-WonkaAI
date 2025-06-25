import { useCallback } from 'react';

// Simple implementation of color mode hooks
export function useColorModeValue(lightValue: any): any {
  // Default to light mode values for now
  return lightValue;
}

export function useColorMode() {
  return {
    colorMode: 'light',
    toggleColorMode: useCallback(() => {
      console.log('Color mode toggle not implemented');
    }, [])
  };
} 