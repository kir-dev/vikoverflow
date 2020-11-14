import { useSWRInfinite } from "swr";

export default function useActivities() {
  const swr = useSWRInfinite((index, previousPageData) => {
    if (previousPageData && !previousPageData.nextCursor) return null;

    if (index === 0) return `/api/user/activities`;

    return `/api/user/activities?cursorPK=${encodeURIComponent(
      previousPageData.nextCursor.PK
    )}&cursorSK=${encodeURIComponent(
      previousPageData.nextCursor.SK
    )}&cursorCreatedAt=${previousPageData.nextCursor.createdAt}`;
  });

  const activities = swr.data
    ? [].concat(...swr.data.map((page) => page.activities))
    : [];

  const initialDataLoaded = !!swr.data;
  const isLoadingMore =
    swr.size > 0 && swr.data && typeof swr.data[swr.size - 1] === "undefined";
  const isEmpty = initialDataLoaded && activities.length === 0;
  const isReachingEnd = swr.data && !swr.data[swr.data.length - 1]?.nextCursor;
  function loadMore() {
    swr.setSize((s) => s + 1);
  }

  return {
    swr,
    activities,
    initialDataLoaded,
    isLoadingMore,
    isEmpty,
    isReachingEnd,
    loadMore,
  };
}
