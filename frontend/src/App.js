import React, { useState, useEffect, useRef } from "react";

// ============================================
// CONFIGURATION
// ============================================

const API_BASE_URL = "https://ai-powered-automated-electronics.onrender.com";

// ============================================
// INTERACTIVE THREE.JS 3D VIEWER (via iframe srcdoc)
// ============================================

function Box3DPreview({ length = 100, width = 60, height = 20, hasVents, hasLid, hasRounded }) {
  const iframeRef = useRef(null);

  const srcdoc = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #020617; overflow: hidden; }
  canvas { display: block; }
  #info {
    position: absolute; bottom: 10px; left: 0; right: 0;
    text-align: center; font-family: sans-serif;
    font-size: 11px; color: #475569; pointer-events: none;
  }
</style>
</head>
<body>
<div id="info">Drag to rotate &nbsp;·&nbsp; Scroll to zoom &nbsp;·&nbsp; Right-drag to pan</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function() {
  var W = window.innerWidth, H = window.innerHeight;
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);

  var camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 5000);
  camera.position.set(220, 160, 280);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  var dLight = new THREE.DirectionalLight(0x60a5fa, 1.2);
  dLight.position.set(200, 300, 200);
  scene.add(dLight);
  var dLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  dLight2.position.set(-200, -100, -200);
  scene.add(dLight2);

  // Grid
  var grid = new THREE.GridHelper(600, 20, 0x1e293b, 0x1e293b);
  scene.add(grid);

  // Enclosure group
  var group = new THREE.Group();
  scene.add(group);

  function buildEnclosure(L, W, H, vents, lid, rounded) {
    while (group.children.length) group.remove(group.children[0]);

    var bodyH = lid ? H * 0.8 : H;
    var lidH  = H * 0.2;

    var mat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f, metalness: 0.3, roughness: 0.55,
      transparent: true, opacity: 0.92
    });
    var edgeMat = new THREE.LineBasicMaterial({ color: 0x3b82f6 });
    var lidMat = new THREE.MeshStandardMaterial({
      color: 0x1e40af, metalness: 0.4, roughness: 0.4,
      transparent: true, opacity: 0.85
    });

    // Body box
    var bodyGeo = new THREE.BoxGeometry(L, bodyH, W);
    var body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = bodyH / 2;
    group.add(body);
    var edges = new THREE.EdgesGeometry(bodyGeo);
    var bodyEdge = new THREE.LineSegments(edges, edgeMat);
    bodyEdge.position.y = bodyH / 2;
    group.add(bodyEdge);

    // Lid
    if (lid) {
      var lidGeo = new THREE.BoxGeometry(L, lidH, W);
      var lidMesh = new THREE.Mesh(lidGeo, lidMat);
      lidMesh.position.y = bodyH + lidH / 2;
      group.add(lidMesh);
      var lidEdge = new THREE.LineSegments(new THREE.EdgesGeometry(lidGeo), new THREE.LineBasicMaterial({ color: 0x60a5fa }));
      lidEdge.position.y = bodyH + lidH / 2;
      group.add(lidEdge);
    }

    // Vent slots on front face
    if (vents) {
      var ventMat = new THREE.MeshStandardMaterial({ color: 0x000d1f });
      var slotCount = 5;
      var slotW = L * 0.7;
      var slotH = bodyH * 0.04;
      var slotD = 0.5;
      for (var i = 0; i < slotCount; i++) {
        var yPos = bodyH * 0.2 + (i / (slotCount - 1)) * bodyH * 0.6;
        var slot = new THREE.Mesh(
          new THREE.BoxGeometry(slotW, slotH, slotD + 2),
          ventMat
        );
        slot.position.set(0, yPos, W / 2 - slotD / 2);
        group.add(slot);
      }
    }

    // Standoff cylinders at corners (bottom)
    var standoffMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    var offsets = [[-L*0.38, W*0.38],[L*0.38, W*0.38],[-L*0.38,-W*0.38],[L*0.38,-W*0.38]];
    offsets.forEach(function(o) {
      var cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, bodyH * 0.6, 16),
        standoffMat
      );
      cyl.position.set(o[0], bodyH * 0.3, o[1]);
      group.add(cyl);
    });

    // USB cutout hint on side
    var usbMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    var usb = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 4), usbMat);
    usb.position.set(-L / 2 + 1, bodyH * 0.15, 0);
    group.add(usb);

    // Center group
    group.position.set(-L / 2, 0, -W / 2);
  }

  buildEnclosure(${length}, ${width}, ${height}, ${hasVents}, ${hasLid}, ${hasRounded});

  // Orbit controls (manual implementation — no import needed)
  var mouse = { x: 0, y: 0 };
  var isLeft = false, isRight = false;
  var spherical = { theta: 0.6, phi: 1.0, radius: 420 };
  var target = new THREE.Vector3(${length / 2}, ${height / 2}, ${width / 2});

  function updateCamera() {
    camera.position.x = target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    camera.position.y = target.y + spherical.radius * Math.cos(spherical.phi);
    camera.position.z = target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    camera.lookAt(target);
  }
  updateCamera();

  renderer.domElement.addEventListener('mousedown', function(e) {
    if (e.button === 0) isLeft = true;
    if (e.button === 2) isRight = true;
    mouse.x = e.clientX; mouse.y = e.clientY;
  });
  window.addEventListener('mouseup', function() { isLeft = false; isRight = false; });
  window.addEventListener('mousemove', function(e) {
    if (!isLeft && !isRight) return;
    var dx = e.clientX - mouse.x;
    var dy = e.clientY - mouse.y;
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (isLeft) {
      spherical.theta -= dx * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - dy * 0.008));
    }
    if (isRight) {
      var pan = new THREE.Vector3(-dx * 0.4, dy * 0.4, 0);
      pan.applyQuaternion(camera.quaternion);
      target.add(pan);
    }
    updateCamera();
  });
  renderer.domElement.addEventListener('wheel', function(e) {
    spherical.radius = Math.max(80, Math.min(1200, spherical.radius + e.deltaY * 0.5));
    updateCamera();
  });
  renderer.domElement.addEventListener('contextmenu', function(e) { e.preventDefault(); });

  // Touch support
  var touches = {};
  var lastPinchDist = null;
  renderer.domElement.addEventListener('touchstart', function(e) {
    for (var t of e.touches) touches[t.identifier] = { x: t.clientX, y: t.clientY };
  });
  renderer.domElement.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      var t = e.touches[0];
      var prev = touches[t.identifier];
      if (prev) {
        spherical.theta -= (t.clientX - prev.x) * 0.008;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - (t.clientY - prev.y) * 0.008));
        updateCamera();
      }
      touches[t.identifier] = { x: t.clientX, y: t.clientY };
    } else if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.sqrt(dx*dx + dy*dy);
      if (lastPinchDist) {
        spherical.radius = Math.max(80, Math.min(1200, spherical.radius - (dist - lastPinchDist) * 1.5));
        updateCamera();
      }
      lastPinchDist = dist;
    }
  }, { passive: false });
  renderer.domElement.addEventListener('touchend', function(e) {
    lastPinchDist = null;
    for (var t of e.changedTouches) delete touches[t.identifier];
  });

  // Listen for dimension updates from parent React
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'UPDATE_ENCLOSURE') {
      var d = e.data;
      buildEnclosure(d.length, d.width, d.height, d.hasVents, d.hasLid, d.hasRounded);
      target.set(d.length / 2, d.height / 2, d.width / 2);
      updateCamera();
    }
  });

  window.addEventListener('resize', function() {
    W = window.innerWidth; H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  (function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  })();
})();
</script>
</body>
</html>`;

  // Send updates to iframe when props change
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: "UPDATE_ENCLOSURE", length, width, height, hasVents, hasLid, hasRounded
      }, "*");
    }
  }, [length, width, height, hasVents, hasLid, hasRounded]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcdoc}
      style={{ width: "100%", height: "100%", border: "none", borderRadius: "20px", display: "block" }}
      title="3D Enclosure Preview"
      sandbox="allow-scripts"
    />
  );
}

// ============================================
// FEATURE CHECKBOX COMPONENT
// ============================================

function FeatureCheckbox({ label, sublabel, name, checked, onChange }) {
  return (
    <label style={styles.featureCard}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        style={styles.checkboxInput}
      />
      <div style={styles.featureCheckContent}>
        <div style={styles.featureLabel}>{label}</div>
        <div style={styles.featureSub}>{sublabel}</div>
      </div>
    </label>
  );
}

// ============================================
// MAIN APP
// ============================================

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [unit, setUnit] = useState("mm");
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [tempApiKey, setTempApiKey] = useState("");
  const [heatAnalysis, setHeatAnalysis] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [error, setError] = useState("");
  const [downloadingStl, setDownloadingStl] = useState(false);
  const [downloadingScad, setDownloadingScad] = useState(false);

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

  const COMPONENT_DATABASE = {
    "CPU/Processor": { maxTemp: 85, heatOutput: "high", ventilationNeeded: "critical" },
    "GPU/Graphics": { maxTemp: 80, heatOutput: "high", ventilationNeeded: "critical" },
    "Power Supply": { maxTemp: 75, heatOutput: "high", ventilationNeeded: "critical" },
    "Motor Driver": { maxTemp: 70, heatOutput: "high", ventilationNeeded: "critical" },
    "Voltage Regulator": { maxTemp: 75, heatOutput: "medium", ventilationNeeded: "high" },
    "Transformer": { maxTemp: 80, heatOutput: "medium", ventilationNeeded: "high" },
    "Inductor/Coil": { maxTemp: 85, heatOutput: "medium", ventilationNeeded: "high" },
    "RF Amplifier": { maxTemp: 70, heatOutput: "high", ventilationNeeded: "critical" },
    "Microcontroller": { maxTemp: 85, heatOutput: "low", ventilationNeeded: "low" },
    "Memory (RAM/Flash)": { maxTemp: 85, heatOutput: "low", ventilationNeeded: "low" },
    "Sensor": { maxTemp: 80, heatOutput: "low", ventilationNeeded: "low" },
    "LED": { maxTemp: 70, heatOutput: "low", ventilationNeeded: "low" },
    "Capacitor": { maxTemp: 105, heatOutput: "low", ventilationNeeded: "low" },
    "Resistor": { maxTemp: 125, heatOutput: "low", ventilationNeeded: "low" },
    "Connector": { maxTemp: 100, heatOutput: "low", ventilationNeeded: "low" },
    "Battery": { maxTemp: 60, heatOutput: "medium", ventilationNeeded: "medium" },
    "Wireless Module (WiFi/BLE)": { maxTemp: 75, heatOutput: "low", ventilationNeeded: "low" },
    "Display (LCD/OLED)": { maxTemp: 80, heatOutput: "low", ventilationNeeded: "low" }
  };

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("enclosure_api_key");
      if (savedKey) setApiKey(savedKey);
    } catch (_) {}
  }, []);

  const saveApiKey = () => {
    if (tempApiKey.trim()) {
      try { localStorage.setItem("enclosure_api_key", tempApiKey); } catch (_) {}
      setApiKey(tempApiKey);
      setShowApiModal(false);
      setTempApiKey("");
      setError("");
    } else {
      setError("Please enter a valid API key");
    }
  };

  const clearApiKey = () => {
    if (window.confirm("Are you sure you want to clear the API key?")) {
      try { localStorage.removeItem("enclosure_api_key"); } catch (_) {}
      setApiKey("");
    }
  };

  const analyzeHeat = () => {
    if (selectedComponents.length === 0) {
      setError("Please select at least one component");
      return;
    }
    setError("");
    let totalHeat = 0;
    let criticalCount = 0;
    let maxTemp = 0;
    const componentAnalysis = [];

    selectedComponents.forEach((comp) => {
      const compData = COMPONENT_DATABASE[comp];
      if (compData) {
        componentAnalysis.push({ name: comp, ...compData });
        if (compData.ventilationNeeded === "critical") criticalCount++;
        maxTemp = Math.max(maxTemp, compData.maxTemp);
        if (compData.heatOutput === "high") totalHeat += 3;
        else if (compData.heatOutput === "medium") totalHeat += 2;
        else totalHeat += 1;
      }
    });

    const calcVent = (h, c) => {
      if (c >= 2 || h >= 8) return "Maximum ventilation (8-12 slots)";
      if (c === 1 || h >= 5) return "High ventilation (6-8 slots)";
      if (h >= 3) return "Medium ventilation (4-6 slots)";
      return "Basic ventilation (2-4 slots)";
    };
    const calcSlots = (h) => {
      if (h >= 8) return { min: 8, max: 12 };
      if (h >= 5) return { min: 6, max: 8 };
      if (h >= 3) return { min: 4, max: 6 };
      return { min: 2, max: 4 };
    };
    const calcCFM = (h) => {
      if (h >= 8) return "80-120 CFM";
      if (h >= 5) return "60-80 CFM";
      if (h >= 3) return "40-60 CFM";
      return "20-40 CFM";
    };

    setHeatAnalysis({
      totalHeatLoad: totalHeat,
      maxTemp,
      criticalComponents: criticalCount,
      recommendedVentilation: calcVent(totalHeat, criticalCount),
      ventilationSlots: calcSlots(totalHeat),
      airflowCFM: calcCFM(totalHeat),
      componentAnalysis
    });
    setShowSuggestions(true);
  };

  const convertToMM = (value) => {
    if (unit === "cm") return value * 10;
    if (unit === "inch") return value * 25.4;
    return value;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleComponentToggle = (component) => {
    setSelectedComponents((prev) =>
      prev.includes(component) ? prev.filter((c) => c !== component) : [...prev, component]
    );
  };

  // ─── FIXED: blob-based download to bypass CORS / navigation issues ───
  const downloadFile = async (url, filename, setLoadingFn) => {
    if (!url) return;
    setLoadingFn(true);
    try {
      const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(`Download failed: ${err.message}. Try right-clicking the link and "Save As".`);
    } finally {
      setLoadingFn(false);
    }
  };

  const generateEnclosure = async () => {
    setError("");
    if (!apiKey) {
      setError("Please set your API key first");
      setShowApiModal(true);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        pcb_length: convertToMM(Number(formData.pcb_length)),
        pcb_width: convertToMM(Number(formData.pcb_width)),
        pcb_height: convertToMM(Number(formData.pcb_height)),
        wall_thickness: convertToMM(Number(formData.wall_thickness)),
        clearance: convertToMM(Number(formData.clearance)),
        api_key: apiKey,
        components: selectedComponents,
        heat_analysis: heatAnalysis
      };

      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(`Generation Failed: ${err.message}`);
    }
    setLoading(false);
  };

  const getSuggestion = () => {
    if (selectedComponents.length > 0) {
      const hasHigh = selectedComponents.some(
        (c) => COMPONENT_DATABASE[c]?.ventilationNeeded === "critical"
      );
      const hasMedium = selectedComponents.some(
        (c) => COMPONENT_DATABASE[c]?.ventilationNeeded === "high"
      );
      if (hasHigh) return { text: "🔥 High-performance components detected → Maximum ventilation needed", color: "#ef4444" };
      if (hasMedium) return { text: "⚠️ Moderate heat components detected → Increased ventilation recommended", color: "#facc15" };
      return { text: "✓ Low heat components → Standard ventilation sufficient", color: "#22c55e" };
    }
    if (formData.device_type === "Power Supply") return { text: "🔥 High heat device detected → Increase ventilation slots", color: "#ef4444" };
    if (formData.device_type === "Raspberry Pi") return { text: "⚠️ Moderate heat device → Medium ventilation recommended", color: "#facc15" };
    if (formData.device_type === "Motor Driver") return { text: "⚡ Motor driver may heat up → Add side vents", color: "#fb923c" };
    return { text: "✓ Normal heat device detected. Standard ventilation is sufficient.", color: "#22c55e" };
  };

  const suggestion = getSuggestion();

  const stlUrl = result?.stl_file
    ? result.stl_file.startsWith("http") ? result.stl_file : `${API_BASE_URL}${result.stl_file}`
    : null;
  const scadUrl = result?.scad_file
    ? result.scad_file.startsWith("http") ? result.scad_file : `${API_BASE_URL}${result.scad_file}`
    : null;

  return (
    <div style={styles.page}>
      {/* API Modal */}
      {showApiModal && (
        <div style={styles.modalOverlay} onClick={() => setShowApiModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>🔑 API Key Management</h2>
            <p style={styles.modalDesc}>Enter your API key to enable enclosure generation</p>
            <input
              type="password"
              placeholder="Enter your API key"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveApiKey()}
              style={styles.apiKeyInput}
            />
            {error && <div style={styles.errorMessage}>{error}</div>}
            <div style={styles.modalButtons}>
              <button onClick={saveApiKey} style={styles.saveButton}>Save API Key</button>
              <button onClick={() => setShowApiModal(false)} style={styles.cancelButton}>Cancel</button>
            </div>
            {apiKey && (
              <button onClick={clearApiKey} style={styles.clearButton}>Clear Saved API Key</button>
            )}
          </div>
        </div>
      )}

      {/* Heat Suggestions Modal */}
      {showSuggestions && heatAnalysis && (
        <div style={styles.modalOverlay} onClick={() => setShowSuggestions(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>🌡️ Heat Analysis Report</h2>
            <div style={styles.summaryGrid}>
              {[
                { label: "Total Heat Load", value: heatAnalysis.totalHeatLoad },
                { label: "Max Temperature", value: `${heatAnalysis.maxTemp}°C` },
                { label: "Critical Components", value: heatAnalysis.criticalComponents },
                { label: "Required Airflow", value: heatAnalysis.airflowCFM }
              ].map((item) => (
                <div key={item.label} style={styles.summaryCard}>
                  <div style={styles.summaryLabel}>{item.label}</div>
                  <div style={{ ...styles.summaryValue, fontSize: String(item.value).length > 5 ? "16px" : "24px" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.recommendationBox}>
              <h3 style={styles.recTitle}>Ventilation Recommendation</h3>
              <div style={styles.recContent}>{heatAnalysis.recommendedVentilation}</div>
              <div style={styles.slotInfo}>
                Suggested slot count: {heatAnalysis.ventilationSlots.min}–{heatAnalysis.ventilationSlots.max} slots
              </div>
            </div>
            <div style={styles.componentDetails}>
              <h3 style={styles.detailsTitle}>Component Analysis</h3>
              {heatAnalysis.componentAnalysis.map((comp, idx) => (
                <div key={idx} style={styles.componentRow}>
                  <div style={styles.compName}>{comp.name}</div>
                  <div style={styles.compInfo}>
                    <span style={styles.compTemp}>Max: {comp.maxTemp}°C</span>
                    <span style={{
                      ...styles.compBadge,
                      background: comp.ventilationNeeded === "critical" ? "#ef4444"
                        : comp.ventilationNeeded === "high" ? "#d97706" : "#16a34a"
                    }}>
                      {comp.ventilationNeeded.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSuggestions(false)} style={styles.closeButton}>Close</button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>⚡ Enclosure AI</h2>
        <div style={styles.menuActive}>🏠 Dashboard</div>
        <div style={styles.menu}>📁 Designs</div>
        <div style={styles.menu}>⚙ Settings</div>
        <div style={styles.apiStatusSection}>
          <div style={styles.apiStatusLabel}>{apiKey ? "✅ API Connected" : "❌ No API Key"}</div>
          <button onClick={() => setShowApiModal(true)} style={styles.apiButton}>
            {apiKey ? "Manage Key" : "Set API Key"}
          </button>
        </div>
        <div style={styles.tipsSection}>
          <div style={styles.tipsHeader}>💡 Tips</div>
          <div style={styles.tipsList}>
            <div style={styles.tipItem}>Select components for accurate ventilation sizing.</div>
            <div style={styles.tipItem}>Higher heat devices need more ventilation slots.</div>
            <div style={styles.tipItem}>Use "Analyze Heat" before generating for best results.</div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>Smart Electronics Enclosure Generator</h1>
          <p style={styles.subtitle}>AI-Assisted OpenSCAD Designer with Heat Analysis</p>
        </div>

        {error && <div style={styles.globalError}>{error}</div>}

        <div style={styles.layout}>
          {/* LEFT COLUMN */}
          <div>
            {/* PCB & Dimensions */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>📐 PCB & Dimensions</h2>
              <div style={styles.unitRow}>
                <label style={styles.label}>Units</label>
                <select style={styles.select} value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="inch">inch</option>
                </select>
              </div>
              <div style={styles.grid}>
                {[
                  { label: "Project Name", name: "name", type: "text" },
                  { label: "PCB Length", name: "pcb_length", type: "number" },
                  { label: "PCB Width", name: "pcb_width", type: "number" },
                  { label: "PCB Height", name: "pcb_height", type: "number" },
                  { label: "Wall Thickness", name: "wall_thickness", type: "number" },
                  { label: "Clearance", name: "clearance", type: "number" }
                ].map(({ label, name, type }) => (
                  <div key={name}>
                    <label style={styles.label}>{label}</label>
                    <input
                      style={styles.input}
                      type={type}
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Device & Features */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>🔧 Device & Features</h2>
              <label style={styles.label}>Device Type</label>
              <select style={styles.select} name="device_type" value={formData.device_type} onChange={handleChange}>
                <option>Arduino</option>
                <option>Raspberry Pi</option>
                <option>Power Supply</option>
                <option>Motor Driver</option>
              </select>
              <div style={styles.featureGrid}>
                <FeatureCheckbox label="Ventilation" sublabel="Cooling vents" name="ventilation" checked={formData.ventilation} onChange={handleChange} />
                <FeatureCheckbox label="Mounting" sublabel="PCB holes" name="mounting_standoffs" checked={formData.mounting_standoffs} onChange={handleChange} />
                <FeatureCheckbox label="Lid Separation" sublabel="Separate lid" name="lid_separation" checked={formData.lid_separation} onChange={handleChange} />
                <FeatureCheckbox label="Rounded Corners" sublabel="Smooth edges" name="rounded_corners" checked={formData.rounded_corners} onChange={handleChange} />
              </div>
              <div style={{ ...styles.suggestion, borderLeft: `5px solid ${suggestion.color}` }}>
                {suggestion.text}
              </div>
            </div>

            {/* Components */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>🧩 Heat-Sensitive Components</h2>
              <p style={styles.componentDesc}>Select components for accurate ventilation sizing:</p>
              <div style={styles.componentGrid}>
                {Object.keys(COMPONENT_DATABASE).map((component) => (
                  <label
                    key={component}
                    style={{
                      ...styles.componentCheckbox,
                      background: selectedComponents.includes(component) ? "#4f46e520" : "#0f172a",
                      borderColor: selectedComponents.includes(component) ? "#6366f1" : "#334155"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedComponents.includes(component)}
                      onChange={() => handleComponentToggle(component)}
                      style={styles.checkboxInput}
                    />
                    <span style={styles.componentLabel}>{component}</span>
                  </label>
                ))}
              </div>
              <button onClick={analyzeHeat} style={styles.analyzeButton}>
                📊 Analyze Heat & Get Suggestions
              </button>
            </div>

            {/* Cutouts */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>🔌 Cutouts & Openings</h2>
              <div style={styles.grid}>
                <div>
                  <label style={styles.label}>USB Cutout</label>
                  <select style={styles.select} name="usb_cutout" value={formData.usb_cutout} onChange={handleChange}>
                    <option>USB-C</option>
                    <option>Micro USB</option>
                    <option>USB-A</option>
                    <option>None</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Screw Holes</label>
                  <select style={styles.select} name="screw_holes" value={formData.screw_holes} onChange={handleChange}>
                    <option>2</option>
                    <option>4</option>
                    <option>6</option>
                    <option>8</option>
                  </select>
                </div>
              </div>
              <button
                style={{ ...styles.generateButton, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                onClick={generateEnclosure}
                disabled={loading}
              >
                {loading ? "⏳ Generating..." : "✨ Generate Enclosure"}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* 3D Preview */}
            <div style={styles.previewCard}>
              <h2 style={styles.cardTitle}>🧊 3D Preview</h2>
              <div style={styles.previewBox}>
                <Box3DPreview
                  length={convertToMM(Number(formData.pcb_length)) + Number(formData.wall_thickness) * 2 + Number(formData.clearance) * 2}
                  width={convertToMM(Number(formData.pcb_width)) + Number(formData.wall_thickness) * 2 + Number(formData.clearance) * 2}
                  height={convertToMM(Number(formData.pcb_height)) + Number(formData.wall_thickness) + Number(formData.clearance)}
                  hasVents={formData.ventilation}
                  hasLid={formData.lid_separation}
                  hasRounded={formData.rounded_corners}
                />
              </div>
              <div style={styles.previewControls}>Live preview updates as you change dimensions</div>
            </div>

            {/* Result */}
            {result && (
              <div style={styles.resultCard}>
                <h2 style={styles.resultTitle}>✅ Generation Success</h2>
                <p style={styles.resultText}>Your enclosure has been generated successfully!</p>

                {result.job_id && (
                  <div style={styles.jobBox}>
                    <strong>Job ID:</strong>
                    <div style={styles.jobId}>{result.job_id}</div>
                  </div>
                )}

                <div style={styles.downloadGrid}>
                  {/* SCAD download */}
                  {scadUrl && (
                    <button
                      onClick={() => downloadFile(scadUrl, `${formData.name || "enclosure"}.scad`, setDownloadingScad)}
                      disabled={downloadingScad}
                      style={{ ...styles.downloadButtonPurple, opacity: downloadingScad ? 0.7 : 1, cursor: downloadingScad ? "wait" : "pointer", border: "none" }}
                    >
                      {downloadingScad ? "⏳ Downloading…" : "📄 Download SCAD"}
                    </button>
                  )}

                  {/* STL download */}
                  {stlUrl && (
                    <button
                      onClick={() => downloadFile(stlUrl, `${formData.name || "enclosure"}.stl`, setDownloadingStl)}
                      disabled={downloadingStl}
                      style={{ ...styles.downloadButtonBlue, opacity: downloadingStl ? 0.7 : 1, cursor: downloadingStl ? "wait" : "pointer", border: "none" }}
                    >
                      {downloadingStl ? "⏳ Downloading…" : "🧊 Download STL"}
                    </button>
                  )}
                </div>

                {/* Fallback direct links in case blob download fails */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                  {scadUrl && (
                    <a href={scadUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#94a3b8" }}>
                      ↗ Open SCAD directly
                    </a>
                  )}
                  {stlUrl && (
                    <a href={stlUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#94a3b8" }}>
                      ↗ Open STL directly
                    </a>
                  )}
                </div>

                <div style={styles.generatedDate}>
                  Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STYLES
// ============================================

const styles = {
  page: { display: "flex", minHeight: "100vh", background: "#020617", color: "white", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  sidebar: { width: "220px", background: "#081120", padding: "30px 20px", borderRight: "1px solid #1e293b", overflowY: "auto" },
  logo: { marginBottom: "40px", fontSize: "24px", margin: "0 0 40px 0" },
  menu: { padding: "14px", marginBottom: "10px", borderRadius: "12px", background: "#0f172a", cursor: "pointer" },
  menuActive: { padding: "14px", marginBottom: "10px", borderRadius: "12px", background: "linear-gradient(90deg,#7c3aed,#2563eb)", cursor: "pointer", fontWeight: "bold" },
  apiStatusSection: { marginTop: "30px", padding: "16px", background: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b" },
  apiStatusLabel: { fontSize: "13px", fontWeight: "bold", marginBottom: "10px", color: "#cbd5e1" },
  apiButton: { width: "100%", padding: "10px", background: "#4f46e5", border: "none", color: "white", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" },
  tipsSection: { marginTop: "20px", padding: "16px", background: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b" },
  tipsHeader: { fontSize: "13px", fontWeight: "bold", marginBottom: "12px", color: "#cbd5e1" },
  tipsList: { display: "flex", flexDirection: "column", gap: "10px" },
  tipItem: { fontSize: "12px", color: "#94a3b8", lineHeight: "1.5" },
  main: { flex: 1, padding: "40px", overflowY: "auto" },
  header: { marginBottom: "30px" },
  title: { fontSize: "36px", margin: "0 0 8px 0", background: "linear-gradient(90deg,#38bdf8,#d946ef)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  subtitle: { color: "#94a3b8", marginTop: "8px" },
  layout: { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "30px" },
  card: { background: "#071224", padding: "28px", borderRadius: "22px", marginBottom: "25px", border: "1px solid #1e293b", boxShadow: "0 0 25px rgba(59,130,246,0.1)" },
  previewCard: { background: "#071224", padding: "28px", borderRadius: "22px", border: "1px solid #1e293b", boxShadow: "0 0 25px rgba(59,130,246,0.1)" },
  cardTitle: { marginBottom: "25px", fontSize: "20px", fontWeight: "600", margin: "0 0 25px 0" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  label: { display: "block", marginBottom: "8px", color: "#cbd5e1", fontSize: "14px", fontWeight: "500" },
  input: { width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #475569", background: "#0f172a", color: "white", boxSizing: "border-box", outline: "none" },
  select: { width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #475569", background: "#0f172a", color: "white", marginBottom: "20px", cursor: "pointer", boxSizing: "border-box" },
  featureGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px", marginBottom: "20px" },
  featureCard: { background: "#0f172a", padding: "16px", borderRadius: "14px", display: "flex", gap: "10px", alignItems: "flex-start", cursor: "pointer", border: "1px solid #1e293b" },
  checkboxInput: { width: "18px", height: "18px", cursor: "pointer", marginTop: "2px", flexShrink: 0 },
  featureCheckContent: { display: "flex", flexDirection: "column" },
  featureLabel: { fontWeight: "bold", fontSize: "14px" },
  featureSub: { fontSize: "12px", color: "#94a3b8", marginTop: "4px" },
  componentDesc: { fontSize: "14px", color: "#94a3b8", margin: "0 0 16px 0" },
  componentGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "20px" },
  componentCheckbox: { background: "#0f172a", border: "1px solid #334155", padding: "12px", borderRadius: "10px", display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" },
  componentLabel: { fontSize: "13px", color: "#cbd5e1", fontWeight: "500" },
  analyzeButton: { width: "100%", padding: "16px", background: "linear-gradient(90deg,#a855f7,#7c3aed)", border: "none", color: "white", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" },
  suggestion: { marginTop: "25px", padding: "16px", background: "#0f172a", borderRadius: "12px", fontSize: "14px", border: "1px solid #1e293b" },
  generateButton: { marginTop: "25px", width: "100%", padding: "18px", border: "none", borderRadius: "14px", background: "linear-gradient(90deg,#7c3aed,#2563eb)", color: "white", fontSize: "18px", cursor: "pointer", fontWeight: "bold" },
  previewBox: { height: "420px", borderRadius: "20px", overflow: "hidden", background: "radial-gradient(ellipse at center, #0a1929 0%, #020617 100%)", marginBottom: "16px", position: "relative" },
  previewControls: { textAlign: "center", color: "#64748b", fontSize: "13px", padding: "12px 0" },
  resultCard: { background: "#071224", marginTop: "25px", padding: "28px", borderRadius: "22px", border: "1px solid #1e293b" },
  resultTitle: { color: "#4ade80", fontSize: "24px", fontWeight: "600", margin: "0 0 12px 0" },
  resultText: { color: "#cbd5e1", fontSize: "15px", marginBottom: "20px" },
  jobBox: { background: "#0f172a", padding: "16px", borderRadius: "12px", marginBottom: "20px", fontSize: "14px" },
  jobId: { background: "#111827", padding: "12px", borderRadius: "8px", marginTop: "8px", wordBreak: "break-all", fontFamily: "monospace", fontSize: "12px" },
  downloadGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "12px" },
  downloadButtonPurple: { display: "block", background: "#7c3aed", padding: "14px", textAlign: "center", borderRadius: "12px", color: "white", fontWeight: "bold", fontSize: "14px" },
  downloadButtonBlue: { display: "block", background: "#2563eb", padding: "14px", textAlign: "center", borderRadius: "12px", color: "white", fontWeight: "bold", fontSize: "14px" },
  generatedDate: { fontSize: "12px", color: "#64748b", textAlign: "center", paddingTop: "12px", borderTop: "1px solid #1e293b" },
  unitRow: { display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px" },
  globalError: { background: "#7f1d1d", border: "1px solid #ef4444", color: "#fca5a5", padding: "16px", borderRadius: "12px", marginBottom: "20px", fontSize: "14px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#071224", border: "1px solid #1e293b", borderRadius: "24px", padding: "32px", maxWidth: "600px", width: "90%", maxHeight: "80vh", overflowY: "auto" },
  modalTitle: { fontSize: "24px", margin: "0 0 12px 0", color: "white" },
  modalDesc: { fontSize: "14px", color: "#94a3b8", marginBottom: "20px" },
  apiKeyInput: { width: "100%", padding: "14px 16px", background: "#0f172a", border: "1px solid #334155", borderRadius: "12px", color: "white", fontSize: "15px", marginBottom: "20px", boxSizing: "border-box", outline: "none" },
  errorMessage: { background: "#7f1d1d", color: "#fca5a5", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" },
  modalButtons: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" },
  saveButton: { background: "linear-gradient(90deg,#7c3aed,#4f46e5)", border: "none", color: "white", padding: "12px 16px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  cancelButton: { background: "#334155", border: "none", color: "white", padding: "12px 16px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  clearButton: { background: "#ef4444", border: "none", color: "white", padding: "12px 16px", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", width: "100%", marginTop: "8px" },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "16px", marginBottom: "24px" },
  summaryCard: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px", textAlign: "center" },
  summaryLabel: { fontSize: "12px", color: "#94a3b8", marginBottom: "8px" },
  summaryValue: { fontWeight: "bold", color: "#4ade80" },
  recommendationBox: { background: "#0f172a", border: "2px solid #4ade80", borderRadius: "12px", padding: "16px", marginBottom: "24px" },
  recTitle: { margin: "0 0 8px 0", fontSize: "16px", color: "white" },
  recContent: { fontSize: "14px", color: "#cbd5e1", marginBottom: "8px", fontWeight: "bold" },
  slotInfo: { fontSize: "12px", color: "#94a3b8" },
  componentDetails: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px", marginBottom: "24px" },
  detailsTitle: { margin: "0 0 16px 0", fontSize: "16px", color: "white" },
  componentRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid #1e293b", marginBottom: "12px" },
  compName: { fontSize: "14px", color: "#cbd5e1", fontWeight: "500" },
  compInfo: { display: "flex", gap: "8px", alignItems: "center" },
  compTemp: { fontSize: "12px", color: "#94a3b8" },
  compBadge: { fontSize: "10px", padding: "4px 8px", borderRadius: "6px", color: "white", fontWeight: "bold" },
  closeButton: { width: "100%", padding: "12px 16px", background: "linear-gradient(90deg,#7c3aed,#4f46e5)", border: "none", color: "white", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }
};
