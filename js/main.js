import { site, socialLinks, toolsMenu } from "./data/site.js";
import { sections } from "./data/downloads.js";
import { initBackground } from "./modules/background.js";
import { initOverlay } from "./modules/overlay.js";
import { initNavigation } from "./modules/navigation.js";
import { renderNav, renderPages, renderSocialLinks } from "./modules/render.js";
import { startTitleAnimation } from "./modules/title-animation.js";

const $ = (id) => document.getElementById(id);

// Static text from config
$("site-title").textContent = site.name;
$("site-subtitle").textContent = site.subtitle;
$("about-avatar").src = site.profileImage;
$("footer-year").textContent = new Date().getFullYear();

// Generated content
renderSocialLinks($("social-links"), socialLinks);
renderPages(document.querySelector(".site-main"), sections);
renderNav($("main-nav"), sections, toolsMenu);

// Behaviour
initNavigation($("main-nav"));
initBackground($("bg-canvas"));
initOverlay({
    overlay: $("overlay"),
    button: $("enter-button"),
    site: $("site"),
    music: site.music,
});
startTitleAnimation(`<<>> | ${site.name} | <<>>`);
