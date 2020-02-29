TwigVisual
----------

Add to base template before </head> tag:
~~~
{% if app.environment == 'dev' %}
    <link href="{{ asset('bundles/twigvisual/css/twv-icomoon/style.css') }}" rel="stylesheet">
    <link href="{{ asset('bundles/twigvisual/css/twigvisual.css') }}" rel="stylesheet">
    <script src="{{ asset('bundles/twigvisual/dist/twigvisual.js') }}"></script>
{% endif %}
~~~

Development:
~~~
npx babel --presets=@babel/env --source-maps --watch src/index.js --out-file dist/twigvisual.js
~~~

Production:
~~~
npx babel --presets=@babel/env src/index.js --out-file dist/twig-visual.js
~~~
