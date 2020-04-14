TwigVisual
----------

Add to base template before </head> tag:
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
