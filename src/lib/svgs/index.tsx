import { motion } from "motion/react";

export const CircleArrowIcon = ({
  iconFill = "#7EEB84",
  arrowFill = "#6DCB72",
  rotation = 0,
}: {
  iconFill?: string;
  arrowFill?: string;
  rotation?: number;
} = {}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="135"
    height="135"
    fill="none"
    viewBox="0 0 135 135"
  >
    <rect width="135" height="135" fill={iconFill} rx="67.5"></rect>
    <motion.path
      stroke={arrowFill}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="13.5"
      d="M67.5 39.934v59.062M43.875 59.629 67.5 36.004l23.625 23.625"
      animate={{ rotate: rotation }}
      style={{ originX: "50%", originY: "50%" }}
    />
  </svg>
);

export const LANDING_AVATAR_BG = "#7EEB84";
export const LANDING_AVATAR_FG = "#111";
// The face hexagon, which is a hole in LANDING_AVATAR_PATH, as a standalone shape
export const LANDING_AVATAR_FACE_PATH =
  "M34.826 18.21a5.31 5.31 0 0 0-5.249 0l-7.303 4.152a5.31 5.31 0 0 0-2.686 4.618v8.585a5.31 5.31 0 0 0 2.65 4.596l7.302 4.228a5.31 5.31 0 0 0 5.322 0l7.303-4.228a5.31 5.31 0 0 0 2.65-4.596V26.98a5.31 5.31 0 0 0-2.687-4.618z";
export const LANDING_AVATAR_PATH =
  "M22.938 12c.862 0 1.562.7 1.562 1.563v.937a.625.625 0 1 0 1.25 0v-.937c0-.863.7-1.563 1.563-1.563h9.558a1.38 1.38 0 0 1 1.379 1.379V14.5a.625.625 0 1 0 1.25 0v-1.121A1.38 1.38 0 0 1 40.879 12h5.913A5.21 5.21 0 0 1 52 17.208v5.469a1.823 1.823 0 0 1-1.823 1.823H49.5a.625.625 0 1 0 0 1.25h.938c.862 0 1.562.7 1.562 1.563v9.375c0 .862-.7 1.562-1.562 1.562H49.5a.625.625 0 1 0 0 1.25h.938c.862 0 1.562.7 1.562 1.563v4.687A6.25 6.25 0 0 1 45.75 52h-4.687c-.863 0-1.563-.7-1.563-1.562V49.5a.625.625 0 1 0-1.25 0v.938c0 .862-.7 1.562-1.562 1.562h-9.376c-.862 0-1.562-.7-1.562-1.562V49.5a.625.625 0 1 0-1.25 0v.938c0 .862-.7 1.562-1.562 1.562H18.25A6.25 6.25 0 0 1 12 45.75v-4.687c0-.863.7-1.563 1.563-1.563h.937a.625.625 0 1 0 0-1.25h-.937c-.863 0-1.563-.7-1.563-1.562v-9.376c0-.862.7-1.562 1.563-1.562h.937a.625.625 0 1 0 0-1.25h-.937C12.7 24.5 12 23.8 12 22.938V18.25A6.25 6.25 0 0 1 18.25 12zm11.888 6.21a5.31 5.31 0 0 0-5.249 0l-7.303 4.152a5.31 5.31 0 0 0-2.686 4.618v8.585a5.31 5.31 0 0 0 2.65 4.596l7.302 4.228a5.31 5.31 0 0 0 5.322 0l7.303-4.228a5.31 5.31 0 0 0 2.65-4.596V26.98a5.31 5.31 0 0 0-2.687-4.618zm-8.334 9.795c.88 0 1.593.714 1.593 1.594v2.39a1.593 1.593 0 1 1-3.187 0v-2.39c0-.88.714-1.594 1.594-1.594m11.418 0c.88 0 1.594.714 1.594 1.594v2.39a1.594 1.594 0 0 1-3.187 0v-2.39c0-.88.713-1.594 1.593-1.594";

