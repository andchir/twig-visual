
class TwigVisual {

    constructor() {
        this.container = this.createContainer();
        this.state = 'inactive';

        this.listenerOnMouseOver = this.onMouseOver.bind(this);
        this.listenerOnMouseOut = this.onMouseOut.bind(this);
        this.listenerOnMouseWheel = this.onMouseWheel.bind(this);
        this.listenerOnMouseClick = this.onSelectedElementClick.bind(this);
        this.currentElements = [];

        this.init();
    }

    static onReady(cb) {
        if (document.readyState !== 'loading') {
            cb();
        } else {
            document.addEventListener('DOMContentLoaded', cb);
        }
    };

    init() {

        // Start button
        const buttonStart = this.container.querySelector('.twv-button-start-select');
        buttonStart.addEventListener('click', (e) => {
            e.preventDefault();
            this.selectModeToggle();
        });
    }

    selectModeToggle() {
        if (this.state === 'inactive') {
            document.addEventListener('mouseover', this.listenerOnMouseOver);
            document.addEventListener('mouseout', this.listenerOnMouseOut);
            document.addEventListener('wheel', this.listenerOnMouseWheel, {passive: false});
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

    onMouseOver(e) {
        if (e.target.classList.contains('twig-visual-container')
            || (e.target.parentNode.classList && e.target.parentNode.classList.contains('twig-visual-container'))) {
            return;
        }
        this.currentElements = [];
        this.updateXPathInfo(e.target);
        e.target.classList.add('twig-visual-selected');
    }

    onMouseOut(e) {
        if (e.target.classList.contains('twig-visual-container')
            || (e.target.parentNode.classList && e.target.parentNode.classList.contains('twig-visual-container'))) {
            return;
        }
        this.currentElements = [];
        const elements = Array.from(document.querySelectorAll('.twig-visual-selected'));
        elements.forEach((element) => {
            element.classList.remove('twig-visual-selected');
        });
    }

    onSelectedElementClick(e) {
        if (e.target.classList.contains('twig-visual-container')
            || e.target.parentNode.classList.contains('twig-visual-container')) {
            return;
        }
        e.preventDefault();
        let currentElement = this.currentElements.length > 0
            ? this.currentElements[this.currentElements.length - 1]
            : e.target;
        this.currentElements = [];
        currentElement.classList.remove('twig-visual-selected');

        this.updateXPathInfo(currentElement);
        const xpath = this.getXPathForElement(currentElement);

        console.log('onSelectedElementClick', currentElement, xpath);
        console.log(this.getElementByXPath(xpath));

        this.selectModeToggle();
    }

    onMouseWheel(e) {
        if (e.target.classList.contains('twig-visual-container')
            || e.target.parentNode.classList.contains('twig-visual-container')) {
            return;
        }
        e.preventDefault();
        let currentElement = this.currentElements.length > 0
            ? this.currentElements[this.currentElements.length - 1]
            : e.target;
        if (e.deltaY < 0) {
            currentElement.classList.remove('twig-visual-selected');
            this.currentElements.push(currentElement.parentNode);

            this.updateXPathInfo(currentElement.parentNode);

            currentElement.parentNode.classList.add('twig-visual-selected');
        } else {
            currentElement.classList.remove('twig-visual-selected');
            this.currentElements.splice(this.currentElements.length - 1, 1);
            currentElement = this.currentElements.length > 0
                ? this.currentElements[this.currentElements.length - 1]
                : e.target;

            this.updateXPathInfo(currentElement);

            currentElement.classList.add('twig-visual-selected');
        }
    }

    updateXPathInfo(element) {
        this.container.querySelector('.twv-selection-info').style.display = 'block';
        this.container.querySelector('.twv-selection-info').innerHTML = '<div><b>XPath:</b></div><div>' + this.getXPathForElement(element) + '</div>';
    }

    getXPathForElement(element) {
        if (element.id !== '')
            return 'id("' + element.id + '")';
        if (element.tagName === 'HTML')
            return ('/HTML[1]').toLowerCase();
        if (element === document.body)
            return ('/HTML[1]/BODY[1]').toLowerCase();

        let ix = 0;
        const siblings = element.parentNode.childNodes;
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === element) {
                return this.getXPathForElement(element.parentNode) + '/'
                    + element.tagName.toLowerCase() + '[' + (ix + 1) + ']'
                    + this.getXpathElementAttributes(element);
            }
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
                ix++;
        }
    }

    getXpathElementAttributes(element) {
        if (element.hasAttribute('id')) {
            return `id("${element.id}")`;
        } else if(element.hasAttribute('class') && element.getAttribute('class')) {
            return `[@class="${element.getAttribute('class')}"]`;
        }
        return  '';
    }

    getElementByXPath(xpath) {
        return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    createContainer() {
        const containerEl = document.createElement('div');
        containerEl.id = 'twig-visual-container';
        containerEl.className = 'twig-visual-container';
        containerEl.innerHTML = `
<button type="button" class="twv-btn twv-btn-block twv-mb-3 twv-button-start-select">Select</button>
<div class="twv-small twv-selection-info" style="display: none;"></div>
`;
        document.body.appendChild(containerEl);
        return containerEl;
    }
}

let twigVisual;

TwigVisual.onReady(() => {
    twigVisual = new TwigVisual();
});
