"""
SQLite Database Connection and Initialization with WAL Mode
Ensures concurrent LAN read/write performance for multiple classroom devices.
"""
import sqlite3
import json
import logging
from typing import Any, Dict, List, Optional
from contextlib import contextmanager
from app.config import DATABASE_PATH, APP_DIR

logger = logging.getLogger(__name__)

def dict_factory(cursor: sqlite3.Cursor, row: tuple) -> Dict[str, Any]:
    """Convert SQLite row to a Python dictionary, auto-decoding JSON columns."""
    d = {}
    for idx, col in enumerate(cursor.description):
        val = row[idx]
        col_name = col[0]
        if isinstance(val, str) and (col_name.endswith("_json") or col_name == "criteria"):
            try:
                d[col_name] = json.loads(val)
                continue
            except Exception:
                pass
        d[col_name] = val
    return d

def get_db_connection() -> sqlite3.Connection:
    """Create and configure a SQLite connection with WAL mode."""
    conn = sqlite3.connect(str(DATABASE_PATH), timeout=15.0)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    return conn

@contextmanager
def get_db():
    """Context manager for SQLite transactions."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction failed: {e}")
        raise e
    finally:
        conn.close()

def init_db():
    """Execute schema.sql to ensure all tables, indexes, and pragma settings are initialized."""
    schema_path = APP_DIR / "schema.sql"
    if not schema_path.exists():
        raise FileNotFoundError(f"Schema file not found at {schema_path}")
    
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    with get_db() as conn:
        conn.executescript(schema_sql)
    logger.info("SQLite database initialized successfully with WAL mode enabled.")

def log_audit(action: str, essay_id: Optional[str] = None, details: str = "", actor: str = "Teacher / System", client_ip: str = "127.0.0.1"):
    """Write an immutable audit log entry into the database."""
    try:
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO audit_logs (essay_id, action, details, actor, client_ip)
                VALUES (?, ?, ?, ?, ?)
                """,
                (essay_id, action, details, actor, client_ip)
            )
    except Exception as e:
        logger.warning(f"Failed to log audit event {action}: {e}")
