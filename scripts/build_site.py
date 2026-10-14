"""Rebuild static pages and the public CV from reviewed content. No network calls."""
from pathlib import Path
import json, re, html
from xml.sax.saxutils import escape as xml_escape
ROOT=Path(__file__).resolve().parents[1]
PUBS=json.loads((ROOT/'data/publications.json').read_text())
E=html.escape
EMAIL='dawei.sun.md@gmail.com'
DATE='October 14, 2026'
CV='/assets/Dawei-Sun-CV.pdf'
INSTITUTION='Sub-Laboratory of the State Key Laboratory of Membrane Biology, Hangzhou Lin’an District Qingshan Lake Future Industry and Technology Innovation Center'
HOSPITAL='The Second Affiliated Hospital, Zhejiang University School of Medicine'
TRAINING=[
('2020–2024','Clinical Postdoctoral Fellow','Zhejiang University','September 2020 – February 2024'),
('2020–2023','Residency · Anesthesiology',HOSPITAL,'September 2020 – August 2023'),
('2015–2020','Ph.D. · Anesthesiology','Shanghai Jiao Tong University','September 2015 – June 2020'),
('2010–2015','M.D. · Anesthesiology','Wenzhou Medical University','October 2010 – July 2015')]
PRESENTATIONS=[
('2024','Arterial-venous oxygen difference as a potential indicator for erythrocyte transfusion during cardiac surgery: a prospective observational study.','Sun D, Yao Y, Yan M.','Selected for oral presentation · American Society of Anesthesiologists Annual Meeting · Philadelphia, PA'),
('2019','Angiopep-2 modified PEGylated 2-methoxyestradiol micelles contributes to neuroprotection in a murine cardiac arrest model.','Sun D, Wang X, Hu Y, Cui D.','Best of Abstracts: Basic Science · American Society of Anesthesiologists Annual Meeting · Orlando, FL')]
def author_html(a):return re.sub(r'\bSun D\b', '<strong>Sun D</strong>',E(a))
def citation(p):return p['citation']
def paper(p,compact=False):
 title=E(p.get('verified_title',p['title']))
 if p.get('url'):title=f'<a href="{E(p["url"])}">{title}</a>'
 role=f'<span>{E(p["role"])}</span>' if p['role'] else ''
 authors=f'<p class="authors">{author_html(p["authors"])}.</p>' if not compact else ''
 link=f'<a class="paper-link" href="{E(p["url"])}">View article <span aria-hidden="true">↗</span></a>' if p.get('url') else ''
 return f'<li class="paper" id="paper-{p["id"]}"><div class="paper-meta"><time>{p["year"]}</time>{role}</div><h3>{title}</h3>{authors}<p class="citation">{E(citation(p))}</p>{link}</li>'
def head(title,desc,path='/'):
 return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title><meta name="description" content="{E(desc)}"><meta name="theme-color" content="#172c3d">
