import "server-only";

import {
  Account,
  Contract,
  Keypair,
  Networks,
  rpc,
  scValToNative,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { vaultCampaignId, type VaultCampaignStatus, type VaultCampaignView } from "@bountixx/rush-sdk";
import { rushVaultTestnetId } from "./rushConfig";

const DEFAULT_TESTNET_RPC = "https://soroban-testnet.stellar.org";
const STATUS_BY_VARIANT: Record<string, VaultCampaignStatus> = {
  Funded: "funded",
  Settled: "settled",
  Refunded: "refunded",
};

type NativeCampaign = {
  sponsor: string;
  verifier: string;
  token: string;
  amount: bigint | number | string;
  manifest_hash: Uint8Array;
  deadline_ledger: number;
  status: unknown;
};

function hexToBytes(hex: string): Buffer {
  return Buffer.from(hex, "hex");
}

function statusFromNative(value: unknown): VaultCampaignStatus {
  // A unit enum variant decodes as ["Funded"]; accept a bare symbol defensively.
  const variant = Array.isArray(value) ? value[0] : value;
  const status = typeof variant === "string" ? STATUS_BY_VARIANT[variant] : undefined;
  if (!status) throw new Error("Rush Vault returned an unknown campaign status.");
  return status;
}

/**
 * Reads one campaign from the public Testnet Rush Vault through a simulated,
 * unsigned `get_campaign` call. Nothing is signed or submitted, and no account
 * or key is required. An unknown campaign makes the contract panic; that is
 * reported as `unfunded`.
 */
export async function readVaultCampaign(input: {
  campaignId: string;
  manifestHash: string | null;
}): Promise<VaultCampaignView> {
  const campaignKey = await vaultCampaignId(input.campaignId);
  const base: VaultCampaignView = {
    vaultId: rushVaultTestnetId,
    network: "TESTNET",
    vaultCampaignId: campaignKey,
    status: "unfunded",
  };

  const server = new rpc.Server(process.env.RUSH_STELLAR_RPC_URL ?? DEFAULT_TESTNET_RPC);
  const transaction = new TransactionBuilder(new Account(Keypair.random().publicKey(), "0"), {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(new Contract(rushVaultTestnetId).call("get_campaign", xdr.ScVal.scvBytes(hexToBytes(campaignKey))))
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(transaction);
  if (rpc.Api.isSimulationError(simulation)) {
    if (simulation.error.includes("campaign does not exist")) return base;
    throw new Error("Rush Vault read failed.");
  }
  if (!rpc.Api.isSimulationSuccess(simulation) || !simulation.result) {
    throw new Error("Rush Vault returned no campaign data.");
  }

  const campaign = scValToNative(simulation.result.retval) as NativeCampaign;
  const onChainManifestHash = Buffer.from(campaign.manifest_hash).toString("hex");
  return {
    ...base,
    status: statusFromNative(campaign.status),
    sponsor: campaign.sponsor,
    verifier: campaign.verifier,
    token: campaign.token,
    amountStroops: BigInt(campaign.amount).toString(),
    manifestHash: onChainManifestHash,
    deadlineLedger: Number(campaign.deadline_ledger),
    manifestMatches: input.manifestHash ? onChainManifestHash === input.manifestHash : false,
  };
}
