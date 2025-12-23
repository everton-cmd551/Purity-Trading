"use client";

import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash, Edit, Plus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDelivery } from "@/app/(main)/actions/receivables";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DeliveryDialog, DealOption } from "./DeliveryDialog";

interface ReceivablesTableProps {
    data: any[];
    deals: DealOption[];
}

export function ReceivablesTable({ data, deals }: ReceivablesTableProps) {
    const router = useRouter();
    const [editingDelivery, setEditingDelivery] = useState<any>(null);
    const [showDialog, setShowDialog] = useState(false);

    const handleDelete = async (rowId: string) => {
        if (!rowId.startsWith('del-')) return;

        const id = rowId.replace('del-', '');
        if (!confirm("Are you sure? This will delete the Delivery and associated Payment records (if any). This cannot be undone.")) return;

        toast.info("Deleting delivery...");
        const result = await deleteDelivery(id);
        if (result.success) {
            toast.success("Delivery deleted successfully");
            router.refresh();
        } else {
            toast.error("Failed to delete delivery");
        }
    };

    const handleEdit = (row: any) => {
        // Construct initialData from row
        // note: row has flat structure from getReceivablesData
        // We need to map it back to what DeliveryDialog expects
        const initialData = {
            id: row.rowId.replace('del-', ''),
            dealId: row.dealId,
            date: new Date(row.deliveryDate),
            quantity: row.deliveredQty, // Current delivery quantity
            invoiceNumber: row.invoiceNumber,
            deal: {
                id: row.dealId,
                customer: { name: row.customerName },
                commodity: { name: row.commodityName },
                offtakePricePerTon: row.offtakePrice
            }
        };
        setEditingDelivery(initialData);
        setShowDialog(true);
    };

    const handleCreate = () => {
        setEditingDelivery(null);
        setShowDialog(true);
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Record New Delivery</Button>
            </div>

            <DeliveryDialog
                deals={deals}
                initialData={editingDelivery}
                open={showDialog}
                onOpenChange={setShowDialog}
            />

            <Table className="min-w-[1500px]">
                <TableHeader>
                    <TableRow>
                        <TableHead>Deal Note Number</TableHead>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>COMMODITY</TableHead>
                        <TableHead>Delivery Date</TableHead>
                        <TableHead className="text-right">Cost of Goods Sold</TableHead>
                        <TableHead className="text-right">Offtake Price</TableHead>
                        <TableHead className="text-right">Contracted Tonnage</TableHead>
                        <TableHead className="text-right">Delivered Quantity</TableHead>
                        <TableHead className="text-right">Outstanding Stock (Quantity)</TableHead>
                        <TableHead className="text-right">Stock / Inventory @ Cost</TableHead>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead className="text-right">Invoice Amount</TableHead>
                        <TableHead className="text-right">Receipt Amount</TableHead>
                        <TableHead className="text-right">Payment Received From Customer</TableHead>
                        <TableHead className="text-right">Outstanding Balance</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={17} className="text-center py-8 text-muted-foreground">
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
                                    {row.deliveryDate ? format(new Date(row.deliveryDate), "MMM d, yyyy") : '-'}
                                </TableCell>
                                <TableCell className="text-right">{row.cogs?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right">{row.offtakePrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right">{row.contractedTonnage?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right font-semibold">{row.deliveredQty > 0 ? row.deliveredQty.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{row.outstandingStockQty?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{row.stockValueAtCost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell>{row.invoiceNumber}</TableCell>
                                <TableCell className="text-right font-medium">{row.invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right text-green-600">{row.receiptAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
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
                                <TableCell>
                                    {row.rowId.startsWith('del-') && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={() => handleEdit(row)}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDelete(row.rowId)}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
