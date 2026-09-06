'use client';
import {useState} from 'react';
import ConeLesson from '@/components/cone-lesson';
import SolidExperiment from '@/components/solid-experiment';
import {lessons} from '@/lib/lessons';
import {Triangle,ArrowLeft,ArrowRight,Video} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {NativeSelect,NativeSelectOption} from '@/components/ui/native-select';
import {SidebarProvider,Sidebar,SidebarContent,SidebarMenu,SidebarMenuItem,SidebarMenuButton} from '@/components/ui/sidebar';
export default function Home(){
 const [selected,setSelected]=useState(1);const choose=(id:number)=>{setSelected(id);window.scrollTo({top:0,behavior:'instant'});};
 return <><header className="site-header"><a className="brand" href="#lab"><span className="brand-icon"><Triangle size={21}/></span><span>立体几何实验室<span className="brand-en">GEOMETRY / LAB</span></span></a><span className="chapter">10 道题 · 展开 / 切割 / 旋转 / 最值</span></header>
 <SidebarProvider className="course-shell"><Sidebar collapsible="none" className="course-sidebar"><SidebarContent><p className="catalog-caption">选择一道题</p><SidebarMenu>{lessons.map((l,i)=><SidebarMenuItem key={l.id}>{(i===0||lessons[i-1].category!==l.category)&&<p className="catalog-group">{l.category}</p>}<SidebarMenuButton isActive={l.id===selected} onClick={()=>choose(l.id)} aria-current={l.id===selected?'page':undefined}><span>{String(l.id).padStart(2,'0')}</span><span>{l.title}</span>{l.id===1&&<Video className="catalog-video" size={13}/>}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu><div className="catalog-footnote">拖动，观察，再推导。<br/>每一题都有可操作的几何模型。</div></SidebarContent></Sidebar>
 <div className="course-content"><div className="course-toolbar"><div className="mobile-picker"><label htmlFor="lesson-picker">选择题目</label><NativeSelect id="lesson-picker" value={selected} onChange={e=>choose(Number(e.target.value))}>{lessons.map(l=><NativeSelectOption key={l.id} value={l.id}>{String(l.id).padStart(2,'0')} · {l.title}</NativeSelectOption>)}</NativeSelect></div><span className="course-position" aria-live="polite">第 {selected} / 10 题</span><div className="lesson-arrows"><Button variant="ghost" disabled={selected===1} onClick={()=>choose(selected-1)} aria-label="上一题"><ArrowLeft size={16}/>上一题</Button><Button variant="ghost" disabled={selected===10} onClick={()=>choose(selected+1)} aria-label="下一题">下一题<ArrowRight size={16}/></Button></div></div>
 <div key={selected}>{selected===1?<ConeLesson/>:<SolidExperiment id={selected}/>}</div>
 <div className="course-bottom-nav"><Button variant="outline" disabled={selected===1} onClick={()=>choose(selected-1)}><ArrowLeft size={15}/>上一题</Button><span>{lessons[selected-1].category}</span><Button disabled={selected===10} onClick={()=>choose(selected+1)}>{selected===10?'已到最后一题':`下一题 · ${lessons[selected].title}`}<ArrowRight size={15}/></Button></div><footer className="course-footer"><span>立体几何实验室 · 10 个交互实验</span><span>若无另注，长度单位为 cm，面积单位为 cm²。显示数值按需取近似。</span></footer></div></SidebarProvider></>;
}
