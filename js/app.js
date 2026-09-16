"use strict";

/* =========================================================
CAREER COMMAND CENTER
Vanilla JavaScript
No framework / no dependency
========================================================= */

const $ = (selector, parent = document) =>
parent.querySelector(selector);

const $$ = (selector, parent = document) =>
[...parent.querySelectorAll(selector)];

/* =========================================================
STORAGE
========================================================= */

const STORAGE_KEY = "career-command-center-v3";

const defaultState = {
onboarded: false,
onboardingStep: 0,

profile: {
    name: "",
    role: "",
    experience: "Fresher",
    location: ""
},

applications: [],

interviews: [],

skills: [
    {
        name: "HTML",
        level: 80
    },
    {
        name: "CSS",
        level: 75
    },
    {
        name: "JavaScript",
        level: 55
    }
],

offers: [],

theme: "midnight",

notifications: [
    {
        title: "Welcome",
        text: "Complete your profile to improve your career readiness."
    }
]

};

let state = loadState();

function loadState() {

try {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        return typeof structuredClone === "function"
            ? structuredClone(defaultState)
            : JSON.parse(JSON.stringify(defaultState));
    }

    return {
        ...defaultState,
        ...JSON.parse(saved),
        profile: {
            ...defaultState.profile,
            ...(JSON.parse(saved).profile || {})
        }
    };

} catch (error) {

    console.error("State loading error:", error);

    return JSON.parse(JSON.stringify(defaultState));
}

}

function saveState() {

try {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );

} catch (error) {

    console.error("State save error:", error);
}

}

/* =========================================================
GOOEY NAV
Vanilla port of the React GooeyNav particle effect,
adapted to the vertical sidebar navigation.
========================================================= */

const GOOEY = {
    animationTime: 600,
    particleCount: 14,
    particleDistances: [64, 8],
    particleR: 80,
    timeVariance: 300,
    colors: [1, 2, 3, 1, 2, 3, 1, 4]
};

let gooeyFilter = null;
let gooeyText = null;
let gooeyCurrent = null;
let gooeyLayer = null;
let gooeyGeometry = "";

function gooeyNoise(n = 1) {
    return n / 2 - Math.random() * n;
}

function gooeyXY(distance, pointIndex, totalPoints) {

    const angle =
        ((360 + gooeyNoise(8)) / totalPoints) *
        pointIndex *
        (Math.PI / 180);

    return [
        distance * Math.cos(angle),
        distance * Math.sin(angle)
    ];
}

function gooeyParticle(i, t, d, r) {

    const rotate = gooeyNoise(r / 10);

    return {
        start: gooeyXY(d[0], GOOEY.particleCount - i, GOOEY.particleCount),
        end: gooeyXY(d[1] + gooeyNoise(7), GOOEY.particleCount - i, GOOEY.particleCount),
        time: t,
        scale: 1 + gooeyNoise(0.2),
        color: GOOEY.colors[
            Math.floor(Math.random() * GOOEY.colors.length)
        ],
        rotate: rotate > 0
            ? (rotate + r / 20) * 10
            : (rotate - r / 20) * 10
    };
}

function gooeyMakeParticles(element) {

    const d = GOOEY.particleDistances;
    const r = GOOEY.particleR;

    const bubbleTime =
        GOOEY.animationTime * 2 + GOOEY.timeVariance;

    element.style.setProperty("--time", `${bubbleTime}ms`);

    for (let i = 0; i < GOOEY.particleCount; i++) {

        const t =
            GOOEY.animationTime * 2 +
            gooeyNoise(GOOEY.timeVariance * 2);

        const p = gooeyParticle(i, t, d, r);

        element.classList.remove("active");

        setTimeout(() => {

            const particle = document.createElement("span");
            const point = document.createElement("span");

            particle.classList.add("particle");
            particle.style.setProperty("--start-x", `${p.start[0]}px`);
            particle.style.setProperty("--start-y", `${p.start[1]}px`);
            particle.style.setProperty("--end-x", `${p.end[0]}px`);
            particle.style.setProperty("--end-y", `${p.end[1]}px`);
            particle.style.setProperty("--time", `${p.time}ms`);
            particle.style.setProperty("--scale", `${p.scale}`);
            particle.style.setProperty("--color", `var(--color-${p.color}, white)`);
            particle.style.setProperty("--rotate", `${p.rotate}deg`);

            point.classList.add("point");
            particle.appendChild(point);
            element.appendChild(particle);

            requestAnimationFrame(() =>
                element.classList.add("active")
            );

            setTimeout(() => {
                try {
                    element.removeChild(particle);
                } catch {
                    /* already removed */
                }
            }, t);

        }, 30);
    }
}

function gooeyUpdatePosition(element, container) {

    if (!element || !gooeyFilter || !container) {
        return;
    }

    /* Walk the offsetParent chain instead of using
       getBoundingClientRect(). The nav items run a slideInLeft
       entrance animation, and a rect read mid-animation includes
       that transform — which parked the pill 14px to the left of
       the item it was supposed to sit on. offsetLeft/offsetTop
       ignore transforms, so the pill always lands square. */

    let left = 0;
    let top = 0;
    let node = element;

    while (node && node !== container) {

        left += node.offsetLeft;
        top += node.offsetTop;

        node = node.offsetParent;
    }

    const styles = {
        left: `${left}px`,
        top: `${top}px`,
        width: `${element.offsetWidth}px`,
        height: `${element.offsetHeight}px`
    };

    const signature =
        styles.left + styles.top + styles.width + styles.height;

    if (signature === gooeyGeometry) {
        return;
    }

    gooeyGeometry = signature;

    Object.assign(gooeyFilter.style, styles);

    if (gooeyText) {
        Object.assign(gooeyText.style, styles);
    }
}

function gooeyMoveTo(element, burst) {

    const container = $("#sidebar");

    if (!container || !gooeyFilter || !element) {
        return;
    }

    const media = query =>
        typeof window.matchMedia === "function" &&
        window.matchMedia(query).matches;

    const reduced =
        media("(prefers-reduced-motion: reduce)") ||
        media("(max-width: 820px)");

    const changed = gooeyCurrent !== element;

    gooeyCurrent = element;

    gooeyUpdatePosition(element, container);

    if (gooeyText) {

        gooeyText.classList.add("active");

        /* Only replay the entrance when we actually move to a
           different item. Re-firing it on every reposition
           (resize, font load, observer tick) restarted the
           animation mid-flight and left the pill washed out. */
        if (changed) {
            gooeyText.classList.remove("entering");
            void gooeyText.offsetWidth;
            gooeyText.classList.add("entering");
        }
    }

    if (!changed) {
        return;
    }

    gooeyFilter
        .querySelectorAll(".particle")
        .forEach(particle => particle.remove());

    if (burst && !reduced) {
        gooeyMakeParticles(gooeyFilter);
    } else {
        gooeyFilter.classList.add("active");
    }
}

function gooeySync(burst) {

    const active =
        $("#sidebar .nav-item.active");

    if (!active) {
        return;
    }

    requestAnimationFrame(() =>
        gooeyMoveTo(active, burst)
    );
}

function initGooeyNav() {

    const container = $("#sidebar");

    if (!container) {
        return;
    }

    container.classList.add("gooey-nav-container");

    /* The blob backdrop is deliberately huge (inset: -260px) so
       particles never clip its edge. Left as a direct child of the
       scrollable sidebar that overflow grew the scroll area, which
       toggled a scrollbar, which changed the nav width, which
       repositioned the pill — an endless ResizeObserver loop that
       kept restarting the entrance animation. This wrapper clips
       it instead. */

    gooeyLayer = document.createElement("div");
    gooeyLayer.className = "gooey-layer";
    gooeyLayer.setAttribute("aria-hidden", "true");

    gooeyFilter = document.createElement("span");
    gooeyFilter.className = "effect filter";

    gooeyText = document.createElement("span");
    gooeyText.className = "effect pill";

    gooeyLayer.appendChild(gooeyFilter);
    gooeyLayer.appendChild(gooeyText);
    container.appendChild(gooeyLayer);

    if (typeof ResizeObserver === "function") {

        const observer =
            new ResizeObserver(() => gooeySync(false));

        observer.observe(container);
    }

    window.addEventListener("resize", () => gooeySync(false));

    gooeySync(false);

    requestAnimationFrame(() =>
        requestAnimationFrame(() =>
            gooeyLayer.classList.add("ready")
        )
    );

    /* nav entrance animations finish around 670ms */
    setTimeout(() => gooeySync(false), 700);

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => gooeySync(false));
    }
}

/* =========================================================
THEME ENGINE
========================================================= */

const THEMES = [
    {
        id: "midnight",
        name: "Midnight",
        note: "Violet on black",
        colors: ["#7c5cff", "#11151e", "#080a0f"]
    },
    {
        id: "daylight",
        name: "Daylight",
        note: "Clean light mode",
        colors: ["#6d4bff", "#ffffff", "#e1e5eb"]
    },
    {
        id: "graphite",
        name: "Graphite",
        note: "Black and gray",
        colors: ["#9a9aa2", "#2b2b30", "#000000"]
    },
    {
        id: "orchid",
        name: "Orchid",
        note: "Pink and purple",
        colors: ["#ff5fc4", "#a56bff", "#21132f"]
    },
    {
        id: "sage",
        name: "Sage",
        note: "Green and cement",
        colors: ["#4f7d4a", "#d3d0c6", "#eceae4"]
    },
    {
        id: "lagoon",
        name: "Lagoon",
        note: "Cyan and white",
        colors: ["#0aa9c2", "#ffffff", "#cbe8ef"]
    },
    {
        id: "ember",
        name: "Ember",
        note: "Amber and charcoal",
        colors: ["#ff9f43", "#ffd166", "#201c17"]
    }
];

const LEGACY_THEMES = {
    dark: "midnight",
    light: "daylight"
};

