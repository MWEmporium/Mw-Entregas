'use strict';
/* ====================== camada de dados (Supabase) ====================== */
const COLMAP={cliente:'cliente',telefone:'telefone',valorCent:'valor_cent',qtd:'qtd',dataCadastro:'data_cadastro',dataEntrega:'data_entrega',local:'localizacao',obs:'obs',formaPgto:'forma_pgto',status:'status',pago:'pago',pagoEm:'pago_em',entregueEm:'entregue_em',canceladoEm:'cancelado_em',motivoNaoEntrega:'motivo_nao_entrega',demo:'demo'};
function toRow(o){const r={};for(const k in o){if(COLMAP[k])r[COLMAP[k]]=o[k]}return r}
function fromRow(r){return {id:r.id,cliente:r.cliente,telefone:r.telefone,valorCent:r.valor_cent,qtd:r.qtd,dataCadastro:r.data_cadastro,dataEntrega:r.data_entrega,local:r.localizacao,obs:r.obs,formaPgto:r.forma_pgto,status:r.status,pago:r.pago,pagoEm:r.pago_em,entregueEm:r.entregue_em,canceladoEm:r.cancelado_em,motivoNaoEntrega:r.motivo_nao_entrega,demo:r.demo,criadoEm:r.criado_em,atualizadoEm:r.atualizado_em}}

const nowIso=()=>new Date().toISOString();
function errText(e){return e&&e.message?e.message:'erro desconhecido'}
function enqueue(id,fn){const p=(S.queue[id]||Promise.resolve()).then(()=>fn(),()=>fn());S.queue[id]=p.catch(()=>{});return p}

async function loadOrders(){
  let all=[],from=0;const step=1000;
  for(;;){
    const res=await S.sb.from('pedidos').select('*').order('data_entrega',{ascending:false}).order('criado_em',{ascending:false}).range(from,from+step-1);
    if(res.error)throw res.error;
    all=all.concat(res.data);
    if(res.data.length<step)break;
    from+=step;
  }
  S.orders=all.map(fromRow);S.loaded=true;S.err=null;
}
let reloadTimer=null;
function scheduleReload(){
  clearTimeout(reloadTimer);
  reloadTimer=setTimeout(async()=>{
    if(!S.sb||!S.session||!S.me)return;
    try{await loadOrders()}catch(e){S.err=e;S.loaded=true}
    refresh();
  },200);
}
async function loadHist(){
  const id=S.params.id;if(!id||!S.sb)return;
  const res=await S.sb.from('historico').select('em,tipo,texto,usuario_nome').eq('pedido_id',id).order('em',{ascending:false});
  if(res.error||S.view!=='detalhe'||S.params.id!==id)return;
  S.hist=res.data;renderHist();
}
async function addHist(id,tipo,texto){
  const res=await S.sb.from('historico').insert({pedido_id:id,tipo:tipo,texto:texto,usuario_nome:S.me?S.me.nome:null});
  if(res.error)throw res.error;
}

/* hist = lista de [tipo, texto] */
async function patchOrder(id,patch,hist,okMsg){
  if(!S.sb){toast('Sem conexão com o banco de dados',true);return false}
  return enqueue(id,async()=>{
    try{
      const res=await S.sb.from('pedidos').update(toRow(patch)).eq('id',id).select('id');
      if(res.error)throw res.error;
      if(!res.data||!res.data.length)throw new Error('pedido não encontrado ou sem permissão');
      for(const h of (hist||[]))await addHist(id,h[0],h[1]);
      scheduleReload();
      if(okMsg)toast(okMsg);
      return true;
    }catch(e){toast('Não foi possível salvar: '+errText(e),true);return false}
  });
}
async function createOrder(data){
  const row=toRow(data);
  if(row.status==='entregue'&&!row.entregue_em)row.entregue_em=nowIso();
  const res=await S.sb.from('pedidos').insert(row).select('id').single();
  if(res.error)throw res.error;
  await addHist(res.data.id,'criado',data.demo?'Pedido de demonstração criado':'Pedido cadastrado');
  scheduleReload();
  return res.data.id;
}
async function removeOrder(id){
  const res=await S.sb.from('pedidos').delete().eq('id',id).select('id');
  if(res.error)throw res.error;
  if(!res.data||!res.data.length)throw new Error('sem permissão para excluir');
  scheduleReload();
}

