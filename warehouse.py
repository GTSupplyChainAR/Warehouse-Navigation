from models import GridWarehouse, NavigableTileCell, ShelvingCell, Direction
import numpy as np
import utils
import networkx as nx
import json

"""

A simple warehouse layout with 16 cells, 4 shelves, and 12 navigable cells (graph nodes).

Top-left cell is at position (0, 3).
Top-right cell is at position (3, 3).
Bottom-left cell is at position (0, 0).
Bottom-right cell is at position (3, 0).

-----------------
|   |   |   |   |
-----------------
|   | x | x |   |
-----------------
|   | x | x |   |
-----------------
|   |   |   |   |
-----------------

"""


def get_simple_warehouse():
    dimensions = (4, 4)

    grid = utils.init_grid(dimensions)

    grid[0][0] = NavigableTileCell()
    grid[0][1] = NavigableTileCell()
    grid[0][2] = NavigableTileCell()
    grid[0][3] = NavigableTileCell()

    grid[1][0] = NavigableTileCell()
    grid[1][1] = ShelvingCell(Direction.SOUTH)
    grid[1][2] = ShelvingCell(Direction.SOUTH)
    grid[1][3] = NavigableTileCell()

    grid[2][0] = NavigableTileCell()
    grid[2][1] = ShelvingCell(Direction.NORTH)
    grid[2][2] = ShelvingCell(Direction.NORTH)
    grid[2][3] = NavigableTileCell()

    grid[3][0] = NavigableTileCell()
    grid[3][1] = NavigableTileCell()
    grid[3][2] = NavigableTileCell()
    grid[3][3] = NavigableTileCell()

    warehouse = GridWarehouse(dimensions, grid)

    return warehouse


def get_larger_warehouse():
    dimensions = (4, 8)

    grid = utils.init_grid(dimensions)

    grid[0][0] = NavigableTileCell()
    grid[0][1] = NavigableTileCell()
    grid[0][2] = NavigableTileCell()
    grid[0][3] = NavigableTileCell()
    grid[0][4] = NavigableTileCell()
    grid[0][5] = NavigableTileCell()
    grid[0][6] = NavigableTileCell()
    grid[0][7] = NavigableTileCell()

    grid[1][0] = NavigableTileCell()
    grid[1][1] = ShelvingCell(Direction.SOUTH)
    grid[1][2] = ShelvingCell(Direction.SOUTH)
    grid[1][3] = ShelvingCell(Direction.SOUTH)
    grid[1][4] = ShelvingCell(Direction.SOUTH)
    grid[1][5] = ShelvingCell(Direction.SOUTH)
    grid[1][6] = ShelvingCell(Direction.SOUTH)
    grid[1][7] = NavigableTileCell()

    grid[2][0] = NavigableTileCell()
    grid[2][1] = ShelvingCell(Direction.NORTH)
    grid[2][2] = ShelvingCell(Direction.NORTH)
    grid[2][3] = ShelvingCell(Direction.NORTH)
    grid[2][4] = ShelvingCell(Direction.NORTH)
    grid[2][5] = ShelvingCell(Direction.NORTH)
    grid[2][6] = ShelvingCell(Direction.NORTH)
    grid[2][7] = NavigableTileCell()

    grid[3][0] = NavigableTileCell()
    grid[3][1] = NavigableTileCell()
    grid[3][2] = NavigableTileCell()
    grid[3][3] = NavigableTileCell()
    grid[3][4] = NavigableTileCell()
    grid[3][5] = NavigableTileCell()
    grid[3][6] = NavigableTileCell()
    grid[3][7] = NavigableTileCell()

    warehouse = GridWarehouse(dimensions, grid)

    return warehouse
