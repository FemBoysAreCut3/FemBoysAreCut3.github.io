
function el(tag, { className, text, attrs } = {}) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    for (const [key, value] of Object.entries(attrs ?? {})) node.setAttribute(key, value);
    return node;
}

function externalLink(label, url, className) {
    return el("a", {
        className,
        text: label,
        attrs: { href: url, target: "_blank", rel: "noopener noreferrer" },
    });
}

function faviconUrl({ icon, iconDomain, url }) {
    if (icon) return icon;
    const domain = iconDomain ?? new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

export function renderSocialLinks(container, links) {
    for (const link of links) {
        const { label, url } = link;
        const anchor = el("a", {
            className: "social-link",
            attrs: { href: url, target: "_blank", rel: "noopener noreferrer", "data-bar-surface": "", "data-bar-shadow": "" },
        });

        const icon = el("img", {
            className: "social-link__icon",
            attrs: { src: faviconUrl(link), alt: "", width: "28", height: "28", loading: "lazy" },
        });
        icon.addEventListener("error", () => {
            const fallback = el("span", {
                className: "social-link__icon social-link__icon--fallback",
                text: label[0],
                attrs: { "aria-hidden": "true" },
            });
            icon.replaceWith(fallback);
        });

        anchor.append(icon, el("span", { className: "social-link__label", text: label }));
        const item = el("li");
        item.appendChild(anchor);
        container.appendChild(item);
    }
}

export function renderPages(container, sections) {
    for (const section of sections) {
        const page = el("section", { className: "page", attrs: { id: section.id, "data-page": "" } });
        page.appendChild(el("h2", { className: "page__title", text: section.title, attrs: { "data-bar-surface": "" } }));

        const grid = el("ul", { className: "download-grid" });
        for (const item of section.items) {
            const card = el("li", { className: "download-card", attrs: { "data-bar-surface": "" } });
            card.appendChild(externalLink(item.title, item.url, "download-card__link"));
            if (item.description) {
                card.appendChild(el("p", { className: "download-card__description", text: item.description }));
            }
            grid.appendChild(card);
        }
        page.appendChild(grid);
        container.appendChild(page);
    }
}

function renderDropdown(label, links) {
    const item = el("li", { className: "nav-item dropdown" });
    const toggle = el("button", {
        className: "dropdown__toggle",
        text: label,
        attrs: { type: "button", "aria-haspopup": "true", "aria-expanded": "false" },
    });
    const menu = el("ul", { className: "dropdown__menu", attrs: { "data-bar-surface": "" } });
    for (const link of links) {
        const li = el("li");
        li.appendChild(link);
        menu.appendChild(li);
    }
    item.append(toggle, menu);
    return item;
}

export function renderNav(nav, sections, toolsMenu) {
    const list = el("ul", { className: "main-nav__list" });

    const home = el("li", { className: "nav-item" });
    home.appendChild(el("a", { className: "nav-link", text: "Home", attrs: { href: "#home" } }));
    list.appendChild(home);

    const downloadLinks = sections.map((s) => el("a", { text: s.title, attrs: { href: `#${s.id}` } }));
    list.appendChild(renderDropdown("Downloads", downloadLinks));

    if (toolsMenu.length) {
        const toolLinks = toolsMenu.map((t) =>
            t.external === false
                ? el("a", { text: t.label, attrs: { href: t.url } })
                : externalLink(t.label, t.url)
        );
        list.appendChild(renderDropdown("Tools", toolLinks));
    }

    nav.appendChild(list);
}
