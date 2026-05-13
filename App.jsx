import React, { useState } from "react";
import "./frontend.css";

function App() {

  const [formData, setFormData] = useState({
    pcb_length: 100,
    pcb_width: 60,
    pcb_height: 1.6,
    wall_thickness: 2,
    clearance: 1.5,
    internal_height: 20,
    ventilation: false,
    mounting_standoffs: true,
    lid_separation: true
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // --------------------------------
  // BACKEND URL
  // --------------------------------

  const BACKEND_URL = "http://127.0.0.1:5000/api/generate";

  // After Render deployment:
  // const BACKEND_URL = "https://your-backend.onrender.com/api/generate";

  // --------------------------------
  // HANDLE INPUT
  // --------------------------------

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox"
        ? checked
        : parseFloat(value)
    });
  };

  // --------------------------------
  // GENERATE
  // --------------------------------

  const generateEnclosure = async () => {

    setLoading(true);

    try {

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      setResult(data);

    } catch (error) {

      alert("Backend connection failed");

    }

    setLoading(false);
  };

  return (

    <div className="container">

      <h1>AI Electronics Enclosure Generator</h1>

      <div className="card">

        <h2>PCB Dimensions</h2>

        <input
          type="number"
          name="pcb_length"
          placeholder="PCB Length"
          value={formData.pcb_length}
          onChange={handleChange}
        />

        <input
          type="number"
          name="pcb_width"
          placeholder="PCB Width"
          value={formData.pcb_width}
          onChange={handleChange}
        />

        <input
          type="number"
          name="pcb_height"
          placeholder="PCB Height"
          value={formData.pcb_height}
          onChange={handleChange}
        />

        <h2>Enclosure Settings</h2>

        <input
          type="number"
          name="wall_thickness"
          placeholder="Wall Thickness"
          value={formData.wall_thickness}
          onChange={handleChange}
        />

        <input
          type="number"
          name="clearance"
          placeholder="Clearance"
          value={formData.clearance}
          onChange={handleChange}
        />

        <input
          type="number"
          name="internal_height"
          placeholder="Internal Height"
          value={formData.internal_height}
          onChange={handleChange}
        />

        <label>
          <input
            type="checkbox"
            name="ventilation"
            checked={formData.ventilation}
            onChange={handleChange}
          />
          Ventilation
        </label>

        <label>
          <input
            type="checkbox"
            name="mounting_standoffs"
            checked={formData.mounting_standoffs}
            onChange={handleChange}
          />
          Mounting Standoffs
        </label>

        <label>
          <input
            type="checkbox"
            name="lid_separation"
            checked={formData.lid_separation}
            onChange={handleChange}
          />
          Separate Lid
        </label>

        <button onClick={generateEnclosure}>
          {loading ? "Generating..." : "Generate Enclosure"}
        </button>

      </div>

      {result && (

        <div className="result">

          <h2>Generation Result</h2>

          <p><strong>Job ID:</strong> {result.job_id}</p>

          <p><strong>Status:</strong> {result.status}</p>

          <p><strong>Created:</strong> {result.created_at}</p>

          <a
            href={`http://127.0.0.1:5000${result.scad_file}`}
            target="_blank"
            rel="noreferrer"
          >
            Download SCAD
          </a>

          <br /><br />

          <a
            href={`http://127.0.0.1:5000${result.stl_file}`}
            target="_blank"
            rel="noreferrer"
          >
            Download STL
          </a>

        </div>
      )}

    </div>
  );
}

export default App;