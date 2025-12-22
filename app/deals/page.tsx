"use client";

import { useState, useEffect } from "react";
import { getDeals, getMasterDataOptions, createDeal, deleteDeal, updateDeal } from "@/app/actions/deal";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Trash, Edit } from "lucide-react";
import { DealForm } from "@/components/deals/DealForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

export default function DealsPage() {
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingDeal, setEditingDeal] = useState<any>(null); // State for the deal being edited
    const [options, setOptions] = useState<any>({ commodities: [], suppliers: [], customers: [], financiers: [] });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [dealsData, optionsData] = await Promise.all([
                getDeals(),
                getMasterDataOptions()
            ]);
            setDeals(dealsData);
            setOptions(optionsData);
        } catch (error) {
            toast.error("Failed to load data. Please refresh.");
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will delete the Deal and ALL associated Deliveries, Payments, and Loans. This cannot be undone.")) return;

        toast.info("Deleting deal...");
        const result = await deleteDeal(id);
        if (result.success) {
            toast.success("Deal deleted successfully");
            loadData();
        } else {
            toast.error("Failed to delete deal");
        }
    };

    const handleEdit = (deal: any) => {
        setEditingDeal(deal);
        setShowForm(true);
    };

    const handleCreateNew = () => {
        setEditingDeal(null);
        setShowForm(true);
    }

    if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-48" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Deal Register</h1>
                    <p className="text-muted-foreground">Manage trading contracts and their status.</p>
                </div>
                <Button onClick={handleCreateNew} className="gap-2">
                    <Plus className="h-4 w-4" /> New Deal
                </Button>
            </div>

            <Sheet open={showForm} onOpenChange={setShowForm}>
                <SheetContent side="right" className="sm:max-w-[900px] w-full overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle>{editingDeal ? "Edit Deal" : "Create New Deal"}</SheetTitle>
                        <SheetDescription>
                            {editingDeal ? `Modify details for deal ${editingDeal.id}.` : "Enter details for the new transaction."}
                        </SheetDescription>
                    </SheetHeader>
                    <DealForm
                        open={showForm}
                        onOpenChange={setShowForm}
                        masterData={options}
                        initialData={editingDeal}
                        onSubmit={async (data) => {
                            let result;
                            if (editingDeal) {
                                result = await updateDeal(editingDeal.id, { ...data, financierId: data.financierId === "none" ? undefined : data.financierId });
                            } else {
                                result = await createDeal({ ...data, financierId: data.financierId === "none" ? undefined : data.financierId });
                            }

                            if (result.success) {
                                toast.success(editingDeal ? "Deal updated successfully" : "Deal created successfully");
                                setShowForm(false);
                                loadData();
                            } else {
                                toast.error(result.error);
                            }
                        }}
                    />
                </SheetContent>
            </Sheet>

            <Card>
                <CardHeader>
                    <CardTitle>All Deals</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Ref ID</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Commodity</TableHead>
                                <TableHead className="text-right">Quantity (MT)</TableHead>
                                <TableHead className="text-right">Buy Price</TableHead>
                                <TableHead className="text-right">Sell Price</TableHead>
                                <TableHead className="text-right">Margin %</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                        No deals recorded.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                deals.map((deal) => (
                                    <TableRow key={deal.id}>
                                        <TableCell>{format(new Date(deal.date), "MMM d, yyyy")}</TableCell>
                                        <TableCell className="font-medium">{deal.id}</TableCell>
                                        <TableCell>
                                            <Badge variant={deal.status === "Open" ? "default" : "secondary"}>
                                                {deal.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{deal.customer.name}</TableCell>
                                        <TableCell>{deal.commodity.name}</TableCell>
                                        <TableCell className="text-right">{deal.quantity.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">${Number(deal.supplierPricePerTon).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">${Number(deal.offtakePricePerTon).toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                            {deal.expectedMarginPercentage.toFixed(1)}%
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => handleEdit(deal)}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => handleDelete(deal.id)}
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