function normalizeTheme(value) {

    const id = LEGACY_THEMES[value] || value;

    return THEMES.some(theme => theme.id === id)
        ? id
        : "midnight";
}

function applyTheme(value, announce) {

    const id = normalizeTheme(value);

    state.theme = id;

    document.documentElement
        .setAttribute("data-theme", id);

    saveState();

    renderThemeMenu();

    const active = $(".theme-grid");

    if (active) {

        $$(".theme-card").forEach(card =>
            card.classList.toggle(
                "active",
                card.dataset.theme === id
            )
        );
    }

    if (announce) {

        const theme =
            THEMES.find(item => item.id === id);

        showToast(`${theme.name} theme applied.`);
    }
}

function themeSwatch(theme) {

    return `<i class="sw-${theme.id}"></i>`;
}

function renderThemeMenu() {

    const menu = $("#themeMenu");

    if (!menu) {
        return;
    }

    menu.innerHTML = `

        <div class="theme-menu-label">THEME</div>

        ${THEMES.map(theme => `

            <button
                class="theme-option ${state.theme === theme.id ? "active" : ""}"
                data-theme="${theme.id}"
                role="menuitem"
            >
                ${themeSwatch(theme)}

                <span>
                    <b>${theme.name}</b>
                    <small>${theme.note}</small>
                </span>

                <em>&#10003;</em>
            </button>

        `).join("")}
    `;

    $$(".theme-option", menu).forEach(button =>
        button.addEventListener("click", () => {

            applyTheme(button.dataset.theme, true);

            closeThemeMenu();
        })
    );
}

function openThemeMenu() {

    renderThemeMenu();

    $("#themeMenu").classList.remove("hidden");

    $("#themeBtn")
        .setAttribute("aria-expanded", "true");

    $("#themeBtn").classList.add("spin");

    setTimeout(
        () => $("#themeBtn").classList.remove("spin"),
        600
    );
}

function closeThemeMenu() {

    $("#themeMenu").classList.add("hidden");

    $("#themeBtn")
        .setAttribute("aria-expanded", "false");
}

function themeCards() {

    return `

        <div class="theme-grid">

            ${THEMES.map(theme => `

                <button
                    class="theme-card ${state.theme === theme.id ? "active" : ""}"
                    data-theme="${theme.id}"
                >
                    <div class="swatch-row">
                        ${theme.colors.map(color =>
                            `<span style="background:${color}"></span>`
                        ).join("")}
                    </div>

                    <b>${theme.name}</b>
                    <small>${theme.note}</small>

                </button>

            `).join("")}

        </div>
    `;
}

/* =========================================================
HELPERS
========================================================= */

function escapeHTML(value) {

return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

function uid() {

return Date.now().toString(36) +
    Math.random().toString(36).slice(2);

}

function today() {

return new Date().toISOString().split("T")[0];

}

function formatDate(date) {

if (!date) return "—";

const d = new Date(date);

if (Number.isNaN(d.getTime())) {
    return escapeHTML(date);
}

return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
});

}

function showToast(message) {

const container = $("#toastContainer");

if (!container) return;

const toast = document.createElement("div");

toast.className = "toast";

toast.textContent = message;

container.appendChild(toast);

setTimeout(() => {
    toast.remove();
}, 2800);

}

function setPage(page) {

renderPage(page);

$$(".nav-item").forEach(button => {

    button.classList.toggle(
        "active",
        button.dataset.page === page
    );

});

$$(".mobile-nav button[data-page]").forEach(button => {

    button.classList.toggle(
        "active",
        button.dataset.page === page
    );

});

const name =
    page.charAt(0).toUpperCase() +
    page.slice(1);

$("#breadcrumb").textContent =
    page === "analyzer"
        ? "Job Analyzer"
        : name;

gooeySync(true);

toggleSidebar(false);

window.scrollTo({
    top: 0,
    behavior: "smooth"
});

}

/* =========================================================
TARGET ROLE VALIDATION
Dictionary + fuzzy matching. A role must contain a real
job-title head noun (developer, engineer, analyst, nurse...)
or be a recognised abbreviation (SDE, QA, HR, CTO...).
========================================================= */

/* Head nouns — the word that actually makes it a job title */
const ROLE_HEADS = [
    "developer", "engineer", "programmer", "coder", "architect",
    "analyst", "scientist", "researcher", "statistician",
    "designer", "illustrator", "animator", "artist", "photographer",
    "manager", "lead", "director", "supervisor", "head", "chief",
    "officer", "executive", "president", "partner", "founder",
    "administrator", "admin", "operator", "technician", "mechanic",
    "specialist", "consultant", "advisor", "strategist", "planner",
    "coordinator", "associate", "assistant", "representative", "agent",
    "intern", "trainee", "apprentice", "fresher", "graduate",
    "tester", "auditor", "inspector", "examiner", "reviewer",
    "writer", "editor", "author", "journalist", "copywriter", "blogger",
    "marketer", "salesperson", "seller", "recruiter", "sourcer",
    "accountant", "bookkeeper", "actuary", "underwriter", "broker",
    "banker", "trader", "economist", "auditor",
    "teacher", "professor", "lecturer", "tutor", "instructor",
    "trainer", "coach", "mentor", "counsellor", "counselor",
    "doctor", "physician", "surgeon", "nurse", "dentist", "pharmacist",
    "therapist", "psychologist", "psychiatrist", "radiologist",
    "paramedic", "dietitian", "nutritionist", "veterinarian",
    "lawyer", "attorney", "advocate", "paralegal", "solicitor", "barrister",
    "chef", "cook", "baker", "barista", "bartender", "waiter", "server",
    "pilot", "driver", "conductor", "captain", "navigator",
    "electrician", "plumber", "carpenter", "welder", "machinist",
    "surveyor", "geologist", "chemist", "physicist", "biologist",
    "librarian", "archivist", "curator", "translator", "interpreter",
    "receptionist", "secretary", "clerk", "cashier", "teller",
    "guard", "constable", "inspector", "firefighter", "soldier",
    "pharmacologist", "microbiologist", "biotechnologist",
    "generalist", "evangelist", "ambassador", "liaison",
    "owner", "entrepreneur", "freelancer", "contractor", "practitioner",
    "engineers", "developers", "analysts", "designers", "managers"
];

/* Modifiers — valid but not sufficient on their own */
const ROLE_MODIFIERS = [
    "junior", "senior", "sr", "jr", "mid", "entry", "level", "principal",
    "staff", "associate", "assistant", "deputy", "vice", "chief", "global",
    "regional", "national", "trainee", "graduate", "apprentice", "lead",
    "frontend", "front", "backend", "back", "fullstack", "full", "stack",
    "end", "web", "mobile", "android", "ios", "flutter", "react", "angular",
    "vue", "node", "java", "python", "javascript", "typescript", "php",
    "ruby", "golang", "go", "rust", "dotnet", "net", "salesforce", "sap",
    "software", "hardware", "firmware", "embedded", "systems", "system",
    "network", "cloud", "devops", "sre", "site", "reliability", "platform",
    "infrastructure", "security", "cyber", "cybersecurity", "information",
    "data", "database", "big", "analytics", "business", "intelligence",
    "machine", "learning", "deep", "ai", "artificial", "ml", "nlp",
    "computer", "vision", "robotics", "automation", "blockchain",
    "quality", "assurance", "qa", "test", "testing", "automation",
    "ui", "ux", "visual", "graphic", "motion", "product", "interaction",
    "game", "3d", "2d", "cad", "civil", "mechanical", "electrical",
    "electronics", "chemical", "aerospace", "automotive", "industrial",
    "structural", "environmental", "biomedical", "petroleum", "mining",
    "project", "program", "programme", "delivery", "scrum", "agile",
    "technical", "technology", "it", "digital", "content", "social",
    "media", "seo", "sem", "growth", "brand", "performance", "email",
    "marketing", "sales", "account", "customer", "client", "success",
    "support", "service", "field", "inside", "outside", "retail",
    "human", "resources", "hr", "talent", "acquisition", "people",
    "operations", "ops", "supply", "chain", "logistics", "procurement",
    "warehouse", "inventory", "production", "manufacturing", "process",
    "finance", "financial", "accounts", "accounting", "tax", "audit",
    "investment", "equity", "risk", "compliance", "credit", "treasury",
    "legal", "corporate", "public", "policy", "government", "non",
    "profit", "clinical", "medical", "health", "healthcare", "dental",
    "mental", "physical", "occupational", "speech", "research", "lab",
    "laboratory", "school", "high", "primary", "elementary", "special",
    "education", "academic", "creative", "art", "fashion", "interior",
    "architecture", "construction", "real", "estate", "property",
    "hotel", "hospitality", "travel", "tourism", "event", "restaurant",
    "flight", "cabin", "crew", "security", "safety", "fire", "police",
    "executive", "general", "office", "personal", "virtual", "remote",
    "freelance", "contract", "part", "time", "shift", "and", "of", "for"
];

/* Recognised standalone abbreviations / titles */
const ROLE_ABBREVIATIONS = [
    "sde", "sde1", "sde2", "sde3", "sdet", "swe", "sre", "mle",
    "qa", "qc", "ba", "bde", "bdm", "pm", "po", "tpm", "em",
    "hr", "hrbp", "cxo", "ceo", "cto", "cfo", "coo", "cmo", "ciso",
    "cio", "cdo", "vp", "avp", "md", "gm", "agm", "dgm",
    "ui/ux", "ux/ui", "devops", "mlops", "dataops", "finops",
    "ios", "android", "rn", "lpn", "cna", "np", "pa", "cpa", "ca",
    "cs", "cfa", "ias", "ips", "ssc", "tgt", "pgt"
];

