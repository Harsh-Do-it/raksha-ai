# ⚠️ Deprecated — Legacy Routers

> **These files are NOT used by the application.**

The standalone Flask apps in this directory are **legacy prototypes** that have been superseded by the consolidated routes in [`../main.py`](../main.py).

## Current Status

| File | Status | Notes |
|------|--------|-------|
| `dashboard.py` | ❌ Unused | Duplicated in `main.py` |
| `risk.py` | ❌ Unused | Duplicated in `main.py` |
| `roads.py` | ❌ Unused | Older prototype, simpler detection logic |
| `sos.py` | ❌ Unused | CLI-only class, not a Flask app |
| `reports_localized_example.py` | 📝 Example | Blueprint example, never registered |

## What to Do

- **To use**: Register these as Flask Blueprints in `main.py` instead of standalone apps
- **To clean up**: Delete this directory — `main.py` already has all the routes
- **If extending**: Use `reports_localized_example.py` as a template for adding localized Blueprint routes
