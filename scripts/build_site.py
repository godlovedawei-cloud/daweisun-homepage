"""Rebuild static pages and the public CV from reviewed content. No network calls."""
from pathlib import Path
import json, re, html
from xml.sax.saxutils import escape as xml_escape
ROOT = Path(__file__).resolve().parents[1]
PUBS = json.loads((ROOT / 'data/publications.json').read_text())
E = html.escape
EMAIL = 'dawei.sun.md@gmail.com'
DATE = 'October 14, 2026'
CV = '/assets/Dawei-Sun-CV.pdf'
INSTITUTION = 'Sub-Laboratory of the State Key Laboratory of Membrane Biology, Hangzhou Lin’an District Qingshan Lake Future Industry and Technology Innovation Center'
HOSPITAL = 'The Second Affiliated Hospital, Zhejiang University School of Medicine'
TRAINING = [
    ('2010–2015', 'M.D. · Anesthesiology', 'Wenzhou Medical University', 'October 2010 – July 2015'),
    ('2015–2020', 'Ph.D. · Anesthesiology', 'Shanghai Jiao Tong University', 'September 2015 – June 2020'),
    ('2020–2023', 'Residency · Anesthesiology', HOSPITAL, 'September 2020 – August 2023'),
    ('2020–2024', 'Clinical Postdoctoral Fellow', 'Zhejiang University', 'September 2020 – February 2024'),
]
PRESENTATIONS = [
    ('2024', 'Arterial-venous oxygen difference as a potential indicator for erythrocyte transfusion during cardiac surgery: a prospective observational study.', 'Sun D, Yao Y, Yan M.', 'Selected for oral presentation · American Society of Anesthesiologists Annual Meeting · Philadelphia, PA'),
    ('2019', 'Angiopep-2 modified PEGylated 2-methoxyestradiol micelles contributes to neuroprotection in a murine cardiac arrest model.', 'Sun D, Wang X, Hu Y, Cui D.', 'Best of Abstracts: Basic Science · American Society of Anesthesiologists Annual Meeting · Orlando, FL'),
]


def author_html(authors):
    return re.sub(r'\bSun D\b', '<strong>Sun D</strong>', E(authors))


def citation(publication):
    return publication['citation']


def paper(publication):
    title = E(publication.get('verified_title', publication['title']))
    if publication.get('url'):
        title = f'<a href="{E(publication["url"])}">{title}</a>'
    role = f' <span class="authorship">({E(publication["role"])})</span>' if publication['role'] else ''
    return f'''<li class="paper" id="paper-{publication['id']}">
<h3>{title}</h3>
<p class="authors">{author_html(publication['authors'])}.</p>
<p class="citation">{E(citation(publication))}{role}</p>
</li>'''


def head(title, description, path='/'):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title>
<meta name="description" content="{E(description)}">
<meta name="theme-color" content="#172c3d">
<link rel="canonical" href="https://daweisun.com{path}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(description)}">
<meta property="og:url" content="https://daweisun.com{path}">
<meta property="og:site_name" content="Dawei Sun">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="/assets/site.css">
</head>'''


def header(publications=False):
    home = '/' if publications else ''
    links = ''.join(f'<a href="{home}#{target}">{name}</a>' for target, name in [
        ('training', 'Education & Experience'), ('clinical', 'Clinical'), ('research', 'Research')])
    links += f'<a href="{("/publications.html" if publications else "#publications")}"' + (' aria-current="page"' if publications else '') + '>Publications</a>'
    links += f'<a href="{CV}">CV <span aria-hidden="true">↓</span></a>'
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap header-inner">
<a class="brand" href="/">Dawei Sun<span class="brand-degree">, M.D., Ph.D.</span></a>
<nav class="nav" aria-label="Main navigation">{links}</nav>
</div></header>'''


def footer():
    return f'''<footer class="wrap footer">
<span>© 2026 Dawei Sun · <a href="mailto:{EMAIL}">{EMAIL}</a></span>
<span>Updated <time datetime="2026-10-14">{DATE}</time> · <a href="/#main">Back to top ↑</a></span>
</footer></body></html>'''


