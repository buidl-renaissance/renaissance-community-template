import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { StyleSheetManager } from "styled-components";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProvider } from "@/contexts/UserContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { GlobalStyle } from "@/styles/globalStyles";

export default function App({ Component, pageProps }: AppProps) {
  // Tenant ID can be set via environment variable or passed in pageProps
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || pageProps.tenantId || 'default';
  
  return (
    <TenantProvider tenantId={tenantId}>
      <ThemeProvider>
        <UserProvider>
          <StyleSheetManager shouldForwardProp={(prop) => !prop.startsWith('$')}>
            <GlobalStyle />
            <Component {...pageProps} />
          </StyleSheetManager>
        </UserProvider>
      </ThemeProvider>
    </TenantProvider>
  );
}
