from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

FONT_PATH = Path(__file__).parent / 'assets' / 'DejaVuSans.ttf'
pdfmetrics.registerFont(TTFont('DejaVu', str(FONT_PATH)))


def certificate(req, faculty, group):
    stream = BytesIO()
    doc = SimpleDocTemplate(stream, title=f'Демонстрационная справка {req.number}',
        author='Университет Северного кампуса', leftMargin=56, rightMargin=56)
    body = ParagraphStyle('body', fontName='DejaVu', fontSize=11, leading=19)
    heading = ParagraphStyle('heading', parent=body, alignment=TA_CENTER, fontSize=19, leading=26)
    mark = ParagraphStyle('mark', parent=body, textColor=colors.HexColor('#1d4ed8'), alignment=TA_CENTER)
    paragraphs = [
        Paragraph('ДЕМОНСТРАЦИОННЫЙ ОБРАЗЕЦ', mark), Spacer(1, 36),
        Paragraph('Университет Северного кампуса', heading), Spacer(1, 30),
        Paragraph('СПРАВКА ОБ ОБУЧЕНИИ', heading), Spacer(1, 16),
        Paragraph(f'№ {escape(req.number)}', mark), Spacer(1, 28),
        Paragraph(f'Выдана: {escape(req.student.full_name)}.', body), Spacer(1, 12),
        Paragraph(f'Подтверждаем обучение на {req.student.course} курсе. '
            f'Факультет: {escape(faculty.name)}. Направление: {escape(req.student.direction)}. '
            f'Группа: {escape(group.name)}.', body), Spacer(1, 12),
        Paragraph(f'Место предъявления: {escape(req.purpose)}.', body), Spacer(1, 30),
        Paragraph('Документ создан конкурсным прототипом. Все сведения вымышлены. '
            'Не имеет юридической силы. Подпись и печать не предусмотрены.', body),
    ]
    doc.build(paragraphs)
    return stream.getvalue()
