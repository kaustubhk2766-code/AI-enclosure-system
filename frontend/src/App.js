import React, { useState } from "react";
import axios from "axios";

import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";

import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

// ----------------------------------------------------
// STL MODEL COMPONENT
// ----------------------------------------------------

function STLModel({ url }) {

  const geometry = useLoader(STLLoader, url);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#60a5fa" />
    </mesh>
  );
}

// ----------------------------------------------------
// FEATURE CHECKBOX COMPONENT
// ----------------------------------------------------

function FeatureCheckbox({
  label,
  sublabel,
  name,
  checked,
  onChange
}) {

  return (

    <label style={styles.featureCard}>

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        style={styles.checkboxInput}
      />

      <div>

        <div style={styles.featureLabel}>
          {label}
        </div>

        <div style={styles.featureSub}>
          {sublabel}
        </div>

      </div>

    </label>
  );
}

// ----------------------------------------------------
// MAIN APP
// ----------------------------------------------------

export default function App() {

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);

  const [previewUrl, setPreviewUrl] = useState("");

  const [unit, setUnit] = useState("mm");

  const [formData, setFormData] = useState({

    name: "Smart Enclosure",

    pcb_length: 100,

    pcb_width: 60,

    pcb_height: 20,

    wall_thickness: 2,

    clearance: 2,

    ventilation: true,

    mounting_standoffs: true,

    lid_separation: true,

    rounded_corners: true,

    device_type: "Arduino",

    usb_cutout: "USB-C",

    screw_holes: "4"
  });

  // ----------------------------------------------------
  // UNIT CONVERSION
  // ----------------------------------------------------

  const convertToMM = (value) => {

    if (unit === "cm") {
      return value * 10;
    }

    if (unit === "inch") {
      return value * 25.4;
    }

    return value;
  };

  // ----------------------------------------------------
  // INPUT CHANGE
  // ----------------------------------------------------

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData({

      ...formData,

      [name]:
        type === "checkbox"
          ? checked
          : value
    });
  };

  // ----------------------------------------------------
  // GENERATE
  // ----------------------------------------------------

  const generateEnclosure = async () => {

    setLoading(true);

    try {

      const payload = {

        ...formData,

        pcb_length:
          convertToMM(
            Number(formData.pcb_length)
          ),

        pcb_width:
          convertToMM(
            Number(formData.pcb_width)
          ),

        pcb_height:
          convertToMM(
            Number(formData.pcb_height)
          ),

        wall_thickness:
          convertToMM(
            Number(formData.wall_thickness)
          ),

        clearance:
          convertToMM(
            Number(formData.clearance)
          )
      };

      const response = await axios.post(
        "http://127.0.0.1:5000/api/generate",
        payload
      );

      setResult(response.data);

      setPreviewUrl(
        `http://127.0.0.1:5000${response.data.stl_file}`
      );

      alert("Enclosure Generated!");

    } catch (error) {

      console.log(error);

      alert("Generation Failed");
    }

    setLoading(false);
  };

  // ----------------------------------------------------
  // VENTILATION SUGGESTION
  // ----------------------------------------------------

  const getSuggestion = () => {

    if (
      formData.device_type === "Power Supply"
    ) {

      return {
        text:
          "High heat detected → increase ventilation slots",
        color: "#ef4444"
      };
    }

    if (
      formData.device_type === "Raspberry Pi"
    ) {

      return {
        text:
          "Moderate heat → medium ventilation recommended",
        color: "#eab308"
      };
    }

    return {
      text:
        "Normal ventilation sufficient",
      color: "#22c55e"
    };
  };

  const suggestion = getSuggestion();

  // ----------------------------------------------------
  // JSX
  // ----------------------------------------------------

  return (

    <div style={styles.page}>

      {/* SIDEBAR */}

      <div style={styles.sidebar}>

        <h2 style={styles.logo}>
          ⚡ Enclosure AI
        </h2>

        <div style={styles.menuActive}>
          🏠 Dashboard
        </div>

        <div style={styles.menu}>
          📁 Designs
        </div>

        <div style={styles.menu}>
          ⚙ Settings
        </div>

      </div>

      {/* MAIN */}

      <div style={styles.main}>

        {/* HEADER */}

        <div style={styles.header}>

          <div>

            <h1 style={styles.title}>
              Smart Electronics Enclosure Generator
            </h1>

            <p style={styles.subtitle}>
              AI-Assisted OpenSCAD Designer
            </p>

          </div>

        </div>

        {/* LAYOUT */}

        <div style={styles.layout}>

          {/* LEFT */}

          <div>

            {/* CARD 1 */}

            <div style={styles.card}>

              <h2 style={styles.cardTitle}>
                PCB & Dimensions
              </h2>

              <div style={styles.unitRow}>

                <label style={styles.label}>
                  Units
                </label>

                <select
                  style={styles.select}
                  value={unit}
                  onChange={(e) =>
                    setUnit(e.target.value)
                  }
                >

                  <option value="mm">
                    mm
                  </option>

                  <option value="cm">
                    cm
                  </option>

                  <option value="inch">
                    inch
                  </option>

                </select>

              </div>

              <div style={styles.grid}>

                <div>

                  <label style={styles.label}>
                    Project Name
                  </label>

                  <input
                    style={styles.input}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />

                </div>

                <div>

                  <label style={styles.label}>
                    PCB Length
                  </label>

                  <input
                    style={styles.input}
                    type="number"
                    name="pcb_length"
                    value={formData.pcb_length}
                    onChange={handleChange}
                  />

                </div>

                <div>

                  <label style={styles.label}>
                    PCB Width
                  </label>

                  <input
                    style={styles.input}
                    type="number"
                    name="pcb_width"
                    value={formData.pcb_width}
                    onChange={handleChange}
                  />

                </div>

                <div>

                  <label style={styles.label}>
                    PCB Height
                  </label>

                  <input
                    style={styles.input}
                    type="number"
                    name="pcb_height"
                    value={formData.pcb_height}
                    onChange={handleChange}
                  />

                </div>

                <div>

                  <label style={styles.label}>
                    Wall Thickness
                  </label>

                  <input
                    style={styles.input}
                    type="number"
                    name="wall_thickness"
                    value={formData.wall_thickness}
                    onChange={handleChange}
                  />

                </div>

                <div>

                  <label style={styles.label}>
                    Clearance
                  </label>

                  <input
                    style={styles.input}
                    type="number"
                    name="clearance"
                    value={formData.clearance}
                    onChange={handleChange}
                  />

                </div>

              </div>

            </div>

            {/* CARD 2 */}

            <div style={styles.card}>

              <h2 style={styles.cardTitle}>
                Device & Features
              </h2>

              <label style={styles.label}>
                Device Type
              </label>

              <select
                style={styles.select}
                name="device_type"
                value={formData.device_type}
                onChange={handleChange}
              >

                <option>
                  Arduino
                </option>

                <option>
                  Raspberry Pi
                </option>

                <option>
                  Power Supply
                </option>

                <option>
                  Motor Driver
                </option>

              </select>

              <div style={styles.featureGrid}>

                <FeatureCheckbox
                  label="Ventilation"
                  sublabel="Cooling vents"
                  name="ventilation"
                  checked={formData.ventilation}
                  onChange={handleChange}
                />

                <FeatureCheckbox
                  label="Mounting"
                  sublabel="PCB holes"
                  name="mounting_standoffs"
                  checked={formData.mounting_standoffs}
                  onChange={handleChange}
                />

                <FeatureCheckbox
                  label="Lid Separation"
                  sublabel="Separate lid"
                  name="lid_separation"
                  checked={formData.lid_separation}
                  onChange={handleChange}
                />

                <FeatureCheckbox
                  label="Rounded Corners"
                  sublabel="Smooth edges"
                  name="rounded_corners"
                  checked={formData.rounded_corners}
                  onChange={handleChange}
                />

              </div>

              <div
                style={{
                  ...styles.suggestion,
                  borderLeft:
                    `5px solid ${suggestion.color}`
                }}
              >

                {suggestion.text}

              </div>

              <button
                style={styles.generateButton}
                onClick={generateEnclosure}
              >

                {
                  loading
                    ? "Generating..."
                    : "Generate Enclosure"
                }

              </button>

            </div>

          </div>

          {/* RIGHT */}

          <div>

            {/* PREVIEW */}

            <div style={styles.previewCard}>

              <h2 style={styles.cardTitle}>
                3D Preview
              </h2>

              <div style={styles.previewBox}>

                {

                  previewUrl ? (

                    <Canvas
                      camera={{
                        position: [100, 100, 100],
                        fov: 45
                      }}
                    >

                      <ambientLight intensity={1} />

                      <directionalLight
                        position={[10, 10, 10]}
                      />

                      <Stage>

                        <STLModel url={previewUrl} />

                      </Stage>

                      <OrbitControls />

                    </Canvas>

                  ) : (

                    <div style={styles.placeholder}>

                      <div style={styles.cube}>
                        ⬛
                      </div>

                      <p>
                        Generate enclosure to preview STL
                      </p>

                    </div>

                  )
                }

              </div>

            </div>

            {/* RESULT */}

            {

              result && (

                <div style={styles.resultCard}>

                  <h2>
                    ✅ Generation Success
                  </h2>

                  <p>
                    Job ID:
                  </p>

                  <div style={styles.jobId}>
                    {result.job_id}
                  </div>

                  <a
                    href={`http://127.0.0.1:5000${result.scad_file}`}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.downloadButton}
                  >
                    Download SCAD
                  </a>

                  <a
                    href={`http://127.0.0.1:5000${result.stl_file}`}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.downloadButton}
                  >
                    Download STL
                  </a>

                </div>
              )
            }

          </div>

        </div>

      </div>

    </div>
  );
}

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------

