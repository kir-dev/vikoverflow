import { createContext, useContext } from "react";

export const SearchContext = createContext();

export function useSearch() {
  return useContext(SearchContext);
}
