import { createMusic } from "./music.js";

export function initOverlay({ overlay, button, site, music }) {
    const player = music && music.playlist ? createMusic(music) : null;

    button.addEventListener("click", () => {
        overlay.classList.add("is-hidden");
        site.classList.remove("is-hidden");
        if (player) player.play();
    });
}
