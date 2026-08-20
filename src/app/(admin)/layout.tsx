import { RoleShell } from "@/components/layout/role-shell";
import { getRole } from "@/config/navigation";

const role = getRole("admin");

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  if (!role) {
    return children;
  }

  return (
    <RoleShell title={role.title} desc={role.desc} items={role.items}>
      {children}
    </RoleShell>
  );
}
