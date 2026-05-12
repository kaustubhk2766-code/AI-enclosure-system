from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
# Removed pydantic dependency for Python 3.14 compatibility

from pathlib import Path

from enclosure_generator import EnclosureGenerator

app = Flask(__name__)
CORS(app)

# Initialize generator
GEN = EnclosureGenerator()


# -----------------------------
# Models
# -----------------------------

# -----------------------------
# Validation Helper
# -----------------------------

def validate_enclosure_request(data):
    """
    Manually validate the enclosure request data.
    Replaces Pydantic models for better compatibility with Python 3.14.
    """
    try:
        # Check required fields
        if "pcb_length" not in data or "pcb_width" not in data:
            raise ValueError("pcb_length and pcb_width are required")

        # Create validated dict with defaults
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

        # Check positive constraints
        for field in ["pcb_length", "pcb_width", "pcb_height", "wall_thickness", "clearance"]:
            if validated[field] <= 0:
                raise ValueError(f"{field} must be greater than 0")

        # Validate connector_cutouts
        for c in data.get("connector_cutouts", []):
            validated["connector_cutouts"].append({
                "side": str(c.get("side", "front")),
                "x": float(c.get("x", 0)),
                "y": float(c.get("y", 0)),
                "width": float(c.get("width", 0)),
                "height": float(c.get("height", 0)),
                "z": float(c.get("z", 0))
            })

        # Validate mounting_holes
        for h in data.get("mounting_holes", []):
            validated["mounting_holes"].append({
                "x": float(h.get("x", 0)),
                "y": float(h.get("y", 0)),
                "diameter": float(h.get("diameter", 3.2))
            })

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
    return jsonify(GEN.list_jobs())


@app.post("/api/generate")
def generate():
    try:
        json_data = request.get_json(force=True)

        validated_data = validate_enclosure_request(json_data)

        result = GEN.generate(validated_data)

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
    item = GEN.get_job(job_id)

    if item:
        return jsonify(item)

    return jsonify({
        "error": "Job not found"
    }), 404


@app.get("/download/<job_id>/<filename>")
def download(job_id, filename):

    try:
        path = GEN.job_file(job_id, filename)

        if not Path(path).exists():
            return jsonify({
                "error": "File not found"
            }), 404

        return send_file(
            path,
            as_attachment=True
        )

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# -----------------------------
# Main
# -----------------------------

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )