import { createClient, type SanityClient } from "@sanity/client";
import { getSanityEnv } from "@/lib/sanity/env";

export function createSanityClient(options?: { write?: boolean }): SanityClient {
  const env = getSanityEnv(options?.write);

  return createClient({
    projectId: env.projectId,
    dataset: env.dataset,
    apiVersion: env.apiVersion,
    useCdn: env.useCdn,
    token: env.token,
  });
}
