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
  Play,
  Quote,
  Sparkles,
  Stethoscope,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";

import { Reveal } from "@/components/Reveal";
import heroImg from "@/assets/hero.jpg";
import neuroImg from "@/assets/neuro.jpg";
import amandaAsset from "@/assets/team-amanda.jpg.asset.json";
import manuelaAsset from "@/assets/team-manuela.jpg.asset.json";
import leticiaAsset from "@/assets/team-leticia.jpg.asset.json";
import gabrielImg from "@/assets/team-gabriel.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nutrição Neurofuncional iEsports | Performance para atletas" },
      {
        name: "description",
        content:
          "Nutrição Neurofuncional, performance cognitiva e saúde mental esportiva para atletas aprovados no projeto Experience da iEsports. Atendimento 100% online.",
      },
      {
        property: "og:title",
        content: "Nutrição Neurofuncional iEsports | Performance para atletas",
      },
      {
        property: "og:description",
        content:
          "Nutrição Neurofuncional, performance cognitiva e saúde mental esportiva para atletas aprovados no projeto Experience da iEsports. Atendimento 100% online.",
      },
    ],
  }),
  component: Index,
});

const trustItems = [
  "Atendimento 100% online",
  "+10 anos de experiência com atletas de alto rendimento",
  "Parceria oficial iEsports",
];

const differentials = [
  { icon: Sparkles, title: "Atendimento personalizado", text: "Protocolos desenhados para a rotina e a modalidade de cada atleta." },
  { icon: Users, title: "Equipe multidisciplinar", text: "Nutrição, neurociência e psicologia do esporte em um só cuidado." },
  { icon: Laptop, title: "100% online", text: "Acompanhamento remoto para atletas em qualquer estado ou país." },
];

const steps = [
  { n: "01", title: "Escolha do pacote", text: "Seleção do plano de acompanhamento ideal para o momento da carreira." },
  { n: "02", title: "Pagamento", text: "Confirmação segura e liberação imediata da agenda." },
  { n: "03", title: "Anamnese e histórico completo do paciente", text: "Avaliação detalhada e histórico de performance com a equipe." },
  { n: "04", title: "Avaliação nutricional completa", text: "Análise nutricional individualizada para o esporte." },
  { n: "05", title: "Sessões de performance", text: "4 atendimentos visando a performance esportiva." },
  { n: "06", title: "Acompanhamento contínuo", text: "Ajustes, retornos e suporte durante toda a jornada." },
];

const services = [
  { icon: UtensilsCrossed, title: "Consulta Nutricional", text: "Avaliação, plano alimentar e estratégia de composição corporal para o esporte." },
  { icon: Brain, title: "Consulta de Nutrição Neurofuncional", text: "Nutrientes, foco, sono e regulação emocional aplicados à performance." },
  { icon: Dna, title: "Teste Genético e Metabolômica", text: "Leitura individual do metabolismo para decisões precisas de nutrição." },
  { icon: HeartHandshake, title: "Sessões Individuais", text: "Performance cognitiva, emocional e comportamental com psicologia do esporte." },
];

const packages: { name: string; price: string; items: string[]; destaque?: boolean }[] = [
  { name: "Pacote Atleta", price: "R$ 1.500", items: ["1 Neuro + 1 Nutri", "4 Sessões visando a performance esportiva"] },
  { name: "Pacote Atleta Performance", price: "R$ 3.100", items: ["2 Neuro + 2 Nutri", "8 Sessões visando a performance esportiva", "1 sessão final multidisciplinar"] },
  { name: "Atleta Pro", price: "R$ 6.490", destaque: true, items: ["2 Neuro + 2 Nutri", "8 Sessões visando a performance esportiva", "Teste genético e de metabolômica", "Devolutiva do laudo (60 páginas, 270 genes)", "1 sessão final multidisciplinar"] },
  { name: "Pais de Atletas", price: "R$ 2.500", items: ["2 Neuro + 2 Nutri", "2 Neuro adicionais", "1 retorno Neuro + 1 retorno Nutri"] },
  { name: "Teste Genético Avulso", price: "R$ 4.500", items: ["Teste genético e de metabolômica", "Devolutiva do laudo (60 páginas, 270 genes)", "Pode ser contratado sem pacote"] },
];


