
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
        const buttonStart = document.createElement('button');
        buttonStart.type = 'button';
        buttonStart.textContent = 'Select';
        buttonStart.addEventListener('click', (e) => {
            e.preventDefault();
            this.selectModeToggle();
        });

        this.container.appendChild(buttonStart);

    }

    selectModeToggle() {
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

    onMouseOver(e) {
        if (e.target.classList.contains('twig-visual-container')
            || e.target.parentNode.classList.contains('twig-visual-container')) {
            return;
        }
        this.currentElements = [];
        e.target.classList.add('twig-visual-selected');
    }

    onMouseOut(e) {
        if (e.target.classList.contains('twig-visual-container')
            || e.target.parentNode.classList.contains('twig-visual-container')) {
            return;
        }
        this.currentElements = [];
        e.target.classList.remove('twig-visual-selected');
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

        console.log('onSelectedElementClick', currentElement);

        this.selectModeToggle();
    }

    onMouseWheel(e) {
        if (e.target.classList.contains('twig-visual-container')
            || e.target.parentNode.classList.contains('twig-visual-container')) {
            return;
        }
        let currentElement = this.currentElements.length > 0
            ? this.currentElements[this.currentElements.length - 1]
            : e.target;
        if (e.deltaY < 0) {
            currentElement.classList.remove('twig-visual-selected');
            this.currentElements.push(currentElement.parentNode);
            currentElement.parentNode.classList.add('twig-visual-selected');
        } else {
            currentElement.classList.remove('twig-visual-selected');
            this.currentElements.splice(this.currentElements.length - 1, 1);
            currentElement = this.currentElements.length > 0
                ? this.currentElements[this.currentElements.length - 1]
                : e.target;
            currentElement.classList.add('twig-visual-selected');
        }
    }

    createContainer() {
        const containerEl = document.createElement('div');
        containerEl.id = 'twig-visual-container';
        containerEl.className = 'twig-visual-container';
        document.body.appendChild(containerEl);
        return containerEl;
    }
}

let twigVisual;

TwigVisual.onReady(() => {
    twigVisual = new TwigVisual();
});
