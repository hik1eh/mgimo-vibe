from dataclasses import dataclass
from enum import StrEnum


class RequestKind(StrEnum):
    STUDY = 'study'
    PRACTICE = 'practice'
    MILITARY = 'military'
    RETAKE = 'retake'
    LEAVE = 'academic_leave'
    MESSAGE = 'dean_message'


@dataclass(frozen=True)
class RequestType:
    label: str
    prefix: str
    purpose_label: str
    placeholder: str
    delivery: str
    result_text: str
    pdf: bool = True


REQUEST_TYPES = {
    RequestKind.STUDY: RequestType(
        'Справка об обучении', 'СО', 'Место предъявления', 'Например, по месту требования',
        'Электронный PDF', 'Справка готова. Доступен демонстрационный PDF.',
    ),
    RequestKind.PRACTICE: RequestType(
        'Справка для стажировки или практики', 'СП', 'Организация и период',
        'Укажите вымышленную организацию, вид практики и её даты',
        'Электронный PDF', 'Справка для стажировки или практики готова.',
    ),
    RequestKind.MILITARY: RequestType(
        'Справка для военкомата', 'СВ', 'Военкомат или место предъявления',
        'Укажите вымышленное подразделение или напишите «по месту требования»',
        'Электронный PDF', 'Справка для военкомата готова.',
    ),
    RequestKind.RETAKE: RequestType(
        'Направление на пересдачу', 'НП', 'Дисциплина и вид контроля',
        'Например, «История социальных идей, зачёт»',
        'Электронный PDF', 'Направление на пересдачу готово.',
    ),
    RequestKind.LEAVE: RequestType(
        'Академический отпуск', 'АО', 'Период и причина',
        'Укажите вымышленную причину и предполагаемые даты',
        'Решение в карточке заявки', 'Деканат рассмотрел заявление.',
        pdf=False,
    ),
    RequestKind.MESSAGE: RequestType(
        'Обращение в деканат', 'ОД', 'Ваше сообщение',
        'Коротко опишите вопрос деканату',
        'Ответ в карточке заявки', 'Деканат ответил на обращение.',
        pdf=False,
    ),
}
