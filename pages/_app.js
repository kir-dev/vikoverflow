import "styles/global.css";
import { SWRConfig } from "swr";
import { ToastsProvider } from "components/toasts";
import Router from "next/router";
import { useState, useEffect } from "react";
import { SearchContext } from "lib/search-context";
import { useDebounce } from "use-debounce";

function fetcher(url) {
  return fetch(url).then((r) => r.json());
}

export default function MyApp({ Component, pageProps }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300, {
    maxWait: 500,
  });

  function resetSearch() {
    setSearch("");
  }

  useEffect(() => {
    Router.events.on("routeChangeComplete", resetSearch);
    Router.events.on("routeChangeError", resetSearch);

    return () => {
      Router.events.off("routeChangeComplete", resetSearch);
      Router.events.off("routeChangeError", resetSearch);
    };
  }, []);

  return (
    <SWRConfig value={{ fetcher }}>
      <ToastsProvider>
        <SearchContext.Provider value={{ search, setSearch, debouncedSearch }}>
          <Component {...pageProps} />
        </SearchContext.Provider>
      </ToastsProvider>
    </SWRConfig>
  );
}
