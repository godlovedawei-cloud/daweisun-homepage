"""Rebuild static pages and the public CV from reviewed content. No network calls."""
from pathlib import Path
import json, re, html, hashlib, runpy, sys
from xml.sax.saxutils import escape as xml_escape
ROOT = Path(__file__).resolve().parents[1]
PUBS = json.loads((ROOT / 'data/publications.json').read_text())
CLINICAL = json.loads((ROOT / 'data/clinical-experience.json').read_text())
E = html.escape
EMAIL = 'dawei.sun.md@gmail.com'
DATE = 'October 28, 2026'
SHOW_CLINICAL_VOLUMES = False
CV = '/assets/Dawei-Sun-CV.pdf'
ORCID = 'https://orcid.org/0000-0002-6631-8527'
SCHOLAR = 'https://scholar.google.com/citations?user=Jt5Ds1kAAAAJ&hl=en'
GRANT_TITLE = 'Protective effects and mechanisms of HIF-2α in immature brain hypoxic-ischemic injury through regulation of mitophagy'
POSTDOC_NOTE = ('China’s clinical postdoctoral program integrates research with standardized residency training. '
                'This appointment overlapped my residency and the beginning of my subsequent anesthesiologist role.')
POSTDOC_RESEARCH = ('Led the implementation of a clinical study of intraoperative oxygen supply–demand balance in cardiac and major vascular surgery. '
                    'A total of 1,560 cardiac surgery patients were enrolled, with 314 included in the final analysis.')
RESIDENCY_DETAIL = ('Standardized Residency Training (national program), three years. '
                    'Adult anesthesia: 1,200 cases, including cardiac, neurosurgical, and emergency anesthesia; '
                    'obstetric and gynecologic anesthesia: 140 cases; pediatric anesthesia: 220 cases. '
                    'Rotations included emergency medicine, intensive care, cardiology, neurology, and endocrinology.')
ANESTHESIOLOGIST_DETAIL = ('Surgical anesthesia, research, participation in establishing the preoperative anesthesia clinic, '
                          'and management of the preoperative preparation area for arterial line placement, '
                          'central venous catheterization, and peripheral nerve blocks.')
# Web-only wording; retain the existing public PDF's reviewed content.
WEB_ANESTHESIOLOGIST_DETAIL = 'Surgical anesthesia, research, and participation in establishing the preoperative anesthesia clinic.'
WEB_POSTDOC_DETAIL = ('China’s clinical postdoctoral program integrates research with standardized residency training. '
                     'During this fellowship, I led the implementation of a study of intraoperative oxygen supply–demand balance '
                     'in cardiac and major vascular surgery. The study enrolled 1,560 cardiac surgery patients, '
                     'with 314 included in the final analysis.')
