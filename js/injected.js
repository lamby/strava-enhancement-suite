function StravaEnhancementSuite(options) {
  this.options = options;

  this.default_to_my_results();
  this.running_tss();
  this.side_by_side_running();
  this.standard_google_map();
  this.variability_index();

  this.edit_profile();
};

StravaEnhancementSuite.prototype.default_to_my_results = function() {
  if (this.options.default_to_my_results === false) {
    return;
  }

  if (typeof Strava.Labs === 'undefined') {
    return;
  }

  // Default to my results
  var view = Strava.Labs.Activities.SegmentLeaderboardView;
  var fn = view.prototype.render;

  view.prototype.render = function () {
    var elem = jQuery(this.el);
    var result = fn.apply(this, Array.prototype.slice.call(arguments));

    if (!elem.hasClass('once-only')) {
      elem.addClass('once-only').find('.clickable[data-filter=my_results]').click();
    }

    return result;
  };
};

StravaEnhancementSuite.prototype.edit_profile = function() {
  if (jQuery('header .user-menu a').attr('href') !== window.location.pathname) {
    return;
  }

  jQuery('<a>')
    .css('font-size', '20px')
    .css('margin-left', '8px')
    .attr('href', '/settings/profile')
    .text('(edit)')
    .appendTo('.pageContent h1:first');
};

StravaEnhancementSuite.prototype.running_tss = function() {
  if (this.options.running_tss === false) {
    return;
  }

  if (typeof Strava.Labs === 'undefined') {
    return;
  }

  var TSS_PER_HOUR = {
    'Z1':  60,
    'Z2': 100,
    'Z3': 120,
    'Z4': 200,
    'Z5': 300,
    'Z6': 600
  };

  var view = Strava.Labs.Activities.PaceZones;
  var fn = view.prototype.getPaceZones;

  view.prototype.getPaceZones = function () {
    var result = fn.apply(this, Array.prototype.slice.call(arguments));

    var tss = 0;
    jQuery.each(this.paceZones, function (i, item) {
      // Re-parse the time (eg. "23s" / "32:21")
      var parts = item.time.replace('s', '').split(':').reverse();
      var seconds = parts.reduce(function (prev, cur, idx) {
          return prev + (cur * Math.pow(60, idx));
      }, 0);

      // Calculate the contribution to TSS
      tss += TSS_PER_HOUR[item.name] / 3600 * seconds;
    });

    jQuery('#view .inline-stats').append(
      '<li><strong>' + Math.round(tss) + '</strong><div class="label">TSS (estimated)</div></li>'
    );

    return result;
  };
};

StravaEnhancementSuite.prototype.side_by_side_running = function() {
  if (this.options.side_by_side_running === false) {
    return;
  }

  jQuery('section.comparison .running-tab').click();
};

StravaEnhancementSuite.prototype.standard_google_map = function() {
  if (this.options.standard_google_map === false) {
    return;
  }

  var poll = function() {
    var elem = jQuery('a.map-type-selector[data-map-type-id=standard]').click();

    if (elem.length > 0) {
      elem.parents('.drop-down-menu').click();
    } else {
      setTimeout(poll, 1000);
    }
  };

  if (jQuery('#map-canvas').length > 0) {
    poll();
  }
};

StravaEnhancementSuite.prototype.switch_units = function() {
  var url = jQuery("a:contains(My Profile)[href^='/athletes/']").attr('href');
  var target = window._measurement_preference == "meters" ? "feet" : "meters";
  var athlete_id = parseInt(url.split('/')[2], 10);

  (new Strava.Athletes.Athlete(url, athlete_id)).save(
    "measurement_preference",
    target,
    {"success": function(x) { window.location.reload(); } }
  );
};

StravaEnhancementSuite.prototype.variability_index = function() {
  if (this.options.variability_index === false) {
    return;
  }

  if (typeof pageview === 'undefined') {
    return;
  }

  var elem = jQuery('span[data-glossary-term=definition-weighted-average-power]')
    .parents('li');

  var np = parseInt(elem.find('strong').text(), 10);
  var ap = pageView.activity().get('avgWatts');

  jQuery('<li><strong>X</strong><div class="label">Variability Index</div></li>')
    .insertAfter(elem)
    .find('strong')
    .text((np / ap).toFixed(2));
};
