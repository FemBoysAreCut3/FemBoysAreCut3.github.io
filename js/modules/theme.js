const STORAGE_KEY = "theme";
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function savedTheme() {
    try {
        const value = localStorage.getItem(STORAGE_KEY);
        return value === "light" || value === "dark" ? value : null;
    } catch {
        return null;
    }
}

function currentTheme() {
    return savedTheme() ?? (systemDark.matches ? "dark" : "light");
}

export function initTheme(button) {
    const root = document.documentElement;

    button.addEventListener("click", () => {
        const next = currentTheme() === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {}
    });
}
