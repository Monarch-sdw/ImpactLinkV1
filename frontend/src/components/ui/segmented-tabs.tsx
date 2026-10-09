'use client';

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { LucideIcon } from 'lucide-react';

type Tab = { value:string; label:string; icon:LucideIcon };
type Props = { id:string; label:string; value:string; onChange:(value:string)=>void; items:Tab[] };

export function SegmentedTabs({id, label, value, onChange, items}:Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({left:0, width:0});

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => {
      const active = root.querySelector<HTMLElement>('[aria-selected="true"]');
      if (active) setIndicator({left:active.offsetLeft, width:active.offsetWidth});
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.querySelectorAll('button').forEach(button=>observer.observe(button));
    return ()=>observer.disconnect();
  }, [value]);

  function navigate(event:KeyboardEvent, index:number) {
    let next = index;
    if (event.key==='ArrowRight') next=(index+1)%items.length;
    else if (event.key==='ArrowLeft') next=(index+items.length-1)%items.length;
    else if (event.key==='Home') next=0;
    else if (event.key==='End') next=items.length-1;
    else return;
    event.preventDefault();
    onChange(items[next].value);
    const button=ref.current?.querySelectorAll('button')[next];
    button?.focus();
    button?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  }

  return <div ref={ref} className="tabs segmented-tabs" role="tablist" aria-label={label}>
    <span className="tab-indicator" aria-hidden="true" style={{width:indicator.width,transform:`translate3d(${indicator.left}px,0,0)`,opacity:indicator.width?1:0}}/>
    {items.map(({value:key,label:caption,icon:Icon},index)=><button
      key={key} type="button" role="tab" id={`${id}-${key}`}
      aria-selected={value===key} aria-controls={`${id}-panel`} tabIndex={value===key?0:-1}
      className={value===key?'active':''} onClick={()=>onChange(key)} onKeyDown={event=>navigate(event,index)}
    ><Icon size={16} strokeWidth={1.8} aria-hidden="true"/>{caption}</button>)}
  </div>;
}
