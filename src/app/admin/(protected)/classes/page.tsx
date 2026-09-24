import { requireAdmin } from "@/lib/auth";
import { ClassAdminList } from "@/components/admin/classes/ClassAdmin";
export default async function AdminClassesPage(){await requireAdmin();return <ClassAdminList/>;}