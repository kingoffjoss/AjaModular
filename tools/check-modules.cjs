const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
module.exports=function validate(order){
 const registered=new Map();const sandbox={window:{AjaModular:{register(id,after,factory){assert.ok(!registered.has(id),'Duplicate module '+id);registered.set(id,{after,factory});}}}};
 vm.createContext(sandbox);
 for(const item of order.modules){vm.runInContext(fs.readFileSync(path.join(root,item.file),'utf8'),sandbox,{filename:item.file});assert.ok(registered.has(item.id),'Missing registration '+item.id);assert.deepEqual(Array.from(registered.get(item.id).after),item.after,'Dependency manifest mismatch '+item.id);}
 const done=new Set(),active=new Set();function visit(id){assert.ok(registered.has(id),'Missing dependency '+id);assert.ok(!active.has(id),'Dependency cycle '+id);if(done.has(id))return;active.add(id);registered.get(id).after.forEach(visit);active.delete(id);done.add(id);}registered.forEach((v,id)=>visit(id));
 const listed=new Set(order.modules.map(x=>path.basename(x.file)));
 for(const file of fs.readdirSync(path.join(root,'src/tools')))assert.ok(listed.has(file),'Unregistered tool '+file);
 return registered.size;
};
