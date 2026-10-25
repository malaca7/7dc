# Diretriz de Deploy no GitHub Pages (branch gh-pages)

Sempre que concluir completamente todas as tarefas, correções e modificações solicitadas pelo usuário, e não houver nenhuma tarefa pendente ou mensagem pendente:
1. Executar testes e build de validação: `npm test` e `npm run build`.
2. Fazer o commit do código na branch principal: `git add .` e `git commit -m "..."`.
3. Executar o deploy no GitHub Pages para a branch `gh-pages`:
   ```bash
   npm run deploy
   ```
   (Ou enviar para o remote `git push origin gh-pages`).
4. Informar a URL pública do painel gerado no GitHub Pages:
   `https://malaca7.github.io/7dc/`
