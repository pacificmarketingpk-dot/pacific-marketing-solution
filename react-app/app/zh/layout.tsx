import HeaderZh from "@/components/locale/HeaderZh";
import SkipLink from "@/components/SkipLink";
import FooterZh from "@/components/locale/FooterZh";
import BodyExtrasZh from "@/components/locale/BodyExtrasZh";
import Sep from "@/components/Sep";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink text="跳到主要内容" />
      <HeaderZh />
      {children}
      <Sep />
      <FooterZh />
      <BodyExtrasZh />
    </>
  );
}
