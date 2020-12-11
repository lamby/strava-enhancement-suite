// ==UserScript==
// @name strava-enhancement-suite
// @description
// @match https://*.strava.com/*
// @downloadURL https://cdn.jsdelivr.net/gh/lamby/strava-enhancement-suite@master/strava-enhancement-suite.user.js

// @require            https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant              GM_getValue
// @grant              GM_setValue
// ==/UserScript==

/* global GM_config */

(async () => {
  window.$ = window.jQuery;

  const baseUrl = 'https://cdn.jsdelivr.net/gh/lamby/strava-enhancement-suite@master';

  function inject (url) {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = url;
      el.type = 'text/javascript';
      el.onerror = reject;
      el.onload = resolve;
      document.body.appendChild(el);
    });
  }

  await inject(`${baseUrl}/pages/options.js`);
  await inject(`${baseUrl}/js/libs/arrive.js`);
  await inject(`${baseUrl}/js/main.js`);

  // CONFIG
  const GM_config_fields = {};
  const options = {};

  window.StravaEnhancementSuiteOptions.forEach(option => {
    const obj = {
      label: option.title,
      default: option.default
    };
    if (typeof option.default === 'boolean') {
      obj.type = 'checkbox';
    } else if (option.choices) {
      obj.type = 'select';
      obj.options = option.choices.map(x => x[0]); // ["show", "Show"] => "show"
    }
    GM_config_fields[option.name] = obj;
  });

  const title = document.createElement('a');
  title.textContent = 'Strava Enhancement Suite Config';
  title.href = 'https://github.com/lamby/strava-enhancement-suite';
  title.target = '_blank';

  GM_config.init({
    'title': title,
    'id': 'StravaEnhancementSuiteConfig',
    'fields': GM_config_fields
  });

  window.StravaEnhancementSuiteOptions.forEach(option => {
    try {
      if (typeof GM_config.get(option.name) !== 'undefined') {
        options[option.name] = GM_config.get(option.name);
      } else {
        options[option.name] = option.default;
      }
    } catch (e) {
      // When field is not initialized, get() method fails on
      // fieldVal != null ? fieldVal : field.value;
      // as fieldVal is not null, but undefined
      options[option.name] = option.default;
    }
  });

  // /CONFIG

  window.strava_enhancement_suite = new StravaEnhancementSuite( // eslint-disable-line no-undef
    jQuery,
    options
  );

  const prefEl = $('<li/>', {
    text: '🎛️',
    class: 'nav-item',
    style: 'cursor: pointer',
    on: {
      click: () => {
        GM_config.open();
      }
    }
  });

  $('.user-nav').append(prefEl);
})();
