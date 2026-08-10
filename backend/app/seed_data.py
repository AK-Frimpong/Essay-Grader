"""
Seed Data Script for Offline Essay Grader
Pre-loads WAEC / GES standard rubrics, realistic Ghanaian student essays, and default offline license.
"""
import json
import uuid
import logging
from app.database import get_db
from app.config import get_waec_grade

logger = logging.getLogger(__name__)

# Predefined Ghanaian Curricular Rubrics
DEFAULT_RUBRICS = [
    {
        "id": "rubric-waec-bece-english",
        "title": "WAEC BECE English Language Composition",
        "subject": "English Language",
        "grade_level": "JHS 1 - 3",
        "description": "Standard West African Examinations Council (WAEC) Basic Education Certificate Examination (BECE) marking scheme for narrative, descriptive, and expository essays.",
        "total_points": 50,
        "is_default": 1,
        "criteria": [
            {
                "id": "c1_content",
                "name": "Content & Relevance",
                "description": "Relevance to topic, thorough development of ideas, originality, and completeness of points.",
                "max_score": 10,
                "weight": 0.20,
                "levels": [
                    {"score": 10, "label": "Excellent", "descriptor": "Exhaustive treatment of the subject with sharp, original insights."},
                    {"score": 7, "label": "Good", "descriptor": "Sound treatment of the topic with adequate supporting ideas."},
                    {"score": 5, "label": "Fair", "descriptor": "Superficial points with some irrelevance or incomplete development."},
                    {"score": 2, "label": "Poor", "descriptor": "Deviates from topic; minimal substance or off-target."}
                ]
            },
            {
                "id": "c2_organization",
                "name": "Organization & Paragraphing",
                "description": "Effective introduction, coherent paragraph development, logical transitions, and purposeful conclusion.",
                "max_score": 10,
                "weight": 0.20,
                "levels": [
                    {"score": 10, "label": "Excellent", "descriptor": "Seamless paragraph flow, clear topic sentences, well-rounded conclusion."},
                    {"score": 7, "label": "Good", "descriptor": "Logically ordered paragraphs with appropriate linking expressions."},
                    {"score": 5, "label": "Fair", "descriptor": "Weak transitions or abrupt paragraph jumps; conclusion is weak."},
                    {"score": 2, "label": "Poor", "descriptor": "Haphazard arrangement; ideas presented in disarray."}
                ]
            },
            {
                "id": "c3_expression",
                "name": "Expression & Vocabulary",
                "description": "Rich vocabulary, appropriate register, sentence variety, idiomatic fluency, and precision of meaning.",
                "max_score": 20,
                "weight": 0.40,
                "levels": [
                    {"score": 20, "label": "Excellent", "descriptor": "Sophisticated vocabulary, varied sentence structures, vivid expressions."},
                    {"score": 15, "label": "Good", "descriptor": "Clear expression with good word choices and sentence variation."},
                    {"score": 10, "label": "Fair", "descriptor": "Repetitive phrasing, occasional awkwardness or inappropriate register."},
                    {"score": 4, "label": "Poor", "descriptor": "Severely limited vocabulary; pervasive mother-tongue interference."}
                ]
            },
            {
                "id": "c4_mechanical_accuracy",
                "name": "Mechanical Accuracy (Grammar, Spelling & Punctuation)",
                "description": "Subject-verb agreement, correct tenses, accurate punctuation (capitalization, commas, full stops), and standard spelling.",
                "max_score": 10,
                "weight": 0.20,
                "levels": [
                    {"score": 10, "label": "Excellent", "descriptor": "Virtually flawless grammar, accurate spelling, and precise punctuation."},
                    {"score": 7, "label": "Good", "descriptor": "Occasional minor errors that do not impair comprehension."},
                    {"score": 4, "label": "Fair", "descriptor": "Frequent grammatical slips, tense inconsistencies, or spelling errors."},
                    {"score": 1, "label": "Poor", "descriptor": "Pervasive grammatical errors obstructing overall meaning."}
                ]
            }
        ]
    },
    {
        "id": "rubric-wassce-shs-argumentative",
        "title": "WASSCE Senior High School Argumentative Essay",
        "subject": "English Language",
        "grade_level": "SHS 1 - 3",
        "description": "Rigorous Senior High School standard rubric for persuasive essays, debates, and argumentative compositions with counterargument refutation.",
        "total_points": 100,
        "is_default": 0,
        "criteria": [
            {
                "id": "wassce_thesis",
                "name": "Thesis Clarity & Stance",
                "description": "Clear thesis statement presenting an unambiguous position on the controversial topic.",
                "max_score": 15,
                "weight": 0.15,
                "levels": [
                    {"score": 15, "label": "Mastery", "descriptor": "Nuanced, powerful thesis statement clearly stated in opening paragraph."},
                    {"score": 11, "label": "Proficient", "descriptor": "Clear thesis stance with direct focus."},
                    {"score": 7, "label": "Developing", "descriptor": "Vague stance requiring inference."},
                    {"score": 3, "label": "Novice", "descriptor": "No discernible stance or conflicting statements."}
                ]
            },
            {
                "id": "wassce_evidence",
                "name": "Logical Reasoning & Ghanaian Context Evidence",
                "description": "Well-substantiated arguments using real-world Ghanaian examples, statistics, and logical deductions.",
                "max_score": 25,
                "weight": 0.25,
                "levels": [
                    {"score": 25, "label": "Mastery", "descriptor": "Compelling arguments backed by relevant Ghanaian socio-economic examples."},
                    {"score": 19, "label": "Proficient", "descriptor": "Solid reasoning supported by clear illustrations."},
                    {"score": 13, "label": "Developing", "descriptor": "General assertions with limited concrete proof."},
                    {"score": 5, "label": "Novice", "descriptor": "Fallacious reasoning or unsubstantiated claims."}
                ]
            },
            {
                "id": "wassce_counterargument",
                "name": "Counterargument & Rebuttal",
                "description": "Anticipation of opposing viewpoints with persuasive and respectful refutation.",
                "max_score": 20,
                "weight": 0.20,
                "levels": [
                    {"score": 20, "label": "Mastery", "descriptor": "Skillfully dismantles strong opposing arguments with evidence."},
                    {"score": 15, "label": "Proficient", "descriptor": "Acknowledges and addresses opposing perspective clearly."},
                    {"score": 9, "label": "Developing", "descriptor": "Weak counterargument acknowledged but not thoroughly rebutted."},
                    {"score": 3, "label": "Novice", "descriptor": "Ignores counterarguments entirely."}
                ]
            },
            {
                "id": "wassce_vocabulary",
                "name": "Academic Vocabulary & Formal Register",
                "description": "Elevated vocabulary, formal discourse markers, and rhetorical precision.",
                "max_score": 20,
                "weight": 0.20,
                "levels": [
                    {"score": 20, "label": "Mastery", "descriptor": "Exceptional academic register with sophisticated discourse markers."},
                    {"score": 15, "label": "Proficient", "descriptor": "Consistent formal tone with precise word choices."},
                    {"score": 9, "label": "Developing", "descriptor": "Mix of informal slang and formal phrasing."},
                    {"score": 3, "label": "Novice", "descriptor": "Inappropriate colloquialisms and elementary vocabulary."}
                ]
            },
            {
                "id": "wassce_grammar",
                "name": "Syntax Variety & Mechanical Precision",
                "description": "Complex and compound sentences, flawless punctuation, concord, and correct orthography.",
                "max_score": 20,
                "weight": 0.20,
                "levels": [
                    {"score": 20, "label": "Mastery", "descriptor": "Flawless syntactical control and punctuation across all paragraphs."},
                    {"score": 15, "label": "Proficient", "descriptor": "Strong grammar with rare, non-distracting errors."},
                    {"score": 9, "label": "Developing", "descriptor": "Recurring subject-verb agreement or comma splice errors."},
                    {"score": 3, "label": "Novice", "descriptor": "Severe grammatical breakdown impairing flow."}
                ]
            }
        ]
    }
]

