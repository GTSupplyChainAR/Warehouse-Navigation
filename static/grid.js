// Based on: https://bl.ocks.org/cagrimmett/07f8c8daea00946b9e704e3efcbd5739

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }

    return true;
}

function initializeGrid(dimensions, defaultData) {
    var grid = [];
    for (var i = 0; i < dimensions[0]; i++) {
        var row = [];
        for (var j = 0; j < dimensions[1]; j++) {
            row.push(defaultData);
        }
        grid.push(row);
    }
    return grid;
}

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

const GridCellTypeEnum = Object.freeze({
    Navigable: 1,
    Shelving: 2,

    PathIntermediate: 3,
    PathSource: 4,
    PathDestination: 5,
});

function GridWarehouse(warehouseId) {
    this.warehouseId = warehouseId;
    this.dimensions = null;
    this.grid = null;
    this.graph = null;

    // The last computed path
    this.lastPath = null;

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

    this.findPath = function (sourceCell, destinationCell) {
        var _this = this;
        return $.ajax({
            url: '/api/warehouse/' + this.warehouseId + '/path/' + sourceCell + '/' + destinationCell + '/',
        }).done(function (data) {
            var path = JSON.parse(data);
            _this.lastPath = path;

            for (var i = 0; i < _this.lastPath.length; i++) {
                var pathCell = _this.lastPath[i];

                var cellType;

                if (i === 0) {
                    cellType = GridCellTypeEnum.PathSource;
                } else if (i === _this.lastPath.length - 1) {
                    cellType = GridCellTypeEnum.PathDestination;
                } else {
                    cellType = GridCellTypeEnum.PathIntermediate;
                }

                _this.grid[pathCell[0]][pathCell[1]] = cellType;
            }
        });
    };

    this.render = function () {
// height, width
            var cellDimensions = [50, 50];

            /**
             * Generates a 2D array of the same shape of grid containing all the data needed to render a D3 grid
             * @param grid - A grid of booleans indicating if a cell is traversable (true) or not (false)
             * @param cellDimensions - The pixel height, width of a cell in the grid
             */
            function getGridDataForD3(grid, cellDimensions) {
                var data = new Array();
                // starting xpos and ypos at 1 so the stroke will show when we make the grid below
                var xPosition = 1;
                var yPosition = 1;
                // Dimensions of the cell in pixels
                var cellHeight = cellDimensions[0];
                var cellWidth = cellDimensions[1];

                var numRows = grid.length;
                var numCols = grid[0].length;

                // iterate for rows
                for (var row = 0; row < numRows; row++) {
                    data.push(new Array());

                    // iterate for cells/columns inside rows
                    for (var column = 0; column < numCols; column++) {
                        data[row].push({
                            x: xPosition,
                            y: yPosition,
                            width: cellWidth,
                            height: cellHeight,
                            gridCellType: grid[row][column]
                        });

                        // increment the x position. I.e. move it over by 50 (width variable)
                        xPosition += cellWidth;
                    }
                    // reset the x position after a row is complete
                    xPosition = 1;
                    // increment the y position for the next row. Move it down 50 (height variable)
                    yPosition += cellHeight;
                }
                return data;
            }

// Render Grid with D3

            var oldGrid = d3.select("#grid")
                .selectAll("*")
                .remove();

            var grid = d3.select("#grid")
                .append("svg")
                .attr("height", cellDimensions[0] * gridWarehouse.dimensions[0] + 10 + "px")
                .attr("width", cellDimensions[1] * gridWarehouse.dimensions[1] + 10 + "px");

            var row = grid.selectAll(".row")
                .data(getGridDataForD3(gridWarehouse.grid, cellDimensions))
                .enter().append("g")
                .attr("class", "row");

            var column = row.selectAll(".square")
                .data(function (d) {
                    return d;
                })
                .enter().append("rect")
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
                .attr("fill", function (d) {
                    switch (d.gridCellType) {
                        case GridCellTypeEnum.Navigable:
                            return "#d9d9d9";
                        case GridCellTypeEnum.Shelving:
                            return "#676767";
                        case GridCellTypeEnum.PathSource:
                            return "#7eff00";
                        case GridCellTypeEnum.PathIntermediate:
                            return "#00cbff";
                        case GridCellTypeEnum.PathDestination:
                            return "#ff2b00";

                    }
                })
                .style("stroke", "#222");
    };
}

var gridWarehouse;
$(document).ready(function () {

    gridWarehouse = new GridWarehouse('larger');
    gridWarehouse
        .loadWarehouse()
        .then(function () {
            gridWarehouse.render();

            gridWarehouse.findPath([0, 0], [3, 3])
                .then(function () {
                gridWarehouse.render();
            });

        });

});