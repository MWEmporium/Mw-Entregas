'use strict';
/* ====================== componentes ====================== */
const H={};   /* manipuladores de data-act */
const V={};   /* telas */
function pill(s){return '<span class="pill st-'+s+'">'+ico(ST[s].ic)+ST[s].l+'</span>'}
function pageHead(t,sub,right){return '<div class="pagehead"><div><h1>'+t+'</h1>'+(sub?'<p>'+sub+'</p>':'')+'</div>'+(right?'<div class="row">'+right+'</div>':'')+'</div>'}
function empty(t,s,btn){return '<div class="empty panel"><strong>'+t+'</strong>'+(s||'')+(btn?'<div style="margin-top:12px">'+btn+'</div>':'')+'</div>'}
function tile(l,v,sub,cls){return '<div class="tile '+(cls||'')+'"><span class="lbl">'+l+'</span><span class="val num">'+v+'</span>'+(sub?'<span class="sub">'+sub+'</span>':'')+'</div>'}
function locHtml(o){
  const t=String(o.local||'').trim();
  const label=isUrl(t)?'Abrir localização no mapa':esc(t);
  return '<a class="lnk" href="'+esc(mapLink(t))+'" target="_blank" rel="noopener">'+ico('pin')+'<span>'+label+'</span></a>';
}
/* botoes principais: cada cor = uma funcao (laranja = saiu para entrega, verde = entregue/pago, vermelho = nao entregue, roxo = reagendar) */
function abtn(act,id,txt,cls,ic){return '<button class="btn ab '+cls+'" data-act="'+act+'" data-id="'+id+'">'+(ic?ico(ic):'')+'<span>'+txt+'</span></button>'}
function actionsFor(o){
  if(S.readOnly)return '';
  const id=o.id,s=o.status,a=[];
  if(s==='pendente'||s==='reagendado'||s==='nao_entregue')a.push(abtn('setStatus-em_rota',id,'Saiu para entrega','a-rota','route'));
  if(s!=='entregue'&&s!=='cancelado')a.push(abtn('askDelivered',id,'Entregue','a-ok','check'));
  if(s==='pendente'||s==='reagendado'||s==='em_rota')a.push(abtn('askNotDelivered',id,'Não entregue','a-no','x'));
  if(s!=='entregue'&&s!=='cancelado')a.push(abtn('askReschedule',id,'Reagendar','a-re','cal'));
  if(s==='entregue'&&!o.pago)a.push(abtn('payNow',id,'Recebi o pagamento','a-ok','money'));
  if(s==='cancelado'&&S.canEdit)a.push(abtn('setStatus-pendente',id,'Reabrir pedido','a-rota','clock'));
  return a.join('');
}
/* botoes secundarios (menores): WhatsApp, detalhes, desfazer e, para o dono, editar/cancelar/excluir */
function actionsSecondary(o,opt){
  opt=opt||{};
  if(S.readOnly)return '';
  const id=o.id,s=o.status,a=[];
  const b=(act,txt,cls,ic)=>'<button class="btn s2 '+cls+'" data-act="'+act+'" data-id="'+id+'">'+(ic?ico(ic):'')+txt+'</button>';
  a.push('<a class="btn s2 wa" href="'+esc(waLink(o.telefone))+'" target="_blank" rel="noopener">'+ico('send')+'WhatsApp</a>');
  if(!opt.detail)a.push(b('detalhe','Detalhes','outline','list'));
  if(s==='entregue')a.push(b('setStatus-pendente','Desfazer entrega','ghost','clock'));
  else if(s==='em_rota'||s==='nao_entregue'||s==='reagendado')a.push(b('setStatus-pendente','Voltar para pendente','ghost','clock'));
  if(S.canEdit){
    a.push(b('editar','Editar','outline','edit'));
    if(opt.detail){
      if(s!=='cancelado')a.push(b('askCancel','Cancelar pedido','dng','ban'));
      a.push(b('askDelete','Excluir','dng','ban'));
    }
  }
  return a.join('');
}
function orderCard(o,opt){
  opt=opt||{};
  const tags=[];
  if(isLate(o))tags.push('<span class="tag bad">Atrasado desde '+fmtDate(o.dataEntrega)+'</span>');
  if(o.status==='entregue'&&!o.pago)tags.push('<span class="tag warn">Falta receber</span>');
  if(o.pago&&o.status!=='cancelado')tags.push('<span class="tag ok">Pago</span>');
  if(o.status==='nao_entregue'&&o.motivoNaoEntrega)tags.push('<span class="tag">'+esc(o.motivoNaoEntrega)+'</span>');
  if(o.demo)tags.push('<span class="tag demo">Demonstração</span>');
  return '<article class="oc'+(o.status==='cancelado'?' cancelled':'')+'" data-s="'+o.status+'">'+
    (opt.select?'<label class="sel"><input type="checkbox" class="chk" data-sel="'+o.id+'"'+(S.ui.rota.sel[o.id]?' checked':'')+'> Incluir na seleção</label>':'')+
    '<div class="top"><div style="min-width:0"><div class="nm">'+esc(o.cliente)+'</div>'+
    '<div class="meta"><a class="lnk" href="'+esc(waLink(o.telefone))+'" target="_blank" rel="noopener">'+ico('phone')+'<span class="num">'+esc(fmtPhone(o.telefone))+'</span></a><span>'+qtdTxt(o.qtd)+'</span>'+(opt.noDate?'':'<span>Entrega '+fmtDate(o.dataEntrega)+'</span>')+'</div></div>'+
    '<div style="text-align:right;display:grid;gap:6px;justify-items:end"><div class="money num">'+brl(o.valorCent)+'</div>'+pill(o.status)+'</div></div>'+
    '<div class="loc">'+locHtml(o)+'</div>'+
    (o.obs?'<div class="obs">'+esc(o.obs)+'</div>':'')+
    (tags.length?'<div class="row" style="gap:6px">'+tags.join('')+'</div>':'')+
    '<div class="acts">'+actionsFor(o)+'</div><div class="acts2">'+actionsSecondary(o)+'</div></article>';
}

