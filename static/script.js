const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalFields = document.getElementById("modal-fields");
const modalSave = document.getElementById("modal-save");
const modalCancel = document.getElementById("modal-cancel");
const modalClose = document.getElementById("modal-close");


const profileData = {
    experiences: [],
    educations: [],
    projects: [],
    skills: [],
    languages: [],
    licenses: [],
    certificates: []
};


let currentType = null;
let editingIndex = null;


const configs = {

    experience: {
        title: "Erfarenhet",
        array: "experiences",
        list: "experience-list",
        empty: "experience-empty",

        fields: [
            ["title", "Roll", "text"],
            ["company", "Företag", "text"],
            ["startDate", "Startdatum", "monthyear"],
            ["endDate", "Slutdatum", "monthyear"],
            ["current", "Pågående", "checkbox"],
            ["description", "Beskrivning", "textarea"],
            ["skills", "Skills, separerade med kommatecken", "text"]
        ]
    },

    education: {
        title: "Utbildning",
        array: "educations",
        list: "education-list",
        empty: "education-empty",

        fields: [
            ["program", "Program / utbildning", "text"],
            ["school", "Skola", "text"],
            ["startDate", "Startdatum", "monthyear"],
            ["endDate", "Slutdatum", "monthyear"],
            ["current", "Pågående", "checkbox"],
            ["description", "Beskrivning", "textarea"],
            ["courses", "Relevanta kurser, separerade med kommatecken", "text"]
        ]
    },

    project: {
        title: "Projekt",
        array: "projects",
        list: "project-list",
        empty: "project-empty",

        fields: [
            ["name", "Projektnamn", "text"],
            ["startDate", "Startdatum", "monthyear"],
            ["endDate", "Slutdatum", "monthyear"],
            ["description", "Beskrivning", "textarea"],
            ["responsibilities", "Vad gjorde du?", "textarea"],
            ["technologies", "Tekniker, separerade med kommatecken", "text"],
            ["url", "Projektlänk", "text"]
        ]
    },

    skill: {
        title: "Teknisk färdighet",
        array: "skills",
        list: "skill-list",
        empty: "skill-empty",

        fields: [
            ["name", "Färdighet", "text"],
            ["category", "Kategori", "text"]
        ]
    },

    language: {
        title: "Språk",
        array: "languages",
        list: "language-list",
        empty: "language-empty",

        fields: [
            ["language", "Språk", "text"],
            ["level", "Nivå", "text"]
        ]
    },

    license: {
        title: "Körkort",
        array: "licenses",
        list: "license-list",
        empty: "license-empty",

        fields: [
            ["type", "Behörighet", "text"]
        ]
    },

    certificate: {
        title: "Certifikat",
        array: "certificates",
        list: "certificate-list",
        empty: "certificate-empty",

        fields: [
            ["name", "Certifikat", "text"],
            ["issuer", "Utfärdare", "text"],
            ["issueDate", "Utfärdat", "month"],
            ["expiryDate", "Giltigt till", "month"]
        ]
    }
};


document.getElementById("add-experience-button")
    .addEventListener("click", () => openModal("experience"));

document.getElementById("add-education-button")
    .addEventListener("click", () => openModal("education"));

document.getElementById("add-project-button")
    .addEventListener("click", () => openModal("project"));

document.getElementById("add-skill-button")
    .addEventListener("click", () => openModal("skill"));

document.getElementById("add-language-button")
    .addEventListener("click", () => openModal("language"));

document.getElementById("add-license-button")
    .addEventListener("click", () => openModal("license"));

document.getElementById("add-certificate-button")
    .addEventListener("click", () => openModal("certificate"));


modalCancel.addEventListener("click", closeModal);
modalClose.addEventListener("click", closeModal);


modal.addEventListener("click", event => {
    if (event.target === modal) {
        closeModal();
    }
});


modalSave.addEventListener("click", saveCurrentItem);


