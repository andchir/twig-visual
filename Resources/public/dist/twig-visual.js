"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var TwigVisual =
/*#__PURE__*/
function () {
  function TwigVisual() {
    _classCallCheck(this, TwigVisual);

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
        // this.container.style.display = 'none';
        document.addEventListener('mouseover', this.listenerOnMouseOver);
        document.addEventListener('mouseout', this.listenerOnMouseOut);
        document.addEventListener('wheel', this.listenerOnMouseWheel, {
          passive: false
        });
        document.addEventListener('click', this.listenerOnMouseClick);
        this.state = 'active';
      } else {
        // this.container.style.display = 'block';
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
      e.target.classList.add('twig-visual-selected');
    }
  }, {
    key: "onMouseOut",
    value: function onMouseOut(e) {
      if (e.target.classList.contains('twig-visual-container') || e.target.parentNode.classList && e.target.parentNode.classList.contains('twig-visual-container')) {
        return;
      }

      this.currentElements = [];
      var elements = Array.from(document.querySelectorAll('.twig-visual-selected'));
      elements.forEach(function (element) {
        element.classList.remove('twig-visual-selected');
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
      currentElement.classList.remove('twig-visual-selected');
      this.updateXPathInfo(currentElement);
      var xpath = this.getXPathForElement(currentElement);
      console.log('onSelectedElementClick', currentElement, xpath);
      console.log(this.getElementByXPath(xpath));
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
        currentElement.classList.remove('twig-visual-selected');
        this.currentElements.push(currentElement.parentNode);
        this.updateXPathInfo(currentElement.parentNode);
        currentElement.parentNode.classList.add('twig-visual-selected');
      } else {
        currentElement.classList.remove('twig-visual-selected');
        this.currentElements.splice(this.currentElements.length - 1, 1);
        currentElement = this.currentElements.length > 0 ? this.currentElements[this.currentElements.length - 1] : e.target;
        this.updateXPathInfo(currentElement);
        currentElement.classList.add('twig-visual-selected');
      }
    }
  }, {
    key: "updateXPathInfo",
    value: function updateXPathInfo(element) {
      this.container.querySelector('.twv-selection-info').style.display = 'block';
      this.container.querySelector('.twv-selection-info').innerHTML = '<div><b>XPath:</b></div><div>' + this.getXPathForElement(element) + '</div>';
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
      containerEl.innerHTML = "\n<button type=\"button\" class=\"twv-btn twv-btn-block twv-mb-3 twv-button-start-select\">Select</button>\n<div class=\"twv-small twv-selection-info\" style=\"display: none;\"></div>\n";
      document.body.appendChild(containerEl);
      return containerEl;
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