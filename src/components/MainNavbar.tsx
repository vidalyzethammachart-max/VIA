import Logo from "../assets/logo.png";
import ProfileDropdown from "./ProfileDropdown";

type MainNavbarProps = {
  title?: string;
  subtitle?: string;
};

export default function MainNavbar({
  title = "ประเมินและวิเคราะห์วิดีโออัจฉริยะ",
  subtitle = "ระบบประเมินคุณภาพสื่อดิจิทัลด้านเทคนิคเพื่อการศึกษา",
}: MainNavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <div className="w-full px-4 py-4">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="VIA Logo" className="h-10 w-auto rounded-md" />

          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-wide text-primary">
              Video Intelligence &amp; Analytics
            </span>
            <h1 className="text-lg font-semibold text-slate-900 md:text-xl">{title}</h1>
            <p className="text-xs text-slate-500 md:text-sm">{subtitle}</p>
          </div>

          <div className="ml-auto">
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
