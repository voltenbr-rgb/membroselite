# ELITE Academy — protótipo de área de membros

## Publicar no GitHub e Cloudflare Pages
1. Extraia o ZIP.
2. Envie os arquivos `index.html`, `styles.css` e `app.js` para a raiz de um repositório GitHub.
3. No Cloudflare, abra **Workers & Pages → Create → Pages → Connect to Git**.
4. Selecione o repositório. Framework preset: **None**. Build command: deixe vazio. Build output directory: `/` (ou `.` conforme a interface).
5. Faça o deploy.

## Acesso demonstrativo
- A tela inicial pede nome e senha (senha de demonstração: `1989`). Telefone é opcional.
- A **Área Master** fica no rodapé (link discreto), na tela de login e dentro da plataforma.

## O que já está no protótipo
- **Início "Sua jornada"**: saudação, card "Continue de onde parou", números de progresso, cursos em pôster, cursos para desbloquear e nível do aluno.
- **Cursos em formato de série**: módulos como temporadas e aulas como episódios, com duração e marca de concluída.
- **Tela de aula**: player, lista de aulas, abas de descrição, materiais, anotações e dúvidas, próxima aula automática.
- **Página de venda** para cursos bloqueados: trailer, "o que você vai aprender", conteúdo e botão de checkout.
- **Evolução**: níveis (Membro → Elite → Master), sequência de dias, calendário de estudo e certificados para imprimir/salvar em PDF.
- **Perfil**, **Materiais** (PDFs) e busca.
- Celular: barra de navegação inferior.
- Dados salvos no `localStorage` do navegador.

## Importante antes de vender
Este pacote é um **protótipo front-end**. A senha `1989` é compartilhada e fica visível no código; o login não é autenticação segura. Os dados ficam apenas no navegador de cada dispositivo. O painel de gestão também não tem proteção real. Não use para distribuir cursos pagos ou armazenar dados de clientes ainda.

Para produção, conecte autenticação individual, banco de dados, armazenamento de arquivos, controle de acesso por compra/assinatura e checkout (por exemplo, via backend/Cloudflare Workers e provedor de pagamento). Não coloque chaves secretas no JavaScript público.
