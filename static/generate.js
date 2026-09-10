const generateButton =
    document.getElementById("generate-button");

const jobAd =
    document.getElementById("job-ad");

const statusText =
    document.getElementById("generate-status");

const resultSection =
    document.getElementById("result-section");

const cvResult =
    document.getElementById("cv-result");

const letterResult =
    document.getElementById("letter-result");

const motivationResult =
    document.getElementById("motivation-result");

const matchedRequirements =
    document.getElementById("matched-requirements");

const downloadCvButton =
    document.getElementById("download-cv-button");


let latestGeneratedCV = null;


// --------------------------------------------------
// GENERERA ANSÖKAN
// --------------------------------------------------

generateButton.addEventListener("click", async () => {

    const jobText = jobAd.value.trim();

    if (!jobText) {
        alert("Klistra in en jobbannons först.");
        return;
    }


    generateButton.disabled = true;
    generateButton.textContent = "Genererar...";

    statusText.textContent =
        "Analyserar jobbannons och profil...";


    try {

        const response = await fetch(
            "/api/generate",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    job_ad: jobText
                })
            }
        );


        const result = await response.json();


        if (!response.ok) {
            throw new Error(
                result.error ||
                "Något gick fel vid AI-genereringen."
            );
        }


        // Spara CV:t för PDF-export
        latestGeneratedCV = result.cv;


        // Rendera resultat
        renderCV(result.cv);

        letterResult.textContent =
            result.cover_letter || "";

        motivationResult.textContent =
            result.motivation || "";

        renderMatchedRequirements(
            result.matched_requirements || []
        );


        resultSection.classList.remove("hidden");

        statusText.textContent =
            "Klart!";


        // Scrolla ner till resultat
        resultSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


    } catch (error) {

        console.error(
            "Generate error:",
            error
        );

        statusText.textContent = "";

        alert(error.message);


    } finally {

        generateButton.disabled = false;

        generateButton.textContent =
            "Generera CV";

    }

});


// --------------------------------------------------
// RENDERA CV
// --------------------------------------------------