UCSF_RESEARCH = 'Research on neonatal hypoxic-ischemic encephalopathy. Research mentor: Donna M. Ferriero.'
PHD_RESEARCH = 'Research on cerebral ischemia.'
# Fill only from the confirmed Torrance observation log; None means not yet entered.
TORRANCE_OBSERVATION_COUNTS = {'Surgical cases observed': None, 'Nerve blocks observed': None}
QUALIFICATIONS = [
    'ECFMG Certification · 2026',
    'USMLE Step 1 · Pass',
    'USMLE Step 2 CK · Pass',
    'OET Medicine · Pass',
    'USMLE Step 3 · Planned completion before December 2026',
    'Attending Physician qualification · Intermediate professional title, Anesthesiology · China, 2024',
    'Physician Qualification Certificate and Physician Practice Certificate · China, 2016',
    'Associate Senior Professional Title in Research (Associate Researcher) · Zhejiang Province, China, 2025',
]
INSTITUTION = 'Sub-Laboratory of the State Key Laboratory of Membrane Biology, Hangzhou Lin’an District Qingshan Lake Future Industry and Technology Innovation Center'
HOSPITAL = 'The Second Affiliated Hospital, Zhejiang University School of Medicine'
TRAINING = [
    ('2010–2015', 'Bachelor of Medicine in Medicine', 'Wenzhou Medical University', 'October 2010 – July 2015'),
    ('2015–2020', 'Ph.D. · Anesthesiology', 'Shanghai Jiao Tong University', 'September 2015 – June 2020'),
    ('2020–2023', 'Residency · Anesthesiology', HOSPITAL, 'September 2020 – August 2023'),
    ('2020–2024', 'Clinical Postdoctoral Fellow', 'Zhejiang University', 'September 2020 – February 2024'),
]
PRESENTATIONS = [
    ('2024', 'Arterial-venous oxygen difference as a potential indicator for erythrocyte transfusion during cardiac surgery: a prospective observational study.', 'Sun D, Yao Y, Yan M.', 'Selected for oral presentation · American Society of Anesthesiologists Annual Meeting · Philadelphia, PA'),
    ('2019', 'Angiopep-2 modified PEGylated 2-methoxyestradiol micelles contributes to neuroprotection in a murine cardiac arrest model.', 'Sun D, Wang X, Hu Y, Cui D.', 'Oral presentation · Best of Abstracts: Basic Science (one of 10 selected abstracts from more than 1,000 submissions) · American Society of Anesthesiologists Annual Meeting · Orlando, FL'),
]


BIOGRAPHY_PARAGRAPHS = [
    'I am an anesthesiologist and researcher. I completed anesthesiology residency at the Second Affiliated Hospital of Zhejiang University School of Medicine, managing more than 1,500 cases across cardiac, neurosurgical, obstetric, and pediatric anesthesia, and then practiced there as an anesthesiologist, where I helped build the hospital’s preoperative anesthesia clinic.',
    'In the laboratory, I study how to protect the brain when its blood and oxygen supply is interrupted, as in cardiac arrest or oxygen deprivation at birth. I began this work during my Ph.D. at Shanghai Jiao Tong University, extended it to the newborn brain with Donna Ferriero at UCSF, and now lead it as principal investigator on a National Natural Science Foundation of China grant.',
    'My clinical research addresses practical questions in everyday anesthesia care. I led a randomized, double-blind trial in 344 patients showing that ciprofol, a newer alternative to propofol with less hypotension and injection pain, can be used alone for upper endoscopy sedation, without an added opioid, as effectively as ciprofol plus fentanyl, while keeping breathing and blood pressure steadier. I also led a prospective study in cardiac surgery testing whether the difference between arterial and venous oxygen levels can tell clinicians when a blood transfusion is truly needed. That work was selected for oral presentation at the 2024 ASA Annual Meeting and led me to design a probe for continuous venous oxygen monitoring.',
    'I have also helped develop large population studies using the UK Biobank, each including more than 160,000 participants, on how lifestyle and cardiovascular health shape heart disease and disease-free life expectancy.',
    'I am ECFMG-certified and seeking clinical fellowship training in anesthesiology in the United States.',
]
REVIEW_JOURNALS = ['International Journal of Surgery', 'Anesthesiology and Perioperative Science', 'Journal of Clinical Anesthesia', 'Drug Design, Development and Therapy', 'International Journal of Molecular Sciences', 'Journal of Clinical Medicine', 'Brazilian Journal of Anesthesiology', 'Abdominal Radiology', 'Anesthesia Research', 'Biomedicines', 'Emergency Care and Medicine', 'Healthcare', 'Journal of Anesthesia and Translational Medicine', 'Journal of Personalized Medicine', 'Journal of Vascular Diseases', 'Methods and Protocols', 'Open Medicine']
REVIEW_HIGHLIGHTS = ['Journal of Clinical Anesthesia', 'International Journal of Surgery', 'Brazilian Journal of Anesthesiology', 'Anesthesiology and Perioperative Science', 'Journal of Anesthesia and Translational Medicine']


