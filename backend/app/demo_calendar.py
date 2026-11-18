from datetime import date, timedelta


TERM_START = date(2026, 11, 1)
TERM_END = date(2026, 12, 20)
DEFAULT_DEMO_DATE = date(2026, 11, 13)


def demo_week(reference):
    monday = reference - timedelta(days=reference.weekday())
    if reference == TERM_START:
        return TERM_START + timedelta(days=1)
    return monday
