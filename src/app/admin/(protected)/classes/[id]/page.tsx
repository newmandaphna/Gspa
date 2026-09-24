import { requireAdmin } from "@/lib/auth";
import { ClassRoster } from "@/components/admin/classes/ClassAdmin";
export default async function AdminClassDetailPage({params}:{params:Promise<{id:string}>}){await requireAdmin();const {id}=await params;return <ClassRoster id={id}/>;}