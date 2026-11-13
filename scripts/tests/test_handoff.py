"""Exercise packaging boundaries using a real disposable Git repository."""
from io import BytesIO
from pathlib import Path
import subprocess
import tempfile
import unittest
import zipfile

from scripts.prepare_handoff import build, verify
from scripts.check_demo import local_url
import argparse


class HandoffTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.command('init', '-q')
        (self.root / 'RUNNING.md').write_text('Local launch instructions\n', encoding='utf-8')
        (self.root / '.env.example').write_text('DEMO_STAFF_PASSWORD=\n', encoding='utf-8')
        self.commit()

    def command(self, *args):
        return subprocess.run(['git', '-C', str(self.root), *args],
                              check=True, capture_output=True)

    def commit(self):
        self.command('add', '--all')
        self.command('-c', 'user.name=Packaging test', '-c', 'user.email=packaging@example.invalid',
                     'commit', '-qm', 'Test fixture')

    def test_untracked_environment_excluded_and_archive_reproducible(self):
        (self.root / '.env').write_text('DEMO_STAFF_PASSWORD=packaging-test-secret-value\n', encoding='utf-8')
        (self.root / 'local-notes.txt').write_text('Untracked local notes', encoding='utf-8')
        first = build(self.root)
        second = build(self.root)
        self.assertEqual(first, second)
        manifest = verify(BytesIO(first[1]))
        self.assertEqual(set(manifest['files']), {'RUNNING.md', '.env.example'})

    def test_dirty_tracked_files_refused(self):
        (self.root / 'RUNNING.md').write_text('Uncommitted change', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Commit tracked changes'):
            build(self.root)

    def test_accidentally_committed_environment_refused(self):
        (self.root / '.env').write_text('DEMO_STAFF_PASSWORD=packaging-test-secret-value\n', encoding='utf-8')
        self.commit()
        with self.assertRaisesRegex(ValueError, 'Forbidden committed file'):
            build(self.root)

    def test_environment_secret_in_an_allowed_file_refused(self):
        (self.root / 'sample.txt').write_text('packaging-test-secret-value', encoding='utf-8')
        self.commit()
        (self.root / '.env').write_text('DEMO_STAFF_PASSWORD=packaging-test-secret-value\n', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Environment secret detected'):
            build(self.root)

    def test_tampered_archive_refused(self):
        _, content = build(self.root)
        tampered = BytesIO()
        with zipfile.ZipFile(BytesIO(content)) as source, zipfile.ZipFile(tampered, 'w') as destination:
            for name in source.namelist():
                data = b'Changed after packaging' if name.endswith('RUNNING.md') else source.read(name)
                destination.writestr(name, data)
        with self.assertRaisesRegex(ValueError, 'Checksum mismatch'):
            verify(BytesIO(tampered.getvalue()))

    def test_readiness_rejects_remote_credential_targets(self):
        self.assertEqual(local_url('http://localhost:8000/'), 'http://localhost:8000')
        for target in ['http://example.invalid', 'https://localhost', 'http://user:pass@localhost',
                       'http://localhost/path', 'http://localhost?token=value']:
            with self.subTest(target=target), self.assertRaises(argparse.ArgumentTypeError):
                local_url(target)


if __name__ == '__main__':
    unittest.main()
