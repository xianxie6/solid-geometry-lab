import assert from 'node:assert/strict';
import {makeModel,specs,polygonArea,cubeSection,cubeSectionArea,cutArea,cylinderArea,metricsFor} from '../lib/solids.ts';
const close=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b} (tolerance ${tolerance})`);
const area=(m,filter=()=>true)=>m.faces.filter(filter).reduce((s,p)=>s+polygonArea(p.points),0);
let states=0;
for(const [key,spec] of Object.entries(specs))for(let i=0;i<=20;i++){
 const id=Number(key),v=spec.min+(spec.max-spec.min)*i/20,m=makeModel(id,v);
 assert.ok(m.faces.length+m.lines.length>0);
 for(const p of [...m.faces,...m.lines]) for(const point of p.points) assert.ok(point.every(Number.isFinite));
 assert.equal(metricsFor(id,v).length,3);states++;
}
for(const progress of [0,25,50,75,100]){
 close(area(makeModel(2,progress)),96);
 close(area(makeModel(2,progress),f=>f.color==='blue'),60);
 close(area(makeModel(3,progress)),25*Math.PI,.06);
}
for(const c of [0,1,2,3,4])close(area(makeModel(4,c),f=>f.color!=='gray'),cutArea(c));
close(cutArea(2),90+2*Math.sqrt(3));
for(let i=0;i<=120;i++){
 const t=i/20;
 close(polygonArea(cubeSection(t)),cubeSectionArea(t));
 assert.ok(cubeSectionArea(t)<=3*Math.sqrt(3)+1e-8);
 close(cubeSectionArea(t),cubeSectionArea(6-t));
}
assert.equal(cubeSection(3).length,6);
close(polygonArea(cubeSection(3)),3*Math.sqrt(3));
close(area(makeModel(6,3)),16*Math.PI,.09);
close(area(makeModel(7,4),f=>f.color==='orange'),4*Math.PI,.03);
close(area(makeModel(8,360),f=>f.color==='blue'),84*Math.PI/5,.06);
close(area(makeModel(9,0)),51*Math.PI,.5);
close(area(makeModel(9,4)),69*Math.PI,.6);
for(let i=0;i<=100;i++){
 const r=1.5+4*i/100,h=54/r**2;
 close(Math.PI*r*r*h,54*Math.PI);
 assert.ok(cylinderArea(r)>=54*Math.PI-1e-8);
}
close(cylinderArea(3),54*Math.PI);
for(const id of [2,3])for(const face of makeModel(id,100).faces)for(const p of face.points)close(p[2],0);
console.log(`Geometry verified: ${states} finite model states; unfolding area invariants; clipped cube and 121 sections; sphere/cone sections; double cone; composite solid; fixed-volume minimum.`);
