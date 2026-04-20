# Copilot Instructions for PYPDF_PROJECT

## Project reality (current state)
- This repository is currently a minimal scaffold with a single file: [main.py](../main.py).
- [main.py](../main.py) is empty right now, so there is no established runtime flow, architecture, or module boundary yet.
- There are no discovered docs/rules files (README, AGENTS, CLAUDE, Cursor/Windsurf/Cline rules) in this workspace.

## How to contribute in this codebase
- Treat this as a single-script Python project unless new folders/modules are introduced.
- Keep early changes centralized in [main.py](../main.py) until clear subdomains emerge.
- When logic grows, extract focused modules (for example `io_*.py`, `pdf_*.py`, `speech_*.py`) and keep [main.py](../main.py) as the entrypoint/orchestrator.

## Conventions inferred from current workspace
- Python is the implementation language (entrypoint file is [main.py](../main.py)).
- Prefer straightforward, dependency-light code unless a library is already required by implemented features.
- Add brief module/function docstrings when introducing non-trivial behavior, since no README exists yet.

## Build, run, and debug workflow (discovered)
- No build/test tooling is currently configured (no `requirements.txt`, `pyproject.toml`, or test directory found).
- Use direct script execution during early development (`python main.py`) once code is added.
- If dependencies are introduced, create a pinned dependency file and add install instructions in the repository root documentation when it exists.

## Agent instructions for future edits
- Before major refactors, re-scan the repo structure: project conventions are expected to evolve quickly from this baseline.
- Do not assume frameworks, CI, or packaging until corresponding files are added.
- Prefer small, explicit changes and avoid creating heavy architecture preemptively.
- If you add new top-level workflows (tests, lint, CLI args, config), document them here immediately.

## Files that currently define project behavior
- Entrypoint: [main.py](../main.py)
- Agent guidance: [copilot-instructions.md](copilot-instructions.md)
