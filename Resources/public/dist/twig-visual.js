"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var TwigVisual =
/*#__PURE__*/
function () {
  function TwigVisual(options) {
    _classCallCheck(this, TwigVisual);

    this.options = Object.assign({
      uiOptions: {
        field: {
          components: []
        },
        photogallery: {
          components: []
        },
        menu: {
          components: []
        },
        breadcrumbs: {
          components: []
        },
        "shopping-cart": {
          components: [{
            name: "totalPrice",
            title: "Общая цена",
            xpath: ""
          }, {
            name: "totalCount",
            title: "Общее количество",
            xpath: ""
          }, {
            name: "lickCheckout",
            title: "Ссылка на оформление",
            xpath: ""
          }, {
            name: "buttonClean",
            title: "Кнопка очистки",
            xpath: ""
          }]
        },
        "products-list": {
          components: []
        },
        comments: {
          components: []
        }
      }
    }, options);
    this.container = this.createContainer();
    this.state = 'inactive';
    this.listenerOnMouseOver = this.onMouseOver.bind(this);
    this.listenerOnMouseOut = this.onMouseOut.bind(this);
    this.listenerOnMouseWheel = this.onMouseWheel.bind(this);
    this.listenerOnMouseClick = this.onSelectedElementClick.bind(this);
    this.currentElements = [];
    this.init();
  }

  _createClass(TwigVisual, [{
    key: "init",
    value: function init() {
      var _this = this;

      // Start button
      var buttonStart = this.container.querySelector('.twv-button-start-select');
      buttonStart.addEventListener('click', function (e) {
        e.preventDefault();

        _this.selectModeToggle();
      });
    }
  }, {
    key: "selectModeToggle",
    value: function selectModeToggle() {
      if (this.state === 'inactive') {
        this.container.style.display = 'none';
        document.addEventListener('mouseover', this.listenerOnMouseOver);
        document.addEventListener('mouseout', this.listenerOnMouseOut);
        document.addEventListener('wheel', this.listenerOnMouseWheel, {
          passive: false
        });
        document.addEventListener('click', this.listenerOnMouseClick);
        this.state = 'active';
      } else {
        this.container.style.display = 'block';
        document.removeEventListener('mouseover', this.listenerOnMouseOver);
        document.removeEventListener('mouseout', this.listenerOnMouseOut);
        document.removeEventListener('wheel', this.listenerOnMouseWheel);
        document.removeEventListener('click', this.listenerOnMouseClick);
        this.state = 'inactive';
      }
    }
  }, {
    key: "onMouseOver",
    value: function onMouseOver(e) {
      if (e.target.classList.contains('twig-visual-container') || e.target.parentNode.classList && e.target.parentNode.classList.contains('twig-visual-container')) {
        return;
      }

      this.currentElements = [];
      this.updateXPathInfo(e.target);
      e.target.classList.add('twv-selected');
    }
  }, {
    key: "onMouseOut",
    value: function onMouseOut(e) {
      if (e.target.classList.contains('twig-visual-container') || e.target.parentNode.classList && e.target.parentNode.classList.contains('twig-visual-container')) {
        return;
      }

      this.currentElements = [];
      var elements = Array.from(document.querySelectorAll('.twv-selected'));
      elements.forEach(function (element) {
        element.classList.remove('twv-selected');
      });
    }
  }, {
    key: "onSelectedElementClick",
    value: function onSelectedElementClick(e) {
      if (e.target.classList.contains('twig-visual-container') || e.target.parentNode.classList.contains('twig-visual-container')) {
        return;
      }

      e.preventDefault();
      var currentElement = this.currentElements.length > 0 ? this.currentElements[this.currentElements.length - 1] : e.target;
      this.currentElements = [];
      currentElement.classList.remove('twv-selected');

      if (document.querySelector('.twv-info')) {
        this.removeEl(document.querySelector('.twv-info'));
      }

      var xpath = this.getXPathForElement(currentElement);
      this.createSelectionOptions(xpath);
      this.selectModeToggle();
    }
  }, {
    key: "onMouseWheel",
    value: function onMouseWheel(e) {
      if (e.target.classList.contains('twig-visual-container') || e.target.parentNode.classList.contains('twig-visual-container')) {
        return;
      }

      e.preventDefault();
      var currentElement = this.currentElements.length > 0 ? this.currentElements[this.currentElements.length - 1] : e.target;

      if (e.deltaY < 0) {
        currentElement.classList.remove('twv-selected');
        this.currentElements.push(currentElement.parentNode);
        this.updateXPathInfo(currentElement.parentNode);
        currentElement.parentNode.classList.add('twv-selected');
      } else {
        currentElement.classList.remove('twv-selected');
        this.currentElements.splice(this.currentElements.length - 1, 1);
        currentElement = this.currentElements.length > 0 ? this.currentElements[this.currentElements.length - 1] : e.target;
        this.updateXPathInfo(currentElement);
        currentElement.classList.add('twv-selected');
      }
    }
  }, {
    key: "updateXPathInfo",
    value: function updateXPathInfo(element) {
      var div = document.querySelector('.twv-info');

      if (!div) {
        div = document.createElement('div');
        div.className = 'twv-info small';
        document.body.appendChild(div);
      }

      div.style.display = 'block';
      div.innerHTML = '<div>' + this.getXPathForElement(element) + '</div>';
    }
  }, {
    key: "getXPathForElement",
    value: function getXPathForElement(element) {
      if (element.id !== '') return 'id("' + element.id + '")';
      if (element.tagName === 'HTML') return '/HTML[1]'.toLowerCase();
      if (element === document.body) return '/HTML[1]/BODY[1]'.toLowerCase();
      var ix = 0;
      var siblings = element.parentNode.childNodes;

      for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];

        if (sibling === element) {
          return this.getXPathForElement(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']' + this.getXpathElementAttributes(element);
        }

        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
      }
    }
  }, {
    key: "getXpathElementAttributes",
    value: function getXpathElementAttributes(element) {
      if (element.hasAttribute('id')) {
        return "id(\"".concat(element.id, "\")");
      } else if (element.hasAttribute('class') && element.getAttribute('class')) {
        return "[@class=\"".concat(element.getAttribute('class'), "\"]");
      }

      return '';
    }
  }, {
    key: "getElementByXPath",
    value: function getElementByXPath(xpath) {
      return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }
  }, {
    key: "createContainer",
    value: function createContainer() {
      var containerEl = document.createElement('div');
      containerEl.id = 'twig-visual-container';
      containerEl.className = 'twig-visual-container';
      containerEl.innerHTML = "\n<button type=\"button\" class=\"twv-btn twv-btn-block twv-mb-3 twv-button-start-select\">Select</button>\n<div class=\"twv-inner\"></div>\n";
      document.body.appendChild(containerEl);
      return containerEl;
    }
  }, {
    key: "createSelectionOptions",
    value: function createSelectionOptions(xpath) {
      var _this2 = this;

      var elementSelected = this.getElementByXPath(xpath);

      if (!elementSelected) {
        throw new Error('Element for XPath not found.');
      }

      this.container.querySelector('.twv-inner').innerHTML = '';
      var xpathEscaped = xpath.replace(/[\"]/g, '&quot;');
      var div = document.createElement('div');
      div.innerHTML = "<div class=\"twv-mb-3 twv-ui-element-select\">\n        <select class=\"twv-select\">\n        <option value=\"\">- \u042D\u043B\u0435\u043C\u0435\u043D\u0442 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 -</option>\n        <option value=\"field\">\u041F\u043E\u043B\u0435 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430</option>\n        <option value=\"photogallery\">\u0424\u043E\u0442\u043E-\u0433\u0430\u043B\u0435\u0440\u0435\u044F</option>\n        <option value=\"menu\">\u041C\u0435\u043D\u044E</option>\n        <option value=\"breadcrumbs\">\u0425\u043B\u0435\u0431\u043D\u044B\u0435 \u043A\u043D\u043E\u0448\u043A\u0438</option>\n        <option value=\"shopping-cart\">\u041A\u043E\u0440\u0437\u0438\u043D\u0430 \u0442\u043E\u0432\u0430\u0440\u043E\u0432</option>\n        <option value=\"products-list\">\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u0442\u043E\u0432\u0430\u0440\u044B</option>\n        <option value=\"comments\">\u041E\u0442\u0437\u044B\u0432\u044B</option>\n</select>\n</div>\n<b>XPath:</b>\n<div class=\"twv-p-1 twv-mb-3 twv-small twv-bg-gray\">\n    <div class=\"twv-text-overflow\" title=\"".concat(xpathEscaped, "\">").concat(xpath, "</div>\n</div>\n<div class=\"twv-ui-components\"></div>\n        ");
      this.container.querySelector('.twv-inner').appendChild(div);
      var componentsContainer = this.container.querySelector('.twv-ui-components');
      this.container.querySelector('.twv-ui-element-select').addEventListener('change', function (e) {
        componentsContainer.innerHTML = '';

        if (!_this2.options.uiOptions[e.target.value]) {
          return;
        }

        var opt = _this2.options.uiOptions[e.target.value];
        opt.components.forEach(function (cmp) {
          var button = document.createElement('button');
          button.type = 'button';
          button.className = 'twv-btn twv-mb-2';
          button.textContent = cmp.title;
          componentsContainer.appendChild(button);
        });
        console.log(e.target.value, _this2.options.uiOptions[e.target.value]);
      });
      var compStyles = window.getComputedStyle(elementSelected);
      var position = compStyles.getPropertyValue('position');
      console.log(xpath, elementSelected, position);
    }
  }, {
    key: "removeEl",
    value: function removeEl(el) {
      el.parentNode.removeChild(el);
    }
  }], [{
    key: "onReady",
    value: function onReady(cb) {
      if (document.readyState !== 'loading') {
        cb();
      } else {
        document.addEventListener('DOMContentLoaded', cb);
      }
    }
  }]);

  return TwigVisual;
}();

var twigVisual;
TwigVisual.onReady(function () {
  twigVisual = new TwigVisual();
});

//# sourceMappingURL=twig-visual.js.map