/* Popular full titles — used for typo suggestions + autocomplete */
const KNOWN_ROLES = [
    "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "Software Engineer", "Senior Software Engineer", "Software Developer",
    "Web Developer", "Mobile App Developer", "Android Developer",
    "iOS Developer", "React Developer", "Java Developer",
    "Python Developer", "Node.js Developer", "PHP Developer",
    "Game Developer", "Embedded Systems Engineer", "Firmware Engineer",
    "DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer",
    "Platform Engineer", "Network Engineer", "Security Engineer",
    "Cybersecurity Analyst", "Data Engineer", "Data Analyst",
    "Data Scientist", "Machine Learning Engineer", "AI Engineer",
    "Business Analyst", "Business Intelligence Analyst",
    "Database Administrator", "System Administrator", "IT Support Engineer",
    "QA Engineer", "Automation Test Engineer", "Manual Tester",
    "UI/UX Designer", "Product Designer", "Graphic Designer",
    "Motion Designer", "Interior Designer", "Fashion Designer",
    "Product Manager", "Project Manager", "Program Manager",
    "Engineering Manager", "Technical Lead", "Solution Architect",
    "Cloud Architect", "Scrum Master", "Delivery Manager",
    "Digital Marketing Executive", "SEO Specialist", "Content Writer",
    "Copywriter", "Social Media Manager", "Brand Manager",
    "Sales Executive", "Business Development Executive",
    "Account Manager", "Customer Success Manager", "Support Engineer",
    "HR Executive", "HR Manager", "Talent Acquisition Specialist",
    "Recruiter", "Operations Manager", "Supply Chain Analyst",
    "Logistics Coordinator", "Procurement Specialist",
    "Financial Analyst", "Accountant", "Chartered Accountant",
    "Investment Banker", "Risk Analyst", "Auditor", "Tax Consultant",
    "Civil Engineer", "Mechanical Engineer", "Electrical Engineer",
    "Electronics Engineer", "Chemical Engineer", "Aerospace Engineer",
    "Automotive Engineer", "Industrial Engineer", "Biomedical Engineer",
    "Registered Nurse", "Staff Nurse", "Pharmacist", "Physiotherapist",
    "Clinical Research Associate", "Lab Technician", "Radiologist",
    "Teacher", "Lecturer", "Professor", "Academic Counsellor",
    "Corporate Lawyer", "Legal Associate", "Paralegal",
    "Executive Chef", "Sous Chef", "Hotel Manager", "Event Manager",
    "Technical Writer", "Research Scientist", "Product Owner"
];

const KEYBOARD_RUNS = [
    "qwer", "wert", "erty", "rtyu", "tyui", "yuio", "uiop",
    "asdf", "sdfg", "dfgh", "fghj", "ghjk", "hjkl",
    "zxcv", "xcvb", "cvbn", "vbnm", "qaz", "wsx", "edc",
    "1234", "abcd", "aaaa", "test123"
];

function levenshtein(a, b) {

    const m = a.length;
    const n = b.length;

    if (!m) return n;
    if (!n) return m;

    let prev = Array.from({ length: n + 1 }, (_, i) => i);

    for (let i = 1; i <= m; i++) {

        const curr = [i];

        for (let j = 1; j <= n; j++) {

            curr[j] = Math.min(
                prev[j] + 1,
                curr[j - 1] + 1,
                prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }

        prev = curr;
    }

    return prev[n];
}

function singular(word) {

    if (word.length > 4 && word.endsWith("ies")) {
        return word.slice(0, -3) + "y";
    }

    if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
        return word.slice(0, -1);
    }

    return word;
}

function looksLikeGibberish(word) {

    if (word.length < 4) {
        return false;
    }

    if (KEYBOARD_RUNS.some(run => word.includes(run))) {
        return true;
    }

    /* no vowels at all in a long word */
    if (!/[aeiouy]/.test(word)) {
        return true;
    }

    /* five or more consonants in a row */
    if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(word)) {
        return true;
    }

    /* vowel ratio far outside natural English */
    const vowels = (word.match(/[aeiou]/g) || []).length;
    const ratio = vowels / word.length;

    return ratio < 0.16 || ratio > 0.75;
}

