"""Plans and corridor graph for the fictional North Campus building."""
from collections import deque

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from .models import CampusRoom, Teacher

NORTH = 'Северный корпус'
DOORS = {'210': (2, 166, 184), '305': (3, 352, 184), '412': (4, 598, 184)}
LOCATIONS = {(NORTH, number): (floor, f'door-{number}') for number, (floor, _, _) in DOORS.items()}
LOCATIONS.update({(NORTH, '118'): (1, None), ('Технологический корпус', '602'): (6, None),
                  ('Технологический корпус', '504'): (5, None), ('Технологический корпус', '310'): (3, None)})
LIFT_X, LIFT_Y = 496, 184
HALL_Y = 222
ENTRANCE = (1, 340, 336)


def room_for(db, building, number):
    floor, map_node = LOCATIONS.get((building, number), (None, None))
    db.execute(insert(CampusRoom).values(building=building, number=number, floor=floor, map_node=map_node)
               .on_conflict_do_nothing(constraint='campus_room_place'))
    return db.scalar(select(CampusRoom).where(CampusRoom.building == building, CampusRoom.number == number))


def teacher_for(db, name):
    teacher = db.scalars(select(Teacher).where(Teacher.name == name).order_by(Teacher.id)).first()
    if teacher is None:
        teacher = Teacher(name=name)
        db.add(teacher)
        db.flush()
    return teacher


def seed_maps(db):
    for (building, number), (floor, node) in LOCATIONS.items():
        room = room_for(db, building, number)
        room.floor, room.map_node = floor, node


def _room(x, y, width, height, label, kind='room'):
    return dict(x=x, y=y, width=width, height=height, label=label, kind=kind)


def floor_plan(floor):
    if floor == 1:
        spaces = [
            _room(40, 44, 188, 140, 'Атриум', 'atrium'),
            _room(228, 44, 217, 140, 'Учебный отдел'),
            _room(445, 44, 102, 140, 'Лифт', 'lift'),
            _room(547, 44, 93, 140, 'Лестница', 'stairs'),
            _room(40, 250, 256, 76, 'Гардероб'),
            _room(384, 250, 256, 76, 'Стойка кампуса'),
        ]
    else:
        labels = {2: ['210', '212', '214'], 3: ['303', '305', '308'], 4: ['406', '408', '412']}[floor]
        spaces = [
            _room(40, 44, 228, 140, labels[0]),
            _room(268, 44, 177, 140, labels[1]),
            _room(445, 44, 102, 140, 'Лифт', 'lift'),
            _room(547, 44, 93, 140, labels[2]),
            _room(40, 250, 369, 76, 'Галерея', 'atrium'),
            _room(409, 250, 124, 76, 'Лестница', 'stairs'),
            _room(533, 250, 107, 76, 'Холл'),
        ]
    return dict(width=680, height=368, spaces=spaces)


def route_segments(room):
    """Find a connected path from the entrance to the room's mapped door."""
    nodes = {'entry': ENTRANCE, 'lobby': (1, ENTRANCE[1], HALL_Y)}
    edges = [('entry', 'lobby'), ('lobby', 'hall-1')]
    for floor in range(1, 5):
        nodes[f'hall-{floor}'] = (floor, LIFT_X, HALL_Y)
        nodes[f'lift-{floor}'] = (floor, LIFT_X, LIFT_Y)
        edges.append((f'hall-{floor}', f'lift-{floor}'))
        if floor != 1:
            edges.append(('lift-1', f'lift-{floor}'))
    for number, (floor, x, y) in DOORS.items():
        nodes[f'junction-{number}'] = (floor, x, HALL_Y)
        nodes[f'door-{number}'] = (floor, x, y)
        edges.extend([(f'hall-{floor}', f'junction-{number}'), (f'junction-{number}', f'door-{number}')])
    if room.building != NORTH or room.map_node not in nodes or nodes[room.map_node][0] != room.floor:
        return []

    adjacency = {name: [] for name in nodes}
    for source, target in edges:
        adjacency[source].append(target)
        adjacency[target].append(source)
    queue = deque([('entry',)])
    visited = {'entry'}
    while queue:
        path = queue.popleft()
        if path[-1] == room.map_node:
            break
        for neighbor in adjacency[path[-1]]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((*path, neighbor))
    else:
        return []

    segments = []
    for name in path:
        floor, x, y = nodes[name]
        if not segments or segments[-1]['floor'] != floor:
            segments.append(dict(floor=floor, plan=floor_plan(floor), points=[]))
        segments[-1]['points'].append([x, y])
    segments[0].update(start='Старт · главный вход', end='Лифт',
                       instruction='От главного входа идите до коридора, затем направо к лифту.')
    segments[-1].update(start='Лифт', end=f'Аудитория {room.number}',
                        instruction=f'От лифта пройдите по коридору до аудитории {room.number}.')
    return segments
