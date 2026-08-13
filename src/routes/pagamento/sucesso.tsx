import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/pagamento/sucesso")({
  head: () => ({ meta: [{ title: "Pagamento confirmado — Nutrição Neurofuncional iEsports" }] }),
  component: SucessoPage,
});

function SucessoPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl items-center px-6 py-20">
      <div className="w-full text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/10">
          <span className="text-3xl text-emerald-700">✓</span>
        </div>
        <h1 className="mt-6 font-display text-3xl text-espresso">Pagamento confirmado!</h1>
        <p className="mt-3 text-sm text-cocoa">
          Recebemos sua confirmação. Agora é só agendar a avaliação inicial — as duas
          primeiras sessões ficam marcadas na mesma semana.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/agendamento"
            className="rounded-full bg-espresso px-6 py-3.5 text-sm font-medium text-linen transition-colors hover:bg-cocoa"
          >
            Agendar avaliação inicial
          </Link>
          <Link
            to="/area-cliente"
            className="rounded-full border border-border px-6 py-3.5 text-sm font-medium text-espresso transition-colors hover:bg-card"
          >
            Ir para a área do cliente
          </Link>
        </div>
      </div>
    </section>
  );
}