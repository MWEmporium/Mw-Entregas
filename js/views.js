'use strict';
/* ====================== entregas do dia (rota) ====================== */
const routeList=d=>S.orders.filter(o=>o.dataEntrega===d&&o.status!=='cancelado').sort(sortOperational);
const pendList=d=>routeList(d).filter(o=>o.status==='pendente'||o.status==='reagendado');
const selList=d=>routeList(d).filter(o=>S.ui.rota.sel[o.id]);
function setLink(a,list,d){
  if(!a)return;
  if(!list.length){a.setAttribute('aria-disabled','true');a.removeAttribute('href')}
  else{a.removeAttribute('aria-disabled');a.setAttribute('href',shareLink(buildRoute(list,d)))}
}
V.rota={html(){
  const d=S.params.date||todayStr();
  return pageHead(esc(titleOf()),esc(weekdayBR(d))+', '+fmtDate(d))+
    '<div class="routebar"><div class="fld"><label for="r-date">Data da entrega</label><input class="in" type="date" id="r-date" value="'+d+'"></div>'+
    '<button class="btn" data-act="goDate" data-d="today">Hoje</button><button class="btn" data-act="goDate" data-d="tomorrow">Amanhã</button></div>'+
    '<div id="r-body"></div>';
},bind(){this.update()},update(){
  const d=S.params.date||todayStr();const list=routeList(d);const st=stats(list);
  const canc=S.orders.filter(o=>o.dataEntrega===d&&o.status==='cancelado').length;
  let h='<div class="tiles">'+tile('Pedidos',list.length,canc?canc+' cancelado(s) fora da lista':'')+tile('Resinas',st.qtd)+tile('A receber',brl(st.aReceber),'ainda não pago','money')+tile('Entregues',st.entr+' de '+list.length)+'</div>';
  h+='<div class="panel" style="margin-bottom:14px"><div class="row">'+
    '<a class="btn primary" id="r-wa-all" target="_blank" rel="noopener">'+ico('send')+'Compartilhar entregas no WhatsApp</a>'+
    '<a class="btn" id="r-wa-pend" target="_blank" rel="noopener">Somente pendentes</a>'+
    '<a class="btn" id="r-wa-sel" target="_blank" rel="noopener">Somente selecionados</a>'+
    '<button class="btn" data-act="rCopy"'+(list.length?'':' disabled')+'>'+ico('copy')+'Copiar lista</button>'+
    '<button class="btn" data-act="rPdf"'+(list.length?'':' disabled')+'>'+ico('down')+'Salvar PDF</button></div>'+
    '<p class="small" style="margin:10px 0 0">O WhatsApp abre com a mensagem pronta. Você escolhe o contato e confirma o envio. Pedidos cancelados não entram na lista. Para imprimir, salve o PDF e imprima pelo celular ou computador.</p>'+
    (list.length?'<details style="margin-top:10px"><summary style="cursor:pointer;font-weight:600">Prévia da mensagem</summary><div class="msgbox" style="margin-top:8px">'+esc(buildRoute(list,d))+'</div></details>':'')+'</div>';
  h+='<div class="sect"><h2>Pedidos da rota</h2><span class="small">Marque os pedidos para compartilhar só alguns</span></div>';
  h+=list.length?'<div class="cards">'+list.map(o=>orderCard(o,{select:true,noDate:true})).join('')+'</div>':empty('Nenhuma entrega nesta data','Cadastre pedidos para este dia ou escolha outra data.','<button class="btn primary" data-act="nav" data-k="novo">'+ico('plus')+'Cadastrar pedido</button>');
  $('#r-body').innerHTML=h;
  setLink($('#r-wa-all'),list,d);setLink($('#r-wa-pend'),pendList(d),d);this.updateShare();
},updateShare(){
  const d=S.params.date||todayStr();const s=selList(d);const a=$('#r-wa-sel');
  if(a){a.textContent='Somente selecionados'+(s.length?' ('+s.length+')':'');setLink(a,s,d)}
}};
H.goDate=(el)=>go('rota',{date:el.dataset.d==='today'?todayStr():addDays(todayStr(),1)});
H.rCopy=()=>{const d=S.params.date||todayStr();copyText(buildRoute(routeList(d),d),'Lista copiada')};
H.rPdf=()=>{
  const d=S.params.date||todayStr();const list=routeList(d);const b=[];let q=0,v=0;
  list.forEach((o,i)=>{q+=o.qtd;const rec=o.pago?0:o.valorCent;v+=rec;
    b.push({text:(i+1)+'. '+o.cliente,bold:true,size:11},{text:'Telefone: '+fmtPhone(o.telefone),indent:5},{text:'Quantidade: '+qtdTxt(o.qtd)+'   |   Valor a receber: '+brl(rec)+(o.pago?' (já pago)':''),indent:5},{text:'Localização: '+o.local,indent:5});
    if(o.obs)b.push({text:'Observações: '+o.obs,indent:5});
    b.push({text:'Status: '+ST[o.status].l,indent:5},{gap:3});});
  b.push({gap:3},{text:'RESUMO DA ROTA',bold:true,size:11},{text:'Total de pedidos: '+list.length},{text:'Total de resinas: '+q},{text:'Total previsto para receber: '+brl(v)});
  savePdf('rota-entregas-'+d+'.pdf','ROTA DE ENTREGAS - '+fmtDate(d),b);
};

