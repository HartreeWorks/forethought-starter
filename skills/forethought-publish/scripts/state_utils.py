#!/usr/bin/env python3
"""
Utility script for managing publication state during development.

Usage:
    python state_utils.py list                    # List all publications
    python state_utils.py delete <pub-id>         # Delete a specific publication
    python state_utils.py delete-all              # Delete all publications
    python state_utils.py reset                   # Reset to empty state
    python state_utils.py set-active <pub-id>     # Set active publication
    python state_utils.py clear-active            # Clear active publication
    python state_utils.py backup                  # Create timestamped backup
    python state_utils.py restore <backup-file>   # Restore from backup
"""

import json
import sys
import shutil
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
STATE_FILE = SCRIPT_DIR.parent / "state.json"
BACKUP_DIR = SCRIPT_DIR.parent / "backups"


def load_state():
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"publications": {}, "active": None}


def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)
    print(f"State saved to {STATE_FILE}")


def list_pubs():
    state = load_state()
    pubs = state.get("publications", {})
    active = state.get("active")

    if not pubs:
        print("No publications found.")
        return

    print(f"Publications ({len(pubs)}):\n")
    for pub_id, pub in pubs.items():
        marker = " [ACTIVE]" if pub_id == active else ""
        completed = len(pub.get("completed", []))
        print(f"  {pub_id}{marker}")
        print(f"    Title: {pub.get('title', 'Untitled')}")
        print(f"    Type: {pub.get('type', 'unknown')}")
        print(f"    Steps completed: {completed}")
        print()


def delete_pub(pub_id):
    state = load_state()
    pubs = state.get("publications", {})

    if pub_id not in pubs:
        print(f"Publication '{pub_id}' not found.")
        return

    title = pubs[pub_id].get("title", "Untitled")
    del pubs[pub_id]

    # Clear active if it was the deleted one
    if state.get("active") == pub_id:
        state["active"] = None

    save_state(state)
    print(f"Deleted: {pub_id} ({title})")


def delete_all():
    state = load_state()
    count = len(state.get("publications", {}))
    state["publications"] = {}
    state["active"] = None
    save_state(state)
    print(f"Deleted {count} publication(s).")


def reset():
    state = {"publications": {}, "active": None}
    save_state(state)
    print("State reset to empty.")


def set_active(pub_id):
    state = load_state()
    pubs = state.get("publications", {})

    if pub_id not in pubs:
        print(f"Publication '{pub_id}' not found.")
        return

    state["active"] = pub_id
    save_state(state)
    print(f"Active publication set to: {pub_id}")


def clear_active():
    state = load_state()
    state["active"] = None
    save_state(state)
    print("Active publication cleared.")


def backup():
    BACKUP_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_file = BACKUP_DIR / f"state-{timestamp}.json"
    shutil.copy(STATE_FILE, backup_file)
    print(f"Backup created: {backup_file}")


def restore(backup_file):
    backup_path = Path(backup_file)
    if not backup_path.exists():
        # Try looking in backups dir
        backup_path = BACKUP_DIR / backup_file

    if not backup_path.exists():
        print(f"Backup file not found: {backup_file}")
        return

    shutil.copy(backup_path, STATE_FILE)
    print(f"State restored from: {backup_path}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    cmd = sys.argv[1]

    if cmd == "list":
        list_pubs()
    elif cmd == "delete" and len(sys.argv) >= 3:
        delete_pub(sys.argv[2])
    elif cmd == "delete-all":
        delete_all()
    elif cmd == "reset":
        reset()
    elif cmd == "set-active" and len(sys.argv) >= 3:
        set_active(sys.argv[2])
    elif cmd == "clear-active":
        clear_active()
    elif cmd == "backup":
        backup()
    elif cmd == "restore" and len(sys.argv) >= 3:
        restore(sys.argv[2])
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
