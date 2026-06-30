import logging
import sys
import json
import os
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Structured JSON log formatter for production environments."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


def setup_logger() -> logging.Logger:
    """
    Configure and return the application logger.
    Uses JSON format in production and human-readable format in development.
    """
    environment = os.getenv("ENVIRONMENT", "development").lower()
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()

    _logger = logging.getLogger("ResumeAI")
    _logger.setLevel(getattr(logging, log_level, logging.INFO))

    # Prevent duplicate handlers on reload
    if _logger.handlers:
        _logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)

    if environment == "production":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
        )

    _logger.addHandler(handler)

    # Prevent log propagation to root logger (avoids duplicate output)
    _logger.propagate = False

    return _logger


logger = setup_logger()