def section(identifier, title, body):
    return f'''<section class="section" id="{identifier}" aria-labelledby="{identifier}-title">
<div class="wrap"><h2 id="{identifier}-title">{title}</h2>{body}</div>
</section>'''


def timeline_entry(date, title, institution, detail=''):
    detail_html = f'<p class="timeline-detail">{detail}</p>' if detail else ''
    return f'''<li class="timeline-item">
<p class="timeline-date">{date}</p>
<div class="timeline-content"><h3>{title}</h3><p class="institution">{institution}</p>{detail_html}</div>
</li>'''


portrait = next((ROOT / 'assets' / name for name in ['portrait.jpg', 'portrait.png', 'portrait.webp'] if (ROOT / 'assets' / name).exists()), None)
portrait_html = f'<figure class="hero-portrait"><img src="/assets/{portrait.name}" alt="Dawei Sun" width="783" height="1000" fetchpriority="high"></figure>' if portrait else ''
hero = f'''<body>{header()}
<main id="main">
<section class="hero"><div class="wrap hero-layout{' with-portrait' if portrait else ''}">
<div class="hero-identity">
<h1>Dawei Sun<span class="credentials">M.D., Ph.D.</span></h1>
<p class="hero-role">Anesthesiologist &amp; Clinical Researcher</p>
<p class="hero-location">Hangzhou, China</p>
<a class="hero-email" href="mailto:{EMAIL}">{EMAIL}</a>
<div class="buttons"><a class="button" href="{CV}">Download CV <span aria-hidden="true">↓</span></a></div>
</div>{portrait_html}
</div></section>'''
timeline = '<ol class="career-timeline">'
timeline += timeline_entry('2010 – 2015', 'M.D. in Anesthesiology', 'Wenzhou Medical University', 'October 2010 – July 2015')
timeline += timeline_entry('2015 – 2020', 'Ph.D. in Anesthesiology', 'Shanghai Jiao Tong University', 'September 2015 – June 2020')
timeline += timeline_entry('2018 – 2019', 'Visiting Scholar', 'University of California San Francisco', 'Neurology &amp; Pediatrics · October 2018 – October 2019')
timeline += timeline_entry('2020 – 2024', 'Clinical Postdoctoral Fellowship &amp; Residency', 'Zhejiang University', f'<span class="training-line">Clinical postdoctoral fellowship · September 2020 – February 2024</span><span class="training-line">Anesthesiology residency · September 2020 – August 2023<br>{HOSPITAL}</span>')
timeline += timeline_entry('2023 – 2024', 'Anesthesiologist', HOSPITAL, 'September 2023 – October 2024')
timeline += timeline_entry('2024 – Present', 'Associate Researcher', INSTITUTION, 'November 2024 – Present · Cerebral ischemia and neuroprotection, with a focus on autophagy and mitophagy.')
timeline += timeline_entry('October 2026', 'Clinical Observership · Anesthesiology', 'Torrance Memorial Hospital · Torrance, California', 'Four-week clinical observership.')
timeline += '</ol>'
clinical = '''<ul class="clinical-list">
<li>Pre-anesthetic evaluation, perioperative risk assessment, and anesthetic planning.</li>
<li>Anesthetic induction, intraoperative monitoring and management, emergence, and postoperative handoff.</li>
<li>Ultrasound-guided peripheral nerve blocks and vascular access, including arterial catheterization and central venous access.</li>
<li>Operating-room orientation and case-based teaching for international medical students at Zhejiang University.</li>
</ul>
<div class="qualification" aria-label="Professional qualifications">
<span>ECFMG Certification · 2026</span><span>USMLE Step 3 · Scheduled</span><span>Physician qualification &amp; practice certificates · China, 2016</span>
</div>'''
research = '''<div class="research-list">
<article><h3>Cerebral ischemia &amp; neuroprotection</h3><p>Mechanisms of ischemic brain injury, including the roles of HIF-2α, autophagy, and mitophagy in neuronal survival. Current research focuses on cerebral ischemia and hypoxic-ischemic injury in the immature brain.</p></article>
<article><h3>Patient blood management &amp; oxygen delivery</h3><p>Clinical research exploring physiologic indicators of oxygen delivery and utilization to inform transfusion decisions in cardiac surgery, alongside studies of perioperative coagulation and blood conservation.</p></article>
<article><h3>Clinical trials &amp; anesthetic drugs</h3><p>Randomized controlled trials evaluating the efficacy and safety of ciprofol, a novel intravenous anesthetic, and anesthetic strategies for postoperative cognitive recovery.</p></article>
</div>'''
all_papers = sorted(PUBS, key=lambda p: (p['year'], p['id']), reverse=True)
publications = '<p class="section-note">First, co-first, and corresponding authorship are indicated after each citation.</p><ol class="publications-list">' + ''.join(paper(p) for p in all_papers) + '</ol>'
contributions = '''<dl class="academic-list">
<div><dt>Research funding</dt><dd><strong>NSFC Young Scientists Fund · Principal Investigator, 2024–2026</strong><p>HIF-2α-mediated neuroprotection and the regulation of mitophagy in immature hypoxic-ischemic brain injury.</p></dd></div>
<div><dt>ASA presentations</dt><dd><strong>Best of Abstracts: Basic Science · 2019</strong><p>Neuroprotection in a murine cardiac arrest model.</p><strong>Selected oral presentation · 2024</strong><p>Arterial-venous oxygen difference and transfusion during cardiac surgery.</p></dd></div>
<div><dt>Patent</dt><dd><strong>Continuous oxygen saturation monitoring probe</strong><p>Co-inventor · Chinese Utility Model Patent ZL 2024 2 3305545.1. Granted April 21, 2026.</p></dd></div>
<div><dt>Peer review</dt><dd><p>53 assignments across 17 journals, as of September 2026, including <em>International Journal of Surgery</em>, <em>Journal of Clinical Anesthesia</em>, and <em>Anesthesiology and Perioperative Science</em>.</p></dd></div>
</dl>'''
home = head('Dawei Sun, M.D., Ph.D. | Anesthesiologist & Clinical Researcher', 'Education, clinical experience, research, publications, and curriculum vitae of Dawei Sun, M.D., Ph.D.') + hero
home += section('training', 'Education &amp; Experience', timeline)
home += section('clinical', 'Clinical Experience', clinical)
home += section('research', 'Research', research)
home += section('publications', 'Publications', publications)
home += section('contributions', 'Academic Service &amp; Recognition', contributions)
home += '</main>' + footer()
(ROOT / 'index.html').write_text(home)

