import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import type { PropsWithChildren } from 'react';
import { AppThemeProvider } from '../../hooks/use-app-theme';

export function Provider({ children }: PropsWithChildren) {
  return (
    <ChakraProvider value={defaultSystem}>
      <AppThemeProvider>
        {children}
      </AppThemeProvider>
    </ChakraProvider>
  );
}
