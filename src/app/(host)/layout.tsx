import { RoleShell } from "@/components/layout/role-shell";
import { getRole } from "@/config/navigation";

const role = getRole("host");

type HostLayoutProps = {
  children: React.ReactNode;
};

export default function HostLayout({ children }: HostLayoutProps) {
  if (!role) {
    return children;
  }

  return (
    <RoleShell title={role.title} desc={role.desc} items={role.items}>
      {children}
    </RoleShell>
  );
}