/* ====================== navegação ====================== */
const NAV=[
  {k:'dash',t:'Dashboard',i:'home'},
  {k:'novo',t:'Cadastrar pedido',i:'plus'},
  {k:'site',t:'Pedidos do site',i:'cart'},
  {k:'hoje',t:'Entregas de hoje',i:'today'},
  {k:'amanha',t:'Entregas de amanhã',i:'truck'},
  {k:'todos',t:'Todos os pedidos',i:'list'},
  {k:'rel',t:'Relatórios',i:'chart'},
  {k:'config',t:'Configurações',i:'gear'}
];
function navTo(k){
  if(k==='hoje')return go('rota',{date:todayStr()});
  if(k==='amanha')return go('rota',{date:addDays(todayStr(),1)});
  go(k);
}
function activeKey(){
  const v=S.view;
  if(v==='rota'){const t=todayStr();if(S.params.date===t)return 'hoje';if(S.params.date===addDays(t,1))return 'amanha';return ''}
  if(v==='detalhe')return 'todos';
  if(v==='editar')return 'todos';
  return v;
}
function titleOf(){
  if(S.view==='rota'){const t=todayStr();return S.params.date===t?'Entregas de hoje':S.params.date===addDays(t,1)?'Entregas de amanhã':'Entregas do dia'}
  if(S.view==='detalhe')return 'Detalhes do pedido';
  if(S.view==='editar')return 'Editar pedido';
  const n=NAV.find(x=>x.k===S.view);return n?n.t:'';
}
function navItems(){return S.motoboy?NAV.filter(n=>['dash','hoje','amanha','todos'].includes(n.k)):NAV}
function renderNav(){
  const ak=activeKey();
  const quem=S.me?esc(S.me.nome)+' · '+(S.motoboy?'Motoboy':'Dono'):'';
  $('#side').innerHTML='<div class="brand"><img src="images/logo-mw.png" alt="MW Entregas" width="1270" height="500"><small>Pedidos e rotas</small></div>'+
    navItems().map(n=>'<button class="navb" data-act="nav" data-k="'+n.k+'"'+(ak===n.k?' aria-current="page"':'')+'>'+ico(n.i)+'<span>'+n.t+'</span>'+(n.k==='config'&&S.canEdit&&pendingCount()?'<span class="navbadge" aria-label="'+pendingCount()+' cadastros aguardando">'+pendingCount()+'</span>':'')+(n.k==='site'&&S.canEdit&&siteNovos().length?'<span class="navbadge" aria-label="'+siteNovos().length+' pedidos do site aguardando">'+siteNovos().length+'</span>':'')+'</button>').join('')+
    '<div class="sidefoot"><span>'+quem+'</span><span>Hoje: '+fmtDate(todayStr())+'</span><button class="navb" data-act="logout">'+ico('out')+'<span>Sair</span></button></div>';
  $('#top').innerHTML='<img src="images/logo-mw.png" alt="MW Entregas" width="1270" height="500"><small>'+esc(titleOf())+'</small>';
  const bb=(k,t,i,fab)=>'<button data-act="nav" data-k="'+k+'"'+(ak===k?' aria-current="page"':'')+(fab?' class="fab" aria-label="Cadastrar pedido"':'')+'>'+(fab?'<span class="ic">'+ico(i)+'</span>':ico(i))+'<span>'+t+'</span></button>';
  if(S.motoboy){
    $('#bottom').innerHTML=bb('dash','Painel','home')+bb('hoje','Hoje','today')+bb('amanha','Amanhã','truck')+bb('todos','Pedidos','list')+'<button data-act="logout">'+ico('out')+'<span>Sair</span></button>';
  }else{
    const moreActive=['amanha','rel','config','site'].includes(ak);
    const sn=siteNovos().length;
    $('#bottom').innerHTML=bb('dash','Painel','home')+bb('hoje','Hoje','today')+bb('novo','Novo','plus',true)+bb('todos','Pedidos','list')+
      '<button data-act="moreNav"'+(moreActive?' aria-current="page"':'')+'>'+ico('more')+'<span>Mais</span>'+(sn?'<i class="bdot">'+sn+'</i>':'')+'</button>';
  }
}
function gate(){
  if(!S.ready)return '<div class="empty panel"><strong>Carregando…</strong></div>';
  if(S.err)return '<div class="banner bad">Não foi possível carregar os pedidos ('+esc(errText(S.err))+'). <button class="btn sm" data-act="retry">Tentar de novo</button></div>';
  if(!S.loaded)return '<div class="empty panel"><strong>Carregando pedidos…</strong></div>';
  return '';
}
function cleanup(){if(S.histUnsub){try{S.histUnsub()}catch(e){}S.histUnsub=null}}
function go(view,params){
  cleanup();S.view=view;S.params=params||{};
  if(view==='rota'){S.ui.rota.sel={}}
  render();window.scrollTo(0,0);
}
function render(){
  const logged=!!(S.session&&S.me);
  document.body.classList.toggle('authscreen',!logged);
  if(!logged){renderAuth();return}
  if(S.motoboy&&['novo','editar','rel','config','site'].includes(S.view)){S.view='dash';S.params={}}
  renderNav();
  const g=gate();S.gateShown=!!g;
  const v=V[S.view];
  $('#main').innerHTML=g?pageHead(esc(titleOf()))+g:v.html();
  if(!g&&v.bind)v.bind();
}
function refresh(){
  if(!S.session||!S.me)return;
  const v=V[S.view];if(!v)return;
  const g=gate();
  if(!!g!==S.gateShown||(!g&&!v.form&&!v.update)){render();return}
  if(g)return;
  if(v.update)v.update();
}