function titleCaseRole(value) {

    const small = ["of", "and", "for", "the", "in", "at", "on"];

    return value
        .split(" ")
        .map((word, index) => {

            const lower = word.toLowerCase();

            if (
                ROLE_ABBREVIATIONS.includes(lower) ||
                /^[a-z]{2,4}$/.test(lower) &&
                ["ui", "ux", "qa", "hr", "it", "ai", "ml", "sde", "sre",
                 "seo", "sem", "api", "erp", "crm", "bi"].includes(lower)
            ) {
                return word.toUpperCase();
            }

            if (index > 0 && small.includes(lower)) {
                return lower;
            }

            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

function suggestRole(value) {

    const lower = value.toLowerCase();

    let best = null;
    let bestScore = Infinity;

    KNOWN_ROLES.forEach(role => {

        const distance =
            levenshtein(lower, role.toLowerCase());

        const tolerance =
            Math.max(2, Math.floor(role.length * 0.34));

        if (distance < bestScore && distance <= tolerance) {
            bestScore = distance;
            best = role;
        }
    });

    if (best) {
        return best;
    }

    /* try correcting just the head noun */
    const words = lower.split(" ");
    const last = singular(words[words.length - 1] || "");

    let head = null;
    let headScore = Infinity;

    ROLE_HEADS.forEach(candidate => {

        const distance = levenshtein(last, candidate);

        const tolerance =
            last.length >= 7
                ? 2
                : 1;

        /* must share a first letter — stops "lover" → "coder" */
        if (last.charAt(0) !== candidate.charAt(0)) {
            return;
        }

        if (distance < headScore && distance <= tolerance) {
            headScore = distance;
            head = candidate;
        }
    });

    if (head) {

        const rebuilt = words
            .slice(0, -1)
            .concat(head)
            .join(" ");

        return titleCaseRole(rebuilt);
    }

    return null;
}

function validateTargetRole(value) {

    const role = String(value || "")
        .trim()
        .replace(/\s+/g, " ");

    const fail = (message, suggestion) => ({
        ok: false,
        message,
        suggestion: suggestion || null
    });

    if (!role) {
        return fail("Please enter your target role.");
    }

    if (role.length < 2) {
        return fail("That's too short to be a job role.");
    }

    if (role.length > 80) {
        return fail("Target role must be 80 characters or less.");
    }

    if (role.split(" ").length > 8) {
        return fail("Keep it to a job title, not a sentence.");
    }

    if (!/[A-Za-z]/.test(role)) {
        return fail("A role needs letters — try \u201CFrontend Developer\u201D.");
    }

    if (/^\d+$/.test(role.replace(/\s/g, ""))) {
        return fail("Numbers aren't a job role.");
    }

    if (/[<>{}[\]\\|@#$%^*_=~`]/.test(role)) {
        return fail("Remove special characters from the role name.");
    }

    if (/(.)\1{2,}/i.test(role)) {
        return fail("That doesn't look like a real job title.");
    }

    const letters = (role.match(/[A-Za-z]/g) || []).length;

    if (letters / role.length < 0.6) {
        return fail("That doesn't look like a real job title.");
    }

    const words = role
        .toLowerCase()
        .replace(/[.,/&()-]/g, " ")
        .split(/\s+/)
        .filter(Boolean);

    /* recognised abbreviation on its own */
    const compact = role.toLowerCase().replace(/[\s.]/g, "");

    if (ROLE_ABBREVIATIONS.includes(compact)) {
        return {
            ok: true,
            value: titleCaseRole(role),
            suggestion: null
        };
    }

    /* obvious keyboard mashing */
    if (words.some(looksLikeGibberish)) {
        return fail(
            "That doesn't look like a real job title. Try something like \u201CData Analyst\u201D.",
            suggestRole(role)
        );
    }

    const known = word => {

        const base = singular(word);

        return ROLE_HEADS.includes(base) ||
               ROLE_HEADS.includes(word) ||
               ROLE_MODIFIERS.includes(base) ||
               ROLE_MODIFIERS.includes(word) ||
               ROLE_ABBREVIATIONS.includes(word);
    };

    const hasHead = words.some(word =>
        ROLE_HEADS.includes(singular(word)) ||
        ROLE_HEADS.includes(word)
    );

    const hasAbbreviation = words.some(word =>
        ROLE_ABBREVIATIONS.includes(word)
    );

    const unknown = words.filter(word => !known(word));

    if (hasHead || hasAbbreviation) {

        /* a real head noun, but padded with unrecognised words */
        if (unknown.length > 2) {
            return fail(
                "Keep it to a recognisable job title.",
                suggestRole(role)
            );
        }

        return {
            ok: true,
            value: titleCaseRole(role),
            suggestion: null
        };
    }

    /* no head noun — offer the closest real title */
    const suggestion = suggestRole(role);

    return fail(
        suggestion
            ? "That isn't a job role we recognise."
            : "Enter a real job title, e.g. \u201CFrontend Developer\u201D or \u201CData Analyst\u201D.",
        suggestion
    );
}

function clearFieldFeedback(field) {

    const parent = field.parentElement;

    [
        ".field-error-message",
        ".field-ok-message",
        ".field-suggest"
    ].forEach(selector => {

        const node = parent.querySelector(selector);

        if (node) {
            node.remove();
        }
    });

    field.classList.remove("field-error");
}

function validateField(field, quiet) {

    const result =
        validateTargetRole(field.value);

    clearFieldFeedback(field);

    if (!result.ok) {

        if (quiet && !field.value.trim()) {
            return false;
        }

        field.classList.add("field-error");

        const message =
            document.createElement("div");

        message.className = "field-error-message";
        message.textContent = "\u26A0 " + result.message;

        field.insertAdjacentElement("afterend", message);

        if (result.suggestion) {

            const chip =
                document.createElement("button");

            chip.type = "button";
            chip.className = "field-suggest";
            chip.textContent =
                "Did you mean: " + result.suggestion + "?";

            chip.addEventListener("click", () => {

                field.value = result.suggestion;

                validateField(field);

                field.focus();
            });

            message.insertAdjacentElement("afterend", chip);
        }

        return false;
    }

    field.value = result.value;

    if (!quiet) {

        const ok = document.createElement("div");

        ok.className = "field-ok-message";
        ok.textContent = "\u2713 Looks good.";

        field.insertAdjacentElement("afterend", ok);
    }

    return true;
}

/* Live validation as the user types (debounced, non-nagging) */
function bindRoleField(field) {

    if (!field || field.dataset.roleBound) {
        return;
    }

    field.dataset.roleBound = "1";

    field.setAttribute("list", "roleSuggestions");
    field.setAttribute("autocomplete", "off");

    let timer = null;

    field.addEventListener("input", () => {

        clearTimeout(timer);

        timer = setTimeout(
            () => validateField(field, true),
            450
        );
    });

    field.addEventListener("blur", () => {

        if (field.value.trim()) {
            validateField(field, true);
        }
    });
}

function roleDatalist() {

    return `
        <datalist id="roleSuggestions">
            ${KNOWN_ROLES.map(role =>
                `<option value="${escapeHTML(role)}"></option>`
            ).join("")}
        </datalist>
    `;
}

/* =========================================================
ONBOARDING
========================================================= */

const onboardingSteps = [

{
    title: "Welcome to your career command center.",
    text:
        "Everything you need to manage your job search, applications, skills and interviews — in one focused workspace.",

    html: `
        <div class="onboarding-content">
            <h1>Take control of your job search.</h1>
            <p>
                Career Command Center turns a scattered job hunt
                into one organized workflow.
            </p>

            <div class="metric-row">
                <span>Discover</span>
                <strong>Find better opportunities</strong>
            </div>

            <div class="metric-row">
                <span>Analyze</span>
                <strong>Understand job requirements</strong>
            </div>

            <div class="metric-row">
                <span>Prepare</span>
                <strong>Close your skill gaps</strong>
            </div>
        </div>
    `
},

{
    title: "Tell us what you're targeting.",
    text:
        "Your target role helps the workspace personalize your career journey.",

    html: `
        <div class="onboarding-content">

            <h1>What's your target role?</h1>

            <p>
                Enter the role you're actually looking for.
                You can use any valid job title.
            </p>

            <div class="form-group">

                <label for="onboardingRole">
                    TARGET ROLE
                </label>

                <input
                    id="onboardingRole"
                    type="text"
                    maxlength="80"
                    placeholder="e.g. Frontend Developer"
                    autocomplete="off"
                >

            </div>

        </div>
    `
},

{
    title: "Build your candidate profile.",
    text:
        "A few details are enough to personalize your workspace.",

    html: `
        <div class="onboarding-content">

            <h1>About you</h1>

            <div class="form-grid">

                <div class="form-group">

                    <label for="onboardingName">
                        YOUR NAME
                    </label>

                    <input
                        id="onboardingName"
                        type="text"
                        maxlength="60"
                        placeholder="Your name"
                    >

                </div>

                <div class="form-group">

                    <label for="onboardingExperience">
                        EXPERIENCE
                    </label>

                    <select id="onboardingExperience">
                        <option>Fresher</option>
                        <option>0–1 years</option>
                        <option>1–3 years</option>
                        <option>3–5 years</option>
                        <option>5+ years</option>
                    </select>

                </div>

                <div class="form-group full">

                    <label for="onboardingLocation">
                        PREFERRED LOCATION
                    </label>

                    <input
                        id="onboardingLocation"
                        type="text"
                        maxlength="80"
                        placeholder="e.g. Bangalore, Hyderabad, Remote"
                    >

                </div>

            </div>

        </div>
    `
},

{
    title: "You're ready.",
    text:
        "Your command center is prepared. You can change your profile anytime.",

    html: `
        <div class="onboarding-content">

            <h1>Your workspace is ready.</h1>

            <p>
                Start by reviewing your dashboard, analyzing a
                job description or adding your first application.
            </p>

            <div class="metric-row">
                <span>Target role</span>
                <strong id="finalRolePreview">—</strong>
            </div>

            <div class="metric-row">
                <span>Experience</span>
                <strong id="finalExperiencePreview">—</strong>
            </div>

            <div class="metric-row">
                <span>Location</span>
                <strong id="finalLocationPreview">—</strong>
            </div>

        </div>
    `
}

];

let onboardingStep = state.onboardingStep || 0;

function renderOnboarding() {

const content =
    $("#onboardingContent");

const step =
    onboardingSteps[onboardingStep];

content.innerHTML = step.html;

$("#stepText").textContent =
    `Step ${onboardingStep + 1} of ${onboardingSteps.length}`;

$("#stepProgress").style.width =
    `${((onboardingStep + 1) / onboardingSteps.length) * 100}%`;

$("#backStep").style.visibility =
    onboardingStep === 0
        ? "hidden"
        : "visible";

$("#nextStep").innerHTML =
    onboardingStep === onboardingSteps.length - 1
        ? "Enter Command Center →"
        : "Continue →";

if (onboardingStep === 3) {

    $("#finalRolePreview").textContent =
        state.profile.role || "Not set";

    $("#finalExperiencePreview").textContent =
        state.profile.experience || "Fresher";

    $("#finalLocationPreview").textContent =
        state.profile.location || "Not set";
}

bindRoleField($("#onboardingRole"));

if (onboardingStep === 1) {

    const input =
        $("#onboardingRole");

    input.value =
        state.profile.role || "";

    setTimeout(() => input.focus(), 50);
}

if (onboardingStep === 2) {

    $("#onboardingName").value =
        state.profile.name || "";

    $("#onboardingExperience").value =
        state.profile.experience || "Fresher";

    $("#onboardingLocation").value =
        state.profile.location || "";
}

}

function nextOnboarding() {

if (onboardingStep === 1) {

    const input =
        $("#onboardingRole");

    if (!validateField(input)) {

        input.focus();

        return;
    }

    state.profile.role =
        input.value.trim();
}


if (onboardingStep === 2) {

    const name =
        $("#onboardingName").value.trim();

    if (!name) {

        showToast("Please enter your name.");

        $("#onboardingName").focus();

        return;
    }

    state.profile.name = name;

    state.profile.experience =
        $("#onboardingExperience").value;

    state.profile.location =
        $("#onboardingLocation").value.trim();
}


if (
    onboardingStep <
    onboardingSteps.length - 1
) {

    onboardingStep++;

    state.onboardingStep =
        onboardingStep;

    saveState();

    renderOnboarding();

    return;
}


state.onboarded = true;

state.onboardingStep = 0;

saveState();

$("#onboarding").classList.add("hidden");

updateProfileUI();

setPage("dashboard");

showToast("Welcome to Career Command Center.");

}

function previousOnboarding() {

if (onboardingStep === 0) return;

onboardingStep--;

state.onboardingStep =
    onboardingStep;

saveState();

renderOnboarding();

}

/* =========================================================
READINESS
========================================================= */

function calculateReadiness() {

let score = 0;

if (state.profile.name) score += 20;
if (state.profile.role) score += 25;
if (state.profile.location) score += 10;
if (state.skills.length >= 3) score += 20;
if (state.applications.length >= 1) score += 15;
if (state.interviews.length >= 1) score += 5;
if (state.offers.length >= 1) score += 5;

return Math.min(score,100);

}

function updateReadiness() {

const score =
    calculateReadiness();

$("#readinessValue").textContent =
    `${score}%`;

$("#readinessProgress").style.width =
    `${score}%`;

}

/* =========================================================
PROFILE UI
========================================================= */

function updateProfileUI() {

const name =
    state.profile.name ||
    "Candidate";

const role =
    state.profile.role ||
    "Set your target role";

const initial =
    name.charAt(0).toUpperCase();

$("#sidebarName").textContent = name;
$("#sidebarRole").textContent = role;

$("#topName").textContent = name;

$("#sidebarAvatar").textContent = initial;
$("#topAvatar").textContent = initial;

$("#applicationCount").textContent =
    state.applications.length;

updateReadiness();

}

/* =========================================================
DASHBOARD
========================================================= */

function renderDashboard() {

const apps =
    state.applications;

const interviews =
    state.interviews;

const offers =
    state.offers;

const activeApps =
    apps.filter(
        a => !["Rejected","Withdrawn","Offer"].includes(a.status)
    ).length;

return `

    <div class="page-head">

        <div>

            <div class="eyebrow">
                COMMAND CENTER
            </div>

            <h1 class="page-title">
                Good day, ${escapeHTML(state.profile.name || "Candidate")}.
            </h1>

            <p class="page-subtitle">
                Your entire job search, organized in one intelligent workspace.
            </p>

        </div>

        <div class="action-row">

            <button class="btn secondary" data-action="analyze">
                Analyze a job
            </button>

            <button class="btn primary" data-action="addApplication">
                + Add application
            </button>

        </div>

    </div>


    <section class="card hero-card">

        <div class="eyebrow">
            CURRENT TARGET
        </div>

        <h2>
            ${escapeHTML(
                state.profile.role ||
                "Set your target role"
            )}
        </h2>

        <p>
            Keep your search focused. Analyze roles,
            track applications and close your biggest skill gaps.
        </p>

        <div class="hero-actions">

            <button class="btn primary" data-action="analyze">
                Analyze job description →
            </button>

            <button class="btn secondary" data-action="skills">
                Review skills
            </button>

        </div>

    </section>


    <div class="grid stats-grid" style="margin-top:16px">

        <div class="card stat-card">
            <div class="stat-label">APPLICATIONS</div>
            <div class="stat-value">${apps.length}</div>
            <div class="stat-meta">
                ${activeApps} active applications
            </div>
        </div>

        <div class="card stat-card">
            <div class="stat-label">INTERVIEWS</div>
            <div class="stat-value">${interviews.length}</div>
            <div class="stat-meta">
                Upcoming interview events
            </div>
        </div>

        <div class="card stat-card">
            <div class="stat-label">OFFERS</div>
            <div class="stat-value">${offers.length}</div>
            <div class="stat-meta">
                Offers in your workspace
            </div>
        </div>

        <div class="card stat-card">
            <div class="stat-label">READINESS</div>
            <div class="stat-value">${calculateReadiness()}%</div>
            <div class="stat-meta">
                Career readiness score
            </div>
        </div>

    </div>


    <div class="grid dashboard-grid">

        <section class="card card-pad">

            <div class="section-title">
                <h3>Recent applications</h3>

                <button
                    class="mini-btn"
                    data-action="applications"
                >
                    View all
                </button>
            </div>

            ${
                apps.length
                    ? `
                        <div class="list">
                            ${apps.slice(-5).reverse().map(applicationTemplate).join("")}
                        </div>
                    `
                    : `
                        <div class="empty">
                            <strong>No applications yet</strong>
                            Add your first application to start tracking your search.
                            <br><br>
                            <button
                                class="btn primary"
                                data-action="addApplication"
                            >
                                Add application
                            </button>
                        </div>
                    `
            }

        </section>


        <section class="card card-pad">

            <div class="section-title">
                <h3>Career snapshot</h3>
            </div>

            <div class="metric-row">
                <span>Target role</span>
                <strong>
                    ${escapeHTML(state.profile.role || "Not set")}
                </strong>
            </div>

            <div class="metric-row">
                <span>Experience</span>
                <strong>
                    ${escapeHTML(state.profile.experience || "Fresher")}
                </strong>
            </div>

            <div class="metric-row">
                <span>Location</span>
                <strong>
                    ${escapeHTML(state.profile.location || "Not set")}
                </strong>
            </div>

            <div class="metric-row">
                <span>Skills tracked</span>
                <strong>${state.skills.length}</strong>
            </div>

        </section>

    </div>

`;

}

/* =========================================================
APPLICATIONS
========================================================= */

function applicationTemplate(app) {

return `
    <div class="list-item">

        <div class="list-item-main">

            <strong>
                ${escapeHTML(app.company)}
            </strong>

            <span>
                ${escapeHTML(app.role)}
                · ${escapeHTML(app.location || "Location not set")}
            </span>

        </div>

        <span class="badge ${statusClass(app.status)}">
            ${escapeHTML(app.status)}
        </span>

    </div>
`;

}

function statusClass(status) {

if (status === "Applied" ||
    status === "Interview") {
    return "green";
}

if (status === "Rejected") {
    return "red";
}

if (status === "Offer") {
    return "yellow";
}

return "";

}

function renderApplications() {

return `

    <div class="page-head">

        <div>
            <div class="eyebrow">TRACK</div>
            <h1 class="page-title">Applications</h1>
            <p class="page-subtitle">
                Keep every opportunity organized from application to offer.
            </p>
        </div>

        <button
            class="btn primary"
            data-action="addApplication"
        >
            + Add application
        </button>

    </div>


    <section class="card table-card">

        ${
            state.applications.length
                ? `
                    <div class="table-wrap">

                        <table>

                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Role</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Applied</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                ${state.applications
                                    .map(app => `
                                        <tr>

                                            <td>
                                                <strong>
                                                    ${escapeHTML(app.company)}
                                                </strong>
                                            </td>

                                            <td>
                                                ${escapeHTML(app.role)}
                                            </td>

                                            <td>
                                                ${escapeHTML(app.location || "—")}
                                            </td>

                                            <td>
                                                <span class="badge ${statusClass(app.status)}">
                                                    ${escapeHTML(app.status)}
                                                </span>
                                            </td>

                                            <td>
                                                ${formatDate(app.date)}
                                            </td>

                                            <td>
                                                <button
                                                    class="mini-btn"
                                                    data-delete-application="${app.id}"
                                                >
                                                    Delete
                                                </button>
                                            </td>

                                        </tr>
                                    `).join("")}

                            </tbody>

                        </table>

                    </div>
                `
                : `
                    <div class="empty">
                        <strong>No applications</strong>
                        Start tracking your job search.
                    </div>
                `
        }

    </section>
`;

}

/* =========================================================
JOB ANALYZER
========================================================= */

function renderAnalyzer() {

return `

    <div class="page-head">

        <div>
            <div class="eyebrow">INTELLIGENCE</div>

            <h1 class="page-title">
                Job Analyzer
            </h1>

            <p class="page-subtitle">
                Paste a job description and quickly understand
                the role, skills and preparation priorities.
            </p>
        </div>

    </div>


    <section class="card card-pad">

        <div class="form-group">

            <label for="jobDescription">
                JOB DESCRIPTION
            </label>

            <textarea
                id="jobDescription"
                placeholder="Paste the complete job description here..."
                style="min-height:280px"
            ></textarea>

        </div>

        <div style="margin-top:15px">

            <button
                class="btn primary"
                id="analyzeJobButton"
            >
                Analyze role →
            </button>

        </div>

    </section>


    <div id="analysisResult" style="margin-top:16px"></div>

`;

}

function analyzeJob() {

const text =
    $("#jobDescription").value.trim();

if (text.length < 30) {

    showToast(
        "Paste a longer job description first."
    );

    return;
}

const commonSkills = [
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "React",
    "Git",
    "GitHub",
    "Figma",
    "SQL",
    "Python",
    "Java",
    "Communication",
    "Problem Solving",
    "UI/UX",
    "REST API",
    "Node.js"
];

const found =
    commonSkills.filter(skill =>
        new RegExp(
            `\\b${skill.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,
            "i"
        ).test(text)
    );

const keywords =
    [...new Set(
        text
            .toLowerCase()
            .match(/[a-z][a-z+#.-]{3,}/g) || []
    )]
    .filter(word =>
        ![
            "this",
            "that",
            "with",
            "from",
            "your",
            "will",
            "have",
            "team",
            "work",
            "role",
            "looking",
            "years"
        ].includes(word)
    )
    .slice(0,12);

$("#analysisResult").innerHTML = `

    <section class="card card-pad">

        <div class="section-title">
            <h3>Role analysis</h3>
            <span>Local analysis</span>
        </div>

        <div class="grid stats-grid">

            <div class="card stat-card">
                <div class="stat-label">
                    DESCRIPTION LENGTH
                </div>

                <div class="stat-value">
                    ${text.length}
                </div>

                <div class="stat-meta">
                    characters
                </div>
            </div>

            <div class="card stat-card">
                <div class="stat-label">
                    MATCHED SKILLS
                </div>

                <div class="stat-value">
                    ${found.length}
                </div>

                <div class="stat-meta">
                    recognizable skills
                </div>
            </div>

            <div class="card stat-card">
                <div class="stat-label">
                    PREPARATION
                </div>

                <div class="stat-value">
                    ${Math.min(95,50 + found.length * 5)}%
                </div>

                <div class="stat-meta">
                    estimated focus
                </div>
            </div>

            <div class="card stat-card">
                <div class="stat-label">
                    TARGET
                </div>

                <div class="stat-value" style="font-size:17px">
                    ${escapeHTML(state.profile.role || "Not set")}
                </div>

                <div class="stat-meta">
                    your current role
                </div>
            </div>

        </div>


        <div style="margin-top:20px">

            <div class="section-title">
                <h3>Detected skills</h3>
            </div>

            <div class="action-row">

                ${
                    found.length
                        ? found.map(skill =>
                            `<span class="badge">${escapeHTML(skill)}</span>`
                          ).join("")
                        : `<span class="badge red">No common skills detected</span>`
                }

            </div>

        </div>


        <div style="margin-top:20px">

            <div class="section-title">
                <h3>Suggested keywords</h3>
            </div>

            <div class="action-row">

                ${
                    keywords.map(keyword =>
                        `<span class="badge">${escapeHTML(keyword)}</span>`
                    ).join("")
                }

            </div>

        </div>

    </section>

`;

}

/* =========================================================
INTERVIEWS
========================================================= */

function renderInterviews() {

return `

    <div class="page-head">

        <div>
            <div class="eyebrow">PREPARE</div>
            <h1 class="page-title">Interviews</h1>

            <p class="page-subtitle">
                Keep interview dates and preparation priorities in one place.
            </p>
        </div>

        <button
            class="btn primary"
            data-action="addInterview"
        >
            + Add interview
        </button>

    </div>


    <section class="card card-pad">

        ${
            state.interviews.length
                ? `
                    <div class="list">
                        ${state.interviews
                            .sort(
                                (a,b) =>
                                    new Date(a.date) -
                                    new Date(b.date)
                            )
                            .map(interview => `

                                <div class="list-item">

                                    <div class="list-item-main">

                                        <strong>
                                            ${escapeHTML(interview.company)}
                                        </strong>

                                        <span>
                                            ${escapeHTML(interview.type)}
                                            · ${formatDate(interview.date)}
                                        </span>

                                    </div>

                                    <button
                                        class="mini-btn"
                                        data-delete-interview="${interview.id}"
                                    >
                                        Delete
                                    </button>

                                </div>

                            `).join("")}
                    </div>
                `
                : `
                    <div class="empty">
                        <strong>No interviews scheduled</strong>
                        Add your next interview to keep preparation visible.
                    </div>
                `
        }

    </section>
`;

}

/* =========================================================
SKILLS
========================================================= */

function renderSkills() {

return `

    <div class="page-head">

        <div>
            <div class="eyebrow">DEVELOP</div>
            <h1 class="page-title">Skills</h1>
            <p class="page-subtitle">
                Track the capabilities that matter for your target role.
            </p>
        </div>

        <button
            class="btn primary"
            data-action="addSkill"
        >
            + Add skill
        </button>

    </div>


    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">

        ${state.skills.map(skill => `

            <section class="card card-pad">

                <div class="skill">

                    <div class="skill-head">

                        <strong>
                            ${escapeHTML(skill.name)}
                        </strong>

                        <span>
                            ${skill.level}%
                        </span>

                    </div>

                    <div class="skill-bar">

                        <span
                            style="width:${Math.max(0,Math.min(100,skill.level))}%"
                        ></span>

                    </div>

                </div>

            </section>

        `).join("")}

    </div>

`;

}

/* =========================================================
CAREER PLAN
========================================================= */

function renderCareer() {

const readiness =
    calculateReadiness();

return `

    <div class="page-head">

        <div>
            <div class="eyebrow">DIRECTION</div>
            <h1 class="page-title">Career Plan</h1>
            <p class="page-subtitle">
                A simple roadmap from where you are to your next opportunity.
            </p>
        </div>

    </div>


    <div class="grid dashboard-grid">

        <section class="card card-pad">

            <div class="section-title">
                <h3>Your current direction</h3>
            </div>

            <div class="metric-row">
                <span>Target role</span>
                <strong>
                    ${escapeHTML(state.profile.role || "Not set")}
                </strong>
            </div>

            <div class="metric-row">
                <span>Readiness</span>
                <strong>${readiness}%</strong>
            </div>

            <div class="metric-row">
                <span>Applications</span>
                <strong>${state.applications.length}</strong>
            </div>

            <div class="metric-row">
                <span>Interviews</span>
                <strong>${state.interviews.length}</strong>
            </div>

        </section>


        <section class="card card-pad">

            <div class="section-title">
                <h3>Recommended next steps</h3>
            </div>

            <div class="list">

                <div class="list-item">
                    <div class="list-item-main">
                        <strong>Analyze relevant jobs</strong>
                        <span>Understand what companies are asking for.</span>
                    </div>
                </div>

                <div class="list-item">
                    <div class="list-item-main">
                        <strong>Improve your skills</strong>
                        <span>Focus on the highest-value skill gaps.</span>
                    </div>
                </div>

                <div class="list-item">
                    <div class="list-item-main">
                        <strong>Track applications</strong>
                        <span>Never lose visibility into your job search.</span>
                    </div>
                </div>

                <div class="list-item">
                    <div class="list-item-main">
                        <strong>Prepare for interviews</strong>
                        <span>Turn opportunities into offers.</span>
                    </div>
                </div>

            </div>

        </section>

    </div>

`;

}

/* =========================================================
OFFERS
========================================================= */

function renderOffers() {

return `

    <div class="page-head">

        <div>
            <div class="eyebrow">DECIDE</div>
            <h1 class="page-title">Offers</h1>
            <p class="page-subtitle">
                Compare the opportunities that reach the finish line.
            </p>
        </div>

        <button
            class="btn primary"
            data-action="addOffer"
        >
            + Add offer
        </button>

    </div>


    <section class="card card-pad">

        ${
            state.offers.length
                ? `
                    <div class="table-wrap">

                        <table>

                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Role</th>
                                    <th>CTC</th>
                                    <th>Location</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                ${state.offers.map(offer => `

                                    <tr>

                                        <td>
                                            ${escapeHTML(offer.company)}
                                        </td>

                                        <td>
                                            ${escapeHTML(offer.role)}
                                        </td>

                                        <td>
                                            ${escapeHTML(offer.ctc)}
                                        </td>

                                        <td>
                                            ${escapeHTML(offer.location || "—")}
                                        </td>

                                        <td>
                                            ${formatDate(offer.date)}
                                        </td>

                                        <td>
                                            <button
                                                class="mini-btn"
                                                data-delete-offer="${offer.id}"
                                            >
                                                Delete
                                            </button>
                                        </td>

                                    </tr>

                                `).join("")}

                            </tbody>

                        </table>

                    </div>
                `
                : `
                    <div class="empty">
                        <strong>No offers yet</strong>
                        Your offers will appear here when you reach the finish line.
                    </div>
                `
        }

    </section>

`;

}

/* =========================================================
ANALYTICS
========================================================= */

function renderAnalytics() {

const total =
    state.applications.length;

const interviews =
    state.interviews.length;

const offers =
    state.offers.length;

const interviewRate =
    total
        ? Math.round((interviews / total) * 100)
        : 0;

const offerRate =
    total
        ? Math.round((offers / total) * 100)
        : 0;

return `

    <div class="page-head">

        <div>
            <div class="eyebrow">INSIGHTS</div>
            <h1 class="page-title">Analytics</h1>
            <p class="page-subtitle">
                Understand how your job search is progressing.
            </p>
        </div>

    </div>


    <div class="grid stats-grid">

        <div class="card stat-card">
            <div class="stat-label">APPLICATIONS</div>
            <div class="stat-value">${total}</div>
            <div class="stat-meta">Total tracked</div>
        </div>

        <div class="card stat-card">
            <div class="stat-label">INTERVIEW RATE</div>
            <div class="stat-value">${interviewRate}%</div>
            <div class="stat-meta">Applications → interviews</div>
        </div>

        <div class="card stat-card">
            <div class="stat-label">OFFER RATE</div>
            <div class="stat-value">${offerRate}%</div>
            <div class="stat-meta">Applications → offers</div>
        </div>

        <div class="card stat-card">
            <div class="stat-label">READINESS</div>
            <div class="stat-value">${calculateReadiness()}%</div>
            <div class="stat-meta">Career readiness</div>
        </div>

    </div>


    <section class="card card-pad" style="margin-top:16px">

        <div class="section-title">
            <h3>Search funnel</h3>
        </div>

        <div class="metric-row">
            <span>Applications</span>
            <strong>${total}</strong>
        </div>

        <div class="metric-row">
            <span>Interviews</span>
            <strong>${interviews}</strong>
        </div>

        <div class="metric-row">
            <span>Offers</span>
            <strong>${offers}</strong>
        </div>

    </section>

`;

}

/* =========================================================
ASSISTANT
========================================================= */

function renderAssistant() {

return `

    <div class="page-head">

        <div>
            <div class="eyebrow">COPILOT</div>
            <h1 class="page-title">Career Assistant</h1>
            <p class="page-subtitle">
                Quick guidance based on the information currently stored in your workspace.
            </p>
        </div>

    </div>


    <section class="card card-pad">

        <div class="list">

            <button
                class="list-item"
                data-assistant="profile"
            >
                <div class="list-item-main">
                    <strong>How ready am I?</strong>
                    <span>Review your current career readiness.</span>
                </div>
                <span>→</span>
            </button>

            <button
                class="list-item"
                data-assistant="skills"
            >
                <div class="list-item-main">
                    <strong>What should I learn?</strong>
                    <span>Review your current skill profile.</span>
                </div>
                <span>→</span>
            </button>

            <button
                class="list-item"
                data-assistant="applications"
            >
                <div class="list-item-main">
                    <strong>How is my job search?</strong>
                    <span>Review applications and interviews.</span>
                </div>
                <span>→</span>
            </button>

        </div>

        <div
            id="assistantAnswer"
            style="margin-top:18px"
        ></div>

    </section>

`;

}

function assistantAnswer(type) {

const answer = $("#assistantAnswer");

if (!answer) return;

if (type === "profile") {

    answer.innerHTML = `
        <div class="card card-pad">
            <strong>Your readiness is ${calculateReadiness()}%.</strong>
            <p class="page-subtitle">
                ${
                    calculateReadiness() < 60
                        ? "Complete your profile, add skills and start tracking applications."
                        : "You're building a solid foundation. Focus on applications and interview preparation."
                }
            </p>
        </div>
    `;

    return;
}

if (type === "skills") {

    answer.innerHTML = `
        <div class="card card-pad">
            <strong>Current skills</strong>
            <div class="action-row" style="margin-top:10px">
                ${state.skills.map(s =>
                    `<span class="badge">${escapeHTML(s.name)} · ${s.level}%</span>`
                ).join("")}
            </div>
        </div>
    `;

    return;
}

answer.innerHTML = `
    <div class="card card-pad">
        <strong>Your search currently has ${state.applications.length} applications and ${state.interviews.length} interviews.</strong>
        <p class="page-subtitle">
            Keep tracking every application and update the status as you progress.
        </p>
    </div>
`;

}

/* =========================================================
SETTINGS
========================================================= */

function renderSettings() {

return `

    <div class="page-head">

        <div>
            <div class="eyebrow">SYSTEM</div>
            <h1 class="page-title">Settings</h1>
            <p class="page-subtitle">
                Manage your profile and workspace preferences.
            </p>
        </div>

    </div>


    <section class="card card-pad">

        <div class="section-title">
            <h3>Profile</h3>
        </div>

        <div class="form-grid">

            <div class="form-group">
                <label>NAME</label>
                <input
                    id="settingsName"
                    value="${escapeHTML(state.profile.name)}"
                    maxlength="60"
                >
            </div>

            <div class="form-group">
                <label>TARGET ROLE</label>
                <input
                    id="settingsRole"
                    value="${escapeHTML(state.profile.role)}"
                    maxlength="80"
                >
            </div>

            <div class="form-group">
                <label>EXPERIENCE</label>

                <select id="settingsExperience">

                    ${[
                        "Fresher",
                        "0–1 years",
                        "1–3 years",
                        "3–5 years",
                        "5+ years"
                    ].map(value => `
                        <option
                            ${state.profile.experience === value ? "selected" : ""}
                        >
                            ${value}
                        </option>
                    `).join("")}

                </select>

            </div>

            <div class="form-group">
                <label>LOCATION</label>
                <input
                    id="settingsLocation"
                    value="${escapeHTML(state.profile.location)}"
                    maxlength="80"
                >
            </div>

        </div>

        <div class="action-row" style="margin-top:18px">

            <button
                class="btn primary"
                id="saveSettings"
            >
                Save changes
            </button>

            <button
                class="btn danger"
                id="resetData"
            >
                Reset workspace
            </button>

        </div>

    </section>


    <section class="card card-pad">

        <div class="section-title">
            <h3>Appearance</h3>
        </div>

        <p class="page-subtitle" style="margin:0 0 16px">
            Pick a colour theme for your workspace. It is saved automatically.
        </p>

        ${themeCards()}

    </section>

`;

}

/* =========================================================
PAGE ROUTER
========================================================= */

function renderPage(page) {

const container =
    $("#pageContainer");

const pages = {

    dashboard: renderDashboard,
    analyzer: renderAnalyzer,
    applications: renderApplications,
    interviews: renderInterviews,
    skills: renderSkills,
    career: renderCareer,
    offers: renderOffers,
    analytics: renderAnalytics,
    assistant: renderAssistant,
    settings: renderSettings

};

const renderer =
    pages[page] || renderDashboard;

container.innerHTML =
    renderer();

if (page === "analyzer") {

    $("#analyzeJobButton")
        ?.addEventListener(
            "click",
            analyzeJob
        );
}

if (page === "settings") {

    bindSettings();

    $$(".theme-card").forEach(card =>
        card.addEventListener("click", () =>
            applyTheme(card.dataset.theme, true)
        )
    );
}

container.classList.remove("page-enter");

void container.offsetWidth;

container.classList.add("page-enter");

}

/* =========================================================
MODALS
========================================================= */

function openModal(content) {

$("#modal").innerHTML =
    content;

$("#modalOverlay")
    .classList.remove("hidden");

}

function closeModal() {

$("#modalOverlay")
    .classList.add("hidden");

$("#modal").innerHTML = "";

}

/* =========================================================
ADD APPLICATION
========================================================= */

function addApplicationModal() {

openModal(`

    <div class="modal-head">

        <div>
            <h2>Add application</h2>
            <p>Track a new opportunity.</p>
        </div>

        <button class="close-btn" data-close-modal>
            ×
        </button>

    </div>


    <form id="applicationForm">

        <div class="form-grid">

            <div class="form-group">
                <label>COMPANY</label>
                <input id="appCompany" required maxlength="80">
            </div>

            <div class="form-group">
                <label>ROLE</label>
                <input id="appRole" required maxlength="80">
            </div>

            <div class="form-group">
                <label>LOCATION</label>
                <input id="appLocation" maxlength="80">
            </div>

            <div class="form-group">
                <label>STATUS</label>

                <select id="appStatus">

                    <option>Applied</option>
                    <option>Screening</option>
                    <option>Interview</option>
                    <option>Offer</option>
                    <option>Rejected</option>
                    <option>Withdrawn</option>

                </select>

            </div>

        </div>


        <div class="modal-actions">

            <button
                type="button"
                class="btn secondary"
                data-close-modal
            >
                Cancel
            </button>

            <button
                type="submit"
                class="btn primary"
            >
                Add application
            </button>

        </div>

    </form>

`);


$("#applicationForm")
    .addEventListener("submit", event => {

        event.preventDefault();

        const company =
            $("#appCompany").value.trim();

        const role =
            $("#appRole").value.trim();

        if (!company || !role) {

            showToast(
                "Company and role are required."
            );

            return;
        }

        state.applications.push({

            id: uid(),

            company,

            role,

            location:
                $("#appLocation").value.trim(),

            status:
                $("#appStatus").value,

            date: today()

        });

        saveState();

        closeModal();

        updateProfileUI();

        setPage("applications");

        showToast("Application added.");
    });

}

/* =========================================================
ADD INTERVIEW
========================================================= */

function addInterviewModal() {

openModal(`

    <div class="modal-head">

        <div>
            <h2>Add interview</h2>
            <p>Keep your next interview visible.</p>
        </div>

        <button class="close-btn" data-close-modal>
            ×
        </button>

    </div>


    <form id="interviewForm">

        <div class="form-grid">

            <div class="form-group">
                <label>COMPANY</label>
                <input id="interviewCompany" required>
            </div>

            <div class="form-group">
                <label>INTERVIEW TYPE</label>

                <select id="interviewType">
                    <option>HR Interview</option>
                    <option>Technical Interview</option>
                    <option>Managerial Interview</option>
                    <option>Assessment</option>
                    <option>Final Round</option>
                </select>

            </div>

            <div class="form-group full">
                <label>DATE</label>
                <input
                    id="interviewDate"
                    type="date"
                    required
                >
            </div>

        </div>


        <div class="modal-actions">

            <button
                type="button"
                class="btn secondary"
                data-close-modal
            >
                Cancel
            </button>

            <button
                type="submit"
                class="btn primary"
            >
                Add interview
            </button>

        </div>

    </form>

`);


$("#interviewForm")
    .addEventListener("submit", event => {

        event.preventDefault();

        const company =
            $("#interviewCompany")
                .value
                .trim();

        const date =
            $("#interviewDate").value;

        if (!company || !date) {

            showToast(
                "Company and date are required."
            );

            return;
        }

        state.interviews.push({

            id: uid(),

            company,

            type:
                $("#interviewType").value,

            date

        });

        saveState();

        closeModal();

        updateProfileUI();

        setPage("interviews");

        showToast("Interview added.");
    });

}

/* =========================================================
ADD SKILL
========================================================= */

function addSkillModal() {

openModal(`

    <div class="modal-head">

        <div>
            <h2>Add skill</h2>
            <p>Track a skill you are developing.</p>
        </div>

        <button class="close-btn" data-close-modal>
            ×
        </button>

    </div>


    <form id="skillForm">

        <div class="form-grid">

            <div class="form-group">

                <label>SKILL</label>

                <input
                    id="skillName"
                    maxlength="50"
                    required
                    placeholder="e.g. React"
                >

            </div>

            <div class="form-group">

                <label>LEVEL</label>

                <input
                    id="skillLevel"
                    type="number"
                    min="0"
                    max="100"
                    value="50"
                    required
                >

            </div>

        </div>


        <div class="modal-actions">

            <button
                type="button"
                class="btn secondary"
                data-close-modal
            >
                Cancel
            </button>

            <button
                type="submit"
                class="btn primary"
            >
                Add skill
            </button>

        </div>

    </form>

`);


$("#skillForm")
    .addEventListener("submit", event => {

        event.preventDefault();

        const name =
            $("#skillName")
                .value
                .trim();

        const level =
            Number($("#skillLevel").value);

        if (!name) {

            showToast("Enter a skill name.");

            return;
        }

        state.skills.push({

            name,

            level:
                Math.max(
                    0,
                    Math.min(100,level)
                )

        });

        saveState();

        closeModal();

        updateProfileUI();

        setPage("skills");

        showToast("Skill added.");
    });

}

/* =========================================================
ADD OFFER
========================================================= */

function addOfferModal() {

openModal(`

    <div class="modal-head">

        <div>
            <h2>Add offer</h2>
            <p>Keep your offers together for comparison.</p>
        </div>

        <button class="close-btn" data-close-modal>
            ×
        </button>

    </div>


    <form id="offerForm">

        <div class="form-grid">

            <div class="form-group">
                <label>COMPANY</label>
                <input id="offerCompany" required>
            </div>

            <div class="form-group">
                <label>ROLE</label>
                <input id="offerRole" required>
            </div>

            <div class="form-group">
                <label>CTC</label>
                <input
                    id="offerCtc"
                    placeholder="e.g. ₹6 LPA"
                >
            </div>

            <div class="form-group">
                <label>LOCATION</label>
                <input id="offerLocation">
            </div>

        </div>


        <div class="modal-actions">

            <button
                type="button"
                class="btn secondary"
                data-close-modal
            >
                Cancel
            </button>

            <button
                type="submit"
                class="btn primary"
            >
                Add offer
            </button>

        </div>

    </form>

`);


$("#offerForm")
    .addEventListener("submit", event => {

        event.preventDefault();

        const company =
            $("#offerCompany")
                .value
                .trim();

        const role =
            $("#offerRole")
                .value
                .trim();

        if (!company || !role) {

            showToast(
                "Company and role are required."
            );

            return;
        }

        state.offers.push({

            id: uid(),

            company,

            role,

            ctc:
                $("#offerCtc").value.trim(),

            location:
                $("#offerLocation").value.trim(),

            date: today()

        });

        saveState();

        closeModal();

        updateProfileUI();

        setPage("offers");

        showToast("Offer added.");
    });

}

/* =========================================================
SETTINGS
========================================================= */

function bindSettings() {

bindRoleField($("#settingsRole"));

$("#saveSettings")
    ?.addEventListener("click", () => {

        const roleInput =
            $("#settingsRole");

        if (!validateField(roleInput)) {

            roleInput.focus();

            return;
        }

        const name =
            $("#settingsName")
                .value
                .trim();

        if (!name) {

            showToast("Name cannot be empty.");

            return;
        }

        state.profile.name =
            name;

        state.profile.role =
            roleInput.value.trim();

        state.profile.experience =
            $("#settingsExperience").value;

        state.profile.location =
            $("#settingsLocation")
                .value
                .trim();

        saveState();

        updateProfileUI();

        showToast("Profile updated.");
    });


$("#resetData")
    ?.addEventListener("click", () => {

        const confirmed =
            confirm(
                "Reset the entire Career Command Center workspace?"
            );

        if (!confirmed) return;

        localStorage.removeItem(STORAGE_KEY);

        state =
            JSON.parse(
                JSON.stringify(defaultState)
            );

        onboardingStep = 0;

        $("#onboarding")
            .classList.remove("hidden");

        renderOnboarding();

        updateProfileUI();

        setPage("dashboard");

        showToast("Workspace reset.");
    });

}

/* =========================================================
SEARCH
========================================================= */

const searchablePages = [

["Dashboard","dashboard","Your career command center"],
["Job Analyzer","analyzer","Analyze job descriptions"],
["Applications","applications","Track applications"],
["Interviews","interviews","Prepare for interviews"],
["Skills","skills","Track your skills"],
["Career Plan","career","Career roadmap"],
["Offers","offers","Compare offers"],
["Analytics","analytics","Job search insights"],
["Assistant","assistant","Career guidance"],
["Settings","settings","Profile settings"]

];

function openSearch() {

$("#searchOverlay")
    .classList.remove("hidden");

$("#globalSearch").value = "";

renderSearchResults("");

setTimeout(() =>
    $("#globalSearch").focus(),
    30
);

}

function closeSearch() {

$("#searchOverlay")
    .classList.add("hidden");

}

function renderSearchResults(query) {

const q =
    query.toLowerCase().trim();

const results =
    searchablePages.filter(item =>
        item[0].toLowerCase().includes(q) ||
        item[2].toLowerCase().includes(q)
    );

$("#searchResults").innerHTML =
    results.map(item => `

        <button
            class="search-result"
            data-search-page="${item[1]}"
        >

            <span>◆</span>

            <div>
                <strong>${escapeHTML(item[0])}</strong>
                <small>${escapeHTML(item[2])}</small>
            </div>

        </button>

    `).join("") ||
    `<div class="empty">No results found.</div>`;

}

/* =========================================================
COMMAND PALETTE
========================================================= */

function openCommandPalette() {

$("#commandOverlay")
    .classList.remove("hidden");

$("#commandInput").value = "";

renderCommands("");

setTimeout(() =>
    $("#commandInput").focus(),
    30
);

}

function closeCommandPalette() {

$("#commandOverlay")
    .classList.add("hidden");

}

function renderCommands(query) {

const commands = [

    {
        name: "Go to Dashboard",
        action: () => setPage("dashboard")
    },

    {
        name: "Analyze a Job",
        action: () => setPage("analyzer")
    },

    {
        name: "Open Applications",
        action: () => setPage("applications")
    },

    {
        name: "Add Application",
        action: addApplicationModal
    },

    {
        name: "Add Interview",
        action: addInterviewModal
    },

    {
        name: "Add Skill",
        action: addSkillModal
    },

    {
        name: "Open Career Plan",
        action: () => setPage("career")
    },

    {
        name: "Open Settings",
        action: () => setPage("settings")
    }

];

const q =
    query.toLowerCase().trim();

const filtered =
    commands.filter(command =>
        command.name.toLowerCase().includes(q)
    );

$("#commandResults").innerHTML =
    filtered.map((command,index) => `

        <button
            class="command-result"
            data-command-index="${index}"
        >

            <span>✦</span>

            <div>
                <strong>${escapeHTML(command.name)}</strong>
                <small>Command</small>
            </div>

        </button>

    `).join("");

}

/* =========================================================
NOTIFICATIONS
========================================================= */

function openNotifications() {

const panel =
    $("#notificationPanel");

panel.classList.toggle("hidden");

renderNotifications();

}

function renderNotifications() {

const notifications =
    state.notifications || [];

$("#notificationCount").textContent =
    `${notifications.length} updates`;

$("#notificationList").innerHTML =
    notifications.length
        ? notifications.map(item => `
            <div class="notification">
                <strong>${escapeHTML(item.title)}</strong>
                <p>${escapeHTML(item.text)}</p>
            </div>
        `).join("")
        : `
            <div class="empty">
                <strong>No notifications</strong>
                You're all caught up.
            </div>
        `;

$("#notificationDot")
    .classList.toggle(
        "visible",
        notifications.length > 0
    );

}

/* =========================================================
EVENT DELEGATION
========================================================= */

document.addEventListener("click", event => {

const nav =
    event.target.closest("[data-page]");

if (nav) {

    event.preventDefault();

    setPage(nav.dataset.page);

    return;
}


const action =
    event.target.closest("[data-action]");

if (action) {

    const type =
        action.dataset.action;

    if (type === "analyze") {
        setPage("analyzer");
    }

    if (type === "applications") {
        setPage("applications");
    }

    if (type === "skills") {
        setPage("skills");
    }

    if (type === "addApplication") {
        addApplicationModal();
    }

    if (type === "addInterview") {
        addInterviewModal();
    }

    if (type === "addSkill") {
        addSkillModal();
    }

    if (type === "addOffer") {
        addOfferModal();
    }

    return;
}


const close =
    event.target.closest("[data-close-modal]");

if (close) {

    closeModal();

    return;
}


const deleteApplication =
    event.target.closest(
        "[data-delete-application]"
    );

if (deleteApplication) {

    const id =
        deleteApplication.dataset
            .deleteApplication;

    state.applications =
        state.applications.filter(
            item => item.id !== id
        );

    saveState();

    updateProfileUI();

    setPage("applications");

    showToast("Application deleted.");

    return;
}


const deleteInterview =
    event.target.closest(
        "[data-delete-interview]"
    );

if (deleteInterview) {

    const id =
        deleteInterview.dataset
            .deleteInterview;

    state.interviews =
        state.interviews.filter(
            item => item.id !== id
        );

    saveState();

    updateProfileUI();

    setPage("interviews");

    showToast("Interview deleted.");

    return;
}


const deleteOffer =
    event.target.closest(
        "[data-delete-offer]"
    );

if (deleteOffer) {

    const id =
        deleteOffer.dataset.deleteOffer;

    state.offers =
        state.offers.filter(
            item => item.id !== id
        );

    saveState();

    updateProfileUI();

    setPage("offers");

    showToast("Offer deleted.");

    return;
}


const searchPage =
    event.target.closest(
        "[data-search-page]"
    );

if (searchPage) {

    closeSearch();

    setPage(
        searchPage.dataset.searchPage
    );

    return;
}


const assistant =
    event.target.closest(
        "[data-assistant]"
    );

if (assistant) {

    assistantAnswer(
        assistant.dataset.assistant
    );

    return;
}


const command =
    event.target.closest(
        "[data-command-index]"
    );

if (command) {

    const buttons =
        $$(".command-result");

    const index =
        Number(
            command.dataset.commandIndex
        );

    const commands = [

        () => setPage("dashboard"),
        () => setPage("analyzer"),
        () => setPage("applications"),
        addApplicationModal,
        addInterviewModal,
        addSkillModal,
        () => setPage("career"),
        () => setPage("settings")

    ];

    closeCommandPalette();

    if (commands[index]) {
        commands[index]();
    }

    return;
}

});

/* =========================================================
GLOBAL EVENTS
========================================================= */

$("#nextStep")
.addEventListener(
"click",
nextOnboarding
);

$("#backStep")
.addEventListener(
"click",
previousOnboarding
);

$("#modalOverlay")
.addEventListener("click", event => {

    if (
        event.target ===
        $("#modalOverlay")
    ) {
        closeModal();
    }

});

$("#searchBtn")
.addEventListener(
"click",
openSearch
);

$("#searchOverlay")
.addEventListener("click", event => {

    if (
        event.target ===
        $("#searchOverlay")
    ) {
        closeSearch();
    }

});

$("#globalSearch")
.addEventListener(
"input",
event =>
renderSearchResults(
event.target.value
)
);

$("#notificationBtn")
.addEventListener(
"click",
openNotifications
);

$("#closeNotifications")
.addEventListener(
"click",
() =>
$("#notificationPanel")
.classList.add("hidden")
);

$("#themeBtn")
.addEventListener("click", event => {

    event.stopPropagation();

    if ($("#themeMenu").classList.contains("hidden")) {

        openThemeMenu();

    } else {

        closeThemeMenu();
    }

});

document.addEventListener("click", event => {

    const menu = $("#themeMenu");

    if (
        menu &&
        !menu.classList.contains("hidden") &&
        !event.target.closest(".theme-wrap")
    ) {
        closeThemeMenu();
    }

});

$("#profileBtn")
.addEventListener(
"click",
() => setPage("settings")
);

$("#sidebarUser")
.addEventListener(
"click",
() => setPage("settings")
);

function toggleSidebar(force) {

    const sidebar = $("#sidebar");

    const open =
        typeof force === "boolean"
            ? force
            : !sidebar.classList.contains("open");

    sidebar.classList.toggle("open", open);

    $("#sidebarBackdrop")
        .classList.toggle("visible", open);

    document.body.classList.toggle("nav-open", open);
}

$("#mobileMenu")
.addEventListener(
"click",
() => toggleSidebar()
);

$("#sidebarBackdrop")
.addEventListener(
"click",
() => toggleSidebar(false)
);

$("#mobileMore")
.addEventListener(
"click",
() => setPage("settings")
);

/* Keyboard shortcuts */

document.addEventListener(
"keydown",
event => {

    if (
        event.key === "Escape"
    ) {

        closeModal();
        closeSearch();
        closeCommandPalette();
        closeThemeMenu();

        $("#notificationPanel")
            .classList.add("hidden");

        return;
    }


    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
    ) {

        event.preventDefault();

        openCommandPalette();

    }

}

);

$("#commandInput")
.addEventListener(
"input",
event =>
renderCommands(
event.target.value
)
);

$("#commandOverlay")
.addEventListener("click", event => {

    if (
        event.target ===
        $("#commandOverlay")
    ) {
        closeCommandPalette();
    }

});

/* =========================================================
START APPLICATION
========================================================= */

function initialize() {

applyTheme(state.theme, false);

document.body.insertAdjacentHTML(
    "beforeend",
    roleDatalist()
);

initGooeyNav();

updateProfileUI();

renderNotifications();

if (!state.onboarded) {

    $("#onboarding")
        .classList.remove("hidden");

    renderOnboarding();

} else {

    $("#onboarding")
        .classList.add("hidden");

    setPage("dashboard");

}

}

initialize();
