TwigVisual
----------

Bundle for [Symfony](https://symfony.com/) 5+.

Menu, breadcrumbs, list of pages, shopping cart ... - all this can be done dynamically in the visual mode, without having to dive into code and study the documentation. The application can be adapted for other template engines and CMS, the main settings are in one YAML file.

~~~
composer require andchir/twig-visual
~~~

Video: [https://www.youtube.com/watch?v=kcR5Ip6dQHA](https://www.youtube.com/watch?v=kcR5Ip6dQHA)

![TwigVisual - screenshot #1](https://github.com/andchir/twig-visual/blob/master/src/Resources/public/screenshots/001.png?raw=true "TwigVisual - screenshot #1")

Configuration example:
```yaml
twig_visual:
    default_copy: []
    templates:
        - homepage
    cache_location: []
    templates_extension: html.twig
    file_upload_dir_path: '%kernel.project_dir%/public/uploads'
    editor_user_role: 'ROLE_ADMIN_WRITE'
    ui:
        field:
            title: Content field
            configuration:
                saveBackupCopy: true
            components:
                root:
                    title: Root element
                    type: elementSelect
                    required: true
                    template: '<root>{%% if {{ fieldName }} is defined %%}{{ {{ fieldName }} }}{%% endif %%}</root>'

                fieldName:
                    title: Content field
                    type: pageField
                    join: key
                    separator: '.'

                key:
                    title: Value key
                    type: text

        includeCreate:
            title: Make included
            configuration:
                saveBackupCopy: true
            components:
                root:
                    title: Root element
                    type: elementSelect
                    required: true

                includeName:
                    title: Item name
                    type: text
                    required: true

        include:
            title: Replace with included
            configuration:
                updateIncludeSource: false
                saveBackupCopy: true
            components:
                root:
                    title: Root element
                    type: elementSelect
                    required: true

                includeName:
                    title: Include name
                    type: include
                    required: true

        menu:
            title: Main menu
            configuration:
                saveBackupCopy: true
            components:
                root:
                    title: Root element
                    type: elementSelect
                    required: true
                    output: "{{ categoriesTree(0, 'menu_dropdown{{ nameSuffix }}', null, activeCategoriesIds, false) }}"
                    template: '<root/>'
                    templatePath: nav/menu_dropdown
                    saveBackupCopy: true

                itemFirst:
                    title: First level menu item
                    type: elementSelect
                    isChildItem: true
                    required: true
                    output: '<itemFirst/>'
                    template: |
                        {%% for category in children %%}
                        <itemFirst class="{%% if category.id in activeCategoriesIds %%}{{ activeClassName }}{%% endif %%}">
                            <a href="{{ catalogPath(category.uri, '', category) }}">{{ category.title }}</a>
                        </itemFirst>
                        {%%  endfor %%}

                containerSecond:
                    title: Second level container
                    type: elementSelect
                    output: "{{ categoriesTree(category.id, 'menu_dropdown_child{{ nameSuffix }}', category, activeCategoriesIds, false) }}"
                    template: '<containerSecond/>'
                    templatePath: nav/menu_dropdown_child

                itemSecond:
                    title: Second level menu item
                    type: elementSelect
                    isChildItem: true
                    output: '<itemSecond/>'
                    template: |
                        {%% for category in children %%}
                        <itemSecond class="{%% if category.id in activeCategoriesIds %%}{{ activeClassName }}{%% endif %%}">
                            <a href="{{ catalogPath(category.uri, '', category) }}">{{ category.title }}</a>
                        </itemSecond>
                        {%%  endfor %%}

                containerThird:
                    title: Third level container
                    type: elementSelect
                    output: "{{ categoriesTree(category.id, 'menu_dropdown_child', category, activeCategoriesIds, false) }}"
                    template: '<containerThird/>'
                    templatePath: nav/menu_dropdown_child_child

                itemThird:
                    title: Third level menu item
                    type: elementSelect
                    isChildItem: true
                    output: '<itemThird/>'
                    template: |
                        {%% for category in children %%}
                        <itemThird class="{%% if category.id in activeCategoriesIds %%}{{ activeClassName }}{%% endif %%}">
                            <a href="{{ catalogPath(category.uri, '', category) }}">{{ category.title }}</a>
                        </itemThird>
                        {%%  endfor %%}

                activeClassName: {title: CSS activity class, type: text, value: active}

                nameSuffix: {title: Name suffix, type: text}

                deleteLeftSiblings: {title: Delete previous child, type: checkbox}

                deleteRightSiblings: {title: Delete next child, type: checkbox}

        editMargin:
            title: Edit margin
            configuration:
                saveBackupCopy: true
            components:
                root:
                    title: Root element
                    type: elementSelect
                    required: true
                marginTop:
                    title: Indent on the top
                    type: text
                    styleName: 'margin-top'
                marginRight:
                    title: Indent on the right
                    type: text
                    styleName: 'margin-right'
                marginBottom:
                    title: Indent from the bottom
                    type: text
                    styleName: 'margin-bottom'
                marginLeft:
                    title: Indent on the left
                    type: text
                    styleName: 'margin-left'

        editPadding:
            title: Edit padding
            configuration:
                saveBackupCopy: true
            components:
                root:
                    title: Root element
                    type: elementSelect
                    required: true
                paddingTop:
                    title: Indent on the top
                    type: text
                    styleName: 'padding-top'
                paddingRight:
                    title: Indent on the right
                    type: text
                    styleName: 'padding-right'
                paddingBottom:
                    title: Indent from the bottom
                    type: text
                    styleName: 'padding-bottom'
                paddingLeft:
                    title: Indent on the left
                    type: text
                    styleName: 'padding-left'

        wrapTag:
            title: Create block
            configuration:
                saveBackupCopy: true
            components:
                root:
                    title: Root element
                    type: elementSelect
                    required: true
                    output: '<root/>'
                    template: '<div><root/></div>'
```

Add to base template before ``</head>`` tag:
```html
<!-- twv-script -->
{% if is_granted('ROLE_ADMIN') %}
    <link href="{{ asset('bundles/twigvisual/css/twv-icomoon/style.css') }}" rel="stylesheet">
    <link href="{{ asset('bundles/twigvisual/dist/twigvisual_styles.min.css') }}" rel="stylesheet">
    <script src="{{ asset('bundles/twigvisual/dist/twigvisual.min.js') }}"></script>
    <script>
        const twigVisual = new TwigVisual( {{ twigVisualOptions(_self, _context) }} );
    </script>
{% endif %}
<!-- /twv-script -->
```

Development:
~~~
npm run build:dev
~~~

Production:
~~~
npm run build
~~~
