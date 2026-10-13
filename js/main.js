'use strict';
/* ====================== login, cadastro e inicialização ====================== */
/* ---- visual da tela de login (so aparencia; a logica de autenticacao esta mais abaixo) ---- */
const _ai=d=>'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+d+'</svg>';
const AI={
  mail:_ai('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7.5 8.5 6 8.5-6"/>'),
  user:_ai('<circle cx="12" cy="8" r="4"/><path d="M4.5 20c.8-3.6 3.7-5.5 7.5-5.5s6.7 1.9 7.5 5.5"/>'),
  lock:_ai('<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  eye:_ai('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>'),
  eyeoff:_ai('<path d="M3 3l18 18"/><path d="M10.6 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.4 7.4C4 9 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.5 0 2.8-.4 4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  moto:_ai('<circle cx="5.5" cy="16.5" r="3"/><circle cx="18.5" cy="16.5" r="3"/><path d="M5.5 16.5 9 9h4.5l3 7.5M9 9 7.5 6.5H5M13.5 9l1.5-3h2.5"/>'),
  shield:_ai('<path d="M12 3 4.5 6v5.5c0 4.5 3.1 8 7.5 9.5 4.4-1.5 7.5-5 7.5-9.5V6L12 3Z"/><path d="m8.8 12 2.4 2.4 4.2-4.6"/>'),
  pin:_ai('<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>')
};
const AUTH_BG='<svg class="a-bg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">'+
  '<g fill="none" stroke="#FF6A13" stroke-linecap="round">'+
  '<path d="M-20 820C220 720 330 860 560 770S900 640 1180 700 1380 640 1480 600" stroke-width="3" stroke-dasharray="2 16" opacity=".55"/>'+
  '<path d="M-20 860C240 770 350 890 590 810S920 690 1200 750 1400 700 1480 660" stroke-width="1.5" opacity=".25"/></g>'+
  '<g fill="#FF6A13" opacity=".7"><circle cx="1180" cy="700" r="6"/><circle cx="560" cy="770" r="5"/></g>'+
  '<g fill="none" stroke="#9FB6CC" stroke-width="1.4" opacity=".16" stroke-linejoin="round">'+
  '<path d="M70 610l44-18 44 18v52l-44 18-44-18zM70 610l44 18 44-18M114 628v52"/>'+
  '<path d="M170 700l36-14 36 14v42l-36 14-36-14zM170 700l36 14 36-14M206 714v42"/>'+
  '<path d="M1290 160l40-16 40 16v46l-40 16-40-16zM1290 160l40 16 40-16M1330 176v46"/></g>'+
  '<g fill="#0E3A5B" opacity=".5"><path d="M0 900V760h60v-40h50v60h40v-90h60v110h50v-70h70v100h40v-60h60v90h50v-120h60v80h70v-50h60v100h60v-70h50v90H0Z" transform="translate(0 20)"/></g></svg>';
function authBox(inner){
  return '<div class="authbox">'+AUTH_BG+
    '<div class="a-hero"><h1 class="a-h1"><img class="a-logo" src="images/logo-mw.png" alt="MW Entregas" width="1270" height="500"></h1>'+
    '<p class="a-tag">Agilidade e segurança<b>na sua entrega!</b></p></div>'+
    '<div class="a-card">'+inner+'</div>'+
    '<ul class="a-feats"><li><img src="images/icone-moto.png" alt="" width="400" height="320"><span>Entregas<br>rápidas</span></li><li>'+AI.shield+'<span>Mais<br>segurança</span></li><li>'+AI.pin+'<span>Em toda<br>a cidade</span></li></ul>'+
  '</div>';
}
const aField=(id,label,icon,attrs,extra)=>'<div class="fld"><label for="'+id+'">'+label+'</label><div class="a-f">'+icon+'<input class="in" id="'+id+'" '+attrs+'>'+(extra||'')+'</div></div>';
const aEye=id=>'<button type="button" class="a-eye" data-act="togglePass-'+id+'" aria-label="Mostrar senha" aria-pressed="false">'+AI.eye+'</button>';
H.togglePass=(el,id)=>{
  const i=document.getElementById(id);if(!i)return;
  const show=i.type==='password';
  i.type=show?'text':'password';
  el.setAttribute('aria-pressed',show?'true':'false');
  el.setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');
  el.innerHTML=show?AI.eyeoff:AI.eye;
  i.focus();
};
function renderAuth(){
  $('#side').innerHTML='';$('#top').innerHTML='';$('#bottom').innerHTML='';
  let h;
  const mail=S.session&&S.session.user&&S.session.user.email?esc(S.session.user.email):'';
  if(S.setup){
    h=authBox('<div class="panel" style="display:grid;gap:10px"><h2 style="font-size:19px">Falta conectar o banco de dados</h2><p style="margin:0">Abra o arquivo <b>config.js</b> e cole o endereço e a chave pública do seu projeto Supabase. O passo a passo está no arquivo PASSO-A-PASSO.md.</p></div>');
  }else if(!S.ready){
    h=authBox('<div class="empty panel"><strong>Carregando…</strong></div>');
  }else if(S.session&&S.status==='pendente'){
    h=authBox('<div class="panel" style="display:grid;gap:12px"><h2 style="font-size:19px">Cadastro recebido</h2><p style="margin:0">Sua conta <b>'+mail+'</b> foi criada. Agora o dono do aplicativo precisa liberar o seu acesso. Assim que ele liberar, toque em “Verificar agora”.</p><div class="row"><button class="btn primary" data-act="recheck">Verificar agora</button><button class="btn" data-act="logout">Sair</button></div></div>');
  }else if(S.session&&S.status==='bloqueado'){
    h=authBox('<div class="panel" style="display:grid;gap:12px"><h2 style="font-size:19px">Acesso não liberado</h2><p style="margin:0">A conta <b>'+mail+'</b> não tem acesso ao MW ENTREGAS. Fale com o dono do aplicativo se isso for um engano.</p><div class="row"><button class="btn" data-act="recheck">Verificar de novo</button><button class="btn" data-act="logout">Sair</button></div></div>');
  }else if(S.session&&!S.me){
    h=authBox('<div class="panel" style="display:grid;gap:12px"><h2 style="font-size:19px">Conta sem permissão</h2><p style="margin:0">Você entrou como <b>'+mail+'</b>, mas essa conta ainda não foi liberada para usar o MW ENTREGAS. Peça ao dono do aplicativo para liberar o acesso.</p><div class="row"><button class="btn" data-act="recheck">Verificar de novo</button><button class="btn" data-act="logout">Sair</button></div></div>');
  }else if(S.authMode==='signup'){
    h=authBox('<form class="a-form" id="signupForm" novalidate>'+
      '<div class="a-title"><h2>Criar conta</h2><p>Depois de criar a conta, o dono do aplicativo precisa liberar o seu acesso para você ver os pedidos.</p></div>'+
      aField('s-nome','Seu nome',AI.user,'autocomplete="name" maxlength="80"')+
      aField('s-email','E-mail',AI.mail,'type="email" inputmode="email" autocomplete="username" autocapitalize="none"')+
      '<div class="fld"><label for="s-pass">Senha</label><div class="a-f">'+AI.lock+'<input class="in" id="s-pass" type="password" autocomplete="new-password">'+aEye('s-pass')+'</div><span class="hint">Mínimo de 8 caracteres.</span></div>'+
      aField('s-pass2','Repita a senha',AI.lock,'type="password" autocomplete="new-password"',aEye('s-pass2'))+
      '<div class="errmsg" id="s-err" role="alert"></div>'+
      '<button class="btn primary a-go" type="submit" id="s-btn">Criar conta</button>'+
      '<div class="a-or"><span>Já tem conta?</span></div>'+
      '<button class="btn" type="button" data-act="authMode-login">Já tenho conta</button></form>');
  }else{
    h=authBox('<form class="a-form" id="loginForm" novalidate>'+
      '<div class="a-title"><h2>Bem-vindo(a)!</h2><p>Faça seu login para continuar</p></div>'+
      (S.authInfo?'<div class="banner" style="margin:0" role="status">'+esc(S.authInfo)+'</div>':'')+
      aField('l-email','E-mail',AI.user,'type="email" inputmode="email" autocomplete="username" autocapitalize="none" data-autofocus')+
      aField('l-pass','Senha',AI.lock,'type="password" autocomplete="current-password"',aEye('l-pass'))+
      '<div class="errmsg" id="l-err" role="alert"></div>'+
      '<button class="btn primary a-go" type="submit" id="l-btn">Entrar</button>'+
      '<div class="a-or"><span>Ainda não tem conta?</span></div>'+
      '<button class="btn" type="button" data-act="authMode-signup">Criar conta</button></form>');
  }
  $('#main').innerHTML=h;
  const f=$('#l-email')||$('#s-nome');
  /* no celular, nao abre o teclado sozinho (ele taparia o visual); no computador foca o primeiro campo */
  if(f&&!(window.matchMedia&&matchMedia('(pointer:coarse)').matches))f.focus();
}
document.addEventListener('submit',e=>{
  if(!e.target)return;
  if(e.target.id==='loginForm'){e.preventDefault();H.login()}
  else if(e.target.id==='signupForm'){e.preventDefault();H.signup()}
});
H.authMode=(el,arg)=>{S.authMode=arg==='signup'?'signup':'login';S.authInfo='';renderAuth()};
H.login=async()=>{
  const email=$('#l-email').value.trim(),pass=$('#l-pass').value,err=$('#l-err'),btn=$('#l-btn');
  err.textContent='';
  if(!email||!pass){err.textContent='Informe o e-mail e a senha.';return}
  btn.disabled=true;btn.textContent='Entrando…';
  const res=await S.sb.auth.signInWithPassword({email:email,password:pass});
  if(res.error){
    const m=res.error.message||'';
    err.textContent=/invalid login/i.test(m)?'E-mail ou senha incorretos.':/not confirmed/i.test(m)?'Confirme seu e-mail pelo link que enviamos e tente de novo.':'Não foi possível entrar: '+m;
    btn.disabled=false;btn.textContent='Entrar';return;
  }
  S.session=res.data.session;S.authInfo='';
  await startApp();
};
H.signup=async()=>{
  const nome=$('#s-nome').value.trim().replace(/\s+/g,' '),email=$('#s-email').value.trim(),pass=$('#s-pass').value,pass2=$('#s-pass2').value,err=$('#s-err'),btn=$('#s-btn');
  err.textContent='';
  if(nome.length<2){err.textContent='Informe o seu nome.';$('#s-nome').focus();return}
  if(!/^\S+@\S+\.\S+$/.test(email)){err.textContent='Informe um e-mail válido.';$('#s-email').focus();return}
  if(pass.length<8){err.textContent='A senha precisa ter pelo menos 8 caracteres.';$('#s-pass').focus();return}
  if(pass!==pass2){err.textContent='As duas senhas não são iguais.';$('#s-pass2').focus();return}
  btn.disabled=true;btn.textContent='Criando conta…';
  const res=await S.sb.auth.signUp({email:email,password:pass,options:{data:{nome:nome}}});
  const fail=msg=>{err.textContent=msg;btn.disabled=false;btn.textContent='Criar conta'};
  if(res.error){
    const m=res.error.message||'';
    if(/already registered|already been registered/i.test(m))return fail('Este e-mail já tem conta. Toque em “Já tenho conta” e entre.');
    if(/signups? (not allowed|(is|are) disabled)|signup.*disabled/i.test(m))return fail('O cadastro de novas contas está desligado. Peça ao dono do aplicativo para criar o seu acesso.');
    if(/rate limit|too many|security purposes/i.test(m))return fail('Muitas tentativas seguidas. Espere alguns minutos e tente de novo.');
    if(/password/i.test(m))return fail('A senha não foi aceita: '+m);
    return fail('Não foi possível criar a conta: '+m);
  }
  const u=res.data&&res.data.user;
  if(res.data&&res.data.session){
    S.session=res.data.session;S.authInfo='';
    await startApp();return;
  }
  if(u&&Array.isArray(u.identities)&&u.identities.length===0)return fail('Este e-mail já tem conta. Toque em “Já tenho conta” e entre.');
  S.authMode='login';
  S.authInfo='Conta criada. Enviamos um e-mail de confirmação para '+email+'. Confirme pelo link e depois entre aqui. O dono ainda precisa liberar o seu acesso.';
  renderAuth();
};
async function stopApp(){
  try{if(S.chan){await S.sb.removeChannel(S.chan)}}catch(e){}
  S.chan=null;S.orders=[];S.loaded=false;S.err=null;S.me=null;S.canEdit=false;S.motoboy=false;S.hist=[];S.status=null;S.team=[];S.teamErr=null;
}
H.logout=async()=>{
  closeModal();
  await stopApp();
  try{await S.sb.auth.signOut()}catch(e){}
  S.session=null;S.view='dash';S.params={};S.authMode='login';S.authInfo='';
  render();
};
H.recheck=async()=>{
  if(!S.session)return;
  await startApp();
  if(!S.me)toast('O acesso ainda não foi liberado');
};
async function startApp(){
  S.ready=true;S.err=null;
  try{if(S.chan){await S.sb.removeChannel(S.chan)}}catch(e){}
  S.chan=null;
  const uid=S.session.user.id;
  const pr=await S.sb.from('perfis').select('id,nome,papel').eq('id',uid).maybeSingle();
  if(pr.error){S.me=null;S.session=null;render();toast('Não foi possível verificar sua conta: '+pr.error.message,true);return}
  if(!pr.data){S.me=null;S.status=null;render();return}
  if(pr.data.papel!=='admin'&&pr.data.papel!=='motoboy'){
    S.me=null;S.status=pr.data.papel;render();return;
  }
  S.status=null;
  S.me=pr.data;S.canEdit=pr.data.papel==='admin';S.motoboy=pr.data.papel==='motoboy';
  S.view='dash';S.params={};
  try{await loadOrders()}catch(e){S.err=e;S.loaded=true}
  if(S.canEdit)await loadTeam();
  S.chan=S.sb.channel('mw-entregas')
    .on('postgres_changes',{event:'*',schema:'public',table:'pedidos'},()=>scheduleReload())
    .on('postgres_changes',{event:'*',schema:'public',table:'historico'},()=>{if(S.view==='detalhe')loadHist()})
    .on('postgres_changes',{event:'*',schema:'public',table:'perfis'},()=>{if(S.canEdit)scheduleTeam()})
    .subscribe();
  render();
}
async function init(){
  S.today=todayStr();S.authMode='login';S.authInfo='';
  const cfg=window.MW_CONFIG||{};
  const bad=v=>!v||/COLE|SEU_|AQUI/i.test(v);
  if(bad(cfg.SUPABASE_URL)||bad(cfg.SUPABASE_ANON_KEY)||!window.supabase){S.setup=true;S.ready=true;render();return}
  S.sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  render();
  const sess=await S.sb.auth.getSession();
  S.session=sess.data&&sess.data.session?sess.data.session:null;
  S.ready=true;
  S.sb.auth.onAuthStateChange((evt)=>{
    if(evt==='SIGNED_OUT'&&S.session){setTimeout(()=>{S.session=null;S.me=null;S.status=null;stopApp().then(render)},0)}
  });
  if(S.session)await startApp();else render();
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden||!S.ready)return;
  const t=todayStr();
  if(t!==S.today){S.today=t;if(S.me)render()}
  if(S.me){scheduleReload();if(S.canEdit)scheduleTeam()}
  else if(S.session&&S.status==='pendente'&&!S.checking){S.checking=true;startApp().finally(()=>{S.checking=false})}
});
window.addEventListener('online',()=>{if(S.me)scheduleReload()});
init();
