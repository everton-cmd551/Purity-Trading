"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { createDeal } from "@/app/(main)/actions/deal";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Calculator } from "lucide-react";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    id: z.string().min(1, "Deal Note Number is required"),
    date: z.date(),
    status: z.string(),
    commodityId: z.string().min(1, "Commodity is required"),
    commodityGrade: z.string().optional(),
    supplierId: z.string().min(1, "Supplier is required"),
    customerId: z.string().min(1, "Customer is required"),
    financierId: z.string().optional(),
    quantity: z.coerce.number().min(0.01, "Tonnage must be positive"),
    supplierPricePerTon: z.coerce.number().min(0.01, "Price must be positive"),
    offtakePricePerTon: z.coerce.number().min(0.01, "Price must be positive"),
    paymentTermsCustomer: z.coerce.number().optional(),

    // Financing Fields (Matches Excel)
    paymentTermsFinancier: z.coerce.number().optional(), // "Payment Expected (days)"
    disbursementDate: z.date().optional(),
    maturityValue: z.coerce.number().optional(),

    dealOwner: z.string().optional(),
    comments: z.string().optional(),
}).refine((data) => {
    if (data.disbursementDate && data.date > data.disbursementDate) {
        return false;
    }
    return true;
}, {
    message: "Disbursement date cannot be earlier than Deal date",
    path: ["disbursementDate"],
});

type FormValues = z.infer<typeof formSchema>;

