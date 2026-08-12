try:
    import pytest
except ImportError:
    pass
import sys
import os

backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.config import get_waec_grade, WAEC_GRADE_SCALE

def test_waec_grade_boundaries():
    """Verify exact WAEC letter grade boundaries from A1 to F9."""
    assert get_waec_grade(100.0)["grade"] == "A1"
    assert get_waec_grade(85.0)["grade"] == "A1"
    assert get_waec_grade(80.0)["grade"] == "A1"

    assert get_waec_grade(79.99)["grade"] == "B2"
    assert get_waec_grade(72.0)["grade"] == "B2"
    assert get_waec_grade(70.0)["grade"] == "B2"

    assert get_waec_grade(69.99)["grade"] == "B3"
    assert get_waec_grade(65.0)["grade"] == "B3"

    assert get_waec_grade(64.99)["grade"] == "C4"
    assert get_waec_grade(60.0)["grade"] == "C4"

    assert get_waec_grade(59.99)["grade"] == "C5"
    assert get_waec_grade(55.0)["grade"] == "C5"

    assert get_waec_grade(54.99)["grade"] == "C6"
    assert get_waec_grade(50.0)["grade"] == "C6"

    assert get_waec_grade(49.99)["grade"] == "D7"
    assert get_waec_grade(45.0)["grade"] == "D7"

    assert get_waec_grade(44.99)["grade"] == "E8"
    assert get_waec_grade(40.0)["grade"] == "E8"

    assert get_waec_grade(39.99)["grade"] == "F9"
    assert get_waec_grade(0.0)["grade"] == "F9"

def test_waec_grade_edge_cases():
    """Verify handling of out-of-bound percentages (negative or >100)."""
    assert get_waec_grade(-10.0)["grade"] == "F9"
    assert get_waec_grade(150.0)["grade"] == "A1"

def test_waec_scale_structure():
    """Verify WAEC_GRADE_SCALE structure contains valid fields."""
    for entry in WAEC_GRADE_SCALE:
        assert "grade" in entry
        assert "label" in entry
        assert "min_score" in entry
        assert "max_score" in entry
        assert "color" in entry
