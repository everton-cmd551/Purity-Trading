"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { recordDelivery, updateDelivery } from "@/app/actions/receivables";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export interface DealOption {
    id: string;
    customerName: string;
    commodityName: string;
    offtakePrice: number;
}

interface DeliveryDialogProps {
    deals: DealOption[];
    initialData?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function DeliveryDialog({ deals, initialData, open: controlledOpen, onOpenChange: setControlledOpen, trigger }: DeliveryDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = setControlledOpen || setInternalOpen;

    const [selectedDealId, setSelectedDealId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [quantity, setQuantity] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (initialData) {
            setSelectedDealId(initialData.dealId);
            setDate(new Date(initialData.date).toISOString().split('T')[0]);
            setQuantity(initialData.quantity.toString());
            setInvoiceNumber(initialData.invoiceNumber);
        } else {
            // Reset logic if needed when dialogue opens for New
            if (open && !initialData) {
                // Optionally clear fields
            }
        }
    }, [initialData, open]);

    const selectedDeal = deals.find(d => d.id === selectedDealId) || (initialData?.deal ? {
        id: initialData.deal.id,
        customerName: initialData.deal.customer.name,
        commodityName: initialData.deal.commodity.name,
        offtakePrice: Number(initialData.deal.offtakePricePerTon)
    } : undefined);

    // Calculate invoice amount for display
    const invoiceAmount = selectedDeal && quantity
        ? (selectedDeal.offtakePrice * parseFloat(quantity || "0"))
        : 0;

    async function handleSubmit() {
        if (!selectedDealId || !date || !quantity || !invoiceNumber) {
            toast.error("Please fill in all fields.");
            return;
        }

        let result;
        if (initialData) {
            result = await updateDelivery(initialData.id, {
                dealId: selectedDealId,
                date: new Date(date),
                quantity: parseFloat(quantity),
                invoiceNumber: invoiceNumber
            });
        } else {
            result = await recordDelivery({
                dealId: selectedDealId,
                date: new Date(date),
                quantity: parseFloat(quantity),
                invoiceNumber: invoiceNumber
            });
        }

        if (result.success) {
            toast.success(initialData ? "Delivery updated successfully." : "Delivery recorded successfully.");
            setOpen(false);
            if (!initialData) {
                setQuantity("");
                setInvoiceNumber("");
                setSelectedDealId("");
            }
            router.refresh();
        } else {
            toast.error(result.error || "Failed to save delivery.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Delivery" : "Record New Delivery"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Modify delivery details." : "Select a Deal Note to auto-fill details."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Deal Note</Label>
                        {initialData ? (
                            <Input value={selectedDealId} disabled className="col-span-3 bg-muted" />
                        ) : (
                            <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Deal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {deals.map((deal) => (
                                        <SelectItem key={deal.id} value={deal.id}>
                                            {deal.id} - {deal.customerName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {selectedDeal && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Customer</Label>
                                <Input value={selectedDeal.customerName} disabled className="col-span-3 bg-muted font-medium" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Commodity</Label>
                                <Input value={selectedDeal.commodityName} disabled className="col-span-3 bg-muted font-medium" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Offtake Price</Label>
                                <Input
                                    value={`$${selectedDeal.offtakePrice.toLocaleString()}`}
                                    disabled
                                    className="col-span-3 bg-muted"
                                />
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Delivery Date</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Quantity (MT)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="col-span-3"
                            placeholder="0.00"
                        />
                    </div>

                    {selectedDeal && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right font-semibold text-blue-600">Invoice Amt</Label>
                            <Input
                                value={`$${invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                disabled
                                className="col-span-3 bg-blue-50 font-bold text-blue-700"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Invoice Number</Label>
                        <Input
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            className="col-span-3"
                            placeholder="INV-XXXX"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>{initialData ? "Update Delivery" : "Save Delivery"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
