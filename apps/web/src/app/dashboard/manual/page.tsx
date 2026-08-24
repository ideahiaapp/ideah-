import { BookOpen, Download, ArrowUp } from "lucide-react";

/* ─── Pequenos blocos de conteúdo reutilizados ─────────────────── */
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 leading-relaxed">{children}</p>;
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-1.5 list-disc pl-5">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-gray-600 leading-relaxed">{item}</li>
      ))}
    </ul>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-1.5 list-decimal pl-5">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-gray-600 leading-relaxed">{item}</li>
      ))}
    </ol>
  );
}

function Note({ children, label = "Nota" }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="bg-brand-50 border-l-4 border-brand-400 rounded-r-xl px-4 py-3 text-sm text-brand-800 leading-relaxed">
      <strong className="font-bold">{label}:</strong> {children}
    </div>
  );
}

function AdminNote({ children }: { children: React.ReactNode }) {
  return <Note label="Somente administrador">{children}</Note>;
}

function FieldTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-brand-500">
            <th className="text-left text-white font-semibold px-4 py-2 w-1/3">Campo</th>
            <th className="text-left text-white font-semibold px-4 py-2">Descrição</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(([a, b]) => (
            <tr key={a}>
              <td className="px-4 py-2.5 font-medium text-gray-800 align-top">{a}</td>
              <td className="px-4 py-2.5 text-gray-600 align-top">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-bold text-gray-800 mt-4">{children}</h3>;
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-7 space-y-4">
      <h2 className="font-serif text-2xl text-brand-600 border-b border-gray-100 pb-3">{title}</h2>
      {children}
      <div className="pt-2 border-t border-gray-50">
        <a href="#sumario" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-brand-600 transition-colors">
          <ArrowUp className="w-3 h-3" />
          Voltar ao Sumário
        </a>
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 pt-1">
      <h3 className="text-base font-bold text-gray-800">{title}</h3>
      {children}
    </div>
  );
}

/* ─── Sumário ────────────────────────────────────────────────── */
const TOC = [
  { id: "introducao",     label: "1. Introdução ao Paideia" },
  { id: "primeiros-passos", label: "2. Primeiros Passos (Cadastro e Login)" },
  { id: "navegacao",      label: "3. Navegação Geral da Versão Web" },
  { id: "home",           label: "4. Home" },
  { id: "supervisao",     label: "5. Supervisão com Inteligência Artificial" },
  { id: "clientes",       label: "6. Clientes" },
  { id: "agenda",         label: "7. Agenda" },
  { id: "escritorio",     label: "8. Meu Escritório (Relatórios e Documentos)" },
  { id: "certificado",    label: "9. Certificado de Supervisão" },
  { id: "pesquisa",       label: "10. Pesquisa de Satisfação" },
  { id: "configuracoes",  label: "11. Configurações" },
  { id: "mobile",         label: "12. Aplicativo Mobile" },
  { id: "voz",            label: "13. Entrada por Voz (Ditado)" },
  { id: "faq",            label: "14. Perguntas Frequentes e Solução de Problemas" },
  { id: "etica",          label: "15. Ética, Privacidade e Segurança (CFP e LGPD)" },
];

