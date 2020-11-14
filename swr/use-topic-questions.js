import { useSWRInfinite } from "swr";
import { useRouter } from "next/router";

export default function useTopicQuestions() {
  const router = useRouter();
  const topicId = router.query.id;
  const swr = useSWRInfinite((index, previousPageData) => {
    if (!topicId || (previousPageData && !previousPageData.nextCursor))
      return null;

    if (index === 0) return `/api/questions?topic=${topicId}`;

    return `/api/questions?topic=${topicId}&cursor=${previousPageData.nextCursor}&cursorCreatedAt=${previousPageData.nextCursorCreatedAt}`;
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
