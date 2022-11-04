module.exports = {
  domain: 'site-domain.com',
  encoding: 'UTF-8',
  lang: 'ja',
  region: 'JP',
  get locale() {
    return `${this.lang}_${this.region}`;
  },
  scheme: 'https',
  siteTitle: 'simple static html',
  get siteUrl() {
    return `${this.scheme}://${this.domain}`;
  },
  tagline: '',
  ogImage: '/assets/ogp.png',
  twitterSite: '',
  webFonts: [
    'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap',
  ],
};