/* ====================== despacho de eventos ====================== */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;
  const raw=el.dataset.act;const i=raw.indexOf('-');
  const act=i>0?raw.slice(0,i):raw,arg=i>0?raw.slice(i+1):null;
  const fn=H[act];if(fn)fn(el,arg);
});
document.addEventListener('input',e=>{
  const el=e.target;
  if(el.dataset&&el.dataset.sel){const id=el.dataset.sel;if(el.checked)S.ui.rota.sel[id]=true;else delete S.ui.rota.sel[id];const v=V[S.view];if(v&&v.updateShare)v.updateShare();return}
  const k=el.dataset&&el.dataset.f;if(!k)return;
  const p=k.split('.');S.ui[p[0]][p[1]]=el.value;
  if(p[0]==='todos')S.ui.todos.limit=60;
  if(k==='rel.mode'){render();return}
  const v=V[S.view];if(v&&v.update)v.update();
});
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.id==='r-date'&&el.value){go('rota',{date:el.value})}
});
H.nav=(el)=>{closeModal();navTo(el.dataset.k)};
H.closeModal=()=>closeModal();
H.moreNav=()=>{
  const b=(k,t,i)=>'<button class="btn" data-act="nav" data-k="'+k+'">'+ico(i)+t+'</button>';
  openModal('<h2>Mais opções</h2><div class="menu">'+b('site','Pedidos do site'+(siteNovos().length?' ('+siteNovos().length+' novo'+(siteNovos().length>1?'s':'')+')':''),'cart')+b('amanha','Entregas de amanhã','truck')+b('rel','Relatórios','chart')+b('config','Configurações'+(S.canEdit&&pendingCount()?' ('+pendingCount()+' novo'+(pendingCount()>1?'s':'')+')':''),'gear')+'<button class="btn" data-act="logout">'+ico('out')+'Sair</button></div><button class="btn" data-act="closeModal">Fechar</button>');
};
H.retry=()=>{S.err=null;scheduleReload()};
const newBtn=()=>S.canEdit?'<button class="btn primary" data-act="nav" data-k="novo">'+ico('plus')+'Cadastrar pedido</button>':'';
ICONS.out='<path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4M16 8l4 4-4 4M20 12H9"/>';
H.menu=(el)=>openMenu(el.dataset.id);
H.detalhe=(el)=>{closeModal();go('detalhe',{id:el.dataset.id})};
H.editar=(el)=>{closeModal();go('editar',{id:el.dataset.id})};
H.setStatus=(el,arg)=>{closeModal();setStatus(el.dataset.id,arg)};
H.askDelivered=(el)=>{closeModal();askDelivered(el.dataset.id)};
H.askNotDelivered=(el)=>{closeModal();askNotDelivered(el.dataset.id)};
H.askReschedule=(el)=>{closeModal();askReschedule(el.dataset.id)};
H.askCancel=(el)=>{closeModal();askCancel(el.dataset.id)};
H.askDelete=(el)=>{closeModal();askDelete(el.dataset.id)};
H.doDelivered=(el)=>doDelivered(el.dataset.id,el.dataset.pago==='1');
H.doNotDelivered=(el)=>doNotDelivered(el.dataset.id);
H.doReschedule=(el)=>doReschedule(el.dataset.id);
H.doCancel=(el)=>doCancel(el.dataset.id);
H.doDelete=(el)=>doDelete(el.dataset.id);
H.togglePago=(el)=>{closeModal();const o=byId(el.dataset.id);if(o)setPago(o.id,!o.pago)};
H.payNow=(el)=>setPago(el.dataset.id,true);
H.goNew=()=>go('novo');

