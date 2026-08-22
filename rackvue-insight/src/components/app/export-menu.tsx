import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { exportCSV, exportPDF } from "@/lib/exporters";

interface Props<T extends object> {
  rows: T[];
  filename: string;
  title: string;
  subtitle?: string;
}

export function ExportMenu<T extends object>({ rows, filename, title, subtitle }: Props<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs">Export {rows.length} rows</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => exportCSV(rows as unknown as Record<string, unknown>[], filename)}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            exportPDF({
              rows: rows as unknown as Record<string, unknown>[],
              filename,
              title,
              subtitle,
            })
          }
        >
          <FileText className="mr-2 h-4 w-4" />
          PDF Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