export const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M12 5.5V12M12 12V18.5M12 12H5.5M12 12H18.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const HomeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M3 7.71339C3 7.08389 3 6.76915 3.07945 6.47815C3.14985 6.22034 3.2656 5.97714 3.4213 5.75993C3.59705 5.51476 3.84132 5.31629 4.32987 4.91935L6.72987 2.96935C7.53907 2.31186 7.9437 1.98312 8.39348 1.85721C8.79023 1.74616 9.20977 1.74616 9.60652 1.85721C10.0563 1.98312 10.4609 2.31186 11.2701 2.96935L13.6701 4.91935C14.1587 5.31629 14.4029 5.51476 14.5787 5.75993C14.7344 5.97714 14.8502 6.22034 14.9206 6.47815C15 6.76915 15 7.08389 15 7.71339V11.3999C15 12.66 15 13.29 14.7548 13.7714C14.5391 14.1947 14.1949 14.5389 13.7715 14.7546C13.2901 14.9999 12.6601 14.9999 11.4 14.9999H6.6C5.33988 14.9999 4.70982 14.9999 4.22852 14.7546C3.80516 14.5389 3.46095 14.1947 3.24524 13.7714C3 13.29 3 12.66 3 11.3999V7.71339Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M6 12H12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const BetsIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M9 2.625V3.375M9 15.375V14.625M2.62501 9H3.37501M15.375 9H14.625M5.81249 3.47909L6.18749 4.12861M12.1875 14.5209L11.8125 13.8714M3.47909 12.1875L4.12861 11.8125M14.5209 5.8125L13.8714 6.1875M3.47909 5.81252L4.12861 6.18752M14.5209 12.1875L13.8714 11.8125M5.81251 14.5209L6.18751 13.8714M12.1875 3.47909L11.8125 4.12861M7.125 6.75C7.125 6.95711 6.95711 7.125 6.75 7.125C6.54289 7.125 6.375 6.95711 6.375 6.75M7.125 6.75C7.125 6.54289 6.95711 6.375 6.75 6.375C6.54289 6.375 6.375 6.54289 6.375 6.75M7.125 6.75H6.375M7.125 11.25C7.125 11.4571 6.95711 11.625 6.75 11.625C6.54289 11.625 6.375 11.4571 6.375 11.25M7.125 11.25C7.125 11.0429 6.95711 10.875 6.75 10.875C6.54289 10.875 6.375 11.0429 6.375 11.25M7.125 11.25H6.375M11.625 6.75C11.625 6.95711 11.4571 7.125 11.25 7.125C11.0429 7.125 10.875 6.95711 10.875 6.75M11.625 6.75C11.625 6.54289 11.4571 6.375 11.25 6.375C11.0429 6.375 10.875 6.54289 10.875 6.75M11.625 6.75H10.875M11.625 11.25C11.625 11.4571 11.4571 11.625 11.25 11.625C11.0429 11.625 10.875 11.4571 10.875 11.25M11.625 11.25C11.625 11.0429 11.4571 10.875 11.25 10.875C11.0429 10.875 10.875 11.0429 10.875 11.25M11.625 11.25H10.875M7.93935 7.93935L7.6875 7.6875M10.0606 7.93935L10.3125 7.6875M10.0606 10.0606L10.3125 10.3125M7.93935 10.0606L7.6875 10.3125M15.75 9C15.75 12.728 12.728 15.75 9 15.75C5.27208 15.75 2.25 12.728 2.25 9C2.25 5.27208 5.27208 2.25 9 2.25C12.728 2.25 15.75 5.27208 15.75 9ZM10.125 9C10.125 9.6213 9.6213 10.125 9 10.125C8.3787 10.125 7.875 9.6213 7.875 9C7.875 8.3787 8.3787 7.875 9 7.875C9.6213 7.875 10.125 8.3787 10.125 9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const SettingsIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M5.75751 3.99404L5.47886 3.92974C5.04489 3.82959 4.58993 3.96007 4.275 4.275C3.96007 4.58993 3.82959 5.04488 3.92974 5.47886L3.99404 5.75751C4.16311 6.49018 3.861 7.251 3.23536 7.66808L2.81164 7.9506C2.46076 8.18452 2.25 8.57827 2.25 9C2.25 9.42173 2.46076 9.81548 2.81164 10.0494L3.23536 10.3319C3.861 10.749 4.16311 11.5098 3.99404 12.2425L3.92974 12.5212C3.82959 12.9551 3.96007 13.4101 4.275 13.725C4.58993 14.0399 5.04488 14.1704 5.47886 14.0703L5.75751 14.006C6.49018 13.8369 7.251 14.139 7.66808 14.7646L7.9506 15.1884C8.18452 15.5392 8.57827 15.75 9 15.75C9.42173 15.75 9.81548 15.5392 10.0494 15.1884L10.3319 14.7646C10.749 14.139 11.5098 13.8369 12.2425 14.006L12.5212 14.0703C12.9551 14.1704 13.4101 14.0399 13.725 13.725C14.0399 13.4101 14.1704 12.9551 14.0703 12.5212L14.006 12.2425C13.8369 11.5098 14.139 10.749 14.7646 10.3319L15.1884 10.0494C15.5392 9.81548 15.75 9.42173 15.75 9C15.75 8.57827 15.5392 8.18452 15.1884 7.9506L14.7646 7.66808C14.139 7.251 13.8369 6.49018 14.006 5.75751L14.0703 5.47886C14.1704 5.04489 14.0399 4.58993 13.725 4.275C13.4101 3.96007 12.9551 3.82959 12.5212 3.92974L12.2425 3.99404C11.5098 4.16311 10.749 3.861 10.3319 3.23536L10.0494 2.81163C9.81548 2.46076 9.42173 2.25 9 2.25C8.57827 2.25 8.18452 2.46076 7.9506 2.81164L7.66808 3.23536C7.251 3.861 6.49018 4.16311 5.75751 3.99404Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M11.25 9C11.25 10.2427 10.2427 11.25 9 11.25C7.75732 11.25 6.75 10.2427 6.75 9C6.75 7.75732 7.75732 6.75 9 6.75C10.2427 6.75 11.25 7.75732 11.25 9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const ContrastIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M12.25 7C12.25 9.89952 9.89952 12.25 7 12.25C4.10051 12.25 1.75 9.89952 1.75 7C1.75 4.10051 4.10051 1.75 7 1.75C9.89952 1.75 12.25 4.10051 12.25 7Z"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 2.04167V11.9583"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.75 2.33333V11.6667"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.5 3.20833V10.7917"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const InfoIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M6.41667 6.41667H7V9.33333M12.25 7C12.25 9.89952 9.89952 12.25 7 12.25C4.10051 12.25 1.75 9.89952 1.75 7C1.75 4.10051 4.10051 1.75 7 1.75C9.89952 1.75 12.25 4.10051 12.25 7Z"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 4.22917C6.75838 4.22917 6.5625 4.42504 6.5625 4.66667C6.5625 4.90829 6.75838 5.10417 7 5.10417C7.24162 5.10417 7.4375 4.90829 7.4375 4.66667C7.4375 4.42504 7.24162 4.22917 7 4.22917Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.291667"
    />
  </svg>
);

