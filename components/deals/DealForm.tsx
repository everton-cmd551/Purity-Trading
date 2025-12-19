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
import { DatePicker } from "@/components/ui/date-picker"; // We'll assume this is exported correctly or adjust import
import { createDeal } from "@/app/actions/deal";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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
    paymentTermsFinancier: z.coerce.number().optional(),
    dealOwner: z.string().optional(),
    comments: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function DealForm({ masterData }: { masterData: any }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: "",
            date: new Date(),
            status: "Open",
            commodityId: "",
            supplierId: "",
            customerId: "",
            quantity: 0,
            supplierPricePerTon: 0,
            offtakePricePerTon: 0,
        },
    });

    const { watch } = form;
    const quantity = watch("quantity");
    const supplierPrice = watch("supplierPricePerTon");
    const offtakePrice = watch("offtakePricePerTon");

    const costValue = (quantity || 0) * (supplierPrice || 0);
    const salesValue = (quantity || 0) * (offtakePrice || 0);
    const grossMargin = salesValue - costValue;
    const marginPercent = salesValue > 0 ? (grossMargin / salesValue) * 100 : 0;

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        setServerError(null);

        const result = await createDeal({
            ...values,
            financierId: values.financierId === "none" ? undefined : values.financierId,
        });

        if (result.success) {
            router.push("/deals");
            router.refresh();
        } else {
            setServerError(result.error || "Something went wrong");
        }
        setIsSubmitting(false);
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Deal Details</CardTitle>
                        <CardDescription>Enter the core commercial terms.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                                            <SelectValue placeholder="Select Commodity" />
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

                                <FormField
                                    control={form.control}
                                    name="supplierId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Supplier</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Supplier" />
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
                                                        <SelectValue placeholder="Select Customer" />
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

                                <FormField
                                    control={form.control}
                                    name="financierId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Financier (Optional)</FormLabel>
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
                                                <FormLabel>Supplier Price ($)</FormLabel>
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
                                                <FormLabel>Offtake Price ($)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {serverError && <div className="text-destructive text-sm font-medium">{serverError}</div>}

                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Create Deal Note
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle>Economics Preview</CardTitle>
                        <CardDescription>System calculated values based on inputs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Cost Value</div>
                                <div className="text-2xl font-bold">${costValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Expected Sales</div>
                                <div className="text-2xl font-bold">${salesValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">Expected Gross Margin</div>
                                    <div className={cn("text-3xl font-bold", grossMargin < 0 ? "text-destructive" : "text-green-600")}>
                                        ${grossMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

                        {grossMargin < 0 && (
                            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm font-medium">
                                Warning: Negative margin detected.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
