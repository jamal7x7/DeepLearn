import { ColumnDef } from "@tanstack/react-table";

export type DataRow = {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
};

export const columns: ColumnDef<DataRow>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "header", header: "Header" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "target", header: "Target" },
  { accessorKey: "limit", header: "Limit" },
  { accessorKey: "reviewer", header: "Reviewer" }
];