# Sample Ghanaian Student Essays for Instant Demonstration
SAMPLE_ESSAYS = [
    {
        "id": "essay-stu-001",
        "title": "The Menace of Illegal Mining (Galamsey) on the Pra and Birim Rivers",
        "student_name": "Kwame Mensah",
        "student_id": "WAEC-JHS-2026-041",
        "school_name": "Presbyterian Boys' Model JHS, Legon",
        "subject": "English Language",
        "grade_level": "JHS 3",
        "rubric_id": "rubric-waec-bece-english",
        "file_type": "IMAGE",
        "original_filename": "kwame_mensah_galamsey_essay.jpg",
        "raw_extracted_text": """THE MENACE OF ILLEGAL MINING (GALAMSEY) ON OUR WATER BODIES
By Kwame Mensah (Class 3B)

Water is commonly described as the source of all life on Earth. In Ghana today, however, our most sacred and vital rivers such as the River Pra, Birim, and Ankobra are facing catastrophic destruction due to illegal gold mining, locally termed as 'galamsey'. This menace has reached an alarming level that demands immediate national intervention.

Firstly, the heavy machinery such as excavators and 'changfas' used by illegal miners dig up riverbanks and wash gold directly into the water. In doing so, they introduce dangerous heavy metals including mercury and cyanide into our drinking water sources. According to the Ghana Water Company Limited, the turbidity of our rivers has increased astronomically, leading to high cost of water treatment and frequent water shortages in towns like Kyebi and Sekondi-Takoradi.

Furthermore, aquatic life has been virtually wiped out in these heavily polluted river basins. Fish that once served as a primary source of protein for rural communities are contaminated or dead. In addition, the destruction of arable cocoa farmlands in the Ashanti and Eastern regions has deprived poor farmers of their livelihoods, worsening rural poverty.

In conclusion, galamsey is not merely an environmental challenge; it is a profound threat to our future existence. The government, traditional chiefs, and youth must unite to enforce mining laws, confiscate illegal excavators, and restore our devastated water bodies before it is too late.""",
        "corrected_text": """THE MENACE OF ILLEGAL MINING (GALAMSEY) ON OUR WATER BODIES
By Kwame Mensah (Class 3B)

Water is commonly described as the source of all life on Earth. In Ghana today, however, our most sacred and vital rivers such as the River Pra, Birim, and Ankobra are facing catastrophic destruction due to illegal gold mining, locally termed as 'galamsey'. This menace has reached an alarming level that demands immediate national intervention.

Firstly, the heavy machinery such as excavators and 'changfas' used by illegal miners dig up riverbanks and wash gold directly into the water. In doing so, they introduce dangerous heavy metals including mercury and cyanide into our drinking water sources. According to the Ghana Water Company Limited, the turbidity of our rivers has increased astronomically, leading to high cost of water treatment and frequent water shortages in towns like Kyebi and Sekondi-Takoradi.

Furthermore, aquatic life has been virtually wiped out in these heavily polluted river basins. Fish that once served as a primary source of protein for rural communities are contaminated or dead. In addition, the destruction of arable cocoa farmlands in the Ashanti and Eastern regions has deprived poor farmers of their livelihoods, worsening rural poverty.

In conclusion, galamsey is not merely an environmental challenge; it is a profound threat to our future existence. The government, traditional chiefs, and youth must unite to enforce mining laws, confiscate illegal excavators, and restore our devastated water bodies before it is too late.""",
        "word_count": 218,
        "status": "APPROVED"
    },
    {
        "id": "essay-stu-002",
        "title": "Should Mobile Phones Be Allowed in High Schools in Ghana?",
        "student_name": "Abena Serwaa Boateng",
        "student_id": "WAEC-SHS-2026-118",
        "school_name": "Wesley Girls' High School, Cape Coast",
        "subject": "English Language",
        "grade_level": "SHS 2",
        "rubric_id": "rubric-wassce-shs-argumentative",
        "file_type": "DOCX",
        "original_filename": "abena_boateng_mobile_phones.docx",
        "raw_extracted_text": """SHOULD SMARTPHONES BE PERMITTED IN GHANAIAN SECONDARY SCHOOLS?
A Critical Examination by Abena Serwaa Boateng

In this digital epoch, technology has undeniably permeated every facet of human endeavor, including pedagogy and research. Yet, in Ghana, the Ghana Education Service (GES) maintains a stringent prohibition against students using mobile phones in Senior High Schools. I vehemently contend that while strict regulations are imperative, an outright ban is obsolete and counterproductive to 21st-century educational outcomes.

Proponents of the existing ban argue that smartphones foster academic distraction, cyber-bullying, and cheating during examinations. While these concerns are legitimate, they reflect a failure of digital literacy education rather than an inherent flaw of smartphones. When properly supervised, smartphones grant students instant access to digital libraries like JSTOR, educational portals, and scientific calculators, mitigating the acute shortage of textbooks in many public institutions.

Moreover, the integration of educational applications empowers collaborative learning among students and teachers, mirroring modern university and corporate workplaces. Rather than enforcing an unproductive prohibition, the GES should implement a robust digital code of conduct alongside campus Wi-Fi firewalls that restrict non-academic platforms during instructional hours.

In summary, preparing Ghanaian youth for the global knowledge economy requires embracing technological tools responsibly rather than retreating into anachronistic policies.""",
        "corrected_text": """SHOULD SMARTPHONES BE PERMITTED IN GHANAIAN SECONDARY SCHOOLS?
A Critical Examination by Abena Serwaa Boateng

In this digital epoch, technology has undeniably permeated every facet of human endeavor, including pedagogy and research. Yet, in Ghana, the Ghana Education Service (GES) maintains a stringent prohibition against students using mobile phones in Senior High Schools. I vehemently contend that while strict regulations are imperative, an outright ban is obsolete and counterproductive to 21st-century educational outcomes.

Proponents of the existing ban argue that smartphones foster academic distraction, cyber-bullying, and cheating during examinations. While these concerns are legitimate, they reflect a failure of digital literacy education rather than an inherent flaw of smartphones. When properly supervised, smartphones grant students instant access to digital libraries like JSTOR, educational portals, and scientific calculators, mitigating the acute shortage of textbooks in many public institutions.

Moreover, the integration of educational applications empowers collaborative learning among students and teachers, mirroring modern university and corporate workplaces. Rather than enforcing an unproductive prohibition, the GES should implement a robust digital code of conduct alongside campus Wi-Fi firewalls that restrict non-academic platforms during instructional hours.

In summary, preparing Ghanaian youth for the global knowledge economy requires embracing technological tools responsibly rather than retreating into anachronistic policies.""",
        "word_count": 215,
        "status": "APPROVED"
    }
]

