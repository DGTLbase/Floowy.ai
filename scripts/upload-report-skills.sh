#!/usr/bin/env bash
# Upload a new VERSION of the two report Agent Skills to the Claude Skills API.
#
# Why this makes the new skills live with no code change: the edge function
# requests the skill with `version: "latest"` (see supabase/functions/
# generate-report/index.ts), so publishing a new version to the SAME skill_id is
# picked up on the next report run. Do NOT create new skills — that would mint
# new ids and the function would still point at the old ones.
#
# Usage:
#   # 1. Find the two skill ids (match them against the Supabase secrets):
#   export ANTHROPIC_API_KEY=sk-ant-...
#   ./scripts/upload-report-skills.sh --list
#
#   # 2. Upload:
#   export CLAUDE_SKILL_ID_INSIGHTS=skill_...      # same values as the Supabase
#   export CLAUDE_SKILL_ID_CONTENTPLAN=skill_...   # edge-function secrets
#   ./scripts/upload-report-skills.sh ~/Downloads/inzichtenrapport-dgtlbase-v2.skill \
#                                     ~/Downloads/contentplan-briefing-dgtlbase-v2.skill
#
# A .skill file is a zip whose single top-level directory is the skill folder.
# Each uploaded part must carry its path RELATIVE TO (and including) that folder
# — the API derives the skill's `directory` from it.

set -euo pipefail

API="https://api.anthropic.com/v1/skills"
BETA="skills-2025-10-02"
VERSION="2023-06-01"

: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}"

# --list: print your custom skills so you can copy the two ids. Cross-check them
# against the Supabase edge-function secrets before uploading — publishing a
# version to the wrong skill silently leaves the live report on the old one.
if [[ "${1:-}" == "--list" ]]; then
  curl --fail-with-body -sS "$API?source=custom" \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: $VERSION" \
    -H "anthropic-beta: $BETA"
  echo
  exit 0
fi

upload_one() {
  local skill_id="$1" archive="$2" tmp
  [[ -f "$archive" ]] || { echo "!! archive not found: $archive" >&2; return 1; }

  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN
  unzip -q -o "$archive" -d "$tmp"

  # The single top-level directory inside the archive is the skill folder.
  # __MACOSX is the resource-fork junk a Finder-made zip adds; it would otherwise
  # be picked as the directory and upload a skill with no SKILL.md.
  local dir
  dir="$(cd "$tmp" && find . -mindepth 1 -maxdepth 1 -type d \
           -not -name '__MACOSX' | head -1 | sed 's|^\./||')"
  [[ -n "$dir" ]] || { echo "!! no skill directory inside $archive" >&2; return 1; }

  echo "→ $dir  →  $skill_id"

  # Build one -F part per file, named `files[]` — the API rejects a bare `files`
  # with "files[]: Field required", despite the docs example showing `files`.
  # The part filename carries the path within the skill folder; the API derives
  # the skill's `directory` from it. __pycache__ is build junk from the author's
  # machine and must not ship (a stale .pyc can also shadow template.py).
  local -a args=()
  while IFS= read -r rel; do
    args+=(-F "files[]=@$tmp/$rel;filename=$rel")
    echo "   + $rel"
  done < <(cd "$tmp" && find "$dir" -type f \
             -not -path '*/__pycache__/*' -not -name '*.pyc' -not -name '.DS_Store' | sort)

  [[ ${#args[@]} -gt 0 ]] || { echo "!! no files to upload" >&2; return 1; }

  curl --fail-with-body -sS "$API/$skill_id/versions" \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: $VERSION" \
    -H "anthropic-beta: $BETA" \
    "${args[@]}"
  echo
}

INSIGHTS_ARCHIVE="${1:?pass the inzichtenrapport .skill file as arg 1}"
CONTENTPLAN_ARCHIVE="${2:?pass the contentplan .skill file as arg 2}"

upload_one "${CLAUDE_SKILL_ID_INSIGHTS:?set CLAUDE_SKILL_ID_INSIGHTS}" "$INSIGHTS_ARCHIVE"
upload_one "${CLAUDE_SKILL_ID_CONTENTPLAN:?set CLAUDE_SKILL_ID_CONTENTPLAN}" "$CONTENTPLAN_ARCHIVE"

echo "Done. Confirm the new versions are the latest:"
echo "  curl -sS '$API/\$CLAUDE_SKILL_ID_INSIGHTS/versions' -H \"x-api-key: \$ANTHROPIC_API_KEY\" -H 'anthropic-version: $VERSION' -H 'anthropic-beta: $BETA'"
