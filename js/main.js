'use strict';
/* ====================== login, cadastro e inicialização ====================== */
function authBox(inner){
  return '<div class="authbox"><div class="authbrand">MW ENTREGAS<small>Pedidos e rotas</small></div>'+inner+'</div>';
}
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
    h=authBox('<form class="panel" id="signupForm" style="display:grid;gap:14px" novalidate>'+
      '<h2 style="font-size:20px">Criar conta</h2>'+
      '<p class="small" style="margin:0">Depois de criar a conta, o dono do aplicativo precisa liberar o seu acesso para você ver os pedidos.</p>'+
      '<div class="fld"><label for="s-nome">Seu nome</label><input class="in" id="s-nome" autocomplete="name" maxlength="80"></div>'+
      '<div class="fld"><label for="s-email">E-mail</label><input class="in" id="s-email" type="email" inputmode="email" autocomplete="username" autocapitalize="none"></div>'+
      '<div class="fld"><label for="s-pass">Senha</label><input class="in" id="s-pass" type="password" autocomplete="new-password"><span class="hint">Mínimo de 8 caracteres.</span></div>'+
      '<div class="fld"><label for="s-pass2">Repita a senha</label><input class="in" id="s-pass2" type="password" autocomplete="new-password"></div>'+
      '<div class="errmsg" id="s-err" role="alert"></div>'+
      '<button class="btn primary" type="submit" id="s-btn">Criar conta</button>'+
      '<button class="btn" type="button" data-act="authMode-login">Já tenho conta</button></form>');
  }else{
    h=authBox('<form class="panel" id="loginForm" style="display:grid;gap:14px" novalidate>'+
      '<h2 style="font-size:20px">Entrar</h2>'+
      (S.authInfo?'<div class="banner" style="margin:0" role="status">'+esc(S.authInfo)+'</div>':'')+
      '<div class="fld"><label for="l-email">E-mail</label><input class="in" id="l-email" type="email" inputmode="email" autocomplete="username" autocapitalize="none" data-autofocus></div>'+
      '<div class="fld"><label for="l-pass">Senha</label><input class="in" id="l-pass" type="password" autocomplete="current-password"></div>'+
      '<div class="errmsg" id="l-err" role="alert"></div>'+
      '<button class="btn primary" type="submit" id="l-btn">Entrar</button>'+
      '<button class="btn" type="button" data-act="authMode-signup">Criar conta</button></form>');
  }
  $('#main').innerHTML=h;
  const f=$('#l-email')||$('#s-nome');if(f)f.focus();
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
