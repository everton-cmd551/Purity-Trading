import { getReceivablesData } from "@/app/actions/receivables";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default async function ReceivablesPage() {
    const data = await getReceivablesData();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Customer Deliveries & Payments</h1>
                <p className="text-muted-foreground">Track deliveries, invoices, and customer receipts.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Receivables Ledger</CardTitle>
                    <CardDescription>
                        Per-delivery tracking of invoices and payments along with deal stock positions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table className="min-w-[1200px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Deal Note</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Commodity</TableHead>
                                <TableHead>Delivery Date</TableHead>
                                <TableHead className="text-right">COGS</TableHead>
                                <TableHead className="text-right">Offtake</TableHead>
                                <TableHead className="text-right">Contracted (MT)</TableHead>
                                <TableHead className="text-right">Delivered (MT)</TableHead>
                                <TableHead className="text-right">Stock Bal (MT)</TableHead>
                                <TableHead className="text-right">Stock Val ($)</TableHead>
                                <TableHead>Invoice #</TableHead>
                                <TableHead className="text-right">Inv Amount ($)</TableHead>
                                <TableHead className="text-right">Received ($)</TableHead>
                                <TableHead className="text-right">Outst. Bal ($)</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                                        No deliveries or deals found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row) => (
                                    <TableRow key={row.rowId}>
                                        <TableCell className="font-medium whitespace-nowrap">{row.dealId}</TableCell>
                                        <TableCell className="whitespace-nowrap">{row.customerName}</TableCell>
                                        <TableCell>{row.commodityName}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {row.deliveryDate ? format(row.deliveryDate, "MMM d, yyyy") : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">{row.cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right">{row.offtakePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right">{row.contractedTonnage.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right font-semibold">{row.deliveredQty > 0 ? row.deliveredQty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{row.outstandingStockQty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{row.stockValueAtCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell>{row.invoiceNumber}</TableCell>
                                        <TableCell className="text-right font-medium">{row.invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right text-green-600">{row.receiptAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className={cn("text-right font-bold", row.outstandingBalance > 0 ? "text-destructive" : "text-muted-foreground")}>
                                            {row.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                row.paymentStatus === 'Paid' ? 'default' :
                                                    row.paymentStatus === 'Part Paid' ? 'secondary' :
                                                        row.paymentStatus === 'Pending Delivery' ? 'outline' : 'destructive'
                                            }>
                                                {row.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
