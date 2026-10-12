window.AjaModular.register('bau-assistente', [], function() {
 'use strict';
 const tokens = ['ADAPTADOR','CAMINHO','DISPOSITIVO','HOST','ID_PACOTE','IMPRESSORA','INTERFACE','IP_DESTINO','IP_DNS','NOME_DA_PASTA','NOME_DA_REDE','NOME_DO_FICHEIRO','NOME_OU_PADRAO','NOME_SERVICO','NOME','PACOTE','PID','PORTA','PROGRAMA','ROTULO','SERVICO','TAREFA'];
 const pattern = new RegExp('\\b('+tokens.join('|')+')\\b','g');
 const workflows = /* bundled-defaults:bauRoteiros */ [];
 function fields(command) { return [...new Set(command.match(pattern) || [])]; }
 function render(command, values, os) {
  let quote = '', index = 0, result = '';
  const escape = (value, mode) => {
   if (mode === "'") return os === 'win' ? value.replace(/'/g,"''") : value.replace(/'/g,"'\\''");
   if (mode === '"') return os === 'win' ? value.replace(/`/g,'``').replace(/\$/g,'`$').replace(/"/g,'`"') : value.replace(/[\\$`"!]/g,'\\$&');
   return "'" + escape(value,"'") + "'";
  };
  const matcher = new RegExp(pattern.source,'y');
  while(index < command.length) {
   matcher.lastIndex=index; const match=matcher.exec(command);
   if(match && (index===0 || !/[\w]/.test(command[index-1]))) {
    const key=match[0],value=values[key];
    if (value !== undefined && value !== '') {
     if (typeof value !== 'string' || /[\r\n\0]/.test(value)) throw Error('Use uma única linha em '+key+'.');
     if (key==='PORTA' && (!/^\d+$/.test(value) || +value<1 || +value>65535)) throw Error('PORTA deve estar entre 1 e 65535.');
     if (key==='PID' && !/^[1-9]\d*$/.test(value)) throw Error('PID deve ser um número positivo.');
     result += !quote && ['PID','PORTA'].includes(key) ? value : escape(value,quote);
    } else result += key;
    index += key.length;continue;
   }
   const char=command[index];
   if ((os==='win' && char==='`' && quote!=="'") || (os!=='win' && char==='\\' && quote!=="'")) {result+=command.slice(index,index+2);index+=2;continue;}
   if (char==="'" || char==='"') {if(!quote)quote=char;else if(quote===char)quote='';}
   result+=char;index++;
  }
  return result;
 }
 return {fields,render,workflows};
});
