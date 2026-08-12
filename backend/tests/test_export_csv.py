try:
    import pytest
except ImportError:
    pass
import sys
import os
import csv
import io

backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.database import init_db
from app.seed_data import seed_database
from app.services.export_service import export_class_grade_sheet_csv

def setup_test_db():
    init_db()
    seed_database()

def test_export_csv_generation():
    """Verify class-wide grade sheet CSV generation and header formatting."""
    csv_output = export_class_grade_sheet_csv()
    assert isinstance(csv_output, str)
    assert len(csv_output) > 50

    reader = list(csv.reader(io.StringIO(csv_output)))
    assert len(reader) >= 2  # Header + at least 1 student row

    header = reader[0]
    assert "WAEC Index / Student ID" in header[0]
    assert "Student Name" in header[1]
    assert "WAEC Letter Grade" in header
