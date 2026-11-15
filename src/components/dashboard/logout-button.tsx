import { logoutDashboard } from "@/modules/dashboard/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logoutDashboard}>
      <Button type="submit" variant="outline">
        Salir
      </Button>
    </form>
  );
}
