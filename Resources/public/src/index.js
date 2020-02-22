
class TwigVisual {

    constructor(options) {
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
        
        buttonStart.parentNode.querySelector('.twv-block-active-status-button-cancel').addEventListener('click', (e) => {
            e.preventDefault();
            this.selectionCancel();
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
        if (this.getXPathForElement(e.target).indexOf('twig-visual-container') > -1) {
            return;
        }
        this.currentElements = [];
        this.updateXPathInfo(e.target);
        e.target.classList.add('twv-selected');
    }

    onMouseOut(e) {
        if (this.getXPathForElement(e.target).indexOf('twig-visual-container') > -1) {
            return;
        }
        this.currentElements = [];
        const elements = Array.from(document.querySelectorAll('.twv-selected'));
        elements.forEach((element) => {
            element.classList.remove('twv-selected');
        });
    }

    onSelectedElementClick(e) {
        if (this.getXPathForElement(e.target).indexOf('twig-visual-container') > -1) {
            return;
        }
        e.preventDefault();

        this.selectModeToggle();
        
        let currentElement = this.currentElements.length > 0
            ? this.currentElements[this.currentElements.length - 1]
            : e.target;
        this.selectionCancel(currentElement);
        
        const xpath = this.getXPathForElement(currentElement);
        this.createSelectionOptions(xpath);
    }
    
    selectionCancel(currentElement = null) {
        if (!currentElement && this.currentElements.length > 0) {
            currentElement = this.currentElements[this.currentElements.length - 1];
        }
        this.data = {};
        this.currentElements = [];
        currentElement && currentElement.classList.remove('twv-selected');

        this.state = 'inactive';
        const buttonStart = this.container.querySelector('.twv-button-start-select');
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

    onMouseWheel(e) {
        if (this.getXPathForElement(e.target).indexOf('twig-visual-container') > -1) {
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
        const xpath = this.getXPathForElement(element);
        if (xpath.indexOf('twig-visual-container') > -1) {
            return;
        }
        let div = document.querySelector('.twv-info');
        if (!div) {
            div = document.createElement('div');
            div.className = 'twv-info small';
            document.body.appendChild(div);
        }
        div.style.display = 'block';
        div.innerHTML = `<div>${xpath}</div>`;
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
        containerEl.className = 'twig-visual-container twv-panel-right';
        containerEl.innerHTML = `
<div class="twv-panel-header">
    <button class="twv-btn twv-btn-sm twv-mr-1 twv-button-panel-left" type="button" title="Передвинуть влево">
        <i class="twv-icon-arrow_back"></i>
    </button>
    <button class="twv-btn twv-btn-sm twv-button-panel-right" type="button" title="Передвинуть вправо">
        <i class="twv-icon-arrow_forward"></i>
    </button>
</div>
<div class="twv-block-active-status twv-mb-3">
    <button type="button" class="twv-btn twv-btn-primary twv-btn-block twv-mb-3 twv-block-active-status-inactive-content twv-button-start-select">
        <i class="twv-icon-center_focus_strong"></i>
        Выбрать элемент
    </button>
    <div class="twv-block-active-status-active-content">
        <div class="twv-input-group">
            <span class="twv-input-group-text twv-flex-fill" title="Элемент интерфейса">
                <i class="twv-icon-done twv-mr-2 twv-text-success"></i>
                Выбрано
            </span>
            <div class="twv-input-group-append">
                <button class="twv-btn twv-block-active-status-button-cancel" title="Отменить">
                    <i class="twv-icon-clearclose"></i>
                </button>
            </div>
        </div>
    </div>
</div>
<div class="twv-inner"></div>
`;
        document.body.appendChild(containerEl);
        
        containerEl.querySelector('.twv-button-panel-left').addEventListener('click', (e) => {
            e.preventDefault();
            this.panelMove('left');
        });

        containerEl.querySelector('.twv-button-panel-right').addEventListener('click', (e) => {
            e.preventDefault();
            this.panelMove('right');
        });
        
        return containerEl;
    }

    panelMove(direction) {
        const newClassName = `twv-panel-${direction}`;
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

    createSelectionOptions(xpath) {
        const elementSelected = this.getElementByXPath(xpath);
        if (!elementSelected) {
            throw new Error('Element for XPath not found.');
        }

        const buttonStart = this.container.querySelector('.twv-button-start-select');
        buttonStart.parentNode.classList.add('twv-block-active-status-active');

        this.container.querySelector('.twv-inner').innerHTML = '';

        const xpathEscaped = xpath.replace(/[\"]/g, '&quot;');
        const div = document.createElement('div');
        div.innerHTML = `
<b>XPath:</b>
<div class="twv-p-1 twv-mb-3 twv-small twv-bg-gray">
    <div class="twv-text-overflow" title="${xpathEscaped}">${xpath}</div>
</div>
<div class="twv-mb-3 twv-ui-element-select">
    <select class="twv-select">
        <option value="">- Тип блока интерфейса -</option>
        <option value="field">Поле контента</option>
        <option value="photogallery">Фото-галерея</option>
        <option value="menu">Меню</option>
        <option value="breadcrumbs">Хлебные кношки</option>
        <option value="shopping-cart">Корзина товаров</option>
        <option value="products-list">Избранные товары</option>
        <option value="comments">Отзывы</option>
    </select>
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
                
                const div = document.createElement('div');
                div.className = 'twv-mb-2';
                div.innerHTML = `
                <button class="twv-btn twv-btn-block">${cmp.title}</button>
                `;
                
                componentsContainer.appendChild(div);
            });

            console.log(e.target.value, this.options.uiOptions[e.target.value]);

        });

        const compStyles = window.getComputedStyle(elementSelected);
        const position = compStyles.getPropertyValue('position');
        const backgroundColor = compStyles.getPropertyValue('background-color');
        if (position === 'static') {
            elementSelected.style.position = 'relative';
        }
        if (['rgba(0, 0, 0, 0)', 'transparent'].indexOf(backgroundColor) > -1) {
            // elementSelected.style.backgroundColor = '#fff';
        }
        const backgroundOverlay = document.createElement('div');
        backgroundOverlay.className = 'twv-back-overlay';
        document.body.appendChild(backgroundOverlay);
        
        elementSelected.classList.add('twv-selected-element');

        console.log(xpath, backgroundColor, elementSelected, position);

    }

    removeEl(el) {
        el.parentNode.removeChild(el);
    };
}

let twigVisual;

TwigVisual.onReady(() => {
    twigVisual = new TwigVisual();
});
