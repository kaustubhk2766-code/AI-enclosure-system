import React, { useState } from "react";
import axios from "axios";

const API =
process.env.REACT_APP_BACKEND_URL ||
"https://ai-powered-automated-electronics.onrender.com";

export default function App() {

const [loading,setLoading]=useState(false);
const [result,setResult]=useState(null);
const [previewUrl,setPreviewUrl]=useState("");
const [unit,setUnit]=useState("mm");

const [formData,setFormData]=useState({

name:"Smart Enclosure",
pcb_length:100,
pcb_width:60,
pcb_height:20,
wall_thickness:2,
clearance:2,

ventilation:true,
mounting_standoffs:true,
lid_separation:true,
rounded_corners:true,

device_type:"Arduino",
usb_cutout:"USB-C",
screw_holes:"4",

components:[]
});

const convertToMM=(value)=>{

if(unit==="cm") return value*10;

if(unit==="inch") return value*25.4;

return value;
};

const handleChange=(e)=>{

const{name,value,type,checked}=e.target;

setFormData({

...formData,
[name]:
type==="checkbox"
?checked
:value

});
};

const analyzeHeat=async()=>{

try{

const response=
await axios.post(
`${API}/api/analyze-heat`,
{
components:
formData.components
}
);

return response.data;

}

catch(err){

console.log(err);

return null;
}
};

const generateEnclosure=async()=>{

setLoading(true);

try{

const heatData=
await analyzeHeat();

const payload={

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
),

heat_analysis:
heatData

};

const response=
await axios.post(
`${API}/api/generate`,
payload
);

setResult(
response.data
);

setPreviewUrl(
`${API}${response.data.stl_file}`
);

alert(
"Enclosure Generated Successfully"
);

}

catch(err){

console.log(err);

alert(
"Generation Failed"
);
}

setLoading(false);
};

const getSuggestion=()=>{

if(
formData.device_type==="Power Supply"
){

return "🔥 High heat device detected";

}

if(
formData.device_type==="Raspberry Pi"
){

return "⚠ Medium heat device";

}

if(
formData.device_type==="Motor Driver"
){

return "⚡ Add side ventilation";

}

return "✓ Standard cooling";
};

return(

<div style={styles.page}>

<div style={styles.card}>

<h1 style={styles.title}>
Smart Electronics
Enclosure Generator
</h1>

<p style={styles.subtitle}>
Render + SambaNova + OpenSCAD
</p>

<div style={styles.box}>

<label>
Units
</label>

<select
style={styles.input}
value={unit}
onChange={(e)=>
setUnit(e.target.value)
}
>

<option value="mm">
Millimeters
</option>

<option value="cm">
Centimeters
</option>

<option value="inch">
Inches
</option>

</select>

<label>
Project Name
</label>

<input
style={styles.input}
name="name"
value={formData.name}
onChange={handleChange}
/>

<label>
PCB Length
</label>

<input
style={styles.input}
type="number"
name="pcb_length"
value={formData.pcb_length}
onChange={handleChange}
/>

<label>
PCB Width
</label>

<input
style={styles.input}
type="number"
name="pcb_width"
value={formData.pcb_width}
onChange={handleChange}
/>

<label>
PCB Height
</label>

<input
style={styles.input}
type="number"
name="pcb_height"
value={formData.pcb_height}
onChange={handleChange}
/>

<label>
Device Type
</label>

<select
style={styles.input}
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

<div style={styles.info}>
{getSuggestion()}
</div>

<button
style={styles.button}
onClick={generateEnclosure}
>

{
loading
?
"Generating..."
:
"Generate Enclosure"
}

</button>

{
result && (

<div style={styles.result}>

<h2>
Generation Successful
</h2>

<p>
Job:
{
result.job_id
}
</p>

<a
style={styles.link}
href={`${API}${result.scad_file}`}
target="_blank"
rel="noreferrer"
>

Download SCAD

</a>

<br/><br/>

<a
style={styles.link}
href={`${API}${result.stl_file}`}
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
maxWidth:"800px",
margin:"auto",
padding:"35px",
borderRadius:"25px",
boxShadow:
"0 0 30px rgba(37,99,235,.3)"
},

title:{
fontSize:"40px",
textAlign:"center"
},

subtitle:{
textAlign:"center",
color:"#94a3b8",
marginBottom:"30px"
},

box:{
display:"flex",
flexDirection:"column",
gap:"10px"
},

input:{
padding:"15px",
background:"#1e293b",
color:"white",
border:"none",
borderRadius:"10px"
},

button:{
marginTop:"20px",
padding:"16px",
fontSize:"18px",
border:"none",
borderRadius:"12px",
background:
"linear-gradient(90deg,#7c3aed,#2563eb)",
color:"white",
cursor:"pointer"
},

info:{
marginTop:"20px",
background:"#1e293b",
padding:"15px",
borderRadius:"10px"
},

result:{
marginTop:"25px",
padding:"20px",
background:"#1e293b",
borderRadius:"15px"
},

link:{
color:"#60a5fa"
}

};