"""Build and verify a deterministic source handoff from a clean Git HEAD.

Only committed files are included. Environment, generated data and Git history
are never copied. Uses Python standard library and the installed Git CLI.
"""
import argparse
import hashlib
from io import BytesIO
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PREFIX = 'dekanat-handoff/'
MANIFEST = PREFIX + 'HANDOFF-MANIFEST.json'
FORBIDDEN_PARTS = {'.git', '.aws', '.codex', '.agents', '.venv', 'node_modules',
                   '__pycache__', '.pytest_cache', 'artifacts', 'templates', 'prompts', '.local', '.tools'}


def allowed(name):
    path = PurePosixPath(name)
    return (not path.is_absolute() and '..' not in path.parts and '\\' not in name
            and not any(part in FORBIDDEN_PARTS for part in path.parts)
            and not any(part.startswith('.env') and part != '.env.example' for part in path.parts)
            and path.name != 'README.md' and not name.startswith('docs/06-research')
            and path.suffix.lower() not in {'.pem', '.key', '.db', '.dump', '.sql', '.pyc'})


def git(*args, root=ROOT):
    return subprocess.check_output(['git', '-C', str(root), *args], stderr=subprocess.PIPE)


def known_secrets(root=ROOT):
    values = dict(os.environ)
    env_file = root / '.env'
    if env_file.is_file():
        for line in env_file.read_text(encoding='utf-8-sig').splitlines():
            key, sep, value = line.partition('=')
            if sep and not key.lstrip().startswith('#'):
                values[key.strip()] = value.strip().strip('\"\'')
    return [value.encode() for key, value in values.items()
            if any(term in key.upper() for term in ('PASSWORD', 'SECRET', 'TOKEN')) and len(value) >= 12]


def ensure_no_secrets(name, data, secrets):
    if any(secret in data for secret in secrets):
        raise ValueError(f'Environment secret detected in {name}; archive was not approved.')


def write_member(archive, name, data):
    info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    info.create_system = 3
    info.external_attr = 0o100644 << 16
    archive.writestr(info, data)


def verify(path, secrets=()):
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)) or MANIFEST not in names:
            raise ValueError('Missing manifest or duplicate ZIP members.')
        manifest = json.loads(archive.read(MANIFEST))
        expected = {PREFIX + name for name in manifest['files']} | {MANIFEST}
        if set(names) != expected:
            raise ValueError('ZIP contents differ from the manifest.')
        for name in names:
            relative = name.removeprefix(PREFIX)
            if not name.startswith(PREFIX) or not allowed(relative):
                raise ValueError('Forbidden path in handoff archive.')
            data = archive.read(name)
            ensure_no_secrets(relative, data, secrets)
            if name != MANIFEST and manifest['files'][relative] != {
                    'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}:
                raise ValueError(f'Checksum mismatch: {relative}')
    return manifest


def build(root=ROOT):
    if git('status', '--porcelain', '--untracked-files=no', root=root).strip():
        raise ValueError('Commit tracked changes before preparing a source handoff.')
    commit = git('rev-parse', 'HEAD', root=root).decode().strip()
    source = BytesIO(git('archive', '--format=zip', 'HEAD', root=root))
    secrets = known_secrets(root)
    files, result = {}, BytesIO()
    with zipfile.ZipFile(source) as original, zipfile.ZipFile(result, 'w') as output:
        for name in sorted(original.namelist()):
            member = original.getinfo(name)
            if member.is_dir():
                continue
            if not allowed(name) or (member.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError(f'Forbidden committed file: {name}')
            data = original.read(name)
            ensure_no_secrets(name, data, secrets)
            files[name] = {'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
            write_member(output, PREFIX + name, data)
        manifest = {'format': 1, 'source_commit': commit, 'files': files,
                    'entrypoint': 'RUNNING.md', 'credentials': 'Supply via environment separately.'}
        write_member(output, MANIFEST, (json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + '\n').encode())
    verify(BytesIO(result.getvalue()), secrets)
    return commit, result.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify', type=Path, help='Verify an existing archive instead of building')
    args = parser.parse_args()
    try:
        if args.verify:
            manifest = verify(args.verify, known_secrets())
            print(f"PASS: {len(manifest['files'])} files verified; source {manifest['source_commit'][:12]}")
            return
        commit, content = build()
        folder = ROOT / 'artifacts/handoff'
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / f'dekanat-source-{commit[:12]}.zip'
        path.write_bytes(content)
        digest = hashlib.sha256(content).hexdigest()
        path.with_suffix('.zip.sha256').write_text(f'{digest}  {path.name}\n', encoding='ascii')
        print(f'PASS: verified source archive: {path}\nSHA256: {digest}')
    except (ValueError, OSError, subprocess.CalledProcessError, zipfile.BadZipFile, KeyError) as error:
        label = str(error) if isinstance(error, ValueError) else type(error).__name__
        raise SystemExit(f'FAIL: {label}') from None


if __name__ == '__main__':
    main()
