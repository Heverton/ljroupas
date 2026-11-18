/* ====================== LÓGICA (JavaScript) ====================== */

    // Aqui ficam os dados. É só um array na memória.
    // (Quando você recarrega a página, ele volta a zero. No final tem uma dica pra salvar de verdade.)
    let contatos = [];

    // Controla se estamos EDITANDO. Guarda o id do contato em edição, ou null se for um novo.
    let idEmEdicao = null;

    // Gera um id único simples pra cada contato.
    let proximoId = 1;

    // Pega os elementos da tela uma vez só, pra reutilizar.
    const inputNome = document.getElementById("nome");
    const inputEmail = document.getElementById("email");
    const inputTelefone = document.getElementById("telefone");
    const corpoTabela = document.getElementById("corpoTabela");
    const mensagemVazia = document.getElementById("mensagemVazia");
    const btnSalvar = document.getElementById("btnSalvar");
    const btnCancelar = document.getElementById("btnCancelar");

    // ---------- CREATE / UPDATE (o mesmo botão faz os dois) ----------
    function salvar() {
      const nome = inputNome.value.trim();
      const email = inputEmail.value.trim();
      const telefone = inputTelefone.value.trim();

      // Validação simples: nome é obrigatório.
      if (nome === "") {
        alert("Por favor, preencha o nome.");
        return;
      }

      if (idEmEdicao === null) {
        // CREATE: adiciona um contato novo ao array.
        contatos.push({ id: proximoId, nome, email, telefone });
        proximoId++;
      } else {
        // UPDATE: encontra o contato pelo id e atualiza os campos.
        const contato = contatos.find(c => c.id === idEmEdicao);
        contato.nome = nome;
        contato.email = email;
        contato.telefone = telefone;
        cancelarEdicao(); // volta o botão pro modo "Adicionar"
      }

      limparFormulario();
      renderizar();
    }

    // ---------- READ (desenha a lista na tela) ----------
    function renderizar() {
      corpoTabela.innerHTML = ""; // limpa a tabela antes de redesenhar

      // Mostra ou esconde a mensagem de "lista vazia".
      mensagemVazia.style.display = contatos.length === 0 ? "block" : "none";

      // Para cada contato, cria uma linha da tabela.
      contatos.forEach(contato => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
          <td>${contato.nome}</td>
          <td>${contato.email || "—"}</td>
          <td>${contato.telefone || "—"}</td>
          <td>
            <div class="acoes">
              <button class="btn-mini btn-editar" onclick="editar(${contato.id})">Editar</button>
              <button class="btn-mini btn-excluir" onclick="excluir(${contato.id})">Excluir</button>
            </div>
          </td>
        `;
        corpoTabela.appendChild(linha);
      });
    }

    // ---------- Preparar UPDATE (joga os dados de volta no formulário) ----------
    function editar(id) {
      const contato = contatos.find(c => c.id === id);
      inputNome.value = contato.nome;
      inputEmail.value = contato.email;
      inputTelefone.value = contato.telefone;

      idEmEdicao = id;
      btnSalvar.textContent = "Salvar alterações";
      btnCancelar.style.display = "inline-block";
      inputNome.focus();
    }

    function cancelarEdicao() {
      idEmEdicao = null;
      btnSalvar.textContent = "Adicionar";
      btnCancelar.style.display = "none";
      limparFormulario();
    }

    // ---------- DELETE ----------
    function excluir(id) {
      if (!confirm("Tem certeza que deseja excluir este contato?")) return;
      // Mantém no array todos, MENOS o que tem esse id.
      contatos = contatos.filter(c => c.id !== id);
      renderizar();
    }

    // ---------- Auxiliar ----------
    function limparFormulario() {
      inputNome.value = "";
      inputEmail.value = "";
      inputTelefone.value = "";
    }

    // Desenha a tela pela primeira vez (começa vazia).
    renderizar();