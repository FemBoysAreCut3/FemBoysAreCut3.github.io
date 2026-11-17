const state = {
    config: null,
    started: false,
    groups: [],
};

function createLayers(container, urls) {
    return urls.map((url, index) => {
        const layer = document.createElement("div");
        layer.className = "frame-layer";
        layer.style.backgroundImage = `url("${url}")`;
        layer.style.opacity = index === 0 ? "1" : "0";
        container.appendChild(layer);
        return layer;
    });
}

function preload(url) {
    const image = new Image();
    image.src = url;
    return image.decode ? image.decode().catch(() => {}) : Promise.resolve();
}

function animate(layers, intervalMs) {
    const count = layers.length;
    if (count < 2) return;
    layers.forEach((layer, index) => {
        const animation = layer.animate(
            [
                { opacity: 1, offset: 0, easing: "step-end" },
                { opacity: 0, offset: 1 / count },
                { opacity: 0, offset: 1 },
            ],
            { duration: count * intervalMs, delay: index * intervalMs, iterations: Infinity }
        );
        animation.startTime = 0;
    });
}

function register(layers) {
    if (state.started) animate(layers, state.config.intervalMs);
    else state.groups.push(layers);
}

export function attachSurface(element) {
    if (!state.config || !state.config.bars.length) return;
    if (element.querySelector(":scope > .bar-frames--surface")) return;
    if (element.hasAttribute("data-bar-shadow")) {
        const shadow = document.createElement("div");
        shadow.className = "bar-frames bar-frames--shadow";
        shadow.setAttribute("aria-hidden", "true");
        element.appendChild(shadow);
        register(createLayers(shadow, state.config.bars));
    }
    const box = document.createElement("div");
    box.className = "bar-frames bar-frames--surface";
    box.setAttribute("aria-hidden", "true");
    element.appendChild(box);
    register(createLayers(box, state.config.bars));
}

export async function initFrames(config) {
    state.config = config;
    const { background, bars } = config;

    const backgroundBox = document.getElementById("bg-frames");
    if (backgroundBox && background.length) {
        register(createLayers(backgroundBox, background));
    }
    if (bars.length) {
        for (const box of document.querySelectorAll("[data-bar-frames]")) {
            register(createLayers(box, bars));
        }
        for (const element of document.querySelectorAll("[data-bar-surface]")) {
            attachSurface(element);
        }
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    await Promise.all([...background, ...bars].map(preload));
    state.started = true;
    for (const layers of state.groups) animate(layers, config.intervalMs);
    state.groups = [];
}
