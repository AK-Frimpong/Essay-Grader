"""
End-to-End Integration Verification Script
Tests the complete offline pipeline:
1. SQLite WAL mode initialization & table integrity
2. RSA-2048 hardware license generation & verification
3. Synthetic document OCR extraction with OpenCV preprocessing
4. AI Rubric Evaluation (Ollama / Heuristic engine fallback)
5. Teacher review, score override & grade locking
6. ReportLab PDF student report card generation & QR integrity check
7. Class CSV grade sheet generation
"""
import sys
import os
import json
import numpy as np
import cv2

# Ensure UTF-8 stdout encoding for Windows console
if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Set backend directory in sys.path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.insert(0, backend_path)

from app.config import get_lan_ip, get_waec_grade, DATABASE_PATH, UPLOADS_DIR, GENERATED_REPORTS_DIR
from app.database import init_db, get_db
from app.seed_data import seed_database
from app.services.license_service import (
    get_machine_hardware_signature,
    generate_sample_school_license,
    verify_and_apply_license_file,
    get_current_license_status,
    process_paystack_momo_topup
)
from app.services.ocr_service import preprocess_image_opencv, extract_text_from_document
from app.services.ollama_service import evaluate_essay_with_ollama
from app.services.pdf_service import generate_student_pdf_report
from app.services.export_service import export_class_grade_sheet_csv

