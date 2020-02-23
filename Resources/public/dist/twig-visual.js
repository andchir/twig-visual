"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var TwigVisual =
/*#__PURE__*/
function () {
  function TwigVisual(options) {
    _classCallCheck(this, TwigVisual);

    this.parentElement = null;
    this.dataKey = 'source';
    this.data = {};
    this.components = [];
    this.options = Object.assign({
      uiOptions: {
        field: {
          components: []
        },
        photogallery: {
          components: []
        },
        menu: {
          components: [{
            name: "firstItem",
            title: "Пункт меню первого уровня",
            type: ""
          }, {
            name: "secondItem",
            title: "Пункт меню второго уровня",
            type: ""
          }]
        },
        breadcrumbs: {
          components: [{
            name: "linkHomePage",
            title: "Ссылка на главную страницу",
            type: ""
          }, {
            name: "item",
            title: "Ссылка",
            type: ""
          }]
        },
        "shopping-cart": {
          components: [{
            name: "totalPrice",
            title: "Общая цена",
            type: ""
          }, {
            name: "totalCount",
            title: "Общее количество",
            type: ""
          }, {
            name: "lickCheckout",
            title: "Ссылка на оформление",
            type: ""
          }, {
            name: "buttonClean",
            title: "Кнопка очистки",
            type: ""
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

      this.parentElement = document.body; // Start button

      var buttonStart = this.container.querySelector('.twv-button-start-select');
      buttonStart.addEventListener('click', function (e) {
        e.preventDefault();
        e.target.setAttribute('disabled', 'disabled');

        _this.selectModeToggle(document.body, 'source');
      });
      document.body.addEventListener('keyup', function (e) {
        if (e.code !== 'Escape') {
          return;
        }

        if (_this.state === 'active') {
          _this.selectModeToggle();
        }

        _this.selectionModeDestroy();
      });
    }
  }, {
    key: "selectModeToggle",
    value: function selectModeToggle(parentEl) {
      var dataKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'source';
      var hidePanel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      parentEl = parentEl || this.parentElement;

      if (this.state === 'inactive') {
        this.parentElement = parentEl;
        this.dataKey = dataKey;

        if (hidePanel) {
          this.container.style.display = 'none';
        }

        parentEl.addEventListener('mouseover', this.listenerOnMouseOver);
        parentEl.addEventListener('mouseout', this.listenerOnMouseOut);
        parentEl.addEventListener('wheel', this.listenerOnMouseWheel, {
          passive: false
        });
        parentEl.addEventListener('click', this.listenerOnMouseClick);
        this.state = 'active';
      } else {
        this.container.style.display = 'block';
        parentEl.removeEventListener('mouseover', this.listenerOnMouseOver);
        parentEl.removeEventListener('mouseout', this.listenerOnMouseOut);
        parentEl.removeEventListener('wheel', this.listenerOnMouseWheel);
        parentEl.removeEventListener('click', this.listenerOnMouseClick);
        this.state = 'inactive';
      }
    }
  }, {
    key: "onMouseOver",
    value: function onMouseOver(e) {
      if (this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
        return;
      }

      this.currentElements = [];
      this.updateXPathInfo(e.target);
      e.target.classList.add('twv-selected');
    }
  }, {
    key: "onMouseOut",
    value: function onMouseOut(e) {
      if (this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
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
      var _this2 = this;

      if (this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
        return;
      }

      e.preventDefault();
      this.selectModeToggle();
      var currentElement = this.currentElements.length > 0 ? this.currentElements[this.currentElements.length - 1] : e.target;
      this.selectionModeDestroy(); // Clear selection

      if (this.data[this.dataKey]) {
        var _xpath = this.data[this.dataKey];
        this.removeSelectionInnerByXPath(_xpath);
      }

      var xpath = this.getXPathForElement(currentElement);
      this.data[this.dataKey] = xpath;
      console.log(this.dataKey, this.data);

      if (this.dataKey === 'source') {
        this.createSelectionOptions(xpath);
      } else {
        currentElement.classList.add('twv-selected-success');
        var index = this.components.findIndex(function (item) {
          return item.name === _this2.dataKey;
        });

        if (index > -1) {
          if (currentElement.getAttribute('title') && !currentElement.dataset.twvTitle) {
            currentElement.dataset.twvTitle = currentElement.getAttribute('title');
          }

          currentElement.setAttribute('title', this.components[index].title);
        }

        this.componentButtonMakeSelected(this.dataKey);
      }
    }
  }, {
    key: "selectionModeDestroy",
    value: function selectionModeDestroy() {
      var reset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      this.state = 'inactive';

      if (document.querySelector('.twv-info')) {
        this.removeEl(document.querySelector('.twv-info'));
      }

      var elements = Array.from(document.querySelectorAll('.twv-selected'));
      elements.forEach(function (element) {
        element.classList.remove('twv-selected');
      });

      if (reset) {
        this.data = {};
        this.currentElements = [];
        this.components = [];
        var buttonStart = this.container.querySelector('.twv-button-start-select'); // Remove options

        buttonStart.parentNode.classList.remove('twv-block-active-status-active');
        this.container.querySelector('.twv-inner').innerHTML = ''; // Remove overlay

        if (document.querySelector('.twv-back-overlay')) {
          this.removeEl(document.querySelector('.twv-back-overlay'));
        } // Remove selection of parent element


        if (document.querySelector('.twv-selected-element')) {
          document.querySelector('.twv-selected-element').classList.remove('twv-selected-element');
        }

        this.removeSelectionInner();
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
    /**
     * Remove selection of inner elements
     */

  }, {
    key: "removeSelectionInner",
    value: function removeSelectionInner() {
      var selectedElements = Array.from(document.querySelectorAll('.twv-selected-success'));
      selectedElements.forEach(function (element) {
        if (element.dataset.twvTitle) {
          element.setAttribute('title', element.dataset.twvTitle);
        } else {
          element.removeAttribute('title');
        }

        element.classList.remove('twv-selected-success');
      });
    }
    /**
     * Remove selection by XPath
     * @param xpath
     */

  }, {
    key: "removeSelectionInnerByXPath",
    value: function removeSelectionInnerByXPath(xpath) {
      var element = this.getElementByXPath(xpath);

      if (element.dataset.twvTitle) {
        element.setAttribute('title', element.dataset.twvTitle);
      } else {
        element.removeAttribute('title');
      }

      element.classList.remove('twv-selected-success');
    }
  }, {
    key: "updateXPathInfo",
    value: function updateXPathInfo(element) {
      var xpath = this.getXPathForElement(element, true);

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
      var getAttributes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (element.id !== '') return 'id("' + element.id + '")';
      if (element.tagName === 'HTML') return '/HTML[1]'.toLowerCase();
      if (element === document.body) return '/HTML[1]/BODY[1]'.toLowerCase();
      var ix = 0;
      var siblings = element.parentNode.childNodes;

      for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];

        if (sibling === element) {
          return this.getXPathForElement(element.parentNode, getAttributes) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']' + (getAttributes ? this.getXpathElementAttributes(element) : '');
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
      var _this3 = this;

      var containerEl = document.createElement('div');
      containerEl.id = 'twig-visual-container';
      containerEl.className = 'twig-visual-container twv-panel-right';
      containerEl.innerHTML = "\n<div class=\"twv-panel-header\">\n    <button class=\"twv-btn twv-btn-sm twv-mr-1 twv-button-panel-left\" type=\"button\" title=\"\u041F\u0435\u0440\u0435\u0434\u0432\u0438\u043D\u0443\u0442\u044C \u0432\u043B\u0435\u0432\u043E\">\n        <i class=\"twv-icon-arrow_back\"></i>\n    </button>\n    <button class=\"twv-btn twv-btn-sm twv-button-panel-right\" type=\"button\" title=\"\u041F\u0435\u0440\u0435\u0434\u0432\u0438\u043D\u0443\u0442\u044C \u0432\u043F\u0440\u0430\u0432\u043E\">\n        <i class=\"twv-icon-arrow_forward\"></i>\n    </button>\n</div>\n<div class=\"twv-mb-3\">\n    <button type=\"button\" class=\"twv-btn twv-btn-primary twv-btn-block twv-button-start-select\">\n        <i class=\"twv-icon-center_focus_strong\"></i>\n        \u0411\u043B\u043E\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430\n    </button>\n</div>\n<div class=\"twv-inner\"></div>\n";
      document.body.appendChild(containerEl);
      containerEl.querySelector('.twv-button-panel-left').addEventListener('click', function (e) {
        e.preventDefault();

        _this3.panelMove('left');
      });
      containerEl.querySelector('.twv-button-panel-right').addEventListener('click', function (e) {
        e.preventDefault();

        _this3.panelMove('right');
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
      var _this4 = this;

      var elementSelected = this.getElementByXPath(xpath);

      if (!elementSelected) {
        throw new Error('Element for XPath not found.');
      }

      var buttonStart = this.container.querySelector('.twv-button-start-select');
      this.makeButtonSelected(buttonStart, true, function () {
        _this4.selectionModeDestroy(true);
      });
      this.container.querySelector('.twv-inner').innerHTML = '';
      var xpathEscaped = xpath.replace(/[\"]/g, '&quot;');
      var div = document.createElement('div');
      div.innerHTML = "\n<b>XPath:</b>\n<div class=\"twv-p-1 twv-mb-3 twv-small twv-bg-gray\">\n    <div class=\"twv-text-overflow\" title=\"".concat(xpathEscaped, "\">").concat(xpath, "</div>\n</div>\n<div class=\"twv-mb-3 twv-ui-element-select\">\n    <select class=\"twv-custom-select\">\n        <option value=\"\">- \u0422\u0438\u043F \u0431\u043B\u043E\u043A\u0430 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 -</option>\n        <option value=\"field\">\u041F\u043E\u043B\u0435 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430</option>\n        <option value=\"photogallery\">\u0424\u043E\u0442\u043E-\u0433\u0430\u043B\u0435\u0440\u0435\u044F</option>\n        <option value=\"menu\">\u041C\u0435\u043D\u044E</option>\n        <option value=\"breadcrumbs\">\u0425\u043B\u0435\u0431\u043D\u044B\u0435 \u043A\u043D\u043E\u0448\u043A\u0438</option>\n        <option value=\"shopping-cart\">\u041A\u043E\u0440\u0437\u0438\u043D\u0430 \u0442\u043E\u0432\u0430\u0440\u043E\u0432</option>\n        <option value=\"products-list\">\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u0442\u043E\u0432\u0430\u0440\u044B</option>\n        <option value=\"comments\">\u041E\u0442\u0437\u044B\u0432\u044B</option>\n    </select>\n</div>\n<div class=\"twv-mb-3 twv-ui-components\"></div>\n<div class=\"twv-mb-3\">\n    <button type=\"button\" class=\"twv-btn twv-btn-primary twv-button-submit\">\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C</button>\n</div>\n        ");
      this.container.querySelector('.twv-inner').appendChild(div);
      var componentsContainer = this.container.querySelector('.twv-ui-components');
      var buttonSubmit = this.container.querySelector('.twv-button-submit');
      buttonSubmit.style.display = 'none'; // Submit data

      buttonSubmit.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('SUBMIT', _this4.data);
      }); // Select UI element type

      this.container.querySelector('.twv-ui-element-select').addEventListener('change', function (e) {
        componentsContainer.innerHTML = '';

        _this4.removeSelectionInner();

        if (!e.target.value) {
          buttonSubmit.style.display = 'none';
          return;
        }

        buttonSubmit.style.display = 'inline-block';

        if (!_this4.options.uiOptions[e.target.value]) {
          return;
        } // Clean components data


        Object.keys(_this4.data).forEach(function (key) {
          if (key !== 'source') {
            delete _this4.data[key];
          }
        });
        var opt = _this4.options.uiOptions[e.target.value];
        _this4.components = opt.components;

        _this4.components.forEach(function (cmp) {
          var div = document.createElement('div');
          div.className = 'twv-mb-2';
          div.innerHTML = "<button data-twv-key=\"".concat(cmp.name, "\" class=\"twv-btn twv-btn-block\">").concat(cmp.title, "</button>");
          componentsContainer.appendChild(div);
          div.querySelector('button').addEventListener('click', function (e) {
            e.preventDefault();

            if (_this4.state === 'active') {
              return;
            }

            e.target.setAttribute('disabled', 'disabled');

            _this4.selectModeToggle(elementSelected, cmp.name, false);
          });
        });
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
    key: "componentButtonMakeSelected",
    value: function componentButtonMakeSelected(dataKey) {
      var _this5 = this;

      var componentsContainer = this.container.querySelector('.twv-ui-components');
      var buttons = Array.from(componentsContainer.querySelectorAll('button'));
      buttons = buttons.filter(function (buttonEl) {
        return buttonEl.dataset.twvKey === dataKey;
      });

      if (buttons.length === 1) {
        this.makeButtonSelected(buttons[0], true, function () {
          var xpath = _this5.data[dataKey] || null;

          _this5.removeSelectionInnerByXPath(xpath);

          delete _this5.data[dataKey];
          console.log(_this5.data);
        });
      }
    }
    /**
     * Mark button as selected
     * @param buttonEl
     * @param selected
     * @param cancelFunc
     */

  }, {
    key: "makeButtonSelected",
    value: function makeButtonSelected(buttonEl) {
      var _this6 = this;

      var selected = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var cancelFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      buttonEl.removeAttribute('disabled');

      if (buttonEl.parentNode.classList.contains('twv-block-active-status')) {
        if (selected) {
          buttonEl.parentNode.classList.add('twv-block-active-status-active');
        } else {
          buttonEl.parentNode.classList.remove('twv-block-active-status-active');
        }

        return;
      }

      var title = buttonEl.textContent;
      var div = document.createElement('div');
      div.innerHTML = "\n<div class=\"twv-block-active-status twv-block-active-status-active\">\n    <div class=\"twv-block-active-status-active-content\">\n        <div class=\"twv-input-group\">\n            <span class=\"twv-input-group-text twv-flex-fill\" title=\"".concat(title, "\">\n                <i class=\"twv-icon-done twv-mr-2 twv-text-success\"></i>\n                \u0412\u044B\u0431\u0440\u0430\u043D\u043E\n            </span>\n            <div class=\"twv-input-group-append\">\n                <button class=\"twv-btn twv-block-active-status-button-cancel\" title=\"\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C\">\n                    <i class=\"twv-icon-clearclose\"></i>\n                </button>\n            </div>\n        </div>\n    </div>\n</div>\n        ");
      buttonEl.classList.add('twv-block-active-status-inactive-content');
      this.insertAfter(div, buttonEl);
      div.querySelector('.twv-block-active-status').appendChild(buttonEl);
      buttonEl.parentNode.querySelector('.twv-block-active-status-button-cancel').addEventListener('click', function (e) {
        e.preventDefault();

        _this6.makeButtonSelected(buttonEl, false);

        if (typeof cancelFunc === 'function') {
          cancelFunc();
        }
      });
    }
    /**
     * Remove HTML element
     * @param el
     */

  }, {
    key: "removeEl",
    value: function removeEl(el) {
      el.parentNode.removeChild(el);
    }
  }, {
    key: "insertAfter",

    /**
     * Insert HTML element after other one
     * @param newNode
     * @param referenceNode
     */
    value: function insertAfter(newNode, referenceNode) {
      referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
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