"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var TwigVisual =
/*#__PURE__*/
function () {
  function TwigVisual(options) {
    _classCallCheck(this, TwigVisual);

    this.data = {};
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
      buttonStart.parentNode.querySelector('.twv-block-active-status-button-cancel').addEventListener('click', function (e) {
        e.preventDefault();

        _this.selectionCancel();
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
      if (this.getXPathForElement(e.target).indexOf('twig-visual-container') > -1) {
        return;
      }

      this.currentElements = [];
      this.updateXPathInfo(e.target);
      e.target.classList.add('twv-selected');
    }
  }, {
    key: "onMouseOut",
    value: function onMouseOut(e) {
      if (this.getXPathForElement(e.target).indexOf('twig-visual-container') > -1) {
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
      if (this.getXPathForElement(e.target).indexOf('twig-visual-container') > -1) {
        return;
      }

      e.preventDefault();
      this.selectModeToggle();
      var currentElement = this.currentElements.length > 0 ? this.currentElements[this.currentElements.length - 1] : e.target;
      this.selectionCancel(currentElement);
      var xpath = this.getXPathForElement(currentElement);
      this.createSelectionOptions(xpath);
    }
  }, {
    key: "selectionCancel",
    value: function selectionCancel() {
      var currentElement = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (!currentElement && this.currentElements.length > 0) {
        currentElement = this.currentElements[this.currentElements.length - 1];
      }

      this.data = {};
      this.currentElements = [];
      currentElement && currentElement.classList.remove('twv-selected');
      this.state = 'inactive';
      var buttonStart = this.container.querySelector('.twv-button-start-select');

      if (document.querySelector('.twv-info')) {
        this.removeEl(document.querySelector('.twv-info'));
      }

      buttonStart.parentNode.classList.remove('twv-block-active-status-active');
      this.container.querySelector('.twv-inner').innerHTML = '';

      if (document.querySelector('.twv-back-overlay')) {
        this.removeEl(document.querySelector('.twv-back-overlay'));
      }

      if (document.querySelector('.twv-selected-element')) {
        document.querySelector('.twv-selected-element').classList.remove('twv-selected-element');
      }
    }
  }, {
    key: "onMouseWheel",
    value: function onMouseWheel(e) {
      if (this.getXPathForElement(e.target).indexOf('twig-visual-container') > -1) {
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
      var xpath = this.getXPathForElement(element);

      if (xpath.indexOf('twig-visual-container') > -1) {
        return;
      }

      var div = document.querySelector('.twv-info');

      if (!div) {
        div = document.createElement('div');
        div.className = 'twv-info small';
        document.body.appendChild(div);
      }

      div.style.display = 'block';
      div.innerHTML = "<div>".concat(xpath, "</div>");
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
      var _this2 = this;

      var containerEl = document.createElement('div');
      containerEl.id = 'twig-visual-container';
      containerEl.className = 'twig-visual-container twv-panel-right';
      containerEl.innerHTML = "\n<div class=\"twv-panel-header\">\n    <button class=\"twv-btn twv-btn-sm twv-mr-1 twv-button-panel-left\" type=\"button\" title=\"\u041F\u0435\u0440\u0435\u0434\u0432\u0438\u043D\u0443\u0442\u044C \u0432\u043B\u0435\u0432\u043E\">\n        <i class=\"twv-icon-arrow_back\"></i>\n    </button>\n    <button class=\"twv-btn twv-btn-sm twv-button-panel-right\" type=\"button\" title=\"\u041F\u0435\u0440\u0435\u0434\u0432\u0438\u043D\u0443\u0442\u044C \u0432\u043F\u0440\u0430\u0432\u043E\">\n        <i class=\"twv-icon-arrow_forward\"></i>\n    </button>\n</div>\n<div class=\"twv-block-active-status twv-mb-3\">\n    <button type=\"button\" class=\"twv-btn twv-btn-primary twv-btn-block twv-mb-3 twv-block-active-status-inactive-content twv-button-start-select\">\n        <i class=\"twv-icon-center_focus_strong\"></i>\n        \u0412\u044B\u0431\u0440\u0430\u0442\u044C \u044D\u043B\u0435\u043C\u0435\u043D\u0442\n    </button>\n    <div class=\"twv-block-active-status-active-content\">\n        <div class=\"twv-input-group\">\n            <span class=\"twv-input-group-text twv-flex-fill\" title=\"\u042D\u043B\u0435\u043C\u0435\u043D\u0442 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430\">\n                <i class=\"twv-icon-done twv-mr-2 twv-text-success\"></i>\n                \u0412\u044B\u0431\u0440\u0430\u043D\u043E\n            </span>\n            <div class=\"twv-input-group-append\">\n                <button class=\"twv-btn twv-block-active-status-button-cancel\" title=\"\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C\">\n                    <i class=\"twv-icon-clearclose\"></i>\n                </button>\n            </div>\n        </div>\n    </div>\n</div>\n<div class=\"twv-inner\"></div>\n";
      document.body.appendChild(containerEl);
      containerEl.querySelector('.twv-button-panel-left').addEventListener('click', function (e) {
        e.preventDefault();

        _this2.panelMove('left');
      });
      containerEl.querySelector('.twv-button-panel-right').addEventListener('click', function (e) {
        e.preventDefault();

        _this2.panelMove('right');
      });
      return containerEl;
    }
  }, {
    key: "panelMove",
    value: function panelMove(direction) {
      var newClassName = "twv-panel-".concat(direction);

      if (this.container.classList.contains(newClassName)) {
        this.container.classList.add('twv-panel-hidden');
        return;
      } else if (this.container.classList.contains('twv-panel-hidden')) {
        this.container.classList.remove('twv-panel-hidden');
        return;
      }

      this.container.classList.remove('twv-panel-' + (direction === 'left' ? 'right' : 'left'));
      this.container.classList.add(newClassName);
    }
  }, {
    key: "createSelectionOptions",
    value: function createSelectionOptions(xpath) {
      var _this3 = this;

      var elementSelected = this.getElementByXPath(xpath);

      if (!elementSelected) {
        throw new Error('Element for XPath not found.');
      }

      var buttonStart = this.container.querySelector('.twv-button-start-select');
      buttonStart.parentNode.classList.add('twv-block-active-status-active');
      this.container.querySelector('.twv-inner').innerHTML = '';
      var xpathEscaped = xpath.replace(/[\"]/g, '&quot;');
      var div = document.createElement('div');
      div.innerHTML = "\n<b>XPath:</b>\n<div class=\"twv-p-1 twv-mb-3 twv-small twv-bg-gray\">\n    <div class=\"twv-text-overflow\" title=\"".concat(xpathEscaped, "\">").concat(xpath, "</div>\n</div>\n<div class=\"twv-mb-3 twv-ui-element-select\">\n    <select class=\"twv-select\">\n        <option value=\"\">- \u0422\u0438\u043F \u0431\u043B\u043E\u043A\u0430 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 -</option>\n        <option value=\"field\">\u041F\u043E\u043B\u0435 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430</option>\n        <option value=\"photogallery\">\u0424\u043E\u0442\u043E-\u0433\u0430\u043B\u0435\u0440\u0435\u044F</option>\n        <option value=\"menu\">\u041C\u0435\u043D\u044E</option>\n        <option value=\"breadcrumbs\">\u0425\u043B\u0435\u0431\u043D\u044B\u0435 \u043A\u043D\u043E\u0448\u043A\u0438</option>\n        <option value=\"shopping-cart\">\u041A\u043E\u0440\u0437\u0438\u043D\u0430 \u0442\u043E\u0432\u0430\u0440\u043E\u0432</option>\n        <option value=\"products-list\">\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u0442\u043E\u0432\u0430\u0440\u044B</option>\n        <option value=\"comments\">\u041E\u0442\u0437\u044B\u0432\u044B</option>\n    </select>\n</div>\n<div class=\"twv-ui-components\"></div>\n        ");
      this.container.querySelector('.twv-inner').appendChild(div);
      var componentsContainer = this.container.querySelector('.twv-ui-components');
      this.container.querySelector('.twv-ui-element-select').addEventListener('change', function (e) {
        componentsContainer.innerHTML = '';

        if (!_this3.options.uiOptions[e.target.value]) {
          return;
        }

        var opt = _this3.options.uiOptions[e.target.value];
        opt.components.forEach(function (cmp) {
          var div = document.createElement('div');
          div.className = 'twv-mb-2';
          div.innerHTML = "\n                <button class=\"twv-btn twv-btn-block\">".concat(cmp.title, "</button>\n                ");
          componentsContainer.appendChild(div);
        });
        console.log(e.target.value, _this3.options.uiOptions[e.target.value]);
      });
      var compStyles = window.getComputedStyle(elementSelected);
      var position = compStyles.getPropertyValue('position');
      var backgroundColor = compStyles.getPropertyValue('background-color');

      if (position === 'static') {
        elementSelected.style.position = 'relative';
      }

      if (['rgba(0, 0, 0, 0)', 'transparent'].indexOf(backgroundColor) > -1) {// elementSelected.style.backgroundColor = '#fff';
      }

      var backgroundOverlay = document.createElement('div');
      backgroundOverlay.className = 'twv-back-overlay';
      document.body.appendChild(backgroundOverlay);
      elementSelected.classList.add('twv-selected-element');
      console.log(xpath, backgroundColor, elementSelected, position);
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