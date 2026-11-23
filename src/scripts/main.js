// src/scripts/main.js
// Навигация, CRM-форма, плавная прокрутка

(function () {
  'use strict';

  // Мобильное меню
  var toggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.textContent = isOpen ? '✕' : '☰';
    });
  }

  // Закрытие мобильного меню при клике на ссылку
  var navItems = document.querySelectorAll('.nav-links a');
  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
          toggle.textContent = '☰';
        }
      }
    });
  });

  // Шапка: состояние скрытия и «заморозка» на время перехода по якорю
  var header = document.getElementById('site-header');
  var lastScroll = window.pageYOffset;
  var suppressHide = false; // true, пока идёт прокрутка к якорю

  function keepHeaderVisible() {
    if (header) header.style.transform = 'translateY(0)';
  }

  // Не даём шапке исчезнуть, пока идёт плавная прокрутка к секции.
  // Ждём, пока позиция скролла перестанет меняться, и только потом
  // возвращаем обычное поведение.
  function suppressHideWhileScrolling() {
    if (!header) return;
    suppressHide = true;
    keepHeaderVisible();

    var lastY = window.pageYOffset;
    var moved = false;
    var stableFrames = 0;
    var startTime = Date.now();

    function finish() {
      suppressHide = false;
      lastScroll = window.pageYOffset;
    }

    function check() {
      var y = window.pageYOffset;

      if (Math.abs(y - lastY) >= 1) {
        // Прокрутка идёт
        moved = true;
        stableFrames = 0;
        lastY = y;
      } else if (moved) {
        // Прокрутка остановилась
        stableFrames++;
        if (stableFrames >= 3) {
          finish();
          return;
        }
      } else if (Date.now() - startTime > 200) {
        // Прокрутка так и не началась (секция уже на экране)
        finish();
        return;
      }

      requestAnimationFrame(check);
    }

    requestAnimationFrame(check);
  }

  // Плавная прокрутка к якорям
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var offset = header ? header.offsetHeight : 0;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        suppressHideWhileScrolling();
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // CRM-формы заявки (блок риэлтора и контакты)
  var leadForms = document.querySelectorAll('.lead-form');
  if (leadForms.length > 0) {
    var crmConfig = window.__CRM_CONFIG__ || {};
    var endpoint = crmConfig.endpoint || '';
    var analyticsEnabled = !!(window.__ANALYTICS_CONFIG__ && window.__ANALYTICS_CONFIG__.enabled);

    var trackFormEvent = function (action) {
      if (!analyticsEnabled) return;
      var counter = window.yaCounter;
      if (counter && counter.hit) counter.hit('form:' + action);
    };

    leadForms.forEach(function (form) {
      var submitBtn = form.querySelector('[type="submit"]');
      var statusEl = form.querySelector('.form-status');
      var nameEl = form.querySelector('[name="name"]');
      var phoneEl = form.querySelector('[name="phone"]');
      var commentEl = form.querySelector('[name="comment"]');
      var errName = form.querySelector('[data-error="name"]');
      var errPhone = form.querySelector('[data-error="phone"]');

      // Track form start
      trackFormEvent('form_start');

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (submitBtn.disabled) return; // Защита от повторной отправки

        var hasErrors = false;

        // Сброс ошибок
        if (errName) errName.textContent = '';
        if (errPhone) errPhone.textContent = '';
        if (nameEl) nameEl.style.borderColor = '';
        if (phoneEl) phoneEl.style.borderColor = '';

        // Валидация
        var name = nameEl ? nameEl.value.trim() : '';
        var phone = phoneEl ? phoneEl.value.trim() : '';

        if (!name || name.length < 2) {
          if (errName) errName.textContent = 'Введите ваше имя';
          if (nameEl) nameEl.style.borderColor = '#c0392b';
          hasErrors = true;
        }

        if (!phone || phone.replace(/[^+\d]/g, '').length < 6) {
          if (errPhone) errPhone.textContent = 'Введите корректный номер телефона';
          if (phoneEl) phoneEl.style.borderColor = '#c0392b';
          hasErrors = true;
        }

        if (hasErrors) return;

        // Способы связи (чекбоксы, можно несколько)
        var methodEls = form.querySelectorAll('[name="contactMethods"]:checked');

        // Отправка
        var data = {
          name: name,
          phone: phone,
          comment: commentEl ? commentEl.value.trim() : ''
        };
        if (methodEls.length > 0) {
          data.contactMethods = Array.prototype.map.call(methodEls, function (el) {
            return el.value;
          });
        }

        if (!endpoint) {
          if (statusEl) {
            statusEl.textContent = '❌ Отправка заявки пока не настроена. Позвоните нам по телефону.';
            statusEl.className = 'form-status form-status--error';
          }
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
        if (statusEl) {
          statusEl.textContent = '';
          statusEl.className = 'form-status';
        }

        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
          .then(function (res) {
            if (res.ok) {
              if (statusEl) {
                statusEl.textContent = '✅ Заявка отправлена! Мы свяжемся с вами в ближайшее время.';
                statusEl.className = 'form-status form-status--success';
              }
              form.reset();
              trackFormEvent('form_submit');
            } else {
              throw new Error('Сервер вернул ошибку: ' + res.status);
            }
          })
          .catch(function (err) {
            if (statusEl) {
              statusEl.textContent = '❌ Ошибка при отправке. Попробуйте позже или свяжитесь по телефону.';
              statusEl.className = 'form-status form-status--error';
            }
            console.error('CRM submit error:', err);
          })
          .finally(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить заявку';
          });
      });
    });
  }

  // Показ/скрытие header при скролле
  if (header) {
    window.addEventListener('scroll', function () {
      var currentScroll = window.pageYOffset;

      // Во время перехода по якорю шапку не скрываем
      if (suppressHide) {
        keepHeaderVisible();
        lastScroll = currentScroll;
        return;
      }

      if (currentScroll > 200) {
        header.style.transform = currentScroll < lastScroll ? 'translateY(0)' : 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }
})();
