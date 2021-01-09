import { useSWRInfinite } from "swr";
import { useCallback, useState } from "react";

export default function useQuestions(opts) {
  const swr = useSWRInfinite((i, prev) => {
    if (i === 0) return `/api/questions`;

    if (prev && !prev.nextCursor) return null;

    return `/api/questions?cursor=${prev.nextCursor}`;
  }, opts);

  const [displayedQuestions, setDisplayedQuestions] = useState(swr.data);
  // TODO ez a same check itt fos, valahogy az elso oldalt az elso oldallal kene osszehasonlitani
  // vagy nemtudom, ez eleg mely.. nagyon fura egyutt a vegtelen scroll a new cuccokkal
  // egyszerre tobb pagenyi uj is johet stb stb...
  // annyi h az addNewQuestions mindenkeppen gorgessen fel
  // es resetelheti a questions tombot is, swren belul is vhogy.

  // talan most az egy nagyon easy fix h a leges legelso kerdest csekk h ugyan az e, ha ugyan az akkor same as before minden
  // ha pedig nem ugyan az show popup, a popuppra kattintva pedig ujrarugni az egesz swrt. (vagy ha ez tul csunya akkor valahogy csak bekonkatenalin az elejere bar szerintem az ordas nagy szopas)
  const hasNewQuestions = displayedQuestions !== swr.data;
  const addNewQuestions = useCallback(() => {
    setDisplayedQuestions(swr.data);
  }, [swr.data]);

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
    hasNewQuestions,
    addNewQuestions,
  };
}
