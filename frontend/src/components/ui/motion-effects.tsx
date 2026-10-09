'use client';

import { useEffect, useSyncExternalStore } from 'react';

const reducedQuery='(prefers-reduced-motion: reduce)';
function subscribe(callback:()=>void) {
  const query=window.matchMedia(reducedQuery);
  query.addEventListener('change',callback);
  return ()=>query.removeEventListener('change',callback);
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribe,()=>window.matchMedia(reducedQuery).matches,()=>true);
}

// One observer for the whole app. Reveal each card once, then release it.
const revealSelector='.project-card, .stat-card, .offer-card, .match-card, .requirement-form, .activity-row, .demo-accounts > button, .steps-grid > div, .hero-partners > div, .chart-grid > .panel';
export function MotionEffects() {
  const reduced=useReducedMotion();
  useEffect(()=>{
    const syncVisibility=()=>document.documentElement.classList.toggle('motion-paused',document.hidden);
    syncVisibility();
    document.addEventListener('visibilitychange',syncVisibility);
    if(reduced) return ()=>document.removeEventListener('visibilitychange',syncVisibility);

    const observed=new WeakSet<Element>();
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries) if(entry.isIntersecting){
        entry.target.setAttribute('data-reveal','visible');
        observer.unobserve(entry.target);
      }
    },{threshold:0.06});
    function register(element:Element) {
      if(observed.has(element)) return;
      observed.add(element);
      element.setAttribute('data-reveal','pending');
      observer.observe(element);
    }
    function scan(root:Element) {
      if(root.matches(revealSelector)) register(root);
      root.querySelectorAll(revealSelector).forEach(register);
    }
    scan(document.body);
    const mutations=new MutationObserver(records=>{
      for(const record of records) {
        for(const node of record.removedNodes) if(node instanceof Element) {
          const release=(element:Element)=>{observer.unobserve(element);observed.delete(element)};
          release(node); node.querySelectorAll(revealSelector).forEach(release);
        }
        for(const node of record.addedNodes) if(node instanceof Element) scan(node);
      }
    });
    mutations.observe(document.body,{childList:true,subtree:true});

    return ()=>{
      observer.disconnect(); mutations.disconnect();
      document.removeEventListener('visibilitychange',syncVisibility);
      document.querySelectorAll('[data-reveal]').forEach(element=>element.removeAttribute('data-reveal'));
    };
  },[reduced]);
  return null;
}
