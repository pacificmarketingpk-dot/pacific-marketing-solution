import HeaderEsMx from "@/components/locale/HeaderEsMx";
import SkipLink from "@/components/SkipLink";
import FooterEsMx from "@/components/locale/FooterEsMx";
import BodyExtrasEsMx from "@/components/locale/BodyExtrasEsMx";
import Sep from "@/components/Sep";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink text="Saltar al contenido principal" />
      <HeaderEsMx />
      {children}
      <Sep />
      <FooterEsMx />
      <BodyExtrasEsMx />
    </>
  );
}