<link rel="canonical" href="https://daweisun.com{path}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website"><meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}"><meta property="og:url" content="https://daweisun.com{path}"><meta property="og:site_name" content="Dawei Sun"><meta name="twitter:card" content="summary">
<link rel="stylesheet" href="/assets/site.css"></head>'''
def header(pub=False):
 home='/' if pub else ''
 links=''.join(f'<a href="{home}#{target}">{name}</a>' for target,name in [('clinical','Clinical'),('research','Research')])
 links+=f'<a href="{("/publications.html" if pub else "#publications")}"'+(' aria-current="page"' if pub else '')+'>Publications</a>'
 links+=f'<a href="{home}#training">Training</a><a class="nav-contact" href="{home}#contact">Contact <span aria-hidden="true">↗</span></a>'
 return f'''<a class="skip" href="#main">Skip to content</a><header class="site-header"><div class="wrap header-inner"><a class="brand" href="/" aria-label="Dawei Sun home"><span class="monogram" aria-hidden="true">ds</span>Dawei Sun</a><nav class="nav" aria-label="Main navigation">{links}</nav></div></header>'''
def contact():return f'''<section class="contact-section" id="contact" aria-labelledby="contact-title"><div class="wrap contact-inner"><div><p class="eyebrow">Get in touch</p><h2 id="contact-title">Let’s connect.</h2><p>I welcome conversations about clinical fellowship training,<br class="desktop-break"> perioperative research, and academic collaboration.</p></div><div class="contact-links"><a href="mailto:{EMAIL}">{EMAIL} <span aria-hidden="true">↗</span></a><a class="button" href="{CV}">Download CV <span aria-hidden="true">↓</span></a></div></div></section>'''
def footer():return f'<footer class="wrap footer"><span>© 2026 Dawei Sun · M.D., Ph.D.</span><span>Updated <time datetime="2026-10-14">{DATE}</time> · <a href="/#main">Back to top ↑</a></span></footer></body></html>'
def section(id,num,title,caption,body):return f'<section class="section" id="{id}" aria-labelledby="{id}-title"><div class="wrap section-grid"><div class="section-heading"><p class="eyebrow">{num}</p><h2 id="{id}-title">{title}</h2><p>{caption}</p></div><div class="section-body">{body}</div></div></section>'
hero=f'''<body>{header()}<main id="main"><section class="hero"><div class="wrap"><div class="hero-layout"><div class="hero-identity"><p class="eyebrow">Anesthesiology · Perioperative medicine</p><h1>Dawei Sun<span class="credentials">M.D., Ph.D.</span></h1><p class="hero-role">Anesthesiologist &amp; Clinical Researcher</p><p class="hero-copy">My work connects clinical anesthesia with research in brain protection, patient blood management, and perioperative outcomes. Trained in China, with research experience at UCSF, I am interested in advancing my clinical training through fellowship in the United States.</p><div class="buttons"><a class="button primary" href="{CV}">Download CV <span aria-hidden="true">↓</span></a><a class="button" href="mailto:{EMAIL}">Email Me <span aria-hidden="true">↗</span></a></div></div><aside class="hero-aside" aria-label="Current focus"><p class="aside-label">Clinical perspective.<br>Research foundation.</p><p>A background in perioperative care and translational neuroscience, with an evolving interest in regional anesthesia and ultrasound-guided techniques.</p><p class="aside-note">Currently Associate Researcher<br>Hangzhou, China</p></aside></div><div class="overview" aria-label="Background at a glance"><div><strong>Clinical anesthesia</strong><span>Residency &amp; perioperative care</span></div><div><strong>Translational research</strong><span>Brain protection &amp; clinical outcomes</span></div><div><strong>U.S. experience</strong><span>UCSF research &amp; clinical observership</span></div></div></div></section>'''
clinical=f'''<p class="intro">My clinical foundation is in anesthesiology: evaluating patients before surgery, managing anesthesia throughout the perioperative period, and supporting safe transitions of care.</p><div class="timeline"><article class="timeline-item"><p class="date">September 2023 – October 2024 · Hangzhou, China</p><h3>Anesthesiologist</h3><p class="institution">{HOSPITAL}</p><ul><li>Perioperative anesthesia care across a broad range of surgical procedures, with senior consultation for complex or high-risk cases.</li><li>Pre-anesthetic evaluation, risk assessment, patient optimization, and anesthetic planning.</li><li>Anesthetic induction, intraoperative monitoring and management, emergence, and postoperative handoff.</li><li>Ultrasound-guided regional anesthesia and vascular access, including major peripheral nerve blocks, arterial catheterization, and central venous access.</li><li>Operating-room orientation and case-based teaching for international MBBS and undergraduate medical students.</li></ul></article><article class="timeline-item"><p class="date">September 2020 – August 2023</p><h3>Residency in Anesthesiology</h3><p class="institution">{HOSPITAL}</p></article></div><aside class="interest"><h3>Clinical interests</h3><p>I am particularly interested in regional anesthesia, ultrasound-guided techniques, and perioperative care, while continuing to explore clinical fellowship opportunities across anesthesiology.</p></aside>'''
us='''<div class="us-grid"><article class="experience"><p class="date">October 2026 · Torrance, California</p><span class="tag">Clinical Observership · Anesthesiology</span><h3>Torrance Memorial<br>Hospital</h3><p>Anesthesiology clinical observership.</p></article><article class="experience"><p class="date">October 2018 – October 2019 · San Francisco</p><span class="tag">Visiting Scholar · Neurology &amp; Pediatrics</span><h3>University of California<br>San Francisco</h3><p>Research experience in neonatal hypoxic-ischemic brain injury and neuroprotection.</p></article></div>'''
research='''<article class="research-row"><span class="number" aria-hidden="true">01</span><div><h3>Brain protection &amp; ischemic injury</h3><p>Investigating cellular responses to ischemic injury, with a focus on autophagy, mitophagy, and neonatal hypoxic-ischemic brain injury. This work connects mechanistic neuroscience with questions in perioperative brain protection.</p><p class="research-detail">HIF-2α · Autophagy &amp; mitophagy · Neuroprotection</p></div></article><article class="research-row"><span class="number" aria-hidden="true">02</span><div><h3>Patient blood management</h3><p>Clinical research in transfusion, oxygen delivery, and coagulation in surgical patients, including cardiac surgery. My work includes a prospective observational study of arterial-venous oxygen difference as a potential transfusion indicator.</p><p class="research-detail">Cardiac surgery · Transfusion · Perioperative coagulation</p></div></article><article class="research-row"><span class="number" aria-hidden="true">03</span><div><h3>Perioperative clinical outcomes</h3><p>Clinical trials and observational research addressing anesthetic strategies, postoperative cognition, and patient outcomes. Selected work includes randomized trials in endoscopic sedation and cognitive recovery after carotid endarterectomy.</p><p class="research-detail">Clinical trials · Postoperative cognition · Outcomes research</p></div></article>'''
selected='<ol class="publications-list">'+''.join(paper(next(p for p in PUBS if p['id']==i),True) for i in [23,22,12,8])+'</ol><a class="text-link" href="/publications.html">View all 24 publications &amp; presentations <span aria-hidden="true">↗</span></a>'
training=f'''<div class="timeline"><article class="timeline-item"><p class="date">November 2024 – Present · Hangzhou, China</p><h3>Associate Researcher</h3><p class="institution">{INSTITUTION}</p><p class="institution">Translational and clinical research in perioperative brain injury, patient blood management, and clinical outcomes.</p></article></div><div class="training-list">'''+''.join(f'<article class="training-entry"><p class="date">{E(d)}</p><h3>{E(role)}</h3><p class="institution">{E(inst)}</p></article>' for _,role,inst,d in TRAINING)+'''</div><div class="qualification" aria-label="Professional qualifications"><span>ECFMG Certification · 2026</span><span>USMLE Step 3 · Scheduled</span><span>Physician qualification &amp; practice certificates · China, 2016</span></div>'''
contributions='''<article class="contribution"><p class="date">Principal Investigator · 2024–2026</p><h3>NSFC Young Scientists Fund</h3><p>Funded research on HIF-2α-mediated neuroprotection and the regulation of mitophagy in immature hypoxic-ischemic brain injury.</p></article><article class="contribution"><p class="date">American Society of Anesthesiologists</p><h3>Scientific presentations &amp; recognition</h3><p>Best of Abstracts: Basic Science (2019), and selected oral presentation on oxygen delivery and transfusion during cardiac surgery (2024).</p></article><article class="contribution"><p class="date">Chinese Utility Model Patent · Granted April 21, 2026</p><h3>Continuous oxygen saturation monitoring</h3><p>Co-inventor of a monitoring probe for insertion into a central venous catheter.<br>Patent ZL 2024 2 3305545.1 · Sun D, Luo G, Yao Y, Yan M.</p></article><article class="contribution"><p class="date">Ad Hoc Peer Reviewer · 2024–Present</p><h3>Peer-review service</h3><p>53 peer-review assignments across 17 journals, as of September 2026, including International Journal of Surgery, Journal of Clinical Anesthesia, and Anesthesiology and Perioperative Science.</p></article>'''
home=head('Dawei Sun, M.D., Ph.D. | Anesthesiologist & Clinical Researcher','Clinical anesthesia training, perioperative research, selected publications, and CV of Dawei Sun, M.D., Ph.D.')+hero
home+=section('clinical','01 / Clinical background','Care across the<br>perioperative journey.','Clinical training and experience in anesthesiology.',clinical)
home+=section('us-experience','02 / U.S. experience','Learning across<br>clinical settings.','Clinical observation and visiting research experience.',us)
home+=section('research','03 / Research','Questions from<br>the bedside.','Three connected areas of basic, translational, and clinical research.',research)
home+=section('publications','04 / Selected publications','Selected<br>scholarship.','Representative first-author, co-first-author, and corresponding-author work.',selected)
home+=section('training','05 / Training & qualifications','A clinical &amp;<br>scientific foundation.','Education, postgraduate training, and current academic appointment.',training)
home+=section('contributions','06 / Academic contributions','Beyond<br>the publication.','Research funding, presentations, invention, and peer review.',contributions)
home+='</main>'+contact()+footer()
portrait=next((ROOT/'assets'/name for name in ['portrait.jpg','portrait.png','portrait.webp'] if (ROOT/'assets'/name).exists()),None)
if portrait:
 home=re.sub(r'<aside class="hero-aside".*?</aside>',f'<figure class="hero-portrait"><img src="/assets/{portrait.name}" alt="Portrait of Dawei Sun" width="600" height="750"></figure>',home,flags=re.S)
(ROOT/'index.html').write_text(home)
years=sorted({p['year'] for p in PUBS},reverse=True)
yearnav='<nav class="year-nav" aria-label="Publication years"><p class="eyebrow">Browse by year</p>'+''.join(f'<a href="#year-{y}">{y}</a>' for y in years)+'<a href="#presentations">Presentations</a></nav>'
groups=''
for y in years:
 groups+=f'<section class="year-section" id="year-{y}" aria-labelledby="heading-{y}"><h2 class="year-heading" id="heading-{y}">{y}</h2><ol class="publications-list">'+''.join(paper(p) for p in sorted(PUBS,key=lambda p:p['id'],reverse=True) if p['year']==y)+'</ol></section>'
groups+='<section class="year-section" id="presentations" aria-labelledby="presentations-title"><h2 class="year-heading" id="presentations-title">Scientific presentations</h2>'+''.join(f'<article class="presentation"><p class="date">{y}</p><h3>{E(t)}</h3><p>{author_html(a)}</p><p>{E(where)}</p></article>' for y,t,a,where in PRESENTATIONS)+'</section>'
groups+='<p class="publication-note">Listed by publication year in the September 2026 CV, including online-first publication dates. Conference presentations are listed separately.</p>'
page=head('Publications | Dawei Sun, M.D., Ph.D.','Peer-reviewed publications and scientific presentations by Dawei Sun in anesthesiology, brain protection, blood management, and perioperative outcomes.','/publications.html')+'<body class="publication-page">'+header(True)+'<main id="main"><div class="wrap page-intro"><a class="back-link" href="/">← Back to home</a><p class="eyebrow">Research &amp; scholarship</p><h1>Publications.</h1><p class="intro">24 peer-reviewed publications spanning translational neuroscience, patient blood management, and clinical outcomes.</p><p class="publication-note">My name is highlighted in each author list. First, co-first, and corresponding authorship are noted where applicable.</p></div><div class="wrap publication-layout">'+yearnav+'<div>'+groups+'</div></div></main>'+contact()+footer()
(ROOT/'publications.html').write_text(page)

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
 for _,role,inst,date in TRAINING:entry(date,role.replace('·','-'),inst)
 entry('October 2018 - October 2019','Visiting Scholar - Neurology and Pediatrics','University of California San Francisco, United States')
 sec('LICENSURE AND PROFESSIONAL QUALIFICATIONS')
 for line in ['ECFMG Certification - Educational Commission for Foreign Medical Graduates, United States, 2026','USMLE Step 3 - Scheduled','Associate Senior Professional Title in Research (Associate Researcher), Zhejiang Province, China, 2025','Intermediate Professional Qualification in Anesthesiology, China, 2024','Physician Qualification Certificate and Physician Practice Certificate, China, 2016']:add(xml_escape(line))
 story.append(PageBreak())
 sec('PROFESSIONAL EXPERIENCE')
 entry('November 2024 - Present','Associate Researcher',INSTITUTION.replace('’',"'")+', Hangzhou, China','Translational and clinical research in perioperative brain injury, patient blood management, and clinical outcomes.')
 entry('September 2023 - October 2024','Anesthesiologist',HOSPITAL+', Hangzhou, China')
 for s in ['Provided perioperative anesthesia care across a broad range of surgical procedures, with senior consultation for complex or high-risk cases.','Staffed the preoperative anesthesia clinic: evaluation, risk assessment, patient optimization, and anesthetic planning.','Managed induction, intraoperative monitoring and management, emergence, and postoperative handoff.','Performed ultrasound-guided regional anesthesia and vascular access, including major peripheral nerve blocks, arterial catheterization, and central venous access.','Participated in operating-room orientation and case-based teaching for international MBBS and undergraduate medical students.']:add('- '+s)
 sec('U.S. CLINICAL OBSERVERSHIP')
 entry('October 2026','Clinical Observership - Anesthesiology','Torrance Memorial Hospital, Torrance, California, United States')
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
 add('Public CV updated October 14, 2026. Based on the September 8, 2026 CV; Torrance Memorial Hospital observership added from information supplied by Dawei Sun. Qualification status confirmed by Dawei Sun in October 2026.','note')
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
