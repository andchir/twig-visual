
class TwigVisual {

    constructor(options) {
        this.container = null;
        this.loading = false;
        this.parentElement = null;
        this.dataKey = 'source';
        this.data = {};
        this.timer = null;
        this.components = [];
        this.options = Object.assign({
            templateName: '',
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
                        },
                        {
                            name: "thirdItem", title: "Пункт меню третьего уровня", type: ""
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
        this.state = 'inactive';

        this.listenerOnMouseOver = this.onMouseOver.bind(this);
        this.listenerOnMouseOut = this.onMouseOut.bind(this);
        this.listenerOnMouseWheel = this.onMouseWheel.bind(this);
        this.listenerOnMouseClick = this.onSelectedElementClick.bind(this);
        this.currentElements = [];

        TwigVisual.onReady(this.init.bind(this));
    }

    static onLoad(cb) {
        if (document.readyState === 'complete') {
            cb();
        } else {
            window.addEventListener('load', cb);
        }
    };

    static onReady(cb) {
        if (document.readyState !== 'loading') {
            cb();
        } else {
            document.addEventListener('DOMContentLoaded', cb);
        }
    };

    init() {
        
        console.log('INIT');

        this.container = this.createContainer();
        this.parentElement = document.body;

        // Start button
        const buttonStart = this.container.querySelector('.twv-button-start-select');
        buttonStart.addEventListener('click', (e) => {
            e.preventDefault();
            e.target.setAttribute('disabled', 'disabled');
            this.selectModeToggle(document.body, 'source');
        });

        // Add new theme
        const buttonAddTheme = this.container.querySelector('.twv-button-new-theme');
        buttonAddTheme.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.state === 'active') {
                this.selectModeToggle();
            }
            this.selectionModeDestroy(true);
            this.addNewTheme();
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

            // Remove attribute disabled
            if (this.container.querySelector('.twv-ui-components')) {
                const buttons = this.container.querySelector('.twv-ui-components').querySelectorAll('button');
                Array.from(buttons).forEach((buttonEl) => {
                    buttonEl.removeAttribute('disabled');
                });
            }
            const buttonStart = this.container.querySelector('.twv-button-start-select');
            buttonStart.removeAttribute('disabled');
            
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
        
        console.log('CLICK');
        
        if (this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();

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

    /**
     * Destroy selection mode
     * @param reset
     */
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
                elementSelected.contentEditable = false;
                if (elementSelected.dataset.twvContent) {
                    elementSelected.textContent = elementSelected.dataset.twvContent;
                }
                elementSelected.classList.remove('twv-selected-element');
            }
            this.setToParents(elementSelected, {transform: ''});

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
<div class="twv-mb-2">
    <button type="button" class="twv-btn twv-btn-primary twv-btn-block twv-button-new-theme">
        <i class="twv-icon-add"></i>
        Создать новую тему
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
    
    onBlockUiTypeChange(parentElement, typeValue) {
        const componentsContainer = this.container.querySelector('.twv-ui-components');
        componentsContainer.innerHTML = '';
        this.removeSelectionInner();

        if (!typeValue) {
            return;
        }
        if (!this.options.uiOptions[typeValue]) {
            return;
        }

        // Clean components data
        Object.keys(this.data).forEach((key) => {
            if (key !== 'source') {
                delete this.data[key];
            }
        });

        let div = document.createElement('div');
        div.className = 'twv-pt-1 twv-mb-3';
        const opt = this.options.uiOptions[typeValue];
        this.components = opt.components;
        this.components.forEach((cmp) => {
            const d = document.createElement('div');
            d.className = 'twv-mb-2';
            d.innerHTML = `<button data-twv-key="${cmp.name}" class="twv-btn twv-btn-block">${cmp.title}</button>`;

            div.appendChild(d);

            d.querySelector('button').addEventListener('click', (e) => {
                e.preventDefault();
                if (this.state === 'active') {
                    return;
                }
                e.target.setAttribute('disabled', 'disabled');
                this.selectModeToggle(parentElement, cmp.name, false);
            });
        });
        componentsContainer.appendChild(div);
        
        div = document.createElement('div');
        div.className = 'twv-pt-1 twv-mb-3';
        div.innerHTML = `
            <button type="button" class="twv-btn twv-btn-primary twv-mr-1 twv-button-submit">Применить</button>
            <button type="button" class="twv-btn twv-button-cancel">Отменить</button>
        `;
        componentsContainer.appendChild(div);

        const buttonSubmit = this.container.querySelector('.twv-button-submit');
        const buttonCancel = this.container.querySelector('.twv-button-cancel');

        // Submit data
        buttonSubmit.addEventListener('click', (e) => {
            e.preventDefault();

            console.log('SUBMIT', this.data);

        });

        // Cancel
        buttonCancel.addEventListener('click', (e) => {
            e.preventDefault();

            const selectEl = this.container.querySelector('.twv-ui-element-select > select');
            const elementSelected = document.querySelector('.twv-selected-element');

            if (this.state === 'active') {
                this.selectModeToggle();
                return;
            }
            if (selectEl.value) {
                selectEl.value = '';
                this.selectionModeDestroy();
                this.onBlockUiTypeChange(elementSelected);
            } else {
                this.selectionModeDestroy(true);
            }
        });
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
<div class="twv-mb-3">
    <button type="button" class="twv-btn twv-mr-1 twv-button-edit-text" title="Edit text content">
        <i class="twv-icon-createmode_editedit"></i>
    </button>
    <button type="button" class="twv-btn twv-mr-1 twv-button-edit-link" title="Edit link">
        <i class="twv-icon-linkinsert_link"></i>
    </button>
    <button type="button" class="twv-btn twv-mr-1 twv-button-delete-element" title="Delete element">
        <i class="twv-icon-clearclose"></i>
    </button>
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
        `;
        this.container.querySelector('.twv-inner').appendChild(div);
        
        const selectEl = this.container.querySelector('.twv-ui-element-select > select');

        // Select UI element type
        selectEl.addEventListener('change', (e) => {
            this.onBlockUiTypeChange(elementSelected, e.target.value);
        });
        
        // Button edit text
        this.container.querySelector('.twv-button-edit-text').addEventListener('click', (e) => {
            e.preventDefault();
            this.editTextContentInit(elementSelected);
        });

        // Button edit link
        this.container.querySelector('.twv-button-edit-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.editLinkInit(elementSelected);
        });

        // Button delete element
        this.container.querySelector('.twv-button-delete-element').addEventListener('click', (e) => {
            e.preventDefault();
            this.deleteElementInit(elementSelected);
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

        this.setToParents(elementSelected, {transform: 'none'});

        elementSelected.classList.add('twv-selected-element');
    }

    /**
     * Edit text content
     * @param {HTMLElement} elementSelected
     */
    editTextContentInit(elementSelected) {
        const children = elementSelected.children;
        if (children.length > 0) {
            alert('The selected item must not have children.');
            return;
        }
        this.clearMessage();
        const componentsContainer = this.container.querySelector('.twv-ui-components');
        const textContent = elementSelected.textContent.trim();
        componentsContainer.innerHTML = '';

        const div = document.createElement('div');
        div.innerHTML = `
            <div class="twv-mb-3">
                <button type="button" class="twv-btn twv-btn-primary twv-mr-2 twv-button-submit">Сохранить</button>
                <button type="button" class="twv-btn twv-btn twv-button-cancel">Отменить</button>
            </div>
            `;
        componentsContainer.appendChild(div);

        elementSelected.dataset.twvContent = textContent;
        elementSelected.contentEditable = true;
        elementSelected.focus();

        const buttonSubmit = this.container.querySelector('.twv-button-submit');
        const buttonCancel = this.container.querySelector('.twv-button-cancel');

        // Submit data
        buttonSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            elementSelected.contentEditable = false;
            buttonSubmit.setAttribute('disabled', 'disabled');
            buttonCancel.setAttribute('disabled', 'disabled');

            this.showLoading(true);
            
            this.request('/twigvisual/edit_content', {
                templateName: this.options.templateName,
                xpath: this.data.source,
                textContent: elementSelected.textContent.trim()
            }, (res) => {
                this.showLoading(false);
                if (res.success) {
                    window.location.reload();
                }
            }, (err) => {
                this.addErrorMessage(err.error || err);
                buttonSubmit.removeAttribute('disabled');
                buttonCancel.removeAttribute('disabled');
                this.showLoading(false);
            }, 'POST');
        });

        // Cancel
        buttonCancel.addEventListener('click', (e) => {
            e.preventDefault();
            elementSelected.contentEditable = false;
            componentsContainer.innerHTML = '';
            elementSelected.textContent = textContent;
        });
    }

    /**
     * Edit link
     * @param {HTMLElement} elementSelected
     */
    editLinkInit(elementSelected) {
        if (elementSelected.tagName.toLowerCase() !== 'a') {
            alert('The selected item must have tag A.');
            return;
        }
        console.log('EDIT_LINK');

        this.clearMessage();
        const componentsContainer = this.container.querySelector('.twv-ui-components');
        const href = elementSelected.getAttribute('href');
        componentsContainer.innerHTML = '';

        const div = document.createElement('div');
        div.innerHTML = `
            <div class="twv-mb-3">
                <label class="twv-display-block twv-mb-1" for="tww-field-element-link">Ссылка</label>
                <input type="text" id="tww-field-element-link" class="twv-form-control" value="${href}">
            </div>
            <div class="twv-mb-3">
                <button type="button" class="twv-btn twv-btn-primary twv-mr-2 twv-button-submit">Сохранить</button>
                <button type="button" class="twv-btn twv-btn twv-button-cancel">Отменить</button>
            </div>
            `;
        componentsContainer.appendChild(div);

        const buttonSubmit = this.container.querySelector('.twv-button-submit');
        const buttonCancel = this.container.querySelector('.twv-button-cancel');

        // Submit data
        buttonSubmit.addEventListener('click', (e) => {
            e.preventDefault();

            console.log('SUBMIT', this.data);

        });

        // Cancel
        buttonCancel.addEventListener('click', (e) => {
            e.preventDefault();
            componentsContainer.innerHTML = '';
        });
    }

    /**
     * Delete selected element
     * @param {HTMLElement} elementSelected
     */
    deleteElementInit(elementSelected) {
        
        console.log('DELETE');

        this.clearMessage();
        const componentsContainer = this.container.querySelector('.twv-ui-components');
        const textContent = elementSelected.textContent.trim();
        componentsContainer.innerHTML = '';

        const div = document.createElement('div');
        div.innerHTML = `
            <div class="twv-mb-3">Вы уверены, что хотите удалить выбранный элемент?</div>
            <div class="twv-mb-3">
                <button type="button" class="twv-btn twv-btn-primary twv-mr-2 twv-button-submit">Подтвердить</button>
                <button type="button" class="twv-btn twv-btn twv-button-cancel">Отменить</button>
            </div>
            `;
        componentsContainer.appendChild(div);

        const buttonSubmit = this.container.querySelector('.twv-button-submit');
        const buttonCancel = this.container.querySelector('.twv-button-cancel');

        // Submit data
        buttonSubmit.addEventListener('click', (e) => {
            e.preventDefault();

            this.showLoading(true);

            this.request('/twigvisual/delete_element', {
                templateName: this.options.templateName,
                xpath: this.data.source
            }, (res) => {
                this.showLoading(false);
                if (res.success) {
                    window.location.reload();
                }
            }, (err) => {
                this.addErrorMessage(err.error || err);
                buttonSubmit.removeAttribute('disabled');
                buttonCancel.removeAttribute('disabled');
                this.showLoading(false);
            }, 'POST');
        });

        // Cancel
        buttonCancel.addEventListener('click', (e) => {
            e.preventDefault();
            componentsContainer.innerHTML = '';
        });
    }

    addNewTheme() {

        this.clearMessage();
        const innerContainerEl = this.container.querySelector('.twv-inner');
        innerContainerEl.innerHTML = '';

        const div = document.createElement('div');
        div.innerHTML = `
        <div class="twv-mb-3">
            <label class="twv-display-block twv-mb-1" for="tww-field-theme-name">Название темы</label>
            <input type="text" id="tww-field-theme-name" class="twv-form-control">
        </div>
        <div class="twv-mb-3">
            <label class="twv-display-block twv-mb-1" for="tww-field-theme-mainpage">HTML-файл главной страницы</label>
            <input type="text" id="tww-field-theme-mainpage" class="twv-form-control" value="index.html">
        </div>
        <div class="twv-mb-3">
            <button type="button" class="twv-btn twv-btn-primary twv-mr-2 twv-button-submit">Создать</button>
            <button type="button" class="twv-btn twv-btn twv-button-cancel">Отменить</button>
        </div>
        `;

        innerContainerEl.appendChild(div);

        innerContainerEl.querySelector('button.twv-button-submit').addEventListener('click', (e) => {
            e.preventDefault();
            const fieldThemeEl = document.getElementById('tww-field-theme-name');
            const fieldMainpageEl = document.getElementById('tww-field-theme-mainpage');
            const buttonEl = e.target;
            if (!fieldThemeEl.value || !fieldMainpageEl.value) {
                return;
            }

            this.showLoading(true);
            buttonEl.setAttribute('disabled', 'disabled');

            this.request('/twigvisual/create', {
                theme: fieldThemeEl.value,
                mainpage: fieldMainpageEl.value
            }, (res) => {
                console.log(res);
                buttonEl.removeAttribute('disabled');
            }, (err) => {
                this.addErrorMessage(err.error || err);
                buttonEl.removeAttribute('disabled');
                this.showLoading(false);
            }, 'POST');
        });

        innerContainerEl.querySelector('button.twv-button-cancel').addEventListener('click', (e) => {
            e.preventDefault();
            innerContainerEl.innerHTML = '';
        });
    }
    
    showLoading(enabled = true) {
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
    addErrorMessage(message, type = 'danger') {
        clearTimeout(this.timer);
        const innerContainerEl = this.container.querySelector('.twv-inner');
        if (innerContainerEl.querySelector('.twv-alert')) {
            this.removeEl(innerContainerEl.querySelector('.twv-alert'));
        }
        const div = document.createElement('div');
        div.innerHTML = `
        <div class="twv-alert twv-alert-${type}">${message}</div>
        `;
        innerContainerEl.appendChild(div);

        div.addEventListener('mouseenter', () => {
            clearTimeout(this.timer);
        });
        div.addEventListener('mouseleave', () => {
            this.timer = setTimeout(this.clearMessage.bind(this), 3000);
        });
        this.timer = setTimeout(this.clearMessage.bind(this), 3000);
    }
    
    clearMessage() {
        const innerContainerEl = this.container.querySelector('.twv-inner');
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
    request(url, data, successFn, failFn, method) {
        method = method || 'GET';
        const request = new XMLHttpRequest();
        request.open(method, url, true);

        request.onload = function() {
            const result = ['{','['].indexOf(request.responseText.substr(0,1)) > -1
                ? JSON.parse(request.responseText)
                : {};
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

        request.onerror = function() {
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
    setToParents(element, styles) {
        if (!element) {
            return;
        }
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
