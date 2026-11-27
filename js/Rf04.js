/* ============================================================
   RF04 – Validação e bloqueio de CPF ou CNPJ duplicado
   Módulo: Cadastro de Pessoas (Cliente, Funcionario, Fornecedor)
   Regras: RN01, RNF02, RNF06
   ============================================================ */

const CHAVE_STORAGE = 'rf04_pessoas_db';
const MSG_DUPLICADO = 'O CPF/CNPJ informado já está cadastrado no sistema.';

/* Configuração das tabelas/entidades conforme especificação RF04 */
const ENTIDADES = {
  cliente: {
    titulo: 'Cliente',
    legenda: 'Dados do Cliente',
    campoId: 'id_cliente',
    campoNome: 'nome',
    labelNome: 'Nome',
    campoDoc: 'cpf',
    tipoDoc: 'CPF',
    maxLength: 14,
    placeholder: '000.000.000-00'
  },
  funcionario: {
    titulo: 'Funcionário',
    legenda: 'Dados do Funcionário',
    campoId: 'id_funcionario',
    campoNome: 'nome',
    labelNome: 'Nome',
    campoDoc: 'cpf',
    tipoDoc: 'CPF',
    maxLength: 14,
    placeholder: '000.000.000-00'
  },
  fornecedor: {
    titulo: 'Fornecedor',
    legenda: 'Dados do Fornecedor',
    campoId: 'id_fornecedor',
    campoNome: 'razao_social',
    labelNome: 'Razão Social',
    campoDoc: 'cnpj',
    tipoDoc: 'CNPJ',
    maxLength: 18,
    placeholder: '00.000.000/0000-00'
  }
};

let entidadeAtual = 'cliente';

/* ---------- Utilitários e Sanitização ---------- */
const $ = (id) => document.getElementById(id);

/* Sanitiza caracteres não numéricos (pontos, traços e barras) */
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

function mascaraCnpj(v) {
  const d = apenasDigitos(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatarDocumento(valor, tipoDoc) {
  return tipoDoc === 'CNPJ' ? mascaraCnpj(valor) : mascaraCpf(valor);
}

/* Validação matemática de CPF */
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

/* Validação matemática de CNPJ */
function cnpjValido(valor) {
  const cnpj = apenasDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calcularDigito = (base, pesos) => {
    const soma = base
      .split('')
      .reduce((acc, num, idx) => acc + Number(num) * pesos[idx], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcularDigito(cnpj.slice(0, 12), pesos1);
  const d2 = calcularDigito(cnpj.slice(0, 12) + d1, pesos2);

  return Number(cnpj[12]) === d1 && Number(cnpj[13]) === d2;
}

/* ---------- Repositório com Restrição UNIQUE (RNF06) ---------- */
const Repositorio = {
  _db: {
    cliente: [],
    funcionario: [],
    fornecedor: []
  },

  carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE_STORAGE);
      this._db = salvo ? JSON.parse(salvo) : this._semente();
    } catch (e) {
      this._db = this._semente();
    }
    this._persistir();
  },

  _persistir() {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(this._db));
    } catch (e) {
      /* storage indisponível */
    }
  },

  _semente() {
    return {
      cliente: [
        { id_cliente: 1, nome: 'Marina Albuquerque', cpf: '52998224725', ativo: true },
        { id_cliente: 2, nome: 'Rafael Tavares', cpf: '11144477735', ativo: true },
        { id_cliente: 3, nome: 'Helena Prado', cpf: '16899535009', ativo: false }
      ],
      funcionario: [
        { id_funcionario: 1, nome: 'Carlos Eduardo Mendes', cpf: '39053344705', ativo: true },
        { id_funcionario: 2, nome: 'Fernanda Costa', cpf: '71428793860', ativo: true }
      ],
      fornecedor: [
        { id_fornecedor: 1, razao_social: 'Distribuidora Horizonte Ltda', cnpj: '11222333000181', ativo: true },
        { id_fornecedor: 2, razao_social: 'TechBrasil Suprimentos S.A.', cnpj: '45997418000153', ativo: true }
      ]
    };
  },

  listar(entidade) {
    return [...(this._db[entidade] || [])];
  },

  buscarPorId(entidade, id) {
    const cfg = ENTIDADES[entidade];
    return this.listar(entidade).find((item) => item[cfg.campoId] === id);
  },

  /* Simula SELECT COUNT(*) FROM tabela WHERE doc = :doc AND id <> :ignorarId */
  contarPorDocumento(entidade, documentoSanitizado, ignorarId = null) {
    const cfg = ENTIDADES[entidade];
    return this.listar(entidade).filter(
      (item) =>
        item[cfg.campoDoc] === documentoSanitizado &&
        item[cfg.campoId] !== ignorarId
    ).length;
  },

  /* Valida restrição UNIQUE KEY antes de persistir (RNF06) */
  _garantirUnicidade(entidade, documentoSanitizado, ignorarId = null) {
    if (this.contarPorDocumento(entidade, documentoSanitizado, ignorarId) > 0) {
      const err = new Error(MSG_DUPLICADO);
      err.code = 'UNIQUE_CONSTRAINT_VIOLATION';
      throw err;
    }
  },

  inserir(entidade, dados) {
    const cfg = ENTIDADES[entidade];
    const doc = apenasDigitos(dados[cfg.campoDoc]);

    this._garantirUnicidade(entidade, doc, null);

    const lista = this._db[entidade];
    const novoId = lista.reduce((max, item) => Math.max(max, item[cfg.campoId]), 0) + 1;

    lista.push({
      [cfg.campoId]: novoId,
      [cfg.campoNome]: dados[cfg.campoNome],
      [cfg.campoDoc]: doc,
      ativo: Boolean(dados.ativo)
    });
    this._persistir();
  },

  atualizar(entidade, id, dados) {
    const cfg = ENTIDADES[entidade];
    const doc = apenasDigitos(dados[cfg.campoDoc]);

    this._garantirUnicidade(entidade, doc, id);

    const lista = this._db[entidade];
    const idx = lista.findIndex((item) => item[cfg.campoId] === id);
    if (idx >= 0) {
      lista[idx] = {
        ...lista[idx],
        [cfg.campoNome]: dados[cfg.campoNome],
        [cfg.campoDoc]: doc,
        ativo: Boolean(dados.ativo)
      };
      this._persistir();
    }
  },

  alternarStatus(entidade, id) {
    const item = this.buscarPorId(entidade, id);
    if (item) {
      item.ativo = !item.ativo;
      this._persistir();
    }
  }
};

