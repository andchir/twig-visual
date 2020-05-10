TwigVisual
----------

Bundle for [Symfony](https://symfony.com/).

Menu, breadcrumbs, list of pages, shopping cart ... - all this can be done dynamically in the visual mode, without having to dive into code and study the documentation. The application can be adapted for other template engines and CMS, the main settings are in one YAML file.

Current version: **BETA**

Video: [https://www.youtube.com/watch?v=kcR5Ip6dQHA](https://www.youtube.com/watch?v=kcR5Ip6dQHA)

![TwigVisual - screenshot #1](https://github.com/andchir/twig-visual/blob/master/Resources/public/screenshots/001.png?raw=true "TwigVisual - screenshot #1")

Configuration example:
```yaml
twig_visual:
    cache_location:
        - var/cache/filecache
    templates_extension: html.twig
    ui:
        menu:
            title: Main menu
            configuration:
                saveBackupCopy: true
            components:
                root:
                    title: Root element
                    type: elementSelect
                    required: true
                    output: "{{ categoriesTree(0, 'menu_dropdown', null, activeCategoriesIds, false) }}"
                    template: '<root/>'
                    templatePath: nav/menu_dropdown
                    caching: true
    
                itemFirst:
                    title: First level menu item
                    type: elementSelect
                    isChildItem: true
                    required: true
                    output: '<itemFirst/>'
                    template: |
                        {% for category in children %}
                        <itemFirst class="{%% if category.id in activeCategoriesIds %%}{{ activeClassName }}{%% endif %%}">
                            <a href="{{ catalogPath(category.uri, '', category) }}">{{ category.title }}</a>
                        </itemFirst>
                        {%  endfor %}
    
                containerSecond:
                    title: Second level container
                    type: elementSelect
                    output: "{{ categoriesTree(category.id, 'menu_dropdown_child', category, activeCategoriesIds, false) }}"
                    template: '<containerSecond/>'
                    templatePath: nav/menu_dropdown_child
    
                itemSecond:
                    title: Second level menu item
                    type: elementSelect
                    isChildItem: true
                    output: '<itemSecond/>'
                    template: |
                        {% for category in children %}
                        <itemSecond class="{%% if category.id in activeCategoriesIds %%}{{ activeClassName }}{%% endif %%}">
                            <a href="{{ catalogPath(category.uri, '', category) }}">{{ category.title }}</a>
                        </itemSecond>
                        {%  endfor %}
    
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
                        {% for category in children %}
                        <itemThird class="{%% if category.id in activeCategoriesIds %%}{{ activeClassName }}{%% endif %%}">
                            <a href="{{ catalogPath(category.uri, '', category) }}">{{ category.title }}</a>
                        </itemThird>
                        {%  endfor %}

                activeClassName:
                    title: CSS activity class
                    type: text
                    value: active
                    
                deleteLeftSiblings:
                    title: Delete previous child
                    type: checkbox
                    
                deleteRightSiblings:
                    title: Delete next child
                    type: checkbox
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
