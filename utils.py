import typing


def init_grid(dimensions):  # type: (typing.Tuple[int, int]) -> [[None]]
    """
    Creates grid (width, height) dimensions.
    :param dimensions:
    :return:
    """
    width, height = dimensions
    grid = []
    for col_num in range(width):
        row = [None for row_num in range(height)]
        grid.append(row)
    return grid
