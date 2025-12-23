"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    createCommodity,
    createSupplier,
    createCustomer,
    createFinancier,
} from "@/app/(main)/actions/master-data";
import { toast } from "sonner"; // Assuming sonner is used, or I'll check for headers. Actually, I'll use standard alert or console if toast isn't obvious, but 'sonner' is common. I'll just use console.log/alert first or try to find a toast hook.
// Wait, I didn't check for toast. I'll stick to simple alerts or just log for now to avoid breakages, or better check for a hook.
// Let's assume no toast for now to be safe, or just use browser alert?
// Actually, I'll check imports in other files.

// Just in case, I will remove the toast usage and stick to simple state handling.

type MasterDataProps = {
    data: {
        commodities: any[];
        suppliers: any[];
        customers: any[];
        financiers: any[];
    }
};

export function MasterDataTabs({ data }: MasterDataProps) {
    const [openCommodity, setOpenCommodity] = useState(false);
    const [openSupplier, setOpenSupplier] = useState(false);
    const [openCustomer, setOpenCustomer] = useState(false);
    const [openFinancier, setOpenFinancier] = useState(false);

    // Form states
    const [commodityName, setCommodityName] = useState("");

    const [supplierName, setSupplierName] = useState("");
    const [supplierContact, setSupplierContact] = useState("");

    const [customerName, setCustomerName] = useState("");
    const [customerContact, setCustomerContact] = useState("");
    const [customerTerms, setCustomerTerms] = useState("");

    const [financierName, setFinancierName] = useState("");
    const [financierTerms, setFinancierTerms] = useState("");

    const [loading, setLoading] = useState(false);

    const handleCreateCommodity = async () => {
        setLoading(true);
        const res = await createCommodity({ name: commodityName });
        setLoading(false);
        if (res.success) {
            setOpenCommodity(false);
            setCommodityName("");
        } else {
            alert(res.error);
        }
    };

    const handleCreateSupplier = async () => {
        setLoading(true);
        const res = await createSupplier({ name: supplierName, contactDetails: supplierContact });
        setLoading(false);
        if (res.success) {
            setOpenSupplier(false);
            setSupplierName("");
            setSupplierContact("");
        } else {
            alert(res.error);
        }
    };

    const handleCreateCustomer = async () => {
        setLoading(true);
        const res = await createCustomer({ name: customerName, contactDetails: customerContact, defaultTerms: customerTerms });
        setLoading(false);
        if (res.success) {
            setOpenCustomer(false);
            setCustomerName("");
            setCustomerContact("");
            setCustomerTerms("");
        } else {
            alert(res.error);
        }
    };

    const handleCreateFinancier = async () => {
        setLoading(true);
        const res = await createFinancier({ name: financierName, fundingTerms: financierTerms });
        setLoading(false);
        if (res.success) {
            setOpenFinancier(false);
            setFinancierName("");
            setFinancierTerms("");
        } else {
            alert(res.error);
        }
    };

    return (
        <Tabs defaultValue="commodities" className="w-full space-y-4">
            <TabsList>
                <TabsTrigger value="commodities">Commodities</TabsTrigger>
                <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
                <TabsTrigger value="financiers">Financiers</TabsTrigger>
            </TabsList>

            {/* Commodities */}
            <TabsContent value="commodities">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Commodities</CardTitle>
                            <CardDescription>Tradeable goods configuration.</CardDescription>
                        </div>
                        <Dialog open={openCommodity} onOpenChange={setOpenCommodity}>
                            <DialogTrigger asChild>
                                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Commodity</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Commodity</DialogTitle>
                                    <DialogDescription>Add a new commodity to the system.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">Name</Label>
                                        <Input id="name" value={commodityName} onChange={(e) => setCommodityName(e.target.value)} className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateCommodity} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.commodities.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Suppliers */}
            <TabsContent value="suppliers">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Suppliers</CardTitle>
                            <CardDescription>Approved suppliers list.</CardDescription>
                        </div>
                        <Dialog open={openSupplier} onOpenChange={setOpenSupplier}>
                            <DialogTrigger asChild>
                                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Supplier</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Supplier</DialogTitle>
                                    <DialogDescription>Add a new supplier profile.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="s-name" className="text-right">Name</Label>
                                        <Input id="s-name" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="s-contact" className="text-right">Contact</Label>
                                        <Input id="s-contact" value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateSupplier} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.suppliers.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.contactDetails || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Customers */}
            <TabsContent value="customers">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Customers</CardTitle>
                            <CardDescription>Offtake partners.</CardDescription>
                        </div>
                        <Dialog open={openCustomer} onOpenChange={setOpenCustomer}>
                            <DialogTrigger asChild>
                                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Customer</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Customer</DialogTitle>
                                    <DialogDescription>Register a new customer.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="c-name" className="text-right">Name</Label>
                                        <Input id="c-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="c-contact" className="text-right">Contact</Label>
                                        <Input id="c-contact" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="c-terms" className="text-right">Terms</Label>
                                        <Input id="c-terms" value={customerTerms} onChange={(e) => setCustomerTerms(e.target.value)} className="col-span-3" placeholder="e.g. NET30" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateCustomer} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Terms</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.customers.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.contactDetails || '-'}</TableCell>
                                        <TableCell><Badge variant="outline">{item.defaultTerms || '-'}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Financiers */}
            <TabsContent value="financiers">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Financiers</CardTitle>
                            <CardDescription>Funding partners.</CardDescription>
                        </div>
                        <Dialog open={openFinancier} onOpenChange={setOpenFinancier}>
                            <DialogTrigger asChild>
                                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Financier</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Financier</DialogTitle>
                                    <DialogDescription>Add a new investment partner.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="f-name" className="text-right">Name</Label>
                                        <Input id="f-name" value={financierName} onChange={(e) => setFinancierName(e.target.value)} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="f-terms" className="text-right">Terms</Label>
                                        <Input id="f-terms" value={financierTerms} onChange={(e) => setFinancierTerms(e.target.value)} className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateFinancier} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Terms</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.financiers.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.fundingTerms || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
