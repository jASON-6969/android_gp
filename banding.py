import json
import time

import requests

BASE = "https://schoolbanding.com"
API = f"{BASE}/api/schools"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}


def english_index_percent(sai: dict | None) -> float | None:
    if not sai:
        return None
    v = sai.get("2026")
    if v is None:
        return None
    return round(100.0 - float(v) * 100.0, 1)


def ranking_range_text(rank: list | None) -> str:
    if not rank or rank[0] is None:
        return ""
    lo, hi = rank[0], rank[1] if len(rank) > 1 else None
    if hi is None or lo == hi:
        return f"#{lo}"
    return f"#{lo} - #{hi}"


def fetch_page(session: requests.Session, page: int) -> dict:
    r = session.get(
        API,
        params={"p": page, "order": "rank", "asc": "1"},
        headers=HEADERS,
        timeout=60,
    )
    r.raise_for_status()
    return r.json()


def school_record(item: dict) -> dict:
    b = item.get("band") or {}
    return {
        "english_name": item.get("ename") or "",
        "chinese_name": item.get("cname") or "",
        "region": item.get("dist") or "",
        "english_index": english_index_percent(item.get("sai")),
        "banding": b.get("name") or "",
        "ranking_range": ranking_range_text(item.get("rank")),
    }


def main() -> None:
    data: list[dict] = []
    with requests.Session() as session:
        first = fetch_page(session, 1)
        total_pages = int(first["tPgs"])
        data.extend(school_record(item) for item in first["data"])
        for page in range(2, total_pages + 1):
            time.sleep(0.15)
            payload = fetch_page(session, page)
            data.extend(school_record(item) for item in payload["data"])

    out = "school_banding.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"抓取完成！共 {len(data)} 所學校，已存成 {out}")


if __name__ == "__main__":
    main()
