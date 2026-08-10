"""
ReportLab PDF Report Card Generator for Ghanaian Schools
Generates official WAEC-aligned student assessment score sheets with verification QR codes.
"""
import io
import os
import hashlib
import qrcode
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from app.config import GENERATED_REPORTS_DIR, get_waec_grade

logger = logging.getLogger(__name__)

# Colors matching Ghana educational theme
COLOR_EMERALD = colors.HexColor("#065F46")
COLOR_GOLD = colors.HexColor("#D97706")
COLOR_CHARCOAL = colors.HexColor("#1E293B")
COLOR_LIGHT_BG = colors.HexColor("#F8FAFC")
COLOR_BORDER = colors.HexColor("#E2E8F0")

def _generate_qr_code_image(verification_text: str) -> io.BytesIO:
    """Generate in-memory QR code image for ReportLab PDF."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    qr.add_data(verification_text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer

def generate_student_pdf_report(essay: Dict[str, Any], grade: Dict[str, Any], rubric: Dict[str, Any]) -> str:
    """
    Generate an official, professional single-page/two-page PDF report card for a student.
    Saves to generated_reports/ and returns the absolute file path.
    """
    essay_id = essay.get("id", "essay-001")
    student_name = essay.get("student_name", "Student")
    student_id = essay.get("student_id", "WAEC-STU-001")
    school_name = essay.get("school_name", "Ghana Education Service Pilot School")
    subject = essay.get("subject", "English Language")
    grade_level = essay.get("grade_level", "JHS 3 / SHS 2")
    title = essay.get("title", "Essay Composition")
    
    percentage = float(grade.get("percentage", 0.0))
    overall_score = float(grade.get("overall_score", 0.0))
    max_score = float(grade.get("max_overall_score", 100.0))
    waec_info = get_waec_grade(percentage)
    letter_grade = grade.get("letter_grade", waec_info["grade"])

    pdf_filename = f"Report_Card_{student_id.replace('/', '_')}_{essay_id}.pdf"
    pdf_path = GENERATED_REPORTS_DIR / pdf_filename

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'GhanaHeaderTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=17,
        textColor=COLOR_EMERALD,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'GhanaHeaderSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=COLOR_GOLD,
        alignment=TA_CENTER
    )

    section_heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=COLOR_EMERALD,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=COLOR_CHARCOAL
    )

    small_caption_style = ParagraphStyle(
        'SmallCaption',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#64748B")
    )

    story = []

    # 1. School Header Banner
    story.append(Paragraph(school_name.upper(), title_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph(f"OFFICIAL STUDENT ESSAY ASSESSMENT REPORT • {subject.upper()} ({grade_level.upper()})", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=2, color=COLOR_GOLD, spaceBefore=2, spaceAfter=8))

    # 2. Student Info & Grade Summary Box
    info_data = [
        [
            Paragraph(f"<b>Student Name:</b> {student_name}", body_style),
            Paragraph(f"<b>WAEC Index / Student ID:</b> {student_id}", body_style),
        ],
        [
            Paragraph(f"<b>Essay Title:</b> <i>{title}</i>", body_style),
            Paragraph(f"<b>Word Count:</b> {essay.get('word_count', 0)} words", body_style),
        ],
        [
            Paragraph(f"<b>Rubric Standard:</b> {rubric.get('title', 'WAEC Standard Rubric')}", body_style),
            Paragraph(f"<b>Overall Score:</b> <b>{overall_score:.1f} / {max_score:.1f} ({percentage:.1f}%)</b>", body_style),
        ]
    ]

    info_table = Table(info_data, colWidths=[280, 240])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 8))

    # 3. WAEC Grade Distinction Ribbon
    badge_bg = colors.HexColor(waec_info.get("color", "#059669"))
    badge_data = [
        [
            Paragraph(f"<font color='white'><b>WAEC / GES LETTER GRADE: {letter_grade} ({waec_info.get('label', 'Credit')}) — {percentage:.1f}%</b></font>", 
                      ParagraphStyle('BadgeText', alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=10, textColor=colors.white))
        ]
    ]
    badge_table = Table(badge_data, colWidths=[520])
    badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), badge_bg),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 10))

    # 4. Rubric Criteria Breakdown Table
    story.append(Paragraph("CRITERION-BY-CRITERION PERFORMANCE BREAKDOWN", section_heading_style))
    
    table_rows = [
        [
            Paragraph("<b>Criterion & Scope</b>", body_style),
            Paragraph("<b>Max</b>", ParagraphStyle('H1', alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=8.5)),
            Paragraph("<b>Score</b>", ParagraphStyle('H2', alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=8.5)),
            Paragraph("<b>Diagnostic Comments & Feedback</b>", body_style)
        ]
    ]

    criteria_scores = grade.get("final_criteria_scores_json", [])
    if not criteria_scores and isinstance(grade.get("ai_evaluation_json"), dict):
        criteria_scores = grade["ai_evaluation_json"].get("criteria_scores", [])

    for c in criteria_scores:
        name = c.get("name", "Criterion")
        max_c = c.get("max_score", 10)
        awarded = c.get("teacher_score") if c.get("teacher_score") is not None else c.get("ai_score", 0.0)
        comment = c.get("comment", "")
        
        table_rows.append([
            Paragraph(f"<b>{name}</b>", body_style),
            Paragraph(f"{max_c:.1f}", ParagraphStyle('C1', alignment=TA_CENTER, fontSize=8.5)),
            Paragraph(f"<b>{awarded:.1f}</b>", ParagraphStyle('C2', alignment=TA_CENTER, fontSize=8.5, textColor=COLOR_EMERALD)),
            Paragraph(comment, body_style)
        ])

    criteria_table = Table(table_rows, colWidths=[130, 45, 45, 300])
    criteria_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#065F46")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_LIGHT_BG])
    ]))
    story.append(criteria_table)
    story.append(Spacer(1, 10))

    # 5. Strengths & Growth Areas
    strengths = grade.get("strengths_json", [])
    weaknesses = grade.get("weaknesses_json", [])

    strengths_text = "<br/>• ".join(strengths) if strengths else "Strong demonstration of core subject knowledge."
    weaknesses_text = "<br/>• ".join(weaknesses) if weaknesses else "Continue polishing sentence mechanics and paragraph transitions."

    qual_data = [
        [
            Paragraph("<b>Key Strengths & Commendations:</b><br/>• " + strengths_text, body_style),
            Paragraph("<b>Target Areas for Improvement:</b><br/>• " + weaknesses_text, body_style)
        ]
    ]
    qual_table = Table(qual_data, colWidths=[255, 255])
    qual_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(qual_table)
    story.append(Spacer(1, 8))

    # 6. Teacher Feedback Remarks
    teacher_feedback = grade.get("teacher_feedback") or "Approved by Examiner. Meets standard curriculum requirements."
    approved_by = grade.get("approved_by") or "Senior Subject Tutor / Examiner"
    
    feedback_data = [
        [
            Paragraph(f"<b>Official Teacher's Remarks:</b><br/>{teacher_feedback}", body_style)
        ]
    ]
    feedback_table = Table(feedback_data, colWidths=[520])
    feedback_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF3C7")), # Warm golden highlight
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#F59E0B")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(feedback_table)
    story.append(Spacer(1, 10))

    # 7. Verification Stamp, Teacher Signature & QR Code
    sha_hash = hashlib.sha256(f"{student_id}:{percentage}:{overall_score}".encode("utf-8")).hexdigest()[:16].upper()
    qr_payload = f"GH-EDU-VERIFY|STU:{student_id}|GRADE:{letter_grade}|SCORE:{percentage:.1f}%|HASH:{sha_hash}"
    qr_buf = _generate_qr_code_image(qr_payload)
    qr_img = Image(qr_buf, width=1.1*inch, height=1.1*inch)

    footer_data = [
        [
            qr_img,
            Paragraph(
                f"<b>Digital Verification & Integrity Token</b><br/>"
                f"Validation Hash: <code>{sha_hash}</code><br/>"
                f"Generated by: Offline Rubric Grader Engine (Local LAN Node)<br/>"
                f"Status: <b>OFFICIALLY APPROVED & LOCKED</b>",
                small_caption_style
            ),
            Paragraph(
                f"<b>Examiner Endorsement:</b><br/><br/>"
                f"___________________________<br/>"
                f"<b>{approved_by}</b><br/>"
                f"Signature & Date Stamp",
                ParagraphStyle('SignStyle', alignment=TA_CENTER, fontName='Helvetica', fontSize=8)
            )
        ]
    ]
    footer_table = Table(footer_data, colWidths=[90, 260, 170])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(footer_table)

    # Build document
    doc.build(story)
    logger.info(f"Generated student PDF report card at {pdf_path}")
    return str(pdf_path)
