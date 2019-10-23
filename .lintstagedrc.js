/*! .lintstagedrc.js | @author brikcss <https://github.com/brikcss> | @reference <https://github.com/okonet/lint-staged> */

module.exports = {
  '/(src,test)/*.js': ['standard --fix', 'git add'],
  '/(src,test)/*.css': ['prettier --parser css --write', 'stylelint', 'git add'],
  '/(src,test)/*.json': ['prettier --parser json --write', 'git add'],
  '/(src,test)/*.md': ['prettier --parser markdown --write', 'git add']
}