export default function ManualPage() {
  return (
    <div id="top" className="max-w-3xl mx-auto space-y-6 pb-16 scroll-mt-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-brand-500" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">Manual do Usuário</h1>
          <p className="text-gray-500 text-sm">Documentação completa do Paideia — web e mobile</p>
        </div>
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 space-y-4">
        <p className="text-sm text-brand-800 leading-relaxed">
          O manual traz o passo a passo detalhado de cada funcionalidade do Paideia, tanto na versão web quanto no
          aplicativo mobile, além de perguntas frequentes e das diretrizes éticas (CFP e LGPD) que orientam o uso da
          plataforma. Clique em qualquer item do sumário abaixo para ir direto à seção.
        </p>
        <a
          href="/manual/Paideia_Manual_do_Usuario.docx"
          download
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          Baixar manual completo (.docx)
        </a>
      </div>

      {/* Sumário clicável */}
      <div id="sumario" className="scroll-mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-bold text-gray-800 mb-3">Sumário</p>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
          {TOC.map(item => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-sm text-brand-600 hover:text-brand-800 hover:underline transition-colors">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* 1. Introdução */}
      <Section id="introducao" title="1. Introdução ao Paideia">
        <P>
          O Paideia é uma plataforma de Formação Clínica Continuada para psicólogos, psicanalistas e terapeutas de
          diversas abordagens. O sistema não substitui a supervisão clínica humana nem realiza diagnósticos — ele
          oferece um espaço de reflexão dialógica apoiado por Inteligência Artificial, ajudando o profissional a
          organizar seu raciocínio clínico, aprofundar teoricamente os casos acompanhados e manter um registro
          estruturado da sua formação continuada.
        </P>
        <SubSection title="1.1 O que o Paideia faz">
          <Bullets items={[
            "Supervisão dialógica com IA: conversas orientadas por perguntas, não por respostas prontas, para ajudar o terapeuta a pensar sobre seus próprios casos.",
            "Registro de evoluções clínicas geradas a partir das supervisões.",
            "Gestão de clientes, anamneses, agenda e documentos do consultório.",
            "Emissão de certificado de horas de Formação Clínica Continuada, por abordagem teórica.",
            "Disponível na web (navegador) e em aplicativo mobile (iOS/Android).",
          ]} />
        </SubSection>
        <SubSection title="1.2 O que o Paideia não é">
          <Bullets items={[
            "Não substitui supervisão clínica presencial ou com supervisor humano.",
            "Não realiza diagnósticos nem toma decisões clínicas pelo terapeuta.",
            "Não armazena nem processa dados identificáveis de pacientes nas conversas com a IA — a responsabilidade pela pseudonimização é do profissional.",
          ]} />
        </SubSection>
        <SubSection title="1.3 Para quem é este manual">
          <P>Este manual cobre o uso da plataforma por dois perfis:</P>
          <Bullets items={[
            <>Terapeuta: uso diário do sistema — supervisão, clientes, agenda, certificado, configurações pessoais.</>,
            <>Administrador: além de tudo o que o terapeuta acessa, funções de gestão da plataforma — terapeutas, base de conhecimento (RAG), prompts de IA, formulários de anamnese e resultados da pesquisa de satisfação.</>,
          ]} />
          <Note>Seções e telas exclusivas de administrador estão sinalizadas ao longo do manual com a marcação &quot;Somente administrador&quot;.</Note>
        </SubSection>
      </Section>

      {/* 2. Primeiros Passos */}
      <Section id="primeiros-passos" title="2. Primeiros Passos (Cadastro e Login)">
        <SubSection title="2.1 Criando uma conta">
          <Steps items={[
            "Acesse a landing page do Paideia e clique em \"Criar conta\" (ou acesse diretamente a tela de cadastro).",
            "Preencha nome completo, e-mail e senha.",
            "Selecione a(s) abordagem(ns) teórica(s) que deseja contratar.",
            "Escolha a categoria de plano (individual) e a periodicidade de cobrança (mensal).",
            "Confirme os dados e prossiga para a etapa de pagamento.",
          ]} />
          <Note>Durante a fase de testes, sem checkout de pagamento ativo, o acesso normalmente é liberado pelo administrador diretamente em Configurações → Terapeutas (ver seção 11.10), sem que o terapeuta precise passar pela etapa de pagamento.</Note>
        </SubSection>
        <SubSection title="2.2 Fazendo login">
          <P>Na tela de login, você pode entrar de duas formas:</P>
          <Bullets items={[
            "E-mail e senha: informe as credenciais cadastradas e clique em \"Entrar\".",
            "Continuar com Google: autentica usando sua conta Google associada ao mesmo e-mail do cadastro.",
          ]} />
          <P>Caso tenha esquecido a senha, use o link &quot;Esqueci minha senha&quot; na tela de login para receber um e-mail de redefinição.</P>
        </SubSection>
        <SubSection title="2.3 Primeira configuração recomendada">
          <P>Após o primeiro login, vale revisar antes de começar a usar o sistema no dia a dia:</P>
          <Bullets items={[
            "Configurações → Perfil: nome, foto, CRP, dados de contato e configurações clínicas (valor de sessão, duração padrão, dias de atendimento).",
            "Configurações → API Key: necessária para as funcionalidades de Inteligência Artificial (supervisão, relatórios, certificado). Veja a seção 11.4.",
            "Configurações → Minhas Bases: confirme quais abordagens teóricas estão liberadas para você.",
            "Configurações → Ética e uso responsável da IA: leia e confirme as declarações de ciência relacionadas ao uso responsável da Inteligência Artificial, ao sigilo profissional, à proteção de dados e à responsabilidade do profissional pelas decisões tomadas em sua prática.",
          ]} />
        </SubSection>
      </Section>

      {/* 3. Navegação */}
      <Section id="navegacao" title="3. Navegação Geral da Versão Web">
        <P>O painel principal (dashboard) é composto por uma barra lateral de navegação e uma área de conteúdo central.</P>
        <SubSection title="3.1 Menu lateral">
          <Bullets items={[
            "Home — visão geral do dia.",
            "Supervisão — iniciar/continuar uma supervisão dialógica com IA.",
            "Clientes — cadastro, anamnese, prontuário e histórico de cada caso.",
            "Agenda — calendário de sessões.",
            "Meu escritório — relatórios e documentos oficiais.",
            "Certificado — emissão do certificado de Formação Clínica Continuada.",
            "Pesquisa de Satisfação — formulário de avaliação da experiência com o Paideia.",
            "Resultados da Pesquisa (somente administrador) — respostas agregadas da pesquisa acima.",
            "Manual — esta página.",
            "Configurações — acesso na parte inferior da barra lateral.",
            "Sair — encerra a sessão.",
          ]} />
        </SubSection>
        <SubSection title={'3.2 Painel "Como funciona?"'}>
          <P>Quase todas as telas têm um link &quot;Como funciona?&quot; no cabeçalho, que abre um painel lateral com um resumo rápido em passos — sem precisar sair da página nem perder o que você estava fazendo.</P>
        </SubSection>
      </Section>

      {/* 4. Home */}
      <Section id="home" title="4. Home">
        <P>A tela inicial cumprimenta o terapeuta pelo nome e mostra a data atual, funcionando como ponto de partida rápido para as duas ações mais frequentes do dia a dia:</P>
        <Bullets items={[
          "Iniciar supervisão — abre a tela de Supervisão.",
          "Cadastrar cliente — abre o formulário de cadastro de um novo cliente.",
        ]} />
      </Section>

      {/* 5. Supervisão */}
      <Section id="supervisao" title="5. Supervisão com Inteligência Artificial">
        <P>A Supervisão é o núcleo do Paideia: uma conversa dialógica com a IA sobre um caso clínico específico, feita para estimular a reflexão do terapeuta — não para entregar respostas prontas.</P>
        <SubSection title="5.1 Como iniciar uma supervisão">
          <Steps items={[
            "Acesse Supervisão no menu lateral (ou clique em \"Iniciar supervisão\" na Home).",
            "Selecione o cliente que deseja supervisionar.",
            "Selecione a abordagem teórica sob a qual a supervisão será conduzida.",
            "Clique em \"Iniciar supervisão\" — a partir desse momento a duração da sessão passa a ser cronometrada.",
          ]} />
        </SubSection>
        <SubSection title="5.2 Durante a conversa">
          <Bullets items={[
            "Digite (ou dite por voz — ver seção 13) a descrição do caso, dúvida ou situação clínica.",
            "A IA responde com perguntas e reflexões baseadas na abordagem teórica escolhida e na base de conhecimento (RAG) cadastrada para aquela abordagem.",
            "A conversa é salva automaticamente, mensagem a mensagem.",
            "É possível pausar a supervisão (o cronômetro para) e retomar depois.",
          ]} />
        </SubSection>
        <SubSection title="5.3 Finalizando a supervisão">
          <Steps items={[
            "Clique em \"Finalizar\".",
            "Preencha a data e o horário da sessão relacionada (se ainda não preenchidos automaticamente).",
            "Registre impressões da sessão, hipótese clínica e plano para a próxima sessão.",
            "Confirme — o sistema gera automaticamente um registro de Evolução Clínica vinculado a esse cliente, com a duração total da supervisão.",
          ]} />
          <Note>Após finalizada, a supervisão pode ser excluída (com sua transcrição completa) pela aba &quot;Supervisões&quot; no detalhe do cliente — ver seção 6.5. A exclusão da supervisão não apaga a evolução clínica gerada, que é um registro independente.</Note>
        </SubSection>
        <SubSection title="5.4 Diferencial: Inteligência Dialógica">
          <P>Ao contrário de uma IA generalista, o Paideia é desenhado para não entregar respostas prontas. As perguntas feitas ao longo da conversa têm o objetivo de ajudar o terapeuta a construir seu próprio raciocínio clínico, revisitar hipóteses e perceber aspectos do caso que talvez não tivessem sido considerados.</P>
        </SubSection>
      </Section>

      {/* 6. Clientes */}
      <Section id="clientes" title="6. Clientes">
        <P>A tela de Clientes centraliza o cadastro, a anamnese, o prontuário e o histórico (evoluções e supervisões) de cada caso acompanhado.</P>
        <SubSection title="6.1 Enviar anamnese">
          <P>No topo da tela de Clientes, o card &quot;Enviar anamnese&quot; gera um link para o preenchimento da anamnese inicial pelo próprio cliente, em dois modos:</P>
          <Bullets items={[
            "Novo cliente (pré-cadastro): o link não exige cadastro prévio — o preenchimento da anamnese pelo paciente é o próprio pré-cadastro. Ao ser recebida, você decide se aceita e ativa o cliente.",
            "Cliente já cadastrado: o link vem com os dados de cadastro já preenchidos, usado por exemplo para confirmar/atualizar informações antes de uma sessão.",
          ]} />
          <P>Em ambos os modos, selecione a abordagem teórica e, se aplicável, o cliente. Depois, envie o link por:</P>
          <Bullets items={[
            "Copiar link — copia a URL para a área de transferência.",
            "WhatsApp — abre o WhatsApp com uma mensagem pronta contendo o link.",
            "E-mail — envia automaticamente um e-mail de convite com o link.",
          ]} />
        </SubSection>
        <SubSection title="6.2 As três abas de Clientes">
          <FieldTable rows={[
            ["Sem anamnese", "Clientes ativos que ainda não preencheram a anamnese inicial."],
            ["Ativos", "Clientes ativos que já têm anamnese vinculada — prontos para acompanhamento."],
            ["Aguardando aprovação", "Anamneses enviadas por pacientes (via link) esperando sua decisão de aceitar ou recusar."],
          ]} />
        </SubSection>
        <SubSection title="6.3 Aguardando aprovação: aceitar ou recusar">
          <P>Cada anamnese pendente mostra nome, e-mail, telefone, data de envio e a intenção da sessão informada pelo paciente.</P>
          <Bullets items={[
            "Recusar: descarta a anamnese (não gera cliente).",
            "Visualizar → Aceitar e ativar cliente: abre a revisão completa da anamnese; escolha a abordagem, frequência e duração das sessões e confirme para transformar a anamnese em um cliente ativo.",
          ]} />
        </SubSection>
        <SubSection title="6.4 Cadastrando um cliente manualmente">
          <P>Clique em &quot;+ Novo Cliente&quot; (Home ou tela de Clientes) e preencha:</P>
          <FieldTable rows={[
            ["Dados pessoais", "Nome completo (obrigatório), data de nascimento, e-mail, telefone, profissão."],
            ["Configuração clínica", "Abordagem terapêutica (obrigatório), frequência das sessões, duração."],
            ["Prontuário inicial", "Demanda principal (obrigatório) e observações clínicas iniciais."],
            ["Contato de emergência", "Nome e telefone — informação confidencial, usada só em situações de risco."],
            ["LGPD", "Confirmação obrigatória de que o TCLE foi obtido do cliente."],
          ]} />
          <Note>O campo &quot;Como chegou até você&quot; não faz parte do cadastro feito pelo terapeuta — essa informação é coletada diretamente do próprio paciente, na anamnese (&quot;Como chegou até mim&quot;).</Note>
        </SubSection>
        <SubSection title="6.5 Detalhe do cliente">
          <P>Ao abrir um cliente, as abas disponíveis são:</P>
          <Bullets items={[
            "Prontuário — dados cadastrais e clínicos.",
            "Anamnese — respostas completas da anamnese vinculada.",
            "Evoluções — histórico de evoluções clínicas geradas a partir das supervisões e sessões registradas.",
            "Supervisões — todas as supervisões dialógicas realizadas sobre aquele caso, com título, abordagem, data e nº de mensagens; cada uma pode ser excluída (ícone de lixeira, com confirmação).",
          ]} />
        </SubSection>
      </Section>

      {/* 7. Agenda */}
      <Section id="agenda" title="7. Agenda">
        <P>A Agenda organiza as sessões marcadas com os clientes.</P>
        <SubSection title="7.1 Criando uma sessão">
          <Steps items={[
            "Clique em \"Nova sessão\".",
            "Selecione o cliente, data e horário.",
            "Defina a duração e, opcionalmente, o valor da sessão.",
            "Defina o status inicial (Confirmada ou Pendente).",
            "Salve — a sessão passa a aparecer no calendário.",
          ]} />
        </SubSection>
        <SubSection title="7.2 Status das sessões">
          <FieldTable rows={[
            ["Confirmada", "Sessão marcada e confirmada com o cliente."],
            ["Pendente", "Aguardando confirmação."],
            ["Cancelada", "Sessão desmarcada."],
            ["Realizada", "Sessão já ocorreu."],
          ]} />
        </SubSection>
        <SubSection title="7.3 Google Calendar e WhatsApp">
          <P>Ao criar uma sessão, é possível marcar &quot;Adicionar ao Google Calendar&quot; e informar (ou gerar) um link de videochamada — depois de salvar, os botões &quot;Abrir no Google Calendar&quot; e &quot;Enviar agendamento via WhatsApp&quot; ficam disponíveis para compartilhar rapidamente com o cliente.</P>
        </SubSection>
      </Section>

      {/* 8. Meu Escritório */}
      <Section id="escritorio" title="8. Meu Escritório (Relatórios e Documentos)">
        <P>Reúne ferramentas de apoio administrativo e documental do consultório, geradas com o suporte da IA a partir dos dados já registrados no sistema.</P>
        <SubSection title="8.1 Visão Geral">
          <P>Panorama de produção clínica e uso da plataforma nos últimos meses.</P>
        </SubSection>
        <SubSection title="8.2 Clientes">
          <P>Lista consolidada dos seus casos, com atalhos para o prontuário de cada um.</P>
        </SubSection>
        <SubSection title="8.3 Relatórios">
          <Bullets items={[
            "Documentos oficiais — declaração de comparecimento e relatório de acompanhamento psicológico, prontos para impressão ou envio.",
            "Relatório de evoluções — consolida as evoluções clínicas de um cliente em um período, útil para revisão de caso ou repasse.",
            "Prospecto de paciente — panorama inicial de um cliente com base na anamnese e primeiras sessões, útil na fase de acolhimento.",
          ]} />
        </SubSection>
      </Section>

      {/* 9. Certificado */}
      <Section id="certificado" title="9. Certificado de Supervisão">
        <P>Emite o certificado de Formação Clínica Continuada do terapeuta, com base nas horas de supervisão dialógica realizadas no sistema.</P>
        <SubSection title="9.1 Gerando o certificado">
          <Steps items={[
            "Acesse Certificado no menu lateral.",
            "(Administrador) Selecione o terapeuta — para terapeutas comuns, o próprio usuário já vem selecionado.",
            "Selecione o período (1 mês, 3 meses, 6 meses ou 1 ano).",
            "Clique em \"Gerar certificado\".",
          ]} />
          <P>O sistema gera um certificado por abordagem teórica utilizada nas supervisões do período (ex.: um certificado de Psicanálise e outro de TCC, se ambas tiverem sido usadas).</P>
        </SubSection>
        <SubSection title="9.2 Frente e verso">
          <P>Cada certificado é emitido em formato A4 paisagem, com carga horária, período e número de supervisões daquela abordagem. Em Configurações → Prompts (ver seção 11.8) existem dois campos independentes: &quot;Certificado (frente)&quot; e &quot;Certificado (verso)&quot;. Preenchendo o campo de verso, uma segunda página é gerada com o conteúdo definido nesse prompt — por exemplo, conteúdos estudados e síntese do desenvolvimento profissional — com fundo sólido e a logo do Paideia ao final da página. Deixar o campo de verso em branco emite o certificado só com a frente.</P>
        </SubSection>
        <SubSection title="9.3 Baixando em PDF">
          <P>Na web, o botão &quot;Baixar PDF&quot; abre a janela de impressão do navegador — escolha &quot;Salvar como PDF&quot; como destino. O mobile exibe o certificado no mesmo layout visual, mas a exportação em PDF está disponível apenas na versão web.</P>
        </SubSection>
      </Section>

      {/* 10. Pesquisa de Satisfação */}
      <Section id="pesquisa" title="10. Pesquisa de Satisfação">
        <P>Formulário de validação da experiência com o Paideia, acessível pelo menu lateral (web) ou pelo menu hambúrguer (mobile). Contém 33 perguntas organizadas em 10 seções: perfil profissional, o problema antes do Paideia, experiência de uso, diferencial da Inteligência Dialógica, comparação com IA generalista, percurso formativo, valor comercial, retenção/recomendação, melhorias e depoimento opcional.</P>
        <Note>As respostas são pessoais (vinculadas ao terapeuta autenticado) e usadas de forma agregada para orientar a evolução do produto. O formulário orienta explicitamente a não incluir nomes ou dados identificáveis de clientes.</Note>
        <AdminNote>A tela Resultados da Pesquisa (menu lateral, visível só para administradores) mostra estatísticas agregadas — total de respostas, médias das notas 0–10, NPS calculado, distribuição de respostas por pergunta — e a lista de respostas individuais, cada uma expansível para ver todas as 33 perguntas respondidas.</AdminNote>
      </Section>

      {/* 11. Configurações */}
      <Section id="configuracoes" title="11. Configurações">
        <P>Acessível pelo rodapé do menu lateral. As abas visíveis variam conforme o perfil (terapeuta comum ou administrador).</P>
        <SubSection title="11.1 Perfil">
          <P>Foto, nome, telefone, CRP, cidade, Instagram profissional, abordagem principal e bio. Inclui também as Configurações clínicas: valor por sessão, duração padrão, horário e dias de atendimento — usados nos relatórios de produção.</P>
        </SubSection>
        <SubSection title="11.2 Segurança">
          <P>Alteração de senha (com indicador de força) e encerramento de todas as sessões ativas em outros dispositivos.</P>
        </SubSection>
        <SubSection title="11.3 Plano">
          <P>Visualização do plano atual, comparação entre planos (Pro / Clínica) e histórico de cobrança.</P>
        </SubSection>
        <SubSection title="11.4 API Key">
          <P>As funcionalidades de Inteligência Artificial do Paideia (supervisão, relatórios, certificado) dependem de uma chave de API de um provedor de IA.</P>
          <Bullets items={[
            "Escolha o provedor: Anthropic (Claude), Google Gemini ou Ollama (local).",
            "Cole a chave obtida no site do provedor e clique em \"Salvar e ativar chave\".",
            "Use \"Testar conexão\" para confirmar que a chave está funcionando.",
          ]} />
          <Note>A chave é armazenada de forma cifrada no navegador (ou no dispositivo móvel) — o servidor do Paideia não tem acesso a ela em texto puro. Alternativamente, uma chave padrão pode ser configurada pelo administrador no servidor, usada como respaldo quando o terapeuta não tem chave própria salva.</Note>
        </SubSection>
        <SubSection title="11.5 Minhas Bases">
          <P>Mostra as abordagens teóricas contratadas pelo terapeuta e o material de conhecimento (RAG) disponível para cada uma.</P>
        </SubSection>
        <SubSection title="11.6 Ética CFP">
          <P>Apresenta a Resolução CFP nº 21/2025 sobre uso de IA na prática profissional e exige a confirmação de quatro compromissos éticos: ausência de diagnóstico automático, juízo clínico humano, sigilo/pseudonimização de dados e consentimento (TCLE) dos pacientes.</P>
        </SubSection>
        <SubSection title="11.7 Base RAG">
          <AdminNote>Envio de livros e artigos (PDF ou TXT) por abordagem teórica, formando a base de conhecimento que a IA consulta durante as supervisões daquela abordagem. Os documentos ficam agrupados e podem ser removidos individualmente.</AdminNote>
        </SubSection>
        <SubSection title="11.8 Prompts">
          <AdminNote>Permite personalizar o prompt de sistema usado pela IA em cada abordagem teórica e em funcionalidades específicas (Evolução, Certificado, Relatório de Evoluções, documentos oficiais). Deixar em branco usa o prompt padrão do sistema. &quot;Certificado (frente)&quot; e &quot;Certificado (verso)&quot; são campos independentes citados na seção 9.2 — o verso só é gerado se esse campo estiver preenchido.</AdminNote>
        </SubSection>
        <SubSection title="11.9 Anamnese">
          <AdminNote>Editor dos formulários de anamnese apresentados ao paciente, um por abordagem teórica. Clique na abordagem para expandir/recolher e editar o conteúdo (HTML com perguntas, campos de texto, múltipla escolha etc.) e salve.</AdminNote>
        </SubSection>
        <SubSection title="11.10 Terapeutas">
          <AdminNote>Lista todos os terapeutas com acesso à plataforma, com opção de bloquear/liberar o acesso de cada um.</AdminNote>
          <Bullets items={[
            "Bases teóricas: ao expandir \"Bases\" de um terapeuta, todas as abordagens aparecem — contratadas em azul escuro, não contratadas em azul claro. Clicar em uma base adiciona ou remove ela do pacote daquele terapeuta imediatamente.",
            "Adicionar terapeuta: cria uma conta diretamente (nome, e-mail, senha e bases iniciais), sem depender do checkout de pagamento — útil durante a fase de testes.",
          ]} />
        </SubSection>
        <SubSection title="11.11 Uso de API">
          <AdminNote>Painel de acompanhamento de consumo de tokens/custos de IA por terapeuta e por funcionalidade.</AdminNote>
        </SubSection>
      </Section>

      {/* 12. Mobile */}
      <Section id="mobile" title="12. Aplicativo Mobile">
        <P>O aplicativo mobile do Paideia (iOS/Android) espelha as principais funcionalidades da versão web, com telas adaptadas ao formato de celular.</P>
        <SubSection title="12.1 Navegação">
          <P>A barra inferior dá acesso rápido a: Início, Clientes, Agenda, Meu escritório, Certificado e Configurações. O menu hambúrguer (ícone no topo das telas) reúne também Evoluções e Pesquisa de Satisfação, além dos mesmos atalhos da barra inferior.</P>
        </SubSection>
        <SubSection title="12.2 Home">
          <P>Saudação, data e dois atalhos principais: &quot;Iniciar supervisão&quot; e &quot;Cadastrar cliente&quot;, cada um com seu próprio &quot;Como funciona?&quot;.</P>
        </SubSection>
        <SubSection title="12.3 Supervisão">
          <P>Mesmo fluxo da web: selecionar cliente e abordagem, iniciar, pausar/retomar, conversar (com suporte a voz) e finalizar gerando a evolução clínica.</P>
        </SubSection>
        <SubSection title="12.4 Clientes">
          <P>Mesmas três abas da web (Sem anamnese / Ativos / Aguardando aprovação), card &quot;Enviar anamnese&quot; no topo (copiar link, WhatsApp ou e-mail), botão &quot;+&quot; para cadastro manual de um novo cliente e, no detalhe do cliente, as seções Supervisões (com exclusão) e Evoluções recentes.</P>
        </SubSection>
        <SubSection title="12.5 Agenda">
          <P>Calendário mensal (navegação entre meses, indicador de dias com sessão) com a lista de sessões do dia selecionado, botão &quot;+ Nova sessão&quot; e os mesmos atalhos de Google Calendar e WhatsApp da web.</P>
        </SubSection>
        <SubSection title="12.6 Certificado">
          <P>Mesmo layout visual da web (frente e verso, quando aplicável), gerado por abordagem e período. A exportação em PDF, por ora, está disponível apenas na versão web.</P>
        </SubSection>
        <SubSection title="12.7 Evoluções">
          <P>Lista de evoluções clínicas com busca, estatísticas (total, com hipótese de IA, clientes cobertos) e detalhe de cada evolução em um modal.</P>
        </SubSection>
        <SubSection title="12.8 Configurações">
          <P>Perfil, API Key e, para administradores, o editor de formulários de anamnese (mesma função da seção 11.9 na web).</P>
        </SubSection>
        <SubSection title="12.9 Pesquisa de Satisfação">
          <P>Mesmo questionário de 33 perguntas da versão web, acessível pelo menu hambúrguer.</P>
        </SubSection>
      </Section>

      {/* 13. Voz */}
      <Section id="voz" title="13. Entrada por Voz (Ditado)">
        <P>Os campos de conteúdo do sistema (textos livres como demanda principal, observações, mensagens de supervisão etc.) aceitam ditado por voz, identificado pelo ícone de microfone.</P>
        <Steps items={[
          "Toque/clique no ícone de microfone ao lado do campo.",
          "Fale normalmente — o texto aparece em tempo real conforme você fala.",
          "Toque novamente para parar a gravação.",
        ]} />
        <P>Campos de login, senha e busca não têm entrada por voz — por não fazer sentido para esse tipo de dado.</P>
        <Note>Não há limite de tempo definido pelo próprio Paideia, mas o mecanismo de reconhecimento de voz do navegador ou do sistema operacional pode interromper gravações muito longas ou com silêncios prolongados. Para falas contínuas de até 1–2 minutos, não costuma haver problema em nenhuma plataforma.</Note>
        <Note>No aplicativo mobile aberto dentro do Expo Go (ambiente de testes da própria Expo), o microfone fica desabilitado — o reconhecimento de voz nativo só funciona em um build próprio do Paideia instalado no aparelho.</Note>
      </Section>

      {/* 14. FAQ */}
      <Section id="faq" title="14. Perguntas Frequentes e Solução de Problemas">
        <SubSection title={'"API Key não configurada"'}>
          <P>Acesse Configurações → API Key, informe uma chave válida do provedor escolhido e clique em &quot;Salvar e ativar chave&quot;.</P>
        </SubSection>
        <SubSection title="Não recebo o e-mail de convite de anamnese">
          <P>Verifique a caixa de spam do destinatário e confirme se o e-mail informado está correto. Alternativamente, use &quot;Copiar link&quot; ou &quot;WhatsApp&quot; no card de Enviar anamnese.</P>
        </SubSection>
        <SubSection title="Meu certificado saiu sem uma abordagem que eu esperava">
          <P>O certificado só é gerado para abordagens efetivamente usadas em supervisões dentro do período selecionado. Amplie o período ou confirme que a supervisão foi registrada com a abordagem correta.</P>
        </SubSection>
        <SubSection title="Uma resposta da IA não fez sentido ou pareceu estranha">
          <P>A IA é uma ferramenta de apoio à reflexão — o julgamento clínico final é sempre do terapeuta. Se algo pareceu incorreto ou incoerente, isso pode e deve ser relatado na Pesquisa de Satisfação (pergunta 29 do questionário), que existe justamente para identificar esse tipo de falha.</P>
        </SubSection>
        <SubSection title="Esqueci minha senha">
          <P>Na tela de login, clique em &quot;Esqueci minha senha&quot; e siga as instruções enviadas por e-mail.</P>
        </SubSection>
      </Section>

      {/* 15. Ética */}
      <Section id="etica" title="15. Ética, Privacidade e Segurança (CFP e LGPD)">
        <P>O Paideia foi desenhado em conformidade com a Resolução CFP nº 21/2025, que regula o uso de Inteligência Artificial na prática profissional da Psicologia, e com a Lei Geral de Proteção de Dados (LGPD).</P>
        <SubSection title="15.1 Responsabilidades do profissional">
          <Bullets items={[
            "A IA não realiza diagnósticos — toda hipótese diagnóstica é de responsabilidade exclusiva do terapeuta.",
            "As sugestões da IA são apoio ao raciocínio clínico, nunca substituem o juízo clínico do profissional.",
            "Não inserir dados que identifiquem diretamente o cliente/paciente nas interações com a IA — usar pseudonimização sempre que possível.",
            "Obter o Termo de Consentimento Livre e Esclarecido (TCLE) de cada pessoa atendida antes de cadastrá-la na plataforma.",
          ]} />
        </SubSection>
        <SubSection title="15.2 Como o Paideia protege os dados">
          <Bullets items={[
            "Pseudonimização opcional por cliente.",
            "Base de conhecimento fechada e curada — a IA não acessa dados de outros usuários.",
            "Chave de API armazenada de forma cifrada, localmente, sem acesso do servidor em texto puro.",
            "Dados clínicos não são usados para treinar modelos de IA.",
          ]} />
        </SubSection>
      </Section>

      <div className="text-center">
        <a href="#top" className="text-xs text-gray-400 hover:text-brand-600 transition-colors">Voltar ao topo</a>
      </div>
    </div>
  );
}
