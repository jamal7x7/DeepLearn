import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import data from "./data.json"

import { ColumnDef } from "@tanstack/react-table";

export default function Page() {
  // Define columns for the data.json structure
  const columns: ColumnDef<any>[] = [
    { accessorKey: "header", header: "Header" },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "target", header: "Target" },
    { accessorKey: "limit", header: "Limit" },
    { accessorKey: "reviewer", header: "Reviewer" },
  ];

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <DataTable data={data} columns={columns} />
          </div>
        </div>
      </div>
    </>
  );
}
