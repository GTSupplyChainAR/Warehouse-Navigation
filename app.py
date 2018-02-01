"""
Initializes server and exposes API endpoints
"""
from flask import Flask, request
import networkx as nx
from warehouse import get_simple_warehouse, get_larger_warehouse, get_georgia_tech_library_warehouse
import ast
import json

app = Flask(__name__)

WAREHOUSES = {
    'simple': get_simple_warehouse(),
    'larger': get_larger_warehouse(),
    'georgia-tech': get_georgia_tech_library_warehouse(),
}


@app.route("/")
def index():
    return app.send_static_file('index.html')


@app.route("/api/warehouse/<warehouse_id>/")
def get_warehouse(warehouse_id):

    warehouse = WAREHOUSES[warehouse_id]

    return json.dumps({
        'dimensions': warehouse.dimensions,
        'graph': nx.node_link_data(warehouse.graph),
    })


@app.route("/api/warehouse/<warehouse_id>/find-path/", methods=['POST'])
def find_path(warehouse_id):
    warehouse = WAREHOUSES[warehouse_id]

    data = request.get_json()

    from_node = data['source']
    to_node = data['destination']

    path = warehouse.find_path(from_node, to_node)

    return json.dumps(path)


@app.route("/api/warehouse/<warehouse_id>/find-pick-path/", methods=['POST'])
def find_pick_path(warehouse_id):
    warehouse = WAREHOUSES[warehouse_id]

    data = request.get_json()

    from_node = tuple(data['source'])
    intermediate_nodes = data['items']

    intermediate_nodes = [tuple(node) for node in intermediate_nodes]

    pick_path = warehouse.find_pick_path(from_node, intermediate_nodes)

    return json.dumps({
        'items': list(intermediate_nodes),
        'path': pick_path,
    })


if __name__ == '__main__':
    app.run(debug=True)
