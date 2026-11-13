"""Inspect the certificate downloaded by the browser test, without printing its contents."""
import argparse
from pypdf import PdfReader

parser = argparse.ArgumentParser()
parser.add_argument('path')
args = parser.parse_args()
reader = PdfReader(args.path)
text = ' '.join(' '.join(page.extract_text() for page in reader.pages).split())
assert 'ДЕМОНСТРАЦИОННЫЙ ОБРАЗЕЦ' in text
assert 'Алина Ветрова' in text
assert 'Не имеет юридической силы' in text
assert len(reader.pages) == 1
print('PASS: browser-downloaded PDF, Cyrillic, owner, demo notice, one page.')
