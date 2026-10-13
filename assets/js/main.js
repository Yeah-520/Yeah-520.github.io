/* ==========================================================================
   Yeah 个人网站 · 全局交互脚本
   功能：主题切换 / 移动端菜单 / 导航高亮 / 滚动渐入 / 页脚年份
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var STORAGE_KEY = 'yeah-theme';

  /* ---------- 主题切换 ---------- */

  // 读取初始主题：优先用户手动选择，其次跟随系统偏好
  function getInitialTheme() {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      // 隐私模式下 localStorage 可能不可用，忽略即可
    }
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // 无保存值时默认亮色主题，不再跟随系统偏好
    return 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.setAttribute(
        'aria-label',
        theme === 'dark' ? '切换到浅色模式' : '切换到暗色模式'
      );
    }
  }

  applyTheme(getInitialTheme());

  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (err) {
        /* 忽略存储失败 */
      }
    });
  }

  /* ---------- 移动端汉堡菜单 ---------- */

  var navToggle = document.querySelector('.nav-toggle');
  var siteNav = document.getElementById('site-nav');

  function closeMenu() {
    if (!navToggle || !siteNav) return;
    navToggle.setAttribute('aria-expanded', 'false');
    siteNav.classList.remove('is-open');
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      var expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      siteNav.classList.toggle('is-open', !expanded);
    });

    // 点击导航链接后自动收起菜单
    siteNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // 点击页面其它区域时收起菜单
    document.addEventListener('click', function (event) {
      var isNav = siteNav.contains(event.target);
      var isToggle = navToggle.contains(event.target);
      if (!isNav && !isToggle && siteNav.classList.contains('is-open')) {
        closeMenu();
      }
    });
  }

  /* ---------- 导航高亮 ---------- */

  // 由 <body data-active-nav="..."> 指定当前栏目，对应 .nav-link[data-nav]
  var activeNav = document.body.getAttribute('data-active-nav');
  if (activeNav) {
    document.querySelectorAll('.nav-link').forEach(function (link) {
      if (link.getAttribute('data-nav') === activeNav) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- 滚动渐入（IntersectionObserver） ---------- */

  var revealEls = document.querySelectorAll('.reveal');

  function showAll() {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  if ('IntersectionObserver' in window && revealEls.length > 0) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    showAll();
  }

  /* ---------- 联系表单（mailto） ---------- */

  var CONTACT_EMAIL = '1903617153@qq.com';
  var DEFAULT_SUBJECT = '来自 Yeah 个人网站的留言';

  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var nameEl = document.getElementById('contact-name');
      var emailEl = document.getElementById('contact-email');
      var subjectEl = document.getElementById('contact-subject');
      var messageEl = document.getElementById('contact-message');

      var name = nameEl ? nameEl.value.trim() : '';
      var email = emailEl ? emailEl.value.trim() : '';
      var subject = subjectEl ? subjectEl.value.trim() : '';
      var message = messageEl ? messageEl.value.trim() : '';

      // 姓名与留言为必填；正常情况下由浏览器原生校验拦截，此处兜底
      if (!name || !message) {
        return;
      }

      if (!subject) {
        subject = DEFAULT_SUBJECT;
      }

      // 正文：发件人姓名 + 邮箱 + 空行 + 留言内容
      var bodyLines = [];
      if (name) {
        bodyLines.push('发件人：' + name);
      }
      if (email) {
        bodyLines.push('邮箱：' + email);
      }
      bodyLines.push('');
      bodyLines.push(message);

      var mailto =
        'mailto:' +
        CONTACT_EMAIL +
        '?subject=' +
        encodeURIComponent(subject) +
        '&body=' +
        encodeURIComponent(bodyLines.join('\n'));

      window.location.href = mailto;
    });
  }

  /* ---------- 复制邮箱 ---------- */

  var copyEmailBtn = document.getElementById('copy-email');
  if (copyEmailBtn) {
    var originalLabel = copyEmailBtn.textContent.trim();

    // 兼容非 https 环境：临时 textarea + execCommand 兜底复制
    function fallbackCopy(text) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      var ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (err) {
        ok = false;
      }
      document.body.removeChild(textarea);
      return ok;
    }

    function flashCopied() {
      copyEmailBtn.textContent = '已复制';
      copyEmailBtn.classList.add('is-copied');
      window.setTimeout(function () {
        copyEmailBtn.textContent = originalLabel;
        copyEmailBtn.classList.remove('is-copied');
      }, 1600);
    }

    function showCopyError() {
      copyEmailBtn.textContent = '请手动复制：' + CONTACT_EMAIL;
      window.setTimeout(function () {
        copyEmailBtn.textContent = originalLabel;
      }, 2400);
    }

    function copyEmail() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(CONTACT_EMAIL)
          .then(flashCopied)
          .catch(function () {
            if (fallbackCopy(CONTACT_EMAIL)) {
              flashCopied();
            } else {
              showCopyError();
            }
          });
      } else if (fallbackCopy(CONTACT_EMAIL)) {
        flashCopied();
      } else {
        showCopyError();
      }
    }

    copyEmailBtn.addEventListener('click', copyEmail);
  }

  /* ---------- 页脚年份 ---------- */

  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
