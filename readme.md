TwigVisual
----------

Add to base template before </head> tag:
~~~
{% if app.environment == 'dev' %}
    <link href="{{ asset('bundles/twig-visual/css/twv-icomoon/style.css') }}" rel="stylesheet">
    <link href="{{ asset('bundles/twig-visual/css/twig-visual.css') }}" rel="stylesheet">
    <script src="{{ asset('bundles/twig-visual/dist/twig-visual.js') }}"></script>
{% endif %}
~~~

Development:
~~~
npx babel --presets=@babel/env --source-maps --watch src/index.js --out-file dist/twig-visual.js
~~~

Production:
~~~
npx babel --presets=@babel/env src/index.js --out-file dist/twig-visual.js
~~~
