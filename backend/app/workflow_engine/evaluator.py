import ast
import operator
import re

# Supported operators mapping string operators to python functions
OPERATORS = {
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
    ast.Lt: operator.lt,
    ast.LtE: operator.le,
    ast.Gt: operator.gt,
    ast.GtE: operator.ge,
    ast.And: operator.and_,
    ast.Or: operator.or_
}

def safe_eval_condition(condition_str: str, data: dict) -> bool:
    """
    Safely evaluate a boolean condition like "amount > 100 && country == 'US'"
    against a dictionary of data.
    """
    if condition_str.strip().upper() == "DEFAULT":
        return True

    # Pre-process && and || to Python's and / or so ast.parse can read it
    condition_str = condition_str.replace("&&", " and ").replace("||", " or ")

    try:
        # Parse the string into an AST
        node = ast.parse(condition_str, mode='eval').body
        return _eval_ast(node, data)
    except Exception as e:
        # Log or handle parsing error appropriately
        # Returning False if the evaluation fails ensures the step fails securely
        print(f"Error evaluating condition '{condition_str}': {e}")
        return False

def _eval_ast(node, data):
    if isinstance(node, ast.Constant):
        return node.value

    elif isinstance(node, ast.Name):
        # Allow looking up variables from the data dict
        if node.id in data:
            return data[node.id]
        else:
            # Variable not found in input data
            return None
    
    elif isinstance(node, ast.Compare):
        # Evaluate left side
        left = _eval_ast(node.left, data)
        # Evaluate comparisons sequentially (e.g. 1 < 2 < 3)
        for op, right_node in zip(node.ops, node.comparators):
            right = _eval_ast(right_node, data)
            op_type = type(op)
            if op_type not in OPERATORS:
                raise ValueError(f"Unsupported operator: {op_type}")
            
            # Apply the operator
            if not OPERATORS[op_type](left, right):
                return False
            # Next comparison's left is this comparison's right
            left = right
        return True
    
    elif isinstance(node, ast.BoolOp):
        # Handle 'and', 'or'
        if isinstance(node.op, ast.And):
            for value in node.values:
                if not _eval_ast(value, data):
                    return False
            return True
        elif isinstance(node.op, ast.Or):
            for value in node.values:
                if _eval_ast(value, data):
                    return True
            return False
            
    else:
        raise ValueError(f"Unsupported expression node: {type(node)}")

# Example usage:
# data = {"amount": 250, "country": "US", "priority": "High"}
# cond = 'amount > 100 && country == "US" && priority == "High"'
# result = safe_eval_condition(cond, data)