export const StarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M6.41124 1.53441C6.64755 1.04409 7.35245 1.04409 7.58876 1.53441L8.76423 3.97345C8.85931 4.17078 9.04878 4.30708 9.26771 4.33565L11.9738 4.68883C12.5178 4.75984 12.7356 5.42361 12.3377 5.79765L10.3581 7.65823C10.1979 7.80879 10.1256 8.02929 10.1657 8.24431L10.6627 10.9016C10.7627 11.4358 10.1923 11.846 9.71011 11.5869L7.31121 10.2978C7.11707 10.1935 6.88292 10.1935 6.68879 10.2978L4.28988 11.5869C3.80763 11.846 3.23735 11.4358 3.33725 10.9016L3.83422 8.24431C3.87443 8.02929 3.80206 7.80879 3.64191 7.65823L1.66231 5.79765C1.26436 5.42361 1.48218 4.75984 2.02618 4.68883L4.73226 4.33565C4.95119 4.30708 5.14066 4.17078 5.23577 3.97345L6.41124 1.53441Z"
      stroke="currentColor"
      strokeWidth="1.16667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const MinusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden
    className={className}
  >
    <path d="M2 6H10" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

export const DollarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M9 5.625V4.875M9 12.375V13.125M10.6241 6.75C10.3 6.30165 9.69405 6 9 6H8.79165C7.87118 6 7.125 6.59695 7.125 7.33333V7.39058C7.125 7.9173 7.49699 8.3988 8.0859 8.63437L9.9141 9.36563C10.503 9.6012 10.875 10.0827 10.875 10.6094C10.875 11.3774 10.0968 12 9.1368 12H9C8.30595 12 7.70003 11.6983 7.37584 11.25M15.75 9C15.75 12.728 12.728 15.75 9 15.75C5.27208 15.75 2.25 12.728 2.25 9C2.25 5.27208 5.27208 2.25 9 2.25C12.728 2.25 15.75 5.27208 15.75 9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M3.75 4.875L4.35551 13.6548C4.43687 14.8345 5.41761 15.75 6.60017 15.75H11.3998C12.5824 15.75 13.5631 14.8345 13.6445 13.6548L14.25 4.875"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.625 4.5H15.375"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.05273 4.30966C6.31715 2.92309 7.53592 1.875 8.99954 1.875C10.4632 1.875 11.6819 2.92309 11.9464 4.30966"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const NewTradeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M12 7V8M12 16V17M14.5 9.55051C13.8647 8.90223 12.9793 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5C12.9793 15.5 13.8647 15.0978 14.5 14.4495M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const HistoryIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M3 5V9H7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.51172 15C4.74723 18.4956 8.08094 21 11.9996 21C16.9702 21 20.9996 16.9706 20.9996 12C20.9996 7.02944 16.9702 3 11.9996 3C8.27045 3 5.07102 5.26806 3.70551 8.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 8V12L15 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const EyeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M11.25 9C11.25 10.2427 10.2427 11.25 9 11.25C7.75732 11.25 6.75 10.2427 6.75 9C6.75 7.75732 7.75732 6.75 9 6.75C10.2427 6.75 11.25 7.75732 11.25 9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.9186 7.98915C12.3072 2.33691 5.69326 2.33697 2.08186 7.98922C1.68886 8.6043 1.68886 9.39577 2.08186 10.0108C5.69326 15.6631 12.3072 15.663 15.9186 10.0108C16.3116 9.3957 16.3116 8.60422 15.9186 7.98915Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// EyeIcon with a slash through it. Drawn to match; not from Figma.
export const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M11.25 9C11.25 10.2427 10.2427 11.25 9 11.25C7.75732 11.25 6.75 10.2427 6.75 9C6.75 7.75732 7.75732 6.75 9 6.75C10.2427 6.75 11.25 7.75732 11.25 9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.9186 7.98915C12.3072 2.33691 5.69326 2.33697 2.08186 7.98922C1.68886 8.6043 1.68886 9.39577 2.08186 10.0108C5.69326 15.6631 12.3072 15.663 15.9186 10.0108C16.3116 9.3957 16.3116 8.60422 15.9186 7.98915Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.25 2.25L15.75 15.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const ChevronLeftIcon =({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M10.875 13.5L6.375 9L10.875 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FilterIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M11.25 7.5C12.4931 7.5 13.5 6.49313 13.5 5.25C13.5 4.00687 12.4931 3 11.25 3C10.0069 3 9 4.00687 9 5.25C9 6.49313 10.0069 7.5 11.25 7.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 5.25H3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 5.25H13.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.75 15C7.99313 15 9 13.9931 9 12.75C9 11.5069 7.99313 10.5 6.75 10.5C5.50687 10.5 4.5 11.5069 4.5 12.75C4.5 13.9931 5.50687 15 6.75 15Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M4.5 12.75H3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M15 12.75H9.375"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const SignOutIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className={className}
  >
    <path
      d="M15 4L17 4C18.6569 4 20 5.34315 20 7V17C20 18.6569 18.6569 20 17 20H15M14.5 12H4M14.5 12L11 15.5M14.5 12L11 8.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LandingAvatarIcon = ({ size = 64 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 64 64"
    className="inline-block"
  >
    <rect width="64" height="64" fill={LANDING_AVATAR_BG} rx="14"></rect>
    {/* Themeable via --landing-avatar-fg (white in the landing page's dark mode) */}
    <path
      fill={`var(--landing-avatar-fg, ${LANDING_AVATAR_FG})`}
      d={LANDING_AVATAR_PATH}
    ></path>
  </svg>
);

export const AaveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="68"
    height="65"
    fill="none"
    viewBox="0 0 68 65"
  >
    <rect width="64" height="64" x="4" y="1" fill="#8683F6" rx="14"></rect>
    <g clipPath="url(#clip0_1732_11459)">
      <path
        fill="#9391F7"
        d="M36 53c11.046 0 20-8.954 20-20s-8.954-20-20-20-20 8.954-20 20 8.954 20 20 20"
      ></path>
      <path
        fill="#fff"
        d="M32.283 33.975a3.146 3.146 0 1 0-1.008-6.211 3.146 3.146 0 0 0 1.008 6.21m8.223 0a3.146 3.146 0 1 0-1.009-6.211 3.146 3.146 0 0 0 1.009 6.21"
      ></path>
      <path
        fill="#fff"
        d="M35.883 17.883c-8.542 0-15.467 7.057-15.465 15.76h3.95c0-6.522 5.115-11.81 11.515-11.81s11.514 5.288 11.514 11.81h3.951c.002-8.703-6.924-15.76-15.465-15.76"
      ></path>
    </g>
    <rect width="64" height="64" fill="#9391F7" rx="14"></rect>
    <g clipPath="url(#clip1_1732_11459)">
      <path
        fill="#9391F7"
        d="M32 52c11.046 0 20-8.954 20-20s-8.954-20-20-20-20 8.954-20 20 8.954 20 20 20"
      ></path>
      <path
        fill="#fff"
        d="M28.283 32.975a3.146 3.146 0 1 0-1.008-6.211 3.146 3.146 0 0 0 1.008 6.21m8.223 0a3.146 3.146 0 1 0-1.009-6.211 3.146 3.146 0 0 0 1.009 6.21"
      ></path>
      <path
        fill="#fff"
        d="M31.883 16.883c-8.542 0-15.467 7.057-15.465 15.76h3.95c0-6.522 5.115-11.81 11.515-11.81s11.514 5.288 11.514 11.81h3.951c.002-8.703-6.924-15.76-15.465-15.76"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0_1732_11459">
        <path fill="#fff" d="M16 13h40v40H16z"></path>
      </clipPath>
      <clipPath id="clip1_1732_11459">
        <path fill="#fff" d="M12 12h40v40H12z"></path>
      </clipPath>
    </defs>
  </svg>
);

