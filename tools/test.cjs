'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const checks=[];
function check(name,fn){fn();checks.push(name);}
(async()=>{
 for(const file of ['runtime/content.bundle.js','Loader.js','background.js','popup.js','admin.js','src/corretor/services.js','src/core/dom-watch.js','src/core/catalog-store.js','src/ui/window-service.js']) check('Syntax: '+file,()=>assert.equal(cp.spawnSync(process.execPath,['--check',path.join(root,file)]).status,0));
 for(const module of JSON.parse(read('build-order.json')).modules) check('Isolated syntax: '+module.id,()=>assert.equal(cp.spawnSync(process.execPath,['--check',path.join(root,module.file)]).status,0));
 const manifest=JSON.parse(read('manifest.json'));
 check('Manifest references',()=>[...manifest.content_scripts.flatMap(c=>c.js),manifest.background.service_worker,manifest.action.default_popup,manifest.options_page].forEach(f=>assert.ok(fs.existsSync(path.join(root,f)))));
 check('Single checker and settings owner',()=>{ const bundle=read('runtime/content.bundle.js');assert.equal((bundle.match(/const spellCheckerModule =/g)||[]).length,1);assert.equal((bundle.match(/window.AjaModularOpenSettings =/g)||[]).length,1);assert.ok(!bundle.includes('handleNativeEndCustomerClick'));assert.ok(!bundle.includes('TEST_END_BUTTON_SELECTOR'));assert.ok(!bundle.includes('gemini-1.5-flash-latest'));assert.ok(!bundle.includes('github.io/AjaExtension/')); });
 check('Corrector uses DOM observation instead of polling',()=>{for(const file of ['src/tools/corretor.js','src/corretor/panel.js','src/corretor/interaction.js','src/corretor/dictionary.js'])assert.ok(!read(file).includes('setInterval('),file+' still polls');});
 check('Window controls keep close and minimize grouped',()=>{const source=read('src/ui/window-service.js');assert.ok(source.includes('group.append(button,closeButton)'));assert.ok(source.includes("'#am-close,"));assert.ok(source.includes('aja-window-actions'));});
 check('Mini dashboard drag is distinguished from click',()=>{const source=read('src/core/templates.js.inc');assert.ok(source.includes("popup.dataset.isDragging = 'true'"));assert.ok(source.includes('Math.hypot('));assert.ok(read('src/ui/components/createMiniDashboard.js').includes("const wasDragging = dashboard.dataset.isDragging === 'true'"));});
 check('Conversation timers inherit and refresh dark mode',()=>{const source=read('src/core/conversations.js.inc');assert.equal((source.match(/bubblesContainer\.classList\.toggle\('gcp-tema-escuro', CONFIG\.DARK_MODE\)/g)||[]).length,3);assert.ok(source.slice(source.indexOf('function updateTimerDisplay'),source.indexOf('function nextConversationForRotation')).includes("timerData.bubblesContainer.classList.toggle('gcp-tema-escuro', CONFIG.DARK_MODE)"));assert.ok(read('src/core/chat.js.inc').includes('timerManager.refreshAll();'));});
 check('Four global themes persist and update the dashboard palette',()=>require('./test-global-themes.cjs')());
 check('Timer theme CSS keeps root and dark rules separate',()=>{const source=read('src/ui/styles.js.inc');const root=source.indexOf(':root {'),dark=source.indexOf('.gcp-tema-escuro {');assert.ok(root>=0&&dark>root);assert.ok(source.slice(root,dark).includes('--purecloud-script-bubble-bg-normal: ${theme.timerBg}'));assert.match(source.slice(root,dark),/\}\s*$/);assert.match(source,/\.gcp-tema-escuro\s*\{[^{}]*--purecloud-script-bubble-bg-normal:\s*#1e1e1e/);});
 check('Conversation channel icons recognize native metadata and unknown messages',()=>{const source=read('src/core/conversations.js.inc');const code=source.slice(source.indexOf('    const channelIcon='),source.indexOf('    function mainLoop()'));const context={CONFIG:{PURECLOUD_SELECTORS:{ICON_SELECTOR_CALL:'call-icon'}}};vm.createContext(context);vm.runInContext(code,context);const el=attrs=>({getAttribute:key=>attrs[key]||null,closest:()=>null,matches:()=>false});const conv=(attrs={},nodes=[])=>({...el(attrs),querySelector:selector=>selector==='call-icon'&&attrs.call?{}:null,querySelectorAll:()=>nodes});for(const [label,expected] of [['Instagram Direct','instagram'],['WhatsApp','whatsapp'],['Chat do site','site'],['Aplicativo','app']])assert.equal(context.interactionChannel(conv({},[el({'aria-label':label})])),expected);assert.equal(context.interactionChannel(conv()),'chat');assert.equal(context.interactionChannel(conv({call:true},[el({'title':'WhatsApp'})])),'call');assert.ok(vm.runInContext('channelIcon.instagram.includes("<svg") && channelIcon.whatsapp.includes("<svg")',context));});
 check('Queue action is idempotent and only records a successful platform action',()=>{const source=read('src/tools/pausas.js');assert.ok(source.includes("clickableSlider.getAttribute('aria-checked') === 'true'"));assert.ok(source.includes('if (!jaEstaNaFila) clickableSlider.click()'));assert.ok(source.includes('if (executarLogicaNaFila(false)) registrarPausa(status)'));});
 check('Quick reply shortcut markup is valid',()=>assert.ok(!read('src/tools/respostas.js').includes('class"reply-hotkey-display"')));
 const catalogWindow={};const catalogEnv={window:catalogWindow,JSON,Error,Boolean,String,Array};vm.createContext(catalogEnv);vm.runInContext(read('src/core/catalog-store.js'),catalogEnv);const catalog=catalogWindow.AjaModularCatalogStore;
 check('Shared catalog store normalizes and rejects malformed records',()=>{const normalized=catalog.normalize([{title:'Teste',text:'Conteúdo'}]);assert.equal(normalized[0].isFavorite,false);assert.equal(normalized[0].hotkey,null);assert.throws(()=>catalog.normalize([{title:'Sem texto'}]));assert.equal(catalog.escapeHTML('<b>'), '&lt;b&gt;');});

 check('Module dependency graph, contracts and complete tool coverage',()=>require('./check-modules.cjs')(JSON.parse(read('build-order.json'))));
 const registryErrors=[];const registryEnv={window:{},console:{error:(...x)=>registryErrors.push(x)},document:{documentElement:{dataset:{}}}};
 vm.createContext(registryEnv);vm.runInContext(read('src/core/module-registry.js'),registryEnv);
 const registry=registryEnv.window.AjaModular;let live=1,started=0,shouldFail=true;
 registry.register('shared',[],ctx=>({read:()=>ctx.live}));
 registry.register('broken',[],()=>{if(shouldFail)throw Error('Fixture failure');return {}});
 registry.register('dependent',['broken'],()=>({}));
 registry.register('healthy',['shared'],ctx=>{started++;return{open:()=>ctx.live}});
 registry.start({get live(){return live}});live=2;
 check('Module failure is contained and shared values remain live',()=>{assert.equal(registry.get('shared').read(),2);assert.equal(registry.open('healthy'),2);assert.equal(registry.status().find(x=>x.id==='dependent').ready,false);assert.equal(registryErrors.length,2);});
 registry.start({get live(){return live}});
 check('Module setup does not duplicate on repeated initialization',()=>assert.equal(started,1));
 shouldFail=false;registry.retry();check('Retry loads recovered dependencies without restarting healthy modules',()=>{assert.ok(registry.status().every(x=>x.ready));assert.equal(started,1);});
 check('One extractor implementation and one F2 owner',()=>{const bundle=read('runtime/content.bundle.js');assert.equal((bundle.match(/window.executarExtracaoDocumento = function/g)||[]).length,1);assert.ok(!bundle.includes('validarCPF_Ext'));});
 const values=new Map();const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 let calls=[];let responses=[];
 const context={window:{localStorage:storage},fetch:async(url,options)=>{calls.push({url,options});return responses.shift();},console,document:{}};
 vm.createContext(context);vm.runInContext(read('src/corretor/services.js'),context);const api=context.window.AjaModularSpell;
 check('Corrupt dictionary recovers',()=>{values.set('ajamodular:pcs_spell_dict','{bad');assert.equal(api.readDictionary().length,0);});
 check('Storage isolation',()=>{values.set('pcs_spell_dict','["legacy"]');values.set('ajamodular:pcs_spell_dict','["Brisanet","brisanet"]');assert.equal(api.readDictionary().length,1);assert.equal(api.readDictionary()[0],'brisanet');assert.equal(values.get('pcs_spell_dict'),'["legacy"]');});
 check('Personal dictionary suppresses spelling only',()=>{const matches=[{offset:0,length:8,rule:{issueType:'misspelling'}},{offset:0,length:8,rule:{issueType:'grammar'}}];assert.equal(api.filterMatches(matches,'BRISANET',['brisanet']).length,1);assert.equal(api.filterMatches(matches,'BRISANET',[]).length,2);});

 const historyFactories={};let notifications=0;
 const historyEnvironment={window:{AjaModular:{register:(id,deps,fn)=>historyFactories[id]=fn}},document:{dispatchEvent:()=>notifications++},Event:class Event{},Date,JSON};
 vm.createContext(historyEnvironment);vm.runInContext(read('src/tools/historico-documentos.js'),historyEnvironment);
 const history=historyFactories['historico-documentos']({ajaStorage:storage});
 values.set('purecloudScript_idHistory','{}');history.record('00000000000');
 check('Document history recovers malformed data and limits records',()=>{for(let i=0;i<35;i++)history.record('00000000000');assert.equal(JSON.parse(values.get('purecloudScript_idHistory')).length,30);assert.equal(notifications,36);});
 const response=(status,data)=>({ok:status>=200&&status<300,status,json:async()=>data});
 values.set('ajamodular:aja_voice_gemini_api_key','fixture-only');
 responses=[response(200,{models:[{name:'models/embedding',supportedGenerationMethods:['embedContent']},{name:'models/test-flash',supportedGenerationMethods:['generateContent']}]}),response(200,{candidates:[{finishReason:'STOP',content:{parts:[{text:'OK'}]}}]})];
 assert.equal(await api.askGemini('test'),'OK');assert.equal(calls.length,2);assert.equal(calls[0].options.headers['x-goog-api-key'],'fixture-only');assert.ok(!calls[0].url.includes('fixture-only'));assert.equal(values.get('ajamodular:aja_voice_gemini_model'),'models/test-flash');checks.push('Gemini uses compatible ListModels and header authentication');
 calls=[];responses=[response(403,{})];await assert.rejects(api.askGemini('test'),/ListModels: 403/);assert.equal(calls.length,1);checks.push('Gemini rejects access failure without guessed models');
 const modelsResponse = () => response(200,{models:[{name:'models/test-flash',outputTokenLimit:16384,supportedGenerationMethods:['generateContent']}]});
 const generated = (reason,text) => response(200,{candidates:[{finishReason:reason,content:{parts:[{text}]}}]});
 calls=[];responses=[modelsResponse(),generated('MAX_TOKENS','partial'),generated('STOP','complete')];
 assert.equal(await api.askGemini('test',undefined,{maxOutputTokens:8192}),'complete');
 assert.equal(JSON.parse(calls[1].options.body).generationConfig.maxOutputTokens,8192);
 assert.equal(JSON.parse(calls[2].options.body).generationConfig.maxOutputTokens,16384);
 checks.push('Truncated Gemini response retries once with a larger bounded budget');
 calls=[];responses=[modelsResponse(),generated('MAX_TOKENS','partial'),generated('MAX_TOKENS','partial again')];
 await assert.rejects(api.askGemini('test'),/limite de tamanho/);assert.equal(calls.length,3);
 responses=[modelsResponse(),generated('SAFETY','partial')];await assert.rejects(api.askGemini('test'),/não concluiu/);
 responses=[modelsResponse(),generated(undefined,'partial')];await assert.rejects(api.askGemini('test'),/não concluiu/);
 checks.push('Interrupted and blocked responses never become successful reports');
 const iaSource=read('src/tools/ia.js');
 const parseSource=iaSource.slice(iaSource.indexOf('function parseReport(raw)'),iaSource.indexOf('                function formatMarkdown'));
 const parseReport=vm.runInNewContext('('+parseSource+')',{TABS_DB:'LOS - FTTH\tDescrição'});
 const complete='Relatório Técnico de Atendimento\n1. Introdução\nAtendi uma solicitação.\n2. Relato\nSem acesso.\n3. Procedimentos\nNão informado no relato.\n4. Conclusão\nNão informado no relato.';
 assert.throws(()=>parseReport('Relatório Técnico de Atendimento\n1. Introdução\nCliente sem acesso.'),/incompleto/);
 assert.throws(()=>parseReport(complete.replace('4. Conclusão\nNão informado no relato.','4. Conclusão')),/incompleto/);
 assert.equal(parseReport('<TAB>LOS - FTTH</TAB>\n'+complete).suggestedTab,'LOS - FTTH');
 assert.equal(parseReport(complete).finalReport,complete);
 assert.match(parseReport('<TAB>Inventada</TAB>\n'+complete).suggestedTab,/Não identificada/);
 checks.push('Report requires four nonempty sections and preserves final line without a tab');
 // Exercise the actual checker request method with two out-of-order responses.
 const checkerSource=read('src/tools/corretor.js');const method=checkerSource.slice(checkerSource.indexOf('async verificarTextoNaAPI()'),checkerSource.indexOf('                atualizarLinhasOnduladas')).trim().replace(/,$/,'').replace('async verificarTextoNaAPI()','async function()');
 const pending=[];context.ctx={safeFetch:null};context.ctx.safeFetch=()=>new Promise(resolve=>pending.push(resolve));context.URLSearchParams=URLSearchParams;
 const verify=vm.runInContext('('+method+')',context);const field={value:'first'};const checker={ultimoCampo:field,dicionarioPessoal:[],panel:{style:{display:'none'}},atualizarLinhasOnduladas(){},atualizarBadge(){}};
 const first=verify.call(checker);field.value='second';const second=verify.call(checker);
 pending[1](response(200,{matches:[{offset:0,length:6,message:'latest'}]}));await second;pending[0](response(200,{matches:[{offset:0,length:5,message:'stale'}]}));await first;assert.equal(checker.errosEncontrados[0].message,'latest');checks.push('Checker discards responses arriving out of order');
 let listener;const bg={URL,Set,Error,String,Object,chrome:{runtime:{onMessage:{addListener:fn=>listener=fn}}},fetch:()=>{throw Error('Unexpected network')}};vm.createContext(bg);vm.runInContext(read('background.js'),bg);let result;listener({action:'fetchAPI',url:'https://evil.example',options:{}},{},r=>result=r);assert.equal(result.success,false);checks.push('Background rejects unlisted hosts');
 checks.push(...await require('./test-presence.cjs')());
 checks.push(...require('./test-confirmation.cjs')());
 checks.push(...require('./test-yoda.cjs')());
 checks.push(...require('./test-evaluations.cjs')());
 checks.push(...require('./test-extrator.cjs')());
 checks.push(...await require('./test-voice.cjs')());
 checks.push(...await require('./test-local-spell.cjs')());
 checks.push(...require('./test-loader.cjs')());
 checks.push(...require('./test-clock.cjs')());
 checks.push(...await require('./test-maintenance.cjs')());
 checks.push(...await require('./test-catalogs.cjs')());
 checks.push(...require('./test-bau.cjs')());
 checks.push(...require('./test-productivity.cjs')());
 checks.push(...require('./test-auto-rotation.cjs')());
 checks.push(...require('./test-car-github.cjs')());
checks.push(...require('./test-module-audit.cjs')());
 checks.push(...require('./test-tool-visibility.cjs')());
 const report={passed:true,checks,sourceCommit:JSON.parse(read('source-inventory.json')).commit,liveGenesysTest:false,liveGeminiTest:false};fs.writeFileSync(path.join(root,'validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});