years = sorted({p['year'] for p in PUBS}, reverse=True)
yearnav = '<nav class="year-nav" aria-label="Publication years">' + ''.join(f'<a href="#year-{y}">{y}</a>' for y in years) + '<a href="#presentations">Presentations</a></nav>'
groups = ''
for year in years:
    groups += f'<section class="year-section" id="year-{year}" aria-labelledby="heading-{year}"><h2 class="year-heading" id="heading-{year}">{year}</h2><ol class="publications-list">' + ''.join(paper(p) for p in all_papers if p['year'] == year) + '</ol></section>'
groups += '<section class="year-section" id="presentations" aria-labelledby="presentations-title"><h2 class="year-heading" id="presentations-title">Scientific Presentations</h2>' + ''.join(f'<article class="presentation"><p class="date">{year}</p><h3>{E(title)}</h3><p>{author_html(authors)}</p><p>{E(where)}</p></article>' for year, title, authors, where in PRESENTATIONS) + '</section>'
groups += '<p class="publication-note">Listed by publication year in the September 2026 CV, including online-first dates. Conference presentations are listed separately.</p>'
page = head('Publications | Dawei Sun, M.D., Ph.D.', 'Peer-reviewed publications and scientific presentations by Dawei Sun.', '/publications.html') + '<body class="publication-page">' + header(True) + '<main id="main"><div class="wrap page-intro"><a class="back-link" href="/">← Back to home</a><h1>Publications</h1><p class="section-note">First, co-first, and corresponding authorship are indicated after each citation.</p>' + yearnav + '</div><div class="wrap publication-layout">' + groups + '</div></main>' + footer()
(ROOT / 'publications.html').write_text(page)


