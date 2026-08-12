import sys
import os
import importlib
import traceback

if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

def run_all_backend_tests():
    print("=================================================================")
    print("🧪 RUNNING FORMAL BACKEND UNIT TEST SUITE (PYTEST COMPATIBLE)")
    print("=================================================================")

    tests_dir = os.path.dirname(os.path.abspath(__file__))
    test_files = [
        "test_waec_grades",
        "test_licensing",
        "test_ocr_preprocessing",
        "test_export_csv",
        "test_pin_auth"
    ]

    total_passed = 0
    total_failed = 0

    for test_module_name in test_files:
        print(f"\n📦 Running {test_module_name}.py...")
        try:
            mod = importlib.import_module(f"tests.{test_module_name}")
            # Find all test_ functions in module
            test_funcs = [fn for fn in dir(mod) if fn.startswith("test_") and callable(getattr(mod, fn))]
            
            for fn_name in test_funcs:
                fn = getattr(mod, fn_name)
                try:
                    fn()
                    print(f"  ✓ {fn_name} PASSED")
                    total_passed += 1
                except Exception as e:
                    print(f"  ❌ {fn_name} FAILED: {e}")
                    traceback.print_exc()
                    total_failed += 1
        except Exception as e:
            print(f"  ❌ Error importing {test_module_name}: {e}")
            total_failed += 1

    print("\n=================================================================")
    print(f"📊 SUMMARY: {total_passed} Passed | {total_failed} Failed")
    print("=================================================================")

    if total_failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_all_backend_tests()