def profiles():
    return f'<nav class="academic-profiles" aria-label="Academic profiles"><a href="{ORCID}">ORCID</a><a href="{E(SCHOLAR)}">Google Scholar</a></nav>'


def torrance_counts():
    if not SHOW_CLINICAL_VOLUMES:
        return ''
    fields = ''.join(
        f'<span>{E(label)}: <span class="observation-count">'
        + (f'{value:,}' if value is not None else '<span aria-label="Not yet entered">—</span>')
        + '</span></span>'
        for label, value in TORRANCE_OBSERVATION_COUNTS.items())
    return '<span class="observership-counts">' + fields + '</span>'


def clinical_tables():
    output = '<div class="clinical-volumes"><h3>Clinical Experience in Numbers</h3>'
    output += '<p class="table-intro">Rounded residency records alongside estimated cumulative experience after a further year of clinical practice.</p>'
    for index, group in enumerate(CLINICAL['groups']):
        output += f'<table class="volume-table" aria-describedby="volume-method"><caption>{E(group["title"])}</caption><thead><tr><th scope="col">Category</th><th scope="col">Residency log<br><span>~July 2023</span></th><th scope="col">Cumulative estimate<br><span>October 2024</span></th></tr></thead><tbody>'
        for row in group['rows']:
            output += f'<tr><th scope="row">{E(row["label"])}</th><td>~{row["logged"]:,}</td><td>~{row["estimated"]:,}</td></tr>'
        output += '</tbody></table>'
    return output + f'<p class="volume-method" id="volume-method">{E(CLINICAL["methodology"])}</p></div>'


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
    return re.sub(r'(src|href)="(/assets/[^"?]+\.(?:css|js|jpg|png|webp|svg))"', with_version, markup)


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
<meta property="og:image" content="https://daweisun.com/assets/portrait.jpg">
<meta property="og:image:width" content="783">
<meta property="og:image:height" content="1000">
<meta property="og:image:alt" content="Dawei Sun, M.D., Ph.D.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://daweisun.com/assets/portrait.jpg">
<link rel="stylesheet" href="/assets/site.css">
<script src="/assets/navigation.js" defer></script>
</head>'''


def header(publications=False):
    home = '/' if publications else ''
    links = ''.join(f'<a href="{home}#{target}">{name}</a>' for target, name in [
        ('training', 'Experience'), ('clinical', 'Clinical'), ('research', 'Research')])
    links += f'<a href="{("/publications.html" if publications else "#publications")}"' + (' aria-current="page"' if publications else '') + '>Publications</a>'
    links += f'<a href="{home}#grants">Grants &amp; Presentations</a>'
    links += '''<details class="tools-menu"><summary>Tools <span aria-hidden="true">▾</span></summary>
<div class="tools-dropdown"><a href="/tools/anesthesia-dosing/">Anesthesia Dose Quick Reference</a></div></details>'''
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap header-inner">
<a class="brand" href="/">Dawei Sun<span class="brand-degree">, M.D., Ph.D.</span></a>
<nav class="nav" aria-label="Main navigation">{links}</nav>
</div></header>'''


