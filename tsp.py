"""
Implementation of Christofide's Algorithm for Traveling Salesman Problem!
Author: Pramod Kotipalli (pramodk@gatech.edu)

Properties:
- Approximation ratio of 3/2 (within 50% of optimal solution)
- O(n ^ 3) time runtime on graph with n nodes

References:
- https://en.wikipedia.org/wiki/Christofides_algorithm
- https://www.geeksforgeeks.org/backtracking-set-7-hamiltonian-cycle/

"""
import networkx as nx
import copy


def tsp_circuit(G, source_node):
    """
    Christofide's algorithm
    """
    # 1. Create an MST
    T = nx.minimum_spanning_tree(G)  # type: nx.Graph

    # 2. Get all odd nodes
    O = _get_nodes_with_odd_degree(T)

    # 3. Induce a sub-graph on the odd nodes
    subgraph_on_O = G.subgraph(O)

    # 4. Compute a minimum weight matching on the sub-graph
    M = _min_weight_matching(subgraph_on_O)

    # 5. Add the matching's edges to the MST
    _add_matching_to_mst(T, M)

    # 6. Compute a Hamiltonian circuit
    path = _hamilton_circuit(T, source=source_node)

    return path


def _get_nodes_with_odd_degree(G):
    nodes = []
    for node in G.nodes:
        if nx.degree(G, node) % 2 == 1:
            nodes.append(node)
    return nodes


def _min_weight_matching(G):  # type: (nx.Graph) -> set
    nodes = copy.deepcopy(set(G.nodes))

    matching = set()

    while nodes:
        v = nodes.pop()
        min_weight = float('inf')
        closest = None

        if not nodes:
            raise ValueError("G has an odd number of nodes")

        for u in nodes:
            edge = G.get_edge_data(u, v, default=None)
            if edge is not None and edge['weight'] < min_weight:
                min_weight = edge['weight']
                closest = u

        matching.add((v, closest, min_weight))
        nodes.remove(closest)

    return matching


def _add_matching_to_mst(T, M):
    for u, v, weight in M:
        T.add_edge(u, v, weight=weight)


def _hamilton_circuit(G, source):
    ham_path = [source]

    path_found = _hamilton_circuit_helper(G, source, ham_path)

    if not path_found:
        return None

    return ham_path


def _hamilton_circuit_helper(G, source, ham_path):  # type: (nx.Graph, []) -> bool
    # If the path has all the nodes of G, check if there is an edge back to the source
    if len(ham_path) == G.number_of_nodes():
        edge_back_to_source = G.get_edge_data(ham_path[-1], source, default=None)
        if edge_back_to_source is not None:
            ham_path.append(source)
            return True
        else:
            return False

    for node in G.nodes:
        edge = G.get_edge_data(ham_path[-1], node, default=None)

        if edge is not None and node not in ham_path:
            ham_path.append(node)

            if _hamilton_circuit_helper(G, source, ham_path):
                return True

            # Else, the path wasn't proper, so backtrack
            ham_path.pop(len(ham_path) - 1)

    return False
