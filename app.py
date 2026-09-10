import os
import json
import sqlite3

from io import BytesIO

from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    send_file
)

from openai import OpenAI
from dotenv import load_dotenv

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle
)
from reportlab.lib import colors
from reportlab.lib.units import mm

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether
)


# --------------------------------------------------
# Miljö / OpenAI
# --------------------------------------------------

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError(
        "OPENAI_API_KEY saknas. Kontrollera din .env-fil."
    )

client = OpenAI(
    api_key=OPENAI_API_KEY
)


# --------------------------------------------------
# Flask
# --------------------------------------------------

app = Flask(__name__)

DATABASE = "profile.db"


# --------------------------------------------------
# Databas
# --------------------------------------------------

def init_db():

    connection = sqlite3.connect(DATABASE)

    connection.execute("""
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY,
            data TEXT NOT NULL
        )
    """)

    connection.commit()
    connection.close()


def get_saved_profile():

    connection = sqlite3.connect(DATABASE)

    cursor = connection.execute(
        "SELECT data FROM profile WHERE id = ?",
        (1,)
    )

    row = cursor.fetchone()

    connection.close()

    if row is None:
        return None

    return json.loads(row[0])


# --------------------------------------------------
# Sidor
# --------------------------------------------------

@app.route("/")
def profile_page():
    return render_template("profile.html")


@app.route("/generate")
def generate_page():
    return render_template("generate.html")


# --------------------------------------------------
# Profil API
# --------------------------------------------------

@app.route("/api/profile", methods=["POST"])
def save_profile():

    profile_data = request.get_json()

    if not profile_data:
        return jsonify({
            "error": "Ingen profildata skickades."
        }), 400

    connection = sqlite3.connect(DATABASE)

    connection.execute(
        """
        INSERT OR REPLACE INTO profile (id, data)
        VALUES (?, ?)
        """,
        (
            1,
            json.dumps(
                profile_data,
                ensure_ascii=False
            )
        )
    )

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Profilen sparades."
    })


@app.route("/api/profile", methods=["GET"])
def get_profile():

    profile_data = get_saved_profile()

    if profile_data is None:
        return jsonify({})

    return jsonify(profile_data)


# --------------------------------------------------
# AI-generering
# --------------------------------------------------

