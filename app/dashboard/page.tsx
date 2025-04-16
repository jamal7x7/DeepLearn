// import { AppSidebar } from "@/components/app-sidebar"
// import { ChartAreaInteractive } from "@/components/chart-area-interactive"
// import { DataTable } from "@/components/data-table"
// import { SectionCards } from "@/components/section-cards"

// import {
//   SidebarInset,
//   SidebarProvider,
// } from "@/components/ui/sidebar"

// import data from "./data.json"

// import { ColumnDef } from "@tanstack/react-table";
// import { useTranslation } from "react-i18next";

export default function Page() {
  // const { t } = useTranslation();
  // Define columns for the data.json structure
  // const columns: ColumnDef<any>[] = [
  //   { accessorKey: "header", header: t("header") },
  //   { accessorKey: "type", header: t("type") },
  //   { accessorKey: "status", header: t("status") },
  //   { accessorKey: "target", header: t("target") },
  //   { accessorKey: "limit", header: t("limit") },
  //   { accessorKey: "reviewer", header: t("reviewer") },
  // ];

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
        
        Hello
          {/* <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <DataTable data={data} columns={columns} />
          </div> */}
        </div>
      </div>
    </>
  );
}
