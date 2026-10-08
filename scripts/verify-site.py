#!/usr/bin/env python3
"""No-network checks of branch-published GitHub Pages output."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
from subprocess import run
import re
import tempfile

root=Path(__file__).resolve().parents[1]
routes=['index.html','guide/index.html','how-it-works/index.html','configuration/index.html','examples/index.html','calculator/index.html','commands/index.html','faq/index.html','404.html']
visuals=['01-scope-cascade','02-activity-period','03-threshold-sustain','04-multipliers','05-chunk-policy']

class Doc(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.h1=0;self.title=0;self.ids=set();self.links=[];self.scripts=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='h1':self.h1+=1
  if tag=='title':self.title+=1
  if 'id' in a:self.ids.add(a['id'])
  for k in ('href','src'):
   if k in a and a[k]:self.links.append(a[k])

assert (root/'.nojekyll').is_file(), 'Missing root .nojekyll (Jekyll bypass)'
assert (root/'.nojekyll').stat().st_size==0, '.nojekyll should be empty'
assert (root/'index.html').is_file(), 'Must publish built index.html at main/(root)'
assert (root/'CNAME').read_text().strip()=='redstonelimiter.arkflame.com'
assert (root/'_astro-source/public/config.yml').read_bytes()==(root/'config.yml').read_bytes(), 'Plugin config was mutated'
assert (root/'assets/site.css').is_file()
workflow=(root/'.github/workflows/deploy.yml').read_text()
assert 'actions/deploy-pages@' not in workflow, 'Direct branch publishing must not run a competing Pages deploy'
assert 'actions/jekyll-build-pages@' not in workflow

for slug in visuals:
 live=root/f'visuals/{slug}.html'
 original=root/f'_astro-source/public/visuals/{slug}.html'
 assert live.read_bytes()==original.read_bytes(), f'HTML animation changed: {slug}'
 assert 'renderAt' in live.read_text(),f'Animation renderer missing: {slug}'

for rel in routes:
 page=(root/rel).read_text()
 parser=Doc();parser.feed(page)
 assert parser.h1==1, f'{rel}: must contain exactly one H1'
 assert parser.title==1, f'{rel}: missing/duplicate title'
 assert 'RedstoneLimiter Docs' in page
 assert '/assets/site.css' in page
 assert '/assets/site.js' in page
 assert 'src/components/' not in page and '<DocsLayout' not in page and '<Code ' not in page
 assert '{title}' not in page and '{description}' not in page
 for u in parser.links:
  parsed=urlparse(u)
  if parsed.scheme or u.startswith('//') or u.startswith('#') or u.startswith('mailto:'):continue
  assert u.startswith('/'), f'{rel}: link unexpectedly relative {u}'
  path=unquote(parsed.path)
  dst=(root/path.lstrip('/'))
  if dst.is_dir():dst/= 'index.html'
  assert dst.is_file(),f'{rel}: missing internal link {u} -> {dst}'
  if parsed.fragment and dst.suffix=='.html' and '/visuals/' not in path:
   assert re.search(r'\bid="'+re.escape(unquote(parsed.fragment))+r'"',dst.read_text()),f'{rel}: missing anchor target {u}'
 print('ROUTE PASS',rel,'links',len(parser.links))

for js in ('assets/site.js','assets/diagrams.js','assets/limitMath.mjs'):
 result=run(['node','--check',str(root/js)],capture_output=True,text=True)
 assert result.returncode==0,f'{js} invalid JS: {result.stderr}'
 print('SCRIPT PASS',js)

for rel in ['calculator/index.html','configuration/index.html']:
 html=(root/rel).read_text()
 code=re.search(r'<script(?: type="module")?>(.*?)</script>',html,re.S)
 assert code, f'{rel}: expected inline page script'
 result=run(['node','--input-type=module','--check'],input=code.group(1),capture_output=True,text=True)
 assert result.returncode==0, f'{rel} invalid inline JS: {result.stderr}'
 print('INLINE PASS',rel)

assert '<iframe' in (root/'how-it-works/index.html').read_text()
assert (root/'how-it-works/index.html').read_text().count('class="diagram-html"')==5
assert (root/'configuration/index.html').read_text().count('<tr>')>60
assert not list(root.rglob('*.webm')) and not list(root.rglob('*.mp4'))
print('PASS: 9 HTML outputs, root Pages publishing, local links and anchors, JS, all 5 original animations, config parity, zero video files')
