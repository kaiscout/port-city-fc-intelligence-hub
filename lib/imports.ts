import { clubDomains, type ClubEntity, type FieldSpec } from "./club";
export const importHeaders = (entity: ClubEntity) => [
  "externalId",
  "name",
  "status",
  "evidence",
  "sourceRef",
  "referenceDate",
  ...(clubDomains[entity].fields as FieldSpec[]).map((f) => f.key),
];
export function commandFromCsv(entity: ClubEntity, row: Record<string, string>) {
  const unsupported = Object.keys(row).filter((key) => !importHeaders(entity).includes(key));
  if (unsupported.length)
    throw new Error(
      `Unsupported columns: ${unsupported.join(", ")}. Download the current template.`,
    );
  return {
    externalId: row.externalId,
    name: row.name,
    status: row.status,
    payload: Object.fromEntries(
      Object.entries(row).filter(([key]) => !["externalId", "name", "status"].includes(key)),
    ),
  };
}
