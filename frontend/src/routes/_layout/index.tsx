import { Box, Card, Container, Text } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import React, { useMemo } from "react";
import {
  ItemsService,
  StoreService,
  WarehouseService,
  type UserPublic,
} from "../../client";
import ReceiveWarehouse from "../../components/Admin/ReceiveWarehouse";
import ShipStore from "../../components/Admin/ShipStore";
import { Widget } from "../../components/Widget/Widget";
import RecordPurchase from "../../components/Admin/RecordPurchase";

const RUPEE_SYMBOL = "₹";

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
});

export interface DashboardWidget {
  title: string;
  value?: number;
  component?: React.FC;
  width?: number;
  height?: number;
}

export enum DashboardWidgetSection {
  SALES = "sales",
  INVENTORY = "inventory",
  VALUE = "value",
  ADMIN = "admin",
}

const transformToStackedBarChart = (
  stackLabel: string,
  dataKey: string,
  data?: any[]
) => {
  if (!data || !dataKey) return [];
  const itemTitles: Set<string> = new Set();
  data.forEach((parent) =>
    parent.items.forEach((item: any) => itemTitles.add(item.Item.title))
  );

  const processedData = data.map((parent) => {
    const parentItems: { [key: string]: number } = {};
    itemTitles.forEach((title) => (parentItems[title] = 0));

    parent.items.forEach((item: any) => {
      parentItems[item.Item.title] = item[dataKey];
    });

    return {
      [stackLabel]: parent["name"].split(" ")[0],
      ...parentItems,
    };
  });

  return processedData;
};

function Dashboard() {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);

  const itemWidgetData = useQuery({
    queryKey: ["item__widgetData"],
    queryFn: () => ItemsService.getTotalUnits(),
  });
  const warehouseItemWidgetData = useQuery({
    queryKey: ["warehouse_item__widgetData"],
    queryFn: () => WarehouseService.getItemsPerWarehouse(),
  });
  const storeItemWidgetData = useQuery({
    queryKey: ["store_item__widgetData"],
    queryFn: () => StoreService.getItemsPerStore(),
  });
  const storeRevenueData = useQuery({
    queryKey: ["store_revenue__widgetData"],
    queryFn: () => StoreService.getStoreRevenues(),
  });

  const widgets = useMemo<
    Partial<Record<DashboardWidgetSection, DashboardWidget[]>>
  >(() => {
    const userWidgets = {
      [DashboardWidgetSection.SALES]: [
        {
          title: "Revenue Per Store",
          width: 400,
          height: 450,
          component: () => {
            return (
              <Widget.BarChart
                unit="INR"
                dataKey="total_revenue"
                name="store"
                showY={false}
                format={(value) =>
                  value ? `${RUPEE_SYMBOL} ${value.toFixed(2)}` : ""
                }
                value={storeRevenueData.data}
              />
            );
          },
        },
        {
          title: "Profit Per Store",
          width: 400,
          height: 350,
          component: () => {
            return (
              <Widget.BarChart
                dataKey="total_profit"
                name="store"
                showY={false}
                format={(value) =>
                  value ? `${RUPEE_SYMBOL} ${value.toFixed(2)}` : ""
                }
                value={storeRevenueData.data}
              />
            );
          },
        },
      ],
      [DashboardWidgetSection.INVENTORY]: [
        {
          title: "Units Per Item",
          width: 400,
          height: 350,
          component: () => {
            return <Widget.PieChart value={itemWidgetData.data} />;
          },
        },
        {
          title: "Units Per Item (Storewise)",
          width: 400,
          height: 350,
          component: () => {
            return (
              <Widget.StackedBarChart
                name="store"
                value={transformToStackedBarChart(
                  "store",
                  "total_units",
                  storeItemWidgetData.data
                )}
              />
            );
          },
        },
        {
          title: "Units Per Item (Warehouse)",
          width: 400,
          height: 350,
          component: () => {
            return (
              <Widget.StackedBarChart
                name="warehouse"
                value={transformToStackedBarChart(
                  "warehouse",
                  "total_units",
                  warehouseItemWidgetData.data
                )}
              />
            );
          },
        },
      ],
      [DashboardWidgetSection.VALUE]: [
        {
          title: "Wholesale Value (Storewise)",
          width: 400,
          height: 350,
          component: () => {
            return (
              <Widget.StackedBarChart
                name="store"
                value={transformToStackedBarChart(
                  "store",
                  "total_wholesale_value",
                  storeItemWidgetData.data
                )}
              />
            );
          },
        },
        {
          title: "Retail Value (Storewise)",
          width: 400,
          height: 350,
          component: () => {
            return (
              <Widget.StackedBarChart
                name="store"
                value={transformToStackedBarChart(
                  "store",
                  "total_retail_value",
                  storeItemWidgetData.data
                )}
              />
            );
          },
        },
        {
          title: "Wholesale Value (Warehouse)",
          width: 400,
          height: 350,
          component: () => {
            return (
              <Widget.StackedBarChart
                name="warehouse"
                value={transformToStackedBarChart(
                  "warehouse",
                  "total_wholesale_value",
                  warehouseItemWidgetData.data
                )}
              />
            );
          },
        },
        {
          title: "Retail Value (Warehouse)",
          width: 400,
          height: 350,
          component: () => {
            return (
              <Widget.StackedBarChart
                name="warehouse"
                value={transformToStackedBarChart(
                  "warehouse",
                  "total_retail_value",
                  warehouseItemWidgetData.data
                )}
              />
            );
          },
        },
      ],
    };

    const adminWidgets = {
      [DashboardWidgetSection.ADMIN]: [
        {
          title: "Receive Item in Warehouse",
          component: ReceiveWarehouse,
        },
        {
          title: "Ship Item to Store",
          component: ShipStore,
        },
        {
          title: "Record Purchase",
          component: RecordPurchase,
        },
      ],
    };

    return {
      ...userWidgets,
      ...(currentUser?.is_superuser ? adminWidgets : {}),
    };
  }, [
    currentUser,
    itemWidgetData.data,
    warehouseItemWidgetData.data,
    storeItemWidgetData.data,
    storeRevenueData.data,
  ]);

  return (
    <>
      <Container maxW="full">
        <Box pt={16} display="flex" flexDirection="column" gap={4}>
          {Object.keys(widgets).map((section) => (
            <Card key={section} padding={4}>
              <Text mb={4} fontWeight="bold" fontSize="xl">
                {section.toUpperCase()}
              </Text>
              {widgets[section as DashboardWidgetSection] ? (
                <Box
                  display="flex"
                  gap={2}
                  flexWrap="wrap"
                  alignItems="flex-start"
                >
                  {(
                    widgets[
                      section as DashboardWidgetSection
                    ] as DashboardWidget[]
                  ).map((widget) => {
                    return (
                      <Widget
                        width={widget.width}
                        height={widget.height}
                        component={widget.component}
                        key={widget.title}
                        title={widget.title}
                        data={100}
                      />
                    );
                  })}
                </Box>
              ) : null}
            </Card>
          ))}
        </Box>
      </Container>
    </>
  );
}