@app.route("/api/generate", methods=["POST"])
def generate_cv():

    request_data = request.get_json()

    if not request_data:
        return jsonify({
            "error": "Ingen data skickades."
        }), 400

    job_ad = request_data.get(
        "job_ad",
        ""
    ).strip()

    if not job_ad:
        return jsonify({
            "error": "Ingen jobbannons skickades."
        }), 400

    profile_data = get_saved_profile()

    if profile_data is None:
        return jsonify({
            "error": "Ingen sparad profil hittades."
        }), 400


    prompt = f"""
Du är en professionell svensk CV- och ansökningsassistent.

Din uppgift är att skapa ett anpassat CV och ett personligt brev
utifrån kandidatens sparade profil och den specifika jobbannonsen.

VIKTIGA REGLER:

1. Använd ENDAST fakta som finns i kandidatens profil.

2. Hitta aldrig på:
   - erfarenheter
   - arbetsgivare
   - utbildningar
   - tekniska färdigheter
   - projekt
   - certifikat
   - språk
   - prestationer
   - ansvar

3. Du behöver inte använda all information från profilen.

4. Prioritera den information som är mest relevant för
   jobbannonsens krav och arbetsuppgifter.

5. Mindre relevant information får utelämnas.

6. Du får förbättra formuleringar professionellt,
   men du får aldrig ändra fakta.

7. CV:t ska vara tydligt, professionellt och relativt kortfattat.

8. Personliga brevet ska vara anpassat till tjänsten
   och inte bara återberätta CV:t.

9. "matched_requirements" ska endast innehålla krav från
   jobbannonsen som faktiskt stöds av kandidatens profil.

10. Om kandidaten saknar ett krav ska du inte låtsas att
    kandidaten uppfyller det.

11. "motivation" ska INTE vara ett personligt motivationsbrev
    eller skrivas ur kandidatens perspektiv.

12. "motivation" ska vara AI:ns korta förklaring av hur CV:t
    anpassades till jobbannonsen.

13. Förklara i motivationen:
    - vilka krav som var viktigast
    - vilka erfarenheter/projekt/färdigheter som prioriterades
    - vilken mindre relevant information som tonades ner
    - om viktiga krav saknas i profilen

KANDIDATENS PROFIL:

{json.dumps(
    profile_data,
    ensure_ascii=False,
    indent=2
)}

JOBBANNONS:

{job_ad}

Skapa resultatet enligt det JSON-schema som applikationen kräver.
"""


    try:

        response = client.responses.create(
            model="gpt-5-mini",

            input=prompt,

            text={
                "format": {
                    "type": "json_schema",

                    "name": "job_application",

                    "strict": True,

                    "schema": {

                        "type": "object",

                        "properties": {

                            "cv": {

                                "type": "object",

                                "properties": {

                                    "summary": {
                                        "type": "string"
                                    },

                                    "experiences": {

                                        "type": "array",

                                        "items": {

                                            "type": "object",

                                            "properties": {

                                                "title": {
                                                    "type": "string"
                                                },

                                                "company": {
                                                    "type": "string"
                                                },

                                                "period": {
                                                    "type": "string"
                                                },

                                                "description": {
                                                    "type": "string"
                                                },

                                                "bullet_points": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "string"
                                                    }
                                                }
                                            },

                                            "required": [
                                                "title",
                                                "company",
                                                "period",
                                                "description",
                                                "bullet_points"
                                            ],

                                            "additionalProperties": False
                                        }
                                    },

                                    "education": {

                                        "type": "array",

                                        "items": {

                                            "type": "object",

                                            "properties": {

                                                "program": {
                                                    "type": "string"
                                                },

                                                "school": {
                                                    "type": "string"
                                                },

                                                "period": {
                                                    "type": "string"
                                                },

                                                "description": {
                                                    "type": "string"
                                                }
                                            },

                                            "required": [
                                                "program",
                                                "school",
                                                "period",
                                                "description"
                                            ],

                                            "additionalProperties": False
                                        }
                                    },

                                    "projects": {

                                        "type": "array",

                                        "items": {

                                            "type": "object",

                                            "properties": {

                                                "name": {
                                                    "type": "string"
                                                },

                                                "description": {
                                                    "type": "string"
                                                },

                                                "technologies": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "string"
                                                    }
                                                }
                                            },

                                            "required": [
                                                "name",
                                                "description",
                                                "technologies"
                                            ],

                                            "additionalProperties": False
                                        }
                                    },

                                    "skills": {
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        }
                                    },

                                    "languages": {
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        }
                                    },

                                    "certificates": {
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        }
                                    },

                                    "driving_licenses": {
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        }
                                    }
                                },

                                "required": [
                                    "summary",
                                    "experiences",
                                    "education",
                                    "projects",
                                    "skills",
                                    "languages",
                                    "certificates",
                                    "driving_licenses"
                                ],

                                "additionalProperties": False
                            },

                            "cover_letter": {
                                "type": "string"
                            },

                            "motivation": {
                                "type": "string"
                            },

                            "matched_requirements": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            }
                        },

                        "required": [
                            "cv",
                            "cover_letter",
                            "motivation",
                            "matched_requirements"
                        ],

                        "additionalProperties": False
                    }
                }
            }
        )

        result = json.loads(
            response.output_text
        )

        print(
            json.dumps(
                result,
                ensure_ascii=False,
                indent=2
            )
        )

        return jsonify(result)


    except json.JSONDecodeError as error:

        print(
            "JSON error:",
            error
        )

        return jsonify({
            "error": "AI:n returnerade ogiltig JSON."
        }), 500


    except Exception as error:

        print(
            "OpenAI error:",
            error
        )

        return jsonify({
            "error": "AI-genereringen misslyckades."
        }), 500


# --------------------------------------------------
# PDF-generering
# --------------------------------------------------