/* ====================== ações sobre pedidos ====================== */
function setStatus(id,novo){
  const o=byId(id);if(!o)return;
  const patch={status:novo};
  if(novo==='pendente')patch.entregueEm=null;
  return patchOrder(id,patch,[['status','Status alterado: '+ST[o.status].l+' → '+ST[novo].l]],'Pedido marcado como '+ST[novo].l);
}
function askDelivered(id){
  const o=byId(id);if(!o)return;
  openModal('<h2>Entrega concluída</h2><p style="margin:0">Cliente: <b>'+esc(o.cliente)+'</b><br>O pagamento de <b>'+brl(o.valorCent)+'</b> já foi recebido?</p>'+
    '<div class="menu"><button class="btn good" data-act="doDelivered" data-id="'+o.id+'" data-pago="1" data-autofocus>'+ico('money')+'Sim, recebi o pagamento</button>'+
    '<button class="btn" data-act="doDelivered" data-id="'+o.id+'" data-pago="0">Ainda não recebi</button>'+
    '<button class="btn" data-act="closeModal">Voltar</button></div>');
}
async function doDelivered(id,pago){
  closeModal();const o=byId(id);if(!o)return;
  const now=nowIso();const patch={status:'entregue',entregueEm:now};
  const jaPago=!!o.pago;
  if(pago&&!jaPago){patch.pago=true;patch.pagoEm=now}
  const txt='Entregue'+(pago||jaPago?' e pagamento recebido ('+brl(o.valorCent)+')':'; pagamento ainda não recebido');
  await patchOrder(id,patch,[['status',txt]],'Entrega registrada');
}
function askNotDelivered(id){
  const o=byId(id);if(!o)return;
  const motivos=['Cliente ausente','Cliente não atendeu','Endereço não encontrado','Cliente pediu outro dia','Cliente sem dinheiro no momento','Outro motivo'];
  openModal('<h2>Entrega não realizada</h2><p style="margin:0;color:var(--muted)">'+esc(o.cliente)+'</p>'+
    '<div class="fld"><label for="nd-m">Motivo</label><select class="in" id="nd-m" data-autofocus>'+motivos.map(m=>'<option>'+m+'</option>').join('')+'</select></div>'+
    '<div class="fld"><label for="nd-t">Detalhes (opcional)</label><textarea class="in" id="nd-t" rows="2"></textarea></div>'+
    '<label class="row" style="gap:8px"><input type="checkbox" class="chk" id="nd-r" checked> Reagendar a entrega agora</label>'+
    '<div class="fld" id="nd-dw"><label for="nd-d">Nova data</label><input class="in" type="date" id="nd-d" value="'+addDays(todayStr(),1)+'" min="'+todayStr()+'"></div>'+
    '<div id="nd-e" class="errmsg"></div>'+
    '<div class="row"><button class="btn primary" data-act="doNotDelivered" data-id="'+o.id+'">Registrar</button><button class="btn" data-act="closeModal">Voltar</button></div>',
    m=>{const r=m.querySelector('#nd-r'),w=m.querySelector('#nd-dw');r.addEventListener('change',()=>{w.hidden=!r.checked})});
}
async function doNotDelivered(id){
  const o=byId(id);if(!o)return;
  const motivo=$('#nd-m').value,det=$('#nd-t').value.trim(),re=$('#nd-r').checked,nd=$('#nd-d').value;
  if(re&&(!nd||nd<todayStr())){$('#nd-e').textContent='Escolha uma data de hoje em diante para reagendar.';return}
  closeModal();
  const mot=motivo+(det?' - '+det:'');
  if(re){
    await patchOrder(id,{status:'reagendado',dataEntrega:nd,motivoNaoEntrega:mot},
      [['status','Não entregue: '+mot],['reagendamento','Reagendado de '+fmtDate(o.dataEntrega)+' para '+fmtDate(nd)]],'Pedido reagendado para '+fmtDate(nd));
  }else{
    await patchOrder(id,{status:'nao_entregue',motivoNaoEntrega:mot},[['status','Não entregue: '+mot]],'Registrado como não entregue');
  }
}
function askReschedule(id){
  const o=byId(id);if(!o)return;
  const base=o.dataEntrega>todayStr()?o.dataEntrega:todayStr();
  openModal('<h2>Reagendar entrega</h2><p style="margin:0;color:var(--muted)">'+esc(o.cliente)+' · data atual '+fmtDate(o.dataEntrega)+'</p>'+
    '<div class="fld"><label for="rg-d">Nova data</label><input class="in" type="date" id="rg-d" value="'+addDays(base,1)+'" min="'+todayStr()+'" data-autofocus></div>'+
    '<div class="fld"><label for="rg-n">Observação (opcional)</label><input class="in" id="rg-n" placeholder="Ex.: cliente pediu para sexta"></div>'+
    '<div id="rg-e" class="errmsg"></div>'+
    '<div class="row"><button class="btn primary" data-act="doReschedule" data-id="'+o.id+'">Reagendar</button><button class="btn" data-act="closeModal">Voltar</button></div>');
}
async function doReschedule(id){
  const o=byId(id);if(!o)return;
  const nd=$('#rg-d').value,nota=$('#rg-n').value.trim();
  if(!nd||nd<todayStr()){$('#rg-e').textContent='Escolha uma data de hoje em diante.';return}
  closeModal();
  await patchOrder(id,{status:'reagendado',dataEntrega:nd},[['reagendamento','Reagendado de '+fmtDate(o.dataEntrega)+' para '+fmtDate(nd)+(nota?' - '+nota:'')]],'Pedido reagendado para '+fmtDate(nd));
}
function askCancel(id){
  const o=byId(id);if(!o)return;
  openModal('<h2>Cancelar este pedido?</h2><p style="margin:0">'+esc(o.cliente)+' · '+brl(o.valorCent)+'<br><span style="color:var(--muted)">O pedido continua no histórico, mas deixa de contar nas vendas válidas e na lista de entregas.</span></p>'+
    '<div class="fld"><label for="cn-m">Motivo (opcional)</label><input class="in" id="cn-m" data-autofocus></div>'+
    '<div class="row"><button class="btn danger" data-act="doCancel" data-id="'+o.id+'">Sim, cancelar pedido</button><button class="btn" data-act="closeModal">Voltar</button></div>');
}
async function doCancel(id){
  const mot=$('#cn-m').value.trim();closeModal();
  await patchOrder(id,{status:'cancelado',canceladoEm:nowIso()},[['status','Pedido cancelado'+(mot?': '+mot:'')]],'Pedido cancelado');
}
function setPago(id,val){
  const o=byId(id);if(!o)return;
  return patchOrder(id,{pago:val,pagoEm:val?nowIso():null},[['pagamento',val?'Pagamento recebido: '+brl(o.valorCent):'Pagamento desmarcado (não recebido)']],val?'Pagamento registrado':'Pagamento desmarcado');
}
function askDelete(id){
  const o=byId(id);if(!o)return;
  openModal('<h2>Excluir pedido definitivamente?</h2><p style="margin:0">'+esc(o.cliente)+' · '+brl(o.valorCent)+'<br><span style="color:var(--muted)">Isso apaga o pedido e todo o histórico dele. Não dá para desfazer. Para manter o registro, use Cancelar pedido.</span></p>'+
    '<div class="row"><button class="btn danger" data-act="doDelete" data-id="'+o.id+'">Excluir definitivamente</button><button class="btn" data-act="closeModal" data-autofocus>Voltar</button></div>');
}
async function doDelete(id){
  closeModal();
  try{await removeOrder(id);toast('Pedido excluído');if(S.view==='detalhe')go('todos')}
  catch(e){toast('Não foi possível excluir: '+errText(e),true)}
}
function openMenu(id){
  const o=byId(id);if(!o)return;
  const b=(act,ic,txt,cls)=>'<button class="btn '+(cls||'')+'" data-act="'+act+'" data-id="'+o.id+'">'+ico(ic)+txt+'</button>';
  const m=[];
  if(o.status!=='em_rota'&&o.status!=='cancelado')m.push(b('setStatus-em_rota','route','Saiu para entrega (em rota)'));
  if(o.status!=='entregue'&&o.status!=='cancelado')m.push(b('askDelivered','check','Marcar como entregue','good'));
  if(o.status!=='nao_entregue'&&o.status!=='cancelado')m.push(b('askNotDelivered','x','Não entregue'));
  if(o.status!=='cancelado')m.push(b('askReschedule','cal','Reagendar'));
  if(o.status==='entregue')m.push(b('togglePago','money',o.pago?'Desmarcar pagamento recebido':'Marcar pagamento recebido'));
  if(o.status!=='pendente'&&o.status!=='cancelado')m.push(b('setStatus-pendente','clock','Voltar para pendente'));
  if(o.status==='cancelado'&&S.canEdit)m.push(b('setStatus-pendente','clock','Reabrir como pendente'));
  m.push('<a class="btn" href="'+esc(waLink(o.telefone))+'" target="_blank" rel="noopener">'+ico('send')+'Chamar cliente no WhatsApp</a>');
  m.push(b('detalhe','list','Ver detalhes e histórico'));
  if(S.canEdit)m.push(b('editar','edit','Editar pedido'));
  if(o.status!=='cancelado'&&S.canEdit)m.push(b('askCancel','ban','Cancelar pedido','danger'));
  if(S.canEdit)m.push(b('askDelete','ban','Excluir definitivamente','danger'));
  openModal('<h2>'+esc(o.cliente)+'</h2><div class="menu">'+m.join('')+'</div><button class="btn" data-act="closeModal">Fechar</button>');
}


