import { useTheme } from "../theme/ThemeProvider";

export default function Footer() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <footer className={`${isDark ? "bg-slate-950 text-slate-100" : "bg-[#04418b] text-white"} mt-auto transition-colors`}>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-lg font-bold">VIA :Video Intelligence &amp; Analytics</h3>
            <p className={`text-sm font-bold leading-relaxed ${isDark ? "text-slate-300" : "text-gray-300"}`}>
              ประเมินและวิเคราะห์วิดีโออัจฉริยะ
            </p>
            <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-gray-300"}`}>
              ระบบประเมินคุณภาพสื่อดิจิทัลด้านเทคนิคเพื่อการศึกษา
            </p>
          </div>

          <div />

          <div>
            <h3 className="mb-4 text-lg font-bold">ติดต่อเรา</h3>
            <ul className={`space-y-2 text-sm ${isDark ? "text-slate-300" : "text-gray-300"}`}>
              <li className="flex items-start gap-2">
                <span>📍</span>
                <span>
                  Mahidol University International College (MUIC)
                  <br />
                  Phutthamonthon Sai 4 Road, Salaya, Nakhon Pathom,
                  <br />
                  73170, Thailand
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span>
                <span>Telephone:+66 2 700 5000 Ext.4337</span>
              </li>
              <li className="flex items-center gap-2">
                <span>✉️</span>
                <a href="mailto:info@via.ac.th">E-mail:thammachart.kan@mahidol.ac.th</a>
              </li>
            </ul>
          </div>
        </div>

        <div className={`mt-8 border-t pt-8 ${isDark ? "border-slate-800" : "border-white/20"}`}>
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-10 w-10 items-center justify-center rounded-full ${isDark ? "bg-slate-800" : "bg-white/10"}`}
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-10 w-10 items-center justify-center rounded-full ${isDark ? "bg-slate-800" : "bg-white/10"}`}
                aria-label="Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a
                href="https://line.me"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-10 w-10 items-center justify-center rounded-full ${isDark ? "bg-slate-800" : "bg-white/10"}`}
                aria-label="LINE"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
              </a>
            </div>

            <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-300"}`}>
              © {new Date().getFullYear()} VIA. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
