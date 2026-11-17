export const site = {
    name: "FemBoysAreCut3",
    subtitle: "",
    profileImage: "https://avatars.githubusercontent.com/u/136980449?v=4",
    music: {
        playlist: "PLcboDiX78pMxN6JaPVinUkboZxwINld7J",
        volume: 60,
    },
};

export const socialLinks = [
    { label: "YouTube", url: "https://youtube.com/@femboysarereallycute", iconDomain: "youtube.com" },
    { label: "Discord", url: "https://dsc.gg/rena", iconDomain: "discord.com" },
    { label: "PlanetMinecraft", url: "https://www.planetminecraft.com/member/femboysarecut3/", iconDomain: "planetminecraft.com" },
    { label: "GitHub", url: "https://github.com/FemBoysAreCut3", iconDomain: "github.com" },
];

export const toolsMenu = [
    { label: "Discord Server Icon Downloader", url: "#discord-icon", external: false },
    { label: "YouTube MP4/MP3 Downloader", url: "https://notube.cc/", external: false },
    { label: "Free Web Proxy", url: "https://proxygratis.id/de", external: false },
    { label: "Free VM in Browser", url: "https://www.apponfly.com/", external: false },
    { label: "Best IP Logger", url: "https://github.com/FemBoysAreCut3/Best-IP-Logger", external: false },
];

const frameFiles = (prefix, count) =>
    Array.from({ length: count }, (_, i) => `assets/frames/${prefix}-${i + 1}.webp`);

export const frames = {
    intervalMs: 250,
    background: frameFiles("bg", 4),
    bars: frameFiles("bars", 4),
};