export const BaseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="68"
    height="65"
    fill="none"
    viewBox="0 0 68 65"
  >
    <rect width="64" height="64" x="4" y="1" fill="#1558EA" rx="14"></rect>
    <rect width="40" height="40" x="16" y="13" fill="#2563EB" rx="7.843"></rect>
    <g clipPath="url(#clip0_1732_11446)">
      <path
        fill="#fff"
        d="M35.979 45C42.619 45 48 39.628 48 33s-5.382-12-12.021-12C29.68 21 24.514 25.837 24 31.991h15.889v2.018H24C24.514 40.163 29.68 45 35.979 45"
      ></path>
    </g>
    <rect width="64" height="64" fill="#2563EB" rx="14"></rect>
    <rect width="40" height="40" x="12" y="12" fill="#2563EB" rx="7.843"></rect>
    <g clipPath="url(#clip1_1732_11446)">
      <path
        fill="#fff"
        d="M31.979 44C38.619 44 44 38.628 44 32s-5.382-12-12.021-12C25.68 20 20.514 24.837 20 30.991h15.889v2.018H20C20.514 39.163 25.68 44 31.979 44"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0_1732_11446">
        <path fill="#fff" d="M24 21h24v24H24z"></path>
      </clipPath>
      <clipPath id="clip1_1732_11446">
        <path fill="#fff" d="M20 20h24v24H20z"></path>
      </clipPath>
    </defs>
  </svg>
);

