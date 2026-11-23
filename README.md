# ELITE Academy — protótipo de área de membros

## Publicar no GitHub e Cloudflare Pages
1. Extraia o ZIP.
2. Envie os arquivos `index.html`, `styles.css` e `app.js` para a raiz de um repositório GitHub.
3. No Cloudflare, abra **Workers & Pages → Create → Pages → Connect to Git**.
4. Selecione o repositório. Framework preset: **None**. Build command: deixe vazio. Build output directory: `/` (ou `.` conforme a interface).
5. Faça o deploy.

## Banco de dados (Cloudflare D1)
- O site usa o banco **membroselite**, ligado ao projeto do Pages com o nome de variável `DB` (Settings → Bindings).
- A API fica em `functions/api/[[path]].js` (Cloudflare Pages Functions). As tabelas estão em `schema.sql` e também são criadas sozinhas no primeiro acesso.
- **Primeiro acesso:** clique em **Área Master** no rodapé e crie a conta Master (nome, e-mail, senha). Isso só funciona uma vez.
- No Master, em **Alunos**, cadastre cada aluno (e-mail + senha inicial) e envie a mensagem de acesso pronta.
- Conteúdo (cursos/aulas), progresso, anotações e dúvidas de cada aluno ficam salvos no banco e aparecem em qualquer aparelho.
- Alunos não recebem os links das aulas de cursos bloqueados.
- Se a API não responder (por exemplo, abrindo o `index.html` direto no computador), o site entra em **modo demonstração**: senha `1989` e tudo salvo só no navegador.

## Vitrine (loja pública)
- Endereço: **/vitrine** (ex.: `https://SEU-SITE.pages.dev/vitrine`). Não precisa de login.
- Mostra os cursos marcados "Na vitrine" no Master, com preço, detalhes e botão **Comprar agora** (abre o link do checkout).
- Link direto de cada curso: `/vitrine#p/ID-DO-CURSO` (botão "Link do curso" no Master).
- No Master → **Vitrine**: copiar o link, definir preço e checkout de cada curso, mostrar/esconder e escolher o destaque.
- Por enquanto, depois da compra o Master cadastra o aluno em **Alunos**. A liberação automática por compra é a próxima etapa.

## O que já está no protótipo
- **Início "Sua jornada"**: saudação, card "Continue de onde parou", números de progresso, cursos em pôster, cursos para desbloquear e nível do aluno.
- **Cursos em formato de série**: módulos como temporadas e aulas como episódios, com duração e marca de concluída.
- **Tela de aula**: player, lista de aulas, abas de descrição, materiais, anotações e dúvidas, próxima aula automática.
- **Página de venda** para cursos bloqueados: trailer, "o que você vai aprender", conteúdo e botão de checkout.
- **Evolução**: níveis (Membro → Elite → Master), sequência de dias, calendário de estudo e certificados para imprimir/salvar em PDF.
- **Perfil**, **Materiais** (arquivos e links de todas as aulas) e busca.
- **Área Master** (link no rodapé): cursos, módulos e aulas com editar, reordenar e excluir. Cada aula tem vídeo (YouTube/Vimeo, abre em janela para o aluno), texto e botões de **arquivo** ou **site**. Também dá para exportar/importar todo o conteúdo em um arquivo.
- Celular: barra de navegação inferior.
- **App instalável (PWA):** ícone próprio, abre em tela cheia, botão/aviso "Instalar o app" (Android, computador) e passo a passo para iPhone; tela de "sem conexão" quando não há internet. Arquivos: `manifest.webmanifest`, `sw.js`, `icons/`, `_headers`.
- Dados salvos no `localStorage` do navegador.

## Importante antes de vender
Este pacote é um **protótipo front-end**. A senha `1989` é compartilhada e fica visível no código; o login não é autenticação segura. Os dados ficam apenas no navegador de cada dispositivo. O painel de gestão também não tem proteção real. Não use para distribuir cursos pagos ou armazenar dados de clientes ainda.

Para produção, conecte autenticação individual, banco de dados, armazenamento de arquivos, controle de acesso por compra/assinatura e checkout (por exemplo, via backend/Cloudflare Workers e provedor de pagamento). Não coloque chaves secretas no JavaScript público.
