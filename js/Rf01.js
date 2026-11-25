/* ============================================================
   RF01 – Gestão de Clientes
   Persistência simulada em localStorage (substitui a tabela
   Cliente). Em produção, trocar o objeto Repositorio por
   chamadas à API/banco de dados.
   ============================================================ */

const CHAVE_STORAGE = 'rf01_clientes';
const MSG_CPF_DUPLICADO = 'Já existe um cliente cadastrado com o CPF informado.';
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

/* ---------- Utilitários ---------- */
const $ = (id) => document.getElementById(id);
const apenasDigitos = (v) => String(v || '').replace(/\D/g, '');

function escapeHtml(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function mascaraCpf(v) {
  const d = apenasDigitos(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function mascaraTelefone(v) {
  const d = apenasDigitos(v).slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return d.replace(/(\d{2})(\d+)/, '($1) $2');
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
  return d.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
}

function mascaraCep(v) {
  const d = apenasDigitos(v).slice(0, 8);
  return d.replace(/(\d{5})(\d)/, '$1-$2');
}

/* Validação de CPF (dígitos verificadores) – RN01 */
function cpfValido(valor) {
  const cpf = apenasDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(cpf[i]) * (t + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(cpf[t])) return false;
  }
  return true;
}

/* ---------- Repositório (simula a tabela Cliente) ---------- */
const Repositorio = {
  _dados: [],

  carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE_STORAGE);
      this._dados = salvo ? JSON.parse(salvo) : this._semente();
    } catch (e) {
      this._dados = this._semente();
    }
    this._persistir();
  },

  _persistir() {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(this._dados));
    } catch (e) {
      /* storage indisponível */
    }
  },

  _semente() {
    const base = { sexo: '', complemento: '', bairro: '', uf: 'DF', cep: '' };
    const agora = new Date().toISOString();
    return [
      {
        ...base,
        id_cliente: 1,
        nome: 'Marina Albuquerque',
        cpf: '52998224725',
        data_nascimento: '1988-04-12',
        sexo: 'F',
        email: 'marina@exemplo.com',
        telefone: '61991234567',
        logradouro: 'SQN 305 Bloco B',
        numero: '204',
        bairro: 'Asa Norte',
        cidade: 'Brasília',
        cep: '70737020',
        data_cadastro: agora,
        ativo: true
      },
      {
        ...base,
        id_cliente: 2,
        nome: 'Rafael Tavares',
        cpf: '11144477735',
        data_nascimento: '1979-11-03',
        sexo: 'M',
        email: 'rafael.t@exemplo.com',
        telefone: '61988776655',
        logradouro: 'Quadra 12 Conjunto 4',
        numero: '18',
        bairro: 'Taguatinga Sul',
        cidade: 'Brasília',
        cep: '72015120',
        data_cadastro: agora,
        ativo: true
      },
      {
        ...base,
        id_cliente: 3,
        nome: 'Helena Prado',
        cpf: '16899535009',
        data_nascimento: '1995-07-21',
        sexo: 'F',
        email: '',
        telefone: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: 'Goiânia',
        uf: 'GO',
        cep: '',
        data_cadastro: agora,
        ativo: false
      }
    ];
  },

  listar() {
    return [...this._dados];
  },

  buscarPorId(id) {
    return this._dados.find((c) => c.id_cliente === id);
  },

  /* RN01 / RNF06: unicidade de CPF */
  cpfExiste(cpf, ignorarId = null) {
    return this._dados.some((c) => c.cpf === cpf && c.id_cliente !== ignorarId);
  },

  /* INSERT: ativo = TRUE e data_cadastro = CURRENT_TIMESTAMP */
  inserir(dados) {
    const id = this._dados.reduce((max, c) => Math.max(max, c.id_cliente), 0) + 1;
    this._dados.push({
      ...dados,
      id_cliente: id,
      ativo: true,
      data_cadastro: new Date().toISOString()
    });
    this._persistir();
  },

  /* UPDATE: mantém id, data_cadastro e status */
  atualizar(id, dados) {
    const i = this._dados.findIndex((c) => c.id_cliente === id);
    if (i >= 0) {
      this._dados[i] = { ...this._dados[i], ...dados };
      this._persistir();
    }
  },

  /* UPDATE LÓGICO (RN07): UPDATE Cliente SET ativo = FALSE WHERE id_cliente = :id */
  inativar(id) {
    const c = this.buscarPorId(id);
    if (c) {
      c.ativo = false;
      this._persistir();
    }
  }
  /* Não existe método de DELETE físico por regra RN07. */
};

