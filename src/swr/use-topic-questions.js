import { useSWRInfinite } from "swr";
import { useRouter } from "next/router";

export default function useTopicQuestions(opts) {
  const router = useRouter();
  const topicId = router.query.id;
  const swr = useSWRInfinite((i, prev) => {
    if (!topicId || (prev && !prev.nextCursor)) return null;

    if (i === 0) return `/api/questions?topic=${topicId}`;

    return `/api/questions?topic=${topicId}&cursor=${prev.nextCursor}`;
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