def footer():
    return f'''<footer class="wrap footer">
<span>© 2026 Dawei Sun · <a href="mailto:{EMAIL}">{EMAIL}</a></span>
<span>Updated <time datetime="2026-10-28">{DATE}</time> · <a href="/#main">Back to top ↑</a></span>
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
biography_html = [E(paragraph) for paragraph in BIOGRAPHY_PARAGRAPHS]
hospital_mention = 'Second Affiliated Hospital of Zhejiang University School of Medicine'
biography_html[0] = biography_html[0].replace(hospital_mention, f'<a href="https://en.z2hospital.com/">{hospital_mention}</a>', 1)
hero = f'''<body>{header()}
<main id="main" tabindex="-1">
<section class="hero"><div class="wrap hero-layout{' with-portrait' if portrait else ''}">
<div class="hero-identity">
<h1>Dawei Sun<span class="credentials">M.D., Ph.D.</span></h1>
<p class="hero-role">Anesthesiologist &amp; Researcher</p>
<a class="hero-email" href="mailto:{EMAIL}">{EMAIL}</a>
<div class="buttons"><a class="button" href="{CV}">Download CV <span aria-hidden="true">↓</span></a></div>
{profiles()}
</div>{portrait_html}
<div class="bio">{''.join(f'<p>{paragraph}</p>' for paragraph in biography_html)}</div>
</div></section>'''
timeline = '<ol class="career-timeline">'
timeline += timeline_entry('November 2026', 'Clinical Observer', 'University of Utah Hospital<br>Department of Anesthesiology, Perioperative &amp; Pain Medicine', 'Four-week clinical observership.')
timeline += timeline_entry('October 2026', 'Clinical Observer', 'Torrance Memorial Hospital<br>Department of Anesthesiology', 'Four-week clinical observership.' + torrance_counts())
timeline += timeline_entry('November 2024 – Present', 'Associate Researcher', INSTITUTION, 'Cerebral ischemia and neuroprotection, with a focus on autophagy and mitophagy.')
timeline += timeline_entry('September 2023 – October 2024', 'Anesthesiologist', HOSPITAL, E(WEB_ANESTHESIOLOGIST_DETAIL))
timeline += timeline_entry('September 2020 – February 2024', 'Clinical Postdoctoral Fellow', 'Zhejiang University', E(WEB_POSTDOC_DETAIL))
timeline += timeline_entry('September 2020 – August 2023', 'Residency in Anesthesiology', HOSPITAL, E(RESIDENCY_DETAIL))
timeline += timeline_entry('October 2018 – October 2019', 'Visiting Scholar', 'University of California San Francisco', 'Neurology &amp; Pediatrics · ' + E(UCSF_RESEARCH))
timeline += timeline_entry('September 2015 – June 2020', 'Ph.D. in Anesthesiology', 'Shanghai Jiao Tong University', E(PHD_RESEARCH))
timeline += timeline_entry('October 2010 – July 2015', 'Bachelor of Medicine in Medicine', 'Wenzhou Medical University')
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
<figcaption><strong>Preoperative anesthesia clinic</strong><span>Helped develop multidisciplinary workflows for the preoperative anesthesia clinic and optimize pre-anesthetic assessment for day-surgery patients.</span></figcaption>
</figure>
</div>'''
if SHOW_CLINICAL_VOLUMES:
    clinical += clinical_tables()
clinical += '<div class="qualification"><h3>Licensure &amp; Qualifications</h3><ul>' + ''.join(f'<li>{E(line)}</li>' for line in QUALIFICATIONS) + '</ul></div>'
research = '<p class="research-statement">' + (
    'My clinical research examines how physiologic indicators of oxygen delivery and utilization can inform perioperative care and patient blood management. '
    'During clinical postdoctoral training, I investigated arterial-venous oxygen differences as potential transfusion indicators and contributed to studies of acute normovolemic hemodilution, postoperative coagulation, and hemoglobin levels. '
    'This interest also led to a central venous oxygen saturation monitoring device design. '
    'I have served as a corresponding author on randomized trials of ciprofol, a novel intravenous anesthetic, and anesthetic strategies for postoperative cognitive recovery. '
    'My experimental work focuses on cerebral ischemia and neuroprotection, particularly HIF-2α, autophagy, and mitophagy after hypoxic-ischemic injury. '
    'This work builds on doctoral training and research with Donna Ferriero at UCSF and is the focus of my current Associate Researcher appointment.'
) + '</p>' + profiles()
all_papers = sorted(PUBS, key=lambda p: (p['year'], p['id']), reverse=True)
publications = '<p class="section-note">First, co-first, and corresponding authorship are indicated after each citation.</p><ol class="publications-list">' + ''.join(paper(p) for p in all_papers) + '</ol>'
asa_presentations = ''.join(
    f'<div class="service-presentation"><strong>Oral presentation · {year}'
    + (' · Best of Abstracts: Basic Science' if year == '2019' else '')
    + f'</strong><p>{E(title)}</p>'
    + ('<p>One of 10 abstracts selected for the Best of Abstracts: Basic Science oral session from more than 1,000 submissions.</p>' if year == '2019' else '')
    + f'<p>{E(" · ".join(where.split(" · ")[-2:]))}</p>'
    + '</div>'
    for year, title, _, where in PRESENTATIONS)
