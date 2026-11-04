import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sep from "@/components/Sep";
import BodyExtras from "@/components/BodyExtras";
import SkipLink from "@/components/SkipLink";

// English pages live at the site root (no /en/ prefix) — this route group only changes
// which Header/Footer/dialogs wrap them, not the URL.
export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink text="Skip to main content" />
      <Header />
      {children}
      <Sep />
      <Footer />
      <BodyExtras />
    </>
  );
}
