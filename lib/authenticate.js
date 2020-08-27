import { useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useRouter } from "next/router";

export const logout = async () => {
  const res = await fetch("/api/auth/logout");

  if (res.ok) {
    mutate("/api/user", {}, false);
  }
};

export const useUser = (redirectTo = false, redirectIfLoggedIn = false) => {
  const router = useRouter();
  const { data, mutate } = useSWR("/api/user");

  useEffect(() => {
    if (!redirectTo || !data) return;

    if (
      (!redirectIfLoggedIn && !data.user) ||
      (redirectIfLoggedIn && data.user)
    ) {
      router.replace(redirectTo);
    }
  }, [router, data, redirectTo, redirectIfLoggedIn]);

  return { user: data?.user, isLoading: !data, mutate };
};
