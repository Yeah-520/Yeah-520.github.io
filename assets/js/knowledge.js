/* ==========================================================================
   Yeah 个人网站 · 知识库渲染脚本
   读取 knowledge/manifest.json，用 markdown-it 将 md 文档渲染并平铺展示
   ========================================================================== */
(function () {
  'use strict';

  var MANIFEST_URL = 'knowledge/manifest.json';
  var root = document.getElementById('knowledge-root');

  // 仅在知识库页面执行
  if (!root) {
    return;
  }

  if (!window.markdownit) {
    showError('markdown-it 库未能加载，请检查 assets/js/vendor/markdown-it.min.js 是否被正确引入。');
    return;
  }

  // 安全设置：不渲染 md 中的原始 HTML（防 XSS），开启链接自动识别
  var md = window.markdownit({ html: false, linkify: true });

  function fileNameFromPath(path) {
    var parts = String(path).split('/');
    var last = parts[parts.length - 1] || '';
    return last.replace(/\.md$/i, '');
  }

  // 从 "knowledge/<分类名>/<文件名>.md" 推导分类名
  function parseCategory(path) {
    var parts = String(path).split('/');
    if (parts.length >= 3 && parts[0] === 'knowledge') {
      return parts[1];
    }
    return '未分类';
  }

  // 提取第一个一级标题作为条目标题
  function extractTitle(text) {
    var match = text.match(/^\s*#\s+(.+?)\s*$/m);
    return match ? match[1].trim() : '';
  }

  // 去掉首个一级标题行，避免与条目标题重复展示
  function stripTitle(text) {
    return text.replace(/^\s*#\s+[^\n]*(?:\n|$)/, '');
  }

  function renderMarkdown(text) {
    return md.render(text);
  }

  function showError(message) {
    root.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'knowledge-error';
    p.textContent = message;
    root.appendChild(p);
  }

  // 按分类分组并平铺渲染
  function render(docs) {
    root.innerHTML = '';

    var groups = {};
    var order = [];
    docs.forEach(function (doc) {
      if (!Object.prototype.hasOwnProperty.call(groups, doc.category)) {
        groups[doc.category] = [];
        order.push(doc.category);
      }
      groups[doc.category].push(doc);
    });

    order.forEach(function (category) {
      var section = document.createElement('section');
      section.className = 'knowledge-section';

      var h2 = document.createElement('h2');
      h2.className = 'knowledge-title';
      var dot = document.createElement('span');
      dot.className = 'dot';
      h2.appendChild(dot);
      h2.appendChild(document.createTextNode(category));
      section.appendChild(h2);

      var list = document.createElement('div');
      list.className = 'knowledge-doc-list';

      groups[category].forEach(function (doc) {
        var article = document.createElement('article');
        article.className = 'knowledge-doc';

        var h3 = document.createElement('h3');
        h3.className = 'knowledge-doc-title';
        h3.textContent = doc.title;

        var body = document.createElement('div');
        body.className = 'knowledge-doc-body';
        body.innerHTML = doc.html;

        article.appendChild(h3);
        article.appendChild(body);
        list.appendChild(article);
      });

      section.appendChild(list);
      root.appendChild(section);
    });
  }

  function load() {
    fetch(MANIFEST_URL)
      .then(function (res) {
        if (!res.ok) {
          throw new Error('manifest status ' + res.status);
        }
        return res.json();
      })
      .then(function (paths) {
        if (!Array.isArray(paths) || paths.length === 0) {
          showError('知识库清单为空，请在 knowledge/manifest.json 中填写 md 文件路径。');
          return;
        }

        var tasks = paths.map(function (path) {
          return fetch(path)
            .then(function (res) {
              if (!res.ok) {
                throw new Error('status ' + res.status);
              }
              return res.text();
            })
            .then(function (text) {
              return {
                category: parseCategory(path),
                title: extractTitle(text) || fileNameFromPath(path),
                html: renderMarkdown(stripTitle(text)),
                path: path,
                error: false
              };
            })
            .catch(function () {
              return {
                category: parseCategory(path),
                title: fileNameFromPath(path),
                html: '',
                path: path,
                error: true
              };
            });
        });

        return Promise.all(tasks);
      })
      .then(function (docs) {
        var okDocs = docs.filter(function (d) { return !d.error; });
        var failedPaths = docs
          .filter(function (d) { return d.error; })
          .map(function (d) { return d.path; });

        if (okDocs.length === 0) {
          showError('无法加载任何知识库文档。请通过 HTTP 服务访问本站（例如本地运行 python -m http.server）或部署到 GitHub Pages 后查看；直接双击打开 file:// 协议会因浏览器安全限制无法读取 md 文件。');
          return;
        }

        render(okDocs);

        if (failedPaths.length > 0) {
          var note = document.createElement('p');
          note.className = 'knowledge-error';
          note.textContent = '以下笔记加载失败：' + failedPaths.join('、');
          root.appendChild(note);
        }
      })
      .catch(function () {
        showError('无法加载知识库内容。请通过 HTTP 服务访问本站（例如本地运行 python -m http.server）或部署到 GitHub Pages 后查看；直接双击打开 file:// 协议会因浏览器安全限制无法读取 md 文件。');
      });
  }

  load();
})();