def seed_database():
    """Populate database with default rubrics, sample essays, and pre-computed grades."""
    with get_db() as conn:
        # 1. Insert Default Rubrics
        for rubric in DEFAULT_RUBRICS:
            conn.execute(
                """
                INSERT OR IGNORE INTO rubrics (id, title, subject, grade_level, description, total_points, criteria, is_default)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    rubric["id"],
                    rubric["title"],
                    rubric["subject"],
                    rubric["grade_level"],
                    rubric["description"],
                    rubric["total_points"],
                    json.dumps(rubric["criteria"]),
                    rubric["is_default"]
                )
            )

        # 2. Insert Sample Essays & Pre-evaluated Grades
        for essay in SAMPLE_ESSAYS:
            conn.execute(
                """
                INSERT OR IGNORE INTO essays 
                (id, title, student_name, student_id, school_name, subject, grade_level, rubric_id, original_filename, file_type, raw_extracted_text, corrected_text, word_count, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    essay["id"],
                    essay["title"],
                    essay["student_name"],
                    essay["student_id"],
                    essay["school_name"],
                    essay["subject"],
                    essay["grade_level"],
                    essay["rubric_id"],
                    essay["original_filename"],
                    essay["file_type"],
                    essay["raw_extracted_text"],
                    essay["corrected_text"],
                    essay["word_count"],
                    essay["status"]
                )
            )

        # Seed pre-calculated Grade for Kwame Mensah (BECE English)
        grade_kwame_criteria = [
            {"criterion_id": "c1_content", "name": "Content & Relevance", "max_score": 10, "ai_score": 9.5, "teacher_score": 9.5, "comment": "Exemplary grasp of the socio-economic and environmental impacts of galamsey in Ghana."},
            {"criterion_id": "c2_organization", "name": "Organization & Paragraphing", "max_score": 10, "ai_score": 9.0, "teacher_score": 9.0, "comment": "Well-structured introductory paragraph, smooth body transitions, and actionable conclusion."},
            {"criterion_id": "c3_expression", "name": "Expression & Vocabulary", "max_score": 20, "ai_score": 18.0, "teacher_score": 18.5, "comment": "Rich vocabulary with contextual terms like 'changfas', 'turbidity', and 'profound threat'."},
            {"criterion_id": "c4_mechanical_accuracy", "name": "Mechanical Accuracy (Grammar, Spelling & Punctuation)", "max_score": 10, "ai_score": 9.0, "teacher_score": 9.0, "comment": "Flawless punctuation and strong subject-verb agreement throughout."}
        ]
        kwame_total = 46.0  # out of 50 -> 92.0%
        kwame_pct = (kwame_total / 50.0) * 100.0
        kwame_grade_info = get_waec_grade(kwame_pct)

        conn.execute(
            """
            INSERT OR IGNORE INTO grades 
            (id, essay_id, rubric_id, overall_score, max_overall_score, percentage, letter_grade, ai_evaluation_json, final_criteria_scores_json, strengths_json, weaknesses_json, grammar_highlights_json, teacher_feedback, is_approved, approved_by, approved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """,
            (
                "grade-kwame-001",
                "essay-stu-001",
                "rubric-waec-bece-english",
                kwame_total,
                50.0,
                kwame_pct,
                kwame_grade_info["grade"],
                json.dumps({"criteria_scores": grade_kwame_criteria, "overall_score": 45.5, "percentage": 91.0}),
                json.dumps(grade_kwame_criteria),
                json.dumps([
                    "Sharp, insightful analysis of water turbidity and environmental degradation in Ghana.",
                    "Excellent use of specialized vocabulary ('turbidity', 'changfas', 'interconnected').",
                    "Compelling and solution-oriented concluding remarks."
                ]),
                json.dumps([
                    "Could expand slightly on specific community initiatives currently being undertaken."
                ]),
                json.dumps([]),
                "Excellent work, Kwame! Your mastery of the topic and mature expression reflect true WAEC distinction quality. Keep up the high standard!",
                1,
                "Mr. K. Osei-Tutu (Head of English Dept)"
            )
        )

        # Seed pre-calculated Grade for Abena Serwaa Boateng (WASSCE Argumentative)
        grade_abena_criteria = [
            {"criterion_id": "wassce_thesis", "name": "Thesis Clarity & Stance", "max_score": 15, "ai_score": 14.5, "teacher_score": 14.5, "comment": "Bold, nuanced thesis acknowledging both regulatory needs and 21st century realities."},
            {"criterion_id": "wassce_evidence", "name": "Logical Reasoning & Ghanaian Context Evidence", "max_score": 25, "ai_score": 23.0, "teacher_score": 23.5, "comment": "Effectively references textbook shortages and JSTOR digital research access."},
            {"criterion_id": "wassce_counterargument", "name": "Counterargument & Rebuttal", "max_score": 20, "ai_score": 18.5, "teacher_score": 19.0, "comment": "Fairly addresses exam cheating and distractions before presenting digital firewalls as counter-solutions."},
            {"criterion_id": "wassce_vocabulary", "name": "Academic Vocabulary & Formal Register", "max_score": 20, "ai_score": 19.0, "teacher_score": 19.0, "comment": "Sophisticated diction ('pedagogy', 'anachronistic', 'stringent prohibition', 'digital epoch')."},
            {"criterion_id": "wassce_grammar", "name": "Syntax Variety & Mechanical Precision", "max_score": 20, "ai_score": 18.5, "teacher_score": 18.5, "comment": "Controlled compound-complex sentences with exemplary punctuation."}
        ]
        abena_total = 94.5  # out of 100 -> 94.5%
        abena_pct = 94.5
        abena_grade_info = get_waec_grade(abena_pct)

        conn.execute(
            """
            INSERT OR IGNORE INTO grades 
            (id, essay_id, rubric_id, overall_score, max_overall_score, percentage, letter_grade, ai_evaluation_json, final_criteria_scores_json, strengths_json, weaknesses_json, grammar_highlights_json, teacher_feedback, is_approved, approved_by, approved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """,
            (
                "grade-abena-002",
                "essay-stu-002",
                "rubric-wassce-shs-argumentative",
                abena_total,
                100.0,
                abena_pct,
                abena_grade_info["grade"],
                json.dumps({"criteria_scores": grade_abena_criteria, "overall_score": 93.5, "percentage": 93.5}),
                json.dumps(grade_abena_criteria),
                json.dumps([
                    "Outstanding academic diction ('anachronistic', 'pedagogy', 'digital epoch').",
                    "Strong counter-argument refutation proposing firewall solutions rather than blanket bans.",
                    "Superb syntactical structure and flow."
                ]),
                json.dumps([
                    "Could cite specific pilot schools or regional GES policy directives to further anchor arguments."
                ]),
                json.dumps([]),
                "Brilliant essay, Abena. Your critical argumentation and high-level vocabulary place this firmly in the WASSCE A1 distinction tier.",
                1,
                "Mrs. E. Addo (Senior English Tutor)"
            )
        )

        # 3. Seed Default Offline License
        conn.execute(
            """
            INSERT OR IGNORE INTO licenses 
            (id, school_name, machine_uuid, mac_address, license_key, public_key_pem, signature_b64, valid_until, allowed_credits, used_credits, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "lic-gh-master-001",
                "Ghana Education Service - Pilot School Host",
                "00000000-0000-0000-0000-000000000000",
                "00:1A:2B:3C:4D:5E",
                "GH-OFFLINE-GRADER-PRO-2026-X7K9",
                "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
                "VALID_RSA2048_SIGNATURE_EMBEDDED",
                "2027-12-31",
                500,
                2,
                "ACTIVE"
            )
        )

    logger.info("Database successfully seeded with standard rubrics, sample essays, grades, and offline license.")

if __name__ == "__main__":
    from app.database import init_db
    init_db()
    seed_database()
    print("Database initialization and seeding complete.")
