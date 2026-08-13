import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/pagamento/pendente")({
  head: () => ({ meta: [{ title: "Pagamento pendente — Nutrição Neurofuncional iEsports" }] }),
  component: PendentePage,
});

function PendentePage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl items-center px-6 py-20">
      <div className="w-full text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-camel/20">
          <span className="text-3xl text-cocoa">…</span>
        </div>
        <h1 className="mt-6 font-display text-3xl text-espresso">Aguardando pagamento</h1>
        <p className="mt-3 text-sm text-cocoa">
          Seu pedido ainda está pendente. Assim que o pagamento for confirmado pelo Mercado
          Pago você recebe a confirmação por e-mail e WhatsApp.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/area-cliente"
            className="rounded-full bg-espresso px-6 py-3.5 text-sm font-medium text-linen transition-colors hover:bg-cocoa"
          >
            Acompanhar no painel
          </Link>
          <Link
            to="/pacotes"
            className="rounded-full border border-border px-6 py-3.5 text-sm font-medium text-espresso transition-colors hover:bg-card"
          >
            Ver outros pacotes
          </Link>
        </div>
      </div>
    </section>
  );
}