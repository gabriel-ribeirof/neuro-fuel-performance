import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Dna,
  HeartHandshake,
  Laptop,
  MapPin,
  Quote,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";

import { Reveal } from "@/components/Reveal";
import heroImg from "@/assets/hero.jpg";
import neuroImg from "@/assets/neuro.jpg";
import amandaImg from "@/assets/team-amanda.jpg";
import manuelaImg from "@/assets/team-manuela.jpg";
import leticiaImg from "@/assets/team-leticia.jpg";
import gabrielImg from "@/assets/team-gabriel.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nutrição Neurofuncional iEsports | Neuronutrição para atletas" },
      {
        name: "description",
        content:
          "Neuronutrição, performance cognitiva e saúde mental esportiva para atletas aprovados no projeto Experience da iEsports. Presencial em São Paulo e online.",
      },
      {
        property: "og:title",
        content: "Nutrição Neurofuncional iEsports | Neuronutrição para atletas",
      },
      {
        property: "og:description",
        content:
          "Nutrição funcional, testes genéticos e acompanhamento psicológico para atletas de alto rendimento.",
      },
    ],
  }),
  component: Index,
});

const trustItems = [
  "Atendimento presencial e online",
  "+10 anos de experiência com atletas de alto rendimento",
  "Parceria oficial iEsports",
];

const differentials = [
  { icon: Sparkles, title: "Atendimento personalizado", text: "Protocolos desenhados para a rotina e a modalidade de cada atleta." },
  { icon: Users, title: "Equipe multidisciplinar", text: "Nutrição, neurociência e psicologia do esporte em um só cuidado." },
  { icon: ShieldCheck, title: "Parceria com a CBF", text: "Experiência com formação de base e alto rendimento nacional." },
  { icon: Laptop, title: "Presencial e online", text: "Consultório em São Paulo e acompanhamento remoto no exterior." },
];

const steps = [
  { n: "01", title: "Aprovação no Experience", text: "O atleta é aprovado no projeto Experience da iEsports." },
  { n: "02", title: "Escolha do pacote", text: "Seleção do plano de acompanhamento ideal para o momento da carreira." },
  { n: "03", title: "Pagamento", text: "Confirmação segura e liberação imediata da agenda." },
  { n: "04", title: "Anamnese com Amanda", text: "Avaliação nutricional completa e histórico de performance." },
  { n: "05", title: "Sessão com Letícia", text: "Encontro de saúde mental esportiva na mesma semana." },
  { n: "06", title: "Acompanhamento contínuo", text: "Ajustes, retornos e suporte durante toda a jornada." },
];

const services = [
  { icon: UtensilsCrossed, title: "Consulta Nutricional", text: "Avaliação, plano alimentar e estratégia de composição corporal para o esporte." },
  { icon: Brain, title: "Consulta Neuronutricional", text: "Nutrientes, foco, sono e regulação emocional aplicados à performance." },
  { icon: Dna, title: "Teste Genético e Metabolômica", text: "Leitura individual do metabolismo para decisões precisas de nutrição." },
  { icon: HeartHandshake, title: "Sessões Individuais", text: "Performance cognitiva, emocional e comportamental com psicologia do esporte." },
];

const packages = [
  { name: "Essencial", price: "R$ 890", items: ["Consulta nutricional completa", "Plano alimentar individual", "1 retorno em 30 dias"] },
  { name: "Performance", price: "R$ 1.480", items: ["Consulta neuronutricional", "Sessão de performance mental", "2 retornos trimestrais"] },
  { name: "Alto Rendimento", price: "R$ 2.390", items: ["Nutrição + psicologia mensal", "Ajustes de periodização", "Suporte direto com a equipe"] },
  { name: "Experience Full", price: "R$ 3.890", items: ["Teste genético e metabolômica", "Acompanhamento contínuo 6 meses", "Relatórios para comissão técnica"] },
];

const team = [
  { name: "Amanda Ciaramicoli", role: "Nutricionista esportiva e neurofuncional", img: amandaImg },
  { name: "Manuela Gestal", role: "Médica do esporte e medicina integrativa", img: manuelaImg },
  { name: "Letícia Frazão", role: "Psicóloga do esporte", img: leticiaImg },
  { name: "Gabriel Fernandes", role: "Coordenação iEsports Experience", img: gabrielImg },
];