def create_cv_pdf(cv, personal):

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm
    )

    styles = getSampleStyleSheet()


    name_style = ParagraphStyle(
        "Name",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#111827"),
        spaceAfter=5
    )


    contact_style = ParagraphStyle(
        "Contact",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#4B5563"),
        spaceAfter=14
    )


    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#2563EB"),
        spaceBefore=10,
        spaceAfter=7,

        # Hindrar rubriken från att hamna ensam
        # längst ner på en sida.
        keepWithNext=True
    )


    title_style = ParagraphStyle(
        "EntryTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#111827")
    )


    normal_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#374151"),
        spaceAfter=5
    )


    small_style = ParagraphStyle(
        "Small",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#6B7280")
    )


    story = []


    # --------------------------------------------------
    # Namn
    # --------------------------------------------------

    name = personal.get(
        "name",
        ""
    )

    if name:

        story.append(
            Paragraph(
                name,
                name_style
            )
        )


    # --------------------------------------------------
    # Kontaktuppgifter
    # --------------------------------------------------

    contact_parts = [
        personal.get("email"),
        personal.get("phone"),
        personal.get("location"),
        personal.get("linkedin"),
        personal.get("github")
    ]

    contact_parts = [
        value
        for value in contact_parts
        if value
    ]

    if contact_parts:

        story.append(
            Paragraph(
                " &nbsp; | &nbsp; ".join(
                    contact_parts
                ),
                contact_style
            )
        )


    # --------------------------------------------------
    # Profil
    # --------------------------------------------------

    if cv.get("summary"):

        story.append(
            Paragraph(
                "PROFIL",
                section_style
            )
        )

        story.append(
            Paragraph(
                cv["summary"],
                normal_style
            )
        )


    # --------------------------------------------------
    # Arbetslivserfarenhet
    # --------------------------------------------------

    experiences = cv.get(
        "experiences",
        []
    )

    if experiences:

        story.append(
            Paragraph(
                "ARBETSLIVSERFARENHET",
                section_style
            )
        )


        for experience in experiences:

            title = experience.get(
                "title",
                ""
            )

            company = experience.get(
                "company",
                ""
            )

            period = experience.get(
                "period",
                ""
            )


            header = Table(
                [[
                    Paragraph(
                        title,
                        title_style
                    ),

                    Paragraph(
                        period,
                        small_style
                    )
                ]],

                colWidths=[
                    125 * mm,
                    35 * mm
                ]
            )


            header.setStyle(
                TableStyle([
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP"
                    ),

                    (
                        "ALIGN",
                        (1, 0),
                        (1, 0),
                        "RIGHT"
                    ),

                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        0
                    ),

                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        0
                    ),

                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        0
                    ),

                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        2
                    )
                ])
            )


            experience_content = [
                header
            ]


            if company:

                experience_content.append(
                    Paragraph(
                        company,
                        small_style
                    )
                )


            description = experience.get(
                "description",
                ""
            )

            if description:

                experience_content.append(
                    Spacer(
                        1,
                        3
                    )
                )

                experience_content.append(
                    Paragraph(
                        description,
                        normal_style
                    )
                )


            bullet_points = experience.get(
                "bullet_points",
                []
            )

            for point in bullet_points:

                experience_content.append(
                    Paragraph(
                        f"• {point}",
                        normal_style
                    )
                )


            experience_content.append(
                Spacer(
                    1,
                    7
                )
            )


            # Håller hela erfarenheten på samma sida
            # om den får plats.
            story.append(
                KeepTogether(
                    experience_content
                )
            )


    # --------------------------------------------------
    # Utbildning
    # --------------------------------------------------

    education = cv.get(
        "education",
        []
    )

    if education:

        story.append(
            Paragraph(
                "UTBILDNING",
                section_style
            )
        )


        for item in education:

            program = item.get(
                "program",
                ""
            )

            school = item.get(
                "school",
                ""
            )

            period = item.get(
                "period",
                ""
            )


            header = Table(
                [[
                    Paragraph(
                        program,
                        title_style
                    ),

                    Paragraph(
                        period,
                        small_style
                    )
                ]],

                colWidths=[
                    125 * mm,
                    35 * mm
                ]
            )


            header.setStyle(
                TableStyle([
                    (
                        "ALIGN",
                        (1, 0),
                        (1, 0),
                        "RIGHT"
                    ),

                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP"
                    ),

                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        0
                    ),

                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        0
                    ),

                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        0
                    ),

                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        2
                    )
                ])
            )


            education_content = [
                header
            ]


            if school:

                education_content.append(
                    Paragraph(
                        school,
                        small_style
                    )
                )


            description = item.get(
                "description",
                ""
            )

            if description:

                education_content.append(
                    Spacer(
                        1,
                        3
                    )
                )

                education_content.append(
                    Paragraph(
                        description,
                        normal_style
                    )
                )


            education_content.append(
                Spacer(
                    1,
                    7
                )
            )


            story.append(
                KeepTogether(
                    education_content
                )
            )


    # --------------------------------------------------
    # Projekt
    # --------------------------------------------------

    # --------------------------------------------------
