"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * TwigVisual
 * @version 1.0.0
 * @author Andchir<andchir@gmail.com>
 */
var TwigVisual =
/*#__PURE__*/
function () {
  function TwigVisual(options) {
    _classCallCheck(this, TwigVisual);

    this.container = null;
    this.loading = false;
    this.parentElement = null;
    this.dataKey = 'source';
    this.data = {};
    this.actions = [];
    this.timer = null;
    this.components = [];
    this.options = Object.assign({
      templateName: '',
      templates: [],
      pageFields: [],
      uiOptions: {}
    }, options);
    this.state = 'inactive';
    this.listenerOnMouseOver = this.onMouseOver.bind(this);
    this.listenerOnMouseOut = this.onMouseOut.bind(this);
    this.listenerOnMouseWheel = this.onMouseWheel.bind(this);
    this.listenerOnMouseClick = this.onSelectedElementClick.bind(this);
    this.currentElements = [];
    this.selectedElement = null;
    TwigVisual.onReady(this.init.bind(this));
  }

  _createClass(TwigVisual, [{
    key: "init",
    value: function init() {
      var _this = this;

      this.container = this.createContainer(); // Start button

      var buttonStart = this.container.querySelector('.twv-button-start-select');
      buttonStart.addEventListener('click', function (e) {
        e.preventDefault();
        e.target.setAttribute('disabled', 'disabled');

        _this.removeSelectionInner();

        _this.selectModeToggle(document.body, 'source');
      }); // Add new theme

      var buttonAddTheme = this.container.querySelector('.twv-button-new-theme');
      buttonAddTheme.addEventListener('click', function (e) {
        e.preventDefault();

        if (_this.state === 'active') {
          _this.selectModeToggle();
        }

        _this.selectionModeDestroy(true);

        _this.addNewThemeInit();
      });
      this.container.querySelector('.twv-button-new-template').addEventListener('click', function (e) {
        e.preventDefault();

        if (_this.state === 'active') {
          _this.selectModeToggle();
        }

        _this.selectionModeDestroy(true);

        _this.addNewTemplateInit();
      });
      document.body.addEventListener('keyup', function (e) {
        if (e.code === 'Escape') {
          if (_this.state === 'active') {
            _this.selectModeToggle();
          }

          _this.selectionModeDestroy();
        }

        if (e.code === 'Enter') {
          if (_this.state === 'active') {
            var selectedEl = document.querySelector('.twv-selected');

            _this.selectModeApply(selectedEl);
          }
        }
      }); // Panel position recovery

      var panelClassName = this.getCookie('twv-panel-class-name');

      if (panelClassName) {
        this.container.className = panelClassName;
        this.container.classList.add('twig-visual-container');
      }
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
        this.onAfterSelect();
      }
    }
  }, {
    key: "onAfterSelect",
    value: function onAfterSelect() {
      var _this2 = this;

      switch (this.dataKey) {
        case 'moveTarget':
          var innerContainerEl = this.container.querySelector('.twv-inner');
          var buttonStart = this.container.querySelector('.twv-button-start-select');
          this.makeButtonSelected(buttonStart, true, function () {
            _this2.selectionModeDestroy(true);

            return true;
          });
          this.removeOverlay();
          innerContainerEl.innerHTML = '';
          var div = document.createElement('div');
          div.className = 'twv-pt-1 twv-mb-3';
          div.innerHTML = "\n                    <div class=\"twv-mb-3\">\n                        <label class=\"twv-display-block\">\n                            <input type=\"radio\" name=\"insertMode\" value=\"inside\" checked=\"checked\">\n                            \u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C\n                        </label>\n                        <label class=\"twv-display-block\">\n                            <input type=\"radio\" name=\"insertMode\" value=\"before\">\n                            \u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0434\u043E\n                        </label>\n                        <label class=\"twv-display-block\">\n                            <input type=\"radio\" name=\"insertMode\" value=\"after\">\n                            \u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u0441\u043B\u0435\n                        </label>\n                    </div>\n                    <button type=\"button\" class=\"twv-btn twv-btn-primary twv-mr-1 twv-button-submit\">\n                        <i class=\"twv-icon-done\"></i>\n                        \u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C\n                    </button>\n                    <button type=\"button\" class=\"twv-btn twv-btn twv-button-cancel\" title=\"\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C\">\n                        <i class=\"twv-icon-clearclose\"></i>\n                    </button>\n                ";
          innerContainerEl.appendChild(div);
          var buttonSubmit = innerContainerEl.querySelector('.twv-button-submit');
          var buttonCancel = innerContainerEl.querySelector('.twv-button-cancel'); // Submit data

          buttonSubmit.addEventListener('click', function (e) {
            e.preventDefault();
            var insertMode = innerContainerEl.querySelector('input[name="insertMode"]:checked').value;

            _this2.showLoading(true);

            _this2.request('/twigvisual/move_element', {
              templateName: _this2.options.templateName,
              xpath: _this2.data.source,
              xpathTarget: _this2.data.moveTarget,
              insertMode: insertMode
            }, function (res) {
              if (res.success) {
                _this2.windowReload();
              } else {
                _this2.showLoading(false);
              }
            }, function (err) {
              _this2.addAlertMessage(err.error || err);

              _this2.showLoading(false);
            }, 'POST');
          }); // Submit data

          buttonCancel.addEventListener('click', function (e) {
            e.preventDefault();
            innerContainerEl.innerHTML = '';

            _this2.selectionModeDestroy(true);
          });
          break;
      }
    }
  }, {
    key: "onMouseOver",
    value: function onMouseOver(e) {
      var xpath = this.getXPathForElement(e.target, true);

      if (!xpath || this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
        return;
      }

      this.currentElements = [];
      this.updateXPathInfo(e.target);
      e.target.classList.add('twv-selected');
      this.displayPadding(e.target);
    }
  }, {
    key: "onMouseOut",
    value: function onMouseOut(e) {
      var xpath = this.getXPathForElement(e.target, true);

      if (!xpath || this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
        return;
      }

      this.currentElements = [];
      var elements = Array.from(document.querySelectorAll('.twv-selected'));
      elements.forEach(function (element) {
        element.classList.remove('twv-selected');
        element.style.boxShadow = '';
      });
    }
  }, {
    key: "onSelectedElementClick",
    value: function onSelectedElementClick(e) {
      var xpath = this.getXPathForElement(e.target, true);

      if (!xpath || this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      this.selectModeApply(e.target);
    }
  }, {
    key: "selectModeApply",
    value: function selectModeApply() {
      var _this3 = this;

      var element = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var currentElement = this.currentElements.length > 0 ? this.currentElements[this.currentElements.length - 1] : element;

      if (!currentElement) {
        return;
      }

      this.removeOverlay();
      var currentElementXpath = this.getXPathForElement(currentElement);
      this.data[this.dataKey] = currentElementXpath; // Clear selection

      if (this.data[this.dataKey]) {
        var xpath = this.data[this.dataKey];
        this.removeSelectionInnerByXPath(xpath);
      }

      if (this.state === 'active') {
        this.selectModeToggle();
      }

      this.selectionModeDestroy();

      if (this.dataKey === 'source') {
        this.parentElement = currentElement;
        this.createSelectionOptions(currentElementXpath);
      } else {
        this.highlightElement();
        currentElement.classList.add('twv-selected-success');
        var index = this.components.findIndex(function (item) {
          return item.name === _this3.dataKey;
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
     * @param {boolean} reset
     * @param {boolean} resetData
     */

  }, {
    key: "selectionModeDestroy",
    value: function selectionModeDestroy() {
      var reset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var resetData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      if (document.querySelector('.twv-info')) {
        this.removeEl(document.querySelector('.twv-info'));
      }

      var elements = Array.from(document.querySelectorAll('.twv-selected'));
      elements.forEach(function (element) {
        element.classList.remove('twv-selected');
        element.style.boxShadow = '';
      });

      if (reset) {
        if (resetData) {
          this.data = {};
        }

        this.currentElements = [];
        this.components = [];
        var buttonStart = this.container.querySelector('.twv-button-start-select'); // Remove options

        buttonStart.parentNode.classList.remove('twv-block-active-status-active');
        this.container.querySelector('.twv-inner').innerHTML = '';
        this.removeOverlay(); // Remove selection of parent element

        var elementSelected = document.querySelector('.twv-selected-element');

        if (elementSelected) {
          elementSelected.contentEditable = false;

          if (elementSelected.dataset.twvContent) {
            elementSelected.innerHTML = elementSelected.dataset.twvContent;
            elementSelected.dataset.twvContent = '';
          }

          elementSelected.classList.remove('twv-selected-element');
          elementSelected.style.transform = '';
          elementSelected.style.transition = '';
          this.setToParents(elementSelected, {
            transform: '',
            transition: ''
          });
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
        currentElement.style.boxShadow = '';
        this.currentElements.push(currentElement.parentNode);
        this.updateXPathInfo(currentElement.parentNode);
        currentElement.parentNode.classList.add('twv-selected');
        this.displayPadding(currentElement.parentNode);
      } else {
        currentElement.classList.remove('twv-selected');
        currentElement.style.boxShadow = '';
        this.currentElements.splice(this.currentElements.length - 1, 1);
        currentElement = this.currentElements.length > 0 ? this.currentElements[this.currentElements.length - 1] : e.target;
        this.updateXPathInfo(currentElement);
        currentElement.classList.add('twv-selected');
        this.displayPadding(currentElement);
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
      this.removeOverlay();
      var element = this.getElementByXPath(xpath);

      if (!element) {
        return false;
      }

      this.highlightElement();

      if (element.dataset.twvTitle) {
        element.setAttribute('title', element.dataset.twvTitle);
      } else {
        element.removeAttribute('title');
      }

      element.classList.remove('twv-selected-success');
      return true;
    }
    /**
     * Add overlay for element
     * @param element
     * @param targetClassName
     */

  }, {
    key: "highlightElement",
    value: function highlightElement() {
      var element = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var targetClassName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'twv-selected-element';

      if (!element) {
        element = this.parentElement;
      }

      if (!element || element.tagName === 'BODY' || document.querySelector('.twv-back-overlay')) {
        return;
      }

      element.classList.add(targetClassName);
      var compStyles = window.getComputedStyle(element);
      var position = compStyles.getPropertyValue('position');
      var backgroundColor = compStyles.getPropertyValue('background-color');

      if (position === 'static') {
        element.style.position = 'relative';
      }

      if (['rgba(0, 0, 0, 0)', 'transparent'].indexOf(backgroundColor) > -1) {// element.style.backgroundColor = '#fff';
      }

      element.style.transform = 'none';
      element.style.transition = 'none';
      this.setToParents(element, {
        transform: 'none',
        transition: 'none'
      });
      var backgroundOverlay = document.createElement(element.tagName === 'LI' ? 'li' : 'div');
      backgroundOverlay.className = 'twv-back-overlay';
      this.insertBefore(backgroundOverlay, element);
    }
    /**
     * Remove overlay
     */

  }, {
    key: "removeOverlay",
    value: function removeOverlay() {
      if (document.querySelector('.twv-back-overlay')) {
        this.removeEl(document.querySelector('.twv-back-overlay'));
      }
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
      if (!element.parentNode) return '';
      var ix = 0;
      var siblings = element.parentNode.childNodes;

      for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];

        if (sibling === element) {
          return this.getXPathForElement(element.parentNode, getAttributes) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']' + (getAttributes ? this.getXpathElementAttributes(element) : '');
        }

        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === element.tagName) ix++;
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
      var parentEl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.document;
      var result = document.evaluate(xpath, parentEl, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    }
  }, {
    key: "createContainer",
    value: function createContainer() {
      var _this4 = this;

      var containerEl = document.createElement('div');
      containerEl.id = 'twig-visual-container';
      containerEl.className = 'twig-visual-container twv-panel-right';
      containerEl.innerHTML = "\n        <div class=\"twv-panel-header\">\n            <div class=\"twv-panel-header-buttons\">\n                <button class=\"twv-btn twv-btn-sm twv-ml-1 twv-button-undo\" type=\"button\" title=\"\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435\">\n                    <i class=\"twv-icon-undo\"></i>\n                </button>\n                <button class=\"twv-btn twv-btn-sm twv-ml-1 twv-button-execute-batch\" type=\"button\" title=\"\u0412\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u044C \u043F\u0430\u043A\u0435\u0442 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0439\" style=\"display: none;\">\n                    <i class=\"twv-icon-format_list_bulleted\"></i>\n                    <span></span>\n                </button>\n            </div>\n            <button class=\"twv-btn twv-btn-sm twv-mr-1 twv-button-panel-left\" type=\"button\" title=\"\u041F\u0435\u0440\u0435\u0434\u0432\u0438\u043D\u0443\u0442\u044C \u0432\u043B\u0435\u0432\u043E\">\n                <i class=\"twv-icon-arrow_back\"></i>\n            </button>\n            <button class=\"twv-btn twv-btn-sm twv-button-panel-right\" type=\"button\" title=\"\u041F\u0435\u0440\u0435\u0434\u0432\u0438\u043D\u0443\u0442\u044C \u0432\u043F\u0440\u0430\u0432\u043E\">\n                <i class=\"twv-icon-arrow_forward\"></i>\n            </button>\n        </div>\n        <div class=\"twv-mb-2\">\n            <button type=\"button\" class=\"twv-btn twv-btn-block twv-button-new-theme\">\n                <i class=\"twv-icon-add\"></i>\n                \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u0442\u0435\u043C\u0443\n            </button>\n        </div>\n        <div class=\"twv-mb-2\">\n            <button type=\"button\" class=\"twv-btn twv-btn-block twv-button-new-template\">\n                <i class=\"twv-icon-add\"></i>\n                \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D\n            </button>\n        </div>\n        <div class=\"twv-mb-3\">\n            <button type=\"button\" class=\"twv-btn twv-btn-primary twv-btn-block twv-button-start-select\">\n                <i class=\"twv-icon-center_focus_strong\"></i>\n                \u0411\u043B\u043E\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430\n            </button>\n        </div>\n        <div class=\"twv-inner-wrapper\">\n            <div class=\"twv-inner\"></div>\n        </div>\n        ";
      document.body.appendChild(containerEl);
      containerEl.querySelector('.twv-button-panel-left').addEventListener('click', function (e) {
        e.preventDefault();

        _this4.panelMove('left');
      });
      containerEl.querySelector('.twv-button-panel-right').addEventListener('click', function (e) {
        e.preventDefault();

        _this4.panelMove('right');
      });
      containerEl.querySelector('.twv-button-execute-batch').addEventListener('click', function (e) {
        e.preventDefault();

        _this4.executeActionBatch();
      });
      containerEl.querySelector('.twv-button-undo').addEventListener('click', function (e) {
        e.preventDefault();

        _this4.restoreFromTemplateCopyA();
      });
      return containerEl;
    }
  }, {
    key: "panelMove",
    value: function panelMove(direction) {
      var newClassName = "twv-panel-".concat(direction);

      if (this.container.classList.contains(newClassName)) {
        this.container.classList.add('twv-panel-hidden');
        this.setCookie('twv-panel-class-name', this.container.className);
        return;
      } else if (this.container.classList.contains('twv-panel-hidden')) {
        this.container.classList.remove('twv-panel-hidden');
        this.setCookie('twv-panel-class-name', this.container.className);
        return;
      }

      this.container.classList.remove('twv-panel-' + (direction === 'left' ? 'right' : 'left'));
      this.container.classList.add(newClassName);
      this.setCookie('twv-panel-class-name', this.container.className);
    }
    /**
     * Change block type
     * @param parentElement
     * @param typeValue
     */

  }, {
    key: "onBlockUiTypeChange",
    value: function onBlockUiTypeChange(parentElement, typeValue) {
      var _this5 = this;

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
          delete _this5.data[key];
        }
      });
      var div = document.createElement('div');
      var optionsHTML = '';
      div.className = 'twv-pt-1 twv-mb-3';
      var opt = this.options.uiOptions[typeValue];
      this.components = opt.components;
      this.components.forEach(function (cmp) {
        var d = document.createElement('div');
        d.className = '';

        switch (cmp.type) {
          case 'elementSelect':
            d.innerHTML = "<div class=\"twv-mb-2\">\n                        <button data-twv-key=\"".concat(cmp.name, "\" class=\"twv-btn twv-btn-block twv-text-overflow\">").concat(cmp.title, "</button>\n                    </div>\n                    ");
            d.querySelector('button').addEventListener('click', function (e) {
              e.preventDefault();

              if (_this5.state === 'active') {
                return;
              }

              e.target.setAttribute('disabled', 'disabled');

              _this5.selectModeToggle(parentElement, cmp.name, false);
            });
            div.appendChild(d);
            break;

          case 'text':
            var value = '';

            if (cmp.styleName) {
              var compStyles = window.getComputedStyle(_this5.parentElement);

              if (compStyles[cmp.styleName]) {
                value = compStyles[cmp.styleName];
              }
            }

            d.innerHTML = "\n                    <div class=\"twv-mb-2\">\n                        <label class=\"twv-display-block twv-mb-1\" for=\"tww-field-option-".concat(cmp.name, "\">").concat(cmp.title, "</label>\n                        <input type=\"text\" id=\"tww-field-option-").concat(cmp.name, "\" class=\"twv-form-control\" name=\"").concat(cmp.name, "\" value=\"").concat(value, "\">\n                    </div>\n                    ");
            div.appendChild(d);
            break;

          case 'checkbox':
            d.innerHTML = "\n                    <div class=\"twv-mb-2\">\n                        <input type=\"checkbox\" id=\"tww-field-option-".concat(cmp.name, "\" name=\"").concat(cmp.name, "\" value=\"1\">\n                        <label class=\"twv-display-inline twv-small twv-ml-1\" for=\"tww-field-option-").concat(cmp.name, "\">").concat(cmp.title, "</label>\n                    </div>\n                    ");
            div.appendChild(d);
            break;

          case 'pageField':
            optionsHTML = '';

            _this5.options.pageFields.forEach(function (pageField) {
              optionsHTML += "<option value=\"".concat(pageField.name, "\" data-type=\"").concat(pageField.type, "\">").concat(pageField.name, " - ").concat(pageField.type, "</option>");
            });

            d.innerHTML = "\n                    <div class=\"twv-mb-3\">\n                        <label class=\"twv-display-block twv-mb-1\" for=\"tww-field-option-".concat(cmp.name, "\">").concat(cmp.title, "</label>\n                        <select id=\"tww-field-option-").concat(cmp.type, "\" class=\"twv-custom-select\" name=\"fieldName\">\n                            ").concat(optionsHTML, "\n                        </select>\n                    </div>\n                    ");
            div.appendChild(d);

            var onFieldSelectChange = function onFieldSelectChange(value, type) {
              var keyFieldEl = componentsContainer.querySelector('input[name="key"]');

              if (keyFieldEl) {
                var textFieldBlockEl = keyFieldEl.parentNode;
                textFieldBlockEl.style.display = ['object', 'array'].indexOf(type) > -1 ? 'block' : 'none';

                if (['object', 'array'].indexOf(type) === -1) {
                  keyFieldEl.value = '';
                }
              }
            };

            d.querySelector('select').addEventListener('change', function (e) {
              var selectEl = e.target;
              var selectedOption = selectEl.options[selectEl.selectedIndex];
              onFieldSelectChange(selectEl.value, selectedOption.dataset.type);
            });
            setTimeout(function () {
              onFieldSelectChange(d.querySelector('select').value, d.querySelector('select').querySelector('option').dataset.type);
            }, 1);
            break;

          case 'include':
            optionsHTML = '';

            _this5.showLoading(true);

            _this5.request("/twigvisual/includes", {}, function (res) {
              if (res.templates) {
                res.templates.forEach(function (templateName) {
                  optionsHTML += "<option value=\"".concat(templateName, "\">").concat(templateName, "</option>");
                });
                d.querySelector('select').innerHTML = optionsHTML;
              }

              _this5.showLoading(false);
            }, function (err) {
              _this5.addAlertMessage(err.error || err);

              _this5.showLoading(false);
            });

            d.innerHTML = "\n                    <div class=\"twv-mb-3\">\n                        <label class=\"twv-display-block twv-mb-1\" for=\"tww-field-option-".concat(cmp.name, "\">").concat(cmp.title, "</label>\n                        <select id=\"tww-field-option-").concat(cmp.type, "\" class=\"twv-custom-select\" name=\"").concat(cmp.name, "\">\n                            ").concat(optionsHTML, "\n                        </select>\n                    </div>\n                    ");
            div.appendChild(d);
            break;
        }
      });
      componentsContainer.appendChild(div);
      div = document.createElement('div');
      div.className = 'twv-pt-1 twv-mb-3';
      div.innerHTML = "\n            <button type=\"button\" class=\"twv-btn twv-btn-primary twv-mr-1 twv-button-submit\">\n                <i class=\"twv-icon-done\"></i>\n                \u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C\n            </button>\n            <button type=\"button\" class=\"twv-btn twv-btn twv-button-cancel\" title=\"\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C\">\n                <i class=\"twv-icon-clearclose\"></i>\n            </button>\n        ";
      componentsContainer.appendChild(div);
      var buttonSubmit = this.container.querySelector('.twv-button-submit');
      var buttonCancel = this.container.querySelector('.twv-button-cancel'); // Submit data

      buttonSubmit.addEventListener('click', function (e) {
        e.preventDefault();
        var data = {
          templateName: _this5.options.templateName,
          data: _this5.data
        };
        Array.from(componentsContainer.querySelectorAll('input[type="text"]')).forEach(function (el) {
          data.data[el.name] = el.value;
        });
        Array.from(componentsContainer.querySelectorAll('select')).forEach(function (el) {
          data.data[el.name] = el.value;
        });
        Array.from(componentsContainer.querySelectorAll('input[type="checkbox"]')).forEach(function (el) {
          data.data[el.name] = el.checked;
        });

        if (!_this5.checkRequired(data.data, _this5.components)) {
          return;
        }

        buttonSubmit.setAttribute('disabled', 'disabled');
        buttonCancel.setAttribute('disabled', 'disabled');

        _this5.showLoading(true);

        _this5.request("/twigvisual/insert/".concat(typeValue), data, function (res) {
          if (res.success) {
            _this5.windowReload();
          } else {
            buttonSubmit.removeAttribute('disabled');
            buttonCancel.removeAttribute('disabled');

            _this5.showLoading(false);
          }
        }, function (err) {
          _this5.addAlertMessage(err.error || err);

          buttonSubmit.removeAttribute('disabled');
          buttonCancel.removeAttribute('disabled');

          _this5.showLoading(false);
        }, 'POST');
      }); // Cancel

      buttonCancel.addEventListener('click', function (e) {
        e.preventDefault();

        var selectEl = _this5.container.querySelector('.twv-ui-element-select > select');

        var elementSelected = document.querySelector('.twv-selected-element');

        if (document.querySelector('.twv-info')) {
          _this5.removeEl(document.querySelector('.twv-info'));
        }

        if (_this5.state === 'active') {
          _this5.selectModeToggle();

          return;
        }

        if (selectEl.value) {
          selectEl.value = '';

          _this5.selectionModeDestroy();

          _this5.onBlockUiTypeChange(elementSelected);
        } else {
          _this5.selectionModeDestroy(true);
        }
      });
    }
  }, {
    key: "checkRequired",
    value: function checkRequired(data, components) {
      var result = true;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = components[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var cmp = _step.value;

          if (cmp.required && !data[cmp.name]) {
            result = false;
            alert("\u041F\u043E\u043B\u0435 \"".concat(cmp.title, "\" - \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E."));
            break;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return result;
    }
  }, {
    key: "componentButtonMakeSelected",
    value: function componentButtonMakeSelected(dataKey) {
      var _this6 = this;

      var componentsContainer = this.container.querySelector('.twv-ui-components');

      if (!componentsContainer) {
        return;
      }

      var buttons = Array.from(componentsContainer.querySelectorAll('button'));
      buttons = buttons.filter(function (buttonEl) {
        return buttonEl.dataset.twvKey === dataKey;
      });

      if (buttons.length === 1) {
        this.makeButtonSelected(buttons[0], true, function () {
          var xpath = _this6.data[dataKey] || null;

          if (_this6.removeSelectionInnerByXPath(xpath)) {
            delete _this6.data[dataKey];
            return true;
          }

          return false;
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
      var _this7 = this;

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
      div.innerHTML = "\n        <div class=\"twv-block-active-status twv-block-active-status-active\">\n            <div class=\"twv-block-active-status-active-content\">\n                <div class=\"twv-input-group\">\n                    <span class=\"twv-input-group-text twv-flex-fill\" title=\"".concat(title, "\">\n                        <i class=\"twv-icon-done twv-mr-2 twv-text-success\"></i>\n                        \u0412\u044B\u0431\u0440\u0430\u043D\u043E\n                    </span>\n                    <div class=\"twv-input-group-append\">\n                        <button class=\"twv-btn twv-block-active-status-button-cancel\" title=\"\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C\">\n                            <i class=\"twv-icon-clearclose\"></i>\n                        </button>\n                    </div>\n                </div>\n            </div>\n        </div>\n        ");
      buttonEl.classList.add('twv-block-active-status-inactive-content');
      this.insertAfter(div, buttonEl);
      div.querySelector('.twv-block-active-status').appendChild(buttonEl);
      buttonEl.parentNode.querySelector('.twv-block-active-status-button-cancel').addEventListener('click', function (e) {
        e.preventDefault();

        if (typeof cancelFunc === 'function') {
          cancelFunc() && _this7.makeButtonSelected(buttonEl, false);
        } else {
          _this7.makeButtonSelected(buttonEl, false);
        }
      });
    }
  }, {
    key: "createSelectionOptions",
    value: function createSelectionOptions(xpath) {
      var _this8 = this;

      var elementSelected = this.getElementByXPath(xpath);

      if (!elementSelected) {
        throw new Error('Element for XPath not found.');
      }

      var buttonStart = this.container.querySelector('.twv-button-start-select');
      this.makeButtonSelected(buttonStart, true, function () {
        _this8.selectionModeDestroy(true);

        return true;
      });
      this.container.querySelector('.twv-inner').innerHTML = '';
      var optionsHTML = '';
      Object.keys(this.options.uiOptions).forEach(function (key) {
        optionsHTML += "<option value=\"".concat(key, "\">").concat(_this8.options.uiOptions[key].title, "</option>");
      });
      var xpathEscaped = xpath.replace(/[\"]/g, '&quot;');
      var div = document.createElement('div');
      div.innerHTML = "\n        <b>XPath:</b>\n        <div class=\"twv-p-1 twv-mb-3 twv-small twv-bg-gray\">\n            <div class=\"twv-text-overflow\" title=\"".concat(xpathEscaped, "\">").concat(xpath, "</div>\n        </div>\n        <div class=\"twv-mb-3 twv-nowrap\">\n            <button type=\"button\" class=\"twv-btn twv-mr-1 twv-button-edit-text\" title=\"Edit text content\">\n                <i class=\"twv-icon-createmode_editedit\"></i>\n            </button>\n            <button type=\"button\" class=\"twv-btn twv-mr-1 twv-button-edit-link\" title=\"Edit link\">\n                <i class=\"twv-icon-linkinsert_link\"></i>\n            </button>\n            <button type=\"button\" class=\"twv-btn twv-mr-1 twv-button-replace-image\" title=\"Replace image\">\n                <i class=\"twv-icon-insert_photoimagephoto\"></i>\n            </button>\n            <button type=\"button\" class=\"twv-btn twv-mr-1 twv-button-delete-element\" title=\"Delete element\">\n                <i class=\"twv-icon-delete_outline\"></i>\n            </button>\n            <button type=\"button\" class=\"twv-btn twv-mr-1 twv-button-move-element\" title=\"Move element\">\n                <i class=\"twv-icon-move\"></i>\n            </button>\n            <button type=\"button\" class=\"twv-btn twv-mr-1 twv-button-restore-static\" title=\"Restore static\">\n                <i class=\"twv-icon-cached\"></i>\n            </button>\n        </div>\n        <div class=\"twv-mb-3 twv-ui-element-select\">\n            <select class=\"twv-custom-select\">\n                <option value=\"\">- \u0422\u0438\u043F \u0431\u043B\u043E\u043A\u0430 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 -</option>\n                ").concat(optionsHTML, "\n            </select>\n        </div>\n        <div class=\"twv-mb-3 twv-ui-components\"></div>\n        ");
      this.container.querySelector('.twv-inner').appendChild(div);
      var selectEl = this.container.querySelector('.twv-ui-element-select > select'); // Select UI element type

      selectEl.addEventListener('change', function (e) {
        _this8.onBlockUiTypeChange(elementSelected, e.target.value);
      }); // Button edit text

      this.container.querySelector('.twv-button-edit-text').addEventListener('click', function (e) {
        e.preventDefault();

        _this8.editTextContentInit(elementSelected);
      }); // Button edit link

      this.container.querySelector('.twv-button-edit-link').addEventListener('click', function (e) {
        e.preventDefault();

        _this8.editLinkInit(elementSelected);
      }); // Button delete element

      this.container.querySelector('.twv-button-delete-element').addEventListener('click', function (e) {
        e.preventDefault();

        _this8.deleteElementInit(elementSelected);
      });
      this.container.querySelector('.twv-button-move-element').addEventListener('click', function (e) {
        e.preventDefault();
        e.target.setAttribute('disabled', 'disabled');

        _this8.moveElementInit();
      });
      this.container.querySelector('.twv-button-restore-static').addEventListener('click', function (e) {
        e.preventDefault();

        _this8.restoreStaticInit();
      });
      this.highlightElement(elementSelected, 'twv-selected-element');
    }
    /**
     * Edit text content
     * @param {HTMLElement} elementSelected
     */

  }, {
    key: "editTextContentInit",
    value: function editTextContentInit(elementSelected) {
      var _this9 = this;

      this.clearMessage();
      var componentsContainer = this.container.querySelector('.twv-ui-components');
      var innerHTML = elementSelected.innerHTML;
      componentsContainer.innerHTML = '';
      var div = document.createElement('div');
      div.innerHTML = "\n            <div class=\"twv-mb-3\">\n                <button type=\"button\" class=\"twv-btn twv-btn-primary twv-mr-1 twv-button-submit\">\n                    <i class=\"twv-icon-done\"></i>\n                    \u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C\n                </button>\n                <button type=\"button\" class=\"twv-btn twv-btn twv-mr-1 twv-button-add-list\" title=\"\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432 \u0441\u043F\u0438\u0441\u043E\u043A \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0439\">\n                    <i class=\"twv-icon-format_list_bulleted\"></i>\n                </button>\n                <button type=\"button\" class=\"twv-btn twv-btn twv-button-cancel\" title=\"\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C\">\n                    <i class=\"twv-icon-clearclose\"></i>\n                </button>\n            </div>\n            ";
      componentsContainer.appendChild(div);
      elementSelected.dataset.twvContent = innerHTML;
      elementSelected.contentEditable = true;
      elementSelected.focus();
      var buttonSubmit = this.container.querySelector('.twv-button-submit');
      var buttonCancel = this.container.querySelector('.twv-button-cancel'); // Submit data

      buttonSubmit.addEventListener('click', function (e) {
        e.preventDefault();
        elementSelected.contentEditable = false;
        buttonSubmit.setAttribute('disabled', 'disabled');
        buttonCancel.setAttribute('disabled', 'disabled');

        _this9.showLoading(true);

        _this9.request('/twigvisual/edit_content', {
          templateName: _this9.options.templateName,
          xpath: _this9.data.source,
          textContent: elementSelected.innerHTML
        }, function (res) {
          if (res.success) {
            _this9.windowReload();
          } else {
            buttonSubmit.removeAttribute('disabled');
            buttonCancel.removeAttribute('disabled');

            _this9.showLoading(false);
          }
        }, function (err) {
          _this9.addAlertMessage(err.error || err);

          buttonSubmit.removeAttribute('disabled');
          buttonCancel.removeAttribute('disabled');

          _this9.showLoading(false);
        }, 'POST');
      }); // Add to action list

      this.container.querySelector('.twv-button-add-list').addEventListener('click', function (e) {
        e.preventDefault();

        _this9.addToActionBatch('edit_content', _this9.data.source, {
          value: elementSelected.innerHTML
        });
      }); // Cancel

      buttonCancel.addEventListener('click', function (e) {
        e.preventDefault();
        elementSelected.contentEditable = false;
        componentsContainer.innerHTML = '';
        elementSelected.innerHTML = innerHTML;
      });
    }
    /**
     * Edit link
     * @param {HTMLElement} elementSelected
     */

  }, {
    key: "editLinkInit",
    value: function editLinkInit(elementSelected) {
      var _this10 = this;

      if (elementSelected.tagName.toLowerCase() !== 'a') {
        alert('The selected item must have tag A.');
        return;
      }

      this.clearMessage();
      var componentsContainer = this.container.querySelector('.twv-ui-components');
      var href = elementSelected.getAttribute('href');
      var target = elementSelected.getAttribute('target');
      componentsContainer.innerHTML = '';
      var div = document.createElement('div');
      div.innerHTML = "\n            <div class=\"twv-mb-3\">\n                <label class=\"twv-display-block twv-mb-1\" for=\"tww-field-element-link\">\u0421\u0441\u044B\u043B\u043A\u0430</label>\n                <input type=\"text\" id=\"tww-field-element-link\" class=\"twv-form-control\" value=\"".concat(href, "\">\n            </div>\n            <div class=\"twv-mb-3\">\n                <label class=\"twv-display-block twv-mb-1\" for=\"tww-field-element-link\">Target</label>\n                <select id=\"tww-field-link-target\" class=\"twv-custom-select\">\n                    <option value=\"_self\"").concat(target != '_blank' ? ' selected="selected"' : '', ">_self</option>\n                    <option value=\"_blank\"").concat(target == '_blank' ? ' selected="selected"' : '', ">_blank</option>\n                </select>\n            </div>\n            <div class=\"twv-mb-3\">\n                <button type=\"button\" class=\"twv-btn twv-btn-primary twv-mr-1 twv-button-submit\">\n                    <i class=\"twv-icon-done\"></i>\n                    \u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C\n                </button>\n                <button type=\"button\" class=\"twv-btn twv-btn twv-mr-1 twv-button-add-list\" title=\"\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432 \u0441\u043F\u0438\u0441\u043E\u043A \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0439\">\n                    <i class=\"twv-icon-format_list_bulleted\"></i>\n                </button>\n                <button type=\"button\" class=\"twv-btn twv-btn twv-button-cancel\" title=\"\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C\">\n                    <i class=\"twv-icon-clearclose\"></i>\n                </button>\n            </div>\n            ");
      componentsContainer.appendChild(div);
      var buttonSubmit = this.container.querySelector('.twv-button-submit');
      var buttonCancel = this.container.querySelector('.twv-button-cancel'); // Submit data

      buttonSubmit.addEventListener('click', function (e) {
        e.preventDefault();

        _this10.showLoading(true);

        _this10.request('/twigvisual/edit_link', {
          templateName: _this10.options.templateName,
          xpath: _this10.data.source,
          href: div.querySelector('input[type="text"]').value,
          target: div.querySelector('select').value
        }, function (res) {
          if (res.success) {
            _this10.windowReload();
          } else {
            buttonSubmit.removeAttribute('disabled');
            buttonCancel.removeAttribute('disabled');

            _this10.showLoading(false);
          }
        }, function (err) {
          _this10.addAlertMessage(err.error || err);

          buttonSubmit.removeAttribute('disabled');
          buttonCancel.removeAttribute('disabled');

          _this10.showLoading(false);
        }, 'POST');
      }); // Add to action list

      this.container.querySelector('.twv-button-add-list').addEventListener('click', function (e) {
        e.preventDefault();

        _this10.addToActionBatch('edit_link', _this10.data.source, {
          href: div.querySelector('input[type="text"]').value,
          target: div.querySelector('select').value
        });
      }); // Cancel

      buttonCancel.addEventListener('click', function (e) {
        e.preventDefault();
        elementSelected.contentEditable = false;
        componentsContainer.innerHTML = '';
        elementSelected.setAttribute('href', href);
      });
    }
    /**
     * Delete selected element
     * @param {HTMLElement} elementSelected
     */

  }, {
    key: "deleteElementInit",
    value: function deleteElementInit(elementSelected) {
      var _this11 = this;

      this.clearMessage();
      var componentsContainer = this.container.querySelector('.twv-ui-components');
      var textContent = elementSelected.textContent.trim();
      componentsContainer.innerHTML = '';
      var div = document.createElement('div');
      div.innerHTML = "\n            <div class=\"twv-mb-3\">\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u044D\u043B\u0435\u043C\u0435\u043D\u0442?</div>\n            <div class=\"twv-mb-3\">\n                <button type=\"button\" class=\"twv-btn twv-btn-primary twv-mr-1 twv-button-submit\">\n                    <i class=\"twv-icon-done\"></i>\n                    \u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C\n                </button>\n                <button type=\"button\" class=\"twv-btn twv-btn twv-mr-1 twv-button-add-list\" title=\"\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432 \u0441\u043F\u0438\u0441\u043E\u043A \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0439\">\n                    <i class=\"twv-icon-format_list_bulleted\"></i>\n                </button>\n                <button type=\"button\" class=\"twv-btn twv-btn twv-button-cancel\" title=\"\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C\">\n                    <i class=\"twv-icon-clearclose\"></i>\n                </button>\n            </div>\n            ";
      componentsContainer.appendChild(div);
      var buttonSubmit = this.container.querySelector('.twv-button-submit');
      var buttonCancel = this.container.querySelector('.twv-button-cancel'); // Submit data

      buttonSubmit.addEventListener('click', function (e) {
        e.preventDefault();

        _this11.showLoading(true);

        _this11.request('/twigvisual/delete_element', {
          templateName: _this11.options.templateName,
          xpath: _this11.data.source
        }, function (res) {
          if (res.success) {
            _this11.windowReload();
          } else {
            buttonSubmit.removeAttribute('disabled');
            buttonCancel.removeAttribute('disabled');

            _this11.showLoading(false);
          }
        }, function (err) {
          _this11.addAlertMessage(err.error || err);

          buttonSubmit.removeAttribute('disabled');
          buttonCancel.removeAttribute('disabled');

          _this11.showLoading(false);
        }, 'POST');
      }); // Cancel

      buttonCancel.addEventListener('click', function (e) {
        e.preventDefault();
        componentsContainer.innerHTML = '';
      }); // Add to action list

      this.container.querySelector('.twv-button-add-list').addEventListener('click', function (e) {
        e.preventDefault();

        _this11.addToActionBatch('delete', _this11.data.source);
      });
    }
  }, {
    key: "moveElementInit",
    value: function moveElementInit() {
      var _this12 = this;

      var componentsContainer = this.container.querySelector('.twv-ui-components');
      componentsContainer.innerHTML = '';
      this.selectionModeDestroy(true, false);
      setTimeout(function () {
        _this12.selectModeToggle(document.body, 'moveTarget');
      }, 1);
    }
  }, {
    key: "restoreStaticInit",
    value: function restoreStaticInit() {
      var _this13 = this;

      this.clearMessage();
      var componentsContainer = this.container.querySelector('.twv-ui-components');
      componentsContainer.innerHTML = '';
      var div = document.createElement('div');
      div.innerHTML = "\n            <div class=\"twv-mb-3\">\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0438\u0441\u0445\u043E\u0434\u043D\u043E\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430?</div>\n            <div class=\"twv-mb-3\">\n                <button type=\"button\" class=\"twv-btn twv-btn-primary twv-mr-1 twv-button-submit\">\n                    <i class=\"twv-icon-done\"></i>\n                    \u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C\n                </button>\n                <button type=\"button\" class=\"twv-btn twv-btn twv-button-cancel\" title=\"\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C\">\n                    <i class=\"twv-icon-clearclose\"></i>\n                </button>\n            </div>\n            ";
      componentsContainer.appendChild(div);
      var buttonSubmit = componentsContainer.querySelector('.twv-button-submit');
      var buttonCancel = componentsContainer.querySelector('.twv-button-cancel'); // Submit data

      buttonSubmit.addEventListener('click', function (e) {
        e.preventDefault();

        _this13.showLoading(true);

        _this13.request('/twigvisual/restore_static', {
          templateName: _this13.options.templateName,
          xpath: _this13.data.source
        }, function (res) {
          if (res.success) {
            _this13.windowReload();
          } else {
            buttonSubmit.removeAttribute('disabled');
            buttonCancel.removeAttribute('disabled');

            _this13.showLoading(false);
          }
        }, function (err) {
          _this13.addAlertMessage(err.error || err);

          buttonSubmit.removeAttribute('disabled');
          buttonCancel.removeAttribute('disabled');

          _this13.showLoading(false);
        }, 'POST');
      }); // Cancel

      buttonCancel.addEventListener('click', function (e) {
        e.preventDefault();

        _this13.clearMessage();

        componentsContainer.innerHTML = '';
      });
    }
  }, {
    key: "addNewThemeInit",
    value: function addNewThemeInit() {
      var _this14 = this;

      this.clearMessage();
      var innerContainerEl = this.container.querySelector('.twv-inner');
      innerContainerEl.innerHTML = '';
      var div = document.createElement('div');
      div.innerHTML = "\n        <div class=\"twv-mb-3\">\n            <label class=\"twv-display-block twv-mb-1\" for=\"tww-field-theme-name\">\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0442\u0435\u043C\u044B</label>\n            <input type=\"text\" id=\"tww-field-theme-name\" class=\"twv-form-control\">\n        </div>\n        <div class=\"twv-mb-3\">\n            <label class=\"twv-display-block twv-mb-1\" for=\"tww-field-theme-mainpage\">HTML-\u0444\u0430\u0439\u043B \u0433\u043B\u0430\u0432\u043D\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B</label>\n            <input type=\"text\" id=\"tww-field-theme-mainpage\" class=\"twv-form-control\" value=\"index.html\">\n        </div>\n        <div class=\"twv-mb-3\">\n            <button type=\"button\" class=\"twv-btn twv-btn-primary twv-mr-1 twv-button-submit\">\u0421\u043E\u0437\u0434\u0430\u0442\u044C</button>\n            <button type=\"button\" class=\"twv-btn twv-btn twv-button-cancel\">\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C</button>\n        </div>\n        ";
      innerContainerEl.appendChild(div);
      innerContainerEl.querySelector('button.twv-button-submit').addEventListener('click', function (e) {
        e.preventDefault();
        var fieldThemeEl = document.getElementById('tww-field-theme-name');
        var fieldMainpageEl = document.getElementById('tww-field-theme-mainpage');
        var buttonEl = e.target;

        if (!fieldThemeEl.value || !fieldMainpageEl.value) {
          return;
        }

        _this14.clearMessage();

        _this14.showLoading(true);

        buttonEl.setAttribute('disabled', 'disabled');

        _this14.request('/twigvisual/create', {
          theme: fieldThemeEl.value,
          mainpage: fieldMainpageEl.value
        }, function (res) {
          buttonEl.removeAttribute('disabled');

          _this14.showLoading(false);

          if (res && res.success) {
            innerContainerEl.innerHTML = '';
          }

          if (res.message) {
            _this14.addAlertMessage(res.message, 'success');
          }
        }, function (err) {
          _this14.addAlertMessage(err.error || err);

          buttonEl.removeAttribute('disabled');

          _this14.showLoading(false);
        }, 'POST');
      });
      innerContainerEl.querySelector('button.twv-button-cancel').addEventListener('click', function (e) {
        e.preventDefault();
        innerContainerEl.innerHTML = '';
      });
    }
  }, {
    key: "addNewTemplateInit",
    value: function addNewTemplateInit() {
      var _this15 = this;

      this.clearMessage();
      var innerContainerEl = this.container.querySelector('.twv-inner');
      innerContainerEl.innerHTML = '';
      var optionsHTML = '';
      this.options.templates.forEach(function (templatePath) {
        optionsHTML += "<option value=\"".concat(templatePath, "\">").concat(templatePath, "</option>");
      });
      this.showLoading(true);
      this.request('/twigvisual/html_files', {}, function (res) {
        if (res.files) {
          var html = '';
          res.files.forEach(function (fileName) {
            html += "<option value=\"".concat(fileName, "\">").concat(fileName, "</option>");
          });
          document.getElementById('tww-field-source-file').innerHTML = html;
        }

        _this15.showLoading(false);
      }, function (err) {
        _this15.addAlertMessage(err.error || err);

        _this15.showLoading(false);
      });
      var div = document.createElement('div');
      div.innerHTML = "\n        <div class=\"twv-mb-3\">\n            <label class=\"twv-display-block twv-mb-1\" for=\"tww-field-source-file\">HTML-\u0444\u0430\u0439\u043B</label>\n            <select id=\"tww-field-source-file\" class=\"twv-custom-select\"></select>\n        </div>\n        <div class=\"twv-mb-3\">\n            <label class=\"twv-display-block twv-mb-1\" for=\"tww-field-template-name\">\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u0430</label>\n            <select id=\"tww-field-template-name\" class=\"twv-custom-select\">\n                ".concat(optionsHTML, "\n            </select>\n        </div>\n        <div class=\"twv-mb-3\">\n            <button type=\"button\" class=\"twv-btn twv-btn-primary twv-mr-1 twv-button-submit\">\u0421\u043E\u0437\u0434\u0430\u0442\u044C</button>\n            <button type=\"button\" class=\"twv-btn twv-btn twv-button-cancel\">\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C</button>\n        </div>\n        ");
      innerContainerEl.appendChild(div);
      innerContainerEl.querySelector('button.twv-button-submit').addEventListener('click', function (e) {
        e.preventDefault();
        var fieldFileNameEl = document.getElementById('tww-field-source-file');
        var fieldTemplateNameEl = document.getElementById('tww-field-template-name');
        var buttonEl = e.target;

        if (!fieldFileNameEl.value || !fieldTemplateNameEl.value) {
          return;
        }

        _this15.showLoading(true);

        buttonEl.setAttribute('disabled', 'disabled');

        _this15.request('/twigvisual/create_template', {
          fileName: fieldFileNameEl.value,
          templateName: fieldTemplateNameEl.value
        }, function (res) {
          buttonEl.removeAttribute('disabled');

          _this15.showLoading(false);

          innerContainerEl.innerHTML = '';

          if (res.message) {
            _this15.addAlertMessage(res.message, 'success');
          }
        }, function (err) {
          _this15.addAlertMessage(err.error || err);

          buttonEl.removeAttribute('disabled');

          _this15.showLoading(false);
        }, 'POST');
      });
      innerContainerEl.querySelector('button.twv-button-cancel').addEventListener('click', function (e) {
        e.preventDefault();
        innerContainerEl.innerHTML = '';
      });
    }
    /**
     * Add operation for batch execution
     * @param {string} action
     * @param {string} xpath
     * @param {object} options
     */

  }, {
    key: "addToActionBatch",
    value: function addToActionBatch(action, xpath) {
      var _this16 = this;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      this.actions.push({
        action: action,
        xpath: xpath,
        options: options
      });
      this.selectionModeDestroy(true);
      var buttonEl = this.container.querySelector('.twv-button-execute-batch');
      buttonEl.querySelector('span').textContent = "".concat(this.actions.length);
      buttonEl.style.display = 'inline-block';
      this.actions.forEach(function (action) {
        var element = _this16.getElementByXPath(action.xpath);

        if (element) {
          element.classList.add('twv-selected-success');
        }
      });
    }
    /**
     * Execute actions batch
     */

  }, {
    key: "executeActionBatch",
    value: function executeActionBatch() {
      var _this17 = this;

      if (this.actions.length === 0) {
        return;
      }

      this.showLoading(true);
      this.request('/twigvisual/batch', {
        templateName: this.options.templateName,
        actions: this.actions
      }, function (res) {
        if (res.success) {
          _this17.windowReload();
        }

        _this17.showLoading(false);
      }, function (err) {
        _this17.addAlertMessage(err.error || err);

        _this17.showLoading(false);
      }, 'POST');
    }
  }, {
    key: "restoreFromTemplateCopyA",
    value: function restoreFromTemplateCopyA() {
      var _this18 = this;

      this.showLoading(true);
      this.request('/twigvisual/restore_backup', {
        templateName: this.options.templateName
      }, function (res) {
        if (res.success) {
          _this18.windowReload();
        }

        _this18.showLoading(false);
      }, function (err) {
        _this18.addAlertMessage(err.error || err);

        _this18.showLoading(false);
      }, 'POST');
    }
  }, {
    key: "showLoading",
    value: function showLoading() {
      var enabled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      this.loading = enabled;

      if (enabled) {
        this.container.classList.add('twv-loading');
      } else {
        this.container.classList.remove('twv-loading');
      }
    }
    /**
     * Show message
     * @param message
     * @param type
     */

  }, {
    key: "addAlertMessage",
    value: function addAlertMessage(message) {
      var _this19 = this;

      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'danger';
      clearTimeout(this.timer);
      var innerContainerEl = this.container.querySelector('.twv-inner');

      if (innerContainerEl.querySelector('.twv-alert')) {
        this.removeEl(innerContainerEl.querySelector('.twv-alert'));
      }

      var div = document.createElement('div');
      div.innerHTML = "\n        <div class=\"twv-alert twv-alert-".concat(type, "\">").concat(message, "</div>\n        ");
      innerContainerEl.appendChild(div);
      div.addEventListener('mouseenter', function () {
        clearTimeout(_this19.timer);
      });
      div.addEventListener('mouseleave', function () {
        _this19.timer = setTimeout(_this19.clearMessage.bind(_this19), 4000);
      });
      this.timer = setTimeout(this.clearMessage.bind(this), 4000);
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
     * Display padding of the HTML element
     * @param element
     */

  }, {
    key: "displayPadding",
    value: function displayPadding(element) {
      var compStyles = window.getComputedStyle(element);
      var boxShadow = '0 0 0 2px #007bff';

      if (compStyles['padding-top'] !== '0px') {
        boxShadow += ", inset 0 ".concat(compStyles['padding-top'], " 0 0 rgba(50,168,82,0.15)");
      }

      if (compStyles['padding-bottom'] !== '0px') {
        boxShadow += ", inset 0 -".concat(compStyles['padding-bottom'], " 0 0 rgba(50,168,82,0.15)");
      }

      if (compStyles['padding-left'] !== '0px') {
        boxShadow += ", inset ".concat(compStyles['padding-left'], " 0 0 0 rgba(50,168,82,0.15)");
      }

      if (compStyles['padding-right'] !== '0px') {
        boxShadow += ", inset -".concat(compStyles['padding-right'], " 0 0 0 rgba(50,168,82,0.15)");
      }

      if (boxShadow) {
        element.style.boxShadow = boxShadow;
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
    value: function request(url, data, successFn, failFn) {
      var method = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 'GET';
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
  }, {
    key: "windowReload",
    value: function windowReload() {
      var locationHref = window.location.protocol + '//' + window.location.hostname + window.location.pathname;
      window.location.href = locationHref;
    }
    /**
     * Set styles to parents
     * @param element
     * @param styles
     */

  }, {
    key: "setToParents",
    value: function setToParents(element, styles) {
      if (!element || !element.parentNode || element.tagName === 'BODY' || element.parentNode.tagName === 'BODY') {
        return;
      }

      Object.keys(styles).forEach(function (key) {
        element.parentNode.style[key] = styles[key];
      });

      if (element.tagName !== 'BODY') {
        this.setToParents(element.parentNode, styles);
      }
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
    /**
     * 
     * @param element
     * @param nodeType
     * @param count
     * @returns {AST.HtmlParser2.Node|(() => (Node | null))|ActiveX.IXMLDOMNode|*}
     */

  }, {
    key: "getNodePreviousSiblingByType",
    value: function getNodePreviousSiblingByType(element, nodeType, count) {
      if (element.previousSibling && element.previousSibling.nodeType !== nodeType && count > 0) {
        return this.getNodePreviousSiblingByType(element.previousSibling, nodeType, --count);
      }

      return element.previousSibling;
    }
  }, {
    key: "generateRandomString",
    value: function generateRandomString() {
      var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 8;
      var result = '';
      var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;

      for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }

      return result;
    }
  }, {
    key: "setCookie",
    value: function setCookie(cname, cvalue) {
      var exdays = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 7;
      var d = new Date();
      d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
      var expires = 'expires=' + d.toUTCString();
      document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
    }
  }, {
    key: "getCookie",
    value: function getCookie(cname) {
      var name = cname + '=';
      var decodedCookie = decodeURIComponent(document.cookie);
      var ca = decodedCookie.split(';');

      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];

        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }

        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }

      return '';
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

//# sourceMappingURL=twigvisual.js.map