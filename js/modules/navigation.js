/** Hash-based page switching and dropdown behaviour. */
export function initNavigation(nav) {
    const pages = [...document.querySelectorAll("[data-page]")];
    const ids = new Set(pages.map((page) => page.id));

    function showPage() {
        const id = location.hash.slice(1);
        const active = ids.has(id) ? id : "home";
        for (const page of pages) page.classList.toggle("is-active", page.id === active);
        window.scrollTo({ top: 0 });
    }

    function closeDropdowns(except) {
        for (const dropdown of nav.querySelectorAll(".dropdown")) {
            if (dropdown === except) continue;
            dropdown.classList.remove("is-open");
            dropdown.querySelector(".dropdown__toggle").setAttribute("aria-expanded", "false");
        }
    }

    nav.addEventListener("click", (event) => {
        const toggle = event.target.closest(".dropdown__toggle");
        if (toggle) {
            const dropdown = toggle.parentElement;
            const open = dropdown.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(open));
            closeDropdowns(dropdown);
        } else if (event.target.closest("a")) {
            closeDropdowns();
        }
    });

    document.addEventListener("click", (event) => {
        if (!nav.contains(event.target)) closeDropdowns();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeDropdowns();
    });

    window.addEventListener("hashchange", showPage);
    showPage();
}
