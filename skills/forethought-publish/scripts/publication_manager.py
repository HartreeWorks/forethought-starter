#!/usr/bin/env python3
"""
Publication Manager - State management for Forethought publication workflow.

Commands:
    new         Create a new publication
    list        List all publications
    status      Show status of active or specified publication
    complete    Mark a step as completed
    skip        Skip a step
    decision    Record a decision
    save        Save generated content
    resume      Set active publication
    active      Show active publication
    archive     Archive a completed publication
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# State file location (same directory as script's parent)
SCRIPT_DIR = Path(__file__).parent.parent
STATE_FILE = SCRIPT_DIR / "state.json"

# Publication types
TYPES = ["blog_post", "research_note", "paper"]

# Steps by publication type
BLOG_POST_STEPS = [
    {"id": "0.setup", "name": "Set up checklist", "required": False},
    {"id": "0.type", "name": "Decide publication type", "required": True},
    {"id": "review.max", "name": "Send to Max for review & signoff", "required": False},
    {"id": "review.revise", "name": "Revise based on comments", "required": False},
    {"id": "prep.spellcheck", "name": "Run spellcheck", "required": False},
    {"id": "prep.social", "name": "Draft social media thread (optional)", "required": False},
    {"id": "prep.lw_forum", "name": "Decide LW/Forum version (optional)", "required": False},
    {"id": "prep.diagrams", "name": "Finalise diagrams", "required": False},
    {"id": "prep.access", "name": "Check platform accesses", "required": True},
    {"id": "prep.preview_image", "name": "Choose preview image", "required": True},
    {"id": "upload.substack", "name": "Upload to Substack", "required": True},
    {"id": "upload.lw_forum", "name": "Upload to LW/Forum (if doing)", "required": False},
    {"id": "post.substack", "name": "Post on Substack", "required": True},
    {"id": "post.forum", "name": "Post on EA Forum (if doing)", "required": False},
    {"id": "post.lw", "name": "Post on LessWrong (if doing)", "required": False},
    {"id": "post.social", "name": "Share on social media (optional)", "required": False},
    {"id": "post.slack", "name": "Share in Slack channels (optional)", "required": False},
]

PAPER_STEPS = [
    {"id": "0.setup", "name": "Set up checklist", "required": False},
    {"id": "0.type", "name": "Decide publication type", "required": True},
    {"id": "0.deadline", "name": "Consider deadline", "required": False},
    # Decisions
    {"id": "decisions.podcast", "name": "Decide on podcast", "required": False},
    {"id": "decisions.lw_forum", "name": "Decide LW/Forum publication", "required": True},
    {"id": "decisions.content", "name": "Decide Forum/Substack content strategy", "required": True},
    {"id": "decisions.titles", "name": "Decide Forum/Substack titles", "required": True},
    {"id": "decisions.links", "name": "Decide link strategy", "required": True},
    {"id": "decisions.arxiv", "name": "Decide on arXiv (optional)", "required": False},
    # Stage 1a: Review
    {"id": "1a.max_review", "name": "Send to Max for initial review", "required": False},
    {"id": "1a.collaborators", "name": "Share with #research-collaborators", "required": False},
    {"id": "1a.external", "name": "Consider external expert review (optional)", "required": False},
    {"id": "1a.justis_early", "name": "Send to Justis for early feedback (optional)", "required": False},
    {"id": "1a.fact_check", "name": "Send for fact-checking (optional)", "required": False},
    {"id": "1a.finalise", "name": "Finalise draft after input", "required": True},
    # Stage 1b: Publication prep
    {"id": "1b.forum_draft", "name": "Draft Forum/LW/Substack posts (if custom)", "required": False},
    {"id": "1b.forum_review", "name": "Have Forum draft reviewed", "required": False},
    {"id": "1b.social_draft", "name": "Draft social media thread", "required": False},
    {"id": "1b.social_review", "name": "Have social thread reviewed", "required": False},
    {"id": "1b.acknowledgments", "name": "Check contributor acknowledgments", "required": False},
    {"id": "1b.diagrams", "name": "Finalise diagrams in Forethought style", "required": True},
    {"id": "1b.abstract", "name": "Draft abstract (~80 words)", "required": True},
    {"id": "1b.abstract_review", "name": "Have abstract reviewed", "required": False},
    {"id": "1b.access", "name": "Check platform accesses", "required": True},
    # Stage 2: Final checks
    {"id": "2a.max_signoff", "name": "Get Max final signoff", "required": True},
    {"id": "2a.will_tom_signoff", "name": "Get Will/Tom signoff (Papers only)", "required": False},
    {"id": "2b.spellcheck", "name": "Run spellcheck", "required": True},
    {"id": "2b.justis_proofread", "name": "Send to Justis for proofread", "required": False},
    {"id": "2b.adversarial", "name": "Check adversarial quoting with LLM", "required": False},
    # Stage 2c: Pass to contractors
    {"id": "2c.lorie_website", "name": "Send to Lorie for website upload", "required": True},
    {"id": "2c.lorie_platforms", "name": "Send to Lorie for Substack/Forum/LW upload", "required": True},
    {"id": "2c.arxiv", "name": "Notify Amrit about arXiv (if doing)", "required": False},
    # Stage 3: Publication day
    {"id": "3.website", "name": "Publish on website (Contentful)", "required": True},
    {"id": "3.podcast", "name": "Publish podcast (if doing)", "required": False},
    {"id": "3.substack", "name": "Post on Substack", "required": True},
    {"id": "3.forum", "name": "Post on EA Forum", "required": False},
    {"id": "3.lw", "name": "Post on LessWrong", "required": False},
    {"id": "3.contentful_links", "name": "Add Forum/LW links to Contentful", "required": False},
    {"id": "3.social", "name": "Post social media threads", "required": True},
    {"id": "3.slack", "name": "Share in Slack channels", "required": False},
]


def load_state():
    """Load state from JSON file."""
    if not STATE_FILE.exists():
        return {"publications": {}, "active": None}
    with open(STATE_FILE) as f:
        return json.load(f)


def save_state(state):
    """Save state to JSON file."""
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def generate_id(state):
    """Generate a new publication ID."""
    existing = state.get("publications", {})
    num = len(existing) + 1
    while f"pub-{num:03d}" in existing:
        num += 1
    return f"pub-{num:03d}"


def get_steps_for_type(pub_type):
    """Get the step list for a publication type."""
    if pub_type == "blog_post":
        return BLOG_POST_STEPS
    return PAPER_STEPS  # paper and research_note use same steps


def cmd_new(args):
    """Create a new publication."""
    state = load_state()

    pub_id = generate_id(state)
    pub_type = args.type.lower().replace(" ", "_").replace("-", "_")

    if pub_type not in TYPES:
        print(f"Error: Invalid type '{args.type}'. Must be one of: {', '.join(TYPES)}")
        sys.exit(1)

    publication = {
        "title": args.title,
        "type": pub_type,
        "doc_url": args.doc or "",
        "created": datetime.now().isoformat(),
        "stage": "0",
        "completed": [],
        "skipped": [],
        "decisions": {},
        "generated": {},
    }

    state["publications"][pub_id] = publication
    state["active"] = pub_id
    save_state(state)

    print(f"Created publication: {pub_id}")
    print(f"  Title: {args.title}")
    print(f"  Type: {pub_type}")
    print(f"  Doc: {args.doc or '(none)'}")
    print(f"\nThis is now the active publication.")


def cmd_list(args):
    """List all publications."""
    state = load_state()
    pubs = state.get("publications", {})
    active = state.get("active")

    if not pubs:
        print("No publications found.")
        return

    for pub_id, pub in pubs.items():
        marker = " *" if pub_id == active else ""
        completed = len(pub.get("completed", []))
        steps = get_steps_for_type(pub["type"])
        total = len(steps)
        print(f"{pub_id}{marker}: {pub['title']} ({pub['type']}) - {completed}/{total} steps")


def cmd_status(args):
    """Show status of a publication."""
    state = load_state()

    pub_id = args.id or state.get("active")
    if not pub_id:
        print("No active publication. Use --id or set one with 'resume'.")
        sys.exit(1)

    pub = state.get("publications", {}).get(pub_id)
    if not pub:
        print(f"Publication '{pub_id}' not found.")
        sys.exit(1)

    steps = get_steps_for_type(pub["type"])
    completed = set(pub.get("completed", []))
    skipped = set(pub.get("skipped", []))

    print(f"Publication: {pub_id}")
    print(f"Title: {pub['title']}")
    print(f"Type: {pub['type']}")
    print(f"Doc: {pub.get('doc_url', '(none)')}")
    print(f"Created: {pub['created']}")
    print()

    # Group steps by stage
    current_stage = None
    found_current = False

    for step in steps:
        # Determine stage from step ID
        stage = step["id"].split(".")[0]
        if stage != current_stage:
            current_stage = stage
            stage_names = {
                "0": "Stage 0: Getting started",
                "decisions": "Decisions",
                "review": "Review & signoff (Blog)",
                "prep": "Publication prep (Blog)",
                "upload": "Uploading (Blog)",
                "post": "Posting (Blog)",
                "1a": "Stage 1a: Getting review/input",
                "1b": "Stage 1b: Publication prep",
                "2a": "Stage 2a: Final signoff",
                "2b": "Stage 2b: Proofread/spellcheck",
                "2c": "Stage 2c: Pass on for uploading",
                "3": "Stage 3: Publication day",
            }
            print(f"\n{stage_names.get(stage, stage)}")

        step_id = step["id"]
        if step_id in completed:
            marker = "✓"
        elif step_id in skipped:
            marker = "–"
        elif not found_current:
            marker = "→"
            found_current = True
        else:
            marker = "○"

        req = "" if step["required"] else " (optional)"
        print(f"  {marker} {step['name']}{req}")

    # Show decisions
    decisions = pub.get("decisions", {})
    if decisions:
        print("\nDecisions made:")
        for key, value in decisions.items():
            print(f"  {key}: {value}")

    # Show generated content
    generated = pub.get("generated", {})
    if generated:
        print("\nGenerated content saved:")
        for key in generated:
            print(f"  {key}")


def cmd_complete(args):
    """Mark a step as completed."""
    state = load_state()
    pub_id = state.get("active")

    if not pub_id:
        print("No active publication. Set one with 'resume'.")
        sys.exit(1)

    pub = state["publications"][pub_id]
    step_id = args.step

    # Validate step exists
    steps = get_steps_for_type(pub["type"])
    valid_ids = [s["id"] for s in steps]
    if step_id not in valid_ids:
        print(f"Unknown step: {step_id}")
        print(f"Valid steps: {', '.join(valid_ids)}")
        sys.exit(1)

    if step_id not in pub["completed"]:
        pub["completed"].append(step_id)
        # Remove from skipped if it was there
        if step_id in pub.get("skipped", []):
            pub["skipped"].remove(step_id)
        save_state(state)
        print(f"Marked as completed: {step_id}")
    else:
        print(f"Already completed: {step_id}")


def cmd_skip(args):
    """Skip a step."""
    state = load_state()
    pub_id = state.get("active")

    if not pub_id:
        print("No active publication. Set one with 'resume'.")
        sys.exit(1)

    pub = state["publications"][pub_id]
    step_id = args.step

    # Validate step exists
    steps = get_steps_for_type(pub["type"])
    valid_ids = [s["id"] for s in steps]
    if step_id not in valid_ids:
        print(f"Unknown step: {step_id}")
        sys.exit(1)

    if "skipped" not in pub:
        pub["skipped"] = []

    if step_id not in pub["skipped"]:
        pub["skipped"].append(step_id)
        save_state(state)
        print(f"Skipped: {step_id}")
    else:
        print(f"Already skipped: {step_id}")


def cmd_decision(args):
    """Record a decision."""
    state = load_state()
    pub_id = state.get("active")

    if not pub_id:
        print("No active publication. Set one with 'resume'.")
        sys.exit(1)

    pub = state["publications"][pub_id]
    pub["decisions"][args.key] = args.value
    save_state(state)
    print(f"Recorded decision: {args.key} = {args.value}")


def cmd_save(args):
    """Save generated content."""
    state = load_state()
    pub_id = state.get("active")

    if not pub_id:
        print("No active publication. Set one with 'resume'.")
        sys.exit(1)

    pub = state["publications"][pub_id]

    # Read content from stdin if not provided
    content = args.content
    if content == "-":
        content = sys.stdin.read()

    pub["generated"][args.type] = content
    save_state(state)
    print(f"Saved generated content: {args.type} ({len(content)} chars)")


def cmd_resume(args):
    """Set active publication."""
    state = load_state()

    if args.id not in state.get("publications", {}):
        print(f"Publication '{args.id}' not found.")
        sys.exit(1)

    state["active"] = args.id
    save_state(state)
    pub = state["publications"][args.id]
    print(f"Active publication set to: {args.id}")
    print(f"  Title: {pub['title']}")


def cmd_active(args):
    """Show active publication."""
    state = load_state()
    active = state.get("active")

    if not active:
        print("No active publication.")
        return

    pub = state["publications"].get(active)
    if pub:
        print(f"{active}: {pub['title']} ({pub['type']})")
    else:
        print(f"Active publication '{active}' not found in state.")


def cmd_archive(args):
    """Archive a completed publication."""
    state = load_state()
    pub_id = args.id or state.get("active")

    if not pub_id:
        print("No publication specified and no active publication.")
        sys.exit(1)

    pub = state.get("publications", {}).get(pub_id)
    if not pub:
        print(f"Publication '{pub_id}' not found.")
        sys.exit(1)

    pub["archived"] = datetime.now().isoformat()

    # Clear active if this was the active publication
    if state.get("active") == pub_id:
        state["active"] = None

    save_state(state)
    print(f"Archived: {pub_id}")


def main():
    parser = argparse.ArgumentParser(description="Publication workflow manager")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # new
    p_new = subparsers.add_parser("new", help="Create a new publication")
    p_new.add_argument("--title", "-t", required=True, help="Publication title")
    p_new.add_argument("--type", "-T", required=True, help="Type: blog_post, research_note, paper")
    p_new.add_argument("--doc", "-d", help="Google Doc URL")

    # list
    subparsers.add_parser("list", help="List all publications")

    # status
    p_status = subparsers.add_parser("status", help="Show publication status")
    p_status.add_argument("--id", "-i", help="Publication ID (default: active)")

    # complete
    p_complete = subparsers.add_parser("complete", help="Mark step as completed")
    p_complete.add_argument("--step", "-s", required=True, help="Step ID")

    # skip
    p_skip = subparsers.add_parser("skip", help="Skip a step")
    p_skip.add_argument("--step", "-s", required=True, help="Step ID")

    # decision
    p_decision = subparsers.add_parser("decision", help="Record a decision")
    p_decision.add_argument("--key", "-k", required=True, help="Decision key")
    p_decision.add_argument("--value", "-v", required=True, help="Decision value")

    # save
    p_save = subparsers.add_parser("save", help="Save generated content")
    p_save.add_argument("--type", "-t", required=True, help="Content type (abstract, social_thread, etc.)")
    p_save.add_argument("--content", "-c", default="-", help="Content (use - for stdin)")

    # resume
    p_resume = subparsers.add_parser("resume", help="Set active publication")
    p_resume.add_argument("--id", "-i", required=True, help="Publication ID")

    # active
    subparsers.add_parser("active", help="Show active publication")

    # archive
    p_archive = subparsers.add_parser("archive", help="Archive a publication")
    p_archive.add_argument("--id", "-i", help="Publication ID (default: active)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    commands = {
        "new": cmd_new,
        "list": cmd_list,
        "status": cmd_status,
        "complete": cmd_complete,
        "skip": cmd_skip,
        "decision": cmd_decision,
        "save": cmd_save,
        "resume": cmd_resume,
        "active": cmd_active,
        "archive": cmd_archive,
    }

    commands[args.command](args)


if __name__ == "__main__":
    main()