interface DealFormProps {
    masterData: any;
    initialData?: any;
    onSubmit: (data: FormValues) => Promise<void>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DealForm({ masterData, initialData, onSubmit, open, onOpenChange }: DealFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: initialData?.id || "",
            date: initialData?.date ? new Date(initialData.date) : new Date(),
            status: initialData?.status || "Open",
            commodityId: initialData?.commodityId || "",
            commodityGrade: initialData?.commodityGrade || "",
            supplierId: initialData?.supplierId || "",
            customerId: initialData?.customerId || "",
            financierId: initialData?.financierId || "none",
            quantity: initialData ? Number(initialData.quantity) : 0,
            supplierPricePerTon: initialData ? Number(initialData.supplierPricePerTon) : 0,
            offtakePricePerTon: initialData ? Number(initialData.offtakePricePerTon) : 0,
            paymentTermsCustomer: initialData?.paymentTermsCustomer || 0,
            paymentTermsFinancier: initialData?.paymentTermsFinancier || 30,
            disbursementDate: initialData?.loan?.disbursementDate ? new Date(initialData.loan.disbursementDate) : undefined,
            dealOwner: initialData?.dealOwner || "",
            comments: initialData?.comments || "",
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                id: initialData.id,
                date: new Date(initialData.date),
                status: initialData.status,
                commodityId: initialData.commodityId,
                commodityGrade: initialData.commodityGrade || "",
                supplierId: initialData.supplierId,
                customerId: initialData.customerId,
                financierId: initialData.financierId || "none",
                quantity: Number(initialData.quantity),
                supplierPricePerTon: Number(initialData.supplierPricePerTon),
                offtakePricePerTon: Number(initialData.offtakePricePerTon),
                paymentTermsCustomer: initialData.paymentTermsCustomer,
                paymentTermsFinancier: initialData.paymentTermsFinancier,
                disbursementDate: initialData.loan?.disbursementDate ? new Date(initialData.loan.disbursementDate) : undefined,
                dealOwner: initialData.dealOwner || "",
                comments: initialData.comments || "",
            });
        } else {
            form.reset({
                id: "",
                date: new Date(),
                status: "Open",
                commodityId: "",
                supplierId: "",
                customerId: "",
                quantity: 0,
                supplierPricePerTon: 0,
                offtakePricePerTon: 0,
                paymentTermsFinancier: 30,
                financierId: "none"
            });
        }
    }, [initialData, form]);

    const { watch, setValue } = form;
    const quantity = watch("quantity");
    const supplierPrice = watch("supplierPricePerTon");
    const offtakePrice = watch("offtakePricePerTon");
    const financierId = watch("financierId");
    const disbursementDate = watch("disbursementDate");
    const paymentTermsFinancier = watch("paymentTermsFinancier");

    const costValue = (quantity || 0) * (supplierPrice || 0);
    const salesValue = (quantity || 0) * (offtakePrice || 0);
    const grossMargin = salesValue - costValue;
    const marginPercent = salesValue > 0 ? (grossMargin / salesValue) * 100 : 0;

    let maturityDateDisplay = "N/A";
    if (disbursementDate && paymentTermsFinancier) {
        const mDate = addDays(disbursementDate, paymentTermsFinancier);
        maturityDateDisplay = format(mDate, "MMM d, yyyy");
    }

    useEffect(() => {
        const calculatedMaturity = (quantity || 0) * (supplierPrice || 0);
        setValue("maturityValue", calculatedMaturity);
    }, [quantity, supplierPrice, setValue]);

    async function handleFormSubmit(values: FormValues) {
        setIsSubmitting(true);
        setServerError(null);
        try {
            await onSubmit(values);
        } catch (e: any) {
            setServerError(e.message || "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    }

    const hasFinancier = financierId && financierId !== "none";

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* 1. Core Deal Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Deal Details</CardTitle>
                                <CardDescription>Basic transaction information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Deal Note Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="RP-0008" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Deal Date</FormLabel>
                                                <DatePicker value={field.value} onChange={field.onChange} />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Open">Open</SelectItem>
                                                        <SelectItem value="Closed">Closed</SelectItem>
                                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Participants */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="commodityId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Commodity</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Commodity" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {masterData.commodities.map((c: any) => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="commodityGrade"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Grade / Notes</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Optional" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="supplierId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Supplier</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Supplier" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {masterData.suppliers.map((s: any) => (
                                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="customerId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Customer</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Customer" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {masterData.customers.map((c: any) => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="p-4 bg-muted/20 rounded-lg space-y-4 border">
                                    <div className="font-semibold flex items-center gap-2">
                                        <Calculator className="w-4 h-4" /> Economics
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="quantity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tonnage (MT)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="supplierPricePerTon"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Supp Price ($)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="offtakePricePerTon"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sales Price ($)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Financing & Terms */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Financing & Terms</CardTitle>
                                <CardDescription>Loan details and maturity calculations.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="financierId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Financier</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Financier" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">None (Self-Funded)</SelectItem>
                                                    {masterData.financiers.map((f: any) => (
                                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {hasFinancier && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <FormField
                                            control={form.control}
                                            name="disbursementDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Disbursement Date</FormLabel>
                                                    <DatePicker value={field.value} onChange={field.onChange} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="paymentTermsFinancier"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Expect Pay (Days)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="flex flex-col space-y-2 pt-2">
                                            <span className="text-sm font-medium text-muted-foreground">Maturity Date</span>
                                            <div className="p-2 bg-muted rounded-md text-sm font-semibold border">
                                                {maturityDateDisplay}
                                            </div>
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="maturityValue"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Maturity Value ($)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            readOnly
                                                            className="bg-muted font-semibold text-foreground"
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Formula: Supplier Price * Tonnage</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {serverError && <div className="text-destructive text-sm font-medium">{serverError}</div>}

                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Deal
                        </Button>
                    </form>
                </Form>
            </div>

            {/* Preview Panel */}
            <div className="space-y-6">
                <Card className="bg-muted/50 sticky top-4">
                    <CardHeader>
                        <CardTitle>Summary Preview</CardTitle>
                        <CardDescription>Estimated values.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Transaction Value (Cost)</div>
                                <div className="text-2xl font-bold">${costValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Expected Sales Value</div>
                                <div className="text-2xl font-bold">${salesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">Expected Gross Margin</div>
                                    <div className={cn("text-3xl font-bold", grossMargin < 0 ? "text-destructive" : "text-green-600")}>
                                        ${grossMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-muted-foreground">Margin %</div>
                                    <div className={cn("text-xl font-bold", marginPercent < 0 ? "text-destructive" : "text-green-600")}>
                                        {marginPercent.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
