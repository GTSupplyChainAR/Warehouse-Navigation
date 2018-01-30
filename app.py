"""
Initializes server and exposes API endpoints
"""
from flask import Flask
import networkx as nx
from warehouse import get_simple_warehouse, get_larger_warehouse
import ast
import json

app = Flask(__name__)

WAREHOUSES = {
    'simple': get_simple_warehouse(),
    'larger': get_larger_warehouse(),
}


@app.route("/")
def index():
    print("Index")
    return app.send_static_file('index.html')


@app.route("/api/warehouse/<warehouse_id>/")
def get_warehouse(warehouse_id):

    warehouse = WAREHOUSES[warehouse_id]

    return json.dumps({
        'dimensions': warehouse.dimensions,
        'graph': nx.node_link_data(warehouse.graph),
    })


@app.route("/api/warehouse/<warehouse_id>/path/<from_node>/<to_node>/")
def find_path(warehouse_id, from_node, to_node):
    warehouse = WAREHOUSES[warehouse_id]

    # Security risk!
    from_node = ast.literal_eval(from_node)
    to_node = ast.literal_eval(to_node)

    path = warehouse.find_path(from_node, to_node)

    return json.dumps(path)


if __name__ == '__main__':
    app.run(debug=True)
