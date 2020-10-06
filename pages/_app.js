import "styles/global.css";
import { SWRConfig } from "swr";
import { ToastsProvider } from "components/toasts";

function fetcher(url) {
  return fetch(url).then((r) => r.json());
}

export default function MyApp({ Component, pageProps }) {
  return (
    <SWRConfig value={{ fetcher }}>
      <ToastsProvider>
        <Component {...pageProps} />
      </ToastsProvider>
    </SWRConfig>
  );
}
