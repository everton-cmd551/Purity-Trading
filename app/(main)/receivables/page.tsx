import { getReceivablesData, getDealsForDelivery } from "@/app/(main)/actions/receivables";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceivablesTable } from "@/components/receivables/ReceivablesTable";

export default async function ReceivablesPage() {
    const [data, dealOptions] = await Promise.all([
        getReceivablesData(),
        getDealsForDelivery()
    ]);

    // Format deals for the dropdown helper in table
    const formattedDeals = dealOptions.map((deal) => ({
        id: deal.id,
        customerName: deal.customerName || "Unknown",
        commodityName: deal.commodityName || "Unknown",
        offtakePrice: Number(deal.offtakePrice)
    }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customer Deliveries & Payments</h1>
                    <p className="text-muted-foreground">Track deliveries, invoices, and customer receipts.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Receivables Ledger</CardTitle>
                    <CardDescription>
                        Per-delivery tracking of invoices and payments along with deal stock positions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <ReceivablesTable data={data} deals={formattedDeals} />
                </CardContent>
            </Card>
        </div>
    );
}
