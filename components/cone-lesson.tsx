'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowDown, ArrowRight, Check, CircleHelp, MoveHorizontal, Pause, Play, RotateCcw, Triangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs,TabsList,TabsTrigger,TabsContent } from '@/components/ui/tabs';
import { coneMetrics, conePoint, validateConfiguration, type Vec3 } from '@/lib/cone';

const fmt=(n:number)=>Number(n.toFixed(2)).toString();
const coord=(n:number)=>Number(n.toFixed(3));
const pi=(n:number)=>`${fmt(n)}π`;
type Focus='side'|'base'|'total';

function ConeScene({r,h,progress,labels,focus,yaw,setYaw}:{r:number;h:number;progress:number;labels:boolean;focus:Focus;yaw:number;setYaw:(n:number)=>void}){
  const wrap=useRef<HTMLDivElement>(null),drag=useRef<{x:number;yaw:number}|null>(null);
  const [width,setWidth]=useState(800);
  useEffect(()=>{const observer=new ResizeObserver(entries=>setWidth(entries[0].contentRect.width));if(wrap.current)observer.observe(wrap.current);return ()=>observer.disconnect();},[]);
  const height=width<500?360:420,metrics=coneMetrics(r,h);
  const scene=useMemo(()=>{
    const elevation=.28+progress*(Math.PI/2-.28);
    const transform=(v:Vec3):Vec3=>{const x=v[0]*Math.cos(yaw)+v[2]*Math.sin(yaw),z=-v[0]*Math.sin(yaw)+v[2]*Math.cos(yaw);return [x,-v[1]*Math.cos(elevation)+z*Math.sin(elevation),v[1]*Math.sin(elevation)+z*Math.cos(elevation)];};
    const n=128,boundary=Array.from({length:n+1},(_,i)=>transform(conePoint(metrics.l,r,progress,-Math.PI+2*Math.PI*i/n,metrics.l))),apex=transform([0,0,0]);
    const points=[apex,...boundary],minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
    const usableWidth=width<500?width-66:width-190,scale=Math.min(usableWidth/(2*metrics.l),(height-110)/(1.5*metrics.l)),centerX=width<500?width/2:width*.44;
    const screen=(v:Vec3):[number,number]=>[coord(centerX+(v[0]-(minX+maxX)/2)*scale),coord(height*.47+(v[1]-(minY+maxY)/2)*scale)];
    const a=screen(apex);
    const patches=boundary.slice(0,-1).map((v,i)=>{const t=-Math.PI+(i+.5)*2*Math.PI/n,light=.5+.5*Math.cos(t-yaw-.8);return {i,depth:coord((v[2]+boundary[i+1][2])/3),coords:[a,screen(v),screen(boundary[i+1])].map(v=>v.join(',')).join(' '),fill:`hsl(213 ${(53+light*15).toFixed(2)}% ${(65+light*18).toFixed(2)}%)`};}).sort((a,b)=>a.depth-b.depth||a.i-b.i);
    return {a,patches,boundary:boundary.map(screen),screen:(v:Vec3)=>screen(transform(v)),scale};
  },[r,metrics.l,progress,yaw,width,height]);
  const path=(points:number[][])=>points.map((p,i)=>`${i?'L':'M'}${coord(p[0])},${coord(p[1])}`).join(' ');
  const edge=scene.boundary[0],edge2=scene.boundary.at(-1)!,foot=scene.screen([0,-h,0]);
  const mid=scene.screen(conePoint(metrics.l*.6,r,progress,-Math.PI,metrics.l));
  const baseX=width<500?width-58:width-86,baseY=height-68,baseRadius=(width<500?42:65)*r/metrics.l;
  return <div className="scene" ref={wrap}>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`圆锥展开 ${Math.round(progress*100)}%，半径 ${r}，高 ${h}，母线 ${fmt(metrics.l)}。橙色弧长始终为 ${pi(2*r)}。`} onPointerDown={e=>{if(e.button!==0)return;drag.current={x:e.clientX,yaw};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(drag.current)setYaw(drag.current.yaw+(e.clientX-drag.current.x)*.008);}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}>
      <defs><pattern id="dot-grid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#cbd6e3"/></pattern><radialGradient id="ground"><stop stopColor="#abc2e1" stopOpacity=".24"/><stop offset="1" stopColor="#abc2e1" stopOpacity="0"/></radialGradient></defs>
      <rect width={width} height={height} fill="url(#dot-grid)" opacity=".6"/><ellipse cx={width*.44} cy={height*.66} rx={width*.34} ry={height*.28} fill="url(#ground)"/>
      <g opacity={focus==='base'?.22:1}>{scene.patches.map(p=><polygon key={p.i} points={p.coords} fill={p.fill} stroke={p.fill} strokeWidth=".45"/>)}<path d={path(scene.boundary)} fill="none" stroke="#dc762e" strokeWidth="3" strokeLinecap="round"/>{progress>.005&&<path d={path([edge,scene.a,edge2])} fill="none" stroke="#326bb4" strokeWidth="2"/>}{[.25,.5,.75].map(f=><path key={f} d={path(scene.boundary.map(p=>[scene.a[0]+(p[0]-scene.a[0])*f,scene.a[1]+(p[1]-scene.a[1])*f]))} fill="none" stroke="#487cb4" strokeWidth=".65" opacity=".15"/>)}</g>
      {labels&&<g className="dimension-labels"><path d={path([scene.a,edge])} stroke="#2d64ab" strokeWidth="2" strokeDasharray={progress<.01?'5 4':undefined}/><circle cx={scene.a[0]} cy={scene.a[1]} r="3.5" fill="#24496c"/><text x={scene.a[0]} y={scene.a[1]-14} textAnchor="middle">{progress>.97?'扇形圆心':'顶点'}</text><text x={mid[0]-13} y={mid[1]-3} textAnchor="end" className="blue-label">l = {fmt(metrics.l)}</text>{progress<.025&&<><path d={path([scene.a,foot,scene.boundary[Math.floor(scene.boundary.length/2)]])} stroke="#526c80" strokeDasharray="5 5" fill="none"/><text x={foot[0]+10} y={(foot[1]+scene.a[1])/2}>h = {fmt(h)}</text></>}<text x={width<500?18:30} y={height-29} className="orange-label">弧长 = 2πr = {pi(2*r)}</text></g>}
      {labels&&progress>.97&&<g><path d={path(Array.from({length:65},(_,i)=>scene.screen(conePoint(metrics.l*.19,r,1,-Math.PI+i*Math.PI/32,metrics.l))))} fill="none" stroke="#6385a7" strokeWidth="1" strokeDasharray="3 3"/><text x={scene.a[0]} y={scene.a[1]+metrics.l*scene.scale*.28+15} textAnchor="middle">θ = {fmt(metrics.angle)}°</text></g>}
      <g opacity={focus==='side'?.55:1}><circle cx={baseX} cy={baseY} r={baseRadius} fill="#d7eee8" stroke="#388578" strokeWidth="1.5"/><path d={`M${baseX} ${baseY}h${baseRadius}`} stroke="#388578" strokeWidth="1.5"/><circle cx={baseX} cy={baseY} r="2" fill="#388578"/><text x={baseX} y={baseY-baseRadius-12} textAnchor="middle" className="base-label">底面示意</text><text x={baseX} y={baseY+baseRadius+20} textAnchor="middle" className="base-label">r = {fmt(r)}</text></g>
    </svg><div className="scene-hint"><MoveHorizontal size={14}/> 拖动图形，旋转视角</div>
  </div>;
}

