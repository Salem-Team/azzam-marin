"use client";

import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { DashboardKpiRow } from "@/components/dashboard/dashboard-kpi-card";
import { ExchangeRatesCard } from "@/components/dashboard/exchange-rates-card";
import { InventoryStatusCard } from "@/components/dashboard/inventory-status-card";
import { LowStockTable } from "@/components/dashboard/low-stock-table";
import { ProductCategoriesChart } from "@/components/dashboard/product-categories-chart";
import { PurchaseOrdersCard } from "@/components/dashboard/purchase-orders-card";
import { RecentActivitiesCard } from "@/components/dashboard/recent-activities-card";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { ShipmentStatusCard } from "@/components/dashboard/shipment-status-card";

export function DashboardHome() {
  return (
    <div className="flex w-full min-h-0 min-w-0 flex-1 flex-col gap-3 lg:gap-3.5">
      <div className="relative">
        <DashboardWelcome />
        <div className="relative z-10 -mt-5 px-0">
          <DashboardKpiRow />
        </div>
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-3 lg:grid-cols-12 lg:gap-3.5">
        <div className="flex min-h-0 min-w-0 flex-col lg:col-span-8 [&_>_*]:h-full">
          <SalesTrendChart />
        </div>
        <div className="flex min-h-0 min-w-0 flex-col lg:col-span-4 [&_>_*]:h-full">
          <ProductCategoriesChart />
        </div>
      </div>

      <div className="am-ops-grid">
        <InventoryStatusCard />
        <PurchaseOrdersCard />
        <ShipmentStatusCard />
      </div>

      <div className="am-dash-bottom-grid">
        <div className="min-w-0 w-full">
          <LowStockTable />
        </div>
        <div className="min-w-0 w-full">
          <RecentActivitiesCard />
        </div>
        <div className="min-w-0 w-full">
          <ExchangeRatesCard />
        </div>
      </div>
    </div>
  );
}
