(function(){
  // Stability helpers for course-page
  const DEBOUNCE_MS = 700;
  let _lastClick = 0;
  window._plyrInstances = window._plyrInstances || [];
  window.isLoadingLesson = window.isLoadingLesson || false;

  function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

  window.selectLessonDebounced = function(moduleIndex, lessonIndex){
    const now = Date.now();
    if (now - _lastClick < DEBOUNCE_MS) return;
    _lastClick = now;
    if (window.isLoadingLesson) return;
    const ml = document.getElementById('modulesList'); if (ml) ml.style.pointerEvents = 'none';
    if (typeof window.loadLesson === 'function') window.loadLesson(moduleIndex, lessonIndex);
  };

  window.initPlyrSequential = function(nodeList){
    return new Promise(resolve => {
      if (!nodeList || nodeList.length === 0) return resolve([]);
      const created = [];
      let i = 0;
      function step(){
        if (i >= nodeList.length) return resolve(created);
        try{
          const node = nodeList[i];
          if (node && node.dataset && node.dataset.plyrInitialized){ i++; scheduleNext(); return; }
          const p = new Plyr(node, {controls:['play','progress','current-time','mute','volume']});
          created.push(p);
          try{ node.dataset.plyrInitialized = '1'; }catch(_){ }
        }catch(e){ console.warn('Plyr init failed', e); }
        i++; scheduleNext();
      }
      function scheduleNext(){ if (window.requestIdleCallback) requestIdleCallback(step,{timeout:200}); else setTimeout(step,50); }
      scheduleNext();
    });
  };

  // Expose a lightweight loader that wraps the page's loadLessonContent when available
  window.stableLoadLesson = async function(moduleIndex, lessonIndex, lesson){
    const contentContainer = document.getElementById('contentContainer');
    if (!contentContainer) return;
    if (!lesson){ contentContainer.innerHTML = '<div class="no-content">لا يوجد محتوى متاح.</div>'; return; }
    if (window.isLoadingLesson) return;
    window.isLoadingLesson = true;
    const safety = setTimeout(()=>{ window.isLoadingLesson = false; const ml = document.getElementById('modulesList'); if(ml) ml.style.pointerEvents = ''; }, 6000);
    const ml = document.getElementById('modulesList'); if (ml) ml.style.pointerEvents = 'none';
    contentContainer.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>جاري تحميل المحتوى...</p></div>';
    try{
      Array.from(contentContainer.querySelectorAll('video')).forEach(v=>{ try{ v.pause(); v.removeAttribute('src'); v.load(); }catch(_){} });
      Array.from(contentContainer.querySelectorAll('iframe')).forEach(f=>{ try{ f.src='about:blank'; }catch(_){} });
      if (Array.isArray(window._plyrInstances)){
        window._plyrInstances.forEach(p=>{ try{ if(p && p.pause) p.pause(); if(p && p.destroy) p.destroy(); }catch(_){} });
      }
      window._plyrInstances = [];
    }catch(e){ console.warn('cleanup failed', e); }
    await sleep(60);

    // If original loader exists, call it (it should replace contentContainer). Otherwise, build minimal UI
    if (typeof window.loadLessonContent === 'function'){
      try{
        await window.loadLessonContent(moduleIndex, lessonIndex, lesson);
      }catch(err){ console.warn('wrapped loadLessonContent failed', err); }
    } else {
      // fallback: simple rendering
      let link = (lesson && lesson.link) || '';
      if (!link){ contentContainer.innerHTML = '<div class="no-content">لا يوجد محتوى متاح.</div>'; }
      else if (/\.(pdf)$/i.test(link)){
        contentContainer.innerHTML = `<div class="pdf-container"><iframe class="pdf-viewer" src="/pdfjs/web/viewer.html?file=${encodeURIComponent(link)}"></iframe></div>`;
      } else if (/youtube|youtu\.be|\.mp4|\.mov/i.test(link)){
        contentContainer.innerHTML = `<div class="video-container"><div class="plyr__video-embed" data-plyr-provider="youtube" data-plyr-embed-id="${link}"></div></div>`;
        if (window.Plyr){ const nodes = Array.from(contentContainer.querySelectorAll('.plyr, .plyr__video-embed')); const created = await window.initPlyrSequential(nodes); if (created && created.length) window._plyrInstances.push(...created); }
      } else {
        contentContainer.innerHTML = '<div class="external-link"><a target="_blank" rel="noopener">افتح المحتوى الخارجي</a></div>';
      }
    }

    clearTimeout(safety);
    window.isLoadingLesson = false;
    if (ml) ml.style.pointerEvents = '';
  };

  // Small shim to allow existing code to call stableLoadLesson if prefered
  window.callStableLoad = window.stableLoadLesson;
})();
