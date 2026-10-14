'use strict';
/* ====================== utilidades ====================== */
const TZ='America/Sao_Paulo';
const ST={
  pendente:{l:'Pendente',ic:'clock'},
  em_rota:{l:'Em rota',ic:'route'},
  entregue:{l:'Entregue',ic:'check'},
  nao_entregue:{l:'Não entregue',ic:'x'},
  reagendado:{l:'Reagendado',ic:'cal'},
  cancelado:{l:'Cancelado',ic:'ban'}
};
const OPEN=['pendente','em_rota','reagendado','nao_entregue'];
const ICONS={
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  route:'<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x:'<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  ban:'<circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/>',
  home:'<path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  truck:'<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  today:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M9.5 15l2 2 3.5-3.5"/>',
  list:'<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  chart:'<path d="M4 20h16M7 17v-5M12 17V6M17 17v-8"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  more:'<path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3.5"/>',
  send:'<path d="M21 4L10 15M21 4l-6.5 17-4-6.5L4 10.5z"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>',
  down:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  pin:'<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  money:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  cart:'<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M3 4h2.5l2.2 11h10.6l1.7-8H6.2"/>'
};
function ico(n){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[n]||'')+'</svg>'}
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dtf=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'});
function todayStr(){return dtf.format(new Date())}
function dateOf(iso){return dtf.format(new Date(iso))}
function parts(s){return s.split('-').map(Number)}
function addDays(s,n){const p=parts(s);return new Date(Date.UTC(p[0],p[1]-1,p[2]+n)).toISOString().slice(0,10)}
function fmtDate(s){if(!s)return '—';const p=s.split('-');return p[2]+'/'+p[1]+'/'+p[0]}
function fmtDT(iso){if(!iso)return '—';return new Date(iso).toLocaleString('pt-BR',{timeZone:TZ,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function weekdayBR(s){const p=parts(s);return ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'][new Date(Date.UTC(p[0],p[1]-1,p[2])).getUTCDay()]}
function mondayOf(s){const p=parts(s);const wd=new Date(Date.UTC(p[0],p[1]-1,p[2])).getUTCDay();return addDays(s,-((wd+6)%7))}
function monthRange(ym){const p=ym.split('-').map(Number);const last=new Date(Date.UTC(p[0],p[1],0)).getUTCDate();return [ym+'-01',ym+'-'+String(last).padStart(2,'0')]}
const brl=c=>'R$ '+((c||0)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
function parseMoney(t){let s=String(t||'').replace(/[R$\s]/g,'');if(!s)return NaN;if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');const n=Number(s);return isFinite(n)?Math.round(n*100):NaN}
function moneyInput(c){return ((c||0)/100).toFixed(2).replace('.',',')}
function digits(s){return String(s||'').replace(/\D/g,'')}
function fmtPhone(s){let x=digits(s);if(x.length>=12&&x.startsWith('55'))x=x.slice(2);if(x.length===11)return '('+x.slice(0,2)+') '+x.slice(2,7)+'-'+x.slice(7);if(x.length===10)return '('+x.slice(0,2)+') '+x.slice(2,6)+'-'+x.slice(6);return String(s||'').trim()}
function waNumber(s){let d=digits(s);if(d.length===10||d.length===11)d='55'+d;return d}
function waLink(phone,text){return 'https://wa.me/'+waNumber(phone)+(text?'?text='+encodeURIComponent(text):'')}
function shareLink(text){return 'https://wa.me/?text='+encodeURIComponent(text)}
function isUrl(s){return /^https?:\/\/\S+$/i.test(String(s||'').trim())}
function mapLink(loc){const t=String(loc||'').trim();const m=t.match(/https?:\/\/\S+/);if(m)return m[0];return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t)}
const qtdTxt=n=>n+(n===1?' resina':' resinas');
function shortId(id){return String(id||'').slice(-6).toUpperCase()}
function plainName(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}

/* ====================== estado ====================== */
const S={sb:null,session:null,me:null,motoboy:false,setup:false,hist:[],chan:null,canEdit:false,orders:[],loaded:false,err:null,view:'dash',params:{},unsub:null,histUnsub:null,queue:{},busy:false,
  ui:{
    todos:{q:'',data:'',de:'',ate:'',status:'',pago:'',sort:'dataEntrega',dir:'desc',limit:60},
    rota:{date:null,sel:{},only:'todos'},
    dash:{f:'todos'},
    rel:{mode:'hoje',date:null,de:'',ate:'',mes:''}
  }};
const byId=id=>S.orders.find(o=>o.id===id);

function stats(list){
  const r={total:0,pend:0,rea:0,rota:0,entr:0,nao:0,canc:0,qtd:0,qtdAberto:0,prev:0,entrVal:0,recebido:0,aReceber:0,entrNaoPagos:0,entrNaoPagosVal:0};
  for(const o of list){
    if(o.status==='cancelado'){r.canc++;continue}
    r.total++;r.qtd+=o.qtd;r.prev+=o.valorCent;
    if(o.status==='pendente')r.pend++;
    else if(o.status==='reagendado')r.rea++;
    else if(o.status==='em_rota')r.rota++;
    else if(o.status==='nao_entregue')r.nao++;
    else if(o.status==='entregue'){r.entr++;r.entrVal+=o.valorCent;if(!o.pago){r.entrNaoPagos++;r.entrNaoPagosVal+=o.valorCent}}
    if(OPEN.includes(o.status))r.qtdAberto+=o.qtd;
    if(o.pago)r.recebido+=o.valorCent;else r.aReceber+=o.valorCent;
  }
  return r;
}
const weight={nao_entregue:0,pendente:1,reagendado:1,em_rota:2,entregue:3,cancelado:4};
function sortOperational(a,b){return (weight[a.status]-weight[b.status])||String(a.criadoEm||'').localeCompare(String(b.criadoEm||''))}
function isLate(o){return OPEN.includes(o.status)&&o.dataEntrega<todayStr()}

/* ====================== mensagem do motoboy ====================== */
function buildRoute(list,date){
  const L=['*ROTA DE ENTREGAS — '+fmtDate(date)+'*',''];
  let q=0,v=0;
  list.forEach((o,i)=>{
    q+=o.qtd;const rec=o.pago?0:o.valorCent;v+=rec;
    L.push('*'+(i+1)+'. '+o.cliente+'*','Telefone: '+fmtPhone(o.telefone),'Quantidade: '+qtdTxt(o.qtd),'Valor a receber: '+brl(rec)+(o.pago?' (já pago)':''),'Localização: '+o.local);
    if(o.obs)L.push('Observações: '+o.obs);
    L.push('Status: '+ST[o.status].l,'');
  });
  L.push('*RESUMO DA ROTA*','Total de pedidos: '+list.length,'Total de resinas: '+q,'Total previsto para receber: '+brl(v));
  return L.join('\n');
}

/* ====================== interface comum ====================== */
function toast(msg,bad){const t=document.createElement('div');t.className='toast'+(bad?' bad':'');t.textContent=msg;$('#toasts').append(t);setTimeout(()=>t.remove(),bad?5200:2800)}
function openModal(html,bind){
  const m=$('#modal');m.innerHTML='<div class="sheet" role="dialog" aria-modal="true">'+html+'</div>';m.hidden=false;
  if(bind)bind(m);
  const f=m.querySelector('[data-autofocus]');if(f)f.focus();
}
function closeModal(){const m=$('#modal');m.hidden=true;m.innerHTML=''}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').hidden)closeModal()});
async function copyText(t,okMsg){
  try{await navigator.clipboard.writeText(t);toast(okMsg||'Copiado para a área de transferência');}
  catch(e){
    openModal('<h2>Copiar texto</h2><p style="margin:0;color:var(--muted)">Seu navegador não permitiu copiar sozinho. Selecione o texto abaixo e copie.</p><textarea class="in" id="cpy" rows="10" readonly></textarea><div class="row"><button class="btn primary" data-act="closeModal">Fechar</button></div>',m=>{const ta=m.querySelector('#cpy');ta.value=t;ta.focus();ta.select()});
  }
}
async function saveFile(name,data){
  try{
    const ext=name.split('.').pop().toLowerCase();
    const type=ext==='csv'?'text/csv;charset=utf-8':ext==='pdf'?'application/pdf':'application/octet-stream';
    const url=URL.createObjectURL(new Blob([data],{type:type}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
    toast('Arquivo salvo: '+name);
  }catch(e){toast('Não foi possível salvar o arquivo',true)}
}
function csvText(rows){return '﻿'+rows.map(r=>r.map(c=>{const s=String(c==null?'':c);return /[;"\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}).join(';')).join('\r\n')}
function pdfSafe(s){return String(s==null?'':s).replace(/[—–]/g,'-').replace(/[^\n\x20-\x7E -ÿ]/g,'?')}
function pdfBuild(title,blocks){
  const J=window.jspdf&&window.jspdf.jsPDF;if(!J)return null;
  const doc=new J({unit:'mm',format:'a4'});const M=14,maxW=210-2*M;let y=M;
  doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text(pdfSafe(title),M,y+5);y+=13;
  for(const b of blocks){
    if(b.gap){y+=b.gap;continue}
    const size=b.size||10;doc.setFont('helvetica',b.bold?'bold':'normal');doc.setFontSize(size);
    const lh=size*0.42+1.4;
    const lines=doc.splitTextToSize(pdfSafe(b.text),maxW-(b.indent||0));
    for(const ln of lines){if(y+lh>285){doc.addPage();y=M}doc.text(ln,M+(b.indent||0),y);y+=lh}
  }
  return doc.output('arraybuffer');
}
async function savePdf(name,title,blocks){
  const buf=pdfBuild(title,blocks);
  if(!buf){toast('Não foi possível montar o PDF agora. Tente de novo em instantes.',true);return}
  await saveFile(name,buf);
}
