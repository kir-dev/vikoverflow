import { useSWRInfinite } from "swr";

export default function useQuestions(opts) {
  const swr = useSWRInfinite((i, prev) => {
    if (i === 0) return `/api/questions`;

    if (prev && !prev.nextCursor) return null;

    return `/api/questions?cursor=${prev.nextCursor}`;
  }, opts);

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
