import { verifyTypedData, parseUnits, getAddress } from 'ethers';
import { SignedRiskPayload } from '../types/mev';

export interface SignatureVerificationResult {
  valid: boolean;
  recovered: string | null;
  reason?: string;
}

/**
 * Perform local cryptographic EIP-712 signature verification using ethers v6.
 * Compares the recovered signer address with the expected payload.signer.
 */
export function verifyEip712Signature(
  payload?: SignedRiskPayload | null,
  signature?: string | null
): SignatureVerificationResult {
  if (!payload || !signature || signature.trim() === '') {
    return {
      valid: false,
      recovered: null,
      reason: 'Missing payload or signature'
    };
  }

  try {
    const domain = {
      name: 'MEVShield',
      version: '1',
      chainId: payload.destinationDomain ?? 1
    };

    const types = {
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

    const message = {
      poolId: getAddress(payload.poolId),
      expectedLpLoss: parseUnits((payload.expectedLpLoss ?? 0).toString(), 18),
      expectedLeakage: parseUnits((payload.expectedLeakage ?? 0).toString(), 18),
      toxicityScore: BigInt(payload.toxicityScore ?? 0),
      recommendedSpread: BigInt(payload.recommendedSpread ?? 0),
      settlementToken: payload.settlementToken || 'USDC',
      settlementAmount: parseUnits((payload.settlementAmount ?? 0).toString(), 6),
      destinationDomain: payload.destinationDomain ?? 1,
      recipient: getAddress(payload.recipient),
      expiry: BigInt(payload.expiry ?? 0),
      nonce: BigInt(payload.nonce ?? 0)
    };

    const recovered = verifyTypedData(domain, types, message, signature);
    const expectedSigner = getAddress(payload.signer);
    const valid = recovered.toLowerCase() === expectedSigner.toLowerCase();

    return {
      valid,
      recovered,
      reason: valid ? undefined : `Signature recovered ${recovered}, expected ${expectedSigner}`
    };
  } catch (err) {
    return {
      valid: false,
      recovered: null,
      reason: err instanceof Error ? err.message : 'Failed to recover EIP-712 signature'
    };
  }
}
