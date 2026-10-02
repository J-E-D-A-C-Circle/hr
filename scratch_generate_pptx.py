import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # Set slide dimensions to widescreen 16:9
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Theme Colors
    COLOR_BG_DARK = RGBColor(15, 23, 42)      # Deep Slate/Navy #0F172A
    COLOR_PRIMARY = RGBColor(30, 58, 138)     # Navy #1E3A8A
    COLOR_ACCENT = RGBColor(13, 148, 136)     # Teal #0D9488
    COLOR_HIGHLIGHT = RGBColor(217, 119, 6)   # Amber #D97706
    COLOR_TEXT_DARK = RGBColor(31, 41, 55)    # Charcoal #1F2937
    COLOR_TEXT_MUTED = RGBColor(100, 116, 139) # Slate Gray #64748B
    COLOR_CARD_BG = RGBColor(248, 250, 252)   # Very light blue-gray #F8FAFC
    COLOR_CARD_BORDER = RGBColor(226, 232, 240)
    COLOR_WHITE = RGBColor(255, 255, 255)

    def set_slide_background(slide, color):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = color

    def add_header(slide, title_text, category_text="TEMPSTAFF SYSTEM TRAINING"):
        # Category Banner / Subheader
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.733), Inches(0.4))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = COLOR_ACCENT
        p_cat.font.name = "Arial"

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.733), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_PRIMARY
        p_title.font.name = "Arial"

        # Accent Line under title
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.65), Inches(11.733), Inches(0.04))
        line.fill.solid()
        line.fill.fore_color.rgb = COLOR_ACCENT
        line.line.color.rgb = COLOR_ACCENT

    # ----------------------------------------------------
    # SLIDE 1: Title Slide (Dark Theme)
    # ----------------------------------------------------
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1, COLOR_BG_DARK)

    # Decorative Box / Card
    dec_box = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(1.0), Inches(11.333), Inches(5.5))
    dec_box.fill.solid()
    dec_box.fill.fore_color.rgb = RGBColor(30, 41, 59)
    dec_box.line.color.rgb = RGBColor(51, 65, 85)

    title_tb = slide1.shapes.add_textbox(Inches(1.5), Inches(1.8), Inches(10.333), Inches(1.8))
    tf1 = title_tb.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "TempStaff System Training Deck"
    p1.font.size = Pt(40)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_WHITE
    p1.font.name = "Arial"

    p2 = tf1.add_paragraph()
    p2.text = "System Roles, Key Functions, Modules & Standard Operating Procedures"
    p2.font.size = Pt(20)
    p2.font.color.rgb = COLOR_ACCENT
    p2.font.name = "Arial"

    info_tb = slide1.shapes.add_textbox(Inches(1.5), Inches(4.2), Inches(10.333), Inches(1.8))
    tf_info = info_tb.text_frame
    tf_info.word_wrap = True

    bullets = [
        "Target Audience: HR Managers, HR Officers, Payroll Officers & System Administrators",
        "Key Objective: Master contract lifecycle tracking, SSNIT/Petra deductions, and role-based permissions",
        "System Version: 2026 Enterprise Edition | Location: DVLA HR & Payroll Division"
    ]
    for b in bullets:
        p = tf_info.add_paragraph()
        p.text = "• " + b
        p.font.size = Pt(14)
        p.font.color.rgb = RGBColor(226, 232, 240)
        p.space_after = Pt(8)

    # ----------------------------------------------------
    # SLIDE 2: Executive Overview & Purpose
    # ----------------------------------------------------
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide2, COLOR_WHITE)
    add_header(slide2, "Executive Overview & System Objectives")

    cards_data = [
        ("Contract Expiration Control", "Automates 6-month contract cycle tracking with real-time alerts for staff expiring within 30 days to prevent compliance gaps.", COLOR_PRIMARY),
        ("Statutory Deductions Engine", "Computes SSNIT Tier 1 (5.5% / 13%) and Petra Tier 3 (5% / 5%) deductions seamlessly based on active salary tables.", COLOR_ACCENT),
        ("Role-Based Security & Access", "Enforces strict permission boundaries separating HR operational management, financial oversight, and system administration.", COLOR_HIGHLIGHT),
        ("Audit Compliance & Logs", "Maintains an unalterable audit trail recording every staff creation, contract renewal, payment hold, and profile modification.", COLOR_TEXT_DARK)
    ]

    for i, (ctitle, cdesc, ccolor) in enumerate(cards_data):
        col = i % 2
        row = i // 2
        left = Inches(0.8 + col * 5.97)
        top = Inches(2.0 + row * 2.5)

        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(5.76), Inches(2.2))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD_BG
        card.line.color.rgb = COLOR_CARD_BORDER

        # Accent border top bar
        top_bar = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, Inches(5.76), Inches(0.12))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = ccolor
        top_bar.line.fill.background()

        tb = slide2.shapes.add_textbox(left + Inches(0.2), top + Inches(0.25), Inches(5.36), Inches(1.8))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = ctitle
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = ccolor

        p_body = tf.add_paragraph()
        p_body.text = cdesc
        p_body.font.size = Pt(13)
        p_body.font.color.rgb = COLOR_TEXT_DARK
        p_body.space_before = Pt(8)

    # ----------------------------------------------------
    # SLIDE 3: System Roles & User Responsibilities
    # ----------------------------------------------------
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide3, COLOR_WHITE)
    add_header(slide3, "System User Roles & Core Responsibilities")

    roles = [
        ("Super Admin", "System Governance", [
            "User account provisioning & authentication management",
            "System-wide parameters & global configuration",
            "Unrestricted portal oversight across all modules"
        ], COLOR_PRIMARY),
        ("HR Manager", "Contract & Financial Control", [
            "Full staff CRUD, contract renewals & approvals",
            "Configuring SSNIT & Petra statutory deduction rates",
            "Batch data imports, export reports & audit trail analysis"
        ], COLOR_ACCENT),
        ("HR Officer", "Day-to-Day Operations", [
            "Creating staff profiles & editing bio-data via Pencil Icon ✏️",
            "Initiating renewal requests & checking contract status",
            "Restricted from changing financial controls or audit logs"
        ], COLOR_HIGHLIGHT),
        ("Finance / Payroll", "Payroll Execution", [
            "Generating & reviewing monthly payslips",
            "Verifying statutory SSNIT & Petra deduction breakdown",
            "Managing payment status (Paid, Unpaid, On Hold)"
        ], COLOR_TEXT_DARK)
    ]

    for i, (rname, rsub, rtasks, rcolor) in enumerate(roles):
        left = Inches(0.8 + i * 2.98)
        top = Inches(2.0)
        width = Inches(2.8)
        height = Inches(4.8)

        card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD_BG
        card.line.color.rgb = COLOR_CARD_BORDER

        # Header Box inside Card
        hdr_box = slide3.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(1.1))
        hdr_box.fill.solid()
        hdr_box.fill.fore_color.rgb = rcolor
        hdr_box.line.fill.background()

        tb_hdr = slide3.shapes.add_textbox(left + Inches(0.1), top + Inches(0.15), width - Inches(0.2), Inches(0.8))
        tf_hdr = tb_hdr.text_frame
        tf_hdr.word_wrap = True

        p1 = tf_hdr.paragraphs[0]
        p1.text = rname
        p1.font.size = Pt(17)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_WHITE
        p1.alignment = PP_ALIGN.CENTER

        p2 = tf_hdr.add_paragraph()
        p2.text = rsub.upper()
        p2.font.size = Pt(10)
        p2.font.color.rgb = RGBColor(226, 232, 240)
        p2.alignment = PP_ALIGN.CENTER

        # Body tasks
        tb_body = slide3.shapes.add_textbox(left + Inches(0.15), top + Inches(1.2), width - Inches(0.3), Inches(3.4))
        tf_body = tb_body.text_frame
        tf_body.word_wrap = True

        for task in rtasks:
            pt = tf_body.add_paragraph()
            pt.text = "• " + task
            pt.font.size = Pt(12)
            pt.font.color.rgb = COLOR_TEXT_DARK
            pt.space_after = Pt(8)

    # ----------------------------------------------------
    # SLIDE 4: Role Permissions & Access Matrix
    # ----------------------------------------------------
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide4, COLOR_WHITE)
    add_header(slide4, "Role Permissions & Access Matrix")

    # Table
    rows, cols = 8, 5
    table_shape = slide4.shapes.add_table(rows, cols, Inches(0.8), Inches(2.0), Inches(11.733), Inches(4.8))
    table = table_shape.table

    # Column widths
    table.columns[0].width = Inches(3.733)
    table.columns[1].width = Inches(2.0)
    table.columns[2].width = Inches(2.0)
    table.columns[3].width = Inches(2.0)
    table.columns[4].width = Inches(2.0)

    headers = ["Portal Feature / Module", "Super Admin", "HR Manager", "HR Officer", "Finance / Payroll"]
    for j, h in enumerate(headers):
        cell = table.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = COLOR_PRIMARY
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = COLOR_WHITE
        p.alignment = PP_ALIGN.CENTER if j > 0 else PP_ALIGN.LEFT

    matrix_data = [
        ("View Dashboard & Expirations", "Full Access", "Full Access", "Full Access", "Full Access"),
        ("Staff Profile Creation & Pencil Edit ✏️", "Full Access", "Full Access", "Full Edit Access", "View Only"),
        ("Contract Renewal & Termination", "Full Access", "Full Access", "Initiate Only", "View Only"),
        ("Statutory Deductions (SSNIT/Petra)", "Full Access", "Configure & View", "Restricted ❌", "Full Access"),
        ("Payslip Generation & Export", "Full Access", "Full Access", "Restricted ❌", "Full Access"),
        ("Excel/CSV Bulk Import & Export", "Full Access", "Full Access", "Restricted ❌", "Export Only"),
        ("Audit Trail Logs & System History", "Full Access", "Full Access", "Restricted ❌", "View Only")
    ]

    for i, row_data in enumerate(matrix_data):
        for j, val in enumerate(row_data):
            cell = table.cell(i + 1, j)
            cell.fill.solid()
            cell.fill.fore_color.rgb = COLOR_CARD_BG if i % 2 == 0 else COLOR_WHITE
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(12)
            p.font.name = "Arial"
            if j == 0:
                p.font.bold = True
                p.font.color.rgb = COLOR_TEXT_DARK
                p.alignment = PP_ALIGN.LEFT
            else:
                p.alignment = PP_ALIGN.CENTER
                if "Full" in val:
                    p.font.color.rgb = RGBColor(16, 185, 129) # Green
                    p.font.bold = True
                elif "Restricted" in val or "❌" in val:
                    p.font.color.rgb = RGBColor(239, 68, 68) # Red
                    p.font.bold = True
                else:
                    p.font.color.rgb = COLOR_TEXT_DARK

    # ----------------------------------------------------
    # SLIDE 5: Module 1 - Executive Dashboard & Expiration Alerts
    # ----------------------------------------------------
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide5, COLOR_WHITE)
    add_header(slide5, "Module 1: Executive Dashboard & Alert Engine")

    dash_features = [
        ("Real-time Key Metrics", [
            "Total Temporary Staff Count across all departments",
            "Active Contracts vs Expiring Contracts vs Terminated",
            "Departmental Distribution breakdown"
        ]),
        ("Automated Renewal Alert System", [
            "Identifies staff contracts expiring within 30 Days",
            "Highlights overdue/expired contracts requiring immediate action",
            "Direct 1-click renewal action button from dashboard list"
        ]),
        ("Approval Queue & Notifications", [
            "Pending approval list for contract extensions",
            "Submission tracking showing officer name and timestamp",
            "Quick access modal for detailed staff verification"
        ])
    ]

    for i, (title, items) in enumerate(dash_features):
        left = Inches(0.8 + i * 3.98)
        top = Inches(2.0)
        width = Inches(3.78)
        height = Inches(4.8)

        card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD_BG
        card.line.color.rgb = COLOR_CARD_BORDER

        top_line = slide5.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.1))
        top_line.fill.solid()
        top_line.fill.fore_color.rgb = COLOR_ACCENT if i == 1 else COLOR_PRIMARY
        top_line.line.fill.background()

        tb = slide5.shapes.add_textbox(left + Inches(0.2), top + Inches(0.25), width - Inches(0.4), height - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(17)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_PRIMARY

        for it in items:
            p = tf.add_paragraph()
            p.text = "• " + it
            p.font.size = Pt(13)
            p.font.color.rgb = COLOR_TEXT_DARK
            p.space_before = Pt(10)

    # ----------------------------------------------------
    # SLIDE 6: Module 2 - Contract Lifecycle & Staff Management
    # ----------------------------------------------------
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide6, COLOR_WHITE)
    add_header(slide6, "Module 2: 6-Month Contract Lifecycle Management")

    steps = [
        ("1. Staff Onboarding", "Register bio-data, Staff Code, SSNIT, Ghana Card (NIA), Bank Account & Base Salary.", COLOR_PRIMARY),
        ("2. Auto 6-Month Cycle", "System automatically calculates contract End Date exactly 6 months from Start Date.", COLOR_ACCENT),
        ("3. Expiration Tracking", "System flags contracts entering the 30-day expiration window on the dashboard.", COLOR_HIGHLIGHT),
        ("4. Renewal / Terminate", "HR extends contract by +6 months (Renewal #2, #3...) or logs formal termination.", RGBColor(16, 185, 129))
    ]

    for i, (stitle, sdesc, scolor) in enumerate(steps):
        left = Inches(0.8 + i * 2.98)
        top = Inches(2.0)
        width = Inches(2.8)

        # Step card
        scard = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, Inches(2.6))
        scard.fill.solid()
        scard.fill.fore_color.rgb = COLOR_CARD_BG
        scard.line.color.rgb = COLOR_CARD_BORDER

        top_bar = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.1))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = scolor
        top_bar.line.fill.background()

        tb = slide6.shapes.add_textbox(left + Inches(0.15), top + Inches(0.2), width - Inches(0.3), Inches(2.2))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = stitle
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = scolor

        p_d = tf.add_paragraph()
        p_d.text = sdesc
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = COLOR_TEXT_DARK
        p_d.space_before = Pt(8)

    # Key Rules Box below steps
    rule_card = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.9), Inches(11.733), Inches(1.9))
    rule_card.fill.solid()
    rule_card.fill.fore_color.rgb = RGBColor(241, 245, 249)
    rule_card.line.color.rgb = COLOR_PRIMARY

    tb_rule = slide6.shapes.add_textbox(Inches(1.0), Inches(5.0), Inches(11.333), Inches(1.7))
    tf_rule = tb_rule.text_frame
    tf_rule.word_wrap = True

    p_rt = tf_rule.paragraphs[0]
    p_rt.text = "CRITICAL CONTRACT RULES & CONTROLS"
    p_rt.font.size = Pt(14)
    p_rt.font.bold = True
    p_rt.font.color.rgb = COLOR_PRIMARY

    rules = [
        "Single Active Contract Rule: A staff member can only have ONE active contract at any point in time.",
        "Renewal Counter: Each renewal increments the cycle counter (e.g. Renewal #1, #2) while archiving historical contracts.",
        "Payment Holds: HR Officers can flag staff as 'Unpaid / On Hold' with mandatory reason logging without terminating contract."
    ]
    for r in rules:
        p = tf_rule.add_paragraph()
        p.text = "✔ " + r
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_TEXT_DARK
        p.space_after = Pt(4)

    # ----------------------------------------------------
    # SLIDE 7: Module 3 - Statutory Deductions Computation Engine
    # ----------------------------------------------------
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide7, COLOR_WHITE)
    add_header(slide7, "Module 3: SSNIT & Petra Statutory Deductions Engine")

    # Left Card: SSNIT
    c_ssnit = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.8))
    c_ssnit.fill.solid()
    c_ssnit.fill.fore_color.rgb = COLOR_CARD_BG
    c_ssnit.line.color.rgb = COLOR_CARD_BORDER

    top_ssnit = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.7), Inches(0.12))
    top_ssnit.fill.solid()
    top_ssnit.fill.fore_color.rgb = COLOR_PRIMARY
    top_ssnit.line.fill.background()

    tb_s = slide7.shapes.add_textbox(Inches(1.0), Inches(2.3), Inches(5.3), Inches(4.3))
    tf_s = tb_s.text_frame
    tf_s.word_wrap = True

    ps = tf_s.paragraphs[0]
    ps.text = "SSNIT Tier 1 Contribution"
    ps.font.size = Pt(18)
    ps.font.bold = True
    ps.font.color.rgb = COLOR_PRIMARY

    ssnit_items = [
        "Employee Contribution: 5.50% (Deducted from staff basic salary)",
        "Employer Contribution: 13.00% (Paid by organization)",
        "Total SSNIT Remittance: 18.50% of Basic Allowance",
        "Mandatory Verification: Requires valid 13-digit SSNIT Number & Ghana Card (NIA) Number.",
        "Automated Exception Flagging: System highlights staff missing SSNIT numbers for resolution before monthly payroll cutoff."
    ]
    for item in ssnit_items:
        p = tf_s.add_paragraph()
        p.text = "• " + item
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_DARK
        p.space_after = Pt(8)

    # Right Card: Petra
    c_petra = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.8))
    c_petra.fill.solid()
    c_petra.fill.fore_color.rgb = COLOR_CARD_BG
    c_petra.line.color.rgb = COLOR_CARD_BORDER

    top_petra = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.8), Inches(2.0), Inches(5.7), Inches(0.12))
    top_petra.fill.solid()
    top_petra.fill.fore_color.rgb = COLOR_ACCENT
    top_petra.line.fill.background()

    tb_p = slide7.shapes.add_textbox(Inches(7.0), Inches(2.3), Inches(5.3), Inches(4.3))
    tf_p = tb_p.text_frame
    tf_p.word_wrap = True

    pp = tf_p.paragraphs[0]
    pp.text = "Petra Provident Fund (Tier 3)"
    pp.font.size = Pt(18)
    pp.font.bold = True
    pp.font.color.rgb = COLOR_ACCENT

    petra_items = [
        "Employee Tier 3 Rate: 5.00% standard deduction",
        "Employer Tier 3 Match: 5.00% organizational match",
        "Petra Template Integration: Generates pre-formatted Petra Trust Excel schedules directly.",
        "Dynamic Rate Configuration: HR Managers can adjust deduction percentages via deduction settings screen.",
        "Historical Auditing: Stores monthly snapshot of deduction rates applied per payroll run."
    ]
    for item in petra_items:
        p = tf_p.add_paragraph()
        p.text = "• " + item
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_DARK
        p.space_after = Pt(8)

    # ----------------------------------------------------
    # SLIDE 8: Module 4 - Payslip Generation & Payroll Processing
    # ----------------------------------------------------
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide8, COLOR_WHITE)
    add_header(slide8, "Module 4: Payslip Generation & Monthly Payroll Workflow")

    payslip_cards = [
        ("1. Monthly Validation", "Validate active staff list, payment status (Paid vs On Hold), and active contract status before running payroll.", COLOR_PRIMARY),
        ("2. Deductions Calculation", "System calculates Gross Salary, SSNIT Employee (5.5%), Petra (5%), and computes exact Net Salary payable.", COLOR_ACCENT),
        ("3. Payslip Generation", "Generate individual digital payslips or batch printable payslips with bank account & branch details.", COLOR_HIGHLIGHT),
        ("4. Export & Distribution", "Export formatted Excel payslip summaries and PDF documents for distribution to temporary staff.", RGBColor(16, 185, 129))
    ]

    for i, (ptitle, pdesc, pcolor) in enumerate(payslip_cards):
        col = i % 2
        row = i // 2
        left = Inches(0.8 + col * 5.97)
        top = Inches(2.0 + row * 2.5)

        card = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(5.76), Inches(2.2))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD_BG
        card.line.color.rgb = COLOR_CARD_BORDER

        bar = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, Inches(5.76), Inches(0.1))
        bar.fill.solid()
        bar.fill.fore_color.rgb = pcolor
        bar.line.fill.background()

        tb = slide8.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), Inches(5.36), Inches(1.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = ptitle
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = pcolor

        p_d = tf.add_paragraph()
        p_d.text = pdesc
        p_d.font.size = Pt(13)
        p_d.font.color.rgb = COLOR_TEXT_DARK
        p_d.space_before = Pt(8)

    # ----------------------------------------------------
    # SLIDE 9: Module 5 - Bulk Data Import, Export & Reporting
    # ----------------------------------------------------
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide9, COLOR_WHITE)
    add_header(slide9, "Module 5: Data Management, Imports & Exports")

    imp_items = [
        ("Excel & CSV Onboarding", "Upload master staff lists directly from Excel templates without manual single-entry work."),
        ("Validation Check", "Automatic checks for duplicate Staff Codes, invalid SSNIT numbers, or missing bank details during import."),
        ("Error Logging", "Detailed reporting of failed import rows so officers can fix data anomalies prior to final database sync.")
    ]

    exp_items = [
        ("Custom Filtered Exports", "Export staff lists filtered by Department, Active Status, Expiration Window, or Payment Status."),
        ("Statutory Schedules", "One-click export of monthly SSNIT contribution schedules and Petra Trust pension templates."),
        ("Audit History Reports", "Export log files for internal HR review, external auditors, or executive management reporting.")
    ]

    # Left Card: Import
    c_imp = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.7), Inches(4.8))
    c_imp.fill.solid()
    c_imp.fill.fore_color.rgb = COLOR_CARD_BG
    c_imp.line.color.rgb = COLOR_CARD_BORDER

    top_imp = slide9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.7), Inches(0.12))
    top_imp.fill.solid()
    top_imp.fill.fore_color.rgb = COLOR_PRIMARY
    top_imp.line.fill.background()

    tb_i = slide9.shapes.add_textbox(Inches(1.0), Inches(2.3), Inches(5.3), Inches(4.3))
    tf_i = tb_i.text_frame
    tf_i.word_wrap = True

    pi = tf_i.paragraphs[0]
    pi.text = "Bulk Import Features"
    pi.font.size = Pt(18)
    pi.font.bold = True
    pi.font.color.rgb = COLOR_PRIMARY

    for heading, detail in imp_items:
        p = tf_i.add_paragraph()
        p.text = "• " + heading + ": "
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_DARK
        p.space_after = Pt(4)
        
        p_sub = tf_i.add_paragraph()
        p_sub.text = "   " + detail
        p_sub.font.size = Pt(12)
        p_sub.font.color.rgb = COLOR_TEXT_MUTED
        p_sub.space_after = Pt(8)

    # Right Card: Export
    c_exp = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(2.0), Inches(5.7), Inches(4.8))
    c_exp.fill.solid()
    c_exp.fill.fore_color.rgb = COLOR_CARD_BG
    c_exp.line.color.rgb = COLOR_CARD_BORDER

    top_exp = slide9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.8), Inches(2.0), Inches(5.7), Inches(0.12))
    top_exp.fill.solid()
    top_exp.fill.fore_color.rgb = COLOR_ACCENT
    top_exp.line.fill.background()

    tb_e = slide9.shapes.add_textbox(Inches(7.0), Inches(2.3), Inches(5.3), Inches(4.3))
    tf_e = tb_e.text_frame
    tf_e.word_wrap = True

    pe = tf_e.paragraphs[0]
    pe.text = "Export & Reporting Capabilities"
    pe.font.size = Pt(18)
    pe.font.bold = True
    pe.font.color.rgb = COLOR_ACCENT

    for heading, detail in exp_items:
        p = tf_e.add_paragraph()
        p.text = "• " + heading + ": "
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_DARK
        p.space_after = Pt(4)

        p_sub = tf_e.add_paragraph()
        p_sub.text = "   " + detail
        p_sub.font.size = Pt(12)
        p_sub.font.color.rgb = COLOR_TEXT_MUTED
        p_sub.space_after = Pt(8)

    # ----------------------------------------------------
    # SLIDE 10: Module 6 - Audit Logs, Security & Compliance
    # ----------------------------------------------------
    slide10 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide10, COLOR_WHITE)
    add_header(slide10, "Module 6: Security, Audit Trail & Governance")

    sec_cards = [
        ("Automated Audit Trail", "Every system action (Create, Update, Renew, Terminate, Payment Hold) is recorded in an immutable audit table with timestamp and user ID.", COLOR_PRIMARY),
        ("Role Access Protection", "Next.js middleware enforces strict role authorization guards blocking unauthorized access to financial and administrative endpoints.", COLOR_ACCENT),
        ("Session Security & Cookie Auth", "Secure cookie session management with automatic expiration prevents unauthorized active session hijack.", COLOR_HIGHLIGHT),
        ("Data Integrity Checks", "Unique constraints on Staff Code, SSNIT Number, and Ghana Card (NIA) ensure zero duplicate employee records.", RGBColor(16, 185, 129))
    ]

    for i, (stitle, sdesc, scolor) in enumerate(sec_cards):
        col = i % 2
        row = i // 2
        left = Inches(0.8 + col * 5.97)
        top = Inches(2.0 + row * 2.5)

        card = slide10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(5.76), Inches(2.2))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD_BG
        card.line.color.rgb = COLOR_CARD_BORDER

        bar = slide10.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, Inches(5.76), Inches(0.1))
        bar.fill.solid()
        bar.fill.fore_color.rgb = scolor
        bar.line.fill.background()

        tb = slide10.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), Inches(5.36), Inches(1.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = stitle
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = scolor

        p_d = tf.add_paragraph()
        p_d.text = sdesc
        p_d.font.size = Pt(13)
        p_d.font.color.rgb = COLOR_TEXT_DARK
        p_d.space_before = Pt(8)

    # ----------------------------------------------------
    # SLIDE 11: Standard Operating Procedures (SOP Walkthrough)
    # ----------------------------------------------------
    slide11 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide11, COLOR_WHITE)
    add_header(slide11, "Standard Operating Procedures (SOP Checklist)")

    sops = [
        ("Daily HR Operations", [
            "Check Dashboard for contract expirations in the < 30 Days window.",
            "Initiate renewal procedures for staff recommended by department heads.",
            "Verify all new staff onboarding profiles for complete SSNIT & Bank info."
        ]),
        ("Monthly Payroll Cutoff", [
            "Verify staff payment holds and resolve unpaid reason notes with HR Manager.",
            "Generate SSNIT Tier 1 & Petra Tier 3 deduction reports for finance review.",
            "Run batch payslip generation and verify net pay accuracy against master bank list."
        ]),
        ("Quarterly System Review", [
            "Export full staff audit log for compliance review.",
            "Reconcile terminated contracts and ensure archived status consistency.",
            "Perform database backup and system integrity verification."
        ])
    ]

    for i, (stitle, sitems) in enumerate(sops):
        left = Inches(0.8 + i * 3.98)
        top = Inches(2.0)
        width = Inches(3.78)
        height = Inches(4.8)

        card = slide11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD_BG
        card.line.color.rgb = COLOR_CARD_BORDER

        top_line = slide11.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.1))
        top_line.fill.solid()
        top_line.fill.fore_color.rgb = COLOR_PRIMARY if i == 0 else (COLOR_ACCENT if i == 1 else COLOR_HIGHLIGHT)
        top_line.line.fill.background()

        tb = slide11.shapes.add_textbox(left + Inches(0.2), top + Inches(0.25), width - Inches(0.4), height - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = stitle
        p_t.font.size = Pt(17)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_PRIMARY if i == 0 else (COLOR_ACCENT if i == 1 else COLOR_HIGHLIGHT)

        for item in sitems:
            p = tf.add_paragraph()
            p.text = "• " + item
            p.font.size = Pt(13)
            p.font.color.rgb = COLOR_TEXT_DARK
            p.space_before = Pt(10)

    # ----------------------------------------------------
    # SLIDE 12: Summary & Key Takeaways
    # ----------------------------------------------------
    slide12 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide12, COLOR_BG_DARK)

    # Main Card
    dec_card = slide12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(0.8), Inches(11.333), Inches(5.9))
    dec_card.fill.solid()
    dec_card.fill.fore_color.rgb = RGBColor(30, 41, 59)
    dec_card.line.color.rgb = RGBColor(51, 65, 85)

    tb_end = slide12.shapes.add_textbox(Inches(1.5), Inches(1.2), Inches(10.333), Inches(5.0))
    tf_end = tb_end.text_frame
    tf_end.word_wrap = True

    pe1 = tf_end.paragraphs[0]
    pe1.text = "Summary & Key Takeaways for Trainees"
    pe1.font.size = Pt(32)
    pe1.font.bold = True
    pe1.font.color.rgb = COLOR_WHITE

    takeaways = [
        "1. Proactive Expiration Management: Never let contracts silently lapse—monitor the dashboard daily.",
        "2. Strict Role Adherence: Respect role boundaries (HR Officer vs HR Manager vs Finance) to ensure financial control.",
        "3. Zero Tolerance for Missing SSNIT: Ensure every staff profile has valid SSNIT & Ghana Card credentials before payroll cutoff.",
        "4. Audit Transparency: Remember every modification is logged—always provide accurate notes for payment holds and terminations.",
        "5. System Support & Helpdesk: For assistance, contact the HR Systems Admin or IT Operations Team."
    ]

    for t in takeaways:
        p = tf_end.add_paragraph()
        p.text = t
        p.font.size = Pt(16)
        p.font.color.rgb = RGBColor(226, 232, 240)
        p.space_before = Pt(14)

    output_path = r"c:\Users\Constance\Desktop\Work\temp\TempStaff_System_Training_Presentation.pptx"
    try:
        prs.save(output_path)
        print(f"Presentation saved successfully to {output_path}")
    except PermissionError:
        output_path_alt = r"c:\Users\Constance\Desktop\Work\temp\TempStaff_System_Training_Presentation_v2.pptx"
        prs.save(output_path_alt)
        print(f"Presentation saved successfully to {output_path_alt}")

if __name__ == "__main__":
    create_presentation()
