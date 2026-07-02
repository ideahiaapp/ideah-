-- Seed: templates de anamnese por abordagem
-- Execute após anamnese_templates_migration.sql

INSERT INTO anamnese_templates (approach, content) VALUES

('PSYCHOANALYSIS', '
<h2>Anamnese Inicial – Psicanálise Freudiana</h2>
<p class="hint">Objetivo: reunir informações essenciais antes da primeira sessão, preservando o espaço da escuta analítica.</p>

<section>
  <h3>1. O que o trouxe para a análise neste momento?</h3>
  <textarea name="motivo" rows="4" placeholder="Descreva com suas palavras..."></textarea>
</section>

<section>
  <h3>2. Há quanto tempo isso acontece?</h3>
  <div class="radio-group">
    <label><input type="radio" name="tempo" value="dias"> Há dias</label>
    <label><input type="radio" name="tempo" value="semanas"> Há semanas</label>
    <label><input type="radio" name="tempo" value="meses"> Há meses</label>
    <label><input type="radio" name="tempo" value="anos"> Há anos</label>
    <label><input type="radio" name="tempo" value="sempre"> Desde que me lembro</label>
  </div>
</section>

<section>
  <h3>3. O que você espera encontrar na análise?</h3>
  <textarea name="expectativa" rows="3" placeholder="Seus objetivos e expectativas..."></textarea>
</section>

<section>
  <h3>4. Já fez psicoterapia ou psicanálise anteriormente?</h3>
  <div class="radio-group">
    <label><input type="radio" name="terapia_anterior" value="nunca"> Nunca</label>
    <label><input type="radio" name="terapia_anterior" value="psicoterapia"> Psicoterapia / psicólogo</label>
    <label><input type="radio" name="terapia_anterior" value="psicanalise"> Psicanálise</label>
  </div>
</section>

<section>
  <h3>5. Faz acompanhamento psiquiátrico ou utiliza alguma medicação?</h3>
  <textarea name="medicacao" rows="2" placeholder="Descreva se houver..."></textarea>
</section>

<section>
  <h3>6. Como é sua situação familiar atualmente?</h3>
  <div class="checkbox-group">
    <label><input type="radio" name="moradia" value="sozinho"> Moro sozinho(a)</label>
    <label><input type="radio" name="moradia" value="companheiro"> Com companheiro(a)</label>
    <label><input type="radio" name="moradia" value="pais"> Com pais</label>
    <label><input type="radio" name="moradia" value="filhos"> Com filhos</label>
    <label><input type="radio" name="moradia" value="outro"> Outro</label>
  </div>
</section>

<section>
  <h3>7. Houve algum acontecimento importante que antecedeu sua decisão de procurar análise?</h3>
  <textarea name="acontecimento" rows="3" placeholder="Conte brevemente..."></textarea>
</section>

<section>
  <h3>8. Se tivesse que escolher apenas três palavras para descrever você hoje, quais seriam?</h3>
  <div class="fields-row">
    <input type="text" name="palavra1" placeholder="1ª palavra">
    <input type="text" name="palavra2" placeholder="2ª palavra">
    <input type="text" name="palavra3" placeholder="3ª palavra">
  </div>
</section>

<section>
  <h3>9. Existe algo que considera importante que eu saiba antes da nossa primeira sessão?</h3>
  <textarea name="observacoes" rows="3" placeholder="Informações adicionais..."></textarea>
</section>
'),

('COGNITIVE_BEHAVIORAL', '
<h2>Anamnese Essencial – TCC</h2>

<section>
  <h3>1. Queixa principal</h3>
  <p class="hint">O que te trouxe à terapia agora? Descreva com suas palavras.</p>
  <textarea name="queixa" rows="4" placeholder="Descreva com suas palavras..."></textarea>
</section>

<section>
  <h3>2. Desde quando isso te incomoda?</h3>
  <div class="radio-group">
    <label><input type="radio" name="tempo" value="dias"> Dias</label>
    <label><input type="radio" name="tempo" value="semanas"> Semanas</label>
    <label><input type="radio" name="tempo" value="meses"> Meses</label>
    <label><input type="radio" name="tempo" value="anos"> Anos</label>
  </div>
</section>

<section>
  <h3>3. Quanto isso está te atrapalhando hoje?</h3>
  <p class="hint">(0 = nada, 10 = atrapalha demais)</p>
  <input type="range" name="intensidade" min="0" max="10" step="1">
  <span class="range-label">Nota: <output name="intensidade_output">5</output></span>
</section>

<section>
  <h3>4. Em quais áreas da vida isso mais interfere?</h3>
  <div class="checkbox-group">
    <label><input type="checkbox" name="areas" value="trabalho"> Trabalho / estudos</label>
    <label><input type="checkbox" name="areas" value="relacionamentos"> Relacionamentos afetivos / família</label>
    <label><input type="checkbox" name="areas" value="social"> Amigos / social</label>
    <label><input type="checkbox" name="areas" value="sono"> Sono</label>
    <label><input type="checkbox" name="areas" value="saude"> Saúde física</label>
    <label><input type="checkbox" name="areas" value="outro"> Outra</label>
  </div>
</section>

<section>
  <h3>5. Situação – Pensamento – Emoção – Comportamento</h3>
  <p class="hint">Pense em uma situação recente em que o problema ficou mais intenso.</p>
  <label>Situação (O que aconteceu? Onde, quando, com quem?)</label>
  <textarea name="situacao" rows="2" placeholder="Descreva a situação..."></textarea>
  <label>Pensamentos que vieram na hora</label>
  <textarea name="pensamentos" rows="2" placeholder="Frases ou ideias que passaram pela sua cabeça..."></textarea>
  <label>Como você se sentiu? (emoções + intensidade 0–10)</label>
  <textarea name="emocoes" rows="2" placeholder="Ex.: tristeza 8/10, medo 6/10, raiva 4/10..."></textarea>
  <label>O que você fez ou deixou de fazer nessa situação?</label>
  <textarea name="comportamento" rows="2" placeholder="Comportamentos / reações..."></textarea>
</section>

<section>
  <h3>6. Crenças e frases que se repetem</h3>
  <p class="hint">Tem alguma frase sobre você ou sobre a vida que vive se repetindo na sua cabeça?</p>
  <textarea name="crencas" rows="3" placeholder="Ex.: não sou suficiente, vou falhar, ninguém fica comigo..."></textarea>
</section>

<section>
  <h3>7. Saúde e medicação</h3>
  <label>Faz acompanhamento médico ou psiquiátrico?</label>
  <div class="radio-group">
    <label><input type="radio" name="acompanhamento" value="nao"> Não</label>
    <label><input type="radio" name="acompanhamento" value="sim"> Sim</label>
  </div>
  <textarea name="acompanhamento_desc" rows="2" placeholder="Qual(is)?"></textarea>
  <label>Usa algum medicamento contínuo ou atual?</label>
  <div class="radio-group">
    <label><input type="radio" name="medicacao" value="nao"> Não</label>
    <label><input type="radio" name="medicacao" value="sim"> Sim</label>
  </div>
  <textarea name="medicacao_desc" rows="2" placeholder="Quais? (nome e motivo aproximado)"></textarea>
  <label>Alergias importantes?</label>
  <div class="radio-group">
    <label><input type="radio" name="alergias" value="nao"> Não</label>
    <label><input type="radio" name="alergias" value="sim"> Sim</label>
  </div>
  <input type="text" name="alergias_desc" placeholder="Quais?">
</section>

<section>
  <h3>8. Objetivos com a terapia</h3>
  <p class="hint">O que você gostaria que estivesse diferente em você ou na sua vida daqui a alguns meses?</p>
  <textarea name="objetivos" rows="3" placeholder="Seus objetivos..."></textarea>
</section>
'),

('GESTALT', '
<h2>Anamnese Inicial – Gestalt-terapia</h2>
<p class="hint">(curta, direta e fenomenológica)</p>

<section>
  <h3>1. Motivo da consulta – aqui e agora</h3>
  <label>O que te trouxe para a terapia agora?</label>
  <textarea name="motivo" rows="3" placeholder="O que está acontecendo na sua vida hoje que te fez buscar ajuda?"></textarea>
  <label>Em que momentos ou situações isso aparece com mais força?</label>
  <textarea name="momentos" rows="2" placeholder="Ex.: em casa, no trabalho, em relações afetivas, sozinho(a)..."></textarea>
</section>

<section>
  <h3>2. Como isso te afeta no presente?</h3>
  <label>No corpo (sensações físicas)</label>
  <textarea name="corpo" rows="2" placeholder="Descreva sensações físicas..."></textarea>
  <label>Nas emoções (sentimentos mais frequentes)</label>
  <textarea name="emocoes" rows="2" placeholder="Descreva seus sentimentos..."></textarea>
  <label>No comportamento (o que você faz ou evita fazer)</label>
  <textarea name="comportamento" rows="2" placeholder="Descreva seus comportamentos..."></textarea>
</section>

<section>
  <h3>3. De 0 a 10, quanto isso te incomoda hoje?</h3>
  <p class="hint">(0 = nada; 10 = incomoda muito)</p>
  <input type="range" name="intensidade" min="0" max="10" step="1">
  <span class="range-label">Nota: <output name="intensidade_output">5</output></span>
</section>

<section>
  <h3>4. Campo e contexto atual</h3>
  <label>Com quem você mora? Como é essa convivência hoje?</label>
  <textarea name="moradia" rows="2" placeholder="Descreva sua situação de moradia..."></textarea>
  <label>Como está sua rotina de trabalho/estudos neste momento?</label>
  <textarea name="trabalho" rows="2" placeholder="Sobrecarga, desemprego, satisfação, conflitos..."></textarea>
  <label>Existe alguma situação recente marcante?</label>
  <textarea name="situacao_recente" rows="2" placeholder="Mudança, perda, separação, doença, mudança de cidade/trabalho..."></textarea>
</section>

<section>
  <h3>5. Histórico breve</h3>
  <label>Você já viveu algo parecido em outra época da vida?</label>
  <div class="radio-group">
    <label><input type="radio" name="historico" value="nao"> Não</label>
    <label><input type="radio" name="historico" value="sim"> Sim</label>
  </div>
  <textarea name="historico_desc" rows="2" placeholder="Como foi?"></textarea>
  <label>Já fez psicoterapia antes?</label>
  <div class="radio-group">
    <label><input type="radio" name="terapia_anterior" value="nao"> Não</label>
    <label><input type="radio" name="terapia_anterior" value="sim"> Sim</label>
  </div>
  <textarea name="terapia_anterior_desc" rows="2" placeholder="Como foi essa experiência para você?"></textarea>
  <label>Faz algum acompanhamento médico ou psiquiátrico? Usa medicação contínua?</label>
  <div class="radio-group">
    <label><input type="radio" name="medicacao" value="nao"> Não</label>
    <label><input type="radio" name="medicacao" value="sim"> Sim</label>
  </div>
  <input type="text" name="medicacao_desc" placeholder="Qual(is)?">
</section>
'),

('PSYCHODRAMA', '
<h2>Anamnese Inicial – Psicodrama</h2>
<p class="hint">(curta, direta e voltada para cenas)</p>

<section>
  <h3>1. Saúde geral e medicação</h3>
  <label>Faz acompanhamento médico ou psiquiátrico atualmente?</label>
  <div class="radio-group">
    <label><input type="radio" name="acompanhamento" value="nao"> Não</label>
    <label><input type="radio" name="acompanhamento" value="sim"> Sim</label>
  </div>
  <input type="text" name="acompanhamento_desc" placeholder="Qual(is)?">
  <label>Usa algum medicamento de uso contínuo ou atual?</label>
  <div class="radio-group">
    <label><input type="radio" name="medicacao" value="nao"> Não</label>
    <label><input type="radio" name="medicacao" value="sim"> Sim</label>
  </div>
  <input type="text" name="medicacao_desc" placeholder="Quais?">
</section>

<section>
  <h3>2. Motivo da consulta – foco em cena</h3>
  <label>O que te trouxe à terapia agora?</label>
  <textarea name="motivo" rows="3" placeholder="Conte em poucas frases..."></textarea>
  <label>Se você pudesse escolher uma SITUAÇÃO da sua vida para "colocar em cena" hoje, qual seria?</label>
  <textarea name="cena" rows="3" placeholder="Ex.: uma conversa, um conflito, um momento marcante..."></textarea>
  <label>Quando esse problema aparece, o que costuma acontecer na prática?</label>
  <textarea name="dinamica" rows="2" placeholder="O que você faz? O que o outro faz?"></textarea>
</section>

<section>
  <h3>3. De 0 a 10, quanto isso te incomoda hoje?</h3>
  <p class="hint">(0 = nada; 10 = incomoda muito)</p>
  <input type="range" name="intensidade" min="0" max="10" step="1">
  <span class="range-label">Nota: <output name="intensidade_output">5</output></span>
</section>

<section>
  <h3>4. Relações importantes (átomo social básico)</h3>
  <label>Quem são as pessoas mais importantes na sua vida hoje? (Liste 3 a 5 pessoas)</label>
  <textarea name="pessoas_importantes" rows="3" placeholder="Nome / relação / importância..."></textarea>
  <label>Com quem você sente mais facilidade de estar junto?</label>
  <input type="text" name="facilidade">
  <label>Com quem é mais difícil conviver neste momento?</label>
  <input type="text" name="dificuldade">
</section>

<section>
  <h3>5. Experiências anteriores de ajuda</h3>
  <label>Você já fez terapia antes (individual, grupo, psicodrama, outra)?</label>
  <div class="radio-group">
    <label><input type="radio" name="terapia_anterior" value="nao"> Não</label>
    <label><input type="radio" name="terapia_anterior" value="sim"> Sim</label>
  </div>
  <textarea name="terapia_anterior_desc" rows="2" placeholder="Qual tipo? Como foi essa experiência pra você?"></textarea>
</section>

<section>
  <h3>6. Expectativas com o Psicodrama</h3>
  <label>O que você gostaria que estivesse diferente em você ou na sua vida daqui a alguns meses?</label>
  <textarea name="expectativas" rows="3" placeholder="Seus objetivos..."></textarea>
  <label>Em cena, você se sente mais à vontade para:</label>
  <div class="checkbox-group">
    <label><input type="checkbox" name="preferencia" value="falar"> Falar sobre o que sente</label>
    <label><input type="checkbox" name="preferencia" value="representar"> Representar situações vividas</label>
    <label><input type="checkbox" name="preferencia" value="novos_papeis"> Experimentar "novos papéis"</label>
    <label><input type="checkbox" name="preferencia" value="observar"> Observar primeiro, depois entrar na cena</label>
  </div>
</section>
'),

('SYSTEMIC', '
<h2>Anamnese Essencial – Constelação Familiar</h2>

<section>
  <h3>1. Motivo da constelação</h3>
  <label>Qual é o tema ou situação principal que você deseja olhar na constelação?</label>
  <textarea name="tema" rows="3" placeholder="Ex.: relacionamento, sintomas físicos, repetição de padrões, dinheiro, trabalho, filhos, decisão importante..."></textarea>
  <label>Há quanto tempo isso te acompanha?</label>
  <div class="radio-group">
    <label><input type="radio" name="tempo" value="meses"> Meses</label>
    <label><input type="radio" name="tempo" value="1_3_anos"> 1–3 anos</label>
    <label><input type="radio" name="tempo" value="mais_3_anos"> Mais de 3 anos</label>
  </div>
  <label>De 0 a 10, quanto isso te pesa hoje?</label>
  <p class="hint">(0 = nada; 10 = muito pesado)</p>
  <input type="range" name="intensidade" min="0" max="10" step="1">
  <span class="range-label">Nota: <output name="intensidade_output">5</output></span>
</section>

<section>
  <h3>2. Família de origem</h3>
  <label>Pai:</label>
  <div class="radio-group">
    <label><input type="radio" name="pai_status" value="vivo"> Vivo</label>
    <label><input type="radio" name="pai_status" value="falecido"> Falecido</label>
  </div>
  <input type="text" name="pai_ano" placeholder="Ano de nascimento (se souber)">
  <textarea name="pai_relacao" rows="2" placeholder="Como é/foi a relação com ele, em poucas palavras?"></textarea>

  <label>Mãe:</label>
  <div class="radio-group">
    <label><input type="radio" name="mae_status" value="viva"> Viva</label>
    <label><input type="radio" name="mae_status" value="falecida"> Falecida</label>
  </div>
  <input type="text" name="mae_ano" placeholder="Ano de nascimento (se souber)">
  <textarea name="mae_relacao" rows="2" placeholder="Como é/foi a relação com ela, em poucas palavras?"></textarea>

  <label>Irmãos (incluindo os que faleceram ou não nasceram vivos)</label>
  <input type="number" name="num_irmaos" placeholder="Número de irmãos (incluindo você)">
  <input type="number" name="posicao_filho" placeholder="Você é o(a) filho(a) número:">
  <textarea name="irmaos_desc" rows="2" placeholder="Se quiser, pode listar os irmãos (nome ou só irmão 1, 2... e se são mais velhos/mais novos)"></textarea>
</section>

<section>
  <h3>3. Família atual</h3>
  <label>Você está em relacionamento afetivo hoje?</label>
  <div class="radio-group">
    <label><input type="radio" name="relacionamento" value="nao"> Não</label>
    <label><input type="radio" name="relacionamento" value="sim"> Sim</label>
  </div>
  <input type="text" name="relacionamento_tempo" placeholder="Há quanto tempo?">
  <label>Já teve relacionamentos importantes anteriores?</label>
  <div class="radio-group">
    <label><input type="radio" name="rel_anteriores" value="nao"> Não</label>
    <label><input type="radio" name="rel_anteriores" value="sim"> Sim</label>
  </div>
  <input type="text" name="rel_anteriores_qtd" placeholder="Quantos aproximadamente?">
  <label>Tem filhos?</label>
  <div class="radio-group">
    <label><input type="radio" name="filhos" value="nao"> Não</label>
    <label><input type="radio" name="filhos" value="sim"> Sim</label>
  </div>
  <textarea name="filhos_desc" rows="2" placeholder="Quantos? Idade / se vivem com você / se há algum tema importante com eles."></textarea>
  <label>Houve gravidezes interrompidas (espontâneas ou provocadas) com você ou parceiros(as)?</label>
  <div class="radio-group">
    <label><input type="radio" name="gravidezes" value="nao"> Não</label>
    <label><input type="radio" name="gravidezes" value="sim"> Sim</label>
  </div>
  <input type="text" name="gravidezes_qtd" placeholder="Quantas aproximadamente?">
</section>

<section>
  <h3>4. Eventos marcantes no sistema familiar</h3>
  <p class="hint">Assinale o que você souber. Se não souber, pode deixar em branco.</p>
  <div class="checkbox-group">
    <label><input type="checkbox" name="eventos" value="mortes_precoces"> Mortes precoces (crianças/jovens)</label>
    <label><input type="checkbox" name="eventos" value="mortes_tragicas"> Mortes trágicas (acidentes, homicídio, desaparecimento)</label>
    <label><input type="checkbox" name="eventos" value="suicidio"> Suicídio ou tentativas de suicídio</label>
    <label><input type="checkbox" name="eventos" value="doencas_graves"> Doenças graves ou crônicas importantes</label>
    <label><input type="checkbox" name="eventos" value="dependencia"> Dependência de álcool ou outras drogas</label>
    <label><input type="checkbox" name="eventos" value="abortos"> Abortos / filhos não reconhecidos</label>
    <label><input type="checkbox" name="eventos" value="adocoes"> Adoções (alguém adotado ou que "foi criado por outra família")</label>
    <label><input type="checkbox" name="eventos" value="grandes_perdas"> Situações de grande perda (fuga, guerra, migração, perda de bens, perseguição)</label>
    <label><input type="checkbox" name="eventos" value="crimes"> Crimes, prisões, envolvimento com violência</label>
    <label><input type="checkbox" name="eventos" value="excluidos"> Pessoas "excluídas" ou que "não se fala sobre"</label>
  </div>
  <textarea name="eventos_obs" rows="2" placeholder="Se quiser, comente algo que considere importante..."></textarea>
</section>

<section>
  <h3>5. Saúde e acompanhamento atual</h3>
  <label>Você faz acompanhamento psicológico ou psiquiátrico atualmente?</label>
  <div class="radio-group">
    <label><input type="radio" name="acompanhamento" value="nao"> Não</label>
    <label><input type="radio" name="acompanhamento" value="sim"> Sim</label>
  </div>
  <input type="text" name="acompanhamento_tipo" placeholder="Qual tipo?">
  <label>Usa medicação psiquiátrica ou outra medicação contínua?</label>
  <div class="radio-group">
    <label><input type="radio" name="medicacao" value="nao"> Não</label>
    <label><input type="radio" name="medicacao" value="sim"> Sim</label>
  </div>
  <input type="text" name="medicacao_desc" placeholder="Qual(is)?">
  <label>Já teve episódios de crise intensa (ideias de morte, tentativa de suicídio, internação)?</label>
  <div class="radio-group">
    <label><input type="radio" name="crise" value="nao"> Não</label>
    <label><input type="radio" name="crise" value="sim"> Sim</label>
  </div>
  <textarea name="crise_desc" rows="2" placeholder="Se quiser, descreva brevemente..."></textarea>
</section>

<section>
  <h3>6. Expectativa com a constelação</h3>
  <label>O que você espera que essa constelação te ajude a ver ou movimentar?</label>
  <textarea name="expectativa" rows="3" placeholder="Suas expectativas..."></textarea>
  <label>Existe algo que você NÃO gostaria que fosse exposto ou trabalhado agora?</label>
  <textarea name="limites" rows="2" placeholder="Pode ser um limite importante pra te proteger..."></textarea>
</section>
')

ON CONFLICT (approach) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();
