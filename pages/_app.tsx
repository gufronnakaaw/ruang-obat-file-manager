import "@/styles/globals.css";
import { fetcher } from "@/utils/fetcher";
import { HeroUIProvider } from "@heroui/react";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import NextNProgress from "nextjs-progressbar";
import { Toaster } from "react-hot-toast";
import { SWRConfig } from "swr";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <>
      <Toaster />
      <NextNProgress color="#6238C3" options={{ showSpinner: false }} />
      <SessionProvider session={session} refetchOnWindowFocus={false}>
        <SWRConfig
          value={{
            fetcher,
            revalidateOnFocus: false,
          }}
        >
          <HeroUIProvider>
            <Component {...pageProps} />
          </HeroUIProvider>
        </SWRConfig>
      </SessionProvider>
    </>
  );
}
