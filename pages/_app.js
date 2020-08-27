import "styles/global.css";
import { SWRConfig } from "swr";
import { ToastsProvider } from "components/toasts";

// todo handle errors here and throw so that a 400 shows up as error in swr?
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
