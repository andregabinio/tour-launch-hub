-- supabase/seed.sql
-- Run AFTER migration.sql to populate initial data

-- Insert all acoes (actions without dependencies first, then dependent ones)

-- PLANEJAMENTO ESTRATEGICO
INSERT INTO public.acoes (id, titulo, descricao, macro_etapa_id, responsavel, prioridade, status, situacao_prazo, tempo_estimado, data_inicio, data_fim, dependencia_de) VALUES
  ('PLA-001', 'Definir conceito criativo do TOUR', 'Criar o conceito visual, narrativa e identidade do tour.', 'planejamento', 'Ana Costa', 'alta', 'concluída', 'no prazo', '5 dias', '2025-07-01', '2025-07-07', NULL),
  ('PLA-003', 'Orçamento geral do projeto', 'Consolidar orçamento de todas as frentes.', 'planejamento', 'Felipe Almeida', 'alta', 'em andamento', 'no prazo', '7 dias', '2025-07-03', '2025-07-12', NULL),
  ('PLA-004', 'Definir cronograma geral', 'Estabelecer marcos e deadlines para todas as áreas.', 'planejamento', 'Ricardo Nunes', 'média', 'concluída', 'no prazo', '4 dias', '2025-07-08', '2025-07-12', NULL),
  ('PLA-005', 'Montar equipe de projeto', 'Definir papéis, alocações e responsabilidades do time.', 'planejamento', 'Ricardo Nunes', 'alta', 'concluída', 'no prazo', '3 dias', '2025-07-01', '2025-07-04', NULL),
  ('PLA-002', 'Mapear cidades e venues', 'Selecionar cidades-alvo e negociar venues para as datas.', 'planejamento', 'Diego Rocha', 'alta', 'em andamento', 'atrasada', '10 dias', '2025-07-05', '2025-07-18', 'PLA-001');

-- BRANDING E COMUNICACAO
INSERT INTO public.acoes (id, titulo, descricao, macro_etapa_id, responsavel, prioridade, status, situacao_prazo, tempo_estimado, data_inicio, data_fim, dependencia_de) VALUES
  ('BRA-001', 'Criar identidade visual do TOUR', 'Logo, paleta de cores, tipografia e key visual.', 'branding', 'Ana Costa', 'alta', 'em andamento', 'no prazo', '8 dias', '2025-07-10', '2025-07-21', 'PLA-001'),
  ('BRA-002', 'Estratégia de posicionamento', 'Definir tom de voz, mensagens-chave e narrativa da marca.', 'branding', 'Elena Martins', 'média', 'em andamento', 'no prazo', '6 dias', '2025-07-12', '2025-07-19', 'PLA-001'),
  ('BRA-003', 'Press kit e media kit', 'Montar kit de imprensa para assessoria e parceiros.', 'branding', 'Elena Martins', 'média', 'não iniciada', 'no prazo', '5 dias', '2025-07-21', '2025-07-27', 'BRA-001'),
  ('BRA-004', 'Plano de assessoria de imprensa', 'Definir veículos, pautas e cronograma de divulgação.', 'branding', 'Elena Martins', 'baixa', 'não iniciada', 'no prazo', '4 dias', '2025-07-24', '2025-07-29', 'BRA-003');

-- PRODUCAO DE MATERIAIS
INSERT INTO public.acoes (id, titulo, descricao, macro_etapa_id, responsavel, prioridade, status, situacao_prazo, tempo_estimado, data_inicio, data_fim, dependencia_de) VALUES
  ('PRO-003', 'Peças para redes sociais', 'Criar grid de posts, stories e reels para lançamento.', 'producao', 'Gabriela Lima', 'média', 'em andamento', 'atrasada', '10 dias', '2025-07-15', '2025-07-28', NULL),
  ('PRO-001', 'Produzir vídeo teaser de anúncio', 'Roteirizar e produzir vídeo teaser de 30s para redes.', 'producao', 'Bruno Silva', 'alta', 'não iniciada', 'no prazo', '12 dias', '2025-07-22', '2025-08-05', 'BRA-001'),
  ('PRO-002', 'Banco de imagens e assets digitais', 'Criar e organizar banco de imagens para todas as peças.', 'producao', 'Gabriela Lima', 'média', 'não iniciada', 'no prazo', '6 dias', '2025-07-22', '2025-07-29', 'BRA-001'),
  ('PRO-004', 'Material gráfico para venues', 'Banners, backdrops, sinalização e materiais impressos.', 'producao', 'Ana Costa', 'média', 'não iniciada', 'no prazo', '7 dias', '2025-07-28', '2025-08-05', 'BRA-001'),
  ('PRO-005', 'Landing page do TOUR', 'Desenvolver landing page com informações, datas e venda.', 'producao', 'Bruno Silva', 'alta', 'não iniciada', 'no prazo', '8 dias', '2025-07-25', '2025-08-04', 'BRA-001');