/* ====================== dados de demonstração ====================== */
async function seedDemo(){
  if(!S.sb||!S.canEdit){toast('Somente o dono pode carregar a demonstração',true);return}
  if(S.busy)return;S.busy=true;
  const t=todayStr();
  const rows=[
    ['Carlos Mendes (demo)','61990000001',15000,2,'SQN 308 Bloco C, Asa Norte','Portão azul, ligar ao chegar','entregue',-1,true],
    ['Fernanda Lima (demo)','61990000002',10000,1,'QI 12 Conjunto 4 Casa 8, Lago Sul','','entregue',-1,false],
    ['Ricardo Alves (demo)','61990000003',20000,3,'Taguatinga Norte, QNA 22 Lote 5','Próximo ao mercado do bairro','pendente',0,false],
    ['Juliana Costa (demo)','61990000004',10000,1,'https://maps.google.com/?q=-15.7942,-47.8825','Horário preferido: depois das 14h','pendente',0,false],
    ['Marcos Pereira (demo)','61990000005',15000,2,'Águas Claras, Rua 12 Norte, Edifício Aurora','Interfone 1204','em_rota',0,false],
    ['Patrícia Souza (demo)','61990000006',10000,1,'Samambaia Sul, QR 304 Conjunto 2','Cliente não atendeu a primeira vez','nao_entregue',0,false],
    ['André Barros (demo)','61990000007',10000,1,'Guará II, QE 14 Casa 21','','entregue',0,true],
    ['Luciana Dias (demo)','61990000008',10000,1,'Ceilândia Centro, QNM 11','Cancelado pelo cliente','cancelado',0,false],
    ['Eduardo Nunes (demo)','61990000009',25000,4,'Sobradinho, Quadra 6 Chácara 14','Chácara com portão verde','pendente',1,false],
    ['Beatriz Rocha (demo)','61990000010',10000,1,'Vicente Pires, Rua 7 Chácara 3','Ligar ao chegar','reagendado',1,false]
  ];
  try{
    const now=nowIso();
    const payload=rows.map(r=>toRow({cliente:r[0],telefone:r[1],valorCent:r[2],qtd:r[3],dataCadastro:addDays(t,r[7]-1),dataEntrega:addDays(t,r[7]),local:r[4],obs:r[5],formaPgto:'Pagamento na entrega',status:r[6],pago:r[8],pagoEm:r[8]?now:null,entregueEm:r[6]==='entregue'?now:null,canceladoEm:r[6]==='cancelado'?now:null,demo:true}));
    const ins=await S.sb.from('pedidos').insert(payload).select('id');
    if(ins.error)throw ins.error;
    const h=await S.sb.from('historico').insert(ins.data.map(x=>({pedido_id:x.id,tipo:'criado',texto:'Pedido de demonstração criado',usuario_nome:S.me.nome})));
    if(h.error)throw h.error;
    toast('Pedidos de demonstração criados');
    scheduleReload();
  }catch(e){toast('Não foi possível criar a demonstração: '+errText(e),true)}
  S.busy=false;
}
async function clearDemo(){
  if(S.busy)return;S.busy=true;closeModal();
  try{
    const res=await S.sb.from('pedidos').delete().eq('demo',true).select('id');
    if(res.error)throw res.error;
    toast((res.data?res.data.length:0)+' pedidos de demonstração removidos');
    scheduleReload();
  }catch(e){toast('Não foi possível remover: '+errText(e),true)}
  S.busy=false;
}
