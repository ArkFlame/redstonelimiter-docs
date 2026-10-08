#!/usr/bin/env python3
"""Export the RedstoneLimiter Astro docs to branch-publishable static HTML without npm.

This is a deliberately bounded converter for this one site's existing pages/components.
No third-party libraries, template runtime or network required. Do not generalize to Astro.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import re
import json
import html
import shutil
import subprocess

ROUTES = {'index':'', 'guide':'guide', 'how-it-works':'how-it-works', 'configuration':'configuration', 'examples':'examples', 'calculator':'calculator', 'commands':'commands', 'faq':'faq', '404':'404'}
SEARCH = [
    ['Getting started','Install, reload and configure the plugin.','/guide/'],
    ['How limiting works','Block, subchunk, chunk, region, periods and sustain.','/how-it-works/'],
    ['Configuration reference','Explain every YAML setting with actual defaults.','/configuration/'],
    ['Example configurations','Copy-ready configurations for farms and lag machines.','/examples/'],
    ['Limit calculator','Effective threshold, TPS scaling and preset math.','/calculator/'],
    ['Commands and permissions','GUI, statistics, notifications, whitelist and quarantine.','/commands/'],
    ['FAQ','Why are machines blocked? What happens when limits are disabled?','/faq/'],
]

def site_data(src: Path) -> dict:
    data_file = (src / 'src/data/site.ts').resolve()
    config_file = (src / 'src/pages/configuration.astro').resolve()
    js = '''const fs = require('fs'); const vm=require('vm');
let s=fs.readFileSync(process.argv[1],'utf8');
s=s.replace(/export const /g,'const ').replace(/\\] as const;/g,'];');
const x=vm.runInNewContext(s+'\\nJSON.stringify({nav,source,mat,commands})');
let c=fs.readFileSync(process.argv[2],'utf8');
c=c.split('---')[1].replace(/\\] as const;/g,'];').replace(/^import.*$/gm,'');
const y=vm.runInNewContext(c+'\\nJSON.stringify({scopeRows,globalRows})');
console.log(JSON.stringify({...JSON.parse(x),...JSON.parse(y)}));'''
    return json.loads(subprocess.check_output(['node','-e',js,str(data_file),str(config_file)],text=True))

def js_plain(text: str) -> str:
    # Strip exactly the TypeScript assertions found in source client scripts.
    text = re.sub(r'\s+as\s+(?:HTMLInputElement|HTMLSelectElement|HTMLDivElement|HTMLElement)', '', text)
    text = re.sub(r'querySelectorAll<HTMLElement>', 'querySelectorAll', text)
    text = re.sub(r'querySelector<HTMLIFrameElement>', 'querySelector', text)
    text = re.sub(r'querySelector<HTMLButtonElement>', 'querySelector', text)
    text = text.replace(')!;', ');').replace("querySelector('.diagram-toggle')!", "querySelector('.diagram-toggle')").replace("querySelector('.diagram-html')!", "querySelector('.diagram-html')")
    text = text.replace('setVisible(visible: boolean)', 'setVisible(visible)')
    return text

def extract_frontmatter(s: str) -> tuple[str,str]:
    m = re.match(r'\A---\s*\n(.*?)\n---\s*\n',s,re.S)
    if not m: raise ValueError('Missing Astro frontmatter')
    return m.group(1), s[m.end():]

def extract_script(body: str) -> tuple[str,str]:
    scripts = re.findall(r'<script(?:\s+[^>]*)?>(.*?)</script>',body,re.S)
    body = re.sub(r'<script(?:\s+[^>]*)?>.*?</script>', '', body, flags=re.S)
    return body, '\n'.join(scripts)

def code_component(match: re.Match) -> str:
    attrs = match.group('attrs')
    label = re.search(r'\btitle="([^"]+)"',attrs)
    title = label.group(1) if label else 'config.yml'
    body = re.search(r'\bcode=\{`(.*?)`\}',attrs,re.S)
    if not body: raise ValueError(f'Missing code in {attrs[:80]}')
    value = body.group(1).replace('\\n','\n').replace('\\t','\t')
    return f'<div class="codeblock"><div class="codehead"><span>{html.escape(title)}</span><button class="copy" type="button" aria-label="Copy {html.escape(title,quote=True)}">Copy</button></div><pre><code>{html.escape(value.strip())}</code></pre></div>'

def animation_component(match: re.Match) -> str:
    attrs = dict(re.findall(r'(slug|title|description|note)="([^"]*)"',match.group('attrs')))
    if not {'slug','title','description'} <= attrs.keys(): raise ValueError('Incomplete diagram props')
    esc = lambda val: html.escape(val,quote=True)
    slug, title, description, note = [attrs.get(k,'') for k in ['slug','title','description','note']]
    return f'''<figure class="diagram" id="diagram-{esc(slug)}"><div class="diagram-media"><iframe class="diagram-html" src="/visuals/{esc(slug)}.html" title="{esc(title)}" width="1280" height="720" loading="lazy" sandbox="allow-scripts" referrerpolicy="no-referrer" tabindex="-1" aria-describedby="diagram-{esc(slug)}-description"></iframe></div><figcaption class="diagram-caption" id="diagram-{esc(slug)}-description"><span class="diagram-heading">{esc(title)}</span><span class="diagram-description">{esc(description)}</span>{f'<span class="diagram-note">{esc(note)}</span>' if note else ''}<span class="diagram-actions"><button class="diagram-toggle" hidden type="button" aria-label="Play {esc(title)}" aria-pressed="false">Play animation</button><a class="diagram-full" href="/visuals/{esc(slug)}.html" target="_blank" rel="noopener noreferrer" aria-label="Open {esc(title)} full size in a new tab">View full size ↗</a></span></figcaption></figure>'''

def table_rows(rows: list, keys: tuple[str,...]) -> str:
    assert all(len(row)==len(keys) for row in rows)
    cols=[]
    for row in rows:
        cols.append('<tr>' + ''.join(f'<td>{("<strong>"+html.escape(str(x))+"</strong>") if k=="number" else ("<code>"+html.escape(str(x))+"</code>") if k in ("name","command","key","code-def") else html.escape(str(x))}</td>' for k,x in zip(keys,row)) + '</tr>')
    return ''.join(cols)

def render_body(s: str,data: dict) -> tuple[str,str,str,str]:
    fm, body=extract_frontmatter(s)
    opening = re.search(r'<DocsLayout\s+title="([^"]+)"\s+description="([^"]+)">',body)
    if not opening: raise ValueError('Unexpected DocsLayout props')
    title, description = opening.group(1), opening.group(2)
    body=body[:opening.start()] + body[opening.end():]
    if not re.search(r'</DocsLayout>\s*$',body): raise ValueError('Missing DocsLayout close')
    body=re.sub(r'</DocsLayout>\s*$','',body)
    # The converter is explicitly limited to the static diagrams and YAML snippets.
    body=re.sub(r'<Code\s+(?P<attrs>.*?)/>',code_component,body,flags=re.S)
    body=re.sub(r'<AnimatedDiagram\s+(?P<attrs>.*?)/>',animation_component,body,flags=re.S)
    # Data-driven tables are pre-rendered for SEO and work with JS disabled.
    cases={
     '{scopeRows.map(([key,def,desc])=><tr><td><code>{key}</code></td><td>{def}</td><td>{desc}</td></tr>)}':table_rows(data['scopeRows'],('key','def','desc')),
     '{mat.map(([name,number,desc])=><tr><td><code>{name}</code></td><td><strong>{number}</strong></td><td>{desc}</td></tr>)}':table_rows(data['mat'],('name','number','desc')),
     '{globalRows.map(([key,def,desc])=><tr><td><code>{key}</code></td><td><code>{def}</code></td><td>{desc}</td></tr>)}':table_rows(data['globalRows'],('key','code-def','desc')),
     '{commands.map(([command,meaning,permission])=><tr><td><code>{command}</code></td><td>{meaning}</td><td>{permission}</td></tr>)}':table_rows(data['commands'],('command','meaning','permission')),
    }
    for frm, to in cases.items(): body=body.replace(frm,to)
    body, inline=extract_script(body)
    if re.search(r'</?[A-Z][A-Za-z]*|\{(?:scopeRows|globalRows|mat|commands)\.',body):
        raise ValueError(f'Unrendered Astro component or data expression: {body[:200]}')
    if re.search(r'(\{[A-Za-z][\w]*(?:\.|\})|<slot\b)',body):
        raise ValueError('Unrendered runtime variable remains in page')
    return title, description, body, inline

def nav_markup(nav: list,path: str) -> str:
    sections=[]
    for section in nav:
        items=''.join(f'<a href="{html.escape(item["href"])}" class="navlink"'+ (' aria-current="page"' if item['href']==path else '')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12h8M12 8v8" stroke-linecap="round"/></svg>'+html.escape(item['label'])+'</a>' for item in section['items'])
        sections.append(f'<div><div class="sidebar-section">{html.escape(section["section"])}</div>{items}</div>')
    return ''.join(sections)

def build(src: Path, out: Path):
    data=site_data(src)
    out.mkdir(parents=True,exist_ok=True)
    shutil.copytree(src/'public',out,dirs_exist_ok=True)
    (out/'.nojekyll').touch()
    asset=out/'assets';asset.mkdir(exist_ok=True)
    shutil.copy2(src/'src/styles/global.css',asset/'site.css')
    shutil.copy2(src/'src/lib/limitMath.mjs',asset/'limitMath.mjs')
    layout_fm, layout = extract_frontmatter((src/'src/layouts/DocsLayout.astro').read_text())
    layout, script=extract_script(layout)
    (asset/'site.js').write_text('const searchIndex = '+json.dumps(SEARCH,ensure_ascii=False)+';\n'+js_plain(script))
    dia= (src/'src/components/AnimatedDiagram.astro').read_text()
    _,d=extract_frontmatter(dia)
    _,dia_script=extract_script(d)
    (asset/'diagrams.js').write_text(js_plain(dia_script))
    for stem,dirname in ROUTES.items():
        file=src/'src/pages'/f'{stem}.astro'
        title, description, body, inline=render_body(file.read_text(),data)
        path = '/' if not dirname or stem=='404' else f'/{dirname}/'
        canonical='https://redstonelimiter.arkflame.com'+path
        buf=layout.replace('<slot />',body)
        buf=buf.replace('{nav.map(section => <div>\n        <div class="sidebar-section">{section.section}</div>\n        {section.items.map(item => <a href={item.href} class="navlink" aria-current={path === item.href ? \'page\' : undefined}>\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12h8M12 8v8" stroke-linecap="round"/></svg>{item.label}</a>)}\n      </div>)}', nav_markup(data['nav'],path))
        if '{nav.map' in buf: raise ValueError('Navigation markup not replaced')
        for old,new in [
            ('{description}',html.escape(description,quote=True)),
            ('{canonical}',html.escape(canonical,quote=True)),
            ('{`${title} | RedstoneLimiter Docs`}',html.escape(title+' | RedstoneLimiter Docs',quote=True)),
            ('{source}',html.escape(data['source'])),
        ]: buf=buf.replace(old,new)
        # Parent layout client script is moved into /assets/site.js; no runtime templating remains.
        buf=buf.replace('<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" />','<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" /><link rel="stylesheet" href="/assets/site.css" />')
        scripts='<script src="/assets/site.js" defer></script>'
        if stem=='how-it-works': scripts+='<script src="/assets/diagrams.js" defer></script>'
        if inline:
            text=js_plain(inline)
            if stem=='calculator':
                text=text.replace("from '../lib/limitMath.mjs'", "from '/assets/limitMath.mjs'")
                scripts+='<script type="module">\n'+text+'\n</script>'
            else: scripts+='<script>\n'+text+'\n</script>'
        buf=buf.replace('</body>',scripts+'\n</body>')
        buf=buf.replace('<title>{title} | RedstoneLimiter Docs</title>', '<title>'+html.escape(title)+' | RedstoneLimiter Docs</title>')
        buf=buf.replace('content='+html.escape(description,quote=True)+' />', 'content="'+html.escape(description,quote=True)+'" />')
        buf=buf.replace('content='+html.escape(title+' | RedstoneLimiter Docs',quote=True)+' />', 'content="'+html.escape(title+' | RedstoneLimiter Docs',quote=True)+'" />')
        buf=buf.replace('href='+html.escape(canonical,quote=True)+' />', 'href="'+html.escape(canonical,quote=True)+'" />')
        buf=buf.replace('content='+html.escape(canonical,quote=True)+' />', 'content="'+html.escape(canonical,quote=True)+'" />')
        # Astro's nonstandard tags and syntax must not leak into static HTML.
        if re.search(r'<DocsLayout|<Code\b|<AnimatedDiagram|<slot\b|\{nav\.|\{Astro\.|\{source\}',buf):
            raise ValueError(f'Compiled HTML contains Astro code: {stem}')
        target=out/'404.html' if stem=='404' else out/dirname/'index.html' if dirname else out/'index.html'
        target.parent.mkdir(parents=True,exist_ok=True);target.write_text(buf)
        print(f'BUILT {target.relative_to(out)} ({len(buf):,} chars)')

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--source',type=Path,required=True);ap.add_argument('--output',type=Path,required=True)
    x=ap.parse_args();build(x.source,x.output)
