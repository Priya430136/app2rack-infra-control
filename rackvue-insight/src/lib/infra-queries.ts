import { queryOptions } from "@tanstack/react-query";
import { listRacks, listServers, listApplications, listMetrics } from "@/lib/infra.functions";
import { listDatasets } from "@/lib/datasets.functions";
import { listReports } from "@/lib/reports.functions";

export const racksQO = queryOptions({ queryKey: ["racks"], queryFn: () => listRacks() });
export const serversQO = queryOptions({ queryKey: ["servers"], queryFn: () => listServers() });
export const applicationsQO = queryOptions({
  queryKey: ["applications"],
  queryFn: () => listApplications(),
});
export const metricsQO = queryOptions({ queryKey: ["metrics"], queryFn: () => listMetrics() });
export const datasetsQO = queryOptions({ queryKey: ["datasets"], queryFn: () => listDatasets() });
export const reportsQO = queryOptions({ queryKey: ["reports"], queryFn: () => listReports() });
