import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import type { PropsWithChildren } from 'react';
import { AppSettingsProvider } from '../../hooks/use-app-settings';

export function Provider({ children }: PropsWithChildren) {
  return (
    <ChakraProvider value={defaultSystem}>
      <AppSettingsProvider>
        {children}
      </AppSettingsProvider>
    </ChakraProvider>
  );
}