function openModal(type, index = null) {

    currentType = type;
    editingIndex = index;

    const config = configs[type];

    modalTitle.textContent =
        index === null
            ? `Lägg till ${config.title.toLowerCase()}`
            : `Redigera ${config.title.toLowerCase()}`;

    modalSave.textContent =
        index === null
            ? "Spara"
            : "Spara ändringar";

    modalFields.innerHTML = "";

    const existingItem =
        index === null
            ? {}
            : profileData[config.array][index];


    config.fields.forEach(([key, label, type]) => {

        const group = document.createElement("div");
        group.classList.add("form-group");


        if (type === "checkbox") {

            group.classList.add("checkbox-row");

            const input = document.createElement("input");

            input.type = "checkbox";
            input.id = `field-${key}`;
            input.checked = existingItem[key] || false;

            const labelElement = document.createElement("label");
            labelElement.htmlFor = input.id;
            labelElement.textContent = label;

            group.appendChild(input);
            group.appendChild(labelElement);

        } else if (type === "monthyear") {

            const labelElement = document.createElement("label");
            labelElement.textContent = label;

            const wrapper = document.createElement("div");
            wrapper.classList.add("month-year-row");

            const monthSelect = document.createElement("select");
            monthSelect.id = `field-${key}-month`;

            const yearSelect = document.createElement("select");
            yearSelect.id = `field-${key}-year`;


            const months = [
                ["01", "Januari"],
                ["02", "Februari"],
                ["03", "Mars"],
                ["04", "April"],
                ["05", "Maj"],
                ["06", "Juni"],
                ["07", "Juli"],
                ["08", "Augusti"],
                ["09", "September"],
                ["10", "Oktober"],
                ["11", "November"],
                ["12", "December"]
            ];


            monthSelect.innerHTML =
                `<option value="">Månad</option>` +
                months
                    .map(([value, name]) =>
                        `<option value="${value}">${name}</option>`
                    )
                    .join("");


            const currentYear = new Date().getFullYear();

            yearSelect.innerHTML =
                `<option value="">År</option>`;

            for (let year = currentYear + 1; year >= 1980; year--) {
                yearSelect.innerHTML +=
                    `<option value="${year}">${year}</option>`;
            }


            const existingValue = existingItem[key] || "";

            if (existingValue.includes("-")) {

                const [year, month] = existingValue.split("-");

                monthSelect.value = month;
                yearSelect.value = year;
            }


            wrapper.appendChild(monthSelect);
            wrapper.appendChild(yearSelect);

            group.appendChild(labelElement);
            group.appendChild(wrapper);

        } else {

            const labelElement = document.createElement("label");

            labelElement.htmlFor = `field-${key}`;
            labelElement.textContent = label;

            let input;

            if (type === "textarea") {

                input = document.createElement("textarea");

            } else {

                input = document.createElement("input");
                input.type = type;
            }

            input.id = `field-${key}`;

            let value = existingItem[key] || "";

            if (Array.isArray(value)) {
                value = value.join(", ");
            }

            input.value = value;

            group.appendChild(labelElement);
            group.appendChild(input);
}


        modalFields.appendChild(group);
    });


    modal.classList.remove("hidden");
}


function closeModal() {

    modal.classList.add("hidden");

    currentType = null;
    editingIndex = null;

    modalFields.innerHTML = "";
}


function saveCurrentItem() {

    if (!currentType) {
        return;
    }


    const config = configs[currentType];

    const item = {};


    config.fields.forEach(([key, label, type]) => {

    if (type === "monthyear") {

        const month =
            document.getElementById(`field-${key}-month`).value;

        const year =
            document.getElementById(`field-${key}-year`).value;

        item[key] =
            year && month
                ? `${year}-${month}`
                : "";

        return;
    }


    const element =
        document.getElementById(`field-${key}`);


    if (type === "checkbox") {

        item[key] = element.checked;

    } else {

        let value = element.value.trim();

        if (
            key === "skills" ||
            key === "courses" ||
            key === "technologies"
        ) {

            value = value
                ? value.split(",").map(x => x.trim()).filter(Boolean)
                : [];
        }

        item[key] = value;
    }
});


    if (editingIndex === null) {

        profileData[config.array].push(item);

    } else {

        profileData[config.array][editingIndex] = item;
    }


    renderType(currentType);

    closeModal();

    console.log(profileData);
}


function renderType(type) {

    const config = configs[type];

    const items = profileData[config.array];

    const list =
        document.getElementById(config.list);

    const empty =
        document.getElementById(config.empty);


    list.querySelectorAll(".generated-item")
        .forEach(element => element.remove());


    empty.style.display =
        items.length === 0
            ? "block"
            : "none";


    items.forEach((item, index) => {

        let element;


        if (
            type === "skill" ||
            type === "license"
        ) {

            element = renderTag(type, item, index);

        } else {

            element = renderCard(type, item, index);
        }


        element.classList.add("generated-item");

        list.appendChild(element);
    });
}


function renderTag(type, item, index) {

    const element = document.createElement("div");

    element.classList.add("tag");


    let text = "";

    if (type === "skill") {

        text =
            item.category
                ? `${item.name} · ${item.category}`
                : item.name;

    } else {

        text = item.type;
    }


    element.innerHTML = `
        <span>${escapeHtml(text)}</span>

        <button
            type="button"
            onclick="editItem('${type}', ${index})"
        >
            ✎
        </button>

        <button
            type="button"
            onclick="deleteItem('${type}', ${index})"
        >
            ×
        </button>
    `;


    return element;
}