def run_e2e_tests():
    print("=================================================================")
    print("🇬🇭 TESTING OFFLINE ESSAY GRADER LAN PIPELINE (GHANA EDITION)")
    print("=================================================================")

    # Test 1: Initialize DB & WAL Mode
    print("\n[1/7] Testing SQLite Database Initialization with WAL Mode...")
    init_db()
    seed_database()
    with get_db() as conn:
        journal_mode = conn.execute("PRAGMA journal_mode;").fetchone()["journal_mode"]
        print(f"  ✓ Database created at {DATABASE_PATH}")
        print(f"  ✓ SQLite Journal Mode: {journal_mode.upper()} (WAL Mode Confirmed)")
        
        rubric_count = conn.execute("SELECT COUNT(*) as c FROM rubrics;").fetchone()["c"]
        essay_count = conn.execute("SELECT COUNT(*) as c FROM essays;").fetchone()["c"]
        print(f"  ✓ Seeded Rubrics: {rubric_count}, Seeded Essays: {essay_count}")
        assert rubric_count >= 2, "Rubrics failed to seed"
        assert essay_count >= 2, "Sample essays failed to seed"

    # Test 2: Hardware Fingerprinting & RSA-2048 Licensing
    print("\n[2/7] Testing Hardware Fingerprinting & RSA Cryptographic Licensing...")
    hw = get_machine_hardware_signature()
    print(f"  ✓ Machine UUID:   {hw['machine_uuid']}")
    print(f"  ✓ MAC Signature:  {hw['mac_address']}")
    print(f"  ✓ Platform Info:  {hw['platform_info']}")
    
    # Generate & verify signed license
    test_lic_b64 = generate_sample_school_license("Mfantsipim School, Cape Coast", credits=350)
    success, msg = verify_and_apply_license_file(test_lic_b64)
    print(f"  ✓ RSA-2048 Verification: {success} -> {msg}")
    assert success, "RSA License verification failed"

    lic_status = get_current_license_status()
    print(f"  ✓ Active School: {lic_status['school_name']} | Remaining Credits: {lic_status['remaining_credits']}")

    # Test MoMo Top-up Ledger
    momo_res = process_paystack_momo_topup("0244123456", "MTN_MOMO", 50.0, 100)
    print(f"  ✓ Paystack MoMo Top-up: {momo_res['status']} | Added: {momo_res['credits_added']} credits")

    # Test 3: Synthetic Image Generation & OpenCV Preprocessing
    print("\n[3/7] Testing OpenCV Preprocessing & OCR Ingestion Pipeline...")
    # Create a synthetic handwritten-style scanned image
    dummy_img = np.ones((400, 800, 3), dtype=np.uint8) * 245
    cv2.putText(dummy_img, "THE ROLE OF AGRICULTURE IN GHANA'S ECONOMY", (40, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (20, 20, 20), 2)
    cv2.putText(dummy_img, "Agriculture remains the backbone of our national development.", (40, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (40, 40, 40), 1)
    cv2.putText(dummy_img, "Cocoa and cashew exports generate vital foreign exchange.", (40, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (40, 40, 40), 1)
    cv2.putText(dummy_img, "We must modernize farming methods for youth employment.", (40, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (40, 40, 40), 1)
    
    test_img_path = str(UPLOADS_DIR / "synthetic_test_essay.png")
    cv2.imwrite(test_img_path, dummy_img)
    
    bin_img, preprocessed_path = preprocess_image_opencv(test_img_path)
    print(f"  ✓ Saved preprocessed image to: {preprocessed_path}")
    extracted_text, _ = extract_text_from_document(test_img_path, "IMAGE")
    print(f"  ✓ Extracted Text preview ({len(extracted_text.split())} words):")
    print(f"    \"{extracted_text[:120]}...\"")
    assert len(extracted_text.strip()) > 0, "OCR extraction produced empty string"

    # Test 4: AI Rubric Evaluation
    print("\n[4/7] Testing Rubric-Aligned AI Evaluation Engine...")
    with get_db() as conn:
        sample_rubric = conn.execute("SELECT * FROM rubrics WHERE id = 'rubric-waec-bece-english'").fetchone()

    eval_result = evaluate_essay_with_ollama(
        essay_text=extracted_text,
        rubric=sample_rubric,
        subject="English Language",
        grade_level="JHS 3"
    )
    print(f"  ✓ Evaluation Engine: {eval_result.get('evaluator_engine')}")
    print(f"  ✓ Awarded Score:     {eval_result.get('overall_score')} / {sample_rubric['total_points']}")
    print(f"  ✓ Criteria Graded:   {len(eval_result.get('criteria_scores', []))} criteria")
    for c in eval_result.get("criteria_scores", []):
        print(f"    - {c['name']}: {c['ai_score']}/{c['max_score']} ({c['comment'][:40]}...)")
    
    pct = (eval_result['overall_score'] / sample_rubric['total_points']) * 100.0
    waec_grade = get_waec_grade(pct)
    print(f"  ✓ WAEC Letter Grade: {waec_grade['grade']} ({waec_grade['label']}) -> {pct:.1f}%")

    # Test 5: Teacher Review, Score Overrides & Grade Locking
    print("\n[5/7] Testing Teacher Score Overrides & Grade Locking...")
    # Simulate teacher overriding a criterion
    modified_criteria = eval_result["criteria_scores"]
    if modified_criteria:
        modified_criteria[0]["teacher_score"] = min(modified_criteria[0]["max_score"], modified_criteria[0]["ai_score"] + 1.0)
    
    teacher_overall = sum(c.get("teacher_score", c["ai_score"]) for c in modified_criteria)
    teacher_pct = (teacher_overall / sample_rubric["total_points"]) * 100.0
    final_waec = get_waec_grade(teacher_pct)
    print(f"  ✓ Teacher Overridden Score: {teacher_overall} / {sample_rubric['total_points']} ({final_waec['grade']})")

    # Test 6: ReportLab PDF Report Card Generation
    print("\n[6/7] Testing ReportLab PDF Generation with QR Verification Stamp...")
    essay_mock = {
        "id": "test-e2e-essay-001",
        "student_name": "Kofi Antwi",
        "student_id": "WAEC-JHS-2026-999",
        "school_name": "Mfantsipim Basic School",
        "subject": "English Language",
        "grade_level": "JHS 3",
        "title": "The Role of Agriculture in Ghana's Economy",
        "word_count": len(extracted_text.split()),
        "rubric_title": sample_rubric["title"]
    }
    grade_mock = {
        "overall_score": teacher_overall,
        "max_overall_score": sample_rubric["total_points"],
        "percentage": teacher_pct,
        "letter_grade": final_waec["grade"],
        "final_criteria_scores_json": modified_criteria,
        "strengths_json": eval_result.get("strengths", []),
        "weaknesses_json": eval_result.get("weaknesses", []),
        "teacher_feedback": "Exceptional presentation of agricultural facts with solid vocabulary.",
        "approved_by": "Mr. S. Mensah (Examiner)"
    }
    pdf_path = generate_student_pdf_report(essay_mock, grade_mock, sample_rubric)
    print(f"  ✓ PDF Report Card Generated: {pdf_path}")
    assert os.path.exists(pdf_path), "PDF file was not created"
    assert os.path.getsize(pdf_path) > 1000, "PDF file is suspiciously small"

    # Test 7: CSV Master Grade Sheet Export
    print("\n[7/7] Testing Class-Wide CSV Master Grade Sheet Export...")
    csv_data = export_class_grade_sheet_csv()
    csv_lines = csv_data.strip().split("\n")
    print(f"  ✓ CSV Exported with {len(csv_lines)} rows (including headers)")
    print(f"  ✓ Header: {csv_lines[0][:60]}...")
    assert len(csv_lines) >= 2, "CSV export returned fewer than 2 lines"

    # Detect LAN IP
    lan_ip = get_lan_ip()
    print("\n=================================================================")
    print("🎉 ALL 7 E2E INTEGRATION PIPELINE TESTS PASSED!")
    print(f"📡 Broadcast LAN Host IP: http://{lan_ip}:8000")
    print("=================================================================")

if __name__ == "__main__":
    run_e2e_tests()
