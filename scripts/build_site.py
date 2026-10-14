"""Rebuild static pages and the public CV from reviewed content. No network calls."""
from pathlib import Path
import json, re, html, hashlib
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
    ('2019', 'Angiopep-2 modified PEGylated 2-methoxyestradiol micelles contributes to neuroprotection in a murine cardiac arrest model.', 'Sun D, Wang X, Hu Y, Cui D.', 'Oral presentation · Best of Abstracts: Basic Science (one of 10 selected abstracts from more than 1,000 submissions) · American Society of Anesthesiologists Annual Meeting · Orlando, FL'),
]


BIOGRAPHY = ('I am an anesthesiologist and clinical researcher with doctoral training at Shanghai Jiao Tong University, '
             'clinical postdoctoral and residency training at Zhejiang University, and visiting research experience at UCSF. '
             'I am outgoing and approachable, enjoy helping patients and colleagues, and take my clinical responsibilities seriously. '
             'I bring a solid clinical foundation in perioperative anesthesia and ultrasound-guided procedures, with experience helping establish a preoperative anesthesia clinic. '
             'I am currently an Associate Researcher whose work focuses on cerebral ischemia and neuroprotection.')
REVIEW_JOURNALS = ['International Journal of Surgery', 'Anesthesiology and Perioperative Science', 'Journal of Clinical Anesthesia', 'Drug Design, Development and Therapy', 'International Journal of Molecular Sciences', 'Journal of Clinical Medicine', 'Brazilian Journal of Anesthesiology', 'Abdominal Radiology', 'Anesthesia Research', 'Biomedicines', 'Emergency Care and Medicine', 'Healthcare', 'Journal of Anesthesia and Translational Medicine', 'Journal of Personalized Medicine', 'Journal of Vascular Diseases', 'Methods and Protocols', 'Open Medicine']


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


