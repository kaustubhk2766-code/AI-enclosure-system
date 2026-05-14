from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pathlib import Path
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# -----------------------------
# Simple In-Memory Job Storage
# -----------------------------

jobs_db = {}

# -----------------------------
# Validation Helper
# -----------------------------

def validate_enclosure_request(data):

    try:

        if "pcb_length" not in data or "pcb_width" not in data:
            raise ValueError("pcb_length and pcb_width are required")

        validated = {
            "name": str(data.get("name", "smart_enclosure")),
            "pcb_length": float(data["pcb_length"]),
            "pcb_width": float(data["pcb_width"]),
            "pcb_height": float(data.get("pcb_height", 1.6)),
            "wall_thickness": float(data.get("wall_thickness", 2.0)),
            "clearance": float(data.get("clearance", 1.5)),
            "bottom_thickness": float(data.get("bottom_thickness", 2.0)),
            "top_thickness": float(data.get("top_thickness", 2.0)),
            "internal_height": float(data.get("internal_height", 20.0)),
            "ventilation": bool(data.get("ventilation", False)),
            "lid_separation": bool(data.get("lid_separation", True)),
            "mounting_standoffs": bool(data.get("mounting_standoffs", True)),
            "connector_cutouts": [],
            "mounting_holes": []
        }

        for field in [
            "pcb_length",
            "pcb_width",
            "pcb_height",
            "wall_thickness",
            "clearance"
        ]:

            if validated[field] <= 0:
                raise ValueError(f"{field} must be greater than 0")

        return validated

    except (ValueError, TypeError, KeyError) as e:

        raise ValueError(f"Invalid input data: {str(e)}")

# -----------------------------
# Routes
# -----------------------------

@app.get("/")
def home():

    return jsonify({
        "message": "Smart Enclosure Generator API Running"
    })

@app.get("/health")
def health():

    return jsonify({
        "status": "ok"
    })

@app.get("/api/jobs")
def jobs():

    return jsonify(list(jobs_db.values()))

@app.post("/api/generate")
def generate():

    try:

        json_data = request.get_json(force=True)

        validated_data = validate_enclosure_request(json_data)

        job_id = str(uuid.uuid4())

        result = {
            "job_id": job_id,
            "status": "completed",
            "data": validated_data,
            "timestamp": datetime.now().isoformat(),
            "scad_file": f"/download/{job_id}/enclosure.scad",
            "stl_file": f"/download/{job_id}/enclosure.stl"
        }

        jobs_db[job_id] = result

        return jsonify(result)

    except ValueError as e:

        return jsonify({
            "error": str(e)
        }), 400

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

@app.get("/api/jobs/<job_id>")
def job_detail(job_id):

    item = jobs_db.get(job_id)

    if item:
        return jsonify(item)

    return jsonify({
        "error": "Job not found"
    }), 404

@app.get("/download/<job_id>/<filename>")
def download(job_id, filename):

    return jsonify({
        "message": f"Download endpoint for {filename}",
        "job_id": job_id
    })

# -----------------------------
# Main
# -----------------------------

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )