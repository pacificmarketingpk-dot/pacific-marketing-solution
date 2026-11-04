import HeaderAr from "@/components/locale/HeaderAr";
import SkipLink from "@/components/SkipLink";
import FooterAr from "@/components/locale/FooterAr";
import BodyExtrasAr from "@/components/locale/BodyExtrasAr";
import Sep from "@/components/Sep";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink text="انتقل إلى المحتوى الرئيسي" />
      <HeaderAr />
      {children}
      <Sep />
      <FooterAr />
      <BodyExtrasAr />
    </>
  );
}