/* ---------- Atualização da Interface por Entidade ---------- */
function selecionarEntidade(entidade) {
  entidadeAtual = entidade;
  const cfg = ENTIDADES[entidade];

  document.querySelectorAll('.aba').forEach((btn) => {
    btn.classList.toggle('ativa', btn.dataset.entidade === entidade);
  });

  $('labelFiltroNome').textContent = cfg.labelNome;
  $('filtroNome').placeholder = `Buscar por ${cfg.labelNome.toLowerCase()}...`;
  $('filtroNome').value = '';

  $('labelFiltroDocumento').textContent = cfg.tipoDoc;
  $('filtroDocumento').placeholder = cfg.placeholder;
  $('filtroDocumento').maxLength = cfg.maxLength;
  $('filtroDocumento').value = '';

  $('colNome').textContent = cfg.labelNome;
  $('colDocumento').textContent = `${cfg.tipoDoc} (UNIQUE)`;
  $('btnNovo').textContent = `+ Novo ${cfg.titulo}`;

  renderizarTabela();
}

function filtrarRegistros() {
  const cfg = ENTIDADES[entidadeAtual];
  const termoNome = $('filtroNome').value.trim().toLowerCase();
  const termoDoc = apenasDigitos($('filtroDocumento').value);
  const status = $('filtroStatus').value;

  return Repositorio.listar(entidadeAtual)
    .filter((item) => !termoNome || item[cfg.campoNome].toLowerCase().includes(termoNome))
    .filter((item) => !termoDoc || item[cfg.campoDoc].includes(termoDoc))
    .filter((item) => status === 'todos' || (status === 'ativo') === item.ativo)
    .sort((a, b) => a[cfg.campoNome].localeCompare(b[cfg.campoNome], 'pt-BR'));
}

