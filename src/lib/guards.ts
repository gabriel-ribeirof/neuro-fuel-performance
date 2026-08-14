import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type Papel } from "@/lib/auth";

/**
 * Mantém cada área no seu público: cliente (responsavel) x equipe
 * (profissional/admin). Sem sessão, manda para o login correspondente.
 */
export function useGuardaAcesso(permitidos: Papel[], loginDestino: "/login" | "/acesso-equipe") {
  const { user, papel, carregando } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (carregando) return;
    if (!user) {
      navigate({ to: loginDestino, replace: true });
      return;
    }
    if (!papel) return; // perfil ainda carregando
    if (!permitidos.includes(papel)) {
      navigate({
        to: papel === "admin" ? "/admin" : papel === "profissional" ? "/profissional" : "/area-cliente",
        replace: true,
      });
    }
  }, [user, papel, carregando, navigate, loginDestino, permitidos.join(",")]);

  return { liberado: !!user && !!papel && permitidos.includes(papel), carregando };
}
