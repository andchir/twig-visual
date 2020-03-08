"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var TwigVisual =
/*#__PURE__*/
function () {
  function TwigVisual(options) {
    _classCallCheck(this, TwigVisual);

    this.container = null;
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
          }, {
            name: "thirdItem",
            title: "Пункт меню третьего уровня",
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
    this.state = 'inactive';
    this.listenerOnMouseOver = this.onMouseOver.bind(this);
    this.listenerOnMouseOut = this.onMouseOut.bind(this);
    this.listenerOnMouseWheel = this.onMouseWheel.bind(this);
    this.listenerOnMouseClick = this.onSelectedElementClick.bind(this);
    this.currentElements = [];
    TwigVisual.onReady(this.init.bind(this));
  }

  _createClass(TwigVisual, [{
    key: "init",
    value: function init() {
      var _this = this;

      console.log('INIT');
      this.container = this.createContainer();
      this.parentElement = document.body; // Start button

      var buttonStart = this.container.querySelector('.twv-button-start-select');
      buttonStart.addEventListener('click', function (e) {
        e.preventDefault();
        e.target.setAttribute('disabled', 'disabled');

        _this.selectModeToggle(document.body, 'source');
      }); // Add new theme

      var buttonAddTheme = this.container.querySelector('.twv-button-new-theme');
      buttonAddTheme.addEventListener('click', function (e) {
        e.preventDefault();

        if (_this.state === 'active') {
          _this.selectModeToggle();
        }

        _this.selectionModeDestroy(true);

        _this.addNewTheme();
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
        parentEl.removeEventListener('click', this.listenerOnMouseClick); // Remove attribute disabled

        if (this.container.querySelector('.twv-ui-components')) {
          var buttons = this.container.querySelector('.twv-ui-components').querySelectorAll('button');
          Array.from(buttons).forEach(function (buttonEl) {
            buttonEl.removeAttribute('disabled');
          });
        }

        var buttonStart = this.container.querySelector('.twv-button-start-select');
        buttonStart.removeAttribute('disabled');
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

      console.log('CLICK');

      if (this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
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
    /**
     * Destroy selection mode
     * @param reset
     */

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


        var elementSelected = document.querySelector('.twv-selected-element');

        if (elementSelected) {
          elementSelected.classList.remove('twv-selected-element');
        }

        this.setToParents(elementSelected, {
          transform: ''
        });
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
      containerEl.innerHTML = "\n<div class=\"twv-panel-header\">\n    <button class=\"twv-btn twv-btn-sm twv-mr-1 twv-button-panel-left\" type=\"button\" title=\"\u041F\u0435\u0440\u0435\u0434\u0432\u0438\u043D\u0443\u0442\u044C \u0432\u043B\u0435\u0432\u043E\">\n        <i class=\"twv-icon-arrow_back\"></i>\n    </button>\n    <button class=\"twv-btn twv-btn-sm twv-button-panel-right\" type=\"button\" title=\"\u041F\u0435\u0440\u0435\u0434\u0432\u0438\u043D\u0443\u0442\u044C \u0432\u043F\u0440\u0430\u0432\u043E\">\n        <i class=\"twv-icon-arrow_forward\"></i>\n    </button>\n</div>\n<div class=\"twv-mb-2\">\n    <button type=\"button\" class=\"twv-btn twv-btn-primary twv-btn-block twv-button-new-theme\">\n        <i class=\"twv-icon-add\"></i>\n        \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u0442\u0435\u043C\u0443\n    </button>\n</div>\n<div class=\"twv-mb-3\">\n    <button type=\"button\" class=\"twv-btn twv-btn-primary twv-btn-block twv-button-start-select\">\n        <i class=\"twv-icon-center_focus_strong\"></i>\n        \u0411\u043B\u043E\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430\n    </button>\n</div>\n<div class=\"twv-inner\"></div>\n";
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
    key: "onBlockUiTypeChange",
    value: function onBlockUiTypeChange(parentElement, typeValue) {
      var _this4 = this;

      var componentsContainer = this.container.querySelector('.twv-ui-components');
      componentsContainer.innerHTML = '';
      this.removeSelectionInner();

      if (!typeValue) {
        return;
      }

      if (!this.options.uiOptions[typeValue]) {
        return;
      } // Clean components data


      Object.keys(this.data).forEach(function (key) {
        if (key !== 'source') {
          delete _this4.data[key];
        }
      });
      var div = document.createElement('div');
      div.className = 'twv-pt-1 twv-mb-3';
      var opt = this.options.uiOptions[typeValue];
      this.components = opt.components;
      this.components.forEach(function (cmp) {
        var d = document.createElement('div');
        d.className = 'twv-mb-2';
        d.innerHTML = "<button data-twv-key=\"".concat(cmp.name, "\" class=\"twv-btn twv-btn-block\">").concat(cmp.title, "</button>");
        div.appendChild(d);
        d.querySelector('button').addEventListener('click', function (e) {
          e.preventDefault();

          if (_this4.state === 'active') {
            return;
          }

          e.target.setAttribute('disabled', 'disabled');

          _this4.selectModeToggle(parentElement, cmp.name, false);
        });
      });
      componentsContainer.appendChild(div);
      div = document.createElement('div');
      div.className = 'twv-pt-1 twv-mb-3';
      div.innerHTML = "\n            <button type=\"button\" class=\"twv-btn twv-btn-primary twv-mr-1 twv-button-submit\">\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C</button>\n            <button type=\"button\" class=\"twv-btn twv-button-cancel\">\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C</button>\n        ";
      componentsContainer.appendChild(div);
      var buttonSubmit = this.container.querySelector('.twv-button-submit');
      var buttonCancel = this.container.querySelector('.twv-button-cancel'); // Submit data

      buttonSubmit.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('SUBMIT', _this4.data);
      }); // Cancel

      buttonCancel.addEventListener('click', function (e) {
        e.preventDefault();

        var selectEl = _this4.container.querySelector('.twv-ui-element-select > select');

        var elementSelected = document.querySelector('.twv-selected-element');

        if (_this4.state === 'active') {
          _this4.selectModeToggle();

          return;
        }

        if (selectEl.value) {
          selectEl.value = '';

          _this4.selectionModeDestroy();

          _this4.onBlockUiTypeChange(elementSelected);
        } else {
          _this4.selectionModeDestroy(true);
        }
      });
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

      var title = buttonEl.textContent.trim();
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
  }, {
    key: "createSelectionOptions",
    value: function createSelectionOptions(xpath) {
      var _this7 = this;

      var elementSelected = this.getElementByXPath(xpath);

      if (!elementSelected) {
        throw new Error('Element for XPath not found.');
      }

      var buttonStart = this.container.querySelector('.twv-button-start-select');
      this.makeButtonSelected(buttonStart, true, function () {
        _this7.selectionModeDestroy(true);
      });
      this.container.querySelector('.twv-inner').innerHTML = '';
      var xpathEscaped = xpath.replace(/[\"]/g, '&quot;');
      var div = document.createElement('div');
      div.innerHTML = "\n<b>XPath:</b>\n<div class=\"twv-p-1 twv-mb-3 twv-small twv-bg-gray\">\n    <div class=\"twv-text-overflow\" title=\"".concat(xpathEscaped, "\">").concat(xpath, "</div>\n</div>\n<div class=\"twv-mb-3\">\n    <button type=\"button\" class=\"twv-btn twv-mr-1 twv-button-edit-text\" title=\"Edit text content\">\n        <i class=\"twv-icon-createmode_editedit\"></i>\n    </button>\n    <button type=\"button\" class=\"twv-btn twv-mr-1 twv-button-edit-link\" title=\"Edit link\">\n        <i class=\"twv-icon-linkinsert_link\"></i>\n    </button>\n    <button type=\"button\" class=\"twv-btn twv-mr-1 twv-button-delete-element\" title=\"Delete element\">\n        <i class=\"twv-icon-clearclose\"></i>\n    </button>\n</div>\n<div class=\"twv-mb-3 twv-ui-element-select\">\n    <select class=\"twv-custom-select\">\n        <option value=\"\">- \u0422\u0438\u043F \u0431\u043B\u043E\u043A\u0430 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 -</option>\n        <option value=\"field\">\u041F\u043E\u043B\u0435 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430</option>\n        <option value=\"photogallery\">\u0424\u043E\u0442\u043E-\u0433\u0430\u043B\u0435\u0440\u0435\u044F</option>\n        <option value=\"menu\">\u041C\u0435\u043D\u044E</option>\n        <option value=\"breadcrumbs\">\u0425\u043B\u0435\u0431\u043D\u044B\u0435 \u043A\u043D\u043E\u0448\u043A\u0438</option>\n        <option value=\"shopping-cart\">\u041A\u043E\u0440\u0437\u0438\u043D\u0430 \u0442\u043E\u0432\u0430\u0440\u043E\u0432</option>\n        <option value=\"products-list\">\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u0442\u043E\u0432\u0430\u0440\u044B</option>\n        <option value=\"comments\">\u041E\u0442\u0437\u044B\u0432\u044B</option>\n    </select>\n</div>\n<div class=\"twv-mb-3 twv-ui-components\"></div>\n        ");
      this.container.querySelector('.twv-inner').appendChild(div);
      var selectEl = this.container.querySelector('.twv-ui-element-select > select'); // Select UI element type

      selectEl.addEventListener('change', function (e) {
        _this7.onBlockUiTypeChange(elementSelected, e.target.value);
      }); // Button edit text

      this.container.querySelector('.twv-button-edit-text').addEventListener('click', function (e) {
        e.preventDefault();

        _this7.editTextContentInit(elementSelected);
      }); // Button edit link

      this.container.querySelector('.twv-button-edit-link').addEventListener('click', function (e) {
        e.preventDefault();

        _this7.editLinkInit(elementSelected);
      }); // Button delete element

      this.container.querySelector('.twv-button-delete-element').addEventListener('click', function (e) {
        e.preventDefault();

        _this7.deleteElementInit(elementSelected);
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
      backgroundOverlay.className = 'twv-back-overlay'; // document.body.appendChild(backgroundOverlay);

      this.insertBefore(backgroundOverlay, elementSelected);
      this.setToParents(elementSelected, {
        transform: 'none'
      });
      elementSelected.classList.add('twv-selected-element');
    }
    /**
     * Edit text content
     * @param {HTMLElement} elementSelected
     */

  }, {
    key: "editTextContentInit",
    value: function editTextContentInit(elementSelected) {
      var _this8 = this;

      var children = elementSelected.children;

      if (children.length > 0) {
        alert('The selected item must not have children.');
        return;
      }

      this.clearMessage();
      var componentsContainer = this.container.querySelector('.twv-ui-components');
      var textContent = elementSelected.textContent.trim();
      componentsContainer.innerHTML = '';
      var div = document.createElement('div');
      div.innerHTML = "\n            <div class=\"twv-mb-3\">\n                <label class=\"twv-display-block twv-mb-1\" for=\"tww-field-element-text\">\u0422\u0435\u043A\u0441\u0442</label>\n                ".concat(textContent.length <= 30 ? "<input type=\"text\" id=\"tww-field-element-text\" class=\"twv-form-control\" value=\"".concat(textContent, "\">") : "<textarea id=\"tww-field-element-text\" class=\"twv-form-control\" rows=\"5\">".concat(textContent, "</textarea>"), "\n            </div>\n            <div class=\"twv-mb-3\">\n                <button type=\"button\" class=\"twv-btn twv-btn-primary twv-mr-2 twv-button-submit\">\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C</button>\n                <button type=\"button\" class=\"twv-btn twv-btn twv-button-cancel\">\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C</button>\n            </div>\n            ");
      componentsContainer.appendChild(div);
      var buttonSubmit = this.container.querySelector('.twv-button-submit');
      var buttonCancel = this.container.querySelector('.twv-button-cancel'); // Submit data

      buttonSubmit.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('SUBMIT', _this8.data);
      }); // Cancel

      buttonCancel.addEventListener('click', function (e) {
        e.preventDefault();
        componentsContainer.innerHTML = '';
      });
    }
    /**
     * Edit link
     * @param {HTMLElement} elementSelected
     */

  }, {
    key: "editLinkInit",
    value: function editLinkInit(elementSelected) {
      var _this9 = this;

      if (elementSelected.tagName.toLowerCase() !== 'a') {
        alert('The selected item must have tag A.');
        return;
      }

      console.log('EDIT_LINK');
      this.clearMessage();
      var componentsContainer = this.container.querySelector('.twv-ui-components');
      var href = elementSelected.getAttribute('href');
      componentsContainer.innerHTML = '';
      var div = document.createElement('div');
      div.innerHTML = "\n            <div class=\"twv-mb-3\">\n                <label class=\"twv-display-block twv-mb-1\" for=\"tww-field-element-link\">\u0421\u0441\u044B\u043B\u043A\u0430</label>\n                <input type=\"text\" id=\"tww-field-element-link\" class=\"twv-form-control\" value=\"".concat(href, "\">\n            </div>\n            <div class=\"twv-mb-3\">\n                <button type=\"button\" class=\"twv-btn twv-btn-primary twv-mr-2 twv-button-submit\">\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C</button>\n                <button type=\"button\" class=\"twv-btn twv-btn twv-button-cancel\">\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C</button>\n            </div>\n            ");
      componentsContainer.appendChild(div);
      var buttonSubmit = this.container.querySelector('.twv-button-submit');
      var buttonCancel = this.container.querySelector('.twv-button-cancel'); // Submit data

      buttonSubmit.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('SUBMIT', _this9.data);
      }); // Cancel

      buttonCancel.addEventListener('click', function (e) {
        e.preventDefault();
        componentsContainer.innerHTML = '';
      });
    }
    /**
     * Delete selected element
     * @param {HTMLElement} elementSelected
     */

  }, {
    key: "deleteElementInit",
    value: function deleteElementInit(elementSelected) {
      var _this10 = this;

      console.log('DELETE');
      this.clearMessage();
      var componentsContainer = this.container.querySelector('.twv-ui-components');
      var textContent = elementSelected.textContent.trim();
      componentsContainer.innerHTML = '';
      var div = document.createElement('div');
      div.innerHTML = "\n            <div class=\"twv-mb-3\">\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u044D\u043B\u0435\u043C\u0435\u043D\u0442?</div>\n            <div class=\"twv-mb-3\">\n                <button type=\"button\" class=\"twv-btn twv-btn-primary twv-mr-2 twv-button-submit\">\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C</button>\n                <button type=\"button\" class=\"twv-btn twv-btn twv-button-cancel\">\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C</button>\n            </div>\n            ";
      componentsContainer.appendChild(div);
      var buttonSubmit = this.container.querySelector('.twv-button-submit');
      var buttonCancel = this.container.querySelector('.twv-button-cancel'); // Submit data

      buttonSubmit.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('SUBMIT', _this10.data);
      }); // Cancel

      buttonCancel.addEventListener('click', function (e) {
        e.preventDefault();
        componentsContainer.innerHTML = '';
      });
    }
  }, {
    key: "addNewTheme",
    value: function addNewTheme() {
      var _this11 = this;

      this.clearMessage();
      var innerContainerEl = this.container.querySelector('.twv-inner');
      innerContainerEl.innerHTML = '';
      var div = document.createElement('div');
      div.innerHTML = "\n        <div class=\"twv-mb-3\">\n            <label class=\"twv-display-block twv-mb-1\" for=\"tww-field-theme-name\">\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0442\u0435\u043C\u044B</label>\n            <input type=\"text\" id=\"tww-field-theme-name\" class=\"twv-form-control\">\n        </div>\n        <div class=\"twv-mb-3\">\n            <label class=\"twv-display-block twv-mb-1\" for=\"tww-field-theme-mainpage\">HTML-\u0444\u0430\u0439\u043B \u0433\u043B\u0430\u0432\u043D\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B</label>\n            <input type=\"text\" id=\"tww-field-theme-mainpage\" class=\"twv-form-control\" value=\"index.html\">\n        </div>\n        <div class=\"twv-mb-3\">\n            <button type=\"button\" class=\"twv-btn twv-btn-primary twv-mr-2 twv-button-submit\">\u0421\u043E\u0437\u0434\u0430\u0442\u044C</button>\n            <button type=\"button\" class=\"twv-btn twv-btn twv-button-cancel\">\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C</button>\n        </div>\n        ";
      innerContainerEl.appendChild(div);
      innerContainerEl.querySelector('button.twv-button-submit').addEventListener('click', function (e) {
        e.preventDefault();
        var fieldThemeEl = document.getElementById('tww-field-theme-name');
        var fieldMainpageEl = document.getElementById('tww-field-theme-mainpage');
        var buttonEl = e.target;

        if (!fieldThemeEl.value || !fieldMainpageEl.value) {
          return;
        }

        buttonEl.setAttribute('disabled', 'disabled');

        _this11.request('/twigvisual/create', {
          theme: fieldThemeEl.value,
          mainpage: fieldMainpageEl.value
        }, function (res) {
          console.log(res);
          buttonEl.removeAttribute('disabled');
        }, function (err) {
          _this11.addErrorMessage(err.error || err);

          buttonEl.removeAttribute('disabled');
        }, 'POST');
      });
      innerContainerEl.querySelector('button.twv-button-cancel').addEventListener('click', function (e) {
        e.preventDefault();
        innerContainerEl.innerHTML = '';
      });
    }
    /**
     * Show message
     * @param message
     * @param type
     */

  }, {
    key: "addErrorMessage",
    value: function addErrorMessage(message) {
      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'danger';
      var innerContainerEl = this.container.querySelector('.twv-inner');

      if (innerContainerEl.querySelector('.twv-alert')) {
        this.removeEl(innerContainerEl.querySelector('.twv-alert'));
      }

      var div = document.createElement('div');
      div.innerHTML = "\n        <div class=\"twv-alert twv-alert-".concat(type, "\">").concat(message, "</div>\n        ");
      innerContainerEl.appendChild(div);
      setTimeout(this.clearMessage.bind(this), 3000);
    }
  }, {
    key: "clearMessage",
    value: function clearMessage() {
      var innerContainerEl = this.container.querySelector('.twv-inner');

      if (innerContainerEl.querySelector('.twv-alert')) {
        this.removeEl(innerContainerEl.querySelector('.twv-alert'));
      }
    }
    /**
     * Ajax request
     * @param url
     * @param data
     * @param successFn
     * @param failFn
     * @param method
     */

  }, {
    key: "request",
    value: function request(url, data, successFn, failFn, method) {
      method = method || 'GET';
      var request = new XMLHttpRequest();
      request.open(method, url, true);

      request.onload = function () {
        var result = ['{', '['].indexOf(request.responseText.substr(0, 1)) > -1 ? JSON.parse(request.responseText) : {};

        if (request.status >= 200 && request.status < 400) {
          if (typeof successFn === 'function') {
            successFn(result);
          }
        } else {
          if (typeof failFn === 'function') {
            failFn(result);
          }
        }
      };

      request.onerror = function () {
        if (typeof failFn === 'function') {
          failFn(request);
        }
      };

      request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

      if (!(data instanceof FormData)) {
        data = JSON.stringify(data);
        request.setRequestHeader('Content-type', 'application/json; charset=utf-8');
      }

      if (method === 'POST') {
        request.send(data);
      } else {
        request.send();
      }
    }
    /**
     * Set styles to parents
     * @param element
     * @param styles
     */

  }, {
    key: "setToParents",
    value: function setToParents(element, styles) {
      if (!element) {
        return;
      }

      if (element.parentNode === document.body) {
        return;
      }

      Object.keys(styles).forEach(function (key) {
        element.parentNode.style[key] = styles[key];
      });
      this.setToParents(element.parentNode, styles);
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
    /**
     * Insert HTML element before other one
     * @param newNode
     * @param referenceNode
     */

  }, {
    key: "insertBefore",
    value: function insertBefore(newNode, referenceNode) {
      referenceNode.parentNode.insertBefore(newNode, referenceNode);
    }
  }], [{
    key: "onLoad",
    value: function onLoad(cb) {
      if (document.readyState === 'complete') {
        cb();
      } else {
        window.addEventListener('load', cb);
      }
    }
  }, {
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

var twigVisual = new TwigVisual();
