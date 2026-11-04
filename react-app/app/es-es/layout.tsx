import HeaderEsEs from "@/components/locale/HeaderEsEs";
import SkipLink from "@/components/SkipLink";
import FooterEsEs from "@/components/locale/FooterEsEs";
import BodyExtrasEsEs from "@/components/locale/BodyExtrasEsEs";
import Sep from "@/components/Sep";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink text="Saltar al contenido principal" />
      <HeaderEsEs />
      {children}
      <Sep />
      <FooterEsEs />
      <BodyExtrasEsEs />
    </>
  );
}
