"""
Quick Tableau REST API check for datasource/workbook last refresh/updated times.

Usage examples (replace with your values):
  export TABLEAU_PAT_NAME="your_pat_name"
  export TABLEAU_PAT_SECRET="your_pat_secret"
  export TABLEAU_SITE_CONTENT_URL="foxanalytics"
  export TABLEAU_BASE_URL="https://us-west-2b.online.tableau.com"
  python tableau_refresh_check.py

Or pass via flags:
  python tableau_refresh_check.py \
    --pat-name your_pat_name \
    --pat-secret your_pat_secret \
    --site-content-url foxanalytics \
    --base-url https://us-west-2b.online.tableau.com
"""

import argparse
import os
import sys
from typing import Dict, Iterable, Optional, Tuple

import requests


API_VERSION = "3.19"

# Hardcoded defaults (replace if needed). Avoid committing real secrets to VCS.
DEFAULT_BASE_URL = "https://us-west-2b.online.tableau.com"
DEFAULT_SITE_CONTENT_URL = "foxanalytics"
DEFAULT_PAT_NAME = "h29hczwXQ0GgmPA3qRXLPg=="
DEFAULT_PAT_SECRET = "y29vNXU1625ulvN0XKMUPgY2XkooMYpa"


class TableauClient:
    def __init__(self, base_url: str, pat_name: str, pat_secret: str, site_content_url: str):
        if base_url.endswith("/"):
            base_url = base_url[:-1]
        self.base_url = base_url
        self.pat_name = pat_name
        self.pat_secret = pat_secret
        self.site_content_url = site_content_url
        self.token: Optional[str] = None
        self.site_id: Optional[str] = None

    def _api(self, path: str) -> str:
        return f"{self.base_url}/api/{API_VERSION}{path}"

    def sign_in(self) -> None:
        url = self._api("/auth/signin")
        payload = {
            "credentials": {
                "personalAccessTokenName": self.pat_name,
                "personalAccessTokenSecret": self.pat_secret,
                "site": {"contentUrl": self.site_content_url},
            }
        }
        resp = requests.post(url, json=payload)
        if resp.status_code != 200:
            raise RuntimeError(f"Sign-in failed ({resp.status_code}): {resp.text}")
        data = resp.json()["credentials"]
        self.token = data["token"]
        self.site_id = data["site"]["id"]

    def sign_out(self) -> None:
        if not self.token:
            return
        url = self._api("/auth/signout")
        requests.post(url, headers={"X-Tableau-Auth": self.token})
        self.token = None
        self.site_id = None

    def _get(self, path: str, params: Optional[Dict[str, str]] = None) -> Dict:
        if not self.token or not self.site_id:
            raise RuntimeError("Not signed in")
        url = self._api(path)
        headers = {"X-Tableau-Auth": self.token}
        resp = requests.get(url, headers=headers, params=params or {})
        if resp.status_code != 200:
            raise RuntimeError(f"GET {url} failed ({resp.status_code}): {resp.text}")
        return resp.json()

    def list_datasources(self, project_id: Optional[str] = None) -> Iterable[Dict]:
        params = {
            "fields": "id,name,updatedAt,createdAt",
            "include": "lastRefreshTime",
        }
        if project_id:
            params["projectId"] = project_id
        data = self._get(f"/sites/{self.site_id}/datasources", params=params)
        return data.get("datasources", {}).get("datasource", [])

    def list_workbooks(self, project_id: Optional[str] = None) -> Iterable[Dict]:
        params = {
            "fields": "id,name,updatedAt,createdAt",
        }
        if project_id:
            params["projectId"] = project_id
        data = self._get(f"/sites/{self.site_id}/workbooks", params=params)
        return data.get("workbooks", {}).get("workbook", [])

    def list_projects(self) -> Iterable[Dict]:
        data = self._get(f"/sites/{self.site_id}/projects")
        return data.get("projects", {}).get("project", [])


def format_row(item: Dict, key_fields: Tuple[str, ...]) -> str:
    def safe_get(obj: Dict, key: str) -> str:
        return str(obj.get(key, ""))

    parts = [f"{k}={safe_get(item, k)}" for k in key_fields]
    last_refresh = item.get("lastRefreshTime") or item.get("lastUpdatedAt") or ""
    if last_refresh:
        parts.append(f"lastRefreshTime={last_refresh}")
    return ", ".join(parts)


def resolve_project_id(client: TableauClient, project_name: Optional[str]) -> Optional[str]:
    if not project_name:
        return None
    for project in client.list_projects():
        if project.get("name") == project_name:
            return project.get("id")
    raise RuntimeError(f"Project '{project_name}' not found or inaccessible.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Check Tableau datasource/workbook refresh times.")
    parser.add_argument("--base-url", default=os.getenv("TABLEAU_BASE_URL", DEFAULT_BASE_URL))
    parser.add_argument("--site-content-url", default=os.getenv("TABLEAU_SITE_CONTENT_URL", DEFAULT_SITE_CONTENT_URL))
    parser.add_argument("--pat-name", default=os.getenv("TABLEAU_PAT_NAME", DEFAULT_PAT_NAME))
    parser.add_argument("--pat-secret", default=os.getenv("TABLEAU_PAT_SECRET", DEFAULT_PAT_SECRET))
    parser.add_argument("--project-name", default=os.getenv("TABLEAU_PROJECT_NAME"))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    missing = [name for name, val in [
        ("--pat-name / TABLEAU_PAT_NAME", args.pat_name),
        ("--pat-secret / TABLEAU_PAT_SECRET", args.pat_secret),
    ] if not val]
    if missing:
        print(f"Missing required values: {', '.join(missing)}", file=sys.stderr)
        return 1

    client = TableauClient(
        base_url=args.base_url,
        pat_name=args.pat_name,
        pat_secret=args.pat_secret,
        site_content_url=args.site_content_url,
    )

    try:
        print(f"Signing in to {args.base_url} (site '{args.site_content_url}')...")
        client.sign_in()
        print("Signed in.")

        project_id = resolve_project_id(client, args.project_name)
        if project_id:
            print(f"Filtering by project: {args.project_name} ({project_id})")

        print("\nDatasources:")
        datasources = list(client.list_datasources(project_id=project_id))
        if not datasources:
            print("  (none found or insufficient permissions)")
        for ds in datasources:
            print("  " + format_row(ds, ("name", "updatedAt", "createdAt")))

        print("\nWorkbooks:")
        workbooks = list(client.list_workbooks(project_id=project_id))
        if not workbooks:
            print("  (none found or insufficient permissions)")
        for wb in workbooks:
            print("  " + format_row(wb, ("name", "updatedAt", "createdAt")))

    except Exception as exc:  # pylint: disable=broad-except
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    finally:
        try:
            client.sign_out()
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())