journal_list = '<ul class="journal-list">' + ''.join(f'<li><em>{E(journal)}</em></li>' for journal in REVIEW_HIGHLIGHTS) + '<li>and 12 other journals</li></ul>'
grants = f'''<dl class="academic-list">
<div><dt>Research funding</dt><dd><strong>NSFC Young Scientists Fund · Principal Investigator, 2024–2026</strong><p>Project No. 82302479</p><p>{E(GRANT_TITLE)}.</p></dd></div>
<div><dt>ASA presentations</dt><dd>{asa_presentations}</dd></div>
</dl>'''
patent = '''<h3>Continuous oxygen saturation monitoring probe</h3><p>A probe designed for placement within a central venous catheter to continuously monitor central venous oxygen saturation (ScvO₂), with the intended application of assessing the balance between oxygen delivery and consumption in real time.</p><p>First inventor · Chinese Utility Model Patent ZL 2024 2 3305545.1. Granted April 21, 2026. A utility model protects a technical product design.</p>'''
contributions = f'''<dl class="academic-list">
<div><dt>Volunteer service</dt><dd><strong>Ad Hoc Peer Reviewer · 2024–Present</strong><p>50+ peer-review assignments across 17 journals, as of September 2026. Journals include:</p>{journal_list}</dd></div>
<div><dt>Leadership</dt><dd><strong>President, Graduate Student Union · 2017–2018</strong><p>Shanghai Jiao Tong University Affiliated Sixth Hospital</p><strong>Vice President, Student Union · 2014–2015</strong><p>Wenzhou Medical University</p></dd></div>
</dl>'''
home = head('Dawei Sun, M.D., Ph.D. | Anesthesiologist & Researcher', 'Education, clinical experience, research, publications, and curriculum vitae of Dawei Sun, M.D., Ph.D.') + hero
home += section('training', 'Education &amp; Experience', timeline)
home += section('clinical', 'Clinical Experience', clinical)
home += section('research', 'Research', research)
home += section('grants', 'Grants &amp; Presentations', grants)
home += section('innovation', 'Innovation', patent)
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
page = head('Publications | Dawei Sun, M.D., Ph.D.', 'Peer-reviewed publications and scientific presentations by Dawei Sun.', '/publications.html') + '<body class="publication-page">' + header(True) + '<main id="main" tabindex="-1"><div class="wrap page-intro"><a class="back-link" href="/">← Back to home</a><h1>Publications</h1><p class="section-note">First, co-first, and corresponding authorship are indicated after each citation.</p>' + yearnav + '</div><div class="wrap publication-layout">' + groups + '</div></main>' + footer()
(ROOT / 'publications.html').write_text(version_assets(page))


