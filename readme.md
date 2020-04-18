TwigVisual
----------

Bundle for [Symfony](https://symfony.com/).

Menu, breadcrumbs, list of pages, shopping cart ... - all this can be done dynamically in the visual mode, without having to crawl into the code and study the documentation. The application can be adapted for other template engines and CMS, the main settings are in one file.

Current version: **ALPHA**

Video: [https://www.youtube.com/watch?v=kcR5Ip6dQHA](https://www.youtube.com/watch?v=kcR5Ip6dQHA)

![TwigVisual - screenshot #1](https://github.com/andchir/twig-visual/blob/master/Resources/public/screenshots/001.png?raw=true "TwigVisual - screenshot #1")

Add to base template before ``</head>`` tag:
~~~
<!-- twv-script -->
{% if is_granted('ROLE_ADMIN') %}
    <link href="{{ asset('bundles/twigvisual/css/twv-icomoon/style.css') }}" rel="stylesheet">
    <link href="{{ asset('bundles/twigvisual/css/twigvisual.css') }}" rel="stylesheet">
    <script src="{{ asset('bundles/twigvisual/dist/twigvisual.js') }}"></script>
    <script>
        const twigVisual = new TwigVisual({{ twigVisualOptions(_self, _context) }});
    </script>
{% endif %}
<!-- /twv-script -->
~~~

Development:
~~~
npm run build:dev
~~~

Production:
~~~
npm run build
~~~