# PROJEKT
# --------------------------------------------------

    projects = cv.get(
        "projects",
        []
    )

    if projects:

        projects_section = [
            Paragraph(
                "PROJEKT",
                section_style
            )
        ]

        for project in projects:

            project_content = []

            project_content.append(
                Paragraph(
                    project.get(
                        "name",
                        ""
                    ),
                    title_style
                )
            )

            if project.get("description"):

                project_content.append(
                    Paragraph(
                        project["description"],
                        normal_style
                    )
                )

            technologies = project.get(
                "technologies",
                []
            )

            if technologies:

                project_content.append(
                    Paragraph(
                        "<b>Tekniker:</b> "
                        + ", ".join(
                            technologies
                        ),
                        normal_style
                    )
                )

            project_content.append(
                Spacer(
                    1,
                    5
                )
            )

            projects_section.extend(
                project_content
            )


        # Försök hålla HELA projektsektionen på samma sida
        story.append(
            KeepTogether(
                projects_section
            )
        )


    # --------------------------------------------------
    # Tekniska färdigheter
    # --------------------------------------------------

    skills = cv.get(
        "skills",
        []
    )

    if skills:

        story.append(
            Paragraph(
                "TEKNISKA FÄRDIGHETER",
                section_style
            )
        )

        story.append(
            Paragraph(
                " • ".join(
                    skills
                ),
                normal_style
            )
        )


    # --------------------------------------------------
    # Språk
    # --------------------------------------------------

    languages = cv.get(
        "languages",
        []
    )

    if languages:

        story.append(
            Paragraph(
                "SPRÅK",
                section_style
            )
        )

        story.append(
            Paragraph(
                " • ".join(
                    languages
                ),
                normal_style
            )
        )


    # --------------------------------------------------
    # Certifikat
    # --------------------------------------------------

    certificates = cv.get(
        "certificates",
        []
    )

    if certificates:

        story.append(
            Paragraph(
                "CERTIFIKAT",
                section_style
            )
        )

        story.append(
            Paragraph(
                " • ".join(
                    certificates
                ),
                normal_style
            )
        )


    # --------------------------------------------------
    # Körkort
    # --------------------------------------------------

    licenses = cv.get(
        "driving_licenses",
        []
    )

    if licenses:

        story.append(
            Paragraph(
                "KÖRKORT",
                section_style
            )
        )

        story.append(
            Paragraph(
                ", ".join(
                    licenses
                ),
                normal_style
            )
        )


    # --------------------------------------------------
    # Skapa PDF
    # --------------------------------------------------

    document.build(
        story
    )

    buffer.seek(0)

    return buffer


# --------------------------------------------------
# PDF Download
# --------------------------------------------------

@app.route("/api/download-cv", methods=["POST"])
def download_cv():

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "Ingen CV-data skickades."
        }), 400


    cv = data.get(
        "cv"
    )

    if not cv:

        return jsonify({
            "error": "CV-data saknas."
        }), 400


    profile = get_saved_profile()

    if profile is None:

        return jsonify({
            "error": "Ingen profil hittades."
        }), 400


    personal = profile.get(
        "personalInformation",
        {}
    )


    pdf = create_cv_pdf(
        cv,
        personal
    )


    return send_file(
        pdf,
        mimetype="application/pdf",
        as_attachment=True,
        download_name="CV.pdf"
    )


# --------------------------------------------------
# Starta app
# --------------------------------------------------

if __name__ == "__main__":

    init_db()

    app.run(
        debug=True
    )