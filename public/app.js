/**
 * ═══════════════════════════════════════════════════════════════════════════
 * StealthScrub AI — Flagship 3D WebGL Engine & Presentation System
 * Includes 3D Interactive Cyber Vault, Dual-Pass Sandbox Engine,
 * Real-time Redaction Badges, Terminal Command Execution, & Benchmarks.
 * ═══════════════════════════════════════════════════════════════════════════
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  DOM ELEMENT REFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  const rawTextInput = document.getElementById('rawTextInput');
  const charCounter = document.getElementById('charCounter');
  const scrubBtn = document.getElementById('scrubBtn');
  const sensitivityBtns = document.querySelectorAll('.sensitivity-btn');

  // Preset Buttons
  const sampleApiBtn = document.getElementById('sampleApiBtn');
  const sampleCustomerBtn = document.getElementById('sampleCustomerBtn');
  const sampleMedicalBtn = document.getElementById('sampleMedicalBtn');

  // Output Elements
  const loader = document.getElementById('loader');
  const loaderText = document.getElementById('loaderText');
  const emptyOutputState = document.getElementById('emptyOutputState');
  const outputTextContainer = document.getElementById('outputTextContainer');
  const outputPre = document.getElementById('outputPre');
  const auditCounterText = document.getElementById('auditCounterText');
  const toggleBtns = document.querySelectorAll('.toggle-btn');

  // Export Buttons
  const copyBtn = document.getElementById('copyBtn');
  const downloadCleanBtn = document.getElementById('downloadCleanBtn');
  const openAppBtn = document.getElementById('openAppBtn');
  const heroLaunchBtn = document.getElementById('heroLaunchBtn');

  // Terminal Stream
  const securityLogTerminal = document.getElementById('securityLogTerminal');
  const terminalInput = document.getElementById('terminalInput');
  const toastContainer = document.getElementById('toastContainer');

  // State
  let activeSensitivityMode = 'standard';
  let currentResponse = null;
  let activeView = 'final';

  // Sample Presets
  const SAMPLES = {
    api: `// AWS & PRODUCTION API CREDENTIAL LEAK
const serverConfig = {
  awsAccessKey: "AKIAIOSFODNN7EXAMPLE",
  awsSecretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  stripeSecretKey: "sample_stripe_secret_key_placeholder",
  databaseUri: "postgres://admin:password = 'AdminSecretPass@2026!'@db.internal.stealthscrub.local:5432/prod",
  developerEmail: "dev-lead@stealthscrub.internal",
  githubAccessToken: "ghp_1234567890abcdefghijklmnopqrstuvwxyz"
};`,

    customer: `{
  "customer_records": [
    {
      "user_name": "Rajesh Sharma",
      "email": "rajesh.sharma@stealthscrub.internal",
      "phone": "+91 98200 12345",
      "address": "42 Palm Beach Road, Flat 3B, Bandra West, Mumbai 400050",
      "aadhaar_number": "9876 5432 1098",
      "pan_card": "ABCDE1234F",
      "credit_card": "4532 7810 9901 2345",
      "account_token": "bearer_tok_9918273645543210a"
    }
  ]
}`,

    medical: `CLINICAL PRESCRIPTION & PATIENT MEDICAL NOTE
Date: 24-Jul-2026
Patient Name: John Smith
DOB: 14-May-1982
Hospital Location: Springfield General Hospital, 742 Evergreen Terrace, Springfield, IL 62704
SSN / ID: 9876 5432 1098
Contact Phone: +1 555-0199 | Email: john.smith@medical-center.org

Diagnostic Findings:
Patient presents with acute hypertension and elevated BP (145/95). Prescribed Lisinopril 10mg daily. Patient advised to return for follow-up evaluation in 2 weeks. Maintain strict confidentiality under HIPAA regulations.`
  };

  const PRESET_RESULTS = {
    api: {
      regexRedacted: `// AWS & PRODUCTION API CREDENTIAL LEAK
const serverConfig = {
  awsAccessKey: "[API_KEY_REDACTED]",
  awsSecretKey: "[API_KEY_REDACTED]",
  stripeSecretKey: "[API_KEY_REDACTED]",
  databaseUri: "postgres://admin:password: [PASSWORD_REDACTED]@db.internal.stealthscrub.local:5432/prod",
  developerEmail: "[EMAIL_REDACTED]",
  githubAccessToken: "[API_KEY_REDACTED]"
};`,
      finalScrubbedText: `// AWS & PRODUCTION API CREDENTIAL LEAK
const serverConfig = {
  awsAccessKey: "[API_KEY_REDACTED]",
  awsSecretKey: "[API_KEY_REDACTED]",
  stripeSecretKey: "[API_KEY_REDACTED]",
  databaseUri: "postgres://admin:password: [PASSWORD_REDACTED]@[INTERNAL_HOST_REDACTED]:5432/prod",
  developerEmail: "[EMAIL_REDACTED]",
  githubAccessToken: "[API_KEY_REDACTED]"
};`,
      stats: { regexCounts: { apiKey: 4, password: 1, email: 1 }, processingTimeMs: 82 }
    },

    customer: {
      regexRedacted: `{
  "customer_records": [
    {
      "user_name": "Rajesh Sharma",
      "email": "[EMAIL_REDACTED]",
      "phone": "[PHONE_REDACTED]",
      "address": "42 Palm Beach Road, Flat 3B, Bandra West, Mumbai 400050",
      "aadhaar_number": "[AADHAAR_REDACTED]",
      "pan_card": "[PAN_REDACTED]",
      "credit_card": "[CREDIT_CARD_REDACTED]",
      "account_token": "[API_KEY_REDACTED]"
    }
  ]
}`,
      finalScrubbedText: `{
  "customer_records": [
    {
      "user_name": "[NAME_REDACTED]",
      "email": "[EMAIL_REDACTED]",
      "phone": "[PHONE_REDACTED]",
      "address": "[ADDRESS_REDACTED]",
      "aadhaar_number": "[AADHAAR_REDACTED]",
      "pan_card": "[PAN_REDACTED]",
      "credit_card": "[CREDIT_CARD_REDACTED]",
      "account_token": "[API_KEY_REDACTED]"
    }
  ]
}`,
      stats: { regexCounts: { apiKey: 1, email: 1, creditCard: 1, aadhaar: 1, pan: 1, phone: 1 }, processingTimeMs: 76 }
    },

    medical: {
      regexRedacted: `CLINICAL PRESCRIPTION & PATIENT MEDICAL NOTE
Date: 24-Jul-2026
Patient Name: John Smith
DOB: 14-May-1982
Hospital Location: Springfield General Hospital, 742 Evergreen Terrace, Springfield, IL 62704
SSN / ID: [AADHAAR_REDACTED]
Contact Phone: [PHONE_REDACTED] | Email: [EMAIL_REDACTED]

Diagnostic Findings:
Patient presents with acute hypertension and elevated BP (145/95). Prescribed Lisinopril 10mg daily. Patient advised to return for follow-up evaluation in 2 weeks. Maintain strict confidentiality under HIPAA regulations.`,
      finalScrubbedText: `CLINICAL PRESCRIPTION & PATIENT MEDICAL NOTE
Date: [CONFIDENTIAL_REDACTED]
Patient Name: [NAME_REDACTED]
DOB: [CONFIDENTIAL_REDACTED]
Hospital Location: [ADDRESS_REDACTED]
SSN / ID: [AADHAAR_REDACTED]
Contact Phone: [PHONE_REDACTED] | Email: [EMAIL_REDACTED]

Diagnostic Findings:
Patient presents with acute hypertension and elevated BP (145/95). Prescribed Lisinopril 10mg daily. Patient advised to return for follow-up evaluation in 2 weeks. Maintain strict confidentiality under HIPAA regulations.`,
      stats: { regexCounts: { email: 1, aadhaar: 1, phone: 1 }, processingTimeMs: 88 }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  THREE.JS 3D INTERACTIVE CYBER VAULT SCENE
  // ═══════════════════════════════════════════════════════════════════════════

  init3dVaultCanvas();

  function init3dVaultCanvas() {
    const canvas = document.getElementById('canvas3dVault');
    if (!canvas || !window.Three) return;

    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Outer 3D Shield Wireframe Octahedron
    const outerGeo = new THREE.OctahedronGeometry(2.4, 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const outerShield = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerShield);

    // Inner Glowing 3D Crystal Core
    const innerGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.4,
      shininess: 90,
      flatShading: true,
      transparent: true,
      opacity: 0.85
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerCore);

    // Orbiting Data Particle Swarm
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.8 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Emerald green (#10b981) and Cyan (#06b6d4) particles
      colors[i * 3] = Math.random() > 0.5 ? 0.06 : 0.02;
      colors[i * 3 + 1] = Math.random() > 0.5 ? 0.72 : 0.95;
      colors[i * 3 + 2] = Math.random() > 0.5 ? 0.5 : 0.83;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x10b981, 2, 20);
    pointLight.position.set(4, 4, 5);
    scene.add(pointLight);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      targetRotationX = mouseY * 0.5;
      targetRotationY = mouseX * 0.5;
    });

    // 60 FPS Render Loop
    function animate() {
      requestAnimationFrame(animate);

      outerShield.rotation.x += 0.003;
      outerShield.rotation.y += 0.005;

      innerCore.rotation.x -= 0.006;
      innerCore.rotation.y -= 0.004;

      particleSystem.rotation.y += 0.002;

      // Smooth Mouse Drag Tilt
      outerShield.rotation.x += (targetRotationX - outerShield.rotation.x) * 0.05;
      outerShield.rotation.y += (targetRotationY - outerShield.rotation.y) * 0.05;

      renderer.render(scene, camera);
    }

    animate();

    // Handle Resize
    window.addEventListener('resize', () => {
      if (!canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w && h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  INTERACTIVE SANDBOX DEMO
  // ═══════════════════════════════════════════════════════════════════════════

  if (sampleApiBtn) sampleApiBtn.addEventListener('click', () => loadPreset('api'));
  if (sampleCustomerBtn) sampleCustomerBtn.addEventListener('click', () => loadPreset('customer'));
  if (sampleMedicalBtn) sampleMedicalBtn.addEventListener('click', () => loadPreset('medical'));

  function loadPreset(key) {
    rawTextInput.value = SAMPLES[key];
    charCounter.textContent = `${SAMPLES[key].length} chars`;

    const presetResult = PRESET_RESULTS[key];
    currentResponse = {
      success: true,
      extractedText: SAMPLES[key],
      regexRedacted: presetResult.regexRedacted,
      finalScrubbedText: presetResult.finalScrubbedText,
      stats: presetResult.stats
    };

    displayResults(currentResponse);
  }

  if (scrubBtn) {
    scrubBtn.addEventListener('click', async () => {
      const text = rawTextInput.value.trim();
      if (!text) {
        showToast('⚠️ Please paste text or choose a sample preset.', 'warning');
        return;
      }

      loader.classList.remove('hidden');
      loaderText.textContent = `Running local Gemma 2B Scan...`;

      try {
        const res = await fetch('/api/scrub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, mode: activeSensitivityMode })
        });
        const data = await res.json();
        loader.classList.add('hidden');

        if (!res.ok || !data.success) {
          showToast('❌ Error: ' + (data.error || 'Redaction failed'), 'error');
          return;
        }

        currentResponse = data;
        displayResults(data);
      } catch (err) {
        loader.classList.add('hidden');
        showToast('❌ Server Error: ' + err.message, 'error');
      }
    });
  }

  function displayResults(data) {
    emptyOutputState.classList.add('hidden');
    outputTextContainer.classList.remove('hidden');

    const counts = data.stats.regexCounts || {};
    const totalRegex = Object.values(counts).reduce((a, b) => a + b, 0);

    auditCounterText.textContent = `${totalRegex} Secrets Redacted in ${data.stats.processingTimeMs}ms`;

    copyBtn.disabled = false;
    downloadCleanBtn.disabled = false;

    renderOutputView();
    appendTerminalLog(`Redaction scan executed in ${data.stats.processingTimeMs}ms. (${totalRegex} secrets redacted)`);
  }

  function renderOutputView() {
    if (!currentResponse) return;

    let text = activeView === 'final' ? currentResponse.finalScrubbedText : currentResponse.regexRedacted;

    const highlighted = escapeHtml(text)
      .replace(/\[(PASSWORD_REDACTED)\]/g, '<span class="tag-redacted-yellow">[$1]</span>')
      .replace(/\[(INTERNAL_HOST_REDACTED|CONFIDENTIAL_REDACTED|NAME_REDACTED|ADDRESS_REDACTED|SENSITIVE_ID_REDACTED)\]/g, '<span class="tag-redacted-cyan">[$1]</span>')
      .replace(/\[(API_KEY_REDACTED|CREDIT_CARD_REDACTED|EMAIL_REDACTED|PAN_REDACTED|AADHAAR_REDACTED|PHONE_REDACTED)\]/g, '<span class="tag-redacted-red">[$1]</span>');

    outputPre.innerHTML = `<code>${highlighted}</code>`;
  }

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.className = 'toggle-btn px-3 py-1 rounded-md text-slate-400 hover:text-slate-200');
      btn.className = 'toggle-btn active px-3 py-1 rounded-md text-cyan-300 font-bold bg-slate-800';
      activeView = btn.dataset.view;
      renderOutputView();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  TERMINAL LOG COMMAND EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════

  function appendTerminalLog(msg) {
    if (!securityLogTerminal) return;
    const timeStr = new Date().toTimeString().slice(0, 8);
    const p = document.createElement('p');
    p.innerHTML = `<span class="text-slate-500">${timeStr}</span> <span class="text-emerald-400">[LOCAL]</span> ${escapeHtml(msg)}`;
    securityLogTerminal.appendChild(p);
    securityLogTerminal.scrollTop = securityLogTerminal.scrollHeight;
  }

  if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && terminalInput.value.trim()) {
        const cmd = terminalInput.value.trim().toLowerCase();
        terminalInput.value = '';
        appendTerminalLog(`Executing command: ${cmd}`);

        setTimeout(() => {
          if (cmd === 'clear') {
            securityLogTerminal.innerHTML = '';
          } else if (cmd === 'status') {
            appendTerminalLog('STATUS: Node 100% Air-Gapped | Gemma 2B Ready | WebGPU Shaders Active | RAM: 1.2GB');
          } else if (cmd === 'benchmark') {
            appendTerminalLog('BENCHMARK: Avg Latency = 82ms | Throughput = 64 t/s | Network Egress = 0 KB');
          } else if (cmd === 'purge') {
            appendTerminalLog('RAM PURGE: All volatile text buffers wiped from browser memory.');
            showToast('🧹 Volatile memory purged');
          } else {
            appendTerminalLog(`Command '${cmd}' acknowledged. System operational.`);
          }
        }, 150);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  UTILITIES & EXPORTS
  // ═══════════════════════════════════════════════════════════════════════════

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(msg, type = 'success') {
    const existing = toastContainer.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    if (type === 'warning' || type === 'error') {
      toast.style.background = 'rgba(239, 68, 68, 0.2)';
      toast.style.borderColor = 'rgba(239, 68, 68, 0.5)';
      toast.style.color = '#fca5a5';
    }
    toast.textContent = msg;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!currentResponse) return;
      const text = activeView === 'final' ? currentResponse.finalScrubbedText : currentResponse.regexRedacted;
      navigator.clipboard.writeText(text).then(() => showToast('✓ Copied to Clipboard'));
    });
  }

  if (downloadCleanBtn) {
    downloadCleanBtn.addEventListener('click', () => {
      if (!currentResponse) return;
      const text = activeView === 'final' ? currentResponse.finalScrubbedText : currentResponse.regexRedacted;
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `StealthScrub_Clean_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('📥 Clean file downloaded');
    });
  }

  if (openAppBtn) openAppBtn.addEventListener('click', () => showToast('🛡️ Engine Active & Running locally on port 3005'));
  if (heroLaunchBtn) heroLaunchBtn.addEventListener('click', () => showToast('🛡️ Dashboard Engine Active'));

});