/* ====================== detalhes do pedido ====================== */
function kvRow(k,v){return '<dt>'+k+'</dt><dd>'+v+'</dd>'}
V.detalhe={html(){return '<div id="d-body"></div>'},bind(){
  cleanup();S.hist=[];this.update();
  loadHist();
},update(){
  const o=byId(S.params.id);const box=$('#d-body');if(!box)return;
  if(!o){box.innerHTML=pageHead('Pedido não encontrado')+empty('Este pedido não existe mais','Ele pode ter sido excluído.','<button class="btn" data-act="nav" data-k="todos">Voltar para a lista</button>');return}
  const tags=[];
  if(isLate(o))tags.push('<span class="tag bad">Atrasado</span>');
  if(o.demo)tags.push('<span class="tag demo">Demonstração</span>');
  box.innerHTML=pageHead(esc(o.cliente),'Pedido #'+shortId(o.id),'<button class="btn" data-act="nav" data-k="todos">Voltar</button>')+
    '<div class="row" style="margin-bottom:14px">'+pill(o.status)+tags.join('')+'</div>'+
    '<div class="row" style="margin-bottom:16px">'+actionsFor(o).replace(/btn sm/g,'btn')+(S.canEdit?'<button class="btn" data-act="editar" data-id="'+o.id+'">'+ico('edit')+'Editar</button>':'')+'</div>'+
    '<div class="two"><div class="panel"><h2 style="font-size:18px;margin-bottom:12px">Cliente e entrega</h2><dl class="kv" style="margin:0">'+
      kvRow('Telefone','<a class="lnk" href="'+esc(waLink(o.telefone))+'" target="_blank" rel="noopener">'+ico('phone')+'<span class="num">'+esc(fmtPhone(o.telefone))+'</span></a>')+
      kvRow('Localização',locHtml(o)+(isUrl(o.local)?'':''))+
      kvRow('Observações',o.obs?esc(o.obs):'—')+
      kvRow('Pedido feito em',fmtDate(o.dataCadastro))+
      kvRow('Entrega prevista','<b>'+fmtDate(o.dataEntrega)+'</b>')+
      kvRow('Entregue em',o.status==='entregue'?fmtDT(o.entregueEm):'—')+
      (o.motivoNaoEntrega?kvRow('Último motivo de não entrega',esc(o.motivoNaoEntrega)):'')+
    '</dl></div><div class="panel"><h2 style="font-size:18px;margin-bottom:12px">Venda e pagamento</h2><dl class="kv" style="margin:0">'+
      kvRow('Quantidade',qtdTxt(o.qtd))+
      kvRow('Valor total','<b class="num">'+brl(o.valorCent)+'</b>')+
      kvRow('Forma de pagamento',esc(o.formaPgto||'—'))+
      kvRow('Pagamento recebido?',o.status==='cancelado'?'—':o.pago?'<span class="tag ok">Sim</span> em '+fmtDT(o.pagoEm):'<span class="tag warn">Não</span>')+
    '</dl>'+(S.readOnly||o.status==='cancelado'?'':'<div style="margin-top:14px"><button class="btn '+(o.pago?'':'good')+'" data-act="togglePago" data-id="'+o.id+'">'+ico('money')+(o.pago?'Desmarcar pagamento':'Marcar pagamento recebido')+'</button></div>')+'</div></div>'+
    '<div class="sect"><h2>Histórico do pedido</h2></div><div class="panel"><ul class="hist" id="hist"><li>Carregando…</li></ul></div>';
  renderHist();
}};
async function renderHist(){
  const el=$('#hist');if(!el)return;
  el.innerHTML=(S.hist&&S.hist.length)?S.hist.map(h=>{
    const nm=h.usuario_nome?' <span style="color:var(--muted)">· '+esc(h.usuario_nome)+'</span>':'';
    return '<li><time>'+fmtDT(h.em)+'</time><div>'+esc(h.texto)+nm+'</div></li>';
  }).join(''):'<li><span class="small">Sem registros ainda.</span></li>';
}

