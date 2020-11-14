import { useSWRInfinite } from "swr";

export default function useQuestions() {
  const swr = useSWRInfinite((index, previousPageData) => {
    if (previousPageData && !previousPageData.nextCursor) return null;

    if (index === 0) return `/api/questions`;

    return `/api/questions?cursor=${previousPageData.nextCursor}&cursor2=${previousPageData.nextCursor2}`;
  });

  const questions = swr.data
    ? [].concat(...swr.data.map((page) => page.questions))
    : [];

  const initialDataLoaded = !!swr.data;
  const isEmpty = initialDataLoaded && questions.length === 0;
  const isReachingEnd = swr.data && !swr.data[swr.data.length - 1]?.nextCursor;
  function loadMore() {
    swr.setSize((s) => s + 1);
  }

  return {
    swr,
    questions,
    initialDataLoaded,
    isEmpty,
    isReachingEnd,
    loadMore,
  };
}
