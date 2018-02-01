import typing


def init_grid(dimensions):  # type: (typing.Tuple[int, int]) -> [[None]]
    """
    Creates grid in (width, height) dimensions.
    """
    width, height = dimensions
    grid = []
    for col_num in range(width):
        row = [None for row_num in range(height)]
        grid.append(row)
    return grid


def manhattan_distance(first, second):  # type: (typing.Tuple[int, int], typing.Tuple[int, int]) -> int
    first_x, first_y = first
    second_x, second_y = second
    return abs(first_x - second_x) + abs(first_y - second_y)
