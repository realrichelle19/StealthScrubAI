/**
 * ═══════════════════════════════════════════════════════════════════════════
 * StealthScrub AI — Flagship 3D WebGL Landing Page & Dashboard Engine
 * Featuring 3D Rotating Quantum AI Core Sphere & Multi-Axis Orbital Rings
 * ═══════════════════════════════════════════════════════════════════════════
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  1. 3D ROTATING SPHERE & MULTI-AXIS ORBITAL RINGS CANVAS
  // ═══════════════════════════════════════════════════════════════════════════

  init3dSphereVault();

  function init3dSphereVault() {
    const canvas = document.getElementById('canvas3dVault');
    if (!canvas || !window.THREE) return;

    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Master Group for Mouse Tilt
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 1. Central Glowing Cyan/Emerald Sphere
    const sphereGeo = new THREE.SphereGeometry(1.6, 64, 64);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x06b6d4,          // Cyan base
      emissive: 0x047857,       // Deep emerald glow
      emissiveIntensity: 0.65,
      specular: 0x34d399,       // Bright mint highlight
      shininess: 80,
      transparent: true,
      opacity: 0.95
    });
    const coreSphere = new THREE.Mesh(sphereGeo, sphereMat);
    masterGroup.add(coreSphere);

    // Inner Core Pulsing Core Sphere
    const innerGeo = new THREE.SphereGeometry(1.1, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.4,
      wireframe: true
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    masterGroup.add(innerMesh);

    // 2. Multi-Axis Orbital Rings
    const ringGroup = new THREE.Group();
    masterGroup.add(ringGroup);

    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.7 });
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.6 });
    const ringMat3 = new THREE.MeshBasicMaterial({ color: 0x047857, wireframe: true, transparent: true, opacity: 0.5 });

    // Ring 1 (Tilted X & Y)
    const ringGeo1 = new THREE.TorusGeometry(2.5, 0.02, 16, 100);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    ringGroup.add(ring1);

    // Ring 2 (Tilted Opposite Angle)
    const ringGeo2 = new THREE.TorusGeometry(2.8, 0.02, 16, 100);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 2.5;
    ringGroup.add(ring2);

    // Ring 3 (Horizontal Orbit Ring)
    const ringGeo3 = new THREE.TorusGeometry(3.1, 0.015, 16, 100);
    const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
    ring3.rotation.x = Math.PI / 2;
    ring3.rotation.z = Math.PI / 4;
    ringGroup.add(ring3);

    // 3. Orbiting Data Particles / Starfield
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 3.2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      colors[i * 3] = Math.random() > 0.5 ? 0.06 : 0.02;
      colors[i * 3 + 1] = Math.random() > 0.5 ? 0.72 : 0.95;
      colors[i * 3 + 2] = Math.random() > 0.5 ? 0.5 : 0.83;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    masterGroup.add(particleSystem);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x06b6d4, 3, 20);
    pointLight1.position.set(4, 4, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x10b981, 2, 20);
    pointLight2.position.set(-4, -3, 3);
    scene.add(pointLight2);

    // Mouse Movement Interaction
    let targetRotationX = 0;
    let targetRotationY = 0;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      targetRotationX = mouseY * 0.35;
      targetRotationY = mouseX * 0.35;
    });

    // Storytelling Animation Loop
    let animTime = 0;
    const vaultStageText = document.getElementById('vaultStageText');

    function animate() {
      requestAnimationFrame(animate);

      animTime += 0.015;

      // Continuous 3D Motions
      coreSphere.rotation.y += 0.006;
      coreSphere.rotation.x += 0.003;

      innerMesh.rotation.y -= 0.009;
      innerMesh.rotation.z += 0.004;

      ring1.rotation.z += 0.008;
      ring1.rotation.y += 0.005;

      ring2.rotation.z -= 0.01;
      ring2.rotation.x += 0.004;

      ring3.rotation.y += 0.007;

      particleSystem.rotation.y += 0.002;
      particleSystem.rotation.x += 0.001;

      // Pulse Core Scale
      const pulseScale = 1 + Math.sin(animTime * 2) * 0.03;
      coreSphere.scale.set(pulseScale, pulseScale, pulseScale);

      // Status HUD Cycle
      if (vaultStageText) {
        const cycleStep = Math.floor((animTime % 8) / 2);
        if (cycleStep === 0) {
          vaultStageText.textContent = "1. Quantum Sphere Vault: WebGPU Active";
          vaultStageText.className = "font-bold text-cyan-400";
        } else if (cycleStep === 1) {
          vaultStageText.textContent = "2. Multi-Axis Orbital Rings: Intercepting PII";
          vaultStageText.className = "font-bold text-emerald-400";
        } else if (cycleStep === 2) {
          vaultStageText.textContent = "3. Gemma 2B Core: Redacting Credentials";
          vaultStageText.className = "font-bold text-amber-500";
        } else {
          vaultStageText.textContent = "4. Zero Cloud Egress: 100% Air-Gapped";
          vaultStageText.className = "font-bold text-[#10b981]";
        }
      }

      // Mouse Perspective Easing
      masterGroup.rotation.x += (targetRotationX - masterGroup.rotation.x) * 0.05;
      masterGroup.rotation.y += (targetRotationY - masterGroup.rotation.y) * 0.05;

      renderer.render(scene, camera);
    }

    animate();

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
  //  2. ORBITAL THREAT NEUTRALIZER HOVER EFFECT
  // ═══════════════════════════════════════════════════════════════════════════

  const orbitalItems = document.querySelectorAll('.orbital-item');
  orbitalItems.forEach(item => {
    const originalText = item.innerHTML;
    const tag = item.dataset.tag;

    item.addEventListener('mouseenter', () => {
      item.innerHTML = `<p class="text-xs font-bold text-emerald-400">NEUTRALIZED</p><span class="text-[10px] text-emerald-300 font-bold block mt-1">${tag}</span>`;
    });

    item.addEventListener('mouseleave', () => {
      item.innerHTML = originalText;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  3. OPERATIONAL DASHBOARD LOGIC (For /dashboard)
  // ═══════════════════════════════════════════════════════════════════════════

  const rawTextInput = document.getElementById('rawTextInput');
  const charCounter = document.getElementById('charCounter');
  const scrubBtn = document.getElementById('scrubBtn');

  const sampleApiBtn = document.getElementById('sampleApiBtn');
  const sampleCustomerBtn = document.getElementById('sampleCustomerBtn');
  const sampleMedicalBtn = document.getElementById('sampleMedicalBtn');

  const loader = document.getElementById('loader');
  const emptyOutputState = document.getElementById('emptyOutputState');
  const outputTextContainer = document.getElementById('outputTextContainer');
  const outputPre = document.getElementById('outputPre');
  const auditCounterText = document.getElementById('auditCounterText');

  const copyBtn = document.getElementById('copyBtn');
  const downloadCleanBtn = document.getElementById('downloadCleanBtn');
  const toastContainer = document.getElementById('toastContainer');

  let activeSensitivityMode = 'standard';
  let currentResponse = null;

  const SAMPLES = {
    api: `// AWS & PRODUCTION API CREDENTIAL LEAK
const serverConfig = {
  awsAccessKey: "AKIA_SAMPLE_AWS_ACCESS_KEY_ID",
  awsSecretKey: "sample_aws_secret_access_key_placeholder",
  stripeSecretKey: "sample_stripe_secret_key_placeholder",
  databaseUri: "postgres://db_user:sample_password_placeholder@db.internal.example.local:5432/prod_db",
  developerEmail: "dev-lead@stealthscrub.internal"
};`,
    customer: `{
  "customer_records": [
    {
      "user_name": "Rajesh Sharma",
      "email": "rajesh.sharma@stealthscrub.internal",
      "phone": "+91 98200 12345",
      "aadhaar_number": "9876 5432 1098",
      "pan_card": "ABCDE1234F"
    }
  ]
}`,
    medical: `CLINICAL PRESCRIPTION & PATIENT MEDICAL NOTE
Date: 24-Jul-2026
Patient Name: John Smith
DOB: 14-May-1982
SSN / ID: 9876 5432 1098
Contact Phone: +1 555-0199 | Email: john.smith@medical-center.org`
  };

  if (sampleApiBtn) sampleApiBtn.addEventListener('click', () => loadPreset('api'));
  if (sampleCustomerBtn) sampleCustomerBtn.addEventListener('click', () => loadPreset('customer'));
  if (sampleMedicalBtn) sampleMedicalBtn.addEventListener('click', () => loadPreset('medical'));

  function loadPreset(key) {
    if (!rawTextInput) return;
    rawTextInput.value = SAMPLES[key];
    if (charCounter) charCounter.textContent = `${SAMPLES[key].length} characters`;
  }

  if (scrubBtn) {
    scrubBtn.addEventListener('click', async () => {
      if (!rawTextInput) return;
      const text = rawTextInput.value.trim();
      if (!text) {
        showToast('⚠️ Please paste text or select a preset.', 'warning');
        return;
      }

      if (loader) loader.classList.remove('hidden');

      try {
        const res = await fetch('/api/scrub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, mode: activeSensitivityMode })
        });
        const data = await res.json();
        if (loader) loader.classList.add('hidden');

        if (!res.ok || !data.success) {
          showToast('❌ Redaction failed', 'error');
          return;
        }

        currentResponse = data;
        if (emptyOutputState) emptyOutputState.classList.add('hidden');
        if (outputTextContainer) outputTextContainer.classList.remove('hidden');

        const counts = data.stats.regexCounts || {};
        const totalRegex = Object.values(counts).reduce((a, b) => a + b, 0);

        if (auditCounterText) {
          auditCounterText.textContent = `${totalRegex} Secrets Redacted in ${data.stats.processingTimeMs}ms`;
        }

        if (outputPre) outputPre.textContent = data.finalScrubbedText;
        if (copyBtn) copyBtn.disabled = false;
        if (downloadCleanBtn) downloadCleanBtn.disabled = false;

        showToast('✓ Data Redacted Successfully!');
      } catch (err) {
        if (loader) loader.classList.add('hidden');
        showToast('❌ Server Error: ' + err.message, 'error');
      }
    });
  }

  function showToast(msg, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (currentResponse && currentResponse.finalScrubbedText) {
        navigator.clipboard.writeText(currentResponse.finalScrubbedText);
        showToast('✓ Copied to clipboard');
      }
    });
  }

  if (downloadCleanBtn) {
    downloadCleanBtn.addEventListener('click', () => {
      if (currentResponse && currentResponse.finalScrubbedText) {
        const blob = new Blob([currentResponse.finalScrubbedText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sanitized_${Date.now()}.txt`;
        a.click();
        showToast('📥 Clean file downloaded');
      }
    });
  }

});
