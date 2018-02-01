// Based on: https://bl.ocks.org/cagrimmett/07f8c8daea00946b9e704e3efcbd5739

// Source: https://stackoverflow.com/a/901144
function getQueryStringParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function handleServerError(error) {
    alert("Failure!");
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }

    return true;
}

function arrayContains(array, element, equalityMethod) {
    for (var i = 0; i < array.length; i++) {
        if (equalityMethod(array[i], element)) {
            return true;
        }
    }
    return false;
}

function initializeGrid(dimensions, defaultData) {
    var width = dimensions[0];
    var height = dimensions[1];
    var grid = [];
    for (var colNum = 0; colNum < width; colNum++) {
        var column = [];
        for (var rowNum = 0; rowNum < height; rowNum++) {
            column.push(defaultData);
        }
        grid.push(column);
    }
    return grid;
}

const GridCellTypeEnum = Object.freeze({
    Navigable: 1,
    Shelving: 2,

    PathIntermediate: 3,
    PathSource: 4,
    PathDestination: 5,

    PathItemToPickUp: 6,
});

function Graph(nodeLinkData) {  // nodeLinkData from Python's networkx.node_link_data
    this.nodes = [];
    this.adjacencyList = {};

    // Add all nodes
    for (var i = 0; i < nodeLinkData.nodes.length; i++) {
        var node = nodeLinkData.nodes[i];
        this.nodes.push(node.id);
    }

    // Add all edges
    for (var i = 0; i < nodeLinkData.links.length; i++) {
        var link = nodeLinkData.links[i];

        if (this.adjacencyList[link.source] === undefined) {
            this.adjacencyList[link.source] = [];
        }

        if (this.adjacencyList[link.target] === undefined) {
            this.adjacencyList[link.target] = [];
        }

        this.adjacencyList[link.source].push(link.target);
        this.adjacencyList[link.target].push(link.source);
    }
}

