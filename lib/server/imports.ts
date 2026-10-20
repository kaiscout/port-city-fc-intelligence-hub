import type { ClubEntity, ClubRecord, RecordCommand } from "@/lib/club";
import { commandFromCsv } from "@/lib/imports";
import { prepareRecord } from "./club-store";
export type ImportValidation = {
  row: number;
  valid: boolean;
  externalId: string;
  errors: string[];
};
export function validateImport(
  entity: ClubEntity,
  rows: Record<string, string>[],
  existing: ClubRecord[],
) {
  const staged = [...existing];
  const commands: RecordCommand[] = [];
  const validation = rows.map((row, index): ImportValidation => {
    try {
      const command = prepareRecord(entity, commandFromCsv(entity, row), staged);
      commands.push(command);
      staged.push({
        ...command,
        id: `staged-${index}`,
        version: 1,
        entityType: entity,
        createdAt: "",
        updatedAt: "",
      });
      return { row: index + 2, valid: true, externalId: command.externalId, errors: [] };
    } catch (error) {
      return {
        row: index + 2,
        valid: false,
        externalId: row.externalId ?? "",
        errors: [error instanceof Error ? error.message : "Invalid row"],
      };
    }
  });
  return { validation, commands };
}
