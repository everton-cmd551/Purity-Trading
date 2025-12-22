import { getMasterDataOptions } from "@/app/actions/deal";
import { MasterDataTabs } from "./MasterDataTabs";

export default async function MasterDataPage() {
    const data = await getMasterDataOptions();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Master Data</h1>
                <p className="text-muted-foreground">Manage core entities and settings.</p>
            </div>

            <MasterDataTabs data={data} />
        </div>
    );
}