/* ====================== cadastro e edição ====================== */
function formHtml(o){
  const edit=!!o;const t=todayStr();
  const v=o||{cliente:'',telefone:'',valorCent:0,qtd:1,dataCadastro:t,dataEntrega:addDays(t,1),local:'',obs:'',formaPgto:'Pagamento na entrega',status:'pendente',pago:false};
  const sel=(a,b)=>a===b?' selected':'';
  const fld=(id,label,inner,hint,full)=>'<div class="fld'+(full?' full':'')+'"><label for="'+id+'">'+label+'</label>'+inner+(hint?'<span class="hint">'+hint+'</span>':'')+'<div class="errmsg" id="e-'+id+'"></div></div>';
  return pageHead(edit?'Editar pedido':'Cadastrar pedido',edit?esc(v.cliente)+' · #'+shortId(o.id):'Registre a venda feita pelo WhatsApp.')+
  '<form class="panel" id="frm" autocomplete="off" novalidate><div class="form">'+
    fld('f-cliente','Nome completo do cliente','<input class="in" id="f-cliente" value="'+esc(v.cliente)+'" data-autofocus>')+
    fld('f-tel','Telefone / WhatsApp','<input class="in" id="f-tel" type="tel" inputmode="tel" value="'+esc(v.telefone)+'" placeholder="(61) 99999-9999">','Com DDD. No pedido, o número abre direto no WhatsApp.')+
    fld('f-valor','Valor total da venda (R$)','<input class="in" id="f-valor" inputmode="decimal" value="'+(v.valorCent?moneyInput(v.valorCent):'')+'" placeholder="150,00">')+
    fld('f-qtd','Quantidade de resinas','<input class="in" id="f-qtd" type="number" inputmode="numeric" min="1" step="1" value="'+esc(v.qtd)+'">')+
    fld('f-cad','Data do pedido','<input class="in" id="f-cad" type="date" value="'+esc(v.dataCadastro)+'">')+
    fld('f-ent','Data prevista para entrega','<input class="in" id="f-ent" type="date" value="'+esc(v.dataEntrega)+'">',edit?'':'Sugerida: amanhã. Altere se precisar.')+
    fld('f-local','Endereço ou localização','<textarea class="in" id="f-local" rows="2" placeholder="Endereço completo, bairro, ponto de referência ou link do Google Maps">'+esc(v.local)+'</textarea>','Aceita endereço, bairro, referência, link do Maps ou localização enviada pelo cliente.',true)+
    fld('f-obs','Observações','<textarea class="in" id="f-obs" rows="2" placeholder="Referências, horário preferido, instruções para o entregador">'+esc(v.obs)+'</textarea>','',true)+
    fld('f-pgto','Forma de pagamento','<select class="in" id="f-pgto">'+['Pagamento na entrega','PIX','Dinheiro','Cartão'].map(x=>'<option'+sel(x,v.formaPgto)+'>'+x+'</option>').join('')+'</select>')+
    fld('f-status','Status do pedido','<select class="in" id="f-status">'+Object.keys(ST).map(k=>'<option value="'+k+'"'+sel(k,v.status)+'>'+ST[k].l+'</option>').join('')+'</select>')+
    fld('f-pago','Pagamento recebido?','<select class="in" id="f-pago"><option value="nao"'+sel('nao',v.pago?'sim':'nao')+'>Não</option><option value="sim"'+sel('sim',v.pago?'sim':'nao')+'>Sim</option></select>','Fica separado do status da entrega.')+
  '</div><div class="row" style="margin-top:18px">'+
    (edit?'<button type="button" class="btn primary" data-act="saveOrder" data-more="0">Salvar alterações</button>':'<button type="button" class="btn primary" data-act="saveOrder" data-more="0">Salvar pedido</button><button type="button" class="btn" data-act="saveOrder" data-more="1">Salvar e cadastrar outro</button>')+
    '<button type="button" class="btn" data-act="cancelForm">Cancelar</button></div></form>';
}
function notFoundHtml(){return pageHead('Pedido não encontrado')+empty('Este pedido não existe mais','','<button class="btn" data-act="nav" data-k="todos">Voltar para a lista</button>')}
function bindForm(){
  const f=$('#frm');if(!f)return;
  f.addEventListener('submit',e=>e.preventDefault());
  const first=$('#f-cliente');if(first)first.focus();
}
V.novo={form:true,html(){return formHtml(null)},bind:bindForm};
V.editar={form:true,html(){const o=byId(S.params.id);return o?formHtml(o):notFoundHtml()},bind:bindForm};
function readForm(){
  const g=id=>$('#'+id).value;const errs={};
  const cliente=g('f-cliente').trim();if(cliente.length<2)errs['f-cliente']='Informe o nome completo do cliente.';
  const tel=g('f-tel').trim();if(digits(tel).length<10)errs['f-tel']='Informe o telefone com DDD.';
  const valorCent=parseMoney(g('f-valor'));if(!(valorCent>0))errs['f-valor']='Informe o valor total, por exemplo 150,00.';
  const qs=g('f-qtd').trim();const qtd=/^\d+$/.test(qs)?parseInt(qs,10):NaN;if(!(qtd>=1))errs['f-qtd']='Informe a quantidade em número inteiro, no mínimo 1.';
  const dc=g('f-cad');if(!dc)errs['f-cad']='Informe a data do pedido.';
  const de=g('f-ent');if(!de)errs['f-ent']='Escolha a data de entrega.';else if(dc&&de<dc)errs['f-ent']='A entrega não pode ser antes da data do pedido.';
  const local=g('f-local').trim();if(local.length<3)errs['f-local']='Informe o endereço ou a localização.';
  document.querySelectorAll('#frm .errmsg').forEach(x=>x.textContent='');
  document.querySelectorAll('#frm .in.err').forEach(x=>x.classList.remove('err'));
  const keys=Object.keys(errs);
  if(keys.length){
    keys.forEach(k=>{$('#e-'+k).textContent=errs[k];$('#'+k).classList.add('err')});
    $('#'+keys[0]).focus();toast('Confira os campos destacados',true);return null;
  }
  return {cliente,telefone:tel,valorCent,qtd,dataCadastro:dc,dataEntrega:de,local,obs:g('f-obs').trim(),formaPgto:g('f-pgto'),status:g('f-status'),pago:g('f-pago')==='sim'};
}
H.saveOrder=async(el)=>{
  if(!S.sb){toast('Sem conexão com o banco de dados',true);return}
  const d=readForm();if(!d)return;
  const more=el.dataset.more==='1';const edit=S.view==='editar';
  const btns=document.querySelectorAll('#frm .btn');btns.forEach(b=>b.disabled=true);
  try{
    const now=nowIso();
    if(edit){
      const o=byId(S.params.id);if(!o){toast('Pedido não encontrado',true);return}
      const patch={cliente:d.cliente,telefone:d.telefone,valorCent:d.valorCent,qtd:d.qtd,dataCadastro:d.dataCadastro,dataEntrega:d.dataEntrega,local:d.local,obs:d.obs,formaPgto:d.formaPgto,status:d.status};
      const hist=[['edicao','Dados do pedido editados']];
      if(d.dataEntrega!==o.dataEntrega)hist.push(['reagendamento','Data de entrega alterada de '+fmtDate(o.dataEntrega)+' para '+fmtDate(d.dataEntrega)]);
      if(d.status!==o.status){hist.push(['status','Status alterado: '+ST[o.status].l+' → '+ST[d.status].l]);if(d.status==='entregue'&&!o.entregueEm)patch.entregueEm=now;if(d.status==='cancelado')patch.canceladoEm=now}
      if(d.pago!==!!o.pago){patch.pago=d.pago;patch.pagoEm=d.pago?now:null;hist.push(['pagamento',d.pago?'Pagamento marcado como recebido':'Pagamento desmarcado'])}
      const ok=await patchOrder(o.id,patch,hist,'Alterações salvas');
      if(ok)go('detalhe',{id:o.id});
    }else{
      const data=Object.assign({},d,{pagoEm:d.pago?now:null});
      await createOrder(data);
      toast('Pedido salvo: '+d.cliente);
      if(more){
        ['f-cliente','f-tel','f-valor','f-local','f-obs'].forEach(i=>{$('#'+i).value=''});
        $('#f-qtd').value='1';$('#f-status').value='pendente';$('#f-pago').value='nao';
        document.querySelectorAll('#frm .errmsg').forEach(x=>x.textContent='');
        $('#f-cliente').focus();
      }else go('rota',{date:d.dataEntrega});
    }
  }catch(e){toast('Não foi possível salvar: '+errText(e),true)}
  finally{btns.forEach(b=>{b.disabled=false})}
};
H.cancelForm=()=>{if(S.view==='editar')go('detalhe',{id:S.params.id});else go('dash')};


