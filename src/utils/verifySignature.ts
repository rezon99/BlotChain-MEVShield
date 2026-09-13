import { verifyTypedData, parseUnits, getAddress } from 'ethers';

export interface VerifySignatureResult {
  valid: boolean;
  recovered: string | null;
  reason?: string;
}

function safeAddress(addr: string | undefined): string {
  if (!addr || typeof addr !== 'string') return '0x0000000000000000000000000000000000000000';
  try {
    return getAddress(addr);
  } catch {
    if (/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      return getAddress(addr.toLowerCase());
    }
    return '0x0000000000000000000000000000000000000000';
  }
}

export function verifyEip712Signature(
  rawPayload: Record<string, any>,
  signatureString?: string
): VerifySignatureResult {
  try {
    const signature = signatureString || rawPayload?.signature || rawPayload?.sig;
    if (!signature || typeof signature !== 'string') {
      return { valid: false, recovered: null, reason: 'Missing signature string' };
    }

    const expectedSignerRaw = rawPayload?.expectedSigner || rawPayload?.signer;
    if (!expectedSignerRaw) {
      return { valid: false, recovered: null, reason: 'Missing expectedSigner or signer field' };
    }

    const expectedSigner = safeAddress(expectedSignerRaw);

    const destinationDomain = Number(rawPayload?.destinationDomain || 1);

    const domain = rawPayload?.domain || {
      name: 'MEVShield',
      version: '1',
      chainId: destinationDomain
    };

    const types = rawPayload?.types || {
      SignedRiskPayload: [
        { name: 'poolId', type: 'address' },
        { name: 'expectedLpLoss', type: 'uint256' },
        { name: 'expectedLeakage', type: 'uint256' },
        { name: 'toxicityScore', type: 'uint256' },
        { name: 'recommendedSpread', type: 'uint256' },
        { name: 'settlementToken', type: 'string' },
        { name: 'settlementAmount', type: 'uint256' },
        { name: 'destinationDomain', type: 'uint32' },
        { name: 'recipient', type: 'address' },
        { name: 'expiry', type: 'uint256' },
        { name: 'nonce', type: 'uint256' }
      ]
    };

    const recipient = safeAddress(rawPayload?.recipient);
    const poolId = safeAddress(rawPayload?.poolId);

    const message = {
      poolId,
      expectedLpLoss: parseUnits(String(rawPayload?.expectedLpLoss ?? 0), 18),
      expectedLeakage: parseUnits(String(rawPayload?.expectedLeakage ?? 0), 18),
      toxicityScore: BigInt(rawPayload?.toxicityScore ?? 0),
      recommendedSpread: BigInt(rawPayload?.recommendedSpread ?? 0),
      settlementToken: String(rawPayload?.settlementToken ?? 'USDC'),
      settlementAmount: parseUnits(String(rawPayload?.settlementAmount ?? 0), 6),
      destinationDomain: Number(rawPayload?.destinationDomain ?? 1),
      recipient,
      expiry: BigInt(rawPayload?.expiry ?? 0),
      nonce: BigInt(rawPayload?.nonce ?? 0)
    };

    const recoveredAddress = verifyTypedData(domain, types, message, signature);
    const recovered = safeAddress(recoveredAddress);

    const matches = recovered.toLowerCase() === expectedSigner.toLowerCase();

    return {
      valid: matches,
      recovered,
      reason: matches ? undefined : `Recovered address ${recovered} does not match expected signer ${expectedSigner}`
    };
  } catch (err: any) {
    return {
      valid: false,
      recovered: null,
      reason: `Verification failed: ${err?.message || String(err)}`
    };
  }
}
