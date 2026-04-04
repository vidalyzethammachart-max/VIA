import { Link } from "react-router-dom";

import Logo from "../assets/logo.png";
import ProfileDropdown from "./ProfileDropdown";
import { useTheme } from "../theme/ThemeProvider";

type MainNavbarProps = {
  title?: string;
  subtitle?: string;
};

export default function MainNavbar({
  title = "ประเมินและวิเคราะห์วิดีโออัจฉริยะ",
  subtitle = "ระบบประเมินคุณภาพสื่อดิจิทัลด้านเทคนิคเพื่อการศึกษา",
}: MainNavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header
      className={`sticky top-0 z-20 border-b backdrop-blur ${
        isDark
          ? "border-slate-800 bg-slate-950/90"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="w-full px-4 py-4">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Go to home" className="ui-hover-button inline-flex rounded-md">
            <img src={Logo} alt="VIA Logo" className="h-10 w-auto rounded-md" />
          </Link>

          <div className="flex flex-col">
            <span className={`text-xs font-semibold tracking-wide ${isDark ? "text-white" : "text-primary"}`}>
              Video Intelligence &amp; Analytics
            </span>
            <h1
              className={`text-lg font-semibold md:text-xl ${
                isDark ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {title}
            </h1>
            <p
              className={`text-xs md:text-sm ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {subtitle}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="ui-hover-button inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <>
                  <span>Light</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v2.25M12 18.75V21M4.97 4.97l1.59 1.59M17.44 17.44l1.59 1.59M3 12h2.25M18.75 12H21M4.97 19.03l1.59-1.59M17.44 6.56l1.59-1.59M15.75 12A3.75 3.75 0 1112 8.25 3.75 3.75 0 0115.75 12z"
                    />
                  </svg>
                </>
              ) : (
                <>
                  <span>Dark</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12.79A9 9 0 1111.21 3c-.08.56-.12 1.13-.12 1.71a9 9 0 009.91 8.08z"
                    />
                  </svg>
                </>
              )}
            </button>

            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
