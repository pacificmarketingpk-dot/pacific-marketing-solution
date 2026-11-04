import HeaderPtPt from "@/components/locale/HeaderPtPt";
import SkipLink from "@/components/SkipLink";
import FooterPtPt from "@/components/locale/FooterPtPt";
import BodyExtrasPtPt from "@/components/locale/BodyExtrasPtPt";
import Sep from "@/components/Sep";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink text="Saltar para o conteúdo principal" />
      <HeaderPtPt />
      {children}
      <Sep />
      <FooterPtPt />
      <BodyExtrasPtPt />
    </>
  );
}
