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
      var buttonStart = document.createElement('button');
      buttonStart.type = 'button';
      buttonStart.textContent = 'Select';
      buttonStart.addEventListener('click', function (e) {
        e.preventDefault();

        _this.selectModeToggle();
      });
      this.container.appendChild(buttonStart);
    }
  }, {
    key: "selectModeToggle",
    value: function selectModeToggle() {
      if (this.state === 'inactive') {
        document.addEventListener('mouseover', this.listenerOnMouseOver);
        document.addEventListener('mouseout', this.listenerOnMouseOut);
        document.addEventListener('wheel', this.listenerOnMouseWheel);
        document.addEventListener('click', this.listenerOnMouseClick);
        this.state = 'active';
      } else {
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
      if (e.target.classList.contains('twig-visual-container') || e.target.parentNode.classList.contains('twig-visual-container')) {
        return;
      }

      this.currentElements = [];
      e.target.classList.add('twig-visual-selected');
    }
  }, {
    key: "onMouseOut",
    value: function onMouseOut(e) {
      if (e.target.classList.contains('twig-visual-container') || e.target.parentNode.classList.contains('twig-visual-container')) {
        return;
      }

      this.currentElements = [];
      e.target.classList.remove('twig-visual-selected');
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
      console.log('onSelectedElementClick', currentElement);
      this.selectModeToggle();
    }
  }, {
    key: "onMouseWheel",
    value: function onMouseWheel(e) {
      if (e.target.classList.contains('twig-visual-container') || e.target.parentNode.classList.contains('twig-visual-container')) {
        return;
      }

      var currentElement = this.currentElements.length > 0 ? this.currentElements[this.currentElements.length - 1] : e.target;

      if (e.deltaY < 0) {
        currentElement.classList.remove('twig-visual-selected');
        this.currentElements.push(currentElement.parentNode);
        currentElement.parentNode.classList.add('twig-visual-selected');
      } else {
        currentElement.classList.remove('twig-visual-selected');
        this.currentElements.splice(this.currentElements.length - 1, 1);
        currentElement = this.currentElements.length > 0 ? this.currentElements[this.currentElements.length - 1] : e.target;
        currentElement.classList.add('twig-visual-selected');
      }
    }
  }, {
    key: "createContainer",
    value: function createContainer() {
      var containerEl = document.createElement('div');
      containerEl.id = 'twig-visual-container';
      containerEl.className = 'twig-visual-container';
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