-- PRE-LANCAMENTO
INSERT INTO public.acoes (id, titulo, descricao, macro_etapa_id, responsavel, prioridade, status, situacao_prazo, tempo_estimado, data_inicio, data_fim, dependencia_de) VALUES
  ('PRE-003', 'Prospecção de patrocinadores', 'Identificar marcas para patrocínio e cotas de apoio.', 'pre-lancamento', 'Elena Martins', 'alta', 'em andamento', 'atrasada', '15 dias', '2025-07-14', '2025-08-01', NULL),
  ('PRE-002', 'Estratégia de influenciadores', 'Mapear, contatar e fechar parcerias com influenciadores.', 'pre-lancamento', 'Elena Martins', 'média', 'não iniciada', 'no prazo', '10 dias', '2025-08-01', '2025-08-13', 'BRA-001'),
  ('PRE-001', 'Plano de mídia paga', 'Estratégia de mídia paga: Meta Ads, Google Ads, YouTube.', 'pre-lancamento', 'Carla Mendes', 'alta', 'não iniciada', 'no prazo', '7 dias', '2025-08-04', '2025-08-12', 'PRO-001'),
  ('PRE-004', 'Configurar plataforma de ingressos', 'Integrar e configurar plataforma de vendas com lotes.', 'pre-lancamento', 'Bruno Silva', 'alta', 'não iniciada', 'no prazo', '10 dias', '2025-08-06', '2025-08-18', 'PLA-002'),
  ('PRE-005', 'Campanha de aquecimento', 'Ativar teasers e contagem regressiva nas redes.', 'pre-lancamento', 'Gabriela Lima', 'média', 'não iniciada', 'no prazo', '7 dias', '2025-08-11', '2025-08-19', 'PRO-001');

-- LANCAMENTO
INSERT INTO public.acoes (id, titulo, descricao, macro_etapa_id, responsavel, prioridade, status, situacao_prazo, tempo_estimado, data_inicio, data_fim, dependencia_de) VALUES
  ('LAN-001', 'Contratação de fornecedores técnicos', 'Contratar som, iluminação, palco e equipe técnica.', 'lancamento', 'Diego Rocha', 'alta', 'não iniciada', 'no prazo', '12 dias', '2025-08-11', '2025-08-25', 'PLA-002'),
  ('LAN-002', 'Logística de hospedagem e transporte', 'Organizar deslocamento e hospedagem da equipe e artistas.', 'lancamento', 'Felipe Almeida', 'média', 'não iniciada', 'no prazo', '8 dias', '2025-08-18', '2025-08-27', 'PLA-002'),
  ('LAN-003', 'Go-live de vendas de ingressos', 'Abertura oficial de vendas com campanhas ativas.', 'lancamento', 'Bruno Silva', 'alta', 'não iniciada', 'no prazo', '5 dias', '2025-08-20', '2025-08-26', 'PRE-004'),
  ('LAN-004', 'Cobertura ao vivo nas redes', 'Stories, lives e cobertura em tempo real do lançamento.', 'lancamento', 'Gabriela Lima', 'média', 'não iniciada', 'no prazo', '5 dias', '2025-08-20', '2025-08-26', 'PRO-001');

