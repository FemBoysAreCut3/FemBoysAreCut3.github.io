/** Animated browser tab title: each character "spins" briefly before it locks in. */
const FRAMES = ["-", "+", "|", "/", "-", "+", "|"];
const FRAME_DELAY_MS = 80;

export function startTitleAnimation(text) {
    let index = 0;
    let frame = 0;

    function tick() {
        const locked = text.slice(0, index);
        if (frame < FRAMES.length) {
            document.title = locked + FRAMES[frame];
            frame++;
        } else {
            index++;
            frame = 0;
            document.title = text.slice(0, index);
            if (index >= text.length) index = 0;
        }
        setTimeout(tick, FRAME_DELAY_MS);
    }

    tick();
}
