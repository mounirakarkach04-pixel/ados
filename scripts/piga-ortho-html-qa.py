from html.parser import HTMLParser
from pathlib import Path
class Check(HTMLParser):
    void={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    def __init__(self): super().__init__(); self.stack=[]; self.ids=set()
    def handle_starttag(self,tag,attrs):
        for key,val in attrs:
            if key=='id':
                assert val not in self.ids,f'duplicate id {val}'
                self.ids.add(val)
        if tag not in self.void: self.stack.append(tag)
    def handle_startendtag(self,tag,attrs): pass
    def handle_endtag(self,tag):
        assert self.stack,f'unexpected </{tag}>'
        actual=self.stack.pop()
        assert actual==tag,f'expected </{actual}> but received </{tag}>'
for file in ['piga-ortho-3d/praxis.html','piga-ortho-3d/workflow.html','piga-ortho-3d/index.html','piga-ortho-3d/dashboard.html','piga-ortho-3d/report.html','piga-ortho-3d/devices.html','piga-ortho-3d/assist.html','piga-ortho-3d/team.html','piga-ortho-3d/auth.html','piga-ortho-3d/inventory.html']:
    html=Path(file).read_text(encoding='utf-8')
    checker=Check();checker.feed(html);checker.close()
    assert not checker.stack,f'unclosed tags in {file}: {checker.stack}'
    print('PIGA ORTHO HTML structure PASS',file,len(checker.ids),'unique ids')