function renderCV(cv) {

    cvResult.innerHTML = "";

    if (!cv) {
        return;
    }


    let html = "";


    // PROFIL
    if (cv.summary) {

        html += `
            <section class="cv-section">

                <h3>Profil</h3>

                <p>
                    ${escapeHtml(cv.summary)}
                </p>

            </section>
        `;
    }


    // ARBETSLIVSERFARENHET
    if (
        cv.experiences &&
        cv.experiences.length > 0
    ) {

        html += `
            <section class="cv-section">

                <h3>Arbetslivserfarenhet</h3>
        `;


        cv.experiences.forEach(exp => {

            html += `
                <div class="cv-entry">

                    <div class="cv-entry-header">

                        <div>

                            <h4>
                                ${escapeHtml(exp.title)}
                            </h4>

                            <span>
                                ${escapeHtml(exp.company)}
                            </span>

                        </div>

                        <span class="cv-period">
                            ${escapeHtml(exp.period)}
                        </span>

                    </div>


                    ${
                        exp.description
                            ? `
                                <p>
                                    ${escapeHtml(exp.description)}
                                </p>
                            `
                            : ""
                    }


                    ${
                        exp.bullet_points &&
                        exp.bullet_points.length > 0
                            ? `
                                <ul>

                                    ${exp.bullet_points
                                        .map(point => `
                                            <li>
                                                ${escapeHtml(point)}
                                            </li>
                                        `)
                                        .join("")}

                                </ul>
                            `
                            : ""
                    }

                </div>
            `;
        });


        html += `
            </section>
        `;
    }


    // UTBILDNING
    if (
        cv.education &&
        cv.education.length > 0
    ) {

        html += `
            <section class="cv-section">

                <h3>Utbildning</h3>
        `;


        cv.education.forEach(education => {

            html += `
                <div class="cv-entry">

                    <div class="cv-entry-header">

                        <div>

                            <h4>
                                ${escapeHtml(
                                    education.program
                                )}
                            </h4>

                            <span>
                                ${escapeHtml(
                                    education.school
                                )}
                            </span>

                        </div>

                        <span class="cv-period">
                            ${escapeHtml(
                                education.period
                            )}
                        </span>

                    </div>


                    ${
                        education.description
                            ? `
                                <p>
                                    ${escapeHtml(
                                        education.description
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>
            `;
        });


        html += `
            </section>
        `;
    }


    // PROJEKT
    if (
        cv.projects &&
        cv.projects.length > 0
    ) {

        html += `
            <section class="cv-section">

                <h3>Projekt</h3>
        `;


        cv.projects.forEach(project => {

            html += `
                <div class="cv-entry">

                    <h4>
                        ${escapeHtml(project.name)}
                    </h4>


                    ${
                        project.description
                            ? `
                                <p>
                                    ${escapeHtml(
                                        project.description
                                    )}
                                </p>
                            `
                            : ""
                    }


                    ${
                        project.technologies &&
                        project.technologies.length > 0
                            ? `
                                <div class="cv-tags">

                                    ${project.technologies
                                        .map(technology => `
                                            <span>
                                                ${escapeHtml(
                                                    technology
                                                )}
                                            </span>
                                        `)
                                        .join("")}

                                </div>
                            `
                            : ""
                    }

                </div>
            `;
        });


        html += `
            </section>
        `;
    }


    // TEKNISKA FÄRDIGHETER
    if (
        cv.skills &&
        cv.skills.length > 0
    ) {

        html += `
            <section class="cv-section">

                <h3>Tekniska färdigheter</h3>

                <div class="cv-tags">

                    ${cv.skills
                        .map(skill => `
                            <span>
                                ${escapeHtml(skill)}
                            </span>
                        `)
                        .join("")}

                </div>

            </section>
        `;
    }


    // SPRÅK
    if (
        cv.languages &&
        cv.languages.length > 0
    ) {

        html += `
            <section class="cv-section">

                <h3>Språk</h3>

                <p>
                    ${cv.languages
                        .map(language =>
                            escapeHtml(language)
                        )
                        .join(" · ")}
                </p>

            </section>
        `;
    }


    // CERTIFIKAT
    if (
        cv.certificates &&
        cv.certificates.length > 0
    ) {

        html += `
            <section class="cv-section">

                <h3>Certifikat</h3>

                <ul>

                    ${cv.certificates
                        .map(certificate => `
                            <li>
                                ${escapeHtml(
                                    certificate
                                )}
                            </li>
                        `)
                        .join("")}

                </ul>

            </section>
        `;
    }


    // KÖRKORT
    if (
        cv.driving_licenses &&
        cv.driving_licenses.length > 0
    ) {

        html += `
            <section class="cv-section">

                <h3>Körkort</h3>

                <p>
                    ${cv.driving_licenses
                        .map(license =>
                            escapeHtml(license)
                        )
                        .join(", ")}
                </p>

            </section>
        `;
    }


    cvResult.innerHTML = html;
}


// --------------------------------------------------
// MATCHADE KRAV
// --------------------------------------------------

function renderMatchedRequirements(requirements) {

    matchedRequirements.innerHTML = "";


    if (
        !requirements ||
        requirements.length === 0
    ) {

        matchedRequirements.innerHTML =
            "<span>Inga tydliga matchningar identifierades.</span>";

        return;
    }


    requirements.forEach(requirement => {

        const tag =
            document.createElement("span");

        tag.classList.add("match-tag");

        tag.textContent =
            requirement;

        matchedRequirements.appendChild(tag);

    });
}


// --------------------------------------------------
// PDF DOWNLOAD
// --------------------------------------------------

downloadCvButton.addEventListener(
    "click",
    async () => {

        if (!latestGeneratedCV) {

            alert(
                "Generera ett CV först."
            );

            return;
        }


        downloadCvButton.disabled = true;

        const originalText =
            downloadCvButton.textContent;

        downloadCvButton.textContent =
            "Skapar PDF...";


        try {

            const response = await fetch(
                "/api/download-cv",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        cv: latestGeneratedCV
                    })
                }
            );


            if (!response.ok) {

                let message =
                    "PDF kunde inte skapas.";

                try {

                    const errorResult =
                        await response.json();

                    if (errorResult.error) {
                        message =
                            errorResult.error;
                    }

                } catch {
                    // Ignorera om svaret inte är JSON
                }


                throw new Error(message);
            }


            const blob =
                await response.blob();


            const url =
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                "CV.pdf";


            document.body.appendChild(link);

            link.click();

            link.remove();


            URL.revokeObjectURL(url);


        } catch (error) {

            console.error(
                "PDF error:",
                error
            );

            alert(
                "Kunde inte ladda ner CV:t: "
                + error.message
            );


        } finally {

            downloadCvButton.disabled =
                false;

            downloadCvButton.textContent =
                originalText;

        }

    }
);


// --------------------------------------------------
// HTML-SÄKERHET
// --------------------------------------------------

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;
}