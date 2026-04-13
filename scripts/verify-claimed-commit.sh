#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <sha> [expected-subject-fragment]" >&2
  exit 1
fi

sha="$1"
expected="${2:-}"

git cat-file -e "${sha}^{commit}" 2>/dev/null
subject="$(git log --format=%s -1 "$sha")"

echo "sha=$sha"
echo "subject=$subject"

if [ -n "$expected" ] && [[ "$subject" != *"$expected"* ]]; then
  echo "expected subject fragment not found: $expected" >&2
  exit 1
fi
