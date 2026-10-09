'use strict';
/* ====================== login e inicialização ====================== */
function authBox(inner){
  return '<div class="authbox"><div class="authbrand">MW ENTREGAS<small>Pedidos e rotas</small></div>'+inner+'</div>';
}
function renderAuth(){
  $('#side').innerHTML='';$('#top').innerHTML='';$('#bottom').innerHTML='';
  let h;
  if(S.setup){
    h=authBox('<div class="panel" style="display:grid;gap:10px"><h2 style="font-size:19px">Falta conectar o banco de dados</h2><p style="margin:0">Abra o arquivo <b>config.js</b> e cole o endereço e a chave pública do seu projeto Supabase. O passo a passo está no arquivo PASSO-A-PASSO.md.</p></div>');
  }else if(!S.ready){
    h=authBox('<div class="empty panel"><strong>Carregando…</strong></div>');
  }else if(S.session&&!S.me){
    h=authBox('<div class="panel" style="display:grid;gap:12px"><h2 style="font-size:19px">Conta sem permissão</h2><p style="margin:0">Você entrou como <b>'+esc(S.session.user.email||'')+'</b>, mas essa conta ainda não foi liberada para usar o MW ENTREGAS. Peça ao dono do aplicativo para liberar o acesso.</p><button class="btn" data-act="logout">Sair</button></div>');
  }else{
    h=authBox('<form class="panel" id="loginForm" style="display:grid;gap:14px" novalidate>'+
      '<h2 style="font-size:20px">Entrar</h2>'+
      '<div class="fld"><label for="l-email">E-mail</label><input class="in" id="l-email" type="email" inputmode="email" autocomplete="username" autocapitalize="none" data-autofocus></div>'+
      '<div class="fld"><label for="l-pass">Senha</label><input class="in" id="l-pass" type="password" autocomplete="current-password"></div>'+
      '<div class="errmsg" id="l-err" role="alert"></div>'+
      '<button class="btn primary" type="submit" id="l-btn">Entrar</button></form>');
  }
  $('#main').innerHTML=h;
  const f=$('#l-email');if(f)f.focus();
}
document.addEventListener('submit',e=>{
  if(e.target&&e.target.id==='loginForm'){e.preventDefault();H.login()}
});
H.login=async()=>{
  const email=$('#l-email').value.trim(),pass=$('#l-pass').value,err=$('#l-err'),btn=$('#l-btn');
  err.textContent='';
  if(!email||!pass){err.textContent='Informe o e-mail e a senha.';return}
  btn.disabled=true;btn.textContent='Entrando…';
  const res=await S.sb.auth.signInWithPassword({email:email,password:pass});
  if(res.error){
    err.textContent=/invalid login/i.test(res.error.message)?'E-mail ou senha incorretos.':'Não foi possível entrar: '+res.error.message;
    btn.disabled=false;btn.textContent='Entrar';return;
  }
  S.session=res.data.session;
  await startApp();
};
async function stopApp(){
  try{if(S.chan){await S.sb.removeChannel(S.chan)}}catch(e){}
  S.chan=null;S.orders=[];S.loaded=false;S.err=null;S.me=null;S.canEdit=false;S.motoboy=false;S.hist=[];
}
H.logout=async()=>{
  closeModal();
  await stopApp();
  try{await S.sb.auth.signOut()}catch(e){}
  S.session=null;S.view='dash';S.params={};
  render();
};
async function startApp(){
  S.ready=true;S.err=null;
  const uid=S.session.user.id;
  const pr=await S.sb.from('perfis').select('id,nome,papel').eq('id',uid).maybeSingle();
  if(pr.error){S.me=null;S.session=null;render();toast('Não foi possível verificar sua conta: '+pr.error.message,true);return}
  if(!pr.data){S.me=null;render();return}
  S.me=pr.data;S.canEdit=pr.data.papel==='admin';S.motoboy=pr.data.papel==='motoboy';
  S.view='dash';S.params={};
  try{await loadOrders()}catch(e){S.err=e;S.loaded=true}
  S.chan=S.sb.channel('mw-entregas')
    .on('postgres_changes',{event:'*',schema:'public',table:'pedidos'},()=>scheduleReload())
    .on('postgres_changes',{event:'*',schema:'public',table:'historico'},()=>{if(S.view==='detalhe')loadHist()})
    .subscribe();
  render();
}
async function init(){
  S.today=todayStr();
  const cfg=window.MW_CONFIG||{};
  const bad=v=>!v||/COLE|SEU_|AQUI/i.test(v);
  if(bad(cfg.SUPABASE_URL)||bad(cfg.SUPABASE_ANON_KEY)||!window.supabase){S.setup=true;S.ready=true;render();return}
  S.sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  render();
  const sess=await S.sb.auth.getSession();
  S.session=sess.data&&sess.data.session?sess.data.session:null;
  S.ready=true;
  S.sb.auth.onAuthStateChange((evt)=>{
    if(evt==='SIGNED_OUT'&&S.session){setTimeout(()=>{S.session=null;S.me=null;stopApp().then(render)},0)}
  });
  if(S.session)await startApp();else render();
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden||!S.ready)return;
  const t=todayStr();
  if(t!==S.today){S.today=t;if(S.me)render()}
  if(S.me)scheduleReload();
});
window.addEventListener('online',()=>{if(S.me)scheduleReload()});
init();
