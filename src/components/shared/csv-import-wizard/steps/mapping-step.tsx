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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { WarningCircle, ArrowRight } from "@phosphor-icons/react";
import type { FieldDefinition, FieldMapping, ParsedCSVRow } from "../types";

interface CsvMappingStepProps {
  headers: string[];
  mappings: FieldMapping[];
  previewRows: ParsedCSVRow[];
  fieldDefinitions: FieldDefinition[];
  missingRequired: string[];
  onMappingChange: (index: number, fieldKey: string | null) => void;
  className?: string;
}

export function CsvMappingStep({
  mappings,
  previewRows,
  fieldDefinitions,
  missingRequired,
  onMappingChange,
}: CsvMappingStepProps) {
  return (
    <div className="space-y-4">
      {missingRequired.length > 0 && (
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" />
          <AlertDescription>
            Missing required fields: {missingRequired.join(", ")}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">CSV Column</TableHead>
              <TableHead className="w-8" />
              <TableHead className="w-[200px]">Maps To</TableHead>
              <TableHead>Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((mapping, index) => (
              <TableRow key={mapping.csvHeader}>
                <TableCell className="font-mono text-sm">
                  {mapping.csvHeader}
                  {mapping.autoDetected && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      auto
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <Select
                    value={mapping.fieldKey || "__skip__"}
                    onValueChange={(value) =>
                      onMappingChange(
                        index,
                        value === "__skip__" ? null : value
                      )
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip__">
                        <span className="text-muted-foreground">Skip</span>
                      </SelectItem>
                      {fieldDefinitions.map((field) => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                          {field.required && " *"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {previewRows[0]?.[mapping.csvHeader] ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