-- POS-LANCAMENTO
INSERT INTO public.acoes (id, titulo, descricao, macro_etapa_id, responsavel, prioridade, status, situacao_prazo, tempo_estimado, data_inicio, data_fim, dependencia_de) VALUES
  ('POS-002', 'Pesquisa de satisfação pós-show', 'Enviar pesquisa NPS e qualitativa para o público.', 'pos-lancamento', 'Gabriela Lima', 'baixa', 'não iniciada', 'no prazo', '4 dias', '2025-09-01', '2025-09-05', NULL),
  ('POS-001', 'Relatório de performance', 'Consolidar métricas de vendas, engajamento e mídia.', 'pos-lancamento', 'Carla Mendes', 'baixa', 'não iniciada', 'no prazo', '5 dias', '2025-08-27', '2025-09-02', 'PRE-001'),
  ('POS-003', 'Retrospectiva e aprendizados', 'Reunião de retrospectiva com todas as áreas envolvidas.', 'pos-lancamento', 'Ricardo Nunes', 'baixa', 'não iniciada', 'no prazo', '3 dias', '2025-09-05', '2025-09-09', 'POS-001'),
  ('POS-004', 'Plano de continuidade', 'Definir próximos passos, novas datas e expansão do tour.', 'pos-lancamento', 'Ricardo Nunes', 'média', 'não iniciada', 'no prazo', '5 dias', '2025-09-08', '2025-09-14', 'POS-003');