def version_assets(markup):
    def with_version(match):
        asset_path = match.group(2)
        digest = hashlib.sha256((ROOT / asset_path.lstrip('/')).read_bytes()).hexdigest()[:10]
        return f'{match.group(1)}="{asset_path}?v={digest}"'
    return re.sub(r'(src|href)="(/assets/[^"?]+\.(?:css|jpg|png|webp|svg))"', with_version, markup)


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
<a class="hero-email" href="mailto:{EMAIL}">{EMAIL}</a>
<div class="buttons"><a class="button" href="{CV}">Download CV <span aria-hidden="true">↓</span></a></div>
</div>{portrait_html}
<p class="bio">{E(BIOGRAPHY)}</p>
</div></section>'''
timeline = '<ol class="career-timeline">'
timeline += timeline_entry('November 2026', 'Clinical Observer', 'University of Utah Hospital<br>Department of Anesthesiology, Perioperative &amp; Pain Medicine', 'Four-week clinical observership.')
timeline += timeline_entry('October 2026', 'Clinical Observer', 'Torrance Memorial Hospital<br>Department of Anesthesiology · Torrance, California', 'Four-week clinical observership.')
timeline += timeline_entry('November 2024 – Present', 'Associate Researcher', INSTITUTION, 'Cerebral ischemia and neuroprotection, with a focus on autophagy and mitophagy.')
timeline += timeline_entry('September 2023 – October 2024', 'Anesthesiologist', HOSPITAL, 'Contributed to establishing the preoperative anesthesia clinic and improving its workflows.')
timeline += timeline_entry('September 2020 – February 2024', 'Clinical Postdoctoral Fellow', 'Zhejiang University', 'Anesthesiology')
timeline += timeline_entry('September 2020 – August 2023', 'Residency in Anesthesiology', HOSPITAL, 'Training included an intensive care unit (ICU) rotation.')
timeline += timeline_entry('October 2018 – October 2019', 'Visiting Scholar', 'University of California San Francisco', 'Neurology &amp; Pediatrics')
timeline += timeline_entry('September 2015 – June 2020', 'Ph.D. in Anesthesiology', 'Shanghai Jiao Tong University')
timeline += timeline_entry('October 2010 – July 2015', 'M.D. in Anesthesiology', 'Wenzhou Medical University')
timeline += '</ol>'
clinical = '''<ul class="clinical-list">
<li>Pre-anesthetic evaluation, perioperative risk assessment, and anesthetic planning.</li>
<li>Anesthetic induction, intraoperative monitoring and management, emergence, and postoperative handoff.</li>
<li>Ultrasound-guided peripheral nerve blocks and vascular access, including arterial catheterization and central venous access.</li>
<li>Operating-room orientation and case-based teaching for international medical students at Zhejiang University.</li>
</ul>
<article class="clinic-development" id="clinic-development">
<h3>Preoperative Clinic Development &amp; Workflow Improvement</h3>
<p>At the Second Affiliated Hospital, Zhejiang University School of Medicine, I helped establish the preoperative anesthesia clinic and supported its implementation. My contributions included:</p>
<ul>
<li>Defining patient screening criteria and preoperative assessment workflows.</li>
<li>Supporting IT system optimization to improve clinic workflows.</li>
<li>Helping develop critical-value alerts and escalation processes.</li>
<li>Coordinating preoperative communication across clinical departments.</li>
</ul>
</article>
<div class="clinical-gallery" aria-label="Clinical teaching, residency training, and clinic work">
<figure class="clinical-photo">
<img src="/assets/clinical/teaching.jpg" width="1400" height="1050" loading="lazy" decoding="async" alt="Dawei Sun demonstrating airway management using a training mannequin with students.">
<figcaption><strong>Clinical teaching</strong><span>Simulation-based teaching at Zhejiang University.</span></figcaption>
</figure>
<figure class="clinical-photo" id="icu-training-photo">
<img src="/assets/clinical/icu-residency.jpg" width="1400" height="1050" loading="lazy" decoding="async" alt="Dawei Sun during an intensive care unit rotation as part of anesthesiology residency.">
<figcaption><strong>Residency training</strong><span>Intensive care unit rotation during anesthesiology residency.</span></figcaption>
</figure>
<figure class="clinical-photo">
<img src="/assets/clinical/preoperative-clinic.jpg" width="1400" height="1050" loading="lazy" decoding="async" alt="Dawei Sun working in the preoperative anesthesia clinic.">
<figcaption><strong>Preoperative anesthesia clinic</strong><span>Clinical work at the Second Affiliated Hospital, Zhejiang University School of Medicine.</span></figcaption>
</figure>
</div>
<div class="qualification" aria-label="Professional qualifications">
<span>ECFMG Certification · 2026</span><span>USMLE Step 3 · Scheduled</span><span>Intermediate Professional Qualification in Anesthesiology · China, 2024</span>
</div>'''
research = '<p class="research-statement">' + (
    'My research focuses on cerebral ischemia and neuroprotection, particularly the roles of autophagy, mitophagy, and HIF-2α in neuronal survival after hypoxic-ischemic injury. '
    'My doctoral work and visiting research at UCSF provided a foundation in experimental neuroscience. '
    'During clinical postdoctoral training, I also conducted prospective and retrospective studies of patient blood management and perioperative outcomes. '
    'This work includes exploring physiologic indicators of oxygen delivery and utilization to inform transfusion decisions in cardiac surgery, as well as studies of blood conservation and coagulation. '
    'I have also contributed as a corresponding author to randomized controlled trials of ciprofol, a novel intravenous anesthetic, and anesthetic strategies for postoperative cognitive recovery.'
) + '</p><figure class="research-figure"><img src="/assets/neuronal-research.png" width="738" height="414" loading="lazy" decoding="async" alt="Illustration of a neuron and its branching processes."></figure>'
all_papers = sorted(PUBS, key=lambda p: (p['year'], p['id']), reverse=True)
publications = '<p class="section-note">First, co-first, and corresponding authorship are indicated after each citation.</p><ol class="publications-list">' + ''.join(paper(p) for p in all_papers) + '</ol>'
asa_presentations = ''.join(
    f'<div class="service-presentation"><strong>Oral presentation · {year}'
    + (' · Best of Abstracts: Basic Science' if year == '2019' else '')
    + f'</strong><p>{E(title)}</p>'
    + ('<p>One of 10 abstracts selected for the Best of Abstracts: Basic Science oral session from more than 1,000 submissions.</p>' if year == '2019' else '')
    + '</div>'
    for year, title, _, _ in PRESENTATIONS)
journal_list = '<ul class="journal-list">' + ''.join(f'<li><em>{E(journal)}</em></li>' for journal in REVIEW_JOURNALS) + '</ul>'
contributions = f'''<dl class="academic-list">
<div><dt>Research funding</dt><dd><strong>NSFC Young Scientists Fund · Principal Investigator, 2024–2026</strong><p>HIF-2α-mediated neuroprotection and the regulation of mitophagy in immature hypoxic-ischemic brain injury.</p></dd></div>
<div><dt>ASA presentations</dt><dd>{asa_presentations}</dd></div>
<div><dt>Patent</dt><dd><strong>Continuous oxygen saturation monitoring probe</strong><p>Developed from my interest in oxygen monitoring, this patent describes a probe designed for placement within a central venous catheter to continuously monitor central venous oxygen saturation (ScvO₂). The intended application is to help assess the balance between oxygen delivery and consumption in real time.</p><p>Co-inventor · Chinese Utility Model Patent ZL 2024 2 3305545.1. Granted April 21, 2026.</p></dd></div>
<div><dt>Volunteer service</dt><dd><strong>Ad Hoc Peer Reviewer · 2024–Present</strong><p>53 peer-review assignments across 17 journals, as of September 2026. Journals include:</p>{journal_list}</dd></div>
<div><dt>Leadership</dt><dd><strong>President, Graduate Student Union · 2017–2018</strong><p>Shanghai Jiao Tong University Affiliated Sixth Hospital</p><strong>Vice President, Student Union · 2014–2015</strong><p>Wenzhou Medical University</p></dd></div>
</dl>'''
home = head('Dawei Sun, M.D., Ph.D. | Anesthesiologist & Clinical Researcher', 'Education, clinical experience, research, publications, and curriculum vitae of Dawei Sun, M.D., Ph.D.') + hero
home += section('training', 'Education &amp; Experience', timeline)
home += section('clinical', 'Clinical Experience', clinical)
home += section('research', 'Research', research)
home += section('publications', 'Publications', publications)
home += section('contributions', 'Academic Service &amp; Leadership', contributions)
home += '</main>' + footer()
(ROOT / 'index.html').write_text(version_assets(home))

years = sorted({p['year'] for p in PUBS}, reverse=True)
yearnav = '<nav class="year-nav" aria-label="Publication years">' + ''.join(f'<a href="#year-{y}">{y}</a>' for y in years) + '<a href="#presentations">Presentations</a></nav>'
groups = ''
for year in years:
    groups += f'<section class="year-section" id="year-{year}" aria-labelledby="heading-{year}"><h2 class="year-heading" id="heading-{year}">{year}</h2><ol class="publications-list">' + ''.join(paper(p) for p in all_papers if p['year'] == year) + '</ol></section>'
groups += '<section class="year-section" id="presentations" aria-labelledby="presentations-title"><h2 class="year-heading" id="presentations-title">Scientific Presentations</h2>' + ''.join(f'<article class="presentation"><p class="date">{year}</p><h3>{E(title)}</h3><p>{author_html(authors)}</p><p>{E(where)}</p></article>' for year, title, authors, where in PRESENTATIONS) + '</section>'
groups += '<p class="publication-note">Listed by publication year in the September 2026 CV, including online-first dates. Conference presentations are listed separately.</p>'
page = head('Publications | Dawei Sun, M.D., Ph.D.', 'Peer-reviewed publications and scientific presentations by Dawei Sun.', '/publications.html') + '<body class="publication-page">' + header(True) + '<main id="main"><div class="wrap page-intro"><a class="back-link" href="/">← Back to home</a><h1>Publications</h1><p class="section-note">First, co-first, and corresponding authorship are indicated after each citation.</p>' + yearnav + '</div><div class="wrap publication-layout">' + groups + '</div></main>' + footer()
(ROOT / 'publications.html').write_text(version_assets(page))


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
 'pub':ParagraphStyle('pub',fontName='CV',fontSize=8.8,leading=12.8,spaceAfter=8),
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
  entry(date,role.replace('·','-'),inst,'Training included an intensive care unit (ICU) rotation.' if role.startswith('Residency') else '')
  if role.startswith('Ph.D.'):
   entry('October 2018 - October 2019','Visiting Scholar - Neurology and Pediatrics','University of California San Francisco, United States')
 sec('LICENSURE AND PROFESSIONAL QUALIFICATIONS')
 for line in ['ECFMG Certification - Educational Commission for Foreign Medical Graduates, United States, 2026','USMLE Step 3 - Scheduled','Associate Senior Professional Title in Research (Associate Researcher), Zhejiang Province, China, 2025','Intermediate Professional Qualification in Anesthesiology, China, 2024','Physician Qualification Certificate and Physician Practice Certificate, China, 2016']:add(xml_escape(line))
 sec('HONORS AND AWARDS')
 add('One of 10 abstracts selected for the Best of Abstracts: Basic Science oral session from more than 1,000 submissions, American Society of Anesthesiologists Annual Meeting, 2019.')
 sec('PATENT')
 add('Sun D, Luo G, Yao Y, Yan M. Continuous oxygen saturation monitoring probe for insertion into a central venous catheter. Chinese Utility Model Patent, ZL 2024 2 3305545.1. Granted April 21, 2026.')
 add('A probe designed for placement within a central venous catheter to continuously monitor central venous oxygen saturation (ScvO2), intended to support real-time assessment of the balance between oxygen delivery and consumption.')
 story.append(PageBreak())
 sec('PROFESSIONAL EXPERIENCE')
 entry('November 2024 - Present','Associate Researcher',INSTITUTION.replace('’',"'")+', Hangzhou, China','Research on cerebral ischemia and neuroprotection, with a focus on autophagy and mitophagy.')
 entry('September 2023 - October 2024','Anesthesiologist',HOSPITAL+', Hangzhou, China')
 for s in ['Provided perioperative anesthesia care across a broad range of surgical procedures, with senior consultation for complex or high-risk cases.','Staffed the preoperative anesthesia clinic: evaluation, risk assessment, patient optimization, and anesthetic planning.','Helped establish the preoperative anesthesia clinic, including patient screening criteria and assessment workflows.','Supported clinic IT system optimization, critical-value alerts and escalation processes, and preoperative communication across departments.','Managed induction, intraoperative monitoring and management, emergence, and postoperative handoff.','Performed ultrasound-guided regional anesthesia and vascular access, including major peripheral nerve blocks, arterial catheterization, and central venous access.','Participated in operating-room orientation and case-based teaching for international medical students at Zhejiang University.']:add('- '+s)
 sec('U.S. CLINICAL OBSERVERSHIP')
 entry('November 2026 - Four weeks','Clinical Observer','University of Utah Hospital, United States','Department of Anesthesiology, Perioperative & Pain Medicine')
 entry('October 2026 - Four weeks','Clinical Observer','Torrance Memorial Hospital, Torrance, California, United States','Department of Anesthesiology')
 sec('RESEARCH FUNDING')
 entry('2024 - 2026','Principal Investigator - NSFC Young Scientists Fund','National Natural Science Foundation of China','Neuroprotection and mechanism of HIF-2α on immature brain hypoxic-ischemic injury by regulating mitophagy.')
 story.append(PageBreak())
 sec('PEER-REVIEWED PUBLICATIONS')
 add('Ordered by CV publication year, including online-first dates. First, co-first, and corresponding authorship are marked.','note')
 for i,p in enumerate(sorted(PUBS,key=lambda p:(p['year'],p['id']),reverse=True),1):
  authors=re.sub(r'\bSun D\b','<b>Sun D</b>',xml_escape(p['authors']))
  s=f'{i}. {authors}. {xml_escape(p.get("verified_title",p["title"]))}. {xml_escape(citation(p))}'
  if p['role']:s+=f' <font color="#bf391b"><b>({p["role"]})</b></font>'
  if p.get('doi'):s+=f' DOI: <link href="https://doi.org/{xml_escape(p["doi"])}">{xml_escape(p["doi"])}</link>.'
  story.append(KeepTogether([text(s,'pub')]))
 sec('SELECTED SCIENTIFIC PRESENTATIONS')
 for y,title,authors,where in PRESENTATIONS:add(xml_escape(y+'. '+authors+' '+title+' '+where+'.'))
 sec('PROFESSIONAL SERVICE AND LEADERSHIP')
 add('<b>Volunteer Service - Ad Hoc Peer Reviewer, 2024 - Present</b><br/>Completed 53 peer-review assignments across 17 journals, as of September 2026, including ' + ', '.join(REVIEW_JOURNALS[:-1]) + ', and ' + REVIEW_JOURNALS[-1] + '.')
 add('<b>President, Graduate Student Union</b>, Shanghai Jiao Tong University Affiliated Sixth Hospital, China, 2017 - 2018.')
 add('<b>Vice President, Student Union</b>, Wenzhou Medical University, China, 2014 - 2015.')
 add('Public CV updated October 14, 2026. Based on the September 2026 CV; observerships and clinic contributions updated from information supplied by Dawei Sun.','note')
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
