import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const allowedOrigins = [
  'https://blot-chain-mev-shield.vercel.app',
  /\.vercel\.app$/
];

// --- Diagnostic request logging middleware ---
// Added to debug intermittent "SyntaxError: Expected property name or '}' in JSON at position 1"
// errors on POST /swap/analyze and POST /api/analyze. Logs happen BEFORE express.json()
// so we can inspect the raw request as it actually arrives (headers + raw body bytes),
// and again AFTER parsing so we can compare the parsed body / capture parse errors.
app.use((req, res, next) => {
  const requestId = crypto.randomBytes(4).toString('hex');
  req._diagRequestId = requestId;
  req._diagStartedAt = new Date().toISOString();

  console.log(
    `[diag][${requestId}] ${req._diagStartedAt} --> ${req.method} ${req.originalUrl} ` +
    `content-type="${req.headers['content-type'] || ''}" ` +
    `content-length="${req.headers['content-length'] || ''}" ` +
    `origin="${req.headers['origin'] || ''}"`
  );

  next();
});

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({
  // `verify` runs with the raw request buffer BEFORE JSON.parse() is attempted,
  // so this is the best place to see exactly what bytes arrived over the wire.
  verify: (req, res, buf) => {
    const requestId = req._diagRequestId || 'unknown';
    req._diagRawBody = buf;

    if (!buf || buf.length === 0) {
      console.log(`[diag][${requestId}] raw body: <empty>`);
      return;
    }

    const sample = buf.slice(0, 100);
    let printable;
    try {
      printable = sample.toString('utf8');
    } catch (e) {
      printable = '<unable to decode utf8>';
    }

    console.log(
      `[diag][${requestId}] raw body length=${buf.length} first100(utf8)="${printable}" ` +
      `first100(hex)="${sample.toString('hex')}"`
    );
  }
}));

// Log the parsed body once express.json() has succeeded.
app.use((req, res, next) => {
  const requestId = req._diagRequestId || 'unknown';
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    try {
      console.log(`[diag][${requestId}] parsed body: ${JSON.stringify(req.body)}`);
    } catch (e) {
      console.log(`[diag][${requestId}] parsed body: <unserializable> ${e.message}`);
    }
  }
  next();
});

// Catch JSON body-parser errors (e.g. malformed JSON) with full diagnostic context,
// instead of letting them bubble up as a generic Express 400.
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    const requestId = req._diagRequestId || 'unknown';
    const rawBody = req._diagRawBody;
    console.error(
      `[diag][${requestId}] JSON PARSE ERROR: ${err.message}\n` +
      `  method=${req.method} path=${req.originalUrl}\n` +
      `  content-type="${req.headers['content-type'] || ''}" content-length="${req.headers['content-length'] || ''}"\n` +
      `  rawBodyLength=${rawBody ? rawBody.length : 'n/a'}\n` +
      `  rawBody(first100 utf8)="${rawBody ? rawBody.slice(0, 100).toString('utf8') : 'n/a'}"\n` +
      `  rawBody(first100 hex)="${rawBody ? rawBody.slice(0, 100).toString('hex') : 'n/a'}"`
    );
    return res.status(400).json({
      error: 'Bad Request',
      details: err.message,
      requestId
    });
  }
  next(err);
});

// In-memory store for swap events
const swapEvents = [];
const MAX_EVENTS = 20;

// Utility functions
function randomAddress() {
  return '0x' + crypto.randomBytes(20).toString('hex');
}

