
class TwigVisual {

    constructor(options) {
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
                    components: [
                        {
                            name: "firstItem", title: "Пункт меню первого уровня", type: ""
                        },
                        {
                            name: "secondItem", title: "Пункт меню второго уровня", type: ""
                        }
                    ]
                },
                breadcrumbs: {
                    components: [
                        {
                            name: "linkHomePage", title: "Ссылка на главную страницу", type: ""
                        },
                        {
                            name: "item", title: "Ссылка", type: ""
                        }
                    ]
                },
                "shopping-cart": {
                    components: [
                        {
                            name: "totalPrice", title: "Общая цена", type: ""
                        },
                        {
                            name: "totalCount", title: "Общее количество", type: ""
                        },
                        {
                            name: "lickCheckout", title: "Ссылка на оформление", type: ""
                        },
                        {
                            name: "buttonClean", title: "Кнопка очистки", type: ""
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

        this.parentElement = document.body;

        // Start button
        const buttonStart = this.container.querySelector('.twv-button-start-select');
        buttonStart.addEventListener('click', (e) => {
            e.preventDefault();
            e.target.setAttribute('disabled', 'disabled');
            this.selectModeToggle(document.body, 'source');
        });

        document.body.addEventListener('keyup', (e) => {
            if (e.code !== 'Escape') {
                return;
            }
            if (this.state === 'active') {
                this.selectModeToggle();
            }
            this.selectionModeDestroy();
        });
    }

    selectModeToggle(parentEl, dataKey = 'source', hidePanel = true) {
        parentEl = parentEl || this.parentElement;
        if (this.state === 'inactive') {
            this.parentElement = parentEl;
            this.dataKey = dataKey;
            if (hidePanel) {
                this.container.style.display = 'none';
            }
            parentEl.addEventListener('mouseover', this.listenerOnMouseOver);
            parentEl.addEventListener('mouseout', this.listenerOnMouseOut);
            parentEl.addEventListener('wheel', this.listenerOnMouseWheel, {passive: false});
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

    onMouseOver(e) {
        if (this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
            return;
        }
        this.currentElements = [];
        this.updateXPathInfo(e.target);
        e.target.classList.add('twv-selected');
    }

    onMouseOut(e) {
        if (this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
            return;
        }
        this.currentElements = [];
        const elements = Array.from(document.querySelectorAll('.twv-selected'));
        elements.forEach((element) => {
            element.classList.remove('twv-selected');
        });
    }

    onSelectedElementClick(e) {
        if (this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
            return;
        }
        e.preventDefault();

        this.selectModeToggle();

        let currentElement = this.currentElements.length > 0
            ? this.currentElements[this.currentElements.length - 1]
            : e.target;
        this.selectionModeDestroy();

        // Clear selection
        if (this.data[this.dataKey]) {
            const xpath = this.data[this.dataKey];
            this.removeSelectionInnerByXPath(xpath);
        }

        const xpath = this.getXPathForElement(currentElement);
        this.data[this.dataKey] = xpath;

        console.log(this.dataKey, this.data);

        if (this.dataKey === 'source') {
            this.createSelectionOptions(xpath);
        } else {

            currentElement.classList.add('twv-selected-success');

            const index = this.components.findIndex((item) => {
                return item.name === this.dataKey;
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

    selectionModeDestroy(reset = false) {
        this.state = 'inactive';
        if (document.querySelector('.twv-info')) {
            this.removeEl(document.querySelector('.twv-info'));
        }
        const elements = Array.from(document.querySelectorAll('.twv-selected'));
        elements.forEach((element) => {
            element.classList.remove('twv-selected');
        });

        if (reset) {
            this.data = {};
            this.currentElements = [];
            this.components = [];
            const buttonStart = this.container.querySelector('.twv-button-start-select');

            // Remove options
            buttonStart.parentNode.classList.remove('twv-block-active-status-active');
            this.container.querySelector('.twv-inner').innerHTML = '';

            // Remove overlay
            if (document.querySelector('.twv-back-overlay')) {
                this.removeEl(document.querySelector('.twv-back-overlay'));
            }

            // Remove selection of parent element
            const elementSelected = document.querySelector('.twv-selected-element');
            if (elementSelected) {
                elementSelected.classList.remove('twv-selected-element');
            }

            this.removeSelectionInner();
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

    /**
     * Remove selection of inner elements
     */
    removeSelectionInner() {
        const selectedElements = Array.from(document.querySelectorAll('.twv-selected-success'));
        selectedElements.forEach((element) => {
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
    removeSelectionInnerByXPath(xpath) {
        const element = this.getElementByXPath(xpath);
        if (element.dataset.twvTitle) {
            element.setAttribute('title', element.dataset.twvTitle);
        } else {
            element.removeAttribute('title');
        }
        element.classList.remove('twv-selected-success');
    }

    updateXPathInfo(element) {
        const xpath = this.getXPathForElement(element, true);
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

    getXPathForElement(element, getAttributes = false) {
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
                return this.getXPathForElement(element.parentNode, getAttributes) + '/'
                    + element.tagName.toLowerCase() + '[' + (ix + 1) + ']'
                    + (getAttributes ? this.getXpathElementAttributes(element) : '');
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
<div class="twv-mb-3">
    <button type="button" class="twv-btn twv-btn-primary twv-btn-block twv-button-start-select">
        <i class="twv-icon-center_focus_strong"></i>
        Блок интерфейса
    </button>
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
        this.makeButtonSelected(buttonStart, true, () => {
            this.selectionModeDestroy(true);
        });

        this.container.querySelector('.twv-inner').innerHTML = '';

        const xpathEscaped = xpath.replace(/[\"]/g, '&quot;');
        const div = document.createElement('div');
        div.innerHTML = `
<b>XPath:</b>
<div class="twv-p-1 twv-mb-3 twv-small twv-bg-gray">
    <div class="twv-text-overflow" title="${xpathEscaped}">${xpath}</div>
</div>
<div class="twv-mb-3 twv-ui-element-select">
    <select class="twv-custom-select">
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
<div class="twv-mb-3 twv-ui-components"></div>
<div class="twv-mb-3">
    <button type="button" class="twv-btn twv-btn-primary twv-button-submit">Применить</button>
</div>
        `;
        this.container.querySelector('.twv-inner').appendChild(div);

        const componentsContainer = this.container.querySelector('.twv-ui-components');
        const buttonSubmit = this.container.querySelector('.twv-button-submit');
        buttonSubmit.style.display = 'none';

        // Submit data
        buttonSubmit.addEventListener('click', (e) => {
            e.preventDefault();

            console.log('SUBMIT', this.data);

        });

        // Select UI element type
        this.container.querySelector('.twv-ui-element-select').addEventListener('change', (e) => {
            componentsContainer.innerHTML = '';
            this.removeSelectionInner();
            if (!e.target.value) {
                buttonSubmit.style.display = 'none';
                return;
            }
            buttonSubmit.style.display = 'inline-block';
            if (!this.options.uiOptions[e.target.value]) {
                return;
            }

            // Clean components data
            Object.keys(this.data).forEach((key) => {
                if (key !== 'source') {
                    delete this.data[key];
                }
            });

            const opt = this.options.uiOptions[e.target.value];
            this.components = opt.components;
            this.components.forEach((cmp) => {
                const div = document.createElement('div');
                div.className = 'twv-mb-2';
                div.innerHTML = `<button data-twv-key="${cmp.name}" class="twv-btn twv-btn-block">${cmp.title}</button>`;

                componentsContainer.appendChild(div);

                div.querySelector('button').addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.state === 'active') {
                        return;
                    }
                    e.target.setAttribute('disabled', 'disabled');
                    this.selectModeToggle(elementSelected, cmp.name, false);
                });
            });
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
        // document.body.appendChild(backgroundOverlay);
        this.insertBefore(backgroundOverlay, elementSelected);

        elementSelected.classList.add('twv-selected-element');

        console.log(xpath, backgroundColor, elementSelected, position);

    }

    componentButtonMakeSelected(dataKey) {
        const componentsContainer = this.container.querySelector('.twv-ui-components');
        let buttons = Array.from(componentsContainer.querySelectorAll('button'));
        buttons = buttons.filter((buttonEl) => {
            return buttonEl.dataset.twvKey === dataKey;
        });
        if (buttons.length === 1) {
            this.makeButtonSelected(buttons[0], true, () => {
                const xpath = this.data[dataKey] || null;
                this.removeSelectionInnerByXPath(xpath);
                delete this.data[dataKey];

                console.log(this.data);
            });
        }
    }

    /**
     * Mark button as selected
     * @param buttonEl
     * @param selected
     * @param cancelFunc
     */
    makeButtonSelected(buttonEl, selected = true, cancelFunc = null) {
        buttonEl.removeAttribute('disabled');
        if (buttonEl.parentNode.classList.contains('twv-block-active-status')) {
            if (selected) {
                buttonEl.parentNode.classList.add('twv-block-active-status-active');
            } else {
                buttonEl.parentNode.classList.remove('twv-block-active-status-active');
            }
            return;
        }
        const title = buttonEl.textContent.trim();
        const div = document.createElement('div');
        div.innerHTML = `
<div class="twv-block-active-status twv-block-active-status-active">
    <div class="twv-block-active-status-active-content">
        <div class="twv-input-group">
            <span class="twv-input-group-text twv-flex-fill" title="${title}">
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
        `;

        buttonEl.classList.add('twv-block-active-status-inactive-content');
        this.insertAfter(div, buttonEl);
        div.querySelector('.twv-block-active-status').appendChild(buttonEl);

        buttonEl.parentNode.querySelector('.twv-block-active-status-button-cancel').addEventListener('click', (e) => {
            e.preventDefault();
            this.makeButtonSelected(buttonEl, false);
            if (typeof cancelFunc === 'function') {
                cancelFunc();
            }
        });
    }

    setToParents(element, styles) {
        if (element.parentNode === document.body) {
            return;
        }
        Object.keys(styles).forEach((key) => {
            element.parentNode.style[key] = styles[key];
        });
        this.setToParents(element.parentNode, styles);
    }

    /**
     * Remove HTML element
     * @param el
     */
    removeEl(el) {
        el.parentNode.removeChild(el);
    };

    /**
     * Insert HTML element after other one
     * @param newNode
     * @param referenceNode
     */
    insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    /**
     * Insert HTML element before other one
     * @param newNode
     * @param referenceNode
     */
    insertBefore(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode);
    }
}

let twigVisual;

TwigVisual.onReady(() => {
    twigVisual = new TwigVisual();
});
