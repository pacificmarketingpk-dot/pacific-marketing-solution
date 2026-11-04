import HeaderJa from "@/components/locale/HeaderJa";
import SkipLink from "@/components/SkipLink";
import FooterJa from "@/components/locale/FooterJa";
import BodyExtrasJa from "@/components/locale/BodyExtrasJa";
import Sep from "@/components/Sep";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink text="メインコンテンツへ移動" />
      <HeaderJa />
      {children}
      <Sep />
      <FooterJa />
      <BodyExtrasJa />
    </>
  );
}
