"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WarningCircle } from "@phosphor-icons/react";
import type {
  BranchCSVFieldKey,
  BranchFieldMapping,
  ParsedCSVRow,
} from "@/lib/branches/bulk-import-types";
import { BRANCH_REQUIRED_FIELDS } from "@/lib/branches/bulk-import-types";
import {
  getAvailableBranchFieldOptions,
  getMissingRequiredBranchFields,
} from "@/lib/branches/bulk-import-validation";

interface MappingStepProps {
  headers: string[];
  mappings: BranchFieldMapping[];
  previewRows: ParsedCSVRow[];
  onMappingChange: (index: number, fieldKey: BranchCSVFieldKey | null) => void;
}

const SKIP_VALUE = "__skip__";

export function BranchMappingStep({
  headers,
  mappings,
  previewRows,
  onMappingChange,
}: MappingStepProps) {
  const missingRequired = getMissingRequiredBranchFields(mappings);

  return (
    <div className="space-y-6">
      {missingRequired.length > 0 && (
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" />
          <AlertDescription>
            Missing required fields:{" "}
            {missingRequired.join(", ")}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">CSV Column</TableHead>
              <TableHead className="w-[200px]">Maps To</TableHead>
              {previewRows.slice(0, 3).map((_, i) => (
                <TableHead key={i}>Row {i + 1}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {headers.map((header, idx) => {
              const mapping = mappings[idx];
              const options = getAvailableBranchFieldOptions(
                mapping?.fieldKey ?? null,
                mappings
              );

              return (
                <TableRow key={header}>
                  <TableCell className="font-medium">
                    {header}
                    {mapping?.fieldKey &&
                      BRANCH_REQUIRED_FIELDS.includes(mapping.fieldKey) && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Required
                        </Badge>
                      )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={mapping?.fieldKey ?? SKIP_VALUE}
                      onValueChange={(val) =>
                        onMappingChange(
                          idx,
                          val === SKIP_VALUE ? null : (val as BranchCSVFieldKey)
                        )
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Skip column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SKIP_VALUE}>
                          — Skip —
                        </SelectItem>
                        {options.map((opt) => (
                          <SelectItem key={opt.key} value={opt.key}>
                            {opt.label}
                            {opt.required ? " *" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {previewRows.slice(0, 3).map((row, rowIdx) => (
                    <TableCell
                      key={rowIdx}
                      className="max-w-[150px] truncate text-sm text-muted-foreground"
                    >
                      {row[header] || "—"}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
