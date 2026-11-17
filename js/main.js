import { site, socialLinks, toolsMenu, frames } from "./data/site.js";
import { sections } from "./data/downloads.js";
import { initFrames } from "./modules/frames.js";
import { initOverlay } from "./modules/overlay.js";
import { initNavigation } from "./modules/navigation.js";
import { renderNav, renderPages, renderSocialLinks } from "./modules/render.js";
import { startTitleAnimation } from "./modules/title-animation.js";

const $ = (id) => document.getElementById(id);

$("site-title-text").textContent = site.name;
const logo = $("site-logo");
logo.addEventListener("error", () => document.body.classList.add("no-logo"));
if (logo.complete && logo.naturalWidth === 0) document.body.classList.add("no-logo");
$("site-subtitle").textContent = site.subtitle;
$("about-avatar").src = site.profileImage;
$("footer-year").textContent = new Date().getFullYear();

renderSocialLinks($("social-links"), socialLinks);
renderPages(document.querySelector(".site-main"), sections);
renderNav($("main-nav"), sections, toolsMenu);

initNavigation($("main-nav"));
initFrames(frames);
initOverlay({
    overlay: $("overlay"),
    button: $("enter-button"),
    site: $("site"),
    music: site.music,
});
startTitleAnimation(`<<>> | ${site.name} | <<>>`);