export default function ConeLesson(){
  const [r,setR]=useState(3),[h,setH]=useState(4),[progress,setProgress]=useState(0),[playing,setPlaying]=useState(false),[labels,setLabels]=useState(true),[focus,setFocus]=useState<Focus>('total'),[yaw,setYaw]=useState(.45),[lesson,setLesson]=useState(0);
  const [mode,setMode]=useState('interactive');
  const metrics=coneMetrics(r,h),exact=r===3&&h===4;
  const progressRef=useRef(progress);progressRef.current=progress;
  useEffect(()=>{if(!playing)return;let last:number|null=null,frame=0,current=progressRef.current;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced){setProgress(1);setPlaying(false);return;}function animate(time:number){if(last===null)last=time;const dt=Math.min(time-last,80)/5500;last=time;current=Math.min(1,current+dt);setProgress(current);if(current===1){setPlaying(false);return;}frame=requestAnimationFrame(animate);}frame=requestAnimationFrame(animate);return ()=>cancelAnimationFrame(frame);},[playing]);
  useEffect(()=>{
    type Registry={registerTool:(tool:{name:string;title:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>void|Promise<void>};
    const context=(document as Document&{modelContext?:Registry}).modelContext;
    if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    try{void Promise.resolve(context.registerTool({name:'configure_cone',title:'设置圆锥实验',description:'设置半径、高度和展开百分比，暂停动画并同步更新可见图形与面积。所有变化仅作用于当前页面。',inputSchema:{type:'object',properties:{radius:{type:'number',minimum:1,maximum:6},height:{type:'number',minimum:1,maximum:8},unfold:{type:'number',minimum:0,maximum:100}},required:['radius','height','unfold'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){const v=validateConfiguration(input);flushSync(()=>{setR(v.r);setH(v.h);setProgress(v.progress);setPlaying(false);setYaw(v.progress===1?0:.45);});return {radius:v.r,height:v.h,unfold:v.progress*100,...coneMetrics(v.r,v.h)};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
    return ()=>lifecycle.abort();
  },[]);
  const reset=()=>{setR(3);setH(4);setProgress(0);setPlaying(false);setFocus('total');setLesson(0);setYaw(.45);setLabels(true);};
  const value=(v:number|readonly number[])=>Array.isArray(v)?v[0]:v as number;
  const chooseLesson=(n:number)=>{setMode('interactive');setLesson(n);setPlaying(false);setProgress(n===0?0:1);setFocus(n===2?'side':'total');setYaw(n===0?.45:0);};
  return <div className="cone-lesson">
    <div className="page-wrap">
      <section className="intro" id="lab"><div><p className="eyebrow">圆锥的侧面积与表面积</p><h1>把圆锥，<em>慢慢展开。</em></h1><p className="intro-copy">从立体到平面，看见 πrl 是怎么来的。</p></div><Button variant="outline" className="reset-lesson" onClick={()=>{reset();setMode('interactive');}}><RotateCcw size={15}/>载入本题</Button></section><div className="question-box"><span>题目 01</span><p>圆锥底面半径为 3 cm，高为 4 cm，求侧面积和表面积。</p></div>
      <Tabs value={mode} onValueChange={v=>{setMode(String(v));setPlaying(false);}} className="lesson-modes"><TabsList aria-label="圆锥演示方式"><TabsTrigger value="interactive">交互模型</TabsTrigger><TabsTrigger value="blender">Blender 动画</TabsTrigger></TabsList><TabsContent value="interactive"><section className="workbench" aria-label="圆锥交互实验台"><div className="visual-pane"><div className="pane-heading"><span><i className="live-dot"/> {progress===0?'空间中的圆锥':progress===1?'展开后的扇形':'正在展开的曲面'}</span><div className="view-actions"><button aria-label="恢复默认视角" onClick={()=>setYaw(progress>.95?0:.45)}><RotateCcw size={16}/></button><span>长度单位：cm</span></div></div>
        <ConeScene r={r} h={h} progress={progress} labels={labels} focus={focus} yaw={yaw} setYaw={setYaw}/>
        <div className="unfold-control"><div className="unfold-top"><label id="unfold-label">展开程度 <strong>{Math.round(progress*100)}<small>%</small></strong></label><Button className="play-button" onClick={()=>{if(playing)setPlaying(false);else{if(progress===1)setProgress(0);setPlaying(true);}}}>{playing?<Pause/>:<Play/>}{playing?'暂停':progress===1?'重新播放':'自动展开'}</Button></div><Slider aria-labelledby="unfold-label" className="lab-slider unfold-slider" min={0} max={100} step={.1} value={[progress*100]} onValueChange={v=>{setPlaying(false);setProgress(value(v)/100);}}/><div className="slider-endpoints"><button onClick={()=>{setPlaying(false);setProgress(0);}}>圆锥</button><span>展开过程中，曲面面积保持不变</span><button onClick={()=>{setPlaying(false);setProgress(1);setYaw(0);}}>扇形</button></div></div>
      </div><aside className="controls-pane"><div className="control-title"><h2>改变一个量，看看</h2><button onClick={reset} aria-label="重置全部参数"><RotateCcw size={16}/></button></div>
        <div className="parameter"><label id="radius-label">底面半径 <i>r</i><output>{fmt(r)} <span>cm</span></output></label><Slider aria-labelledby="radius-label" className="lab-slider radius-slider" min={1} max={6} step={.1} value={[r]} onValueChange={v=>setR(value(v))}/><div className="range-extents"><span>1</span><span>6</span></div></div>
        <div className="parameter"><label id="height-label">圆锥高度 <i>h</i><output>{fmt(h)} <span>cm</span></output></label><Slider aria-labelledby="height-label" className="lab-slider" min={1} max={8} step={.1} value={[h]} onValueChange={v=>setH(value(v))}/><div className="range-extents"><span>1</span><span>8</span></div></div>
        <div className="derived"><div><span>母线长 <i>l</i></span><strong>{fmt(metrics.l)} <small>cm</small></strong></div><p>l = √(r² + h²)</p><div><span>展开圆心角 <i>θ</i></span><strong>{fmt(metrics.angle)}<small>°</small></strong></div><p>θ = 360° × r / l</p></div>
        <label className="switch-row" htmlFor="labels"><span>显示辅助线与标注</span><Switch id="labels" checked={labels} onCheckedChange={setLabels}/></label>
        <div className="invariant"><span className="invariant-icon"><Check size={16}/></span><div><strong>同一条边，同一个长度</strong><p>底面圆周 = 扇形弧长<br/><b>{pi(2*r)} ≈ {fmt(metrics.arc)} cm</b></p></div></div>
      </aside></section>
      <section className="area-strip" aria-label="实时面积，点击高亮对应的面"><button className={`area-item side ${focus==='side'?'selected':''}`} aria-pressed={focus==='side'} onClick={()=>setFocus('side')}><span className="area-label"><i/>侧面积 <span>S侧</span></span><strong>{pi(metrics.side/Math.PI)} <small>cm²</small></strong><span className="area-detail">πrl <span>≈ {fmt(metrics.side)}</span></span></button><button className={`area-item base ${focus==='base'?'selected':''}`} aria-pressed={focus==='base'} onClick={()=>setFocus('base')}><span className="area-label"><i/>底面积 <span>S底</span></span><strong>{pi(r*r)} <small>cm²</small></strong><span className="area-detail">πr² <span>≈ {fmt(metrics.base)}</span></span></button><button className={`area-item total ${focus==='total'?'selected':''}`} aria-pressed={focus==='total'} onClick={()=>setFocus('total')}><span className="area-label"><i/>表面积 <span>S表</span></span><strong>{pi(metrics.total/Math.PI)} <small>cm²</small></strong><span className="area-detail">πrl + πr² <span>≈ {fmt(metrics.total)}</span></span></button></section>
      </TabsContent><TabsContent value="blender"><div className="video-panel"><video controls playsInline preload="metadata" poster="/media/cone-poster.png" aria-label="Blender 圆锥展开动画，10 秒"><source src="/media/cone-unfolding.mp4" type="video/mp4"/>你的浏览器不支持视频播放。</video><div className="video-caption"><strong>Blender 渲染样片 · 10 秒</strong><span>固定尺寸：r = 3 cm，h = 4 cm。切换到「交互模型」可调整参数。</span></div></div></TabsContent></Tabs>
      <section id="proof" className="proof-section"><div className="proof-intro"><p className="eyebrow">把图形和公式连起来</p><h2>为什么是 <span className="math-serif">πrl</span>？</h2><p>点选一步，回到对应的图形状态。</p></div><div className="proof-steps">{[{title:'先找到母线',text:`半径 ${fmt(r)} 和高 ${fmt(h)} 组成直角三角形。斜边 ${fmt(metrics.l)}，才是展开后扇形的半径。`,formula:exact?'l = √(3² + 4²) = 5':'l = √(r² + h²)'},{title:'圆周，变成了弧',text:'沿一条母线剪开，底面圆周成为扇形的弧。展开只改变形状，长度没有改变。',formula:`弧长 = 2πr = ${pi(2*r)}`},{title:'用扇形求面积',text:'扇形面积等于二分之一乘以弧长，再乘以半径。这里的半径是母线 l。',formula:'S侧 = ½ × 2πr × l = πrl'}].map((s,i)=><button className={`proof-step ${lesson===i?'chosen':''}`} key={s.title} onClick={()=>chooseLesson(i)}><span className="step-num">0{i+1}</span><div><h3>{s.title}<ArrowRight size={16}/></h3><p>{s.text}</p><strong>{s.formula}</strong></div></button>)}</div></section>

    </div>
  </div>;
}