function GridWarehouse(warehouseId) {
    this.warehouseId = warehouseId;
    this.dimensions = null;
    this.grid = null;
    this.graph = null;

    // The last computed path and items
    this.activeOrderPickingSession = null;

    this.loadWarehouse = function () {
        var _this = this;

        return $.ajax({
            url: '/api/warehouse/' + this.warehouseId + '/',
            method: 'GET',
        }).done(function (data) {
            var graphData = JSON.parse(data);

            // Initialize the grid and graphs
            _this.dimensions = graphData.dimensions;
            _this.grid = initializeGrid(_this.dimensions, GridCellTypeEnum.Shelving);
            _this.graph = new Graph(graphData.graph);

            for (var i = 0; i < _this.graph.nodes.length; i++) {
                var node = _this.graph.nodes[i];
                // Indicate that the cell is navigable
                _this.grid[node[0]][node[1]] = GridCellTypeEnum.Navigable;
            }
        });
    };

    this.findPickPath = function (sourceCell, itemsToPickUp) {
        var _this = this;
        return $.ajax({
            url: '/api/warehouse/' + this.warehouseId + '/find-pick-path/',
            method: 'POST',
            data: JSON.stringify({
                source: sourceCell,
                items: itemsToPickUp,
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
        }).done(function (data) {
            var path = data.path;
            var items = data.items;

            for (var i = 0; i < path.length; i++) {
                var pathCell = path[i];

                var cellType;

                if (i === 0) {
                    cellType = GridCellTypeEnum.PathSource;
                } else if (i === path.length - 1) {
                    cellType = GridCellTypeEnum.PathDestination;
                } else if (arrayContains(items, pathCell, arraysEqual)) {
                    cellType = GridCellTypeEnum.PathItemToPickUp;
                } else {
                    cellType = GridCellTypeEnum.PathIntermediate;
                }

                _this.grid[pathCell[0]][pathCell[1]] = cellType;
            }

            _this.activeOrderPickingSession = {
                path: path,
                items: items,
            }

        }).fail(handleServerError);
    };

    this.render = function () {
        // width, height
        var cellDimensions = [50, 50];

        var gridWidth = cellDimensions[0] * gridWarehouse.dimensions[0];
        var gridHeight = cellDimensions[1] * gridWarehouse.dimensions[1];

        /**
         * Generates a 2D array of the same shape of grid containing all the data needed to render a D3 grid
         * @param grid - A grid of enums indicating what a cell is
         * @param cellDimensions - The pixel height, width of a cell in the grid
         */
        function getGridDataForD3(grid, cellDimensions) {
            var numCols = grid.length;
            var numRows = grid[0].length;

            var data = initializeGrid([numCols, numRows]);
            // Dimensions of the cell in pixels
            var cellWidth = cellDimensions[0];
            var cellHeight = cellDimensions[1];

            // iterate for rows
            for (var column = 0; column < numCols; column++) {
                // iterate for cells/columns inside rows
                for (var row = 0; row < numRows; row++) {
                    data[column][row] = {
                        x: cellWidth * column,
                        y: (gridHeight - cellHeight) - cellHeight * row,
                        width: cellWidth,
                        height: cellHeight,
                        gridCellType: grid[column][row]
                    };
                }
            }
            return data;
        }

        function getArrowDataForD3(pickPath, items) {
            var symbols = [];

            for (var i = 1; i < pickPath.length; i++) {
                var symbol = {};

                var current = pickPath[i - 1];
                var next = pickPath[i];

                symbol.startX = cellDimensions[0] * current[0] + cellDimensions[0] / 2;
                symbol.startY = (gridHeight - cellDimensions[1]) - cellDimensions[1] * current[1] + cellDimensions[1] / 2;

                symbol.endX = cellDimensions[0] * next[0] + cellDimensions[0] / 2;
                symbol.endY = (gridHeight - cellDimensions[1]) - cellDimensions[1] * next[1] + cellDimensions[1] / 2;

                symbols.push(symbol);
            }

            return symbols;
        }

        // Render Grid with D3

        var svg = d3.select("svg");
        svg
            .attr("height", gridHeight + "px")
            .attr("width", gridWidth + "px");

        var d3Data = getGridDataForD3(gridWarehouse.grid, cellDimensions);
        console.log(d3Data);

        var column = svg.selectAll(".col")
            .data(d3Data)
            .enter()
            .append("g")
            .attr("class", "col");

        var row = column.selectAll(".square")
            .data(function (d) {
                return d;
            })
            .enter()
            .append("rect")
            .attr("class", "square")
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("width", function (d) {
                return d.width;
            })
            .attr("height", function (d) {
                return d.height;
            })
            .attr("class", function (d) {
                switch (d.gridCellType) {
                    case GridCellTypeEnum.Navigable:
                        return "navigable-cell";
                    case GridCellTypeEnum.Shelving:
                        return "shelving-cell";
                    case GridCellTypeEnum.PathSource:
                        return "source-cell";
                    case GridCellTypeEnum.PathIntermediate:
                        return "intermediate-cell";
                    case GridCellTypeEnum.PathDestination:
                        return "destination-cell";
                    case GridCellTypeEnum.PathItemToPickUp:
                        return "path-item-to-pick-up-cell";
                    default:
                        throw new Error("Unknown type");
                }
            })
            .style("stroke", "#222");

        var symbolData = getArrowDataForD3(gridWarehouse.activeOrderPickingSession.path, gridWarehouse.activeOrderPickingSession.items);
        column.selectAll(".square")
            .data(symbolData)
            .enter()
            .append('line')
            .attr('x1', function (d) {return d.startX})
            .attr('y1', function (d) {return d.startY})
            .attr('x2', function (d) {return d.endX})
            .attr('y2', function (d) {return d.endY})
            .attr("stroke", "#f00")
            .attr("stroke-width", 2)
            .attr('marker-start', 'url(#arrow)');

    };
}

var gridWarehouse;
$(document).ready(function () {

    var warehouseId = getQueryStringParameterByName('warehouseId');
    var sourceX = parseInt(getQueryStringParameterByName('sourceX'));
    var sourceY = parseInt(getQueryStringParameterByName('sourceY'));
    var itemsToPickUp = JSON.parse(getQueryStringParameterByName('itemsToPickUp'));

    $('#warehouseId').val(warehouseId);
    $('#sourceX').val(sourceX);
    $('#sourceY').val(sourceY);
    $('#itemsToPickUp').val(JSON.stringify(itemsToPickUp));

    gridWarehouse = new GridWarehouse(warehouseId);
    gridWarehouse
        .loadWarehouse()
        .then(function () {
            gridWarehouse.findPickPath([sourceX, sourceY], itemsToPickUp)
                .then(gridWarehouse.render);
        });

});