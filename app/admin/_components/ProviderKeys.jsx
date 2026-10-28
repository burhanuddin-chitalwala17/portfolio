"use client";

import { useRouter } from "next/navigation";
import Card from "../../ui/Card";
import Notice from "../../ui/Notice";
import SecretField from "../../ui/patterns/SecretField";
import { PROVIDERS, PROVIDER_IDS } from "../../services/ai/providers";
import { adminRequest } from "../_lib/adminRequest";

function ProviderKeyRow({ id, status, enabled }) {
  const router = useRouter();
  const provider = PROVIDERS[id];
  const endpoint = `/api/admin/ai/keys/${id}`;

  return (
    <li className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 md:w-1/3">
        <p className="font-medium text-fg">{provider.label}</p>
        {provider.keyUrl && (
          <a href={provider.keyUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-info underline">
            Get a key
          </a>
        )}
      </div>
      <div className="flex-1">
        <SecretField
          id={`key-${id}`}
          label={`${provider.label} API key`}
          status={status}
          envKey={provider.envKey}
          placeholder="Paste an API key"
          enabled={enabled}
          onSave={async (apiKey) => {
            await adminRequest(endpoint, { method: "PUT", body: { apiKey } });
            router.refresh();
          }}
          onRemove={async () => {
            await adminRequest(endpoint, { method: "DELETE" });
            router.refresh();
          }}
        />
      </div>
    </li>
  );
}

export default function ProviderKeys({ keyStatuses, enabled }) {
  return (
    <Card
      title="API keys"
      description="Keys are encrypted before they're stored and are never shown again or sent to the browser. A key saved here takes priority over the matching Vercel environment variable. Set a monthly spending limit on each key with the provider."
    >
      {!enabled && (
        <Notice tone="warning">
          To save keys here, connect the database and set <span className="font-mono text-xs">ADMIN_SESSION_SECRET</span> in Vercel
          (it also encrypts the keys).
        </Notice>
      )}
      <ul className="divide-y divide-fg/10">
        {PROVIDER_IDS.map((id) => (
          <ProviderKeyRow key={id} id={id} status={keyStatuses[id]} enabled={enabled} />
        ))}
      </ul>
    </Card>
  );
}