/* ---------- Listagem e consulta ---------- */
function filtrarClientes() {
  const nome = $('filtroNome').value.trim().toLowerCase();
  const cpf = apenasDigitos($('filtroCpf').value);
  const status = $('filtroStatus').value;

  return Repositorio.listar()
    .filter((c) => !nome || c.nome.toLowerCase().includes(nome))
    .filter((c) => !cpf || c.cpf.includes(cpf))
    .filter((c) => status === 'todos' || (status === 'ativo') === c.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function renderizarTabela() {
  const lista = filtrarClientes();
  $('corpoTabela').innerHTML = lista.map((c) => {
    const cidadeUf = c.cidade ? `${escapeHtml(c.cidade)}/${escapeHtml(c.uf)}` : '—';
    const btnInativar = c.ativo
      ? `<button type="button" class="btn btn-pequeno btn-texto-perigo" data-acao="inativar" data-id="${c.id_cliente}">Inativar</button>`
      : '';

    return `
      <tr class="${c.ativo ? '' : 'inativo'}">
        <td>${escapeHtml(c.nome)}</td>
        <td>${mascaraCpf(c.cpf)}</td>
        <td>${escapeHtml(c.email) || '—'}</td>
        <td>${mascaraTelefone(c.telefone) || '—'}</td>
        <td>${cidadeUf}</td>
        <td><span class="status ${c.ativo ? 'ativo' : 'inativo'}">${c.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td class="col-acoes">
          <button type="button" class="btn btn-pequeno" data-acao="editar" data-id="${c.id_cliente}">Editar</button>
          ${btnInativar}
        </td>
      </tr>
    `;
  }).join('');

  $('vazio').hidden = lista.length > 0;
  $('resumo').textContent = `${lista.length} cliente${lista.length === 1 ? '' : 's'} encontrado${lista.length === 1 ? '' : 's'}`;
}

/* ---------- Formulário de cadastro e edição ---------- */
function limparErros() {
  document.querySelectorAll('[data-erro]').forEach((el) => {
    el.textContent = '';
  });
  document.querySelectorAll('.invalido').forEach((el) => {
    el.classList.remove('invalido');
  });
  $('alertaForm').hidden = true;
}

function mostrarErro(campo, mensagem) {
  const alvo = document.querySelector(`[data-erro="${campo}"]`);
  if (alvo) alvo.textContent = mensagem;
  const input = $(campo);
  if (input) input.classList.add('invalido');
}

function abrirFormulario(cliente = null) {
  limparErros();
  $('formCliente').reset();
  $('idCliente').value = cliente ? cliente.id_cliente : '';
  $('tituloForm').textContent = cliente ? 'Editar cliente' : 'Novo cliente';

  if (cliente) {
    $('nome').value = cliente.nome;
    $('cpf').value = mascaraCpf(cliente.cpf);
    $('dataNascimento').value = cliente.data_nascimento || '';
    $('sexo').value = cliente.sexo || '';
    $('email').value = cliente.email || '';
    $('telefone').value = mascaraTelefone(cliente.telefone);
    $('cep').value = mascaraCep(cliente.cep);
    ['logradouro', 'numero', 'complemento', 'bairro', 'cidade'].forEach((k) => {
      $(k).value = cliente[k] || '';
    });
    $('uf').value = cliente.uf || '';
  }

  $('dlgForm').showModal();
  $('nome').focus();
}

function lerFormulario() {
  return {
    nome: $('nome').value.trim(),
    cpf: apenasDigitos($('cpf').value),
    data_nascimento: $('dataNascimento').value,
    sexo: $('sexo').value,
    email: $('email').value.trim(),
    telefone: apenasDigitos($('telefone').value),
    cep: apenasDigitos($('cep').value),
    logradouro: $('logradouro').value.trim(),
    numero: $('numero').value.trim(),
    complemento: $('complemento').value.trim(),
    bairro: $('bairro').value.trim(),
    cidade: $('cidade').value.trim(),
    uf: $('uf').value
  };
}

/* Validações de interface + regras de negócio */
function validar(dados, idAtual) {
  let ok = true;
  const erro = (campo, msg) => {
    mostrarErro(campo, msg);
    ok = false;
  };

  if (!dados.nome) erro('nome', 'Informe o nome do cliente.');

  if (!dados.cpf) {
    erro('cpf', 'Informe o CPF.');
  } else if (!cpfValido(dados.cpf)) {
    erro('cpf', 'CPF inválido. Confira os números digitados.');
  } else if (Repositorio.cpfExiste(dados.cpf, idAtual)) {
    erro('cpf', MSG_CPF_DUPLICADO);
    $('alertaForm').textContent = MSG_CPF_DUPLICADO;
    $('alertaForm').hidden = false;
  }

  if (dados.data_nascimento && new Date(dados.data_nascimento) > new Date()) {
    erro('dataNascimento', 'A data de nascimento não pode ser futura.');
  }
  if (dados.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
    erro('email', 'Informe um e-mail válido.');
  }
  if (dados.telefone && ![10, 11].includes(dados.telefone.length)) {
    erro('telefone', 'Informe o telefone com DDD.');
  }
  if (dados.cep && dados.cep.length !== 8) {
    erro('cep', 'O CEP deve ter 8 dígitos.');
  }

  return ok;
}

function salvarCliente(evento) {
  evento.preventDefault();
  limparErros();

  const idAtual = $('idCliente').value ? Number($('idCliente').value) : null;
  const dados = lerFormulario();

  if (!validar(dados, idAtual)) {
    const primeiro = document.querySelector('.invalido');
    if (primeiro) primeiro.focus();
    return;
  }

  if (idAtual) {
    Repositorio.atualizar(idAtual, dados);
    avisar('Cliente atualizado com sucesso.');
  } else {
    Repositorio.inserir(dados);
    avisar('Cliente cadastrado com sucesso.');
  }

  $('dlgForm').close();
  renderizarTabela();
}

/* ---------- Inativação lógica ---------- */
let idParaInativar = null;

function pedirInativacao(id) {
  const c = Repositorio.buscarPorId(id);
  if (!c) return;
  idParaInativar = id;
  $('textoInativar').textContent = `${c.nome} não poderá ser selecionado em novas vendas. O histórico de compras será preservado.`;
  $('dlgInativar').showModal();
}

function confirmarInativacao() {
  if (idParaInativar !== null) {
    Repositorio.inativar(idParaInativar);
    idParaInativar = null;
    avisar('Cliente inativado com sucesso.');
    renderizarTabela();
  }
  $('dlgInativar').close();
}

/* ---------- Feedback ---------- */
let timerToast;
function avisar(mensagem) {
  const t = $('toast');
  if (!t) return;
  t.textContent = mensagem;
  t.hidden = false;
  clearTimeout(timerToast);
  timerToast = setTimeout(() => {
    t.hidden = true;
  }, 3500);
}

/* ---------- Inicialização ---------- */
function inicializar() {
  Repositorio.carregar();

  $('uf').innerHTML = '<option value="">—</option>' + UFS.map((u) => `<option value="${u}">${u}</option>`).join('');

  /* Máscaras */
  $('cpf').addEventListener('input', (e) => {
    e.target.value = mascaraCpf(e.target.value);
  });
  $('filtroCpf').addEventListener('input', (e) => {
    e.target.value = mascaraCpf(e.target.value);
    renderizarTabela();
  });
  $('telefone').addEventListener('input', (e) => {
    e.target.value = mascaraTelefone(e.target.value);
  });
  $('cep').addEventListener('input', (e) => {
    e.target.value = mascaraCep(e.target.value);
  });

  /* Filtros */
  $('filtroNome').addEventListener('input', renderizarTabela);
  $('filtroStatus').addEventListener('change', renderizarTabela);

  /* Ações */
  $('btnNovo').addEventListener('click', () => abrirFormulario());
  $('btnCancelar').addEventListener('click', () => $('dlgForm').close());
  $('formCliente').addEventListener('submit', salvarCliente);
  $('btnNaoInativar').addEventListener('click', () => $('dlgInativar').close());
  $('btnConfirmaInativar').addEventListener('click', confirmarInativacao);

  $('corpoTabela').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-acao]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.acao === 'editar') abrirFormulario(Repositorio.buscarPorId(id));
    if (btn.dataset.acao === 'inativar') pedirInativacao(id);
  });

  renderizarTabela();
}

document.addEventListener('DOMContentLoaded', inicializar);