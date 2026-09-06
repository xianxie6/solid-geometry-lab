'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Play,Pause,RotateCcw,MoveHorizontal,ArrowRight,Check} from 'lucide-react';
import {Slider} from '@/components/ui/slider';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {lessons} from '@/lib/lessons';
import {makeModel,metricsFor,specs,cubeSection,cubeSectionArea,cylinderArea,cross,sub,dot,type V3,type Model} from '@/lib/solids';
const f=(n:number)=>Number(n.toFixed(2)).toString();
const q=(n:number)=>Number(n.toFixed(3));
const sliderValue=(v:number|readonly number[])=>Array.isArray(v)?v[0]:v as number;

function SpatialView({model,yaw,setYaw,labels}:{model:Model;yaw:number;setYaw:(v:number)=>void;labels:boolean}){
 const host=useRef<HTMLDivElement>(null),drag=useRef<{x:number;yaw:number}|null>(null);const [width,setWidth]=useState(700);
 useEffect(()=>{const observer=new ResizeObserver(e=>setWidth(e[0].contentRect.width));if(host.current)observer.observe(host.current);return()=>observer.disconnect();},[]);
 const height=width<450?330:390;
 const drawing=useMemo(()=>{
  const elev=.52,transform=(p:V3):V3=>{const x=p[0]*Math.cos(yaw)-p[1]*Math.sin(yaw),d=p[0]*Math.sin(yaw)+p[1]*Math.cos(yaw);return [x,-p[2]*Math.cos(elev)+d*Math.sin(elev),p[2]*Math.sin(elev)+d*Math.cos(elev)];};
  let bounds=model.faces.flatMap(p=>p.points).concat(model.lines.flatMap(l=>l.points));
  if(model.bounds){const [a,b]=model.bounds;bounds=[];for(const x of [a[0],b[0]])for(const y of [a[1],b[1]])for(const z of [a[2],b[2]])bounds.push([x,y,z]);}
  const all=bounds.map(transform),minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));
  const scale=Math.min((width-100)/Math.max(.1,maxX-minX),(height-95)/Math.max(.1,maxY-minY));
  const project=(p:V3)=>{const a=transform(p);return [q(width/2+(a[0]-(minX+maxX)/2)*scale),q(height*.51+(a[1]-(minY+maxY)/2)*scale)];};
  const points=(p:V3[])=>p.map(project).map(a=>a.join(',')).join(' ');
  const palette={blue:[212,53,70],green:[164,30,65],orange:[28,70,64],gray:[211,12,78]};
  const surfaces=model.faces.map((face,i)=>{const n=face.points.length>2?cross(sub(face.points[1],face.points[0]),sub(face.points[2],face.points[0])):[0,0,1] as V3;const light=.5+.5*Math.abs(dot(n,[-.45,-.3,.7]))/(Math.hypot(...n)||1);const c=palette[face.color??'blue'];return {...face,i,depth:q(face.points.reduce((s,p)=>s+transform(p)[2],0)/face.points.length),fill:`hsl(${c[0]} ${c[1]}% ${(c[2]+light*9).toFixed(2)}%)`,coords:points(face.points)};}).sort((a,b)=>a.depth-b.depth||a.i-b.i);
  return {surfaces,project,points};
 },[model,yaw,width,height]);
 return <div className="spatial-view" ref={host}><svg viewBox={`0 0 ${width} ${height}`} role="img" tabIndex={0} aria-label="可旋转的三维几何图形。左右方向键或拖动可改变视角。" onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setYaw(yaw+(e.key==='ArrowLeft'?-.12:.12));}}} onPointerDown={e=>{drag.current={x:e.clientX,yaw};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(drag.current)setYaw(drag.current.yaw+(e.clientX-drag.current.x)*.009);}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}>
 <defs><pattern id="spatial-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#c9d8e6"/></pattern></defs><rect width={width} height={height} fill="url(#spatial-dots)" opacity=".65"/>
 {drawing.surfaces.map(p=><polygon key={p.i} points={p.coords} fill={p.fill} fillOpacity={p.opacity??1} stroke={p.outline===false?'none':'#5b7898'} strokeOpacity={p.opacity??.7} strokeWidth=".9" strokeLinejoin="round"/>)}
 {model.lines.map((l,i)=><polyline key={i} points={drawing.points(l.points)} fill="none" stroke={l.color??'#5c819f'} strokeWidth={l.width??1.3} strokeDasharray={l.dashed?'5 4':undefined} strokeLinejoin="round"/>)}
 {labels&&model.labels.map((l,i)=>{const p=drawing.project(l.point);return <g key={i}><circle cx={p[0]} cy={p[1]} r="2.3" fill="#3c6383"/><text x={Math.max(60,Math.min(width-60,p[0]+10))} y={Math.max(20,p[1]-11)} textAnchor="middle">{l.text}</text></g>;})}
 </svg><span className="spatial-hint"><MoveHorizontal size={14}/> 拖动旋转 · 方向键也可操作</span></div>;
}
function SectionView({id,value}:{id:number;value:number}){
 let points:number[][]=[],scale=1,ref=0;
 if(id===5){const u:V3=[1/Math.sqrt(2),-1/Math.sqrt(2),0],v:V3=[1/Math.sqrt(6),1/Math.sqrt(6),-2/Math.sqrt(6)];points=cubeSection(value).map(p=>[dot(p,u),dot(p,v)]);scale=44;}
 else {const r=id===6?Math.sqrt(Math.max(0,25-value*value)):value/2;ref=id===6?5:4;scale=62/ref;points=Array.from({length:80},(_,i)=>[r*Math.cos(i*Math.PI/40),r*Math.sin(i*Math.PI/40)]);}
 return <div className="section-view"><div className="mini-heading">正对截面看 <span>消除透视影响</span></div><svg viewBox="0 0 220 170" role="img" aria-label="截面的真实平面形状"><path d="M20 82H200M110 9V155" stroke="#d9e3ec" strokeDasharray="3 4"/>{ref>0&&<circle cx="110" cy="82" r={ref*scale} fill="none" stroke="#b1c5d7" strokeDasharray="4 4"/>}{points.length>2?<polygon points={points.map(([x,y])=>`${q(110+x*scale)},${q(82+y*scale)}`).join(' ')} fill="#f6c69b" stroke="#c97935" strokeWidth="1.5"/>:<circle cx="110" cy="82" r="2.5" fill="#c97935"/>}<text x="110" y="164" textAnchor="middle">{id===5?(points.length===6?'六边形':points.length===3?'三角形':'退化截面'):id===6?'虚线：过球心的最大截面':'虚线：圆锥底面'}</text></svg></div>;
}
function AreaCurve({id,value}:{id:number;value:number}){
 const spec=specs[id],min=spec.min,max=spec.max,fn=id===5?cubeSectionArea:id===6?(x:number)=>Math.PI*(25-x*x):id===7?(x:number)=>Math.PI*x*x/4:cylinderArea;
 const values=Array.from({length:121},(_,i)=>{const x=min+(max-min)*i/120;return [x,fn(x)];});const low=id===10?Math.min(...values.map(p=>p[1]))*.9:0,high=Math.max(...values.map(p=>p[1]))*1.12;
 const x=(v:number)=>43+(v-min)/(max-min)*189,y=(v:number)=>130-(v-low)/(high-low)*100;
 return <div className="area-curve"><div className="mini-heading">面积怎样变化</div><svg viewBox="0 0 270 175" role="img" aria-label="横轴为控制参数，纵轴为面积，橙色点表示当前状态"><path d="M43 26V130H235" stroke="#adc0d0" fill="none"/>{[low,(low+high)/2,high].map(v=><g key={v}><path d={`M43 ${q(y(v))}H232`} stroke="#e2e9ef"/><text x="35" y={q(y(v)+4)} textAnchor="end">{f(v)}</text></g>)}<polyline points={values.map(p=>`${q(x(p[0]))},${q(y(p[1]))}`).join(' ')} fill="none" stroke="#5787b5" strokeWidth="2"/><path d={`M${q(x(value))} 130V${q(y(fn(value)))}`} stroke="#cb854a" strokeDasharray="4 3"/><circle cx={q(x(value))} cy={q(y(fn(value)))} r="4" fill="#d68a49"/><text x="43" y="145">{min}</text><text x="232" y="145" textAnchor="end">{max}</text><text x="43" y="17">面积{ id===5?'':'（cm²）'}</text><text x="232" y="165" textAnchor="end">{id===5?'t':id===6?'d（cm）':id===7?'x（cm）':'r（cm）'}</text></svg></div>;
}

export default function SolidExperiment({id}:{id:number}){
 const lesson=lessons[id-1],spec=specs[id];const [value,setValue]=useState(spec.initial),[gap,setGap]=useState(1),[yaw,setYaw]=useState(.65),[labels,setLabels]=useState(true),[playing,setPlaying]=useState(false),[showAnswer,setShowAnswer]=useState(false);
 const current=useRef(value);current.current=value;
 useEffect(()=>{if(!playing)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches){setValue(spec.max);setPlaying(false);return;}let last:number|null=null,frame=0,v=current.current;const tick=(t:number)=>{if(last===null)last=t;v=Math.min(spec.max,v+Math.min(80,t-last)/6500*(spec.max-spec.min));last=t;setValue(v);if(v>=spec.max)setPlaying(false);else frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[playing,spec]);
 const model=useMemo(()=>makeModel(id,value,gap),[id,value,gap]),metrics=metricsFor(id,value),section=[5,6,7].includes(id),chart=section||id===10;
 const change=(v:number)=>{setPlaying(false);setValue(v);};
 const reset=()=>{change(spec.initial);setGap(1);setYaw(.65);setLabels(true);setShowAnswer(false);};
 return <article className="solid-lesson page-wrap" id="lab"><section className="intro"><div><p className="eyebrow">{lesson.category} · {lesson.difficulty}</p><h1>{lesson.title}</h1><p className="intro-copy">{lesson.subtitle}</p></div><Button variant="outline" className="reset-lesson" onClick={reset}><RotateCcw size={15}/>载入本题</Button></section>
 <div className="question-box"><span>题目 {String(id).padStart(2,'0')}</span><p>{lesson.question}</p></div>
 <section className="workbench generic-workbench"><div className="visual-pane"><div className="pane-heading"><span><i className="live-dot"/>{[2,3].includes(id)?'从立体到展开图':id===8?'旋转生成几何体':id===9?'拆分观察接触面':'实时几何模型'}</span><button className="camera-reset" aria-label="重置观察视角" onClick={()=>setYaw(.65)}><RotateCcw size={15}/></button></div><SpatialView model={model} yaw={yaw} setYaw={setYaw} labels={labels}/><div className="unfold-control"><div className="unfold-top"><label id={`control-${id}`}>{spec.label} <strong>{f(value)}<small>{spec.unit}</small></strong></label><Button className="play-button" onClick={()=>{if(playing)setPlaying(false);else{if(value>=spec.max)setValue(spec.min);setPlaying(true);}}}>{playing?<Pause/>:<Play/>}{playing?'暂停':'播放变化'}</Button></div><Slider aria-labelledby={`control-${id}`} className="lab-slider" min={spec.min} max={spec.max} step={spec.step} value={[value]} onValueChange={v=>change(sliderValue(v))}/><div className="slider-endpoints"><button onClick={()=>change(spec.min)}>{spec.start}</button><button onClick={()=>change(spec.max)}>{spec.end}</button></div></div></div>
 <aside className="controls-pane experiment-aside"><div className="control-title"><h2>观察与验证</h2></div>{section&&<SectionView id={id} value={value}/>}<p className="experiment-note">{spec.description}</p>{id===4&&<div className="parameter"><label id="separation-label">小角移开距离 <output>{f(gap)}</output></label><Slider aria-labelledby="separation-label" className="lab-slider" min={0} max={1.5} step={.01} value={[gap]} onValueChange={v=>setGap(sliderValue(v))}/></div>}{spec.focus&&<Button variant="outline" className="focus-action" onClick={()=>change(spec.focus!.value)}><Check size={14}/>{spec.focus.label}</Button>}{chart&&<AreaCurve id={id} value={value}/>}<label className="switch-row" htmlFor={`labels-${id}`}><span>显示长度与位置标注</span><Switch id={`labels-${id}`} checked={labels} onCheckedChange={setLabels}/></label>{id===10&&<div className="invariant"><Check size={16}/><div><strong>体积始终不变</strong><p>πr²h = 54π cm³</p></div></div>}</aside></section>
 <section className="area-strip generic-metrics" aria-label="当前几何结果">{metrics.map((m,i)=><div className={`area-item ${i===2?'selected':''}`} key={m.label}><span className="area-label"><i/>{m.label}</span><strong>{m.value}</strong><span className="area-detail">{m.formula}</span></div>)}</section>
 <section className="answer-box"><Button variant={showAnswer?'secondary':'outline'} onClick={()=>setShowAnswer(!showAnswer)} aria-expanded={showAnswer} aria-controls={`answer-${id}`}>{showAnswer?'收起本题答案':'查看本题答案'}<ArrowRight size={14}/></Button><p id={`answer-${id}`} hidden={!showAnswer}>{lesson.answer}</p></section>
 <section className="proof-section solid-proof"><div className="proof-intro"><p className="eyebrow">把图形和公式连起来</p><h2>推导思路</h2><p>上方结果随操作更新；本题答案对应题干给定的尺寸。</p></div><div className="proof-steps">{spec.steps.map(([title,body],i)=><div className="proof-step" key={title}><span className="step-num">0{i+1}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</div></section>
 </article>;
}
