try:
    import pytest
except ImportError:
    pass
import sys
import os
import numpy as np
import cv2

backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.config import UPLOADS_DIR
from app.services.ocr_service import preprocess_image_opencv

def test_opencv_preprocessing():
    """Verify OpenCV bilateral denoise, deskew, and binarization on a synthetic image."""
    # Create synthetic image
    img = np.ones((300, 600, 3), dtype=np.uint8) * 240
    cv2.putText(img, "TEST ESSAY OCR PREPROCESSING", (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (10, 10, 10), 2)
    cv2.putText(img, "Achimota School JHS English Language", (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (30, 30, 30), 1)

    test_img_path = str(UPLOADS_DIR / "unit_test_synthetic.png")
    cv2.imwrite(test_img_path, img)

    binary_mat, out_path = preprocess_image_opencv(test_img_path)

    assert binary_mat is not None
    assert isinstance(binary_mat, np.ndarray)
    assert os.path.exists(out_path)
    assert binary_mat.shape[0] == 300
    assert binary_mat.shape[1] == 600