'use strict';
/* ====================== relatórios ====================== */
const MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
function relRange(){
  const f=S.ui.rel,t=todayStr();
  switch(f.mode){
    case 'hoje':return {l:'Hoje, '+fmtDate(t),de:t,ate:t};
    case 'amanha':{const a=addDays(t,1);return {l:'Amanhã, '+fmtDate(a),de:a,ate:a}}
    case 'data':{const d=f.date||t;return {l:fmtDate(d),de:d,ate:d}}
    case 'semana':{const d=f.date||t;const m=mondayOf(d);const e=addDays(m,6);return {l:'Semana de '+fmtDate(m)+' a '+fmtDate(e),de:m,ate:e}}
    case 'mes':{const ym=f.mes||t.slice(0,7);const r=monthRange(ym);const p=ym.split('-');return {l:MESES[Number(p[1])-1]+' de '+p[0],de:r[0],ate:r[1]}}
    case 'intervalo':{let a=f.de||t,b=f.ate||a;if(b<a){const x=a;a=b;b=x}return {l:fmtDate(a)+' a '+fmtDate(b),de:a,ate:b}}
    default:return {l:'Histórico completo',de:'',ate:''};
  }
}
function relList(){const r=relRange();return S.orders.filter(o=>(!r.de||o.dataEntrega>=r.de)&&(!r.ate||o.dataEntrega<=r.ate)).sort((a,b)=>a.dataEntrega<b.dataEntrega?1:a.dataEntrega>b.dataEntrega?-1:0)}
function groupDays(list){
  const m={};
  for(const o of list){const k=o.dataEntrega;(m[k]=m[k]||[]).push(o)}
  return Object.keys(m).sort().reverse().map(k=>{const s=stats(m[k]);return {d:k,s:s,n:m[k].length}});
}
function groupPaid(list){
  const m={};
  for(const o of list){if(o.pago&&o.status!=='cancelado'&&o.pagoEm){const k=dateOf(o.pagoEm);const x=m[k]=m[k]||{n:0,v:0};x.n++;x.v+=o.valorCent}}
  return Object.keys(m).sort().reverse().map(k=>({d:k,n:m[k].n,v:m[k].v}));
}
V.rel={html(){
  const f=S.ui.rel,t=todayStr();
  const opt=(v,tx)=>'<option value="'+v+'"'+(f.mode===v?' selected':'')+'>'+tx+'</option>';
  let c='<div class="fld"><label for="rl-mode">Período</label><select class="in" id="rl-mode" data-f="rel.mode">'+opt('hoje','Hoje')+opt('amanha','Amanhã')+opt('data','Data específica')+opt('semana','Semana')+opt('mes','Mês')+opt('intervalo','Intervalo de datas')+opt('tudo','Histórico completo')+'</select></div>';
  if(f.mode==='data'||f.mode==='semana')c+='<div class="fld"><label for="rl-date">'+(f.mode==='semana'?'Qualquer dia da semana':'Data')+'</label><input class="in" id="rl-date" type="date" data-f="rel.date" value="'+esc(f.date||t)+'"></div>';
  if(f.mode==='mes')c+='<div class="fld"><label for="rl-mes">Mês</label><input class="in" id="rl-mes" type="month" data-f="rel.mes" value="'+esc(f.mes||t.slice(0,7))+'"></div>';
  if(f.mode==='intervalo')c+='<div class="fld"><label for="rl-de">De</label><input class="in" id="rl-de" type="date" data-f="rel.de" value="'+esc(f.de||t)+'"></div><div class="fld"><label for="rl-ate">Até</label><input class="in" id="rl-ate" type="date" data-f="rel.ate" value="'+esc(f.ate||f.de||t)+'"></div>';
  return pageHead('Relatórios','Faturamento previsto, entregas concluídas e dinheiro recebido ficam separados.')+'<div class="panel" style="margin-bottom:14px"><div class="filters" style="margin:0">'+c+'</div></div><div id="rl-res"></div>';
},bind(){this.update()},update(){
  const r=relRange();const list=relList();const st=stats(list);
  const days=groupDays(list);const paid=groupPaid(list);
  const multi=days.length>1||S.ui.rel.mode==='tudo';
  const aRec=st.prev-st.recebido;
  let h='<div class="sect" style="margin-top:0"><h2>'+esc(r.l)+'</h2><div class="row"><button class="btn sm" data-act="relCsv"'+(list.length?'':' disabled')+'>'+ico('down')+'Exportar CSV</button><button class="btn sm" data-act="relPdf"'+(list.length?'':' disabled')+'>'+ico('down')+'Salvar PDF</button></div></div>';
  h+='<p class="small" style="margin:0 0 8px">Faturamento previsto</p><div class="tiles">'+tile('Pedidos válidos',st.total,'sem cancelados')+tile('Resinas',st.qtd)+tile('Valor dos pedidos válidos',brl(st.prev),'','money')+'</div>';
  h+='<p class="small" style="margin:0 0 8px">Andamento das entregas</p><div class="tiles">'+tile('Entregues',st.entr)+tile('Pendentes',st.pend)+tile('Em rota',st.rota)+tile('Não entregues',st.nao)+tile('Reagendados',st.rea)+tile('Cancelados',st.canc,'fora dos totais')+'</div>';
  h+='<p class="small" style="margin:0 0 8px">Dinheiro</p><div class="tiles">'+tile('Valor das entregas concluídas',brl(st.entrVal),'pedidos entregues','money')+tile('Valor recebido',brl(st.recebido),'pagamento confirmado','money')+tile('Ainda a receber',brl(aRec),'dos pedidos válidos','money')+tile('Entregues sem pagamento',st.entrNaoPagos,st.entrNaoPagos?brl(st.entrNaoPagosVal):'nenhum')+'</div>';
  if(!list.length)h+=empty('Nenhum pedido neste período','Escolha outro período para ver os números.');
  else{
    if(multi)h+='<div class="sect"><h2>Dia a dia (por data de entrega)</h2></div><div class="tablewrap"><table><thead><tr><th>Data</th><th class="r">Pedidos</th><th class="r">Entregues</th><th class="r">Resinas</th><th class="r">Previsto</th><th class="r">Recebido</th></tr></thead><tbody>'+days.map(x=>'<tr><td class="num">'+fmtDate(x.d)+'</td><td class="r num">'+x.s.total+'</td><td class="r num">'+x.s.entr+'</td><td class="r num">'+x.s.qtd+'</td><td class="r num">'+brl(x.s.prev)+'</td><td class="r num">'+brl(x.s.recebido)+'</td></tr>').join('')+'</tbody></table></div>';
    h+='<div class="sect"><h2>Recebimentos por dia</h2><span class="small">pela data em que o pagamento foi confirmado</span></div>';
    h+=paid.length?'<div class="tablewrap"><table style="min-width:420px"><thead><tr><th>Data do recebimento</th><th class="r">Pedidos</th><th class="r">Valor</th></tr></thead><tbody>'+paid.map(x=>'<tr><td class="num">'+fmtDate(x.d)+'</td><td class="r num">'+x.n+'</td><td class="r num">'+brl(x.v)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="panel small">Nenhum pagamento confirmado neste período.</div>';
    const shown=list.slice(0,200);
    h+='<div class="sect"><h2>Pedidos do período</h2><span class="small">cancelados aparecem aqui, mas não entram nos totais</span></div><div class="tablewrap"><table><thead><tr><th>Entrega</th><th>Cliente</th><th class="r">Valor</th><th class="r">Resinas</th><th>Status</th><th>Pago</th></tr></thead><tbody>'+shown.map(o=>'<tr><td class="num">'+fmtDate(o.dataEntrega)+'</td><td><button class="btn sm" data-act="detalhe" data-id="'+o.id+'" style="min-height:32px">'+esc(o.cliente)+'</button></td><td class="r num">'+brl(o.valorCent)+'</td><td class="r num">'+o.qtd+'</td><td>'+pill(o.status)+'</td><td>'+(o.status==='cancelado'?'—':o.pago?'Sim':'Não')+'</td></tr>').join('')+'</tbody></table></div>'+(list.length>200?'<p class="small">Mostrando 200 de '+list.length+'. O CSV traz todos.</p>':'');
  }
  $('#rl-res').innerHTML=h;
}};
function ordersCsvRows(list){
  const rows=[['ID','Cliente','Telefone','Valor (R$)','Resinas','Data do pedido','Data de entrega','Status','Pagamento recebido','Recebido em','Entregue em','Forma de pagamento','Localização','Observações']];
  for(const o of list)rows.push([shortId(o.id),o.cliente,fmtPhone(o.telefone),moneyInput(o.valorCent),o.qtd,fmtDate(o.dataCadastro),fmtDate(o.dataEntrega),ST[o.status].l,o.pago?'Sim':'Não',o.pago?fmtDT(o.pagoEm):'',o.status==='entregue'?fmtDT(o.entregueEm):'',o.formaPgto||'',o.local||'',o.obs||'']);
  return rows;
}
H.relCsv=()=>{const r=relRange();saveFile('relatorio-entregas-'+(r.de||'historico')+(r.ate&&r.ate!==r.de?'_a_'+r.ate:'')+'.csv',csvText(ordersCsvRows(relList())))};
H.relPdf=()=>{
  const r=relRange();const list=relList();const st=stats(list);const days=groupDays(list);const paid=groupPaid(list);
  const b=[{text:r.l,bold:true,size:12},{gap:2},
    {text:'FATURAMENTO PREVISTO',bold:true},{text:'Pedidos válidos: '+st.total+'   |   Resinas: '+st.qtd+'   |   Valor: '+brl(st.prev)},{gap:2},
    {text:'ANDAMENTO',bold:true},{text:'Entregues: '+st.entr+'   Pendentes: '+st.pend+'   Em rota: '+st.rota+'   Não entregues: '+st.nao+'   Reagendados: '+st.rea+'   Cancelados: '+st.canc},{gap:2},
    {text:'DINHEIRO',bold:true},{text:'Entregas concluídas: '+brl(st.entrVal)+'   |   Recebido: '+brl(st.recebido)+'   |   A receber: '+brl(st.prev-st.recebido)},{text:'Entregues sem pagamento: '+st.entrNaoPagos+(st.entrNaoPagos?' ('+brl(st.entrNaoPagosVal)+')':'')},{gap:4}];
  if(days.length>1){b.push({text:'DIA A DIA (data de entrega)',bold:true});days.forEach(x=>b.push({text:fmtDate(x.d)+' - '+x.s.total+' pedidos, '+x.s.entr+' entregues, '+x.s.qtd+' resinas, previsto '+brl(x.s.prev)+', recebido '+brl(x.s.recebido),indent:3}));b.push({gap:3})}
  if(paid.length){b.push({text:'RECEBIMENTOS POR DIA',bold:true});paid.forEach(x=>b.push({text:fmtDate(x.d)+' - '+x.n+' pedidos - '+brl(x.v),indent:3}));b.push({gap:3})}
  b.push({text:'PEDIDOS',bold:true});
  list.forEach(o=>b.push({text:fmtDate(o.dataEntrega)+' | '+o.cliente+' | '+brl(o.valorCent)+' | '+qtdTxt(o.qtd)+' | '+ST[o.status].l+(o.status==='cancelado'?'':o.pago?' | pago':' | não pago'),indent:3,size:9}));
  savePdf('relatorio-entregas-'+(r.de||'historico')+'.pdf','MW ENTREGAS - Relatório',b);
};


/* ====================== configurações ====================== */
V.config={html(){
  const demo=S.orders.filter(o=>o.demo).length;
  return pageHead('Configurações')+
  '<div class="two">'+
  '<div class="panel" style="display:grid;gap:10px"><h2 style="font-size:18px">Dados de demonstração</h2><p class="small" style="margin:0">Cria 10 pedidos fictícios (nomes marcados com “demo”) em ontem, hoje e amanhã para você testar. Eles aparecem com a etiqueta Demonstração e podem ser removidos de uma vez.</p><div class="row"><button class="btn primary" data-act="seedDemo">Carregar demonstração</button><button class="btn danger" data-act="askClearDemo"'+(demo?'':' disabled')+'>Remover demonstração'+(demo?' ('+demo+')':'')+'</button></div></div>'+
  '<div class="panel" style="display:grid;gap:10px"><h2 style="font-size:18px">Backup dos pedidos</h2><p class="small" style="margin:0">Baixe todos os pedidos, inclusive cancelados, em uma planilha CSV que abre no Excel e no Google Planilhas.</p><div class="row"><button class="btn" data-act="exportAll"'+(S.orders.length?'':' disabled')+'>'+ico('down')+'Baixar todos os pedidos (CSV)</button></div></div>'+
  '<div class="panel" style="display:grid;gap:8px"><h2 style="font-size:18px">Como os dados são guardados</h2><p class="small" style="margin:0">Os pedidos ficam no seu projeto Supabase. O motoboy vê as mudanças em tempo real e só consegue atualizar entrega e pagamento. Cadastrar, editar, cancelar e excluir pedidos é exclusivo do dono.</p><p class="small" style="margin:0">Pedidos carregados: <b>'+S.orders.length+'</b></p></div>'+
  '<div class="panel" style="display:grid;gap:10px"><h2 style="font-size:18px">Sua conta</h2><p class="small" style="margin:0">'+esc(S.me?S.me.nome:'')+' · '+esc(S.session&&S.session.user.email?S.session.user.email:'')+'<br>Acesso: <b>'+(S.motoboy?'Motoboy':'Dono')+'</b></p><div class="row"><button class="btn" data-act="logout">'+ico('out')+'Sair</button></div></div>'+
  '</div>';
}};
H.seedDemo=()=>seedDemo();
H.askClearDemo=()=>{openModal('<h2>Remover pedidos de demonstração?</h2><p style="margin:0">Somente os pedidos marcados como demonstração serão apagados, com o histórico deles. Seus pedidos reais não são afetados.</p><div class="row"><button class="btn danger" data-act="clearDemo">Remover demonstração</button><button class="btn" data-act="closeModal" data-autofocus>Voltar</button></div>')};
H.clearDemo=()=>clearDemo();
H.exportAll=()=>saveFile('mw-entregas-todos-os-pedidos-'+todayStr()+'.csv',csvText(ordersCsvRows(S.orders.slice().sort((a,b)=>a.dataEntrega<b.dataEntrega?1:-1))));
