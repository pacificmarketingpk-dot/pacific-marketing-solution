import type { Metadata } from "next";
import Script from "next/script";
import InteractionRoot from "@/components/InteractionRoot";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pacificmarketingsolution.com"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

// Shared boilerplate ported verbatim from the legacy site's <head> (GTM/GA/CookieYes/Meta
// Pixel, theme + i18n init, nav active-state). Phase 4 of the migration replaces the DOM-query
// based bits (nav-here, mega menu, theme toggle) with real React state; this keeps tracking and
// behavior 100% intact for Phases 1-3.
// NOTE on <html lang>: Next.js only lets the single true root layout render <html>/<body>,
// so this tag can't statically vary per locale route the way the legacy site's per-file
// <html lang="xx" dir="..."> did. The pms-i18n-redirect script below already corrects
// document.documentElement's lang/dir/data-lang the instant it runs (before paint, via
// beforeInteractive) based on the URL — which is the same mechanism the legacy site relied on
// for any non-prefixed/redirected visit. The only regression versus the old per-file static
// HTML is for a crawler that reads raw pre-JS HTML on a locale page; all major search engines
// render JS before indexing, so this is a deliberate, documented trade-off, not an oversight.
export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        {/* CookieYes consent banner — must load first, above GTM/GA (see project README) */}
        <Script
          id="cookieyes"
          src="https://cdn-cookieyes.com/client_data/ef98d9d2e2b1f5f8eb551a4d/script.js"
          strategy="beforeInteractive"
        />
        <link rel="preconnect" href="https://cdn-cookieyes.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/plus-jakarta-sans-latin-400-normal.woff2" />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/plus-jakarta-sans-latin-800-normal.woff2" />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/plus-jakarta-sans-latin-500-normal.woff2" />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href="/fonts/plus-jakarta-sans-latin-700-normal.woff2" />
        <link rel="sitemap" type="application/xml" title="Sitemap" href="https://pacificmarketingsolution.com/sitemap.xml" />
      </head>
      <body>
        {/* Facebook Pixel (noscript fallback) */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height={1}
            width={1}
            style={{ display: "none" }}
            alt=""
            src="https://www.facebook.com/tr?id=29254552507470074&ev=PageView&noscript=1"
          />
        </noscript>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            title="Google Tag Manager"
            src="https://www.googletagmanager.com/ns.html?id=GTM-P96Q7WJ7"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Live region for AccessibilityAnnouncer's pmsSay() announcements (page-change, motion
            toggle, a11y-panel setting changes) — identical markup on every locale, unlike the
            skip link below, so it lives here once rather than per-locale. Restored from the
            legacy site's <body> top; Phase 1-3's convert_page.py captured only <header>/<main>
            and missed this (it sits between them and the GTM noscript block). */}
        <div id="a11yLive" className="sr-only" role="status" aria-live="polite" aria-atomic="true" />

        <Script
          id="ga-gtag-src"
          src="https://www.googletagmanager.com/gtag/js?id=G-Q9CBL5LJ90"
          strategy="beforeInteractive"
        />
        <Script id="ga-gtag-config" strategy="beforeInteractive">
          {"\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n\n  gtag('config', 'G-Q9CBL5LJ90');\n"}
        </Script>
        <Script id="pms-theme-init" strategy="beforeInteractive">
          {"(function(){var t=\"dark\";try{var v=localStorage.getItem(\"pms-theme\");if(v===\"light\"||v===\"dark\")t=v}catch(e){}document.documentElement.setAttribute(\"data-theme\",t);try{if(localStorage.getItem(\"pms-motion\")===\"reduce\")document.documentElement.setAttribute(\"data-motion\",\"reduce\");var a=JSON.parse(localStorage.getItem(\"pms-a11y\")||\"{}\");for(var k in a)if(/^[a-z]{2,8}$/.test(k)&&/^[0-9a-z]{1,3}$/.test(String(a[k])))document.documentElement.setAttribute(\"data-a11y-\"+k,a[k])}catch(e){}})()"}
        </Script>
        <Script id="pms-i18n-redirect" strategy="beforeInteractive">
          {"(function(){try{var d=document.documentElement,A=[\"en\",\"fr\",\"de\",\"ar\",\"zh-CN\",\"ja\",\"es-MX\",\"es-ES\",\"pt-PT\"],low={};A.forEach(function(c){low[c.toLowerCase()]=c});\nvar PF={\"fr\":\"fr\",\"de\":\"de\",\"ar\":\"ar\",\"zh\":\"zh-CN\",\"ja\":\"ja\",\"es-mx\":\"es-MX\",\"es-es\":\"es-ES\",\"pt-pt\":\"pt-PT\"},LP={\"fr\":\"fr\",\"de\":\"de\",\"ar\":\"ar\",\"zh-CN\":\"zh\",\"ja\":\"ja\",\"es-MX\":\"es-mx\",\"es-ES\":\"es-es\",\"pt-PT\":\"pt-pt\"},LR=[\"\", \"services\", \"services/ai-automation-crm\", \"services/ai-chatbots-voice-agents\", \"services/performance-marketing-funnels\", \"services/social-media-management\", \"services/seo-aeo-geo\", \"services/content-creative-video\", \"services/websites-digital-products\", \"services/white-label-services\", \"services/ai-analytics-data-intelligence\", \"services/saas-custom-software-development\", \"services/api-systems-integration\", \"services/cloud-devops-infrastructure\", \"work\", \"about\", \"contact\", \"glossary\"];\nfunction map(l){l=String(l||\"\").toLowerCase().replace(\"_\",\"-\");var p=l.split(\"-\")[0];if(p===\"en\")return\"en\";if(p===\"fr\"||p===\"de\"||p===\"ar\"||p===\"ja\")return p;if(p===\"zh\")return/^zh(-(cn|sg|hans.*))?$/.test(l)?\"zh-CN\":null;if(p===\"es\")return(l===\"es\"||l===\"es-es\")?\"es-ES\":\"es-MX\";if(p===\"pt\")return(l===\"pt\"||l===\"pt-pt\")?\"pt-PT\":null;return null}\nvar segs=location.pathname.split(\"/\").filter(Boolean),pre=segs[0]?PF[segs[0].toLowerCase()]:null,L=null;\nif(pre){L=pre}else{\n var m=location.search.match(/[?&]lang=([A-Za-z_-]+)/);\n if(m&&low[m[1].toLowerCase().replace(\"_\",\"-\")]){L=low[m[1].toLowerCase().replace(\"_\",\"-\")];try{localStorage.setItem(\"pms-lang\",L)}catch(e){}}\n if(!L){var sv=null;try{sv=localStorage.getItem(\"pms-lang\")}catch(e){}if(sv&&low[String(sv).toLowerCase()])L=low[String(sv).toLowerCase()]}\n L=L||\"en\";\n if(L!==\"en\"&&/^https?:$/.test(location.protocol)&&!/\\.github\\.io$/i.test(location.hostname)&&LR.indexOf(segs.join(\"/\"))>-1&&!/index\\.html$/.test(location.pathname)){var u=\"/\"+LP[L]+(segs.length?\"/\"+segs.join(\"/\")+\"/\":\"/\"),q=location.search.replace(/[?&]lang=[^&]*/,\"\").replace(/^&/,\"?\")+location.hash;setTimeout(function(){if(window.__pmsExists)window.__pmsExists(u,L,function(y){if(y)location.replace(u+q)})},0)}}\nwindow.__pmsExists=function(u,code,cb){var done=false,fin=function(y){if(!done){done=true;cb(y)}},rx=new RegExp('<html[^>]*\\\\slang=\"'+code+'\"','i');\n try{fetch(u,{cache:\"no-store\"}).then(function(r){if(!r.ok||!r.body||!r.body.getReader)return r.ok?r.text().then(function(t){fin(rx.test(t.slice(0,4000)))}):fin(false);var rd=r.body.getReader(),dec=new TextDecoder();return rd.read().then(function(c){var t=c.value?dec.decode(c.value):\"\";try{rd.cancel()}catch(e){}fin(rx.test(t.slice(0,4000)))})}).catch(function(){fin(false)})}catch(e){fin(false)}};\nwindow.__pmsL=L;\nif(L!==\"en\"){d.setAttribute(\"lang\",L);d.setAttribute(\"dir\",L===\"ar\"?\"rtl\":\"ltr\");d.setAttribute(\"data-lang\",L);if(!pre){d.className+=\" i18n-wait\";setTimeout(function(){d.classList.remove(\"i18n-wait\")},2500)}}}catch(e){}})()"}
        </Script>
        <Script id="pms-later-helper" strategy="beforeInteractive">
          {"window.__pmsLater=function(f){(window.__pmsQ=window.__pmsQ||[]).push(f);if(window.__pmsGo)try{f()}catch(e){}};(function(){var go=function(){if(window.__pmsGo)return;window.__pmsGo=1;(window.__pmsQ||[]).forEach(function(f){try{f()}catch(e){}})};[\"pointerdown\",\"keydown\",\"scroll\",\"touchstart\",\"mousemove\"].forEach(function(e){addEventListener(e,go,{once:true,passive:true})});addEventListener(\"pagehide\",go,{once:true});addEventListener(\"visibilitychange\",function(){if(document.visibilityState===\"hidden\")go()});addEventListener(\"load\",function(){setTimeout(go,2000)})})();"}
        </Script>

        {children}

        {/* Phase 4: real React replacements for the legacy app.js router + UI widgets. Mounted
            once here since every DOM hook they attach to (#mega, #mnav, #themeToggle, #sp, #wd,
            #bm, .burger, #langBtn/#langMenu) is identical across every locale's Header/Footer. */}
        <InteractionRoot />

        <Script id="pms-gtm-loader" strategy="afterInteractive">
          {"window.dataLayer=window.dataLayer||[];dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});__pmsLater(function(){var j=document.createElement('script');j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id=GTM-P96Q7WJ7';document.head.appendChild(j)});"}
        </Script>
        <Script id="pms-ghpages-asset-fix" strategy="afterInteractive">
          {"var ASSET=(function(){try{var k={services:1,work:1,about:1,insights:1,contact:1,glossary:1,\"privacy-policy\":1,\"terms-of-service\":1,privacy:1,terms:1},s=location.pathname.split(\"/\").filter(Boolean);if(/\\.github\\.io$/i.test(location.hostname)&&s.length&&!k[s[0]]&&s[0].indexOf(\".\")<0)return \"/\"+s[0]}catch(e){}return \"\"})();if(ASSET)document.addEventListener(\"DOMContentLoaded\",function(){[].forEach.call(document.querySelectorAll('img[src^=\"/images/\"]'),function(i){i.src=ASSET+i.getAttribute(\"src\")})});"}
        </Script>
        <Script src="/assets/owner-info.js" strategy="afterInteractive" />
        <Script src="/assets/app.f8a01924c1.js" strategy="afterInteractive" />
        <Script id="pl-boot" strategy="afterInteractive">
          {"(function(d){try{if(sessionStorage.getItem(\"pms-intro\")===\"1\"||matchMedia(\"(prefers-reduced-motion:reduce)\").matches||(navigator.connection&&navigator.connection.saveData)||/bot|crawl|spider|lighthouse/i.test(navigator.userAgent))return}catch(e){}d.classList.add(\"pl\");setTimeout(function(){d.classList.remove(\"pl\")},3500)})(document.documentElement)"}
        </Script>
        {/* nav-here-js removed — replaced by the <NavHere> component inside <InteractionRoot>,
            which re-runs the same matching logic on every client-side route change via
            usePathname(), instead of only once on DOMContentLoaded. */}
        <Script id="pms-apollo" strategy="afterInteractive">
          {"function initApollo(){var n=Math.random().toString(36).substring(7),o=document.createElement(\"script\");\no.src=\"https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=\"+n,o.async=!0,o.defer=!0,\no.onload=function(){window.trackingFunctions.onLoad({appId:\"6acab29ee2b5e00014a511b5\"})},\ndocument.head.appendChild(o)}__pmsLater(initApollo);"}
        </Script>
        <Script id="pms-fb-pixel" strategy="afterInteractive">
          {"\n!function(f,b,e,v,n,t,s)\n{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};\nif(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\nn.queue=[];__pmsLater(function(){t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];\ns.parentNode.insertBefore(t,s)})}(window, document,'script',\n'https://connect.facebook.net/en_US/fbevents.js');\nfbq('init', '29254552507470074');\nfbq('track', 'PageView');\n(function(h,l){var p=l.pathname,w=function(m){var o=h[m];h[m]=function(){var r=o.apply(this,arguments);if(l.pathname!==p){p=l.pathname;fbq('track','PageView')}return r}};w('pushState');w('replaceState');addEventListener('popstate',function(){if(l.pathname!==p){p=l.pathname;fbq('track','PageView')}})})(history,location);\n"}
        </Script>
      </body>
    </html>
  );
}