export const OptimismIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="68"
    height="65"
    fill="none"
    viewBox="0 0 68 65"
  >
    <rect width="64" height="64" x="4" y="1" fill="#D10017" rx="14"></rect>
    <rect width="40" height="40" x="16" y="13" fill="#2563EB" rx="7.843"></rect>
    <g clipPath="url(#clip0_1732_11447)">
      <path
        fill="#fff"
        d="M35.979 45C42.619 45 48 39.628 48 33s-5.382-12-12.021-12C29.68 21 24.514 25.837 24 31.991h15.889v2.018H24C24.514 40.163 29.68 45 35.979 45"
      ></path>
    </g>
    <rect width="64" height="64" fill="#FF0420" rx="14"></rect>
    <rect width="40" height="40" x="12" y="12" fill="#FF0420" rx="7.843"></rect>
    <path
      fill="#FF0420"
      d="M48 32c0-8.832-7.168-16-16-16s-16 7.168-16 16 7.168 16 16 16 16-7.168 16-16"
    ></path>
    <path
      fill="#fff"
      d="M27.341 36.25c-.96 0-1.74-.23-2.342-.679-.602-.46-.91-1.113-.91-1.945 0-.18.026-.397.065-.653.102-.576.256-1.267.448-2.087q.825-3.302 4.224-3.302c.614 0 1.177.102 1.664.32q.729.307 1.152.922c.281.41.422.883.422 1.446 0 .166-.025.384-.064.64a33 33 0 0 1-.435 2.086c-.282 1.101-.768 1.92-1.46 2.47q-1.035.807-2.764.807zm.18-1.728c.447 0 .831-.141 1.138-.397.32-.269.55-.666.692-1.216.192-.755.332-1.408.422-1.971.038-.167.051-.346.051-.525 0-.73-.384-1.101-1.139-1.101-.448 0-.832.14-1.152.397-.32.269-.538.665-.678 1.216-.154.537-.295 1.19-.436 1.971a2.2 2.2 0 0 0-.05.512c-.014.742.383 1.114 1.151 1.114M32.603 36.135c-.09 0-.153-.025-.204-.09a.32.32 0 0 1-.039-.217l1.664-7.808a.31.31 0 0 1 .141-.218.35.35 0 0 1 .23-.09h3.2c.897 0 1.6.193 2.138.551.55.371.82.91.82 1.6 0 .205-.026.41-.078.628-.204.921-.601 1.6-1.215 2.047-.602.449-1.434.666-2.484.666h-1.625l-.55 2.637a.36.36 0 0 1-.142.218.35.35 0 0 1-.23.09h-1.638zm4.25-4.595c.346 0 .627-.09.883-.281s.423-.448.512-.794c.026-.14.039-.256.039-.358 0-.23-.077-.41-.205-.538-.14-.128-.371-.192-.704-.192H35.93l-.46 2.15h1.382z"
    ></path>
    <defs>
      <clipPath id="clip0_1732_11447">
        <path fill="#fff" d="M24 21h24v24H24z"></path>
      </clipPath>
    </defs>
  </svg>
);

