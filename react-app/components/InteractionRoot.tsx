"use client";

import LinkInterceptor from "./LinkInterceptor";
import NavHere from "./NavHere";
import MegaMenu from "./MegaMenu";
import MobileNav from "./MobileNav";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import ScrollProgress from "./ScrollProgress";
import AnchorScroll from "./AnchorScroll";
import WorkDetail from "./WorkDetail";
import BookingModal from "./BookingModal";
import ClickAnalytics from "./ClickAnalytics";
import VideoTestimonialPlay from "./VideoTestimonialPlay";
import MapEmbedLazy from "./MapEmbedLazy";
import LeadPlanForm from "./LeadPlanForm";
import SiteForm from "./SiteForm";
import AccessibilityAnnouncer from "./AccessibilityAnnouncer";

// Single mount point for every React replacement of the legacy app.f8a01924c1.js behaviors.
// Mounted once in the true root layout — every DOM hook these components attach to (#mega,
// #mnav, #themeToggle, #langBtn/#langMenu, #sp, #wd, #bm, .burger) is identical across all 8
// locale Header/Footer variants, so one mount covers every page regardless of locale.
export default function InteractionRoot() {
  return (
    <>
      <LinkInterceptor />
      <NavHere />
      <MegaMenu />
      <MobileNav />
      <ThemeToggle />
      <LanguageSwitcher />
      <ScrollProgress />
      <AnchorScroll />
      <WorkDetail />
      <BookingModal />
      <ClickAnalytics />
      <VideoTestimonialPlay />
      <MapEmbedLazy />
      <LeadPlanForm />
      <SiteForm />
      <AccessibilityAnnouncer />
    </>
  );
}
