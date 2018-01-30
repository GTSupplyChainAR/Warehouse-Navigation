import typing


def init_grid(dimensions):  # type: (typing.Tuple[int, int]) -> [[None]]
    grid = []
    for _ in range(dimensions[0]):
        row = [None for _ in range(dimensions[1])]
        grid.append(row)
    return grid