def build_cv():
 from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,KeepTogether,PageBreak,Table,TableStyle
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
 'note':ParagraphStyle('note',fontName='CV',fontSize=8,leading=11,textColor=colors.HexColor('#53636c'),spaceAfter=8),
 'cell':ParagraphStyle('cell',fontName='CV',fontSize=8.4,leading=11.5),
 'cellhead':ParagraphStyle('cellhead',fontName='CV-Bold',fontSize=8.4,leading=11.5,textColor=colors.HexColor('#172c3d'))}
 story=[]
 def text(s,style='body'):return Paragraph(re.sub('[\u2010-\u2015]', '-', s.replace('Ⅺ','XI')),styles[style])
 def add(s,style='body'):story.append(text(s,style))
 def sec(s):add(s,'section')
 def entry(date,title,inst,extra=''):
  s=f'<b>{xml_escape(title)}</b><br/>{xml_escape(inst)}<br/>{xml_escape(date)}'
  if extra:s+='<br/>'+xml_escape(extra)
  story.append(KeepTogether([text(s)]))
 add('Dawei Sun, M.D., Ph.D.','name')
 add('Anesthesiologist &amp; Researcher','sub')
 add(f'<link href="mailto:{EMAIL}">{EMAIL}</link> | <link href="https://daweisun.com">daweisun.com</link>','sub')
 add(f'<link href="{ORCID}">ORCID: 0000-0002-6631-8527</link> | <link href="{xml_escape(SCHOLAR)}">Google Scholar</link>','sub')
 sec('EDUCATION AND TRAINING')
 for _,role,inst,date in TRAINING:
  detail = ''
  if role.startswith('Residency'): detail=RESIDENCY_DETAIL
  if role.startswith('Clinical Postdoctoral'): detail=POSTDOC_RESEARCH+' '+POSTDOC_NOTE
  if role.startswith('Ph.D.'): detail=PHD_RESEARCH
  entry(date,role.replace('·','-'),inst,detail)
  if role.startswith('Ph.D.'):
   entry('October 2018 - October 2019','Visiting Scholar - Neurology and Pediatrics','University of California San Francisco, United States',UCSF_RESEARCH)
 sec('LICENSURE AND PROFESSIONAL QUALIFICATIONS')
 for line in QUALIFICATIONS:add(xml_escape(line))
 story.append(PageBreak())
 sec('PROFESSIONAL EXPERIENCE')
 entry('November 2024 - Present','Associate Researcher',INSTITUTION.replace('’',"'")+', Hangzhou, China','Research on cerebral ischemia and neuroprotection, with a focus on autophagy and mitophagy.')
 entry('September 2023 - October 2024','Anesthesiologist',HOSPITAL+', Hangzhou, China',ANESTHESIOLOGIST_DETAIL)
 for s in ['Supported preoperative clinic patient screening and assessment workflows, IT optimization, critical-value alerts and escalation, and communication across departments.','Taught international medical students through operating-room orientation and case discussions.']:add('- '+s)
 sec('U.S. CLINICAL OBSERVERSHIPS')
 entry('November 2026 - Four weeks','Clinical Observer','University of Utah Hospital, United States','Department of Anesthesiology, Perioperative & Pain Medicine')
 entry('October 2026 - Four weeks','Clinical Observer','Torrance Memorial Hospital, Torrance, California, United States','Department of Anesthesiology')
 confirmed_counts = [f'{label}: {value:,}' for label, value in TORRANCE_OBSERVATION_COUNTS.items() if value is not None]
 if SHOW_CLINICAL_VOLUMES and confirmed_counts: add(xml_escape(' · '.join(confirmed_counts)))
 sec('RESEARCH FUNDING')
 entry('2024 - 2026','Principal Investigator - NSFC Young Scientists Fund','National Natural Science Foundation of China - Project No. 82302479',GRANT_TITLE+'.')
 sec('PATENT')
 add('<b>First inventor.</b> Sun D, Luo G, Yao Y, Yan M. Continuous oxygen saturation monitoring probe for insertion into a central venous catheter. Chinese Utility Model Patent, ZL 2024 2 3305545.1. Granted April 21, 2026.')
 add('A probe designed for placement within a central venous catheter to continuously monitor central venous oxygen saturation (ScvO2), intended to help assess the balance between oxygen delivery and consumption in real time. A utility model protects a technical product design.')
 if SHOW_CLINICAL_VOLUMES:
  story.append(PageBreak())
  sec('CLINICAL EXPERIENCE IN NUMBERS')
  add('Rounded residency records and estimated cumulative experience through October 2024. Categories overlap; no unique patient total is implied.','note')
  for group in CLINICAL['groups']:
   add('<b>'+xml_escape(group['title'])+'</b>')
   rows=[[text('Category','cellhead'),text('Residency log<br/>~July 2023','cellhead'),text('Cumulative estimate<br/>October 2024','cellhead')]]
   rows += [[text(xml_escape(row['label']),'cell'),text('~'+str(row['logged']),'cell'),text('~'+str(row['estimated']),'cell')] for row in group['rows']]
   table=Table(rows,colWidths=[287,105,115],repeatRows=1,hAlign='LEFT')
   table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#edf1ed')),('LINEBELOW',(0,0),(-1,-1),0.35,colors.HexColor('#dde1de')),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
   story.append(table);story.append(Spacer(1,11))
  add(xml_escape(CLINICAL['methodology']),'note')
 story.append(PageBreak())
 sec('PEER-REVIEWED PUBLICATIONS')
 add('Ordered by CV publication year, including online-first dates. First, co-first, and corresponding authorship are marked.','note')
 for i,p in enumerate(sorted(PUBS,key=lambda p:(p['year'],p['id']),reverse=True),1):
  authors=re.sub(r'\bSun D\b','<b>Sun D</b>',xml_escape(p['authors']))
  s=f'{i}. {authors}. {xml_escape(p.get("verified_title",p["title"]))}. {xml_escape(citation(p))}'
  if p['role']:s+=f' <font color="#bf391b"><b>({p["role"]})</b></font>'
  if p.get('doi'):s+=f' DOI: <link href="https://doi.org/{xml_escape(p["doi"])}">{xml_escape(p["doi"])}</link>.'
  story.append(KeepTogether([text(s,'pub')]))
 sec('SCIENTIFIC PRESENTATIONS AND HONORS')
 for y,title,authors,where in PRESENTATIONS:story.append(KeepTogether([text(xml_escape(y+'. '+authors+' '+title+' '+where+'.'))]))
 sec('PROFESSIONAL SERVICE AND LEADERSHIP')
 add('<b>Volunteer Service - Ad Hoc Peer Reviewer, 2024 - Present</b><br/>Completed 50+ peer-review assignments across 17 journals, as of September 2026, including ' + ', '.join(REVIEW_HIGHLIGHTS) + ', and 12 other journals.')
 add('<b>President, Graduate Student Union</b>, Shanghai Jiao Tong University Affiliated Sixth Hospital, China, 2017 - 2018.')
 add('<b>Vice President, Student Union</b>, Wenzhou Medical University, China, 2014 - 2015.')
 add('Updated October 2026','note')
 def page(canvas,doc):
  canvas.saveState();w,h=A4
  canvas.setStrokeColor(colors.HexColor('#d8ded8'));canvas.line(44,40,w-44,40)
  canvas.setFont('CV',8);canvas.setFillColor(colors.HexColor('#53636c'))
  canvas.drawString(44,27,'Dawei Sun, M.D., Ph.D. | Curriculum Vitae')
  canvas.drawRightString(w-44,27,str(doc.page));canvas.restoreState()
 doc=SimpleDocTemplate(str(ROOT/'assets/Dawei-Sun-CV.pdf'),pagesize=A4,rightMargin=44,leftMargin=44,topMargin=42,bottomMargin=54,title='Dawei Sun, M.D., Ph.D. - Curriculum Vitae',author='Dawei Sun')
 doc.build(story,onFirstPage=page,onLaterPages=page)
if __name__=='__main__':
 runpy.run_path(str(ROOT / 'scripts/build_anesthesia_tool.py'), run_name='__main__')
 if '--pages-only' not in sys.argv:
  build_cv()
 print('Built index.html, publications.html, and anesthesia tool' + ('' if '--pages-only' in sys.argv else ', assets/Dawei-Sun-CV.pdf'))