/* ====================== dashboard ====================== */
/* contadores na ordem em que aparecem; clicar em um filtra a lista de pedidos de hoje */
const DASHF={
  todos:{l:'Pedidos do Dia',k:'all',fn:()=>true},
  entregue:{l:'Entregues',k:'ok',fn:o=>o.status==='entregue'},
  em_rota:{l:'Em Rota',k:'rota',fn:o=>o.status==='em_rota'},
  pendente:{l:'Pendentes',k:'pend',fn:o=>o.status==='pendente'||o.status==='reagendado'},
  nao_entregue:{l:'Não Entregues',k:'nao',fn:o=>o.status==='nao_entregue'},
  cancelado:{l:'Cancelados',k:'can',fn:o=>o.status==='cancelado'},
  resinas:{l:'Resinas a Entregar',k:'res',fn:o=>OPEN.includes(o.status)}
};
V.dash={html(){
  const t=todayStr();
  const list=S.orders.filter(o=>o.dataEntrega===t).sort(sortOperational);
  const st=stats(list);
  const late=S.orders.filter(isLate);
  const unpaid=S.orders.filter(o=>o.status==='entregue'&&!o.pago);
  const unpaidVal=unpaid.reduce((a,o)=>a+o.valorCent,0);
  const fk=DASHF[S.ui.dash.f]?S.ui.dash.f:'todos';
  const shown=list.filter(DASHF[fk].fn);
  const val={todos:st.total,entregue:st.entr,em_rota:st.rota,pendente:st.pend+st.rea,nao_entregue:st.nao,cancelado:st.canc,resinas:st.qtdAberto};
  const sub={todos:st.canc?'fora '+st.canc+' cancelado(s)':'válidos do dia',entregue:'concluídas',em_rota:'saíram para entrega',pendente:st.rea?'inclui '+st.rea+' reagendado(s)':'aguardando entrega',nao_entregue:'tentativa sem sucesso',cancelado:'fora das vendas',resinas:'de '+st.qtd+' no dia'};
  const counters='<div class="counters" role="group" aria-label="Resumo do dia">'+Object.keys(DASHF).map(k=>
    '<button class="cnt k-'+DASHF[k].k+'" data-act="dashF" data-v="'+k+'" aria-pressed="'+(fk===k)+'"><span class="cl"><b>'+DASHF[k].l+'</b><small>'+sub[k]+'</small></span><span class="cv num">'+val[k]+'</span></button>').join('')+'</div>';
  const money='<section class="moneybox" aria-label="Dinheiro de hoje"><h2>Dinheiro de hoje</h2>'+
    '<div class="mrow"><span>Previsto</span><b class="num">'+brl(st.prev)+'</b></div>'+
    '<div class="mrow"><span>Recebido</span><b class="num">'+brl(st.recebido)+'</b></div>'+
    '<div class="mrow hot"><span>Ainda a receber</span><b class="num">'+brl(st.aReceber)+'</b></div>'+
    (st.entrNaoPagos?'<p class="msub">'+st.entrNaoPagos+' já entregue(s) sem pagamento</p>':'')+'</section>';
  let alerts='';
  if(S.canEdit&&siteNovos().length)alerts+='<div class="banner">'+siteNovos().length+(siteNovos().length===1?' pedido do site aguarda a sua aprovação.':' pedidos do site aguardam a sua aprovação.')+' <button class="btn sm primary" data-act="nav" data-k="site">Ver pedidos</button></div>';
  if(S.canEdit&&pendingCount())alerts+='<div class="banner">'+pendingCount()+(pendingCount()===1?' pessoa criou conta e aguarda a sua liberação.':' pessoas criaram conta e aguardam a sua liberação.')+' <button class="btn sm" data-act="nav" data-k="config">Ver cadastros</button></div>';
  if(late.length)alerts+='<div class="banner bad">'+late.length+(late.length===1?' pedido atrasado':' pedidos atrasados')+' (data de entrega já passou e ainda não foi concluído). <button class="btn sm" data-act="filtro" data-v="atrasados">Ver pedidos</button></div>';
  if(unpaid.length)alerts+='<div class="banner">'+unpaid.length+(unpaid.length===1?' entrega concluída sem pagamento registrado':' entregas concluídas sem pagamento registrado')+' ('+brl(unpaidVal)+'). <button class="btn sm" data-act="filtro" data-v="semPgto">Ver pedidos</button></div>';
  const body=shown.length?'<div class="cards">'+shown.map(o=>orderCard(o,{noDate:true})).join('')+'</div>':
    (list.length?empty('Nenhum pedido neste filtro','Toque em outro contador ou veja todos os pedidos de hoje.','<button class="btn primary" data-act="dashF" data-v="todos">Ver todos</button>'):empty('Nenhum pedido para hoje','Cadastre uma venda ou veja os pedidos de amanhã.',newBtn()));
  const fbar=fk!=='todos'?'<div class="filterbar">Mostrando só: <b>'+DASHF[fk].l+'</b> ('+shown.length+') <button class="btn sm" data-act="dashF" data-v="todos">Ver todos</button></div>':'';
  return '<div class="dashgrid">'+pageHead('Pedidos de hoje',esc(weekdayBR(t))+', '+fmtDate(t),newBtn()+'<button class="btn" data-act="nav" data-k="hoje">'+ico('send')+'Rota de hoje</button>')+
    '<div class="dash-main">'+fbar+(alerts?'<div class="dash-alerts">'+alerts+'</div>':'')+body+'</div>'+
    '<aside class="dash-aside">'+counters+money+'</aside></div>';
}};
H.dashF=(el)=>{const v=el.dataset.v;S.ui.dash.f=(S.ui.dash.f===v)?'todos':v;render()};
H.filtro=(el)=>{
  const f=S.ui.todos;Object.assign(f,{q:'',data:'',de:'',ate:'',status:'',pago:'',limit:60});
  if(el.dataset.v==='atrasados')f.status='atrasados';
  if(el.dataset.v==='semPgto')f.pago='entregue_nao_pago';
  go('todos');
};