export const UsdcIcon = ({ size = 16 }: { size?: number } = {}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 16 16"
  >
    <path
      fill="#3e73c4"
      strokeWidth="0.5"
      d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16"
    ></path>
    <path
      fill="#fff"
      strokeWidth="0.5"
      d="M10.011 9.062c0-1.062-.64-1.426-1.92-1.578-.914-.122-1.096-.364-1.096-.789s.305-.698.914-.698c.548 0 .853.182 1.005.638a.23.23 0 0 0 .214.151h.487a.21.21 0 0 0 .214-.212v-.03a1.52 1.52 0 0 0-1.372-1.245v-.728c0-.121-.091-.212-.243-.243h-.458c-.121 0-.213.091-.243.243v.698c-.915.121-1.493.728-1.493 1.487 0 1.001.609 1.396 1.889 1.548.853.151 1.127.333 1.127.819s-.426.819-1.005.819c-.793 0-1.067-.333-1.158-.789-.03-.121-.122-.182-.214-.182h-.518a.207.207 0 0 0-.213.212v.03c.122.76.61 1.305 1.615 1.457v.729c0 .121.092.213.244.243h.457c.122 0 .213-.092.244-.243v-.729c.914-.151 1.523-.789 1.523-1.608"
    ></path>
    <path
      fill="#fff"
      strokeWidth="0.5"
      d="M6.446 12.249c-2.377-.85-3.596-3.49-2.712-5.827a4.5 4.5 0 0 1 2.712-2.701c.122-.06.183-.152.183-.304v-.425c0-.12-.061-.212-.183-.242-.03 0-.091 0-.122.03a5.45 5.45 0 0 0-3.565 6.859 5.47 5.47 0 0 0 3.565 3.55c.122.061.244 0 .274-.121.03-.03.03-.061.03-.121v-.425c0-.091-.09-.212-.182-.273m3.23-9.468c-.122-.062-.244 0-.274.12-.03.031-.03.062-.03.122v.425c0 .122.09.243.182.304 2.377.85 3.596 3.49 2.712 5.826a4.5 4.5 0 0 1-2.712 2.701c-.122.06-.182.152-.182.304v.424c0 .122.06.213.182.243.03 0 .092 0 .122-.03a5.447 5.447 0 0 0 3.565-6.858A5.51 5.51 0 0 0 9.676 2.78"
    ></path>
  </svg>
);
