import sys
import os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header banner text
        self.drawString(54, 750, "ESSAY GRADER • Simple Guide for Students & Teachers")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)
        
        # Footer text & page numbering
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "Ghana Education Service (GES) & WAEC Assessment Guide")
        self.line(54, 48, 558, 48)
        self.restoreState()

def build_pdf(filename="Essay_Grader_Simple_Guide.pdf"):
    pdf_path = Path(filename)
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=64,
        bottomMargin=64
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    COLOR_PRIMARY = colors.HexColor("#0070f3")   # Electric Blue
    COLOR_SECONDARY = colors.HexColor("#0F172A") # Deep Navy
    COLOR_ACCENT = colors.HexColor("#059669")    # Forest Green
    COLOR_TEXT = colors.HexColor("#334155")      # Slate Gray
    COLOR_BG_LIGHT = colors.HexColor("#F8FAFC")  # Light Gray
    COLOR_CARD_BORDER = colors.HexColor("#E2E8F0")

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=COLOR_PRIMARY,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=COLOR_SECONDARY,
        spaceAfter=18
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=COLOR_SECONDARY,
        spaceBefore=14,
        spaceAfter=8
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=COLOR_PRIMARY,
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=COLOR_TEXT,
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=COLOR_TEXT,
        leftIndent=15,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1E293B")
    )

    story = []

    # 1. Title Banner
    story.append(Paragraph("🎓 ESSAY GRADER", title_style))
    story.append(Paragraph("<b>The Super Simple Guide for Anyone (Even a 15-Year-Old!)</b><br/><i>How an offline AI assistant helps Ghanaian teachers grade essays in seconds without internet.</i>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_PRIMARY, spaceBefore=0, spaceAfter=14))

    # 2. Executive Summary (The 30-Second Story)
    story.append(Paragraph("1. What is Essay Grader? (The 30-Second Story)", h1_style))
    intro_p1 = (
        "Imagine writing a 500-word English composition for your <b>BECE</b> or <b>WASSCE</b> exam. "
        "Usually, your teacher has to spend hours reading hundreds of paper scripts line by line with a red pen. "
        "It takes forever, and teachers get really tired!"
    )
    intro_p2 = (
        "<b>Essay Grader</b> is like having an ultra-smart assistant living inside your teacher's laptop. "
        "It can read handwritten paper scripts, spot spelling and grammar mistakes, calculate official WAEC scores (A1 to F9), "
        "and print out neat report cards for your parents — <b>100% offline without needing Wi-Fi or data bundles!</b>"
    )
    story.append(Paragraph(intro_p1, body_style))
    story.append(Paragraph(intro_p2, body_style))
    story.append(Spacer(1, 8))

    # Callout Box: Why 100% Offline Matters
    callout_data = [[
        Paragraph("💡 <b>Why Does '100% Offline' Matter in Ghana?</b><br/>"
                  "In many Ghanaian towns or school computer labs, Wi-Fi can drop or data bundles can run out. "
                  "Because Essay Grader runs directly on the school laptop's internal computer brain, it never stops working — even during power outages or zero internet!", callout_style)
    ]]
    callout_table = Table(callout_data, colWidths=[504])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#BFDBFE")),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 14))

    # 3. The 5 Super Powers
    story.append(Paragraph("2. The 5 Super Powers of Essay Grader", h1_style))

    powers = [
        ("⚡ 1. Zero Internet Required", "Operates entirely inside the school laptop or local Wi-Fi router. Student essays are 100% private and never uploaded to foreign internet servers."),
        ("📷 2. Magic Handwriting Scanner (OCR)", "Takes photos of pencil or pen compositions on lined paper and uses computer vision filters to turn messy handwriting into clear digital text."),
        ("🇬🇭 3. WAEC Grade Calculator (A1 to F9)", "Applies official Ghana Education Service (GES) rules for Junior High (50 Pts) and Senior High (100 Pts). It breaks down marks for Content, Organization, Expression, and Accuracy."),
        ("📦 4. Multi-Student Batch Ingestion", "Teachers can upload a single ZIP folder containing 50 student scripts at once. The app automatically groups everyone by name and Index Number."),
        ("📄 5. One-Click Printable PDF Report Cards", "Creates official, beautifully formatted PDF report cards with diagnostic feedback and parent sign-off sections in less than 2 seconds.")
    ]

    for p_title, p_desc in powers:
        story.append(Paragraph(f"<b>{p_title}</b>", h2_style))
        story.append(Paragraph(p_desc, bullet_style))

    story.append(Spacer(1, 14))

    # 4. Step-by-Step Walkthrough
    story.append(Paragraph("3. Step-by-Step Walkthrough (How It Works)", h1_style))

    steps_table_data = [
        [Paragraph("<b>Step</b>", body_style), Paragraph("<b>What the User Does</b>", body_style), Paragraph("<b>What Essay Grader Does</b>", body_style)],
        [
            Paragraph("<b>Step 1</b>", body_style),
            Paragraph("Teacher opens the web app on laptop or tablet.", body_style),
            Paragraph("Displays the <b>Educator Landing Page</b> & checks local system health.", body_style)
        ],
        [
            Paragraph("<b>Step 2</b>", body_style),
            Paragraph("Selects WAEC Marking Scheme (Rubric).", body_style),
            Paragraph("Loads exact GES scoring criteria (e.g. BECE English 50 Pts).", body_style)
        ],
        [
            Paragraph("<b>Step 3</b>", body_style),
            Paragraph("Uploads paper photo scan or typed PDF essay.", body_style),
            Paragraph("Runs <b>OpenCV Bilateral Denoising & OCR</b> to clean text.", body_style)
        ],
        [
            Paragraph("<b>Step 4</b>", body_style),
            Paragraph("Reviews AI suggestions & moves score sliders.", body_style),
            Paragraph("Calculates total percentage & maps WAEC Letter Grade (A1 - F9).", body_style)
        ],
        [
            Paragraph("<b>Step 5</b>", body_style),
            Paragraph("Clicks <i>Lock & Export PDF</i> button.", body_style),
            Paragraph("Generates official PDF report card ready for printing!", body_style)
        ]
    ]

    steps_table = Table(steps_table_data, colWidths=[54, 210, 240])
    steps_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    
    # Force Step header row text color to white
    steps_table_data[0][0].style.textColor = colors.white
    steps_table_data[0][1].style.textColor = colors.white
    steps_table_data[0][2].style.textColor = colors.white

    story.append(steps_table)
    story.append(Spacer(1, 14))

    # 5. Official WAEC Grade Scale Table
    story.append(Paragraph("4. WAEC Letter Grade Scale Reference", h1_style))
    story.append(Paragraph("Here is how percentages match official West African Examination Council grades:", body_style))

    waec_table_data = [
        [Paragraph("<b>Percentage Range</b>", body_style), Paragraph("<b>Letter Grade</b>", body_style), Paragraph("<b>Remarks / Meaning</b>", body_style)],
        [Paragraph("80% – 100%", body_style), Paragraph("<b>A1</b>", body_style), Paragraph("Excellent", body_style)],
        [Paragraph("70% – 79%", body_style), Paragraph("<b>B2</b>", body_style), Paragraph("Very Good", body_style)],
        [Paragraph("65% – 69%", body_style), Paragraph("<b>B3</b>", body_style), Paragraph("Good", body_style)],
        [Paragraph("60% – 64%", body_style), Paragraph("<b>C4</b>", body_style), Paragraph("Credit", body_style)],
        [Paragraph("55% – 59%", body_style), Paragraph("<b>C5</b>", body_style), Paragraph("Credit", body_style)],
        [Paragraph("50% – 54%", body_style), Paragraph("<b>C6</b>", body_style), Paragraph("Credit", body_style)],
        [Paragraph("45% – 49%", body_style), Paragraph("<b>D7</b>", body_style), Paragraph("Pass", body_style)],
        [Paragraph("40% – 44%", body_style), Paragraph("<b>E8</b>", body_style), Paragraph("Weak Pass", body_style)],
        [Paragraph("0% – 39%", body_style), Paragraph("<b>F9</b>", body_style), Paragraph("Fail / Re-take Required", body_style)],
    ]

    waec_table = Table(waec_table_data, colWidths=[140, 110, 254])
    waec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0070f3")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F1F5F9")]),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    
    waec_table_data[0][0].style.textColor = colors.white
    waec_table_data[0][1].style.textColor = colors.white
    waec_table_data[0][2].style.textColor = colors.white

    story.append(waec_table)
    story.append(Spacer(1, 14))

    # 6. Conclusion
    story.append(Paragraph("5. Summary", h1_style))
    summary_text = (
        "Essay Grader combines modern software design with offline artificial intelligence to give Ghanaian teachers "
        "their time back. By automating repetitive script scanning and score calculation, teachers can spend more time doing "
        "what matters most: <b>inspiring and helping students succeed!</b>"
    )
    story.append(Paragraph(summary_text, body_style))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully created at: {pdf_path.resolve()}")

if __name__ == "__main__":
    build_pdf()
