<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Sitemap — llapik.github.io</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #ededea; color: #0a0a0a;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      padding: 3rem 3rem 6rem;
      line-height: 1.6;
    }
    header { margin-bottom: 3rem; }
    .label {
      font-size: 0.62rem; letter-spacing: 0.18em; text-transform: uppercase;
      color: #9d9d99; margin-bottom: 1rem; display: block;
    }
    h1 {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: clamp(2.5rem, 6vw, 5rem); font-weight: 800;
      letter-spacing: -0.05em; line-height: 0.9;
      color: #0a0a0a;
    }
    table {
      width: 100%; border-collapse: collapse;
      max-width: 860px;
    }
    thead th {
      text-align: left; padding: 0.5rem 1.2rem;
      font-size: 0.60rem; letter-spacing: 0.16em; text-transform: uppercase;
      color: #9d9d99; border-bottom: 1px solid rgba(10,10,10,0.12);
    }
    tbody td {
      padding: 1rem 1.2rem;
      font-size: 0.75rem; border-bottom: 1px solid rgba(10,10,10,0.07);
    }
    tbody tr:hover td { background: rgba(10,10,10,0.03); }
    a { color: #0a0a0a; text-decoration: none; }
    a:hover { color: #9d9d99; }
    .priority { opacity: 0.5; }
    .freq { opacity: 0.6; text-transform: lowercase; }
    footer {
      margin-top: 3rem; font-size: 0.60rem; letter-spacing: 0.1em;
      text-transform: uppercase; color: #9d9d99;
    }
  </style>
</head>
<body>
  <header>
    <span class="label">▸ sitemap.xml</span>
    <h1>llapik<br/>sitemap.</h1>
  </header>
  <table>
    <thead>
      <tr>
        <th>URL</th>
        <th>Last modified</th>
        <th>Change freq</th>
        <th>Priority</th>
      </tr>
    </thead>
    <tbody>
      <xsl:for-each select="sm:urlset/sm:url">
        <tr>
          <td><a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a></td>
          <td><xsl:value-of select="sm:lastmod"/></td>
          <td class="freq"><xsl:value-of select="sm:changefreq"/></td>
          <td class="priority"><xsl:value-of select="sm:priority"/></td>
        </tr>
      </xsl:for-each>
    </tbody>
  </table>
  <footer>
    <xsl:value-of select="count(sm:urlset/sm:url)"/> URL(s) total
  </footer>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
