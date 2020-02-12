angular.module('app')
  .directive('uiToggleClass', ['$timeout', '$document', function ($timeout, $document) {
      return {
          restrict: 'AC',
          link: function (scope, el, attr) {
              el.unbind('click.iframe').on('click.iframe', function (e) {
                  e.stopPropagation()
                  e.preventDefault();
                  var classes = attr.uiToggleClass.split(','),
                      targets = (attr.target && attr.target.split(',')) || Array(el),
                      url = attr.targeturl,
                      key = 0;
                  angular.forEach(classes, function (_class) {
                      var target = targets[(targets.length && key)];
                      (_class.indexOf('*') !== -1) && magic(_class, target);
                      if ($(target).length == 0) {
                          window.location.href = url;
                      } else {
                          $(target).toggleClass(_class);
                          $(target).find("iframe").attr("src", url);
                          if ($(target).hasClass(_class)) {
                              $("body").addClass("noscroll");
                          }
                          else {
                              $("body").removeClass("noscroll");
                          }
                      }
                      key++;
                  });
                  $(el).toggleClass('active');

                  function magic(_class, target) {
                      var patt = new RegExp('\\s' +
                          _class.
                            replace(/\*/g, '[A-Za-z0-9-_]+').
                            split(' ').
                            join('\\s|\\s') +
                          '\\s', 'g');
                      var cn = ' ' + $(target)[0].className + ' ';
                      while (patt.test(cn)) {
                          cn = cn.replace(patt, ' ');
                      }
                      $(target)[0].className = $.trim(cn);
                  }
              });
          }
      };
  }]);