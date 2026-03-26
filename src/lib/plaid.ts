import { Prisma } from "@prisma/client";
import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
  type RemovedTransaction,
  type TransactionsSyncResponse,
} from "plaid";

import { prisma } from "@/lib/db";
import { env, isDatabaseConfigured, isPlaidConfigured } from "@/lib/env";

const plaidEnvironmentMap: Record<string, string> = {
  sandbox: PlaidEnvironments.sandbox,
  development: PlaidEnvironments.development,
  production: PlaidEnvironments.production,
};

export function getPlaidClient() {
  if (!isPlaidConfigured) {
    throw new Error("Plaid credentials are missing.");
  }

  const configuration = new Configuration({
    basePath: plaidEnvironmentMap[env.plaidEnv] ?? PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": env.plaidClientId,
        "PLAID-SECRET": env.plaidSecret,
      },
    },
  });

  return new PlaidApi(configuration);
}

export async function createLinkToken() {
  const client = getPlaidClient();

  const response = await client.linkTokenCreate({
    user: {
      client_user_id: `astra-ledger-${Date.now()}`,
    },
    client_name: "Astra Ledger",
    language: "en",
    country_codes: [CountryCode.Us],
    products: [Products.Transactions],
    webhook: env.plaidWebhookUrl || undefined,
  });

  return response.data;
}

export async function exchangePublicTokenAndSync(input: {
  publicToken: string;
  institutionName?: string;
}) {
  if (!isDatabaseConfigured) {
    throw new Error("DATABASE_URL is required to store Plaid data.");
  }

  const client = getPlaidClient();
  const exchange = await client.itemPublicTokenExchange({
    public_token: input.publicToken,
  });

  const accessToken = exchange.data.access_token;
  const itemId = exchange.data.item_id;

  const plaidItem = await prisma.plaidItem.upsert({
    where: { itemId },
    update: {
      accessToken,
      institutionName: input.institutionName ?? undefined,
    },
    create: {
      itemId,
      accessToken,
      institutionName: input.institutionName ?? undefined,
    },
  });

  const balancesResponse = await client.accountsBalanceGet({
    access_token: accessToken,
  });

  for (const account of balancesResponse.data.accounts) {
    await prisma.account.upsert({
      where: { plaidAccountId: account.account_id },
      update: {
        plaidItemId: plaidItem.id,
        name: account.name,
        officialName: account.official_name ?? undefined,
        type: account.type,
        subtype: account.subtype ?? undefined,
        mask: account.mask ?? undefined,
        balanceCurrent: account.balances.current ?? 0,
        balanceAvailable: account.balances.available ?? undefined,
        currencyCode: account.balances.iso_currency_code ?? "USD",
      },
      create: {
        plaidAccountId: account.account_id,
        plaidItemId: plaidItem.id,
        name: account.name,
        officialName: account.official_name ?? undefined,
        type: account.type,
        subtype: account.subtype ?? undefined,
        mask: account.mask ?? undefined,
        balanceCurrent: account.balances.current ?? 0,
        balanceAvailable: account.balances.available ?? undefined,
        currencyCode: account.balances.iso_currency_code ?? "USD",
      },
    });
  }

  const synced = await syncTransactions(accessToken);

  for (const removed of synced.removed) {
    await prisma.transaction.deleteMany({
      where: {
        plaidTransactionId: removed.transaction_id,
      },
    });
  }

  for (const transaction of synced.added) {
    const account = await prisma.account.findUnique({
      where: { plaidAccountId: transaction.account_id },
      select: { id: true },
    });

    if (!account) {
      continue;
    }

    await prisma.transaction.upsert({
      where: { plaidTransactionId: transaction.transaction_id },
      update: buildTransactionUpdatePayload(transaction, plaidItem.id, account.id),
      create: buildTransactionCreatePayload(transaction, plaidItem.id, account.id),
    });
  }

  for (const transaction of synced.modified) {
    const account = await prisma.account.findUnique({
      where: { plaidAccountId: transaction.account_id },
      select: { id: true },
    });

    if (!account) {
      continue;
    }

    await prisma.transaction.updateMany({
      where: { plaidTransactionId: transaction.transaction_id },
      data: buildTransactionUpdatePayload(transaction, plaidItem.id, account.id),
    });
  }

  await prisma.plaidItem.update({
    where: { id: plaidItem.id },
    data: {
      cursor: synced.cursor,
    },
  });

  return {
    accountsSynced: balancesResponse.data.accounts.length,
    transactionsSynced: synced.added.length + synced.modified.length,
    itemId,
  };
}

async function syncTransactions(accessToken: string) {
  const added: TransactionsSyncResponse["added"] = [];
  const modified: TransactionsSyncResponse["modified"] = [];
  const removed: RemovedTransaction[] = [];
  let hasMore = true;
  let cursor: string | undefined;

  while (hasMore) {
    const response = await getPlaidClient().transactionsSync({
      access_token: accessToken,
      cursor,
      count: 100,
    });

    added.push(...response.data.added);
    modified.push(...response.data.modified);
    removed.push(...response.data.removed);
    cursor = response.data.next_cursor;
    hasMore = response.data.has_more;
  }

  return { added, modified, removed, cursor };
}

function buildTransactionUpdatePayload(
  transaction: TransactionsSyncResponse["added"][number],
  plaidItemId: string,
  accountId: string,
): Prisma.TransactionUncheckedUpdateInput {
  return {
    plaidItemId,
    accountId,
    name: transaction.name,
    merchantName: transaction.merchant_name ?? undefined,
    amount: transaction.amount,
    isoCurrencyCode: transaction.iso_currency_code ?? "USD",
    date: new Date(transaction.date),
    authorizedDate: transaction.authorized_date
      ? new Date(transaction.authorized_date)
      : undefined,
    pending: transaction.pending,
    isRecurring: false,
    personalFinancePrimary:
      transaction.personal_finance_category?.primary ?? transaction.category?.[0] ?? "OTHER",
    personalFinanceDetailed:
      transaction.personal_finance_category?.detailed ?? transaction.category?.[1] ?? undefined,
    categoryConfidence:
      transaction.personal_finance_category?.confidence_level ?? undefined,
  };
}

function buildTransactionCreatePayload(
  transaction: TransactionsSyncResponse["added"][number],
  plaidItemId: string,
  accountId: string,
): Prisma.TransactionUncheckedCreateInput {
  return {
    plaidTransactionId: transaction.transaction_id,
    plaidItemId,
    accountId,
    name: transaction.name,
    merchantName: transaction.merchant_name ?? undefined,
    amount: transaction.amount,
    isoCurrencyCode: transaction.iso_currency_code ?? "USD",
    date: new Date(transaction.date),
    authorizedDate: transaction.authorized_date
      ? new Date(transaction.authorized_date)
      : undefined,
    pending: transaction.pending,
    isRecurring: false,
    personalFinancePrimary:
      transaction.personal_finance_category?.primary ?? transaction.category?.[0] ?? "OTHER",
    personalFinanceDetailed:
      transaction.personal_finance_category?.detailed ?? transaction.category?.[1] ?? undefined,
    categoryConfidence:
      transaction.personal_finance_category?.confidence_level ?? undefined,
  };
}