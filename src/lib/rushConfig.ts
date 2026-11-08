/**
 * Public Testnet references only. These values never authorise a funding or
 * settlement transaction, and can safely be included in browser bundles.
 */
export const rushVaultTestnetId =
  process.env.NEXT_PUBLIC_RUSH_VAULT_TESTNET_ID ??
  "CCPJVD6QMCJPD7XX6TE6GTTKOS3FOWWFGAMBZDPA2AHDWW5VOJVI6OF2";

export const rushVaultTestnetUrl =
  `https://lab.stellar.org/r/testnet/contract/${rushVaultTestnetId}`;
