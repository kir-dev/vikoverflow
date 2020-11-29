import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/hu";

dayjs.locale("hu");
dayjs.extend(relativeTime);

export default dayjs;