function randomTxHash() {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

function calculateRisk(amountIn, tokenIn, tokenOut) {
  // Higher amounts or volatile pairs get higher toxicity
  const isVolatile = (tokenIn === 'ETH' || tokenOut === 'ETH' || tokenIn === 'DEGEN');
  const baseToxicity = isVolatile ? 0.35 : 0.10;
  const amountFactor = Math.min(0.55, (amountIn / 50) * 0.4);

  // Normalized toxicity float 0.0 - 0.98
  const rawToxicity = Math.min(0.98, baseToxicity + amountFactor + (Math.random() * 0.2 - 0.1));
  const toxicityScore = Math.floor(rawToxicity * 10000); // Scaled x10000 as expected by frontend

  const expectedLpLoss = parseFloat((rawToxicity * 0.0025).toFixed(4));
  const expectedLeakage = parseFloat((rawToxicity * 0.0010).toFixed(4));
  const recommendedSpread = rawToxicity > 0.4 ? Math.floor(rawToxicity * 40) : 0;

  return {
    toxicityScore,
    expectedLpLoss,
    expectedLeakage,
    recommendedSpread,
    rawToxicity
  };
}

// Generate a mock EIP-712 signature
function generateSignedPayload(params) {
  const {
    sender = '0x7a83B9a5f7823e27161bCD5AcB3Fa4398188449f',
    pool = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
    tokenIn = 'ETH',
    tokenOut = 'USDC',
    amountIn = 10,
    minAmountOut = 30000
  } = params;

  const risk = calculateRisk(amountIn, tokenIn, tokenOut);
  const settlementId = randomTxHash();
  const signerAddress = process.env.SIGNER_ADDRESS || '0x9876543210987654321098765432109876543210';

  const payload = {
    poolId: pool,
    expectedLpLoss: risk.expectedLpLoss,
    expectedLeakage: risk.expectedLeakage,
    toxicityScore: risk.toxicityScore,
    recommendedSpread: risk.recommendedSpread,
    settlementToken: 'USDC',
    settlementAmount: parseFloat((0.15 + (risk.rawToxicity * 0.2)).toFixed(2)),
    destinationDomain: 1,
    recipient: sender,
    expiry: Math.floor(Date.now() / 1000) + 3600,
    nonce: Math.floor(Math.random() * 10000),
    signer: signerAddress
  };

  const signature = '0x' + crypto.randomBytes(65).toString('hex');

  return {
    settlementId,
    payload,
    signature,
    risk
  };
}

// Pre-fill initial realistic swap events
const SAMPLE_WALLETS = [
  '0x7a83B9a5f7823e27161bCD5AcB3Fa4398188449f',
  '0x33b8aD360e229fA265E98B4B8B67D3a10F4Ac91',
  '0x55d398326f99059fF775485246999027B3197955',
  '0x12c8b09320857E4e9b8B6a78fbc383610998c',
  '0x4408b09320857E4e9b8B6a78fbc38361099a2'
];

const SAMPLE_POOLS = [
  { address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640', tokenIn: 'ETH', tokenOut: 'USDC' },
  { address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88', tokenIn: 'WBTC', tokenOut: 'USDT' },
  { address: '0x3416cF6C708Da44dB2624D63ea0aaef7113527C6', tokenIn: 'USDC', tokenOut: 'USDT' },
  { address: '0xc2e901447f32d6759927705cc0569ad67cc50ee6', tokenIn: 'DEGEN', tokenOut: 'WETH' }
];

function createNewSwapEvent() {
  const sender = SAMPLE_WALLETS[Math.floor(Math.random() * SAMPLE_WALLETS.length)];
  const poolInfo = SAMPLE_POOLS[Math.floor(Math.random() * SAMPLE_POOLS.length)];
  const amountIn = parseFloat((Math.random() * 25 + 0.5).toFixed(2));

  const signedData = generateSignedPayload({
    sender,
    pool: poolInfo.address,
    tokenIn: poolInfo.tokenIn,
    tokenOut: poolInfo.tokenOut,
    amountIn
  });

  const event = {
    id: 'evt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    sender,
    pool: poolInfo.address,
    tokenIn: poolInfo.tokenIn,
    tokenOut: poolInfo.tokenOut,
    amountIn,
    minAmountOut: amountIn * 3000 * 0.98,
    settlementId: signedData.settlementId,
    signature: {
      payload: signedData.payload,
      signature: signedData.signature,
      isValid: true
    },
    status: signedData.risk.toxicityScore >= 7000 ? 'Critical Toxicity Intercepted' : 'Policy Signed & Enforced',
    timestamp: Date.now(),
    txHash: randomTxHash()
  };

  swapEvents.unshift(event);
  if (swapEvents.length > MAX_EVENTS) {
    swapEvents.pop();
  }
}

// Seed initial events
for (let i = 0; i < 5; i++) {
  createNewSwapEvent();
}

// Background generator creating new swap events every 5 seconds
setInterval(() => {
  createNewSwapEvent();
}, 5000);

// --- API Endpoints ---

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'BlotChain-MEVShield Default Level 1 Risk Engine API',
    status: 'online',
    endpoints: [
      'POST /swap/analyze',
      'POST /api/analyze',
      'GET /api/swaps/events',
      'GET /health'
    ]
  });
});

// 1. POST /swap/analyze - Submits swap parameters & returns signed EIP-712 payload
app.post('/swap/analyze', (req, res) => {
  try {
    const { sender, pool, tokenIn, tokenOut, amountIn, minAmountOut } = req.body || {};

    const signedData = generateSignedPayload({
      sender,
      pool,
      tokenIn,
      tokenOut,
      amountIn: amountIn || 1,
      minAmountOut
    });

    const response = {
      status: 'signed',
      settlementId: signedData.settlementId,
      payload: signedData.payload,
      signature: signedData.signature,
      txHash: null,
      settlementStatus: 'PENDING'
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze swap', details: err.message });
  }
});

// 2. POST /api/analyze - Quick telemetry without signing
app.post('/api/analyze', (req, res) => {
  try {
    const { amountIn = 1, tokenIn = 'ETH', tokenOut = 'USDC', pool = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640' } = req.body || {};
    const risk = calculateRisk(amountIn, tokenIn, tokenOut);

    res.json({
      riskScore: risk.rawToxicity,
      toxicity: risk.toxicityScore,
      recommendedSpread: risk.recommendedSpread,
      feePercent: risk.rawToxicity > 0.4 ? 0.05 : 0.01,
      pool,
      riskLevel: risk.rawToxicity >= 0.7 ? 'CRITICAL' : risk.rawToxicity >= 0.4 ? 'WARNING' : 'SAFE'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute risk telemetry', details: err.message });
  }
});

// 3. GET /api/swaps/events - Stream live swap events for BlotChain 3D visualizer
app.get('/api/swaps/events', (req, res) => {
  res.json({
    success: true,
    data: swapEvents,
    timestamp: Date.now()
  });
});

app.listen(PORT, () => {
  console.log(`🛡️ MEVShield Risk Engine Backend running on port ${PORT}`);
});
