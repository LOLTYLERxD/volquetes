import { usePage } from "@inertiajs/react";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "jefe" | "empleado";
}

interface PageProps {
  auth: { user: AuthUser | null };
  [key: string]: unknown;
}

export function useAuth() {
  const { auth } = usePage<PageProps>().props;
  const user = auth.user;
  return {
    user,
    isJefe:          user?.role === "jefe",
    isEmpleado:      user?.role === "empleado",
    isAuthenticated: !!user,
  };
}
