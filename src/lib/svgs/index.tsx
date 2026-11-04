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
      d="M12 7V12M12 12V17M12 12H7M12 12H17"
      stroke="currentColor"
      strokeWidth="2"
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
