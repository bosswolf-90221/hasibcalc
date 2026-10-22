import{f as e,m as t}from"./runtime.CHd4gcro.js";import{l as n}from"./views.CwkMgkAw.js";var r=e=>`${Math.max(0,Math.min(100,e)).toFixed(3)}%`;function i(t){let n=t?t.serviceYears:0,i=Math.min(40,Math.max(6,Math.ceil(n+1e-4))),a=i>20?5:i>10?2:1,o=Math.min(n,5),s=Math.max(0,Math.min(n,i)-5),c=``;for(let e=0;e<=i;e++){let t=e%a===0;c+=`<span class="tk${t?` mj`:``}${e===5?` five`:``}" style="inset-inline-start:${r(e/i*100)}">${t?`<i>${e}</i>`:``}</span>`}return`<div class="tl" role="img" aria-label="خط زمني لمدة الخدمة: ${e(n,1)} سنة">
    <div class="tl-track">
      <span class="tl-a" style="inset-inline-start:0;width:${r(o/i*100)}"></span>
      <span class="tl-b" style="inset-inline-start:${r(5/i*100)};width:${r(s/i*100)}"></span>
      <span class="tl-one" style="inset-inline-start:${r(1/i*100)}"></span>
      <span class="tl-now" style="inset-inline-start:${r(Math.min(n,i)/i*100)}"><b class="nums">${e(n,1)}</b></span>
    </div>
    <div class="tl-ticks">${c}</div>
  </div>`}function a(n){return n?`<div class="eq">
    <div class="eq-t"><span>قبل الضريبة</span><b class="nums">${t(n.base)}</b></div>
    <span class="eq-op">+</span>
    <div class="eq-t"><span>الضريبة ${e(n.rate,n.rate%1?2:0)}%</span><b class="nums">${t(n.tax)}</b></div>
    <span class="eq-op">=</span>
    <div class="eq-t tot"><span>الإجمالي</span><b class="nums">${t(n.total)}</b></div>
  </div>`:``}function o(e){return`<div class="scroll-x"><table class="ledger"><thead><tr><th>الفترة</th><th class="n">من أصل القرض</th><th class="n">الفوائد</th><th class="n">الرصيد المتبقي</th></tr></thead><tbody>${e.map(e=>`<tr><td>السنة ${e.year}</td><td class="n">${t(e.principal)}</td><td class="n">${t(e.interest)}</td><td class="n">${t(e.balance)}</td></tr>`).join(``)}</tbody></table></div>`}function s(n,r,i){if(!n)return``;let a=i>0?`<span class="ch-op">− ${e(i,i%1?1:0)}%</span><span class="ch-v nums">${t(n.final)}</span>`:``;return`<div class="chain">
    <span class="ch-v was nums">${t(n.price)}</span>
    <span class="ch-op">− ${e(r,r%1?1:0)}%</span>
    <span class="ch-v${i>0?``:` fin`} nums">${t(n.afterFirst)}</span>
    ${a.replace(`class="ch-v nums"`,`class="ch-v fin nums"`)}
  </div>`}function c(t){let i=e=>r((Math.min(40,Math.max(15,e))-15)/25*100),a=n.map(e=>{let t=Math.max(15,e.from),n=Math.min(40,e.to);return`<span class="z z-${e.key}" style="inset-inline-start:${i(t)};width:${r((n-t)/25*100)}"><i>${e.label}</i></span>`}).join(``),o=``;for(let e=15;e<=40;e++){let t=e%5==0,n=t&&e!==20;o+=`<span class="tk${t?` mj`:``}" style="inset-inline-start:${i(e)}">${n?`<i>${e}</i>`:``}</span>`}return o+=`<span class="tk mj key" style="inset-inline-start:${i(18.5)}"><i>18.5</i></span>`,`<div class="bscale" role="img" aria-label="مقياس مؤشر كتلة الجسم من 15 إلى 40">${t===null?``:`<span class="ptr" style="inset-inline-start:${i(t)}"><b class="nums">${e(t,1)}</b></span>`}<div class="zones">${a}</div><div class="bticks">${o}</div></div>`}function l(e,n,r,i){if(!i)return``;let a=i.nisab===null?`<td class="n muted">أدخل سعر الذهب</td>`:`<td class="n">${t(i.nisab)}</td>`,o=i.reachesNisab===null?``:`<tr><td class="op"></td><td>${i.reachesNisab?`بلغ مالك النصاب`:`مالك دون النصاب`}</td><td class="n">${i.reachesNisab?`✓`:`—`}</td></tr>`;return`<table class="ledger zl">
    <tbody>
      <tr><td class="op"></td><td>النقد والمدخرات</td><td class="n">${t(e)}</td></tr>
      <tr><td class="op">+</td><td>الاستثمارات</td><td class="n">${t(n)}</td></tr>
      <tr><td class="op">−</td><td>الديون الحالّة</td><td class="n">${t(r)}</td></tr>
      <tr class="total"><td class="op">=</td><td>صافي المال الزكوي</td><td class="n">${t(i.net)}</td></tr>
      <tr><td class="op"></td><td>النصاب (85 غراماً من الذهب)</td>${a}</tr>
      ${o}
      <tr class="total"><td class="op">×</td><td>2.5% زكاة مبدئية</td><td class="n">${t(i.zakat)}</td></tr>
    </tbody>
  </table>`}export{a,i,s as n,l as o,o as r,c as t};