from pathlib import Path
import json
import uuid
import subprocess
import time
from textwrap import dedent


# ------------------------------------------------
# Base Directories
# ------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

GENERATED_DIR = BASE_DIR / "generated"
GENERATED_DIR.mkdir(exist_ok=True)


# ------------------------------------------------
# Main Generator Class
# ------------------------------------------------

class EnclosureGenerator:

    def __init__(self):

        self.jobs_file = GENERATED_DIR / "jobs.json"

        if not self.jobs_file.exists():
            self.jobs_file.write_text("[]")

    # ------------------------------------------------
    # Job Storage Helpers
    # ------------------------------------------------

    def _load_jobs(self):

        try:
            return json.loads(self.jobs_file.read_text())

        except Exception:
            return []

    def _save_jobs(self, jobs):

        self.jobs_file.write_text(
            json.dumps(jobs, indent=2)
        )

    # ------------------------------------------------
    # Public Job APIs
    # ------------------------------------------------

    def list_jobs(self):

        jobs = self._load_jobs()

        return jobs[-50:][::-1]

    def get_job(self, job_id):

        jobs = self._load_jobs()

        for job in jobs:

            if job["job_id"] == job_id:
                return job

        return None

    def job_file(self, job_id, filename):

        return GENERATED_DIR / job_id / filename

    # ------------------------------------------------
    # OpenSCAD Generator
    # ------------------------------------------------

    def _generate_scad(self, payload):

        pcb_l = float(payload["pcb_length"])
        pcb_w = float(payload["pcb_width"])

        pcb_h = float(payload.get("pcb_height", 1.6))

        wall = float(payload.get("wall_thickness", 2.0))
        clearance = float(payload.get("clearance", 1.5))

        bottom = float(payload.get("bottom_thickness", 2.0))
        top = float(payload.get("top_thickness", 2.0))

        internal_h = float(
            payload.get("internal_height", 20.0)
        )

        ventilation = bool(
            payload.get("ventilation", False)
        )

        mounting = bool(
            payload.get("mounting_standoffs", True)
        )

        lid_separation = bool(
            payload.get("lid_separation", True)
        )

        connector_cutouts = payload.get(
            "connector_cutouts",
            []
        )

        mounting_holes = payload.get(
            "mounting_holes",
            []
        )

        # ------------------------------------------------
        # Dimensions
        # ------------------------------------------------

        outer_l = pcb_l + 2 * (clearance + wall)
        outer_w = pcb_w + 2 * (clearance + wall)

        outer_h = (
            bottom
            + pcb_h
            + internal_h
            + top
        )

        # ------------------------------------------------
        # Connector Cutouts
        # ------------------------------------------------

        cutout_code = "\n".join([

            f'''
            translate([
                {c["x"]},
                {c["y"]},
                {c.get("z", 0)}
            ])
            cube([
                {c["width"]},
                {c["height"]},
                {wall * 3}
            ], center=false);
            '''

            for c in connector_cutouts

        ]) or "cube([0,0,0]);"

        # ------------------------------------------------
        # Mounting Holes
        # ------------------------------------------------

        hole_code = "\n".join([

            f'''
            translate([
                {h["x"]},
                {h["y"]},
                0
            ])
            cylinder(
                h={bottom + 20},
                r={h.get("diameter", 3.2) / 2},
                center=false
            );
            '''

            for h in mounting_holes

        ]) or "cube([0,0,0]);"

        # ------------------------------------------------
        # Standoffs
        # ------------------------------------------------

        standoff_code = "\n".join([

            f'''
            translate([
                {h["x"]},
                {h["y"]},
                {bottom}
            ])
            cylinder(h=8, r=3.2);
            '''

            for h in mounting_holes

        ])

        # ------------------------------------------------
        # Final OpenSCAD Script
        # ------------------------------------------------

        scad = f"""
        $fn = 48;

        outer_l = {outer_l};
        outer_w = {outer_w};
        outer_h = {outer_h};

        wall = {wall};
        bottom = {bottom};
        top = {top};

        module enclosure_base() {{

            difference() {{

                cube([
                    outer_l,
                    outer_w,
                    outer_h
                ], center=false);

                translate([
                    wall,
                    wall,
                    bottom
                ])

                cube([
                    outer_l - 2*wall,
                    outer_w - 2*wall,
                    outer_h - bottom - top + 0.2
                ], center=false);

                union() {{
                    {hole_code}
                }}

                union() {{
                    {cutout_code}
                }}
            }}
        }}

        module enclosure_lid() {{

            difference() {{

                translate([
                    0,
                    0,
                    outer_h + 4
                ])

                cube([
                    outer_l,
                    outer_w,
                    top + 4
                ], center=false);

                translate([
                    wall,
                    wall,
                    outer_h + 4
                ])

                cube([
                    outer_l - 2*wall,
                    outer_w - 2*wall,
                    top + 2
                ], center=false);
            }}
        }}

        module standoffs() {{

            if ({str(mounting).lower()}) {{

                {standoff_code}

            }}
        }}

        module ventilation_slots() {{

            if ({str(ventilation).lower()}) {{

                for (i = [0:7]) {{

                    translate([
                        12 + i*10,
                        outer_w/2,
                        outer_h - 1.2
                    ])

                    cube([
                        6,
                        1.2,
                        2
                    ], center=true);
                }}
            }}
        }}

        if ({str(lid_separation).lower()}) {{

            enclosure_base();
            enclosure_lid();
            standoffs();
            ventilation_slots();

        }} else {{

            difference() {{

                union() {{
                    enclosure_base();
                    standoffs();
                }}

                ventilation_slots();
            }}
        }}
        """

        return dedent(scad)

    # ------------------------------------------------
    # Main Generate Function
    # ------------------------------------------------

    def generate(self, payload):

        job_id = str(uuid.uuid4())

        job_dir = GENERATED_DIR / job_id

        job_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        scad_path = job_dir / "enclosure.scad"
        stl_path = job_dir / "enclosure.stl"
        metadata_path = job_dir / "metadata.json"

        # ------------------------------------------------
        # Generate SCAD
        # ------------------------------------------------

        scad_content = self._generate_scad(payload)

        scad_path.write_text(scad_content)

        metadata_path.write_text(
            json.dumps(payload, indent=2)
        )

        # ------------------------------------------------
        # Run OpenSCAD
        # ------------------------------------------------

        status = "success"
        error = None

        try:

            subprocess.run(
                [
                    r"C:\Program Files\OpenSCAD\openscad.exe",
                    "-o",
                    str(stl_path),
                    str(scad_path)
                ],
                check=True,
                capture_output=True,
                text=True
            )

        except Exception as e:

            status = "fallback"

            error = str(e)

            stl_path.write_text(
                "OpenSCAD unavailable in deployment environment."
            )

        # ------------------------------------------------
        # Save Job Record
        # ------------------------------------------------

        record = {

            "job_id": job_id,

            "name": payload.get(
                "name",
                "smart_enclosure"
            ),

            "status": status,

            "error": error,

            "created_at": time.strftime(
                "%Y-%m-%d %H:%M:%S"
            ),

            "scad_file":
                f"/download/{job_id}/enclosure.scad",

            "stl_file":
                f"/download/{job_id}/enclosure.stl",

            "metadata_file":
                f"/download/{job_id}/metadata.json"
        }

        jobs = self._load_jobs()

        jobs.append(record)

        self._save_jobs(jobs)

        return record