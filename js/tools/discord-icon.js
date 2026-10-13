const form = document.getElementById("icon-form");
const input = document.getElementById("invite-input");
const errorBox = document.getElementById("error");
const result = document.getElementById("result");
const icon = document.getElementById("icon");
const iconLink = document.getElementById("icon-link");

/** Accepts "discord.gg/abc", "https://discord.com/invite/abc?x=1", or just "abc". */
function extractInviteCode(value) {
    const cleaned = value.trim().split(/[?#]/)[0].replace(/\/+$/, "");
    return cleaned.split("/").pop();
}

function showError(message) {
    result.hidden = true;
    errorBox.textContent = message;
    errorBox.hidden = false;
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.hidden = true;

    const code = extractInviteCode(input.value);
    if (!code) return showError("Please enter a valid Discord invite link.");

    try {
        const response = await fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(code)}`);
        if (!response.ok) return showError("Invite not found. Please check the link.");

        const { guild } = await response.json();
        if (!guild?.icon) return showError("This server has no icon.");

        const url = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=512`;
        icon.src = url;
        iconLink.href = url;
        iconLink.textContent = url;
        result.hidden = false;
    } catch (error) {
        console.error(error);
        showError("Could not reach Discord. Please try again later.");
    }
});
