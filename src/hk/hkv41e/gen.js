const fs=require('fs');const D=JSON.parse(fs.readFileSync('_D.json'));delete D.hk41ekornhill;
fs.writeFileSync('hkv41e.js',fs.readFileSync('src.js','utf8').replace('__D__',JSON.stringify(D)));
