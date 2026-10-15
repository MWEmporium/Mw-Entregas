'use strict';
/* Página de vendas: escolhe a quantidade, valida os dados e envia o pedido para aprovação.
   O preço mostrado aqui é só visual: quem decide o valor de verdade é a função do banco (criar_pedido_site). */
(function(){
  const WA='5561996140060';
  const PRICE={1:{por:8990,de:0},2:{por:11990,de:17980},3:{por:14990,de:26970}};
  const REGIOES=['Plano Piloto (Asa Sul, Asa Norte)','Sudoeste / Octogonal','Cruzeiro','Lago Sul','Lago Norte','Park Way','Jardim Botânico','Taguatinga','Águas Claras','Vicente Pires','Arniqueira','Ceilândia','Sol Nascente / Pôr do Sol','Samambaia','Recanto das Emas','Guará','SIA','SCIA / Estrutural','Núcleo Bandeirante','Candangolândia','Riacho Fundo','Riacho Fundo II','Gama','Santa Maria','Sobradinho','Sobradinho II','Fercal','Planaltina','Arapoanga','Paranoá','Itapoã','Varjão','São Sebastião','Brazlândia','Outra região do DF'];
  const $=s=>document.querySelector(s);
  const $$=s=>Array.prototype.slice.call(document.querySelectorAll(s));
  const brl=c=>'R$ '+(c/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const wa=t=>'https://wa.me/'+WA+(t?'?text='+encodeURIComponent(t):'');
  const loadedAt=Date.now();
  let qty=3;

  /* ---- Pixel da Meta: eventos (o PageView já é enviado no index.html). Não envia nome, telefone nem endereço. ---- */
  function track(ev,data){try{if(window.fbq)window.fbq('track',ev,data||{})}catch(e){}}
  function pixelItem(){const p=PRICE[qty];return{value:p.por/100,currency:'BRL',content_name:'Resina Extreme',content_type:'product',content_ids:['resina-extreme-'+qty],num_items:qty}}
  (function(){
    /* ViewContent: a pessoa chegou na seção de preços */
    const el=document.getElementById('ofertas');
    if(!el||!('IntersectionObserver' in window))return;
    const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){track('ViewContent',pixelItem());io.disconnect()}},{threshold:.3});
    io.observe(el);
  })();
  (function(){
    /* InitiateCheckout: a pessoa começou a preencher o formulário (uma vez só) */
    const f=document.getElementById('frm');let sent=false;
    const go=()=>{if(sent)return;sent=true;track('InitiateCheckout',pixelItem())};
    f.addEventListener('focusin',go);f.addEventListener('input',go);
  })();

  /* ---- links do WhatsApp ---- */
  const hi='Olá! Vi a Resina Extreme e quero tirar uma dúvida.';
  ['wa-top','wa-hero','wa-foot','wa-fab'].forEach(id=>{const a=document.getElementById(id);if(a)a.href=wa(hi)});
  const more=document.getElementById('wa-more');if(more)more.href=wa('Olá! Quero levar mais de 3 resinas. Podem me passar o valor?');

  /* ---- regiões ---- */
  const reg=$('#f-reg');
  REGIOES.forEach(r=>{const o=document.createElement('option');o.value=r;o.textContent=r;reg.appendChild(o)});

  /* ---- quantidade e resumo ---- */
  function setQty(n,scroll){
    qty=n;
    $$('.offer').forEach(b=>b.setAttribute('aria-checked',String(Number(b.dataset.qty)===n)));
    $$('#seg button').forEach(b=>b.setAttribute('aria-checked',String(Number(b.dataset.qty)===n)));
    const p=PRICE[n];
    $('#s-qty').textContent=n+(n===1?' resina':' resinas');
    $('#s-de-row').hidden=!p.de;$('#s-save-row').hidden=!p.de;
    if(p.de){$('#s-de').textContent=brl(p.de);$('#s-save').textContent=brl(p.de-p.por)}
    $('#s-total').textContent=brl(p.por);$('#s-total2').textContent=brl(p.por);
    if(scroll)document.getElementById('pedido').scrollIntoView({block:'start'});
  }
  $$('.offer').forEach(b=>b.addEventListener('click',()=>setQty(Number(b.dataset.qty),true)));
  $$('#seg button').forEach(b=>b.addEventListener('click',()=>setQty(Number(b.dataset.qty),false)));
  setQty(3,false);

  /* ---- máscara do telefone ---- */
  const tel=$('#f-tel');
  tel.addEventListener('input',()=>{
    let d=tel.value.replace(/\D/g,'').slice(0,11),o=d;
    if(d.length>10)o='('+d.slice(0,2)+') '+d.slice(2,7)+'-'+d.slice(7);
    else if(d.length>6)o='('+d.slice(0,2)+') '+d.slice(2,6)+'-'+d.slice(6);
    else if(d.length>2)o='('+d.slice(0,2)+') '+d.slice(2);
    tel.value=o;
  });

  /* ---- privacidade ---- */
  const priv=$('#priv');
  $('#open-priv').addEventListener('click',e=>{e.preventDefault();if(priv&&priv.showModal)priv.showModal();else alert(priv.textContent.trim())});

  /* ---- supabase ---- */
  let sb=null;
  try{
    const c=window.MW_CONFIG||{};
    const bad=v=>!v||/COLE|SEU_|AQUI/i.test(v);
    if(window.supabase&&!bad(c.SUPABASE_URL)&&!bad(c.SUPABASE_ANON_KEY))sb=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  }catch(e){sb=null}

  /* ---- validação ---- */
  const fields=[['f-nome','e-nome'],['f-tel','e-tel'],['f-reg','e-reg'],['f-end','e-end']];
  function clearErr(){fields.forEach(f=>{$('#'+f[0]).classList.remove('bad');$('#'+f[1]).textContent=''});$('#e-ok').textContent='';$('#e-form').innerHTML=''}
  function read(){
    const v={
      nome:$('#f-nome').value.replace(/\s+/g,' ').trim(),
      tel:$('#f-tel').value.replace(/\D/g,''),
      regiao:$('#f-reg').value,
      end:$('#f-end').value.trim(),
      ref:$('#f-ref').value.trim(),
      per:$('#f-per').value,
      pgto:(document.querySelector('input[name="pgto"]:checked')||{}).value||'',
      obs:$('#f-obs').value.trim(),
      ok:$('#f-ok').checked
    };
    if(v.tel.length>=12&&v.tel.indexOf('55')===0)v.tel=v.tel.slice(2);
    const errs={};
    if(v.nome.length<5||v.nome.indexOf(' ')<0)errs['f-nome']=['e-nome','Informe seu nome completo (nome e sobrenome).'];
    if(v.tel.length<10||v.tel.length>11)errs['f-tel']=['e-tel','Informe o WhatsApp com DDD, por exemplo (61) 99999-9999.'];
    if(!v.regiao)errs['f-reg']=['e-reg','Escolha a sua região do DF.'];
    if(v.end.length<8)errs['f-end']=['e-end','Informe o endereço completo, com quadra, conjunto e número.'];
    return {v:v,errs:errs};
  }
  function summaryText(v,id){
    const p=PRICE[qty];
    return 'Olá! Fiz um pedido no site da MW Entregas.\n'+(id?'Pedido: #'+id+'\n':'')+
      'Produto: Resina Extreme, '+qty+(qty===1?' resina':' resinas')+', '+brl(p.por)+' (frete grátis)\n'+
      'Nome: '+v.nome+'\nRegião: '+v.regiao+'\nEndereço: '+v.end+(v.ref?'\nReferência: '+v.ref:'')+
      '\nPagamento na entrega: '+v.pgto+(v.per?'\nMelhor horário: '+v.per:'')+'\nPode confirmar?';
  }

  /* ---- some o aviso de erro quando a pessoa corrige ---- */
  fields.forEach(f=>{
    const el=$('#'+f[0]);
    ['input','change'].forEach(ev=>el.addEventListener(ev,()=>{el.classList.remove('bad');$('#'+f[1]).textContent=''}));
  });
  $('#f-ok').addEventListener('change',()=>{$('#e-ok').textContent=''});

  /* ---- envio ---- */
  $('#frm').addEventListener('submit',async e=>{
    e.preventDefault();
    clearErr();
    const r=read(),v=r.v,keys=Object.keys(r.errs);
    if(keys.length||!v.ok){
      keys.forEach(k=>{$('#'+k).classList.add('bad');$('#'+r.errs[k][0]).textContent=r.errs[k][1]});
      if(!v.ok)$('#e-ok').textContent='Para enviar, marque que concorda em informar seus dados.';
      const first=keys.length?$('#'+keys[0]):$('#f-ok');first.focus();
      return;
    }
    if($('#f-site').value){showDone(v,'------');return}   /* campo-isca preenchido: é robô, finge que deu certo */
    if(Date.now()-loadedAt<2500){$('#e-form').textContent='Aguarde um instante e envie de novo.';return}
    const fallback=()=>{
      $('#e-form').innerHTML='Não foi possível enviar o pedido agora. Tente de novo ou <a href="'+wa(summaryText(v,''))+'" target="_blank" rel="noopener">envie os dados pelo WhatsApp</a>.';
    };
    if(!sb){fallback();return}
    const btn=$('#btn-send');btn.disabled=true;btn.textContent='Enviando…';
    try{
      const res=await sb.rpc('criar_pedido_site',{p_nome:v.nome,p_telefone:v.tel,p_qtd:qty,p_regiao:v.regiao,p_endereco:v.end,p_referencia:v.ref||null,p_forma_pgto:v.pgto,p_periodo:v.per||null,p_obs:v.obs||null});
      if(res.error){
        if(res.error.code==='P0001'&&res.error.message)$('#e-form').textContent=res.error.message;else fallback();
      }else{
        track('Purchase',pixelItem());   /* só quando o banco aceitou o pedido (não dispara para robô nem em erro) */
        showDone(v,String(res.data||'').slice(-6).toUpperCase()||'------');
      }
    }catch(err){fallback()}
    btn.disabled=false;btn.textContent='Enviar pedido';
  });

  function showDone(v,id){
    $('#d-id').textContent='#'+id;
    $('#d-pg').textContent=v.pgto.toLowerCase();
    $('#d-wa').href=wa(summaryText(v,id==='------'?'':id));
    $('#frm').hidden=true;
    const d=$('#done');d.hidden=false;d.focus();
    document.getElementById('pedido').scrollIntoView({block:'start'});
  }
  $('#d-again').addEventListener('click',()=>{
    $('#frm').reset();setQty(qty,false);
    $('#done').hidden=true;$('#frm').hidden=false;
    $('#f-nome').focus();
  });

  /* ---- vídeos: só baixam quando chegam perto da tela; tocam mudos ao aparecer e pausam ao sair ---- */
  (function(){
    const vids=$$('video.lazyvid');if(!vids.length)return;
    const load=v=>{if(v.dataset.src){v.src=v.dataset.src;v.removeAttribute('data-src');v.load()}};
    if(!('IntersectionObserver' in window)){return}   /* sem suporte: fica o cartaz e o botão de play (toca ao tocar) */
    vids.forEach(v=>v.addEventListener('play',()=>load(v)));
    const near=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){load(e.target);near.unobserve(e.target)}}),{rootMargin:'300px 0px'});
    const view=new IntersectionObserver(es=>es.forEach(e=>{
      const v=e.target;
      if(e.isIntersecting){load(v);const p=v.play();if(p&&p.catch)p.catch(()=>{})}else v.pause();
    }),{threshold:.5});
    vids.forEach(v=>{near.observe(v);view.observe(v)});
  })();
})();
