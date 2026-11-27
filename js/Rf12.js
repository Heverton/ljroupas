
const catalog={
 "Tênis Casual":{price:199.90,variant:"Tamanho: 42 | Cor: Preto",emoji:"👟"},
 "Camiseta Básica":{price:49.90,variant:"Tamanho: M | Cor: Branco",emoji:"👕"},
 "Calça Jeans":{price:129.90,variant:"Tamanho: 40 | Cor: Azul",emoji:"👖"},
 "Mochila Urbana":{price:89.90,variant:"Cor: Cinza",emoji:"🎒"},
 "Boné Clássico":{price:39.90,variant:"Cor: Preto",emoji:"🧢"},
 "Meia Esportiva":{price:19.90,variant:"Tamanho: Único | Cor: Branco",emoji:"🧦"}
};
let cart=[];
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const $=id=>document.getElementById(id);
function showToast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),3000)}
function render(){
 const body=$('items');body.innerHTML='';
 cart.forEach((item,i)=>{
  const tr=document.createElement('tr');
  tr.innerHTML=`<td><div class="product"><div class="thumb">${item.emoji}</div><div><strong>${item.name}</strong><small>${item.variant}</small></div></div></td>
  <td><input class="qty" type="number" min="1" step="1" value="${item.qty}" aria-label="Quantidade de ${item.name}" onchange="changeQty(${i},this.value)"></td>
  <td>${money(item.price)}</td><td>${money(item.price*item.qty)}</td><td><button class="delete" aria-label="Remover ${item.name}" onclick="removeItem(${i})">▤</button></td>`;
  body.appendChild(tr);
 });
 const sub=cart.reduce((s,x)=>s+x.price*x.qty,0),disc=Math.max(0,Number($('discount').value)||0),total=Math.max(0,sub-disc);
 $('itemCount').textContent=cart.reduce((s,x)=>s+x.qty,0);$('subtotal').textContent=money(sub);$('discountView').textContent=money(disc);$('total').textContent=money(total);
}
function addProduct(){
 const name=$('productSearch').value.trim(),p=catalog[name];
 if(!p){showToast('Selecione um produto válido da lista.');return}
 const existing=cart.find(x=>x.name===name);
 if(existing)existing.qty++;else cart.push({name,price:p.price,variant:p.variant,emoji:p.emoji,qty:1});
 $('productSearch').value='';render();showToast(name+' adicionado à venda.');
}
function changeQty(i,v){const n=Math.floor(Number(v));if(!Number.isFinite(n)||n<1){cart[i].qty=1}else cart[i].qty=n;render()}
function removeItem(i){const name=cart[i].name;cart.splice(i,1);render();showToast(name+' removido.')}
$('discount').addEventListener('input',render);
function syncPayment(v){$('payment').value=v;$('paymentMirror').value=v;const pix=v==='PIX';$('payTitle').textContent=pix?'Pagamento via PIX':'Pagamento em '+v;$('payStatus').textContent=pix?'Aguarde a confirmação...':'Forma de pagamento selecionada';$('payIcon').textContent=pix?'▦':'▣'}
$('payment').addEventListener('change',e=>syncPayment(e.target.value));$('paymentMirror').addEventListener('change',e=>syncPayment(e.target.value));
function saveSale(){
 if(!$('client').value.trim()){showToast('Selecione um cliente para continuar.');$('client').focus();return}
 if(!$('employee').value.trim()){showToast('Selecione um funcionário para continuar.');$('employee').focus();return}
 if(!cart.length){showToast('Adicione pelo menos um item à venda.');$('productSearch').focus();return}
 if($('status').value==='Cancelada'){showToast('Uma venda cancelada não pode ser salva como concluída.');return}
 const sale={numero:$('saleId').value,data:$('saleDate').value,cliente:$('client').value,funcionario:$('employee').value,pagamento:$('payment').value,desconto:Number($('discount').value)||0,itens:cart,total:Math.max(0,cart.reduce((s,x)=>s+x.price*x.qty,0)-(Number($('discount').value)||0))};
 console.log('Venda registrada (demonstração):',sale);showToast('Venda '+sale.numero+' salva com sucesso! (demonstração)');
}
function confirmCancel(){$('modal').classList.add('show')}
function closeModal(){$('modal').classList.remove('show')}
function resetSale(){cart=[];$('client').value='';$('employee').value='';$('discount').value='0';$('status').value='Concluída';$('productSearch').value='';$('saleId').value=String(Number($('saleId').value)+1).padStart(6,'0');closeModal();render();showToast('Formulário limpo.')}
const now=new Date();now.setMinutes(now.getMinutes()-now.getTimezoneOffset());$('saleDate').value=now.toISOString().slice(0,16);
cart=[{name:'Tênis Casual',price:199.90,variant:catalog['Tênis Casual'].variant,emoji:'👟',qty:1},{name:'Camiseta Básica',price:49.90,variant:catalog['Camiseta Básica'].variant,emoji:'👕',qty:2}];
render();syncPayment('PIX');