const styles = {

  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    fontFamily: "Arial"
  },

  sidebar: {
    width: "220px",
    background: "#081120",
    padding: "30px",
    borderRight: "1px solid #1e293b"
  },

  logo: {
    marginBottom: "40px"
  },

  menu: {
    padding: "14px",
    marginBottom: "10px",
    borderRadius: "12px",
    background: "#0f172a"
  },

  menuActive: {
    padding: "14px",
    marginBottom: "10px",
    borderRadius: "12px",
    background:
      "linear-gradient(90deg,#7c3aed,#2563eb)"
  },

  main: {
    flex: 1,
    padding: "40px"
  },

  header: {
    marginBottom: "30px"
  },

  title: {
    fontSize: "40px",
    margin: 0
  },

  subtitle: {
    color: "#94a3b8"
  },

  layout: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(400px,1fr))",
    gap: "30px"
  },

  card: {
    background: "#071224",
    padding: "30px",
    borderRadius: "22px",
    marginBottom: "25px",
    border: "1px solid #1e293b"
  },

  previewCard: {
    background: "#071224",
    padding: "30px",
    borderRadius: "22px",
    border: "1px solid #1e293b"
  },

  cardTitle: {
    marginBottom: "25px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px"
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#cbd5e1"
  },

  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #475569",
    background: "#111827",
    color: "white",
    boxSizing: "border-box"
  },

  select: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #475569",
    background: "#111827",
    color: "white",
    marginBottom: "20px"
  },

  featureGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "20px"
  },

  featureCard: {
    background: "#0f172a",
    padding: "16px",
    borderRadius: "14px",
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },

  checkboxInput: {
    width: "18px",
    height: "18px"
  },

  featureLabel: {
    fontWeight: "bold"
  },

  featureSub: {
    fontSize: "12px",
    color: "#94a3b8"
  },

  suggestion: {
    marginTop: "25px",
    padding: "16px",
    background: "#0f172a",
    borderRadius: "12px"
  },

  generateButton: {
    marginTop: "25px",
    width: "100%",
    padding: "18px",
    border: "none",
    borderRadius: "14px",
    background:
      "linear-gradient(90deg,#7c3aed,#2563eb)",
    color: "white",
    fontSize: "18px",
    cursor: "pointer"
  },

  previewBox: {
    height: "500px",
    borderRadius: "20px",
    overflow: "hidden",
    background: "#000"
  },

  placeholder: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },

  cube: {
    fontSize: "80px"
  },

  resultCard: {
    background: "#071224",
    marginTop: "25px",
    padding: "30px",
    borderRadius: "22px",
    border: "1px solid #1e293b"
  },

  jobId: {
    background: "#111827",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "20px",
    wordBreak: "break-all"
  },

  downloadButton: {
    display: "block",
    background: "#2563eb",
    padding: "14px",
    textAlign: "center",
    borderRadius: "12px",
    color: "white",
    textDecoration: "none",
    marginBottom: "12px"
  },

  unitRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "20px"
  }
};