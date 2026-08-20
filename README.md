# CRUD de Contatos — frontend + backend

Dois pedaços que conversam entre si:

- `server.js` — o **backend** (a API REST, em Node.js + Express)
- `crud-contatos.html` — o **frontend** (a tela, que chama a API com `fetch`)

## Pré-requisito
Ter o **Node.js** instalado. Confira com:
```
node --version
```
Se não tiver, baixe em https://nodejs.org

## Passo a passo

1. Coloque `server.js` e `crud-contatos.html` na mesma pasta e abra um terminal nela.

2. Instale as dependências do backend (só na primeira vez):
   ```
   npm install express cors
   ```

3. Ligue o backend:
   ```
   node server.js
   ```
   Deve aparecer: `API rodando em http://localhost:3000`
   Deixe esse terminal aberto.

4. Abra o `crud-contatos.html` no navegador (dois cliques no arquivo).
   Pronto — adicionar, editar e excluir agora vão pro backend.

## Como testar a API sozinha
Com o backend ligado, abra no navegador:
http://localhost:3000/contatos
Você verá a lista de contatos em JSON (isso é o GET funcionando).

## Qual método faz o quê
| Ação        | Método HTTP | Rota              |
|-------------|-------------|-------------------|
| Listar      | GET         | /contatos         |
| Criar       | POST        | /contatos         |
| Atualizar   | PUT         | /contatos/:id     |
| Excluir     | DELETE      | /contatos/:id     |

## Observações
- Os dados ficam na **memória do servidor**: se você parar o `node server.js`, a lista volta ao estado inicial. Para persistir de verdade, o próximo passo seria conectar um banco de dados (ex: SQLite ou MongoDB).
- Se a tela mostrar "Não consegui falar com o backend", quase sempre é porque o `node server.js` não está rodando.