def build_cv():
 from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,KeepTogether,PageBreak
 from reportlab.lib.styles import ParagraphStyle
 from reportlab.lib import colors
 from reportlab.lib.enums import TA_LEFT
 from reportlab.lib.pagesizes import A4
 from reportlab.pdfbase import pdfmetrics
 from reportlab.pdfbase.ttfonts import TTFont
 # Bundle fonts keep the exported PDF searchable and cover Greek characters.
 fontdir=Path('/System/Library/Fonts/Supplemental')
 pdfmetrics.registerFont(TTFont('CV',str(fontdir/'Arial.ttf')))
 pdfmetrics.registerFont(TTFont('CV-Bold',str(fontdir/'Arial Bold.ttf')))
 pdfmetrics.registerFontFamily('CV',normal='CV',bold='CV-Bold',italic='CV',boldItalic='CV-Bold')
 styles={
 'name':ParagraphStyle('name',fontName='CV',fontSize=25,leading=31,textColor=colors.HexColor('#172c3d'),spaceAfter=9),
 'sub':ParagraphStyle('sub',fontName='CV',fontSize=10,leading=15,textColor=colors.HexColor('#53636c'),spaceAfter=7),
 'section':ParagraphStyle('section',fontName='CV-Bold',fontSize=11,leading=15,textColor=colors.HexColor('#326b5c'),spaceBefore=16,spaceAfter=9,keepWithNext=True),
 'body':ParagraphStyle('body',fontName='CV',fontSize=9.5,leading=14,spaceAfter=7),
 'pub':ParagraphStyle('pub',fontName='CV',fontSize=8.8,leading=12.8,spaceAfter=10),
 'note':ParagraphStyle('note',fontName='CV',fontSize=8,leading=11,textColor=colors.HexColor('#53636c'),spaceAfter=8)}
 story=[]
 def text(s,style='body'):return Paragraph(re.sub('[\u2010-\u2015]', '-', s.replace('Ⅺ','XI')),styles[style])
 def add(s,style='body'):story.append(text(s,style))
 def sec(s):add(s,'section')
 def entry(date,title,inst,extra=''):
  s=f'<b>{xml_escape(title)}</b><br/>{xml_escape(inst)}<br/>{xml_escape(date)}'
  if extra:s+='<br/>'+xml_escape(extra)
  story.append(KeepTogether([text(s)]))
 add('Dawei Sun, M.D., Ph.D.','name')
 add('Anesthesiologist &amp; Clinical Researcher','sub')
 add(f'<link href="mailto:{EMAIL}">{EMAIL}</link> | <link href="https://daweisun.com">daweisun.com</link>','sub')
 sec('EDUCATION AND TRAINING')
 for _,role,inst,date in TRAINING:
  entry(date,role.replace('·','-'),inst)
  if role.startswith('Ph.D.'):
   entry('October 2018 - October 2019','Visiting Scholar - Neurology and Pediatrics','University of California San Francisco, United States')
 sec('LICENSURE AND PROFESSIONAL QUALIFICATIONS')
 for line in ['ECFMG Certification - Educational Commission for Foreign Medical Graduates, United States, 2026','USMLE Step 3 - Scheduled','Associate Senior Professional Title in Research (Associate Researcher), Zhejiang Province, China, 2025','Intermediate Professional Qualification in Anesthesiology, China, 2024','Physician Qualification Certificate and Physician Practice Certificate, China, 2016']:add(xml_escape(line))
 story.append(PageBreak())
 sec('PROFESSIONAL EXPERIENCE')
 entry('November 2024 - Present','Associate Researcher',INSTITUTION.replace('’',"'")+', Hangzhou, China','Research on cerebral ischemia and neuroprotection, with a focus on autophagy and mitophagy.')
 entry('September 2023 - October 2024','Anesthesiologist',HOSPITAL+', Hangzhou, China')
 for s in ['Provided perioperative anesthesia care across a broad range of surgical procedures, with senior consultation for complex or high-risk cases.','Staffed the preoperative anesthesia clinic: evaluation, risk assessment, patient optimization, and anesthetic planning.','Managed induction, intraoperative monitoring and management, emergence, and postoperative handoff.','Performed ultrasound-guided regional anesthesia and vascular access, including major peripheral nerve blocks, arterial catheterization, and central venous access.','Participated in operating-room orientation and case-based teaching for international medical students at Zhejiang University.']:add('- '+s)
 sec('U.S. CLINICAL OBSERVERSHIP')
 entry('October 2026 - Four weeks','Clinical Observership - Anesthesiology','Torrance Memorial Hospital, Torrance, California, United States')
 sec('RESEARCH FUNDING')
 entry('2024 - 2026','Principal Investigator - NSFC Young Scientists Fund','National Natural Science Foundation of China','Neuroprotection and mechanism of HIF-2α on immature brain hypoxic-ischemic injury by regulating mitophagy.')
 sec('HONORS AND AWARDS')
 add('Best of Abstracts: Basic Science, American Society of Anesthesiologists Annual Meeting, 2019.')
 sec('PATENT')
 add('Sun D, Luo G, Yao Y, Yan M. Continuous oxygen saturation monitoring probe for insertion into a central venous catheter. Chinese Utility Model Patent, ZL 2024 2 3305545.1. Granted April 21, 2026.')
 sec('SELECTED SCIENTIFIC PRESENTATIONS')
 for y,title,authors,where in PRESENTATIONS:add(xml_escape(y+'. '+authors+' '+title+' '+where+'.'))
 story.append(PageBreak())
 sec('PEER-REVIEWED PUBLICATIONS')
 add('Ordered by CV publication year, including online-first dates. First, co-first, and corresponding authorship are marked.','note')
 for i,p in enumerate(sorted(PUBS,key=lambda p:(p['year'],p['id']),reverse=True),1):
  authors=re.sub(r'\bSun D\b','<b>Sun D</b>',xml_escape(p['authors']))
  s=f'{i}. {authors}. {xml_escape(p.get("verified_title",p["title"]))}. {xml_escape(citation(p))}'
  if p['role']:s+=f' <b>({p["role"]})</b>'
  if p.get('doi'):s+=f' DOI: <link href="https://doi.org/{xml_escape(p["doi"])}">{xml_escape(p["doi"])}</link>.'
  story.append(KeepTogether([text(s,'pub')]))
 sec('PROFESSIONAL SERVICE AND LEADERSHIP')
 add('<b>Ad Hoc Peer Reviewer, 2024 - Present</b><br/>Completed 53 peer-review assignments across 17 journals, as of September 2026, including International Journal of Surgery, Anesthesiology and Perioperative Science, Journal of Clinical Anesthesia, Drug Design, Development and Therapy, International Journal of Molecular Sciences, Journal of Clinical Medicine, and Brazilian Journal of Anesthesiology.')
 add('<b>President, Graduate Union</b>, Shanghai Jiao Tong University Affiliated Sixth Hospital, China, 2017 - 2018.')
 add('<b>Vice President, Student Union</b>, Wenzhou Medical University, China, 2014 - 2015.')
 sec('DOCUMENT INFORMATION')
 add('Public CV updated October 14, 2026. Based on the September 8, 2026 CV; Torrance Memorial Hospital observership added from information supplied by Dawei Sun. Qualification status, four-week observership duration, and current cerebral ischemia research focus confirmed by Dawei Sun in October 2026.','note')
 def page(canvas,doc):
  canvas.saveState();w,h=A4
  canvas.setStrokeColor(colors.HexColor('#d8ded8'));canvas.line(44,40,w-44,40)
  canvas.setFont('CV',8);canvas.setFillColor(colors.HexColor('#53636c'))
  canvas.drawString(44,27,'Dawei Sun, M.D., Ph.D. | Curriculum Vitae')
  canvas.drawRightString(w-44,27,str(doc.page));canvas.restoreState()
 doc=SimpleDocTemplate(str(ROOT/'assets/Dawei-Sun-CV.pdf'),pagesize=A4,rightMargin=44,leftMargin=44,topMargin=42,bottomMargin=54,title='Dawei Sun, M.D., Ph.D. - Curriculum Vitae',author='Dawei Sun')
 doc.build(story,onFirstPage=page,onLaterPages=page)
if __name__=='__main__':
 build_cv()
 print('Built index.html, publications.html, assets/Dawei-Sun-CV.pdf')
