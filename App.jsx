import React, { useState } from "react";
import axios from "axios";

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
    screw_holes: "4",

    components: []
  });

  // =====================================
  // Convert dimensions to mm
  // =====================================

  const convertToMM = (value) => {
    if (unit === "cm") return value * 10;
    if (unit === "inch") return value * 25.4;
    return value;
  };

  // =====================================
  // Form handling
  // =====================================

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

  // =====================================
  // Heat Analysis
  // =====================================

  const analyzeHeat = async () => {
    try {

      const response =
        await axios.post(
          "http://127.0.0.1:5000/api/analyze-heat",
          {
            components: formData.components
          }
        );

      return response.data;

    } catch (err) {

      console.log(err);

      return null;
    }
  };

  // =====================================
  // Generate Enclosure
  // =====================================

  const generateEnclosure = async () => {

    setLoading(true);

    try {

      const heatData =
        await analyzeHeat();

      const payload = {

        ...formData,

        pcb_length:
          convertToMM(
            Number(
              formData.pcb_length
            )
          ),

        pcb_width:
          convertToMM(
            Number(
              formData.pcb_width
            )
          ),

        pcb_height:
          convertToMM(
            Number(
              formData.pcb_height
            )
          ),

        wall_thickness:
          convertToMM(
            Number(
              formData.wall_thickness
            )
          ),

        clearance:
          convertToMM(
            Number(
              formData.clearance
            )
          ),

        heat_analysis:
          heatData
      };

      const response =
        await axios.post(
          "http://127.0.0.1:5000/api/generate",
          payload
        );

      setResult(response.data);

      setPreviewUrl(
        `http://127.0.0.1:5000${response.data.stl_file}`
      );

      alert(
        "Enclosure Generated Successfully"
      );

    } catch (err) {

      console.log(err);

      alert(
        "Generation Failed"
      );

    }

    setLoading(false);
  };

  // =====================================
  // Ventilation Suggestion
  // =====================================

  const getSuggestion = () => {

    if (
      formData.device_type ===
      "Power Supply"
    ) {

      return "🔥 High heat device detected";

    }

    if (
      formData.device_type ===
      "Raspberry Pi"
    ) {

      return "⚠ Medium heat load";

    }

    return "✓ Normal ventilation";
  };

  return (

<div style={styles.page}>

<div style={styles.card}>

<h1>
Smart Electronics
Enclosure Generator
</h1>

<p>
SambaNova AI +
OpenSCAD
</p>

<hr/>

<h3>Units</h3>

<select
value={unit}
onChange={(e)=>
setUnit(
e.target.value
)
}
style={styles.input}
>

<option value="mm">
Millimeter
</option>

<option value="cm">
Centimeter
</option>

<option value="inch">
Inches
</option>

</select>

<h3>
Project Name
</h3>

<input
style={styles.input}
name="name"
value={formData.name}
onChange={handleChange}
/>

<h3>
PCB Length
</h3>

<input
style={styles.input}
name="pcb_length"
type="number"
value={
formData.pcb_length
}
onChange={
handleChange
}
/>

<h3>
PCB Width
</h3>

<input
style={styles.input}
name="pcb_width"
type="number"
value={
formData.pcb_width
}
onChange={
handleChange
}
/>

<h3>
Device Type
</h3>

<select
style={styles.input}
name="device_type"
value={
formData.device_type
}
onChange={
handleChange
}
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

<div
style={
styles.info
}
>

{getSuggestion()}

</div>

<button
style={
styles.button
}
onClick={
generateEnclosure
}
>

{
loading
?
"Generating..."
:
"Generate"
}

</button>

{
result && (

<div
style={
styles.result
}
>

<h2>
Success
</h2>

<p>
Job:
{
result.job_id
}
</p>

<a
href={`http://127.0.0.1:5000${result.scad_file}`}
target="_blank"
rel="noreferrer"
>

Download SCAD

</a>

<br/><br/>

<a
href={`http://127.0.0.1:5000${result.stl_file}`}
target="_blank"
rel="noreferrer"
>

Download STL

</a>

</div>

)
}

</div>

</div>

  );
}

const styles={

page:{
background:"#020617",
minHeight:"100vh",
padding:"40px",
color:"white"
},

card:{
background:"#0f172a",
maxWidth:"900px",
margin:"auto",
padding:"30px",
borderRadius:"20px",
boxShadow:
"0 0 30px rgba(0,0,0,0.5)"
},

input:{
width:"100%",
padding:"14px",
marginBottom:"20px",
background:"#1e293b",
border:"none",
color:"white",
borderRadius:"10px"
},

button:{
width:"100%",
padding:"16px",
background:
"linear-gradient(90deg,#9333ea,#2563eb)",
border:"none",
borderRadius:"12px",
color:"white",
fontSize:"18px",
cursor:"pointer"
},

info:{
background:"#1e293b",
padding:"15px",
borderRadius:"10px",
marginBottom:"20px"
},

result:{
marginTop:"30px",
padding:"20px",
background:"#1e293b",
borderRadius:"10px"
}

};