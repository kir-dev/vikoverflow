import { nanoid } from "nanoid";

export default function PlusIcon() {
  const id = nanoid();

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask
        id={id}
        mask-type="alpha"
        maskUnits="userSpaceOnUse"
        x="4"
        y="3"
        width="17"
        height="17"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13 11H20C20.1326 11 20.2598 11.0527 20.3536 11.1464C20.4473 11.2402 20.5 11.3674 20.5 11.5C20.5 11.6326 20.4473 11.7598 20.3536 11.8536C20.2598 11.9473 20.1326 12 20 12H13V19C13 19.1326 12.9473 19.2598 12.8536 19.3536C12.7598 19.4473 12.6326 19.5 12.5 19.5C12.3674 19.5 12.2402 19.4473 12.1464 19.3536C12.0527 19.2598 12 19.1326 12 19V12H5C4.86739 12 4.74021 11.9473 4.64645 11.8536C4.55268 11.7598 4.5 11.6326 4.5 11.5C4.5 11.3674 4.55268 11.2402 4.64645 11.1464C4.74021 11.0527 4.86739 11 5 11H12V4C12 3.86739 12.0527 3.74021 12.1464 3.64645C12.2402 3.55268 12.3674 3.5 12.5 3.5C12.6326 3.5 12.7598 3.55268 12.8536 3.64645C12.9473 3.74021 13 3.86739 13 4V11Z"
          fill="currentColor"
        />
      </mask>
      <g mask={`url(#${id})`}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0 0H24V24H0V0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
