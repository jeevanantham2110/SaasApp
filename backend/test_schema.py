import json
from app.schemas.all import StepCreate, StepResponse, WorkflowResponse

# Test StepCreate parsing (the request body)
body = {"name": "Step 1", "step_type": "task", "order": 1, "metadata": {}}
print("Testing StepCreate with alias 'metadata'...")
try:
    obj = StepCreate.model_validate(body)
    print(f"  OK: {obj}")
except Exception as e:
    print(f"  ERROR: {e}")

# Test without alias
body2 = {"name": "Step 1", "step_type": "task", "order": 1, "metadata_col": {}}
print("Testing StepCreate with field name 'metadata_col'...")
try:
    obj2 = StepCreate.model_validate(body2)
    print(f"  OK: {obj2}")
except Exception as e:
    print(f"  ERROR: {e}")

# Test StepResponse serialization (needs from_attributes on ORM object)
print("Testing StepResponse serialization...")
import uuid, datetime
class FakeStep:
    id = uuid.uuid4()
    workflow_id = uuid.uuid4()
    name = "Test"
    step_type = "task"
    order = 1
    metadata_col = {}
    created_at = datetime.datetime.now()
    updated_at = None

try:
    resp = StepResponse.model_validate(FakeStep())
    print(f"  OK: {resp}")
except Exception as e:
    print(f"  ERROR: {e}")
