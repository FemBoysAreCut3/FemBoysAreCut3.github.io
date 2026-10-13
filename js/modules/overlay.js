/** "Click here!" overlay: reveals the site and starts the background music. */
export function initOverlay({ overlay, button, site, music }) {
    let audio = null;

    if (music?.src) {
        audio = new Audio(music.src);
        audio.loop = true;
        audio.volume = music.volume ?? 0.6;
    }

    button.addEventListener("click", () => {
        overlay.classList.add("is-hidden");
        site.classList.remove("is-hidden");
        if (audio) {
            audio.play().catch((error) => console.error("Could not play music:", error));
            addMusicToggle(audio);
        }
    });
}

function addMusicToggle(audio) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "music-toggle";
    const update = () => {
        toggle.textContent = audio.paused ? "Music: off" : "Music: on";
        toggle.setAttribute("aria-pressed", String(!audio.paused));
    };
    toggle.addEventListener("click", () => {
        if (audio.paused) audio.play().catch(() => {});
        else audio.pause();
    });
    audio.addEventListener("play", update);
    audio.addEventListener("pause", update);
    update();
    document.body.appendChild(toggle);
}