function renderizarTabela() {
  const cfg = ENTIDADES[entidadeAtual];
  const lista = filtrarRegistros();

  $('corpoTabela').innerHTML = lista.map((item) => {
    const id = item[cfg.campoId];
    const nome = item[cfg.campoNome];
    const docFormatado = formatarDocumento(item[cfg.campoDoc], cfg.tipoDoc);

    return `
      <tr class="${item.ativo ? '' : 'inativo'}">
        <td>${id}</td>
        <td>${escapeHtml(nome)}</td>
        <td>${docFormatado}</td>
        <td><span class="status ${item.ativo ? 'ativo' : 'inativo'}">${item.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td class="col-acoes">
          <button type="button" class="btn btn-pequeno" data-acao="editar" data-id="${id}">Editar</button>
          <button type="button" class="btn btn-pequeno ${item.ativo ? 'btn-texto-perigo' : ''}" data-acao="status" data-id="${id}">
            ${item.ativo ? 'Inativar' : 'Ativar'}
          </button>
        </td>
      </tr>
    `;
  }).join('');

  $('vazio').hidden = lista.length > 0;
  $('resumo').textContent = `${lista.length} ${cfg.titulo.toLowerCase()}${lista.length === 1 ? '' : '(s)'} encontrado${lista.length === 1 ? '' : 's'}`;
}

/* ---------- Validação em Tempo Real e no Blur (RF04 / RNF02) ---------- */
function limparEstadoDocumento() {
  const inputDoc = $('documento');
  inputDoc.classList.remove('invalido', 'valido');
  document.querySelector('[data-erro="documento"]').textContent = '';
  $('statusVerificacao').textContent = '';
  $('alertaForm').hidden = true;
  $('btnSalvar').disabled = false;
}

function verificarUnicidadeDocumento({ exibirErroFormato = false } = {}) {
  const entidade = $('registroEntidade').value;
  const cfg = ENTIDADES[entidade];
  const idAtual = $('registroId').value ? Number($('registroId').value) : null;
  const inputDoc = $('documento');
  const erroDoc = document.querySelector('[data-erro="documento"]');
  const statusVerif = $('statusVerificacao');
  const docSanitizado = apenasDigitos(inputDoc.value);

  limparEstadoDocumento();

  if (!docSanitizado) {
    if (exibirErroFormato) {
      inputDoc.classList.add('invalido');
      erroDoc.textContent = `Informe o ${cfg.tipoDoc}.`;
      return false;
    }
    return true;
  }

  const tamanhoEsperado = cfg.tipoDoc === 'CNPJ' ? 14 : 11;

  // Só valida dígitos/unicidade quando completar o documento ou ao sair do campo (blur) / salvar
  if (docSanitizado.length < tamanhoEsperado && !exibirErroFormato) {
    return true;
  }

  const formatoOk = cfg.tipoDoc === 'CNPJ' ? cnpjValido(docSanitizado) : cpfValido(docSanitizado);
  if (!formatoOk) {
    inputDoc.classList.add('invalido');
    erroDoc.textContent = `${cfg.tipoDoc} inválido. Confira os números digitados.`;
    return false;
  }

  // Consulta SELECT COUNT(*) ignorando o próprio ID em edição
  const duplicado = Repositorio.contarPorDocumento(entidade, docSanitizado, idAtual) > 0;

  if (duplicado) {
    inputDoc.classList.add('invalido');
    erroDoc.textContent = MSG_DUPLICADO;
    $('alertaForm').textContent = MSG_DUPLICADO;
    $('alertaForm').hidden = false;
    $('btnSalvar').disabled = true; // Bloqueia o botão Salvar conforme especificação
    return false;
  }

  inputDoc.classList.add('valido');
  statusVerif.textContent = `${cfg.tipoDoc} disponível para cadastro.`;
  $('btnSalvar').disabled = false;
  return true;
}

/* ---------- Formulário Modal ---------- */
function abrirFormulario(registro = null) {
  const cfg = ENTIDADES[entidadeAtual];

  $('formPessoa').reset();
  limparEstadoDocumento();
  document.querySelector('[data-erro="nome"]').textContent = '';
  $('nome').classList.remove('invalido');

  $('registroEntidade').value = entidadeAtual;
  $('registroId').value = registro ? registro[cfg.campoId] : '';
  $('tituloForm').textContent = registro ? `Editar ${cfg.titulo}` : `Novo ${cfg.titulo}`;
  $('legendaEntidade').textContent = cfg.legenda;
  $('labelNome').textContent = `${cfg.labelNome} *`;
  $('labelDocumento').textContent = `${cfg.tipoDoc} *`;
  $('documento').maxLength = cfg.maxLength;
  $('documento').placeholder = cfg.placeholder;

  if (registro) {
    $('nome').value = registro[cfg.campoNome];
    $('documento').value = formatarDocumento(registro[cfg.campoDoc], cfg.tipoDoc);
    $('ativo').value = String(registro.ativo);
  } else {
    $('ativo').value = 'true';
  }

  $('dlgForm').showModal();
  $('nome').focus();
}