-- Insert all subtarefas
INSERT INTO public.subtarefas (id, acao_id, titulo, status, responsavel, tempo_estimado) VALUES
  -- PLA-001
  (gen_random_uuid(), 'PLA-001', 'Pesquisa de referências visuais', 'concluída', 'Ana Costa', '2 dias'),
  (gen_random_uuid(), 'PLA-001', 'Mood board aprovado', 'concluída', 'Ana Costa', '1 dia'),
  (gen_random_uuid(), 'PLA-001', 'Documento de conceito final', 'concluída', 'Ana Costa', '2 dias'),
  -- PLA-002
  (gen_random_uuid(), 'PLA-002', 'Lista de cidades prioritárias', 'concluída', 'Diego Rocha', '2 dias'),
  (gen_random_uuid(), 'PLA-002', 'Contato com venues', 'em andamento', 'Diego Rocha', '5 dias'),
  (gen_random_uuid(), 'PLA-002', 'Contratos assinados', 'não iniciada', 'Felipe Almeida', '3 dias'),
  -- PLA-003
  (gen_random_uuid(), 'PLA-003', 'Levantamento de custos por área', 'concluída', 'Felipe Almeida', '3 dias'),
  (gen_random_uuid(), 'PLA-003', 'Aprovação da diretoria', 'não iniciada', 'Felipe Almeida', '2 dias'),
  -- PLA-004
  (gen_random_uuid(), 'PLA-004', 'Timeline por macro etapa', 'concluída', 'Ricardo Nunes', '2 dias'),
  (gen_random_uuid(), 'PLA-004', 'Alinhamento entre áreas', 'concluída', 'Ricardo Nunes', '2 dias'),
  -- BRA-001
  (gen_random_uuid(), 'BRA-001', 'Proposta de logo (3 opções)', 'concluída', 'Ana Costa', '3 dias'),
  (gen_random_uuid(), 'BRA-001', 'Guideline de marca', 'em andamento', 'Ana Costa', '3 dias'),
  (gen_random_uuid(), 'BRA-001', 'Adaptações para redes sociais', 'não iniciada', 'Gabriela Lima', '2 dias'),
  -- BRA-002
  (gen_random_uuid(), 'BRA-002', 'Documento de posicionamento', 'em andamento', 'Elena Martins', '3 dias'),
  (gen_random_uuid(), 'BRA-002', 'Key messages por público', 'não iniciada', 'Elena Martins', '3 dias'),
  -- BRA-003
  (gen_random_uuid(), 'BRA-003', 'Release de imprensa', 'não iniciada', 'Elena Martins', '2 dias'),
  (gen_random_uuid(), 'BRA-003', 'Assets visuais para press', 'não iniciada', 'Ana Costa', '2 dias'),
  (gen_random_uuid(), 'BRA-003', 'Página de press online', 'não iniciada', 'Bruno Silva', '1 dia'),
  -- PRO-001
  (gen_random_uuid(), 'PRO-001', 'Roteiro aprovado', 'não iniciada', 'Bruno Silva', '3 dias'),
  (gen_random_uuid(), 'PRO-001', 'Gravação', 'não iniciada', 'Bruno Silva', '4 dias'),
  (gen_random_uuid(), 'PRO-001', 'Edição e pós-produção', 'não iniciada', 'Bruno Silva', '5 dias'),
  -- PRO-002
  (gen_random_uuid(), 'PRO-002', 'Sessão fotográfica', 'não iniciada', 'Gabriela Lima', '2 dias'),
  (gen_random_uuid(), 'PRO-002', 'Tratamento e catalogação', 'não iniciada', 'Gabriela Lima', '4 dias'),
  -- PRO-003
  (gen_random_uuid(), 'PRO-003', 'Grid de 30 dias planejado', 'concluída', 'Gabriela Lima', '3 dias'),
  (gen_random_uuid(), 'PRO-003', 'Criação de 15 peças visuais', 'em andamento', 'Gabriela Lima', '5 dias'),
  (gen_random_uuid(), 'PRO-003', 'Redação de copies', 'não iniciada', 'Elena Martins', '2 dias'),
  -- PRO-004
  (gen_random_uuid(), 'PRO-004', 'Layout dos banners', 'não iniciada', 'Ana Costa', '3 dias'),
  (gen_random_uuid(), 'PRO-004', 'Envio para produção gráfica', 'não iniciada', 'Ana Costa', '2 dias'),
  (gen_random_uuid(), 'PRO-004', 'Conferência de provas', 'não iniciada', 'Ana Costa', '2 dias'),
  -- PRO-005
  (gen_random_uuid(), 'PRO-005', 'Wireframe aprovado', 'não iniciada', 'Bruno Silva', '2 dias'),
  (gen_random_uuid(), 'PRO-005', 'Desenvolvimento front-end', 'não iniciada', 'Bruno Silva', '4 dias'),
  (gen_random_uuid(), 'PRO-005', 'Integração com vendas', 'não iniciada', 'Bruno Silva', '2 dias'),
  -- PRE-001
  (gen_random_uuid(), 'PRE-001', 'Definir budget por canal', 'não iniciada', 'Carla Mendes', '2 dias'),
  (gen_random_uuid(), 'PRE-001', 'Criar audiências e segmentações', 'não iniciada', 'Carla Mendes', '3 dias'),
  (gen_random_uuid(), 'PRE-001', 'Subir campanhas', 'não iniciada', 'Carla Mendes', '2 dias'),
  -- PRE-002
  (gen_random_uuid(), 'PRE-002', 'Lista de influenciadores (tier 1-3)', 'não iniciada', 'Elena Martins', '3 dias'),
  (gen_random_uuid(), 'PRE-002', 'Briefing e proposta comercial', 'não iniciada', 'Elena Martins', '4 dias'),
  (gen_random_uuid(), 'PRE-002', 'Contratos assinados', 'não iniciada', 'Felipe Almeida', '3 dias'),
  -- PRE-003
  (gen_random_uuid(), 'PRE-003', 'Deck de patrocínio finalizado', 'concluída', 'Elena Martins', '5 dias'),
  (gen_random_uuid(), 'PRE-003', 'Lista de 30 prospects', 'concluída', 'Elena Martins', '3 dias'),
  (gen_random_uuid(), 'PRE-003', 'Reuniões de apresentação', 'em andamento', 'Elena Martins', '5 dias'),
  (gen_random_uuid(), 'PRE-003', 'Contratos fechados', 'não iniciada', 'Felipe Almeida', '2 dias'),
  -- PRE-004
  (gen_random_uuid(), 'PRE-004', 'Definir categorias e preços', 'não iniciada', 'Bruno Silva', '2 dias'),
  (gen_random_uuid(), 'PRE-004', 'Configurar lotes na plataforma', 'não iniciada', 'Bruno Silva', '4 dias'),
  (gen_random_uuid(), 'PRE-004', 'Teste de compra end-to-end', 'não iniciada', 'Bruno Silva', '2 dias'),
  (gen_random_uuid(), 'PRE-004', 'Página de venda publicada', 'não iniciada', 'Bruno Silva', '2 dias'),
  -- PRE-005
  (gen_random_uuid(), 'PRE-005', 'Cronograma de teasers', 'não iniciada', 'Gabriela Lima', '2 dias'),
  (gen_random_uuid(), 'PRE-005', 'Posts de contagem regressiva', 'não iniciada', 'Gabriela Lima', '3 dias'),
  (gen_random_uuid(), 'PRE-005', 'Ativação com influenciadores', 'não iniciada', 'Elena Martins', '2 dias'),
  -- LAN-001
  (gen_random_uuid(), 'LAN-001', 'Rider técnico finalizado', 'não iniciada', 'Diego Rocha', '3 dias'),
  (gen_random_uuid(), 'LAN-001', 'Cotações recebidas (mín. 3)', 'não iniciada', 'Diego Rocha', '4 dias'),
  (gen_random_uuid(), 'LAN-001', 'Contratos de fornecedores', 'não iniciada', 'Felipe Almeida', '3 dias'),
  (gen_random_uuid(), 'LAN-001', 'Cronograma de montagem', 'não iniciada', 'Diego Rocha', '2 dias'),
  -- LAN-002
  (gen_random_uuid(), 'LAN-002', 'Reservas de hotel', 'não iniciada', 'Felipe Almeida', '3 dias'),
  (gen_random_uuid(), 'LAN-002', 'Passagens aéreas/terrestres', 'não iniciada', 'Felipe Almeida', '3 dias'),
  (gen_random_uuid(), 'LAN-002', 'Transfers locais confirmados', 'não iniciada', 'Felipe Almeida', '2 dias'),
  -- LAN-003
  (gen_random_uuid(), 'LAN-003', 'Verificação final da plataforma', 'não iniciada', 'Bruno Silva', '1 dia'),
  (gen_random_uuid(), 'LAN-003', 'Monitoramento de vendas real-time', 'não iniciada', 'Bruno Silva', '2 dias'),
  (gen_random_uuid(), 'LAN-003', 'Suporte ao cliente ativo', 'não iniciada', 'Ricardo Nunes', '2 dias'),
  -- LAN-004
  (gen_random_uuid(), 'LAN-004', 'Roteiro de cobertura', 'não iniciada', 'Gabriela Lima', '1 dia'),
  (gen_random_uuid(), 'LAN-004', 'Equipe de social media no local', 'não iniciada', 'Gabriela Lima', '2 dias'),
  (gen_random_uuid(), 'LAN-004', 'Compilação e highlights', 'não iniciada', 'Bruno Silva', '2 dias'),
  -- POS-001
  (gen_random_uuid(), 'POS-001', 'Coleta de dados de mídia paga', 'não iniciada', 'Carla Mendes', '2 dias'),
  (gen_random_uuid(), 'POS-001', 'Análise de vendas por cidade', 'não iniciada', 'Bruno Silva', '2 dias'),
  (gen_random_uuid(), 'POS-001', 'Apresentação para stakeholders', 'não iniciada', 'Carla Mendes', '1 dia'),
  -- POS-002
  (gen_random_uuid(), 'POS-002', 'Criar formulário de pesquisa', 'não iniciada', 'Gabriela Lima', '1 dia'),
  (gen_random_uuid(), 'POS-002', 'Disparar e-mails', 'não iniciada', 'Gabriela Lima', '1 dia'),
  (gen_random_uuid(), 'POS-002', 'Compilar resultados', 'não iniciada', 'Gabriela Lima', '2 dias'),
  -- POS-003
  (gen_random_uuid(), 'POS-003', 'Pauta da retrospectiva', 'não iniciada', 'Ricardo Nunes', '1 dia'),
  (gen_random_uuid(), 'POS-003', 'Documento de lições aprendidas', 'não iniciada', 'Ricardo Nunes', '2 dias');
