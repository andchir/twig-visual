/**
 * TwigVisual
 * @version 1.0.0
 * @author Andchir<andchir@gmail.com>
 */
class TwigVisual {

    constructor(options) {
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
        this.container = this.createContainer();
        this.parentElement = document.body;

        // Start button
        const buttonStart = this.container.querySelector('.twv-button-start-select');
        buttonStart.addEventListener('click', (e) => {
            e.preventDefault();
            e.target.setAttribute('disabled', 'disabled');
            this.removeSelectionInner();
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
            this.addNewThemeInit();
        });
        
        this.container.querySelector('.twv-button-new-template').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.state === 'active') {
                this.selectModeToggle();
            }
            this.selectionModeDestroy(true);
            this.addNewTemplateInit();
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
        
        // Panel position recovery
        const panelClassName = this.getCookie('twv-panel-class-name');
        if (panelClassName) {
            this.container.className = panelClassName;
            this.container.classList.add('twig-visual-container');
        }
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
            this.onAfterSelect();
        }
    }

    onAfterSelect() {
        switch (this.dataKey) {
            case 'moveTarget':
                
                const innerContainerEl = this.container.querySelector('.twv-inner');
                const buttonStart = this.container.querySelector('.twv-button-start-select');
                this.makeButtonSelected(buttonStart, true, () => {
                    this.selectionModeDestroy(true);
                    return true;
                });
                this.removeOverlay();
                innerContainerEl.innerHTML = '';

                const div = document.createElement('div');
                div.className = 'twv-pt-1 twv-mb-3';
                div.innerHTML = `
                    <div class="twv-mb-3">
                        <label class="twv-display-block">
                            <input type="radio" name="insertMode" value="inside" checked="checked">
                            Вставить
                        </label>
                        <label class="twv-display-block">
                            <input type="radio" name="insertMode" value="before">
                            Вставить до
                        </label>
                        <label class="twv-display-block">
                            <input type="radio" name="insertMode" value="after">
                            Вставить после
                        </label>
                    </div>
                    <button type="button" class="twv-btn twv-btn-primary twv-mr-1 twv-button-submit">
                        <i class="twv-icon-done"></i>
                        Применить
                    </button>
                    <button type="button" class="twv-btn twv-btn twv-button-cancel" title="Отменить">
                        <i class="twv-icon-clearclose"></i>
                    </button>
                `;
                innerContainerEl.appendChild(div);

                const buttonSubmit = innerContainerEl.querySelector('.twv-button-submit');
                const buttonCancel = innerContainerEl.querySelector('.twv-button-cancel');

                // Submit data
                buttonSubmit.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const insertMode = innerContainerEl.querySelector('input[name="insertMode"]:checked').value;
                    this.showLoading(true);

                    this.request('/twigvisual/move_element', {
                        templateName: this.options.templateName,
                        xpath: this.data.source,
                        xpathTarget: this.data.moveTarget,
                        insertMode
                    }, (res) => {
                        if (res.success) {
                            this.windowReload();
                        } else {
                            this.showLoading(false);
                        }
                    }, (err) => {
                        this.addAlertMessage(err.error || err);
                        this.showLoading(false);
                    }, 'POST');
                });

                // Submit data
                buttonCancel.addEventListener('click', (e) => {
                    e.preventDefault();
                    innerContainerEl.innerHTML = '';
                    this.selectionModeDestroy(true);
                });
                
                break;
        }
    }

    onMouseOver(e) {
        const xpath = this.getXPathForElement(e.target, true);
        if (!xpath || this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
            return;
        }
        this.currentElements = [];
        this.updateXPathInfo(e.target);
        e.target.classList.add('twv-selected');
        this.displayPadding(e.target);
    }

    onMouseOut(e) {
        const xpath = this.getXPathForElement(e.target, true);
        if (!xpath || this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
            return;
        }
        this.currentElements = [];
        const elements = Array.from(document.querySelectorAll('.twv-selected'));
        elements.forEach((element) => {
            element.classList.remove('twv-selected');
            element.style.boxShadow = '';
        });
    }

    onSelectedElementClick(e) {
        const xpath = this.getXPathForElement(e.target, true);
        if (!xpath || this.getXPathForElement(e.target, true).indexOf('twig-visual-container') > -1) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();

        this.removeOverlay();
        
        let currentElement = this.currentElements.length > 0
            ? this.currentElements[this.currentElements.length - 1]
            : e.target;
        
        const currentElementXpath = this.getXPathForElement(currentElement);
        this.data[this.dataKey] = currentElementXpath;
        
        // Clear selection
        if (this.data[this.dataKey]) {
            const xpath = this.data[this.dataKey];
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

            this.addOverlay();
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
     * @param {boolean} reset
     * @param {boolean} resetData
     */
    selectionModeDestroy(reset = false, resetData = true) {
        if (document.querySelector('.twv-info')) {
            this.removeEl(document.querySelector('.twv-info'));
        }
        const elements = Array.from(document.querySelectorAll('.twv-selected'));
        elements.forEach((element) => {
            element.classList.remove('twv-selected');
            element.style.boxShadow = '';
        });

        if (reset) {
            if (resetData) {
                this.data = {};
            }
            this.currentElements = [];
            this.components = [];
            const buttonStart = this.container.querySelector('.twv-button-start-select');

            // Remove options
            buttonStart.parentNode.classList.remove('twv-block-active-status-active');
            this.container.querySelector('.twv-inner').innerHTML = '';

            this.removeOverlay();

            // Remove selection of parent element
            const elementSelected = document.querySelector('.twv-selected-element');
            if (elementSelected) {
                elementSelected.contentEditable = false;
                if (elementSelected.dataset.twvContent) {
                    elementSelected.innerHTML = elementSelected.dataset.twvContent;
                    elementSelected.dataset.twvContent = '';
                }
                elementSelected.classList.remove('twv-selected-element');
            }
            this.setToParents(elementSelected, {transform: '', transition: ''});

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
            currentElement.style.boxShadow = '';
            this.currentElements.push(currentElement.parentNode);

            this.updateXPathInfo(currentElement.parentNode);
            currentElement.parentNode.classList.add('twv-selected');
            this.displayPadding(currentElement.parentNode);
        } else {
            currentElement.classList.remove('twv-selected');
            currentElement.style.boxShadow = '';
            this.currentElements.splice(this.currentElements.length - 1, 1);
            currentElement = this.currentElements.length > 0
                ? this.currentElements[this.currentElements.length - 1]
                : e.target;

            this.updateXPathInfo(currentElement);
            currentElement.classList.add('twv-selected');
            this.displayPadding(currentElement);
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
        this.removeOverlay();
        const element = this.getElementByXPath(xpath);
        if (!element) {
            return false;
        }
        if (element.dataset.twvTitle) {
            element.setAttribute('title', element.dataset.twvTitle);
        } else {
            element.removeAttribute('title');
        }
        element.classList.remove('twv-selected-success');
        return true;
    }
    
    addOverlay(element = null) {
        if (document.querySelector('.twv-back-overlay')) {
            return;
        }
        if (!element) {
            element = this.parentElement;
        }
        const backgroundOverlay = document.createElement('div');
        backgroundOverlay.className = 'twv-back-overlay';
        this.insertBefore(backgroundOverlay, element);
    }

    /**
     * Remove overlay
     */
    removeOverlay() {
        if (document.querySelector('.twv-back-overlay')) {
            this.removeEl(document.querySelector('.twv-back-overlay'));
        }
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
        if (!element.parentNode)
            return '';

        let ix = 0;
        const siblings = element.parentNode.childNodes;
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === element) {
                return this.getXPathForElement(element.parentNode, getAttributes) + '/'
                    + element.tagName.toLowerCase() + '[' + (ix + 1) + ']'
                    + (getAttributes ? this.getXpathElementAttributes(element) : '');
            }
            if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === element.tagName)
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

    getElementByXPath(xpath, parentEl = window.document) {
        const result = document.evaluate(xpath, parentEl, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return result.singleNodeValue;
    }

    createContainer() {
        const containerEl = document.createElement('div');
        containerEl.id = 'twig-visual-container';
        containerEl.className = 'twig-visual-container twv-panel-right';
        containerEl.innerHTML = `
        <div class="twv-panel-header">
            <div class="twv-panel-header-buttons">
                <button class="twv-btn twv-btn-sm twv-ml-1 twv-button-undo" type="button" title="Отменить последнее действие">
                    <i class="twv-icon-undo"></i>
                </button>
                <button class="twv-btn twv-btn-sm twv-ml-1 twv-button-execute-batch" type="button" title="Выполнить пакет операций" style="display: none;">
                    <i class="twv-icon-format_list_bulleted"></i>
                    <span></span>
                </button>
            </div>
            <button class="twv-btn twv-btn-sm twv-mr-1 twv-button-panel-left" type="button" title="Передвинуть влево">
                <i class="twv-icon-arrow_back"></i>
            </button>
            <button class="twv-btn twv-btn-sm twv-button-panel-right" type="button" title="Передвинуть вправо">
                <i class="twv-icon-arrow_forward"></i>
            </button>
        </div>
        <div class="twv-mb-2">
            <button type="button" class="twv-btn twv-btn-block twv-button-new-theme">
                <i class="twv-icon-add"></i>
                Создать новую тему
            </button>
        </div>
        <div class="twv-mb-2">
            <button type="button" class="twv-btn twv-btn-block twv-button-new-template">
                <i class="twv-icon-add"></i>
                Создать шаблон
            </button>
        </div>
        <div class="twv-mb-3">
            <button type="button" class="twv-btn twv-btn-primary twv-btn-block twv-button-start-select">
                <i class="twv-icon-center_focus_strong"></i>
                Блок интерфейса
            </button>
        </div>
        <div class="twv-inner-wrapper">
            <div class="twv-inner"></div>
        </div>
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
        
        containerEl.querySelector('.twv-button-execute-batch').addEventListener('click', (e) => {
            e.preventDefault();
            this.executeActionBatch();
        });

        return containerEl;
    }

    panelMove(direction) {
        const newClassName = `twv-panel-${direction}`;
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
            d.className = '';
            
            switch (cmp.type) {
                case 'elementSelect':
                    
                    d.innerHTML = `<div class="twv-mb-2">
                        <button data-twv-key="${cmp.name}" class="twv-btn twv-btn-block twv-text-overflow">${cmp.title}</button>
                    </div>
                    `;

                    d.querySelector('button').addEventListener('click', (e) => {
                        e.preventDefault();
                        if (this.state === 'active') {
                            return;
                        }
                        e.target.setAttribute('disabled', 'disabled');
                        this.selectModeToggle(parentElement, cmp.name, false);
                    });
                    div.appendChild(d);
                    
                    break;
                case 'text':
                    
                    d.innerHTML = `
                    <div class="twv-mb-2">
                        <label class="twv-display-block twv-mb-1" for="tww-field-option-${cmp.name}">${cmp.title}</label>
                        <input type="text" id="tww-field-option-${cmp.name}" class="twv-form-control" name="${cmp.name}" value="">
                    </div>
                    `;
                    div.appendChild(d);
                    
                    break;
                case 'pageField':

                    let optionsHTML = '';
                    this.options.pageFields.forEach((pageField) => {
                        optionsHTML += `<option value="${pageField.name}" data-type="${pageField.type}">${pageField.name} - ${pageField.type}</option>`;
                    });
                    
                    d.innerHTML = `
                    <div class="twv-mb-3">
                        <label class="twv-display-block twv-mb-1" for="tww-field-option-${cmp.name}">${cmp.title}</label>
                        <select id="tww-field-option-${cmp.type}" class="twv-custom-select" name="fieldName">
                            ${optionsHTML}
                        </select>
                    </div>
                    `;
                    div.appendChild(d);
                    
                    const onFieldSelectChange = (value, type) => {
                        const keyFieldEl = componentsContainer.querySelector('input[name="key"]');
                        if (keyFieldEl) {
                            const textFieldBlockEl = keyFieldEl.parentNode;
                            textFieldBlockEl.style.display = ['object', 'array'].indexOf(type) > -1 ? 'block' : 'none';
                            if (['object', 'array'].indexOf(type) === -1) {
                                keyFieldEl.value = '';
                            }
                        }
                    };

                    d.querySelector('select').addEventListener('change', (e) => {
                        const selectEl = e.target;
                        const selectedOption = selectEl.options[selectEl.selectedIndex];
                        onFieldSelectChange(selectEl.value, selectedOption.dataset.type);
                    });

                    setTimeout(() => {
                        onFieldSelectChange(d.querySelector('select').value, d.querySelector('select').querySelector('option').dataset.type);
                    }, 1);
                    
                    break;
            }
        });
        componentsContainer.appendChild(div);
        
        div = document.createElement('div');
        div.className = 'twv-pt-1 twv-mb-3';
        div.innerHTML = `
            <button type="button" class="twv-btn twv-btn-primary twv-mr-1 twv-button-submit">
                <i class="twv-icon-done"></i>
                Применить
            </button>
            <button type="button" class="twv-btn twv-btn twv-button-cancel" title="Отменить">
                <i class="twv-icon-clearclose"></i>
            </button>
        `;
        componentsContainer.appendChild(div);

        const buttonSubmit = this.container.querySelector('.twv-button-submit');
        const buttonCancel = this.container.querySelector('.twv-button-cancel');

        // Submit data
        buttonSubmit.addEventListener('click', (e) => {
            e.preventDefault();

            buttonSubmit.setAttribute('disabled', 'disabled');
            buttonCancel.setAttribute('disabled', 'disabled');

            this.showLoading(true);
            const data = {
                templateName: this.options.templateName,
                data: this.data
            };

            Array.from(componentsContainer.querySelectorAll('input[type="text"]')).forEach((el) => {
                data.data[el.name] = el.value;
            });
            Array.from(componentsContainer.querySelectorAll('select')).forEach((el) => {
                data.data[el.name] = el.value;
            });
            
            this.request(`/twigvisual/insert/${typeValue}`, data, (res) => {
                if (res.success) {
                    this.windowReload();
                } else {
                    buttonSubmit.removeAttribute('disabled');
                    buttonCancel.removeAttribute('disabled');
                    this.showLoading(false);
                }
            }, (err) => {
                this.addAlertMessage(err.error || err);
                buttonSubmit.removeAttribute('disabled');
                buttonCancel.removeAttribute('disabled');
                this.showLoading(false);
            }, 'POST');
        });

        // Cancel
        buttonCancel.addEventListener('click', (e) => {
            e.preventDefault();

            const selectEl = this.container.querySelector('.twv-ui-element-select > select');
            const elementSelected = document.querySelector('.twv-selected-element');
            if (document.querySelector('.twv-info')) {
                this.removeEl(document.querySelector('.twv-info'));
            }

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
        if (!componentsContainer) {
            return;
        }
        let buttons = Array.from(componentsContainer.querySelectorAll('button'));
        buttons = buttons.filter((buttonEl) => {
            return buttonEl.dataset.twvKey === dataKey;
        });
        if (buttons.length === 1) {
            this.makeButtonSelected(buttons[0], true, () => {
                const xpath = this.data[dataKey] || null;
                if (this.removeSelectionInnerByXPath(xpath)) {
                    delete this.data[dataKey];
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
            if (typeof cancelFunc === 'function') {
                cancelFunc() && this.makeButtonSelected(buttonEl, false);
            } else {
                this.makeButtonSelected(buttonEl, false);
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
            return true;
        });

        this.container.querySelector('.twv-inner').innerHTML = '';

        let optionsHTML = '';
        Object.keys(this.options.uiOptions).forEach((key) => {
            optionsHTML += `<option value="${key}">${this.options.uiOptions[key].title}</option>`;
        });

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
                <i class="twv-icon-delete_outline"></i>
            </button>
            <button type="button" class="twv-btn twv-mr-1 twv-button-move-element" title="Move element">
                <i class="twv-icon-move"></i>
            </button>
            <button type="button" class="twv-btn twv-mr-1 twv-button-restore-static" title="Restore static">
                <i class="twv-icon-cached"></i>
            </button>
        </div>
        <div class="twv-mb-3 twv-ui-element-select">
            <select class="twv-custom-select">
                <option value="">- Тип блока интерфейса -</option>
                ${optionsHTML}
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
        
        this.container.querySelector('.twv-button-move-element').addEventListener('click', (e) => {
            e.preventDefault();
            e.target.setAttribute('disabled', 'disabled');
            this.moveElementInit();
        });

        this.container.querySelector('.twv-button-restore-static').addEventListener('click', (e) => {
            e.preventDefault();
            this.restoreStaticInit();
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
        this.addOverlay(elementSelected);

        this.setToParents(elementSelected, {transform: 'none', transition: 'none'});

        elementSelected.classList.add('twv-selected-element');
    }

    /**
     * Edit text content
     * @param {HTMLElement} elementSelected
     */
    editTextContentInit(elementSelected) {
        this.clearMessage();
        const componentsContainer = this.container.querySelector('.twv-ui-components');
        const innerHTML = elementSelected.innerHTML;
        componentsContainer.innerHTML = '';

        const div = document.createElement('div');
        div.innerHTML = `
            <div class="twv-mb-3">
                <button type="button" class="twv-btn twv-btn-primary twv-mr-1 twv-button-submit">
                    <i class="twv-icon-done"></i>
                    Сохранить
                </button>
                <button type="button" class="twv-btn twv-btn twv-mr-1 twv-button-add-list" title="Добавить в список операций">
                    <i class="twv-icon-format_list_bulleted"></i>
                </button>
                <button type="button" class="twv-btn twv-btn twv-button-cancel" title="Отменить">
                    <i class="twv-icon-clearclose"></i>
                </button>
            </div>
            `;
        componentsContainer.appendChild(div);

        elementSelected.dataset.twvContent = innerHTML;
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
                textContent: elementSelected.innerHTML
            }, (res) => {
                if (res.success) {
                    this.windowReload();
                } else {
                    buttonSubmit.removeAttribute('disabled');
                    buttonCancel.removeAttribute('disabled');
                    this.showLoading(false);
                }
            }, (err) => {
                this.addAlertMessage(err.error || err);
                buttonSubmit.removeAttribute('disabled');
                buttonCancel.removeAttribute('disabled');
                this.showLoading(false);
            }, 'POST');
        });

        // Add to action list
        this.container.querySelector('.twv-button-add-list')
            .addEventListener('click', (e) => {
                e.preventDefault();
                this.addToActionBatch('edit_content', this.data.source, {value: elementSelected.innerHTML});
            });

        // Cancel
        buttonCancel.addEventListener('click', (e) => {
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
    editLinkInit(elementSelected) {
        if (elementSelected.tagName.toLowerCase() !== 'a') {
            alert('The selected item must have tag A.');
            return;
        }
        this.clearMessage();
        const componentsContainer = this.container.querySelector('.twv-ui-components');
        const href = elementSelected.getAttribute('href');
        const target = elementSelected.getAttribute('target');
        componentsContainer.innerHTML = '';

        const div = document.createElement('div');
        div.innerHTML = `
            <div class="twv-mb-3">
                <label class="twv-display-block twv-mb-1" for="tww-field-element-link">Ссылка</label>
                <input type="text" id="tww-field-element-link" class="twv-form-control" value="${href}">
            </div>
            <div class="twv-mb-3">
                <label class="twv-display-block twv-mb-1" for="tww-field-element-link">Target</label>
                <select id="tww-field-link-target" class="twv-custom-select">
                    <option value="_self"${target != '_blank' ? ' selected="selected"' : ''}>_self</option>
                    <option value="_blank"${target == '_blank' ? ' selected="selected"' : ''}>_blank</option>
                </select>
            </div>
            <div class="twv-mb-3">
                <button type="button" class="twv-btn twv-btn-primary twv-mr-1 twv-button-submit">
                    <i class="twv-icon-done"></i>
                    Сохранить
                </button>
                <button type="button" class="twv-btn twv-btn twv-mr-1 twv-button-add-list" title="Добавить в список операций">
                    <i class="twv-icon-format_list_bulleted"></i>
                </button>
                <button type="button" class="twv-btn twv-btn twv-button-cancel" title="Отменить">
                    <i class="twv-icon-clearclose"></i>
                </button>
            </div>
            `;
        componentsContainer.appendChild(div);

        const buttonSubmit = this.container.querySelector('.twv-button-submit');
        const buttonCancel = this.container.querySelector('.twv-button-cancel');

        // Submit data
        buttonSubmit.addEventListener('click', (e) => {
            e.preventDefault();

            this.showLoading(true);

            this.request('/twigvisual/edit_link', {
                templateName: this.options.templateName,
                xpath: this.data.source,
                href: div.querySelector('input[type="text"]').value,
                target: div.querySelector('select').value
            }, (res) => {
                if (res.success) {
                    this.windowReload();
                } else {
                    buttonSubmit.removeAttribute('disabled');
                    buttonCancel.removeAttribute('disabled');
                    this.showLoading(false);
                }
            }, (err) => {
                this.addAlertMessage(err.error || err);
                buttonSubmit.removeAttribute('disabled');
                buttonCancel.removeAttribute('disabled');
                this.showLoading(false);
            }, 'POST');
        });

        // Add to action list
        this.container.querySelector('.twv-button-add-list')
            .addEventListener('click', (e) => {
                e.preventDefault();
                this.addToActionBatch('edit_link', this.data.source, {
                    href: div.querySelector('input[type="text"]').value,
                    target: div.querySelector('select').value
                });
            });

        // Cancel
        buttonCancel.addEventListener('click', (e) => {
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
    deleteElementInit(elementSelected) {
        this.clearMessage();
        const componentsContainer = this.container.querySelector('.twv-ui-components');
        const textContent = elementSelected.textContent.trim();
        componentsContainer.innerHTML = '';

        const div = document.createElement('div');
        div.innerHTML = `
            <div class="twv-mb-3">Вы уверены, что хотите удалить выбранный элемент?</div>
            <div class="twv-mb-3">
                <button type="button" class="twv-btn twv-btn-primary twv-mr-1 twv-button-submit">
                    <i class="twv-icon-done"></i>
                    Подтвердить
                </button>
                <button type="button" class="twv-btn twv-btn twv-mr-1 twv-button-add-list" title="Добавить в список операций">
                    <i class="twv-icon-format_list_bulleted"></i>
                </button>
                <button type="button" class="twv-btn twv-btn twv-button-cancel" title="Отменить">
                    <i class="twv-icon-clearclose"></i>
                </button>
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
                if (res.success) {
                    this.windowReload();
                } else {
                    buttonSubmit.removeAttribute('disabled');
                    buttonCancel.removeAttribute('disabled');
                    this.showLoading(false);
                }
            }, (err) => {
                this.addAlertMessage(err.error || err);
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
        
        // Add to action list
        this.container.querySelector('.twv-button-add-list')
            .addEventListener('click', (e) => {
                e.preventDefault();
                this.addToActionBatch('delete', this.data.source);
            });
    }

    moveElementInit() {
        const componentsContainer = this.container.querySelector('.twv-ui-components');
        componentsContainer.innerHTML = '';
        
        this.selectionModeDestroy(true, false);
        setTimeout(() => {
            this.selectModeToggle(document.body, 'moveTarget');
        }, 1);
    }

    restoreStaticInit() {
        this.clearMessage();
        const componentsContainer = this.container.querySelector('.twv-ui-components');
        componentsContainer.innerHTML = '';

        const div = document.createElement('div');
        div.innerHTML = `
            <div class="twv-mb-3">Вы уверены, что хотите вернуть исходное состояние элемента?</div>
            <div class="twv-mb-3">
                <button type="button" class="twv-btn twv-btn-primary twv-mr-1 twv-button-submit">
                    <i class="twv-icon-done"></i>
                    Подтвердить
                </button>
                <button type="button" class="twv-btn twv-btn twv-button-cancel" title="Отменить">
                    <i class="twv-icon-clearclose"></i>
                </button>
            </div>
            `;
        componentsContainer.appendChild(div);

        const buttonSubmit = componentsContainer.querySelector('.twv-button-submit');
        const buttonCancel = componentsContainer.querySelector('.twv-button-cancel');

        // Submit data
        buttonSubmit.addEventListener('click', (e) => {
            e.preventDefault();

            this.showLoading(true);

            this.request('/twigvisual/restore_static', {
                templateName: this.options.templateName,
                xpath: this.data.source
            }, (res) => {
                if (res.success) {
                    this.windowReload();
                } else {
                    buttonSubmit.removeAttribute('disabled');
                    buttonCancel.removeAttribute('disabled');
                    this.showLoading(false);
                }
            }, (err) => {
                this.addAlertMessage(err.error || err);
                buttonSubmit.removeAttribute('disabled');
                buttonCancel.removeAttribute('disabled');
                this.showLoading(false);
            }, 'POST');
        });

        // Cancel
        buttonCancel.addEventListener('click', (e) => {
            e.preventDefault();
            this.clearMessage();
            componentsContainer.innerHTML = '';
        });
    }

    addNewThemeInit() {

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
            <button type="button" class="twv-btn twv-btn-primary twv-mr-1 twv-button-submit">Создать</button>
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

            this.clearMessage();
            this.showLoading(true);
            buttonEl.setAttribute('disabled', 'disabled');

            this.request('/twigvisual/create', {
                theme: fieldThemeEl.value,
                mainpage: fieldMainpageEl.value
            }, (res) => {
                buttonEl.removeAttribute('disabled');
                this.showLoading(false);
                if (res && res.success) {
                    innerContainerEl.innerHTML = '';
                }
                if (res.message) {
                    this.addAlertMessage(res.message, 'success');
                }
            }, (err) => {
                this.addAlertMessage(err.error || err);
                buttonEl.removeAttribute('disabled');
                this.showLoading(false);
            }, 'POST');
        });

        innerContainerEl.querySelector('button.twv-button-cancel').addEventListener('click', (e) => {
            e.preventDefault();
            innerContainerEl.innerHTML = '';
        });
    }

    addNewTemplateInit() {
        this.clearMessage();
        const innerContainerEl = this.container.querySelector('.twv-inner');
        innerContainerEl.innerHTML = '';

        let optionsHTML = '';
        this.options.templates.forEach((templatePath) => {
            optionsHTML += `<option value="${templatePath}">${templatePath}</option>`;
        });

        const div = document.createElement('div');
        div.innerHTML = `
        <div class="twv-mb-3">
            <label class="twv-display-block twv-mb-1" for="tww-field-source-file">HTML-файл</label>
            <input type="text" id="tww-field-source-file" class="twv-form-control" value="">
        </div>
        <div class="twv-mb-3">
            <label class="twv-display-block twv-mb-1" for="tww-field-template-name">Название шаблона</label>
            <select id="tww-field-template-name" class="twv-custom-select">
                ${optionsHTML}
            </select>
        </div>
        <div class="twv-mb-3">
            <button type="button" class="twv-btn twv-btn-primary twv-mr-1 twv-button-submit">Создать</button>
            <button type="button" class="twv-btn twv-btn twv-button-cancel">Отменить</button>
        </div>
        `;

        innerContainerEl.appendChild(div);

        innerContainerEl.querySelector('button.twv-button-submit').addEventListener('click', (e) => {
            e.preventDefault();

            const fieldFileNameEl = document.getElementById('tww-field-source-file');
            const fieldTemplateNameEl = document.getElementById('tww-field-template-name');
            const buttonEl = e.target;
            if (!fieldFileNameEl.value || !fieldTemplateNameEl.value) {
                return;
            }
            this.showLoading(true);
            buttonEl.setAttribute('disabled', 'disabled');

            this.request('/twigvisual/create_template', {
                fileName: fieldFileNameEl.value,
                templateName: fieldTemplateNameEl.value
            }, (res) => {
                buttonEl.removeAttribute('disabled');
                this.showLoading(false);
                innerContainerEl.innerHTML = '';
                if (res.message) {
                    this.addAlertMessage(res.message, 'success');
                }
            }, (err) => {
                this.addAlertMessage(err.error || err);
                buttonEl.removeAttribute('disabled');
                this.showLoading(false);
            }, 'POST');
        });

        innerContainerEl.querySelector('button.twv-button-cancel').addEventListener('click', (e) => {
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
    addToActionBatch(action, xpath, options = {}) {
        this.actions.push({
            action,
            xpath,
            options
        });
        this.selectionModeDestroy(true);
        
        const buttonEl = this.container.querySelector('.twv-button-execute-batch');
        buttonEl.querySelector('span').textContent = `${this.actions.length}`;
        buttonEl.style.display = 'inline-block';
        
        this.actions.forEach((action) => {
            const element = this.getElementByXPath(action.xpath);
            if (element) {
                element.classList.add('twv-selected-success');
            }
        });
    }

    /**
     * Execute actions batch
     */
    executeActionBatch() {
        if (this.actions.length === 0) {
            return;
        }
        this.showLoading(true);
        this.request('/twigvisual/batch', {
            templateName: this.options.templateName,
            actions: this.actions
        }, (res) => {
            this.windowReload();
            this.showLoading(false);
        }, (err) => {
            this.addAlertMessage(err.error || err);
            this.showLoading(false);
        }, 'POST');
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
    addAlertMessage(message, type = 'danger') {
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
            this.timer = setTimeout(this.clearMessage.bind(this), 4000);
        });
        this.timer = setTimeout(this.clearMessage.bind(this), 4000);
    }
    
    clearMessage() {
        const innerContainerEl = this.container.querySelector('.twv-inner');
        if (innerContainerEl.querySelector('.twv-alert')) {
            this.removeEl(innerContainerEl.querySelector('.twv-alert'));
        }
    }

    /**
     * Display padding of the HTML element
     * @param element
     */
    displayPadding(element) {
        const compStyles = window.getComputedStyle(element);
        let boxShadow = '0 0 0 2px #007bff';
        if (compStyles['padding-top'] !== '0px') {
            boxShadow += `, inset 0 ${compStyles['padding-top']} 0 0 rgba(50,168,82,0.15)`;
        }
        if (compStyles['padding-bottom'] !== '0px') {
            boxShadow += `, inset 0 -${compStyles['padding-bottom']} 0 0 rgba(50,168,82,0.15)`;
        }
        if (compStyles['padding-left'] !== '0px') {
            boxShadow += `, inset ${compStyles['padding-left']} 0 0 0 rgba(50,168,82,0.15)`;
        }
        if (compStyles['padding-right'] !== '0px') {
            boxShadow += `, inset -${compStyles['padding-right']} 0 0 0 rgba(50,168,82,0.15)`;
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
    
    windowReload() {
        let locationHref = window.location.protocol + '//' + window.location.hostname + window.location.pathname;
        window.location.href = locationHref;
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

    /**
     * 
     * @param element
     * @param nodeType
     * @param count
     * @returns {AST.HtmlParser2.Node|(() => (Node | null))|ActiveX.IXMLDOMNode|*}
     */
    getNodePreviousSiblingByType(element, nodeType, count) {
        if (element.previousSibling && element.previousSibling.nodeType !== nodeType && count > 0) {
            return this.getNodePreviousSiblingByType(element.previousSibling, nodeType, --count);
        }
        return element.previousSibling;
    }

    generateRandomString(length = 8) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    setCookie(cname, cvalue, exdays = 7) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = 'expires=' + d.toUTCString();
        document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
    }

    getCookie(cname) {
        var name = cname + '=';
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
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
}
