/* ELITE Academy — cursos de exemplo (usados até o Master salvar o conteúdo no banco).
   Compartilhado pela área de membros (index.html) e pela vitrine (vitrine.html). */
const initialCourses = [
 {id:'metodo-lp',price:'197,00',featured:true,name:'Método LP',desc:'Aprenda a estruturar sua presença digital e transformar atenção em oportunidades.',color:'green',tag:'MÉTODO EXCLUSIVO',code:'LP',locked:false,
  learn:['Estruturar sua presença digital do zero','Criar uma oferta clara e atraente','Produzir conteúdo que gera conexão','Executar um plano de ação de 7 dias'],
  modules:[
  {name:'Módulo 01 — Fundamentos',lessons:[
   {title:'Boas-vindas ao Método LP',type:'video',min:8,url:'https://www.youtube.com/watch?v=ysz5S6PUM-U',body:'Uma visão geral da jornada, dos objetivos e de como aproveitar melhor o treinamento.'},
   {title:'Mentalidade e preparação',type:'text',min:6,body:'Antes de executar, defina seu objetivo, conheça seu público e organize uma rotina simples de aplicação. Anote suas metas e acompanhe sua evolução.'},
   {title:'Checklist de início rápido',type:'pdf',min:5,url:'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',body:'Material demonstrativo para organizar os primeiros passos.'}
  ]},
  {name:'Módulo 02 — Estratégia',lessons:[
   {title:'Construindo uma oferta clara',type:'video',min:14,url:'https://www.youtube.com/watch?v=jfKfPfyJRdk',body:'Aprenda a apresentar valor de forma simples e objetiva.'},
   {title:'Conteúdo que gera conexão',type:'text',min:7,body:'Crie conteúdos que respondam dúvidas reais, demonstrem benefícios e conduzam o público para o próximo passo.'}
  ]},
  {name:'Módulo 03 — Aplicação prática',lessons:[
   {title:'Plano de ação de 7 dias',type:'text',min:10,body:'Dia 1: planejar.\nDias 2 e 3: produzir.\nDias 4 e 5: publicar e conversar.\nDias 6 e 7: analisar e ajustar.'}
  ]}
 ]},
 {id:'digital-scale',price:'147,00',name:'Digital Scale Pro',desc:'Processos e estratégias para organizar e escalar negócios no digital.',color:'purple',tag:'ESCALA & PERFORMANCE',code:'DS',locked:false,
  learn:['Mapear os pilares da sua operação','Organizar processos e responsáveis','Acompanhar os indicadores que importam'],
  modules:[
  {name:'Módulo 01 — Estrutura',lessons:[{title:'O mapa da escala digital',type:'video',min:12,url:'https://www.youtube.com/watch?v=ysz5S6PUM-U',body:'Conheça os pilares de uma operação digital organizada.'},{title:'Organização de processos',type:'text',min:6,body:'Documente tarefas recorrentes, defina responsáveis e acompanhe indicadores simples.'}]},
  {name:'Módulo 02 — Crescimento',lessons:[{title:'Indicadores essenciais',type:'text',min:8,body:'Acompanhe aquisição, conversão, retenção e satisfação para decidir com clareza.'}]}
 ]},
 {id:'design-magnetico',price:'97,00',name:'Design Magnético',desc:'Design, identidade visual e criativos que valorizam sua marca.',color:'blue',tag:'CRIATIVIDADE & MARCA',code:'DM',locked:false,
  learn:['Princípios de hierarquia e contraste','Montar um guia de identidade simples','Criar criativos para redes sociais'],
  modules:[
  {name:'Módulo 01 — Direção visual',lessons:[{title:'Princípios de um visual forte',type:'video',min:11,url:'https://www.youtube.com/watch?v=ysz5S6PUM-U',body:'Explore hierarquia, contraste, consistência e clareza visual.'},{title:'Guia de identidade',type:'pdf',min:4,url:'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',body:'Guia demonstrativo de identidade visual.'}]},
  {name:'Módulo 02 — Criativos',lessons:[{title:'Composição para redes sociais',type:'text',min:7,body:'Comece por uma mensagem principal, use poucos elementos e mantenha contraste suficiente para leitura.'}]}
 ]},
 {id:'trafego-elite',price:'247,00',name:'Tráfego Elite',desc:'Fundamentos de campanhas, públicos e análise de resultados.',color:'orange',tag:'ACESSO PREMIUM',code:'TE',locked:true,
  learn:['Estruturar campanhas do zero','Definir e testar públicos','Ler os números e otimizar resultados'],modules:[]},
 {id:'copy-pro',price:'127,00',name:'Copywriting Pro',desc:'Escrita persuasiva, ofertas e comunicação que conecta.',color:'purple',tag:'ACESSO PREMIUM',code:'CP',locked:true,
  learn:['Escrever títulos que prendem a atenção','Estruturar páginas e mensagens de venda','Adaptar a comunicação a cada canal'],modules:[]},
 {id:'automacao',price:'97,00',name:'Automação Inteligente',desc:'Ganhe tempo com fluxos e processos digitais.',color:'green',tag:'ACESSO PREMIUM',code:'AI',locked:true,
  learn:['Identificar tarefas que podem ser automatizadas','Montar fluxos simples de atendimento','Integrar ferramentas do dia a dia'],modules:[]}
];
