import json
from pathlib import Path
from typing import Any


def ensure_data_file_exists(file_path: str) -> None:
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    if not path.exists():
        path.write_text("[]", encoding="utf-8")


def load_json(file_path: str) -> list[dict[str, Any]]:
    ensure_data_file_exists(file_path)
    path = Path(file_path)

    raw_content = path.read_text(encoding="utf-8").strip()
    if not raw_content:
        return []

    data = json.loads(raw_content)
    if isinstance(data, list):
        return data

    return []


def save_json(file_path: str, data: list[dict[str, Any]]) -> None:
    ensure_data_file_exists(file_path)
    path = Path(file_path)
    path.write_text(json.dumps(data, ensure_ascii=True, indent=2), encoding="utf-8")
