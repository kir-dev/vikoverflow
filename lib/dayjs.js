import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/hu";

dayjs.locale("hu");
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

// TODO remove this once PR is merged
// https://github.com/iamkun/dayjs/issues/1111#issuecomment-703291009

dayjs.updateLocale("hu", {
  relativeTime: {
    future: "%s múlva",
    past: "%s",
    s: (_, __, ___, isFuture) => `néhány másodperc${isFuture ? "" : "e"}`,
    m: (_, __, ___, isFuture) => `egy perc${isFuture ? "" : "e"}`,
    mm: (n, __, ___, isFuture) => `${n} perc${isFuture ? "" : "e"}`,
    h: (_, __, ___, isFuture) => `egy ${isFuture ? "óra" : "órája"}`,
    hh: (n, __, ___, isFuture) => `${n} ${isFuture ? "óra" : "órája"}`,
    d: (_, __, ___, isFuture) => `egy ${isFuture ? "nap" : "napja"}`,
    dd: (n, __, ___, isFuture) => `${n} ${isFuture ? "nap" : "napja"}`,
    M: (_, __, ___, isFuture) => `egy ${isFuture ? "hónap" : "hónapja"}`,
    MM: (n, __, ___, isFuture) => `${n} ${isFuture ? "hónap" : "hónapja"}`,
    y: (_, __, ___, isFuture) => `egy ${isFuture ? "év" : "éve"}`,
    yy: (n, __, ___, isFuture) => `${n} ${isFuture ? "év" : "éve"}`,
  },
});

export default dayjs;