const team = [
  { name: "Amanda Ciaramicoli", role: "Nutricionista Neurofuncional · Nutrigeneticista · Psicanalista", img: amandaAsset.url },
  { name: "Manuela Gestal", role: "Nutricionista Neurofuncional · Nutrigeneticista · Psicanalista", img: manuelaAsset.url },
  { name: "Letícia Frazão", role: "Nutricionista esportiva", img: leticiaAsset.url },
  { name: "Gabriel Fernandes", role: "Auxiliar de atendimentos", img: gabrielImg },
];

const testimonials = [
  { quote: "Sou grato a Amanda por ter me ajudado muito no período em que eu estava no SPFC! Foi um trabalho essencial para que eu conseguisse me conhecer melhor, e com isso saber dos meus pontos fortes e fracos. Aprendi a me concentrar melhor nos jogos, aprendi técnicas que me faziam permanecer focado nos meus objetivos! Um ótimo trabalho que até hoje utilizo e colho frutos não somente em campo mas para minha vida.", author: "Sidão", role: "Jogador de futebol" },
  { quote: "Desde que comecei o trabalho com a Amanda venho melhorando cada vez mais minha consciência sobre minhas emoções e como administrá-las da maneira correta. Pude me tornar uma pessoa mais madura, sábia e principalmente efetiva nas áreas da minha vida. Graças ao esforço da Amanda e seu empenho nas sessões pude ter um crescimento exponencial.", author: "André Sion", role: "Jogador de futebol" },
  { quote: "Como paciente da Dra. Amanda, quero reconhecer o trabalho de excelência que ela apresenta! Buscamos, eu e minha esposa, melhorar nosso desempenho físico, mental e emocional, e foi gratificante perceber uma profissional extremamente dedicada, estudiosa e atenciosa nos mínimos detalhes. Com suplementos preparados e customizados para cada um, já percebemos a evolução e melhoria de nossa saúde integral!", author: "Everaldo Coelho", role: "Vice-presidente Palmeiras" },
  { quote: "A Amanda está sendo de suma importância na vida do meu filho, atleta de 10 anos. Estamos em acompanhamento há pouco mais de um ano e o tanto que ele evoluiu é absurdamente notório: ele se comunicava pouco durante as partidas e hoje é um líder nato dentro da quadra e do campo!", author: "Natalia Oliveira", role: "Mãe de atleta" },
  { quote: "Estou com a Amanda há quase dois anos, ela é uma excelente profissional e neste período senti uma melhora em todos os aspectos da parte mental dentro e fora de campo. Ela me ajudou a ter mais confiança, acreditar mais em mim mesmo, ter mais comprometimento comigo mesmo. Só tenho a agradecer por tudo que ela fez por mim e pela minha evolução tanto como profissional e como pessoa.", author: "Leonardo Tristão", role: "Jogador de futebol" },
  { quote: "Gosto muito de trabalhar com a Amanda, tive uma grande evolução na minha carreira, e hoje vejo o quanto isso faz diferença. É um trabalho indispensável para qualquer pessoa que deseja ter rendimento e qualidade de vida.", author: "Lourency Rodrigues", role: "Jogador de futebol" },
  { quote: "Acho que a palavra parceria descreve bem: ela é uma pessoa que sempre sabe o que falar, extremamente profissional e humana! Tenho um carinho enorme por ela, comecei a cursar psicologia justamente por conta dela!", author: "Luigi Eric", role: "Jogador de futsal" },
  { quote: "Amanda, obrigado por suas orientações e apoio à minha família. Quero agradecer por sua contribuição valiosa no crescimento do Victor. Seu trabalho é fundamental para nosso sucesso, e com você nos ajudando o processo fica mais fácil.", author: "Gilmar Homem", role: "Pai de atleta" },
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

      {/* Hero */}
      <section id="top" className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <Reveal>
          <p className="eyebrow">Nutrição Neurofuncional esportiva</p>
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

      {/* Neuronutrition */}
      <section id="neuronutricao" className="bg-khaki/60">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-2">
          <Reveal>
            <div className="relative">
              <img
                src={neuroImg}
                alt="Alimentos funcionais para performance cognitiva"
                loading="lazy"
                width={1200}
                height={912}
                className="h-[420px] w-full rounded-[2rem] object-cover"
              />
              {/* Vídeo da Amanda explicando a nutrição neurofuncional */}
              <button
                type="button"
                aria-label="Assistir vídeo: Amanda explica a nutrição neurofuncional"
                className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-espresso/30"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-linen text-espresso shadow-xl transition-transform hover:scale-105">
                  <Play className="ml-1 h-8 w-8" strokeWidth={1.5} />
                </span>
              </button>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <p className="eyebrow">O que é a nutrição neurofuncional</p>
            <h2 className="mt-4 text-4xl text-espresso lg:text-5xl">
              Alimentação que conversa com o cérebro
            </h2>
            <p className="mt-6 leading-relaxed text-cocoa">
              A nutrição neurofuncional estuda como nutrientes, microbiota e rotina alimentar influenciam
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

      {/* Process */}
      <section id="processo" className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <p className="eyebrow">O processo</p>
          <h2 className="mt-4 max-w-xl text-4xl text-espresso lg:text-5xl">
            Da escolha do pacote ao acompanhamento contínuo
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
                <article
                  className={`soft-card relative flex h-full flex-col p-8 ${
                    p.destaque
                      ? "border-camel bg-espresso text-linen shadow-[0_30px_60px_-40px_rgba(74,52,42,0.9)] lg:scale-[1.04]"
                      : ""
                  }`}
                >
                  {p.destaque && (
                    <span className="absolute -top-3 left-8 rounded-full bg-camel px-4 py-1 text-[0.65rem] font-semibold tracking-[0.14em] text-espresso uppercase">
                      Mais vendido
                    </span>
                  )}
                  <h3 className={`text-2xl ${p.destaque ? "text-linen" : "text-espresso"}`}>{p.name}</h3>
                  <p className={`mt-3 font-display text-3xl ${p.destaque ? "text-khaki" : "text-camel"}`}>{p.price}</p>
                  <ul className={`mt-6 flex-1 space-y-3 text-sm ${p.destaque ? "text-khaki" : "text-cocoa"}`}>
                    {p.items.map((it) => (
                      <li key={it} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-camel" />
                        {it}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/pacotes"
                    className={`mt-8 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition-colors ${
                      p.destaque
                        ? "bg-linen text-espresso hover:bg-khaki"
                        : "bg-espresso text-linen hover:bg-cocoa"
                    }`}
                  >
                    {p.destaque ? "Quero o Atleta Pro" : "Ver pacote"}
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
        <div className="mx-auto max-w-7xl px-6 py-24">
          <Reveal>
            <Laptop className="h-7 w-7 text-camel" strokeWidth={1.2} />
            <h2 className="mt-5 text-3xl text-espresso">Atendimento 100% online</h2>
            <p className="mt-3 leading-relaxed text-cocoa">
              Consultas por vídeo para atletas em qualquer estado ou vivendo temporada no exterior,
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
            <a href="/pacotes" className="inline-flex items-center gap-2 rounded-full bg-espresso px-7 py-3.5 text-sm font-medium text-linen transition-colors hover:bg-cocoa">
              Escolher pacote <CreditCard className="h-4 w-4" strokeWidth={1.5} />
            </a>
            <a href="/cadastro" className="inline-flex items-center gap-2 rounded-full border border-cocoa px-7 py-3.5 text-sm font-medium text-cocoa transition-colors hover:bg-khaki">
              Criar conta <CalendarCheck className="h-4 w-4" strokeWidth={1.5} />
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
