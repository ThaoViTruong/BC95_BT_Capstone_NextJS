import { RoleShell } from "@/components/layout/role-shell";
import { getRole } from "@/config/navigation";

const role = getRole("customer");

type CustomerLayoutProps = {
  children: React.ReactNode;
};

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  if (!role) {
    return children;
  }

  return (
    <RoleShell title={role.title} desc={role.desc} items={role.items}>
      {children}
    </RoleShell>
  );
}
