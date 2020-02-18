TwigVisual
----------

Add to base template before </head> tag:
~~~
{% if app.environment == 'dev' %}
    <link href="{{ asset('bundles/twig-visual/css/twig-visual.css') }}" rel="stylesheet">
    <script src="{{ asset('bundles/twig-visual/js/twig-visual.js') }}"></script>
{% endif %}
~~~



