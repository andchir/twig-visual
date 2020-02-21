
class TwigVisual {

    constructor(options) {
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
                    components: [
                        {
                            name: "totalPrice", title: "Общая цена", xpath: ""
                        },
                        {
                            name: "totalCount", title: "Общее количество", xpath: ""
                        },
                        {
                            name: "lickCheckout", title: "Ссылка на оформление", xpath: ""
                        },
                        {
                            name: "buttonClean", title: "Кнопка очистки", xpath: ""
                        }
                    ]
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
            this.container.style.display = 'none';
            document.addEventListener('mouseover', this.listenerOnMouseOver);
            document.addEventListener('mouseout', this.listenerOnMouseOut);
            document.addEventListener('wheel', this.listenerOnMouseWheel, {passive: false});
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

    onMouseOver(e) {
        if (e.target.classList.contains('twig-visual-container')
            || (e.target.parentNode.classList && e.target.parentNode.classList.contains('twig-visual-container'))) {
            return;
        }
        this.currentElements = [];
        this.updateXPathInfo(e.target);
        e.target.classList.add('twv-selected');
    }

    onMouseOut(e) {
        if (e.target.classList.contains('twig-visual-container')
            || (e.target.parentNode.classList && e.target.parentNode.classList.contains('twig-visual-container'))) {
            return;
        }
        this.currentElements = [];
        const elements = Array.from(document.querySelectorAll('.twv-selected'));
        elements.forEach((element) => {
            element.classList.remove('twv-selected');
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
        currentElement.classList.remove('twv-selected');

        if (document.querySelector('.twv-info')) {
            this.removeEl(document.querySelector('.twv-info'));
        }
        const xpath = this.getXPathForElement(currentElement);
        this.createSelectionOptions(xpath);

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
            currentElement.classList.remove('twv-selected');
            this.currentElements.push(currentElement.parentNode);

            this.updateXPathInfo(currentElement.parentNode);

            currentElement.parentNode.classList.add('twv-selected');
        } else {
            currentElement.classList.remove('twv-selected');
            this.currentElements.splice(this.currentElements.length - 1, 1);
            currentElement = this.currentElements.length > 0
                ? this.currentElements[this.currentElements.length - 1]
                : e.target;

            this.updateXPathInfo(currentElement);

            currentElement.classList.add('twv-selected');
        }
    }

    updateXPathInfo(element) {
        let div = document.querySelector('.twv-info');
        if (!div) {
            div = document.createElement('div');
            div.className = 'twv-info small';
            document.body.appendChild(div);
        }
        div.style.display = 'block';
        div.innerHTML = '<div>' + this.getXPathForElement(element) + '</div>';
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
<div class="twv-inner"></div>
`;
        document.body.appendChild(containerEl);
        return containerEl;
    }

    createSelectionOptions(xpath) {
        const elementSelected = this.getElementByXPath(xpath);
        if (!elementSelected) {
            throw new Error('Element for XPath not found.');
        }

        this.container.querySelector('.twv-inner').innerHTML = '';

        const xpathEscaped = xpath.replace(/[\"]/g, '&quot;');
        const div = document.createElement('div');
        div.innerHTML = `<div class="twv-mb-3 twv-ui-element-select">
        <select class="twv-select">
        <option value="">- Элемент интерфейса -</option>
        <option value="field">Поле контента</option>
        <option value="photogallery">Фото-галерея</option>
        <option value="menu">Меню</option>
        <option value="breadcrumbs">Хлебные кношки</option>
        <option value="shopping-cart">Корзина товаров</option>
        <option value="products-list">Избранные товары</option>
        <option value="comments">Отзывы</option>
</select>
</div>
<b>XPath:</b>
<div class="twv-p-1 twv-mb-3 twv-small twv-bg-gray">
    <div class="twv-text-overflow" title="${xpathEscaped}">${xpath}</div>
</div>
<div class="twv-ui-components"></div>
        `;
        this.container.querySelector('.twv-inner').appendChild(div);

        const componentsContainer = this.container.querySelector('.twv-ui-components');

        this.container.querySelector('.twv-ui-element-select').addEventListener('change', (e) => {
            componentsContainer.innerHTML = '';
            if (!this.options.uiOptions[e.target.value]) {
                return;
            }

            const opt = this.options.uiOptions[e.target.value];
            opt.components.forEach((cmp) => {

                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'twv-btn twv-mb-2';
                button.textContent = cmp.title;

                componentsContainer.appendChild(button);
            });

            console.log(e.target.value, this.options.uiOptions[e.target.value]);

        });

        const compStyles = window.getComputedStyle(elementSelected);
        const position = compStyles.getPropertyValue('position');

        console.log(xpath, elementSelected, position);

    }

    removeEl(el) {
        el.parentNode.removeChild(el);
    };
}

let twigVisual;

TwigVisual.onReady(() => {
    twigVisual = new TwigVisual();
});
