#!/usr/bin/env python3
"""
Automatic version bumping script for chrome-github-icons.
Bumps version in package.json based on commit message prefix.

Usage:
    python3 scripts/bump_version.py <commit_message> [base_version]

Commit message prefixes:
    release(...): ...   -> Bumps major version (X.0.0)
    feature(...): ...   -> Bumps minor version (0.X.0)
    fix(...): ...       -> Bumps patch version (0.0.X)
    anything else       -> No version bump
"""

import sys
import re
import json
from pathlib import Path

def parse_version(version_str):
    """Parse version string into (major, minor, patch) tuple."""
    match = re.match(r'(\d+)\.(\d+)\.(\d+)', version_str)
    if match:
        return tuple(map(int, match.groups()))
    raise ValueError(f"Invalid version format: {version_str}")

def bump_version(version_str, bump_type):
    """Bump version based on type: 'major', 'minor', or 'patch'."""
    major, minor, patch = parse_version(version_str)

    if bump_type == 'major':
        return f"{major + 1}.0.0"
    elif bump_type == 'minor':
        return f"{major}.{minor + 1}.0"
    elif bump_type == 'patch':
        return f"{major}.{minor}.{patch + 1}"
    else:
        return version_str

def get_bump_type_from_commit(commit_msg):
    """Determine bump type from commit message."""
    commit_msg = commit_msg.strip().lower()

    if commit_msg.startswith('release('):
        return 'major'
    elif commit_msg.startswith('feature('):
        return 'minor'
    elif commit_msg.startswith('fix('):
        return 'patch'
    else:
        return None

def update_package_json(file_path, new_version):
    """Update version in package.json."""
    with open(file_path, 'r') as f:
        content = f.read()

    with open(file_path, 'r') as f:
        config = json.load(f)

    old_version = config.get('version')
    config['version'] = new_version

    with open(file_path, 'w') as f:
        json.dump(config, f, indent=2)
        f.write('\n')

    return old_version != new_version

def main():
    if len(sys.argv) < 2:
        print("Usage: bump_version.py <commit_message> [base_version]", file=sys.stderr)
        sys.exit(1)

    commit_msg = sys.argv[1]
    base_version = sys.argv[2] if len(sys.argv) > 2 else None

    bump_type = get_bump_type_from_commit(commit_msg)

    if not bump_type:
        sys.exit(0)

    root_dir = Path(__file__).parent.parent
    package_json = root_dir / 'package.json'

    with open(package_json, 'r') as f:
        config = json.load(f)
    current_version = config['version']

    version_to_bump = base_version if base_version else current_version

    new_version = bump_version(version_to_bump, bump_type)

    if new_version == current_version:
        print(f"No version change: {current_version}")
        sys.exit(0)

    updated = update_package_json(package_json, new_version)

    if updated:
        print(f"Version bumped: {version_to_bump} -> {new_version} ({bump_type})")
        print(f"Updated: package.json")
        sys.exit(0)
    else:
        print(f"No changes made for version: {current_version}")
        sys.exit(0)

if __name__ == '__main__':
    main()
