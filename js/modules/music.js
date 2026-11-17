const PLAYING = 1;
const BUFFERING = 3;
const MAX_ERRORS_IN_A_ROW = 5;

function loadApi() {
    return new Promise((resolve, reject) => {
        if (window.YT && window.YT.Player) {
            resolve(window.YT);
            return;
        }
        const previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (typeof previous === "function") previous();
            resolve(window.YT);
        };
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export function createMusic({ playlist, volume = 60 }) {
    const listeners = new Set();
    let player = null;
    let ready = false;
    let started = false;
    let startedWithoutList = false;
    let wantsPlay = false;
    let errorsInARow = 0;
    let lastError = null;
    let apiFailed = false;

    const host = document.createElement("div");
    host.className = "music-player";
    host.setAttribute("aria-hidden", "true");
    const slot = document.createElement("div");
    host.appendChild(slot);
    document.body.appendChild(host);

    const notify = () => listeners.forEach((listener) => listener());

    function randomIndex(list) {
        return Math.floor(Math.random() * list.length);
    }

    function begin() {
        started = true;
        try {
            player.setLoop(true);
            player.setShuffle(true);
        } catch (error) {}
        const list = (player.getPlaylist && player.getPlaylist()) || [];
        if (list.length) {
            player.playVideoAt(randomIndex(list));
        } else {
            startedWithoutList = true;
            player.playVideo();
        }
    }

    function watchPlaylist() {
        let attempts = 0;
        const timer = setInterval(() => {
            attempts++;
            const list = player.getPlaylist && player.getPlaylist();
            if (list && list.length) {
                clearInterval(timer);
                try {
                    player.setLoop(true);
                    player.setShuffle(true);
                } catch (error) {}
                if (startedWithoutList) {
                    startedWithoutList = false;
                    const time = player.getCurrentTime ? player.getCurrentTime() : 0;
                    if (time < 5) player.playVideoAt(randomIndex(list));
                }
            } else if (attempts > 150) {
                clearInterval(timer);
            }
        }, 200);
    }

    loadApi()
        .then((YT) => {
            player = new YT.Player(slot, {
                width: "200",
                height: "200",
                playerVars: {
                    listType: "playlist",
                    list: playlist,
                    controls: 0,
                    playsinline: 1,
                    origin: window.location.origin,
                },
                events: {
                    onReady: () => {
                        ready = true;
                        console.log("[music] player ready");
                        player.setVolume(volume);
                        watchPlaylist();
                        if (wantsPlay) begin();
                    },
                    onStateChange: (event) => {
                        console.log("[music] state", event.data);
                        if (event.data === PLAYING) {
                            errorsInARow = 0;
                            lastError = null;
                        }
                        notify();
                    },
                    onError: (event) => {
                        console.error("YouTube player error:", event.data);
                        lastError = event.data;
                        notify();
                        errorsInARow++;
                        if (errorsInARow <= MAX_ERRORS_IN_A_ROW) player.nextVideo();
                    },
                },
            });
        })
        .catch((error) => {
            apiFailed = true;
            console.error("YouTube API could not be loaded:", error);
            notify();
        });

    setTimeout(() => {
        if (!ready && !apiFailed) {
            console.warn("[music] player not ready after 8s - YouTube may be blocked");
            apiFailed = true;
            notify();
        }
    }, 8000);

    return {
        play() {
            wantsPlay = true;
            if (!ready) return;
            if (started) player.playVideo();
            else begin();
        },
        pause() {
            wantsPlay = false;
            if (player && player.pauseVideo) player.pauseVideo();
        },
        isPlaying() {
            if (!player || !player.getPlayerState) return false;
            const stateCode = player.getPlayerState();
            return stateCode === PLAYING || stateCode === BUFFERING;
        },
        label() {
            if (apiFailed) return "Music: blocked";
            if (lastError !== null) return "Music: error " + lastError;
            if (!ready) return "Music: loading";
            return this.isPlaying() ? "Music: on" : "Music: off";
        },
        onChange(listener) {
            listeners.add(listener);
        },
    };
}
