import { useSWRInfinite } from "swr";

export default function useSearch(rawSearch, selected) {
  const search = encodeURIComponent(rawSearch);

  const swr = useSWRInfinite((i, prev) => {
    if (!rawSearch || (prev && !prev.nextCursor)) return null;

    if (i === 0)
      return `/api/search?q=${search}${
        selected !== "all" ? `&type=${selected}` : ""
      }`;

    return `/api/search?q=${search}&cursor=${prev.nextCursor}${
      selected !== "all" ? `&type=${selected}` : ""
    }`;
  });

  const results = swr.data
    ? [].concat(...swr.data.map((page) => page.results))
    : [];

  const initialDataLoaded = !!swr.data;
  const isEmpty = initialDataLoaded && results.length === 0;
  const isReachingEnd = swr.data && !swr.data[swr.data.length - 1]?.nextCursor;
  const isLoadingMore = initialDataLoaded && swr.size > swr.data.length;
  function loadMore() {
    swr.setSize((s) => s + 1);
  }

  return {
    swr,
    results,
    initialDataLoaded,
    isEmpty,
    isReachingEnd,
    isLoadingMore,
    loadMore,
  };
}