const values = [
  { title: "Ética e respeito", text: "Cada atleta é tratado com transparência e sigilo absoluto." },
  { title: "Segurança e bem-estar", text: "Nenhum resultado justifica risco à saúde do atleta." },
  { title: "Atualização constante", text: "Ciência atual aplicada à prática esportiva real." },
  { title: "Acompanhamento próximo", text: "Presença durante toda a temporada, não apenas na consulta." },
  { title: "Compromisso e profissionalismo", text: "Padrão internacional em cada etapa do processo." },
];

const testimonials = [
  { quote: "Meu foco em campo mudou completamente depois do acompanhamento. Entendi como comer para render.", author: "Rafael M.", role: "Atleta — categoria sub-20" },
  { quote: "Como mãe, senti segurança do primeiro contato. A equipe cuida do atleta e da família.", author: "Cristiane P.", role: "Mãe de atleta no exterior" },
  { quote: "A parte emocional era meu maior obstáculo. As sessões me deram ferramentas reais para os jogos.", author: "Lucas D.", role: "Atleta profissional" },
];

function Index() {
  const [slide, setSlide] = useState(0);
  const total = testimonials.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Trust bar */}
      <div className="bg-espresso text-linen">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-6 py-3 text-[0.7rem] font-medium tracking-[0.16em] uppercase">
          {trustItems.map((t) => (
            <span key={t} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-camel" />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="#top" className="font-display text-lg tracking-[0.18em] uppercase">
            iEsports <span className="text-camel">Nutri</span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-cocoa md:flex">
            <a href="#servicos" className="hover:text-espresso">Serviços</a>
            <a href="#pacotes" className="hover:text-espresso">Pacotes</a>
            <a href="#equipe" className="hover:text-espresso">Equipe</a>
            <a href="#onde" className="hover:text-espresso">Onde atendemos</a>
          </div>
          <a
            href="#pacotes"
            className="rounded-full bg-espresso px-5 py-2.5 text-sm font-medium text-linen transition-colors hover:bg-cocoa"
          >
            Iniciar jornada
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section id="top" className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <Reveal>
          <p className="eyebrow">Neuronutrição esportiva</p>
          <h1 className="mt-6 text-5xl leading-[1.05] font-normal text-espresso lg:text-7xl">
            A mente do atleta<br />
            também se <em className="italic text-camel">nutre</em>.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-cocoa">
            Nutrição funcional, neurociência e saúde mental esportiva para atletas aprovados no
            projeto Experience da iEsports — no Brasil e no exterior.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <a href="#pacotes" className="inline-flex items-center gap-2 rounded-full bg-espresso px-7 py-3.5 text-sm font-medium text-linen transition-colors hover:bg-cocoa">
              Conheça os pacotes <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </a>
            <a href="#processo" className="inline-flex items-center rounded-full border border-cocoa px-7 py-3.5 text-sm font-medium text-cocoa transition-colors hover:bg-khaki">
              Como funciona
            </a>
          </div>
          <div className="mt-12 flex items-center gap-8">
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border border-camel text-center">
              <span className="font-display text-xl text-espresso">+10</span>
              <span className="text-[0.6rem] tracking-[0.14em] text-cocoa uppercase">anos</span>
            </div>
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border border-camel text-center">
              <span className="font-display text-xl text-espresso">+1000</span>
              <span className="text-[0.6rem] tracking-[0.14em] text-cocoa uppercase">atletas</span>
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <img
            src={heroImg}
            alt="Nutricionista esportiva em consulta com atleta"
            width={1200}
            height={1408}
            className="h-[560px] w-full rounded-[2rem] object-cover shadow-[0_40px_80px_-50px_rgba(74,52,42,0.6)]"
          />
        </Reveal>
      </section>

      {/* Differentials */}
      <section className="border-y border-border bg-khaki/50">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {differentials.map((d, i) => (
            <Reveal key={d.title} delay={i * 90}>
              <d.icon className="h-7 w-7 text-camel" strokeWidth={1.2} />
              <h3 className="mt-4 text-xl text-espresso">{d.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cocoa">{d.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Process */}
      <section id="processo" className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <p className="eyebrow">O processo</p>
          <h2 className="mt-4 max-w-xl text-4xl text-espresso lg:text-5xl">
            Da aprovação no Experience ao acompanhamento contínuo
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 70} className="bg-card">
              <div className="p-8">
                <span className="font-display text-3xl text-camel">{s.n}</span>
                <h3 className="mt-4 text-xl text-espresso">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cocoa">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Neuronutrition */}
      <section className="bg-khaki/60">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-2">
          <Reveal>
            <img
              src={neuroImg}
              alt="Alimentos funcionais para performance cognitiva"
              loading="lazy"
              width={1200}
              height={912}
              className="h-[420px] w-full rounded-[2rem] object-cover"
            />
          </Reveal>
          <Reveal delay={100}>
            <p className="eyebrow">O que é neuronutrição</p>
            <h2 className="mt-4 text-4xl text-espresso lg:text-5xl">
              Alimentação que conversa com o cérebro
            </h2>
            <p className="mt-6 leading-relaxed text-cocoa">
              A neuronutrição estuda como nutrientes, microbiota e rotina alimentar influenciam
              foco, tempo de reação, humor, sono e recuperação. No esporte de alto rendimento, essa
              conexão define a diferença entre treinar bem e competir bem.
            </p>
            <p className="mt-4 leading-relaxed text-cocoa">
              Traduzimos ciência em condutas práticas: o que comer antes de um jogo decisivo, como
              sustentar energia em viagens internacionais e como reduzir a ansiedade competitiva
              pela via metabólica.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Services */}
      <section id="servicos" className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <p className="eyebrow">Nossos serviços</p>
          <h2 className="mt-4 text-4xl text-espresso lg:text-5xl">Cuidado completo do atleta</h2>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <article className="soft-card h-full p-8">
                <s.icon className="h-7 w-7 text-camel" strokeWidth={1.2} />
                <h3 className="mt-6 text-2xl leading-tight text-espresso">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cocoa">{s.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section id="pacotes" className="border-y border-border bg-khaki/50">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <Reveal>
            <p className="eyebrow">Pacotes disponíveis</p>
            <h2 className="mt-4 text-4xl text-espresso lg:text-5xl">Escolha o seu plano</h2>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((p, i) => (
              <Reveal key={p.name} delay={i * 80}>
                <article className="soft-card flex h-full flex-col p-8">
                  <h3 className="text-2xl text-espresso">{p.name}</h3>
                  <p className="mt-3 font-display text-3xl text-camel">{p.price}</p>
                  <ul className="mt-6 flex-1 space-y-3 text-sm text-cocoa">
                    {p.items.map((it) => (
                      <li key={it} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-camel" />
                        {it}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#cta"
                    className="mt-8 inline-flex items-center justify-center rounded-full bg-espresso px-5 py-3 text-sm font-medium text-linen transition-colors hover:bg-cocoa"
                  >
                    Escolher pacote
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="equipe" className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <p className="eyebrow">Nossa equipe</p>
          <h2 className="mt-4 text-4xl text-espresso lg:text-5xl">Quem acompanha você</h2>
        </Reveal>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m, i) => (
            <Reveal key={m.name} delay={i * 80}>
              <img
                src={m.img}
                alt={`Retrato de ${m.name}`}
                loading="lazy"
                width={800}
                height={1000}
                className="aspect-[4/5] w-full rounded-2xl object-cover"
              />
              <h3 className="mt-5 text-xl text-espresso">{m.name}</h3>
              <p className="mt-1 text-sm text-cocoa">{m.role}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-espresso text-linen">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <Reveal>
            <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-camel uppercase">
              Nosso DNA
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl lg:text-5xl">Valores que sustentam o trabalho</h2>
          </Reveal>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 70}>
                <h3 className="text-2xl">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-khaki">{v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Depoimentos</p>
              <h2 className="mt-4 text-4xl text-espresso lg:text-5xl">Histórias de quem viveu</h2>
            </div>
            <div className="flex gap-3">
              <button
                aria-label="Depoimento anterior"
                onClick={() => setSlide((s) => (s - 1 + total) % total)}
                className="rounded-full border border-cocoa p-3 text-cocoa transition-colors hover:bg-khaki"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                aria-label="Próximo depoimento"
                onClick={() => setSlide((s) => (s + 1) % total)}
                className="rounded-full border border-cocoa p-3 text-cocoa transition-colors hover:bg-khaki"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </Reveal>
        <div className="mt-12 overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${slide * 100}%)` }}
          >
            {testimonials.map((t) => (
              <figure key={t.author} className="w-full shrink-0 px-1">
                <div className="soft-card p-10">
                  <Quote className="h-7 w-7 text-camel" strokeWidth={1.2} />
                  <blockquote className="mt-6 font-display text-2xl leading-snug text-espresso lg:text-3xl">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-6 text-sm text-cocoa">
                    {t.author} — {t.role}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Where */}
      <section id="onde" className="bg-khaki/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-24 md:grid-cols-2">
          <Reveal>
            <MapPin className="h-7 w-7 text-camel" strokeWidth={1.2} />
            <h2 className="mt-5 text-3xl text-espresso">Consultório em São Paulo</h2>
            <p className="mt-3 leading-relaxed text-cocoa">
              Vista Verde Offices — Av. Vereador José Diniz, São Paulo/SP.
              <br />
              Atendimento presencial com horários dedicados a atletas.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <Laptop className="h-7 w-7 text-camel" strokeWidth={1.2} />
            <h2 className="mt-5 text-3xl text-espresso">Atendimento online</h2>
            <p className="mt-3 leading-relaxed text-cocoa">
              Consultas por vídeo para atletas em outros estados ou vivendo temporada no exterior,
              com o mesmo protocolo e acompanhamento contínuo.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section id="cta" className="mx-auto max-w-4xl px-6 py-28 text-center">
        <Reveal>
          <Stethoscope className="mx-auto h-8 w-8 text-camel" strokeWidth={1.2} />
          <h2 className="mt-6 text-4xl text-espresso lg:text-6xl">
            Pronto para começar sua jornada?
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-cocoa">
            Escolha o pacote ideal ou fale com a nossa equipe para entender qual acompanhamento faz
            sentido para o seu momento de carreira.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <a href="#pacotes" className="inline-flex items-center gap-2 rounded-full bg-espresso px-7 py-3.5 text-sm font-medium text-linen transition-colors hover:bg-cocoa">
              Escolher pacote <CreditCard className="h-4 w-4" strokeWidth={1.5} />
            </a>
            <a href="#onde" className="inline-flex items-center gap-2 rounded-full border border-cocoa px-7 py-3.5 text-sm font-medium text-cocoa transition-colors hover:bg-khaki">
              Tirar dúvidas <CalendarCheck className="h-4 w-4" strokeWidth={1.5} />
            </a>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-espresso text-linen">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3">
          <div>
            <p className="font-display text-lg tracking-[0.18em] uppercase">
              iEsports <span className="text-camel">Nutri</span>
            </p>
            <p className="mt-4 max-w-xs text-sm text-khaki">
              Nutrição Neurofuncional iEsports — neuronutrição e saúde mental esportiva.
            </p>
          </div>
          <div className="text-sm text-khaki">
            <p className="text-linen">Contato</p>
            <p className="mt-3">contato@iesports.com.br</p>
            <p className="mt-1">Vista Verde Offices — São Paulo/SP</p>
          </div>
          <div className="text-sm text-khaki">
            <p className="text-linen">Redes</p>
            <p className="mt-3">Instagram</p>
            <p className="mt-1">LinkedIn</p>
            <p className="mt-1">iesports.com.br</p>
          </div>
        </div>
        <div className="border-t border-linen/15 py-6 text-center text-xs text-khaki">
          © {new Date().getFullYear()} Nutrição Neurofuncional iEsports
        </div>
      </footer>
    </div>
  );
}
