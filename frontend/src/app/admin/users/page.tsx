import { HmsShell } from "@/components/hms-shell";
import { UsersRolesView } from "@/components/admin/users-roles-view";

export default function AdminUsersPage() {
  return (
    <HmsShell
      role="ADMINISTRATOR"
      breadcrumbs={[
        { label: "Administration", href: "/dashboard/admin" },
        { label: "User & Role Management" },
      ]}
    >
      <UsersRolesView />
    </HmsShell>
  );
}
