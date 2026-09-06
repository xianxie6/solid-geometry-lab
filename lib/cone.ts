export type Vec3 = [number, number, number];
export function validateConfiguration(input:unknown){
  if(!input||typeof input!=='object')throw new TypeError('需要半径、高度和展开程度');
  const {radius,height,unfold}=input as Record<string,unknown>;
  if(typeof radius!=='number'||!Number.isFinite(radius)||radius<1||radius>6||typeof height!=='number'||!Number.isFinite(height)||height<1||height>8||typeof unfold!=='number'||!Number.isFinite(unfold)||unfold<0||unfold>100)throw new RangeError('半径范围 1–6，高度范围 1–8，展开程度范围 0–100');
  return {r:Math.round(radius*10)/10,h:Math.round(height*10)/10,progress:Math.round(unfold*10)/1000};
}
export function coneMetrics(r:number,h:number){
  if(!Number.isFinite(r)||!Number.isFinite(h)||r<=0||h<=0)throw new RangeError('半径和高度必须是正数');
  const l=Math.hypot(r,h),side=Math.PI*r*l,base=Math.PI*r*r;
  return {l,side,base,total:side+base,arc:2*Math.PI*r,angle:360*r/l};
}
// The cone opens by increasing sin(beta) and decreasing the angular range.
// This preserves the intrinsic metric d(rho)^2 + (rho*r/l)^2 d(theta)^2.
export function conePoint(rho:number,r:number,progress:number,theta:number,l:number):Vec3{
  const original=r/l,s=original+(1-original)*progress,phi=theta*original/s;
  return [rho*s*Math.sin(phi),-rho*Math.sqrt(Math.max(0,1-s*s)),rho*s*Math.cos(phi)];
}