/* ====================== todos os pedidos ====================== */
function todosFiltered(){
  const f=S.ui.todos,q=plainName(f.q),qd=digits(f.q);
  let l=S.orders.filter(o=>{
    if(f.q){const okN=plainName(o.cliente).includes(q);const okT=qd&&digits(o.telefone).includes(qd);if(!okN&&!okT)return false}
    if(f.data&&o.dataEntrega!==f.data)return false;
    if(f.de&&o.dataEntrega<f.de)return false;
    if(f.ate&&o.dataEntrega>f.ate)return false;
    if(f.status){
      if(f.status==='nao_ou_rea'){if(o.status!=='nao_entregue'&&o.status!=='reagendado')return false}
      else if(f.status==='atrasados'){if(!isLate(o))return false}
      else if(o.status!==f.status)return false;
    }
    if(f.pago==='sim'&&!o.pago)return false;
    if(f.pago==='nao'&&o.pago)return false;
    if(f.pago==='entregue_nao_pago'&&!(o.status==='entregue'&&!o.pago))return false;
    return true;
  });
  const keys=Object.keys(ST);const dir=f.dir==='asc'?1:-1;
  l.sort((a,b)=>{
    let x,y;
    if(f.sort==='cliente'){x=plainName(a.cliente);y=plainName(b.cliente)}
    else if(f.sort==='status'){x=keys.indexOf(a.status);y=keys.indexOf(b.status)}
    else if(f.sort==='valorCent'){x=a.valorCent;y=b.valorCent}
    else{x=a.dataEntrega;y=b.dataEntrega}
    const c=x<y?-1:x>y?1:0;
    return c*dir||String(b.criadoEm||'').localeCompare(String(a.criadoEm||''));
  });
  return l;
}
V.todos={html(){
  const f=S.ui.todos;
  const opt=(v,t,cur)=>'<option value="'+v+'"'+(cur===v?' selected':'')+'>'+t+'</option>';
  const chip=(v,t)=>'<button class="chip" data-act="chip" data-v="'+v+'" aria-pressed="'+(f.status===v)+'">'+t+'</button>';
  return pageHead('Todos os pedidos','Histórico completo, inclusive pedidos antigos e cancelados.',newBtn())+
  '<div class="panel" style="margin-bottom:14px"><div class="filters">'+
    '<div class="fld" style="grid-column:1/-1"><label for="t-q">Buscar cliente ou telefone</label><input class="in" id="t-q" type="search" data-f="todos.q" value="'+esc(f.q)+'" placeholder="Nome ou número" autocomplete="off"></div>'+
    '<div class="fld"><label for="t-data">Data de entrega</label><input class="in" id="t-data" type="date" data-f="todos.data" value="'+esc(f.data)+'"></div>'+
    '<div class="fld"><label for="t-de">De</label><input class="in" id="t-de" type="date" data-f="todos.de" value="'+esc(f.de)+'"></div>'+
    '<div class="fld"><label for="t-ate">Até</label><input class="in" id="t-ate" type="date" data-f="todos.ate" value="'+esc(f.ate)+'"></div>'+
    '<div class="fld"><label for="t-st">Status</label><select class="in" id="t-st" data-f="todos.status">'+opt('','Todos',f.status)+Object.keys(ST).map(k=>opt(k,ST[k].l,f.status)).join('')+opt('nao_ou_rea','Não entregues ou reagendados',f.status)+opt('atrasados','Atrasados',f.status)+'</select></div>'+
    '<div class="fld"><label for="t-pg">Pagamento</label><select class="in" id="t-pg" data-f="todos.pago">'+opt('','Todos',f.pago)+opt('sim','Recebido',f.pago)+opt('nao','Não recebido',f.pago)+opt('entregue_nao_pago','Entregue sem pagamento',f.pago)+'</select></div>'+
    '<div class="fld"><label for="t-so">Ordenar por</label><select class="in" id="t-so" data-f="todos.sort">'+opt('dataEntrega','Data de entrega',f.sort)+opt('cliente','Nome',f.sort)+opt('status','Status',f.sort)+opt('valorCent','Valor',f.sort)+'</select></div>'+
    '<div class="fld"><label for="t-di">Ordem</label><select class="in" id="t-di" data-f="todos.dir">'+opt('desc','Maior/mais recente primeiro',f.dir)+opt('asc','Menor/mais antigo primeiro',f.dir)+'</select></div>'+
  '</div><div class="chips" style="margin:0" id="t-chips">'+chip('','Todos')+chip('pendente','Pendentes')+chip('entregue','Entregues')+chip('cancelado','Cancelados')+chip('nao_ou_rea','Não entregues / reagendados')+chip('atrasados','Atrasados')+
  '<button class="chip" data-act="clearFilters">Limpar filtros</button></div></div><div id="t-res"></div>';
},bind(){this.update()},update(){
  const f=S.ui.todos;const l=todosFiltered();const shown=l.slice(0,f.limit);
  const st=stats(l);
  document.querySelectorAll('#t-chips .chip[data-v]').forEach(c=>c.setAttribute('aria-pressed',String(c.dataset.v===f.status)));
  let h='<p class="small" style="margin:0 0 10px">'+l.length+(l.length===1?' pedido':' pedidos')+' · válidos '+brl(st.prev)+' · recebido '+brl(st.recebido)+' · '+st.qtd+' resinas</p>';
  if(!l.length){h+=S.orders.length?empty('Nenhum pedido encontrado','Ajuste ou limpe os filtros.'):empty('Você ainda não tem pedidos','Cadastre o primeiro ou carregue a demonstração em Configurações.',newBtn())}
  else{
    h+='<div class="tablewrap only-wide"><table><thead><tr><th>Cliente</th><th>Telefone</th><th class="r">Valor</th><th class="r">Resinas</th><th>Entrega</th><th>Status</th><th>Pago</th><th>Ações</th></tr></thead><tbody>'+
      shown.map(o=>'<tr><td><b>'+esc(o.cliente)+'</b>'+(o.demo?' <span class="tag demo">Demo</span>':'')+'</td><td><a class="lnk" href="'+esc(waLink(o.telefone))+'" target="_blank" rel="noopener"><span class="num">'+esc(fmtPhone(o.telefone))+'</span></a></td><td class="r num">'+brl(o.valorCent)+'</td><td class="r num">'+o.qtd+'</td><td class="num">'+fmtDate(o.dataEntrega)+(isLate(o)?' <span class="tag bad">Atrasado</span>':'')+'</td><td>'+pill(o.status)+'</td><td>'+(o.status==='cancelado'?'—':o.pago?'<span class="tag ok">Sim</span>':'<span class="tag">Não</span>')+'</td><td><div class="row" style="gap:6px"><button class="btn sm" data-act="detalhe" data-id="'+o.id+'">Detalhes</button>'+(S.readOnly?'':'<button class="btn sm" data-act="menu" data-id="'+o.id+'">Ações</button>')+'</div></td></tr>').join('')+
      '</tbody></table></div>';
    h+='<div class="cards only-narrow">'+shown.map(o=>orderCard(o)).join('')+'</div>';
    if(l.length>shown.length)h+='<div class="row" style="justify-content:center;margin-top:14px"><button class="btn" data-act="moreRows">Mostrar mais ('+(l.length-shown.length)+')</button></div>';
  }
  $('#t-res').innerHTML=h;
}};
H.chip=(el)=>{S.ui.todos.status=el.dataset.v;S.ui.todos.limit=60;const s=$('#t-st');if(s)s.value=el.dataset.v;V.todos.update()};
H.clearFilters=()=>{Object.assign(S.ui.todos,{q:'',data:'',de:'',ate:'',status:'',pago:'',limit:60});render()};
H.moreRows=()=>{S.ui.todos.limit+=60;V.todos.update()};
