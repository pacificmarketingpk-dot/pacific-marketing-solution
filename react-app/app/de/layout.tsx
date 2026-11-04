import HeaderDe from "@/components/locale/HeaderDe";
import SkipLink from "@/components/SkipLink";
import FooterDe from "@/components/locale/FooterDe";
import BodyExtrasDe from "@/components/locale/BodyExtrasDe";
import Sep from "@/components/Sep";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink text="Zum Hauptinhalt springen" />
      <HeaderDe />
      {children}
      <Sep />
      <FooterDe />
      <BodyExtrasDe />
    </>
  );
}
