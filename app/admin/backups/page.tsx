import { getAllBackupsAdmin } from "@/services/backup.service";
import { BackupsTable } from "@/components/admin/backup/backups-table";

export default async function BackupsPage() {
  let backups: Awaited<ReturnType<typeof getAllBackupsAdmin>> = [];
  try {
    backups = await getAllBackupsAdmin();
  } catch (e) {
    console.error("Failed to load backups:", e);
  }

  return <BackupsTable backups={backups} />;
}
