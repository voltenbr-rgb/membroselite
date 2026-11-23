# ELITE Academy — protótipo de área de membros

## Publicar no GitHub e Cloudflare Pages
1. Extraia o ZIP.
2. Envie os arquivos `index.html`, `styles.css` e `app.js` para a raiz de um repositório GitHub.
3. No Cloudflare, abra **Workers & Pages → Create → Pages → Connect to Git**.
4. Selecione o repositório. Framework preset: **None**. Build command: deixe vazio. Build output directory: `/` (ou `.` conforme a interface).
5. Faça o deploy.

## Acesso demonstrativo
- A tela inicial solicita nome e senha.
- Senha de demonstração: `1989`.
- Telefone é opcional.
- O botão de engrenagem no canto superior direito abre o painel de gestão.

## O que já está no protótipo
- Dashboard responsivo dark + verde neon.
- Cards promocionais fictícios e vitrine de cursos.
- Cursos de exemplo, incluindo **Método LP**.
- Página interna de curso com módulos, videoaulas, PDFs e aulas em texto.
- Painel para adicionar cursos e conteúdos por URL.
- Cursos bloqueados e tela de checkout demonstrativa.
- Biblioteca de materiais e progresso visual.
- Dados salvos no `localStorage` do navegador.

## Importante antes de vender
Este pacote é um **protótipo front-end**. A senha `1989` é compartilhada e fica visível no código; o login não é autenticação segura. Os dados ficam apenas no navegador de cada dispositivo. O painel de gestão também não tem proteção real. Não use para distribuir cursos pagos ou armazenar dados de clientes ainda.

Para produção, conecte autenticação individual, banco de dados, armazenamento de arquivos, controle de acesso por compra/assinatura e checkout (por exemplo, via backend/Cloudflare Workers e provedor de pagamento). Não coloque chaves secretas no JavaScript público.
