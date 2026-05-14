from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

import os
import json
import uuid
from datetime import datetime

# ==========================================
# LOAD ENV
# ==========================================

load_dotenv()

app = Flask(__name__)
CORS(app)

# ==========================================
# SAMBANOVA CONFIG
# ==========================================

SAMBANOVA_API_KEY = os.getenv("SAMBANOVA_API_KEY")

client = OpenAI(
    api_key=SAMBANOVA_API_KEY,
    base_url="https://api.sambanova.ai/v1"
)

# ==========================================
# API KEY VALIDATION
# ==========================================

VALID_API_KEYS = {
    "demo-key-12345": {
        "user": "demo_user",
        "active": True
    }
}

def validate_api_key(api_key):

    if not api_key:
        return False, "API key required"

    if api_key not in VALID_API_KEYS:
        return False, "Invalid API key"

    return True, "Valid"


# ==========================================
# COMPONENT DATABASE
# ==========================================

COMPONENT_DATABASE = {

    "CPU/Processor":{
        "maxTemp":85,
        "heatOutput":"high",
        "ventilationNeeded":"critical"
    },

    "GPU/Graphics":{
        "maxTemp":80,
        "heatOutput":"high",
        "ventilationNeeded":"critical"
    },

    "Power Supply":{
        "maxTemp":75,
        "heatOutput":"high",
        "ventilationNeeded":"critical"
    },

    "Motor Driver":{
        "maxTemp":70,
        "heatOutput":"high",
        "ventilationNeeded":"critical"
    },

    "Voltage Regulator":{
        "maxTemp":75,
        "heatOutput":"medium",
        "ventilationNeeded":"high"
    },

    "Battery":{
        "maxTemp":60,
        "heatOutput":"medium",
        "ventilationNeeded":"medium"
    },

    "Microcontroller":{
        "maxTemp":85,
        "heatOutput":"low",
        "ventilationNeeded":"low"
    },

    "Sensor":{
        "maxTemp":80,
        "heatOutput":"low",
        "ventilationNeeded":"low"
    },

    "LED":{
        "maxTemp":70,
        "heatOutput":"low",
        "ventilationNeeded":"low"
    }
}

# ==========================================
# HEAT ANALYSIS
# ==========================================

def analyze_components(components):

    analysis={

        "components_analyzed":len(components),
        "details":[]
    }

    total_heat=0
    critical=0
    max_temp=0

    for component in components:

        if component in COMPONENT_DATABASE:

            c=COMPONENT_DATABASE[component]

            analysis["details"].append({

                "name":component,
                "maxTemp":c["maxTemp"],
                "heatOutput":c["heatOutput"],
                "ventilationNeeded":
                c["ventilationNeeded"]
            })

            if c["heatOutput"]=="high":
                total_heat+=3

            elif c["heatOutput"]=="medium":
                total_heat+=2

            else:
                total_heat+=1

            if c["ventilationNeeded"]=="critical":
                critical+=1

            max_temp=max(
                max_temp,
                c["maxTemp"]
            )

    analysis["totalHeatLoad"]=total_heat
    analysis["criticalComponents"]=critical
    analysis["maxTemp"]=max_temp

    return analysis


# ==========================================
# VENTILATION LOGIC
# ==========================================

def calculate_ventilation_recommendation(
    total_heat,
    critical_count
):

    if critical_count>=2:

        return {

            "level":"Maximum",

            "slots":"8-12",

            "strategy":
            "Multiple side and top vents"
        }

    elif total_heat>=5:

        return {

            "level":"High",

            "slots":"6-8",

            "strategy":
            "Side vents + top exhaust"
        }

    elif total_heat>=3:

        return {

            "level":"Medium",

            "slots":"4-6",

            "strategy":
            "Moderate airflow"
        }

    return {

        "level":"Basic",

        "slots":"2-4",

        "strategy":
        "Minimal ventilation"
    }


# ==========================================
# SAMBANOVA AI
# ==========================================

def generate_ai_recommendation(
    components,
    ventilation
):

    try:

        prompt=f"""

You are an enclosure design expert.

Components:
{components}

Ventilation:
{ventilation}

Give:

1 Cooling advice
2 Vent placement
3 Heat warnings
4 Design suggestions

Keep concise.
"""

        response=client.chat.completions.create(

            model=
            "Meta-Llama-3.3-70B-Instruct",

            messages=[

                {
                    "role":"user",
                    "content":prompt
                }
            ],

            temperature=0.7
        )

        return response.choices[
            0
        ].message.content

    except Exception as e:

        return str(e)


# ==========================================
# ROUTES
# ==========================================

@app.route("/api/health")

def health():

    return jsonify({

        "status":"healthy",

        "ai":"SambaNova Connected"
    })


@app.route(
"/api/components"
)

def components():

    return jsonify({

        "components":
        list(
            COMPONENT_DATABASE.keys()
        )
    })


@app.route(
"/api/analyze-heat",
methods=["POST"]
)

def analyze_heat():

    data=request.json

    api_key=data.get(
        "api_key"
    )

    valid,msg=validate_api_key(
        api_key
    )

    if not valid:

        return jsonify({

            "error":msg

        }),401


    components=data.get(
        "components",
        []
    )

    analysis=analyze_components(
        components
    )

    ventilation=\
    calculate_ventilation_recommendation(

        analysis[
            "totalHeatLoad"
        ],

        analysis[
            "criticalComponents"
        ]
    )

    ai=generate_ai_recommendation(

        components,

        ventilation
    )

    analysis[
        "ventilation"
    ]=ventilation

    analysis[
        "ai_recommendation"
    ]=ai

    analysis[
        "timestamp"
    ]=datetime.now(
    ).isoformat()

    return jsonify(
        analysis
    )


@app.route(
"/api/generate",
methods=["POST"]
)

def generate():

    data=request.json

    api_key=data.get(
        "api_key"
    )

    valid,msg=\
    validate_api_key(
        api_key
    )

    if not valid:

        return jsonify({

            "error":msg

        }),401

    job_id=str(
        uuid.uuid4()
    )

    return jsonify({

        "job_id":job_id,

        "status":
        "processing",

        "scad_file":
        f"/files/{job_id}.scad",

        "stl_file":
        f"/files/{job_id}.stl",

        "timestamp":
        datetime.now(
        ).isoformat()

    })


# ==========================================
# MAIN
# ==========================================

if __name__=="__main__":

    print(
    "Smart Enclosure API"
    )

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )