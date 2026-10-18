'use client';

import type { AuditAction } from "@/services/dashboard";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card";

import {
    useAuditActions,
    useAssetsByType,
    useVersionGrowth
} from "@/hooks/use-dashboard";

const COLORS = [
    "#2563eb",
    "#16a34a",
    "#ea580c",
    "#dc2626",
    "#7c3aed",
    "#0891b2"
];

export function DashboardCharts() {

    const {
        data: auditActions,
        isLoading
    } = useAuditActions();

    const {
    data: assetTypes
    } = useAssetsByType();

    const {
    data: versionGrowth
    } = useVersionGrowth();

    if (isLoading) {
        return (
            <div className="mt-6">
                Loading Charts...
            </div>
        );
    }

    return (

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

            <Card>

                <CardHeader>

                    <CardTitle>
                        Audit Actions
                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <div className="h-[350px]">

                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >

                            <PieChart>

                                <Pie

                                    data={auditActions ?? []}

                                    dataKey="count"

                                    nameKey="action"

                                    outerRadius={120}

                                    label

                                >

                                    {

                                      auditActions?.map((item: AuditAction, index: number) => (
    <Cell
        key={index}
        fill={COLORS[index % COLORS.length]}
    />
))

                                    }

                                </Pie>

                                <Tooltip />

                                <Legend />

                            </PieChart>

                        </ResponsiveContainer>

                    </div>

                </CardContent>

            </Card>

            <Card>

    <CardHeader>

        <CardTitle>

            Assets By Type

        </CardTitle>

    </CardHeader>

    <CardContent>

        <div className="h-[350px]">

            <ResponsiveContainer
                width="100%"
                height="100%"
            >

                <BarChart
                    data={assetTypes ?? []}
                >

                    <CartesianGrid
                        strokeDasharray="3 3"
                    />

                    <XAxis
                        dataKey="assetType"
                    />

                    <YAxis />

                    <Tooltip />

                    <Legend />

                    <Bar
                        dataKey="count"
                        fill="#2563eb"
                        radius={[6,6,0,0]}
                    />

                </BarChart>

            </ResponsiveContainer>

        </div>

    </CardContent>

</Card>

<Card className="lg:col-span-2">

    <CardHeader>

        <CardTitle>

            Version Growth

        </CardTitle>

    </CardHeader>

    <CardContent>

        <div className="h-[350px]">

            <ResponsiveContainer
                width="100%"
                height="100%"
            >

                <LineChart
                    data={versionGrowth ?? []}
                >

                    <CartesianGrid
                        strokeDasharray="3 3"
                    />

                    <XAxis
                        dataKey="date"
                    />

                    <YAxis />

                    <Tooltip />

                    <Legend />

                    <Line

                        type="monotone"

                        dataKey="count"

                        stroke="#2563eb"

                        strokeWidth={3}

                        dot={{
                            r: 5
                        }}

                    />

                </LineChart>

            </ResponsiveContainer>

        </div>

    </CardContent>

</Card>

        </div>

    );

}