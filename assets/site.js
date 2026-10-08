const searchIndex = [["Getting started", "Install, reload and configure the plugin.", "/guide/"], ["How limiting works", "Block, subchunk, chunk, region, periods and sustain.", "/how-it-works/"], ["Configuration reference", "Explain every YAML setting with actual defaults.", "/configuration/"], ["Example configurations", "Copy-ready configurations for farms and lag machines.", "/examples/"], ["Limit calculator", "Effective threshold, TPS scaling and preset math.", "/calculator/"], ["Commands and permissions", "GUI, statistics, notifications, whitelist and quarantine.", "/commands/"], ["FAQ", "Why are machines blocked? What happens when limits are disabled?", "/faq/"]];

    const panel = document.getElementById('search-panel');
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    const empty = document.getElementById('search-results-empty');
    const openButton = document.getElementById('open-search');
    const closeButton = document.getElementById('search-close');
    let focusBefore;
    const render = () => {
      const q = input.value.trim().toLowerCase();
      const filtered = searchIndex.filter(([name, desc]) => (name + ' ' + desc).toLowerCase().includes(q));
      results.replaceChildren();
      empty.style.display = filtered.length ? 'none' : 'block';
      filtered.forEach(([name, desc, url]) => {
        const link = document.createElement('a'); link.className='search-result';link.href=url;link.setAttribute('role','listitem');
        const label=document.createElement('span');label.textContent=name;
        const sub=document.createElement('small');sub.textContent=desc;
        link.append(label,sub); results.append(link);
      });
    };
    const close = () => { panel.setAttribute('aria-hidden','true');document.body.style.overflow='';focusBefore?.focus(); };
    const open = () => { focusBefore=document.activeElement;panel.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';input.value='';render();input.focus(); };
    openButton.addEventListener('click',open);
    closeButton.addEventListener('click',close);
    input.addEventListener('input',render);
    panel.addEventListener('click', e => { if(e.target===panel) close(); });
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k'){e.preventDefault();open();}
      if(e.key==='Escape'&&panel.getAttribute('aria-hidden')==='false')close();
      if(e.key==='Tab'&&panel.getAttribute('aria-hidden')==='false'){
        const elements=[input,closeButton,...results.querySelectorAll('a')];
        if(!e.shiftKey&&document.activeElement===elements.at(-1)){e.preventDefault();elements[0].focus();}
        if(e.shiftKey&&document.activeElement===elements[0]){e.preventDefault();elements.at(-1).focus();}
      }
    });
    render();
    const menu=document.getElementById('menu-toggle');const sidebar=document.getElementById('sidebar');
    menu.addEventListener('click',()=>{const opened=sidebar.classList.toggle('open');menu.setAttribute('aria-expanded',String(opened));menu.setAttribute('aria-label',opened?'Close documentation navigation':'Open documentation navigation');});
    document.addEventListener('click',e=>{if(innerWidth<=760&&!sidebar.contains(e.target)&&!menu.contains(e.target)){sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false');}});
    document.querySelectorAll('.copy').forEach(button=>button.addEventListener('click',async()=>{
      const code=button.closest('.codeblock')?.querySelector('code')?.textContent||'';
      try{await navigator.clipboard.writeText(code);button.textContent='Copied';setTimeout(()=>button.textContent='Copy',1300);}catch{button.textContent='Select code';}
    }));
  