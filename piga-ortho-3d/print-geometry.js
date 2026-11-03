/* PIGA ORTHO 3D 3MF technical geometry packaging v1. No print profile or medical release. */
(function(root,factory){const k=typeof module==='object'&&module.exports?require('./movement-core.js'):root.PigaMovementCore;const api=factory(k);if(typeof module==='object'&&module.exports)module.exports=api;else root.PigaPrintGeometry=api;})(typeof globalThis!=='undefined'?globalThis:this,C=>{'use strict';
 if(!C)throw Error('Movement core required');
 const enc=new TextEncoder();
 function topology(coords,precision=1e-4){
   if(!(coords instanceof Float32Array)||coords.length%9!==0)throw Error('Dreiecksmesh ungültig.');
   const faces=coords.length/9;
   if(faces<4||faces>160000)return{status:'UNKNOWN',reason:'Mesh außerhalb des geprüften Topologiebereichs.',triangles:faces};
   const edges=new Map();
   const point=i=>[
     Math.round(coords[i]/precision),
     Math.round(coords[i+1]/precision),
     Math.round(coords[i+2]/precision)
   ].join(',');
   let bad=0;
   for(let i=0;i<coords.length;i+=9){
     const p=[point(i),point(i+3),point(i+6)];
     if(new Set(p).size!==3){bad++;continue;}
     for(const [a,b] of [[0,1],[1,2],[2,0]]){
       const pair=p[a]<p[b]?[p[a],p[b],1]:[p[b],p[a],-1];
       const key=pair[0]+'|'+pair[1],rec=edges.get(key)||{count:0,winding:0};
       rec.count++;rec.winding+=pair[2];edges.set(key,rec);
     }
   }
   let boundary=0,nonManifold=0,winding=0;
   for(const {count,winding:w} of edges.values()){
     if(count===1)boundary++;else if(count!==2)nonManifold++;else if(w!==0)winding++;
   }
   const clean=bad===0&&boundary===0&&nonManifold===0&&winding===0;
   return{status:clean?'PASS':'BLOCK',triangles:faces,degenerateFaces:bad,boundaryEdges:boundary,nonManifoldEdges:nonManifold,inconsistentWindingEdges:winding,
     reason:clean?'Geschlossene konsistente Dreiecksoberfläche im technischen Gittertest.':'Offene, doppelt belegte oder inkonsistent orientierte Kanten. Keine Druckfreigabe.',
     toleranceMm:precision};
 }
 function to3mf(objects){
   if(!Array.isArray(objects)||objects.length<1||objects.length>28)throw Error('1–28 Zahnobjekte erforderlich.');
   let total=0,xmlParts=[],build=[];
   objects.forEach((obj,index)=>{
     if(!C.FDI.test(String(obj.fdi||'')))throw Error('3MF: FDI-Zuordnung ungültig.');
     const v=obj.coords;
     if(!(v instanceof Float32Array)||v.length%9)throw Error('3MF: ungültige Geometrie.');
     const quality=topology(v);
     if(quality.status!=='PASS')throw Error('FDI '+obj.fdi+': Topologie '+quality.status+'; 3MF-Export gesperrt.');
     const n=v.length/9;total+=n;
     if(total>120000)throw Error('3MF: höchstens 120.000 Dreiecke pro Paket; STL-ZIP für größere Daten nutzen.');
     const map=new Map(),vertices=[],triangles=[];
     for(let i=0;i<v.length;i+=9){
       const face=[];
       for(let j=0;j<9;j+=3){
         const x=v[i+j],y=v[i+j+1],z=v[i+j+2];
         if(![x,y,z].every(Number.isFinite))throw Error('3MF: ungültige Koordinaten.');
         const key=[x,y,z].map(n=>n.toFixed(5)).join(',');
         let ix=map.get(key);
         if(ix===undefined){ix=vertices.length;map.set(key,ix);
           vertices.push('<vertex x="'+x.toFixed(5)+'" y="'+y.toFixed(5)+'" z="'+z.toFixed(5)+'"/>');}
         face.push(ix);
       }
       triangles.push('<triangle v1="'+face[0]+'" v2="'+face[1]+'" v3="'+face[2]+'"/>');
     }
     const id=index+1;
     xmlParts.push('<object id="'+id+'" name="FDI_'+obj.fdi+'" type="model"><mesh><vertices>'+vertices.join('')+
       '</vertices><triangles>'+triangles.join('')+'</triangles></mesh></object>');
     build.push('<item objectid="'+id+'"/>');
   });
   const model='<?xml version="1.0" encoding="UTF-8"?>'+
    '<model unit="millimeter" xml:lang="de-DE" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">'+
    '<metadata name="Title">PIGA ORTHO GEOMETRY RESEARCH - NO CLINICAL PRINT RELEASE</metadata>'+
    '<resources>'+xmlParts.join('')+'</resources><build>'+build.join('')+'</build></model>';
   const types='<?xml version="1.0" encoding="UTF-8"?>'+
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
    '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>'+
    '</Types>';
   const rels='<?xml version="1.0" encoding="UTF-8"?>'+
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    '<Relationship Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model"/>'+
    '</Relationships>';
   return C.packZip([
     {name:'[Content_Types].xml',data:enc.encode(types)},
     {name:'_rels/.rels',data:enc.encode(rels)},
     {name:'3D/3dmodel.model',data:enc.encode(model)}
   ]);
 }
 return{topology,to3mf};
});
