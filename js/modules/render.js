/** Builds DOM from data. Uses textContent only (no innerHTML) so data can never inject markup. */

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

export function renderSocialLinks(container, links) {
    for (const { label, url } of links) {
        const item = el("li");
        item.appendChild(externalLink(label, url));
        container.appendChild(item);
    }
}

export function renderPages(container, sections) {
    for (const section of sections) {
        const page = el("section", { className: "page", attrs: { id: section.id, "data-page": "" } });
        page.appendChild(el("h2", { className: "page__title", text: section.title }));

        const grid = el("ul", { className: "download-grid" });
        for (const item of section.items) {
            const card = el("li", { className: "download-card" });
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
    const menu = el("ul", { className: "dropdown__menu" });
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
