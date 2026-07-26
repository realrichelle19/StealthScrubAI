require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { createWorker } = require('tesseract.js');

const app = express();
const PORT = process.env.PORT || 3005;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma2:2b';

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer in-memory storage for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB limit
});

/**
 * Fast Comprehensive Regex Redaction Engine
 * Matches and replaces high-risk structural PII & Credential patterns.
 */
function applyRegexRedactions(text) {
  if (!text) return { redactedText: '', counts: {} };

  let redactedText = text;
  const counts = {
    apiKey: 0,
    creditCard: 0,
    email: 0,
    password: 0,
    pan: 0,
    aadhaar: 0,
    phone: 0,
    jwt: 0,
    ssh: 0,
    ipAddress: 0
  };

  // 1. SSH Private Keys
  const sshKeyRegex = /-----BEGIN (?:RSA|OPENSSH|DSA|EC|PGP) PRIVATE KEY-----[\s\S]*?-----END (?:RSA|OPENSSH|DSA|EC|PGP) PRIVATE KEY-----/g;
  redactedText = redactedText.replace(sshKeyRegex, () => {
    counts.ssh++;
    return '[CREDENTIAL_REDACTED]';
  });

  // 2. JWT Tokens
  const jwtRegex = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
  redactedText = redactedText.replace(jwtRegex, () => {
    counts.jwt++;
    return '[API_KEY_REDACTED]';
  });

  // 3. Passwords (e.g. password: 'xyz', pwd="123", secret_key=...)
  const passwordRegex = /(?:password|passwd|pwd|pass|secret_key)\s*[:=]\s*(?:['"]([^'"]+)['"]|([^\s,;:{}]+))/gi;
  redactedText = redactedText.replace(passwordRegex, (match) => {
    counts.password++;
    return match.replace(/[:=]\s*(?:['"].*?['"]|\S+)/, ': [PASSWORD_REDACTED]');
  });

  // 4. Known API Keys (Stripe, AWS, GitHub, OpenAI, Gemini, Slack, Discord)
  const prefixedKeyRegex = /\b(?:sk_live|sk_test|pk_live|pk_test)_[0-9a-zA-Z]{24,}\b|\bgh[pousr]_[0-9a-zA-Z]{36}\b|\bgithub_pat_[0-9a-zA-Z_]{82}\b|\bAKIA[0-9A-Z]{16}\b|\bAIzaSy[0-9A-Za-z_-]{33}\b|\bsk-[a-zA-Z0-9]{32,48}\b|\bsk-proj-[a-zA-Z0-9_-]{40,}\b|\bxox[baprs]-[0-9a-zA-Z]{10,48}\b/gi;
  redactedText = redactedText.replace(prefixedKeyRegex, () => {
    counts.apiKey++;
    return '[API_KEY_REDACTED]';
  });

  // 5. Key-value pair API keys (e.g. api_key: "abc...", secret = 'xyz...')
  const kvKeyRegex = /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|secret[_-]?key)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{16,})['"]?/gi;
  redactedText = redactedText.replace(kvKeyRegex, (match) => {
    counts.apiKey++;
    return match.replace(/[:=]\s*['"]?.*['"]?/, ': [API_KEY_REDACTED]');
  });

  // 6. Bearer tokens
  const bearerRegex = /\bBearer\s+[a-zA-Z0-9_\-\.]{20,}\b/gi;
  redactedText = redactedText.replace(bearerRegex, () => {
    counts.apiKey++;
    return 'Bearer [API_KEY_REDACTED]';
  });

  // 7. Standalone hex/base64 tokens (32-64 chars)
  const standaloneKeyRegex = /\b[a-f0-9]{32,64}\b/gi;
  redactedText = redactedText.replace(standaloneKeyRegex, (match) => {
    if (/[0-9]/.test(match) && /[a-fA-F]/.test(match) && !match.includes('[') && !match.includes(']')) {
      counts.apiKey++;
      return '[API_KEY_REDACTED]';
    }
    return match;
  });

  // 8. Credit Cards (13-19 digits)
  const creditCardRegexes = [
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
    /\b(?:\d{4}[-\s]?){3}\d{4}\b/g
  ];
  creditCardRegexes.forEach((regex) => {
    redactedText = redactedText.replace(regex, (match) => {
      if (!match.includes('REDACTED')) {
        counts.creditCard++;
        return '[CREDIT_CARD_REDACTED]';
      }
      return match;
    });
  });

  // 9. Indian Aadhaar Number
  const aadhaarRegex = /\b[2-9]{1}[0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b(?!\s*[\s-]?\d)/g;
  redactedText = redactedText.replace(aadhaarRegex, (match) => {
    if (!match.includes('REDACTED')) {
      counts.aadhaar++;
      return '[AADHAAR_REDACTED]';
    }
    return match;
  });

  // 10. Indian PAN Card Number
  const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;
  redactedText = redactedText.replace(panRegex, () => {
    counts.pan++;
    return '[PAN_REDACTED]';
  });

  // 11. Email Addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  redactedText = redactedText.replace(emailRegex, () => {
    counts.email++;
    return '[EMAIL_REDACTED]';
  });

  // 12. Phone Numbers
  const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  redactedText = redactedText.replace(phoneRegex, (match) => {
    if (!match.includes('REDACTED') && match.replace(/\D/g, '').length >= 10) {
      counts.phone++;
      return '[PHONE_REDACTED]';
    }
    return match;
  });

  // 13. IPv4 & IPv6 Addresses
  const ipv4Regex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  redactedText = redactedText.replace(ipv4Regex, (match) => {
    if (match !== '127.0.0.1' && match !== '0.0.0.0') {
      counts.ipAddress++;
      return '[INTERNAL_HOST_REDACTED]';
    }
    return match;
  });

  return { redactedText, counts };
}

/**
 * Perform OCR on image buffer using Tesseract.js
 */
async function extractTextFromImageBuffer(buffer) {
  let worker;
  try {
    worker = await createWorker('eng');
    const { data: { text, words } } = await worker.recognize(buffer);
    await worker.terminate();

    const ocrWords = (words || []).map(w => ({
      text: w.text,
      bbox: w.bbox
    }));

    return { text: text.trim(), ocrWords };
  } catch (error) {
    if (worker) await worker.terminate();
    throw new Error('Image OCR processing failed: ' + error.message);
  }
}

/**
 * Send text to local Gemma 2 2B instance via Ollama
 */
async function sanitizeWithLocalGemma(text, mode = 'standard') {
  let modeInstruction = '';

  if (mode === 'gdpr') {
    modeInstruction = `STRICT GDPR SENSITIVITY MODE:
1. Personal full names & individual titles -> replace with [NAME_REDACTED]
2. Street addresses, cities, zip codes -> replace with [ADDRESS_REDACTED]
3. Internal server hostnames, IP addresses, private domains -> replace with [INTERNAL_HOST_REDACTED]
4. Direct & indirect GDPR identifiers, company roles, dates -> replace with [CONFIDENTIAL_REDACTED]`;
  } else if (mode === 'paranoid') {
    modeInstruction = `PARANOID ULTRA-AGGRESSIVE SENSITIVITY MODE:
1. ALL proper nouns, individual names, organization names -> replace with [NAME_REDACTED]
2. ALL physical addresses, locations, cities, coordinates -> replace with [ADDRESS_REDACTED]
3. ALL server hostnames, internal IPs, private URLs -> replace with [INTERNAL_HOST_REDACTED]
4. ALL financial figures, dates, project codenames, internal terms -> replace with [CONFIDENTIAL_REDACTED]`;
  } else {
    modeInstruction = `STANDARD SENSITIVITY MODE:
1. Personal full names of individuals -> replace with [NAME_REDACTED]
2. Specific street addresses, home locations, or zip codes -> replace with [ADDRESS_REDACTED]
3. Internal domain names, private server hostnames, or internal IP host URLs -> replace with [INTERNAL_HOST_REDACTED]
4. Highly secret internal project codenames or confidential business terms -> replace with [CONFIDENTIAL_REDACTED]`;
  }

  const prompt = `You are an enterprise-grade PII and confidential data redaction engine.
${modeInstruction}

CRITICAL RULES:
- PRESERVE all existing redaction tags like [API_KEY_REDACTED], [CREDIT_CARD_REDACTED], [EMAIL_REDACTED], [PASSWORD_REDACTED], [PAN_REDACTED], [AADHAAR_REDACTED], [PHONE_REDACTED], [CREDENTIAL_REDACTED].
- DO NOT add intro/outro comments, notes, or explanations.
- Output ONLY the sanitized clean text.

Input Text:
${text}`;

  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama server returned status ${response.status}`);
  }

  const data = await response.json();
  return data.response ? data.response.trim() : text;
}

// ═══════════════════════════════════════════════════════════════════════════
//  NAVIGATION PAGE ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/history', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

app.get('/security-logs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'logs.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

// ═══════════════════════════════════════════════════════════════════════════
//  API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/scrub', upload.single('image'), async (req, res) => {
  const startTime = Date.now();
  let inputText = '';
  let ocrWords = [];
  let source = 'text';

  try {
    if (req.file) {
      source = 'file';
      const fileMime = req.file.mimetype || '';
      
      if (fileMime.includes('text') || fileMime.includes('json') || fileMime.includes('log') || req.file.originalname.endsWith('.txt') || req.file.originalname.endsWith('.log')) {
        inputText = req.file.buffer.toString('utf-8');
      } else {
        const ocrResult = await extractTextFromImageBuffer(req.file.buffer);
        inputText = ocrResult.text;
        ocrWords = ocrResult.ocrWords;
        source = 'image';
      }
    } else if (req.body.text && typeof req.body.text === 'string') {
      inputText = req.body.text;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Please provide raw text or attach a file.'
      });
    }

    if (!inputText || inputText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Input text is empty or could not be extracted from the uploaded document.'
      });
    }

    const { redactedText: regexRedacted, counts: regexCounts } = applyRegexRedactions(inputText);

    const mode = req.body.mode || req.query.mode || 'standard';

    let finalScrubbedText = regexRedacted;
    let ollamaStatus = 'success';
    let ollamaNotice = null;

    try {
      finalScrubbedText = await sanitizeWithLocalGemma(regexRedacted, mode);
    } catch (ollamaErr) {
      ollamaStatus = 'unavailable';
      ollamaNotice = `⚡ Regex Engine Active (Ollama Offline)`;
      console.warn('[StealthScrub AI Notice]:', ollamaNotice);
    }

    const durationMs = Date.now() - startTime;

    return res.json({
      success: true,
      source,
      extractedText: inputText,
      ocrWords,
      regexRedacted,
      finalScrubbedText,
      stats: {
        regexCounts,
        ollamaStatus,
        ollamaModel: OLLAMA_MODEL,
        processingTimeMs: durationMs
      },
      notice: ollamaNotice
    });

  } catch (err) {
    console.error('[StealthScrub AI Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while processing redaction.'
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let ollamaConnected = false;
  try {
    const check = await fetch(`${OLLAMA_HOST}/api/tags`);
    if (check.ok) ollamaConnected = true;
  } catch (e) {
    ollamaConnected = false;
  }

  res.json({
    status: 'online',
    ollamaHost: OLLAMA_HOST,
    ollamaModel: OLLAMA_MODEL,
    ollamaConnected,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🔒 StealthScrub AI Server running on port ${PORT}`);
  console.log(`   Ollama Target: ${OLLAMA_HOST} (${OLLAMA_MODEL})`);
  console.log(`   Local Dashboard: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
