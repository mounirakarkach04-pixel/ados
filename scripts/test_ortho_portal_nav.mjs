// Zero-dependency source regression for the existing ORTHO direct portal navigation.
// Run: node --test scripts/test_ortho_portal_nav.mjs
// Review-only: this never contacts the network or changes production assets.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const html = readFileSync(new URL("../piga-ortho-3d/direct.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../piga-ortho-3d/direct.css", import.meta.url), "utf8");

function inspect(html,css){
 const matches=[...html.matchAll(/<nav\b[^>]*data-piga-site-nav-v1="orthodontics-direct"[^>]*>[\s\S]*?<\/nav>/g)];
 const nav=matches[0]?.[0]??"";
 const links=[...nav.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(m=>({attrs:m[1],label:m[2].replace(/<[^>]*>/g,"").replaceAll("&amp;","&").trim()}));
 const hrefs=links.map(l=>l.attrs.match(/\bhref="([^"]+)"/)?.[1]??"");
 const expected=["https://pigapocket.com/","https://pigapocket.com/showroom","https://pigapocket.com/forschung-apps","https://pigapocket.com/#produkte"];
 return {
  singlePortalNav:matches.length===1,
  navBeforeHero:nav.length>0&&html.indexOf(nav)<html.indexOf('<section class="hero">'),
  accessibleLandmark:/\baria-label="PIGA Gesamtportal"/.test(nav),
  exactlyFourUniqueLinks:links.length===4&&new Set(hrefs).size===4,
  expectedDestinations:JSON.stringify(hrefs)===JSON.stringify(expected),
  meaningfulLabels:links.length===4&&links.every(l=>l.label.length>=4),
  canonicalHttps:hrefs.length===4&&hrefs.every(h=>h.startsWith("https://pigapocket.com/")),
  noInlineEventHandlers:!/\bon[a-z]+\s*=/i.test(nav),
  noInlineScriptOrStyle:!/<script\b|<style\b|\bstyle\s*=/i.test(nav),
  cspFailClosed:/Content-Security-Policy"[^>]*default-src 'none'; script-src 'self'; worker-src 'self'; style-src 'self';[^"]*connect-src 'none'/.test(html),
  responsiveGrid:/\.more-links\s*\{[^}]*display:grid;[^}]*grid-template-columns:repeat\(auto-fit,/.test(css),
  keyboardFocusVisible:/\.more-links a:focus-visible\s*\{\s*outline:/.test(css),
  existingAppPreserved:['id="tabs"','id="p-overview"','id="p-studio"','id="exportTop"'].every(s=>html.includes(s))
 };
}

const checks = inspect(html, css);
for (const [name, passed] of Object.entries(checks)) {
  test(`ORTHO navigation: ${name}`, () => assert.equal(passed, true));
}

// Negative controls prove that these checks reject concrete regressions.
const mutations = [
  ["missing nav", html.replace('data-piga-site-nav-v1="orthodontics-direct"', 'data-piga-site-nav-v1="missing"'), css, "singlePortalNav"],
  ["wrong destination", html.replace("https://pigapocket.com/showroom", "https://example.invalid/showroom"), css, "expectedDestinations"],
  ["insecure HTTP", html.replace("https://pigapocket.com/showroom", "http://pigapocket.com/showroom"), css, "canonicalHttps"],
  ["inline event handler", html.replace('<a href="https://pigapocket.com/">', '<a onclick="alert(1)" href="https://pigapocket.com/">'), css, "noInlineEventHandlers"],
  ["missing focus", html, css.replace(".more-links a:focus-visible", ".more-links a:focus-disabled"), "keyboardFocusVisible"],
  ["relaxed CSP", html.replace("connect-src 'none'", "connect-src *"), css, "cspFailClosed"],
];
for (const [name, mutatedHtml, mutatedCss, check] of mutations) {
  test(`ORTHO rejects: ${name}`, () => assert.equal(inspect(mutatedHtml, mutatedCss)[check], false));
}
