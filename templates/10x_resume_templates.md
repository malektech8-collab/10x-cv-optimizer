# ATS-Compliant Resume Templates for 10-X CV Optimizer

This document provides **three ATS-safe resume templates** and
implementation guidance for the **10-X CV Optimizer SaaS platform**.

The templates follow ATS best practices:

-   Single column layout
-   Semantic HTML (`h1 h2 h3 ul li`)
-   No tables
-   No icons or images
-   Consistent headings
-   Simple fonts

These rules ensure compatibility with common ATS systems such as
Workday, Taleo, Greenhouse, and Lever.

------------------------------------------------------------------------

# Resume JSON Schema

All templates expect the following JSON structure:

``` json
{
  "name": "",
  "contact": {
    "email": "",
    "phone": "",
    "location": ""
  },
  "summary": "",
  "skills": [],
  "experience": [
    {
      "title": "",
      "company": "",
      "location": "",
      "dates": "",
      "bullets": []
    }
  ],
  "education": [
    {
      "degree": "",
      "school": "",
      "dates": ""
    }
  ]
}
```

------------------------------------------------------------------------

# Template 1 --- Classic

Best for most job seekers and highly ATS compatible.

``` html
function renderClassic(resume){

return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{
font-family: Arial, Helvetica, sans-serif;
font-size:11pt;
line-height:1.5;
color:#333;
padding:0.5in;
max-width:8.5in;
margin:auto;
}

h1{
font-size:22pt;
margin-bottom:5px;
}

h2{
font-size:13pt;
margin-top:20px;
border-bottom:1px solid #ddd;
padding-bottom:4px;
}

h3{
font-size:11.5pt;
margin-bottom:3px;
}

ul{
margin:5px 0 10px 18px;
}
</style>
</head>

<body>

<h1>${resume.name}</h1>

<p>${resume.contact.email} | ${resume.contact.phone} | ${resume.contact.location}</p>

<h2>Professional Summary</h2>
<p>${resume.summary}</p>

<h2>Skills</h2>
<p>${resume.skills.join(" • ")}</p>

<h2>Professional Experience</h2>

${resume.experience.map(job=>`
<h3>${job.title}</h3>
<p><strong>${job.company}</strong> — ${job.location}</p>
<p>${job.dates}</p>

<ul>
${job.bullets.map(b=>`<li>${b}</li>`).join("")}
</ul>
`).join("")}

<h2>Education</h2>

${resume.education.map(ed=>`
<p><strong>${ed.degree}</strong>, ${ed.school}</p>
<p>${ed.dates}</p>
`).join("")}

</body>
</html>
`
}
```

------------------------------------------------------------------------

# Template 2 --- Modern

Cleaner layout while remaining ATS safe.

``` html
function renderModern(resume){

return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>
body{
font-family: Arial, Helvetica, sans-serif;
font-size:11pt;
line-height:1.5;
padding:0.5in;
max-width:8.5in;
margin:auto;
color:#222;
}

header{
margin-bottom:15px;
}

h1{
font-size:24pt;
margin-bottom:4px;
}

.contact{
color:#666;
}

.section{
margin-top:18px;
}

.section h2{
font-size:13pt;
border-bottom:2px solid #000;
padding-bottom:4px;
}

ul{
margin-left:18px;
}
</style>
</head>

<body>

<header>
<h1>${resume.name}</h1>
<p class="contact">
${resume.contact.email} | ${resume.contact.phone} | ${resume.contact.location}
</p>
</header>

<div class="section">
<h2>Summary</h2>
<p>${resume.summary}</p>
</div>

<div class="section">
<h2>Core Skills</h2>
<p>${resume.skills.join(" • ")}</p>
</div>

<div class="section">
<h2>Experience</h2>

${resume.experience.map(job=>`
<h3>${job.title} — ${job.company}</h3>
<p>${job.location} | ${job.dates}</p>

<ul>
${job.bullets.map(b=>`<li>${b}</li>`).join("")}
</ul>
`).join("")}

</div>

<div class="section">
<h2>Education</h2>

${resume.education.map(ed=>`
<p><strong>${ed.degree}</strong>, ${ed.school} (${ed.dates})</p>
`).join("")}

</div>

</body>
</html>
`
}
```

------------------------------------------------------------------------

# Template 3 --- Executive

Designed for senior leadership and executive roles.

``` html
function renderExecutive(resume){

return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>
body{
font-family: Georgia, serif;
font-size:11pt;
line-height:1.6;
padding:0.5in;
max-width:8.5in;
margin:auto;
}

h1{
font-size:26pt;
margin-bottom:4px;
}

h2{
font-size:14pt;
margin-top:20px;
border-bottom:2px solid #333;
padding-bottom:5px;
}

ul{
margin-left:20px;
}
</style>
</head>

<body>

<h1>${resume.name}</h1>

<p>${resume.contact.email} | ${resume.contact.phone} | ${resume.contact.location}</p>

<h2>Executive Profile</h2>
<p>${resume.summary}</p>

<h2>Core Competencies</h2>
<p>${resume.skills.join(" • ")}</p>

<h2>Professional Experience</h2>

${resume.experience.map(job=>`
<h3>${job.title}</h3>
<p><strong>${job.company}</strong> | ${job.location}</p>
<p>${job.dates}</p>

<ul>
${job.bullets.map(b=>`<li>${b}</li>`).join("")}
</ul>
`).join("")}

<h2>Education</h2>

${resume.education.map(ed=>`
<p><strong>${ed.degree}</strong>, ${ed.school}</p>
<p>${ed.dates}</p>
`).join("")}

</body>
</html>
`
}
```

------------------------------------------------------------------------

# Implementation Guide

## Folder Structure

    src
     ├ templates
     │   ├ classic.ts
     │   ├ modern.ts
     │   ├ executive.ts
     │
     ├ renderer
     │   └ renderResumeHTML.ts

------------------------------------------------------------------------

## Template Renderer

``` ts
import {renderClassic} from "../templates/classic"
import {renderModern} from "../templates/modern"
import {renderExecutive} from "../templates/executive"

export function renderResumeHTML(data, template){

switch(template){

case "modern":
return renderModern(data)

case "executive":
return renderExecutive(data)

default:
return renderClassic(data)

}
}
```

------------------------------------------------------------------------

# Resume Preview in React

``` javascript
const html = renderResumeHTML(resumeData, selectedTemplate)

iframeRef.current.contentWindow.document.open()
iframeRef.current.contentWindow.document.write(html)
iframeRef.current.contentWindow.document.close()
```

------------------------------------------------------------------------

# Exporting Resume

### PDF

    window.print()

### DOCX

Use:

    html-docx-js

------------------------------------------------------------------------

# Product Strategy Recommendation

Do **not create dozens of templates**.

Three templates are sufficient:

-   Classic
-   Modern
-   Executive

Focus development effort on:

-   AI resume rewriting
-   ATS scoring
-   Job description matching
-   LinkedIn optimization
