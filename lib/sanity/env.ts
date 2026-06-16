export type SanityEnv = {
  projectId: string;
  dataset: string;
  apiVersion: string;
  useCdn: boolean;
  token?: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getSanityEnv(requireWriteToken = false): SanityEnv {
  const projectId = readEnv("SANITY_PROJECT_ID");
  const dataset = readEnv("SANITY_DATASET") ?? "production";
  const apiVersion = readEnv("SANITY_API_VERSION") ?? "2024-01-01";
  const token = readEnv("SANITY_API_WRITE_TOKEN") ?? readEnv("SANITY_API_TOKEN");

  if (!projectId) {
    throw new Error("SANITY_PROJECT_ID is required");
  }

  if (requireWriteToken && !token) {
    throw new Error(
      "SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN) is required for write operations",
    );
  }

  return {
    projectId,
    dataset,
    apiVersion,
    useCdn: !token,
    token,
  };
}

export function hasSanityConfig(): boolean {
  return Boolean(readEnv("SANITY_PROJECT_ID"));
}