function salvarRegistro(evento) {
  evento.preventDefault();

  const entidade = $('registroEntidade').value;
  const cfg = ENTIDADES[entidade];
  const idAtual = $('registroId').value ? Number($('registroId').value) : null;
  const nome = $('nome').value.trim();
  const docSanitizado = apenasDigitos($('documento').value);
  const ativo = $('ativo').value === 'true';

  let nomeOk = true;
  if (!nome) {
    $('nome').classList.add('invalido');
    document.querySelector('[data-erro="nome"]').textContent = `Informe o campo ${cfg.labelNome}.`;
    nomeOk = false;
  } else {
    $('nome').classList.remove('invalido');
    document.querySelector('[data-erro="nome"]').textContent = '';
  }

  const docOk = verificarUnicidadeDocumento({ exibirErroFormato: true });

  if (!nomeOk || !docOk) {
    const primeiroInvalido = document.querySelector('#formPessoa .invalido');
    if (primeiroInvalido) primeiroInvalido.focus();
    return;
  }

  const payload = {
    [cfg.campoNome]: nome,
    [cfg.campoDoc]: docSanitizado,
    ativo
  };

  /* Tratamento de exceção de UNIQUE constraint violation (RNF06) */
  try {
    if (idAtual) {
      Repositorio.atualizar(entidade, idAtual, payload);
      avisar(`${cfg.titulo} atualizado com sucesso.`);
    } else {
      Repositorio.inserir(entidade, payload);
      avisar(`${cfg.titulo} cadastrado com sucesso.`);
    }
    $('dlgForm').close();
    renderizarTabela();
  } catch (erro) {
    if (erro.code === 'UNIQUE_CONSTRAINT_VIOLATION') {
      $('documento').classList.add('invalido');
      document.querySelector('[data-erro="documento"]').textContent = MSG_DUPLICADO;
      $('alertaForm').textContent = MSG_DUPLICADO;
      $('alertaForm').hidden = false;
      $('btnSalvar').disabled = true;
    } else {
      $('alertaForm').textContent = 'Erro inesperado ao salvar o registro.';
      $('alertaForm').hidden = false;
    }
  }
}

/* ---------- Feedback Toast ---------- */
let timerToast;
function avisar(mensagem) {
  const t = $('toast');
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

  /* Troca de abas (Cliente / Funcionário / Fornecedor) */
  document.querySelectorAll('.aba').forEach((btn) => {
    btn.addEventListener('click', () => selecionarEntidade(btn.dataset.entidade));
  });

  /* Filtros */
  $('filtroNome').addEventListener('input', renderizarTabela);
  $('filtroDocumento').addEventListener('input', (e) => {
    const cfg = ENTIDADES[entidadeAtual];
    e.target.value = formatarDocumento(e.target.value, cfg.tipoDoc);
    renderizarTabela();
  });
  $('filtroStatus').addEventListener('change', renderizarTabela);

  /* Máscara e validação em tempo real + blur no campo CPF/CNPJ */
  $('documento').addEventListener('input', (e) => {
    const entidade = $('registroEntidade').value;
    const cfg = ENTIDADES[entidade];
    e.target.value = formatarDocumento(e.target.value, cfg.tipoDoc);
    verificarUnicidadeDocumento({ exibirErroFormato: false });
  });

  $('documento').addEventListener('blur', () => {
    verificarUnicidadeDocumento({ exibirErroFormato: true });
  });

  /* Botões e formulário */
  $('btnNovo').addEventListener('click', () => abrirFormulario());
  $('btnCancelar').addEventListener('click', () => $('dlgForm').close());
  $('formPessoa').addEventListener('submit', salvarRegistro);

  $('corpoTabela').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-acao]');
    if (!btn) return;
    const id = Number(btn.dataset.id);

    if (btn.dataset.acao === 'editar') {
      abrirFormulario(Repositorio.buscarPorId(entidadeAtual, id));
    } else if (btn.dataset.acao === 'status') {
      Repositorio.alternarStatus(entidadeAtual, id);
      avisar('Status atualizado com sucesso.');
      renderizarTabela();
    }
  });

  selecionarEntidade('cliente');
}

document.addEventListener('DOMContentLoaded', inicializar);