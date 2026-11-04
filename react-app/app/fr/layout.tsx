import HeaderFr from "@/components/locale/HeaderFr";
import SkipLink from "@/components/SkipLink";
import FooterFr from "@/components/locale/FooterFr";
import BodyExtrasFr from "@/components/locale/BodyExtrasFr";
import Sep from "@/components/Sep";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink text="Aller au contenu principal" />
      <HeaderFr />
      {children}
      <Sep />
      <FooterFr />
      <BodyExtrasFr />
    </>
  );
}