function renderCard(type, item, index) {

    const card = document.createElement("div");

    card.classList.add("item-card");


    let title = "";
    let subtitle = "";
    let period = "";
    let description = "";
    let tags = [];


    if (type === "experience") {

        title = item.title;
        subtitle = item.company;

        period =
            `${formatDate(item.startDate)} – ${
                item.current
                    ? "Pågående"
                    : formatDate(item.endDate)
            }`;

        description = item.description;

        tags = item.skills || [];
    }


    if (type === "education") {

        title = item.program;
        subtitle = item.school;

        period =
            `${formatDate(item.startDate)} – ${
                item.current
                    ? "Pågående"
                    : formatDate(item.endDate)
            }`;

        description = item.description;

        tags = item.courses || [];
    }


    if (type === "project") {

        title = item.name;

        period =
            `${formatDate(item.startDate)} – ${formatDate(item.endDate)}`;

        description =
            [item.description, item.responsibilities]
                .filter(Boolean)
                .join("\n\n");

        tags = item.technologies || [];

        subtitle = item.url || "";
    }


    if (type === "language") {

        title = item.language;
        subtitle = item.level;
    }


    if (type === "certificate") {

        title = item.name;
        subtitle = item.issuer;

        period =
            `${formatDate(item.issueDate)}${
                item.expiryDate
                    ? " – " + formatDate(item.expiryDate)
                    : ""
            }`;
    }


    card.innerHTML = `
        <div class="item-header">

            <div>
                <h3>${escapeHtml(title)}</h3>

                ${
                    subtitle
                        ? `<p class="item-subtitle">${escapeHtml(subtitle)}</p>`
                        : ""
                }
            </div>

            ${
                period
                    ? `<span class="item-period">${escapeHtml(period)}</span>`
                    : ""
            }

        </div>

        ${
            description
                ? `<p class="item-description">${escapeHtml(description)}</p>`
                : ""
        }

        ${
            tags.length
                ? `
                    <div class="tags">
                        ${tags
                            .map(tag =>
                                `<span class="tag">${escapeHtml(tag)}</span>`
                            )
                            .join("")}
                    </div>
                `
                : ""
        }

        <div class="item-actions">

            <button
                class="text-button"
                type="button"
                onclick="editItem('${type}', ${index})"
            >
                Redigera
            </button>

            <button
                class="text-button danger"
                type="button"
                onclick="deleteItem('${type}', ${index})"
            >
                Ta bort
            </button>

        </div>
    `;


    return card;
}


function editItem(type, index) {
    openModal(type, index);
}


function deleteItem(type, index) {

    const config = configs[type];

    profileData[config.array].splice(index, 1);

    renderType(type);
}


function formatDate(value) {

    if (!value) {
        return "";
    }

    const [year, month] = value.split("-");

    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Maj",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Okt",
        "Nov",
        "Dec"
    ];

    return `${months[Number(month) - 1]} ${year}`;
}


function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value || "";

    return div.innerHTML;
}


/* PROFILKNAPP */

document.getElementById("save-profile-button")
    .addEventListener("click", async () => {

        const completeProfile = {

            personalInformation: {
                name: document.getElementById("name").value.trim(),
                email: document.getElementById("email").value.trim(),
                phone: document.getElementById("phone").value.trim(),
                location: document.getElementById("location").value.trim(),
                linkedin: document.getElementById("linkedin").value.trim(),
                github: document.getElementById("github").value.trim()
            },

            ...profileData
        };


        try {

            const response = await fetch("/api/profile", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(completeProfile)
            });


            const result = await response.json();


            if (response.ok) {

                alert("Profilen sparades!");

                console.log(result);

            } else {

                alert("Något gick fel när profilen skulle sparas.");

            }

        } catch (error) {

            console.error(error);

            alert("Kunde inte kontakta servern.");

        }
    });
async function loadProfile() {
    try {
        const response = await fetch("/api/profile");
        const savedProfile = await response.json();

        if (!savedProfile || Object.keys(savedProfile).length === 0) {
            return;
        }

        const personal = savedProfile.personalInformation || {};

        document.getElementById("name").value = personal.name || "";
        document.getElementById("email").value = personal.email || "";
        document.getElementById("phone").value = personal.phone || "";
        document.getElementById("location").value = personal.location || "";
        document.getElementById("linkedin").value = personal.linkedin || "";
        document.getElementById("github").value = personal.github || "";

        profileData.experiences = savedProfile.experiences || [];
        profileData.educations = savedProfile.educations || [];
        profileData.projects = savedProfile.projects || [];
        profileData.skills = savedProfile.skills || [];
        profileData.languages = savedProfile.languages || [];
        profileData.licenses = savedProfile.licenses || [];
        profileData.certificates = savedProfile.certificates || [];

        renderType("experience");
        renderType("education");
        renderType("project");
        renderType("skill");
        renderType("language");
        renderType("license");
        renderType("certificate");

        console.log("Profil laddad:", savedProfile);

    } catch (error) {
        console.error("Kunde inte ladda profilen:", error);
    }
}

loadProfile();