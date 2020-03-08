<?php

namespace Andchir\TwigVisualBundle\Service;

use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Doctrine\Common\Persistence\ObjectManager;
use Doctrine\Common\Persistence\ObjectRepository;
use Twig\Environment as TwigEnvironment;

class TwigVisualService {

    /** @var TwigEnvironment */
    protected $twig;
    /** @var ParameterBagInterface */
    protected $params;
    /** @var array */
    protected $config;
    private $errorMessage = '';
    private $isError = false;

    public function __construct(ContainerInterface $container, ParameterBagInterface $params, TwigEnvironment $twig, array $config = [])
    {
        $this->params = $params;
        $this->twig = $twig;
        
        if (empty($config) && $container->hasParameter('twigvisual_config')) {
            $this->config = $container->getParameter('twigvisual_config');
        } else {
            $this->config = $config;
        }
    }

    /**
     * @param string $errorMessage
     */
    public function setErrorMessage($errorMessage)
    {
        $this->isError = true;
        $this->errorMessage = $errorMessage;
    }

    /**
     * @return string
     */
    public function getErrorMessage()
    {
        return $this->errorMessage;
    }

    /**
     * @param $templatePublicFilePath
     * @return false|string
     */
    public function prepareTemplateContent($templatePublicFilePath, $themeName)
    {
        if (!file_exists($templatePublicFilePath)) {
            return false;
        }
        $templateAssetsBaseUrl = "/assets/{$themeName}/";
        $templateContent = file_get_contents($templatePublicFilePath);

        // Styles
        preg_match_all('/(?:"|\')(?:[^"\']+)\.css(?:"|\')/', $templateContent, $matches);
        if (!empty($matches[0])) {
            foreach ($matches[0] as $input) {
                $inputOutput = substr($input, 0, 1) . $templateAssetsBaseUrl . substr($input, 1);
                $templateContent = str_replace($input, $inputOutput, $templateContent);
            }
            unset($matches);
        }
        
        // Scripts
        preg_match_all('/(?:"|\')(?:[^"\']+)\.js(?:"|\')/', $templateContent, $matches);
        var_dump($matches);
        if (!empty($matches[0])) {
            foreach ($matches[0] as $input) {
                $inputOutput = substr($input, 0, 1) . $templateAssetsBaseUrl . substr($input, 1);
                $templateContent = str_replace($input, $inputOutput, $templateContent);
            }
            unset($matches);
        }

        // Images
        preg_match_all('/(?:"|\')(?:[^"\']+)\.(?:jpg|jpeg|png|gif|webp|ico)(?:"|\')/', $templateContent, $matches);
        preg_match_all('/(?:\()(?:[^\)]+)\.(?:jpg|jpeg|png|gif|webp|ico)(?:\))/', $templateContent, $matches2);
        if (empty($matches[0])) {
            $matches = [[]];
        }
        if (empty($matches2[0])) {
            $matches2 = [[]];
        }
        $matches[0] = array_merge($matches[0], $matches2[0]);
        if (!empty($matches[0])) {
            foreach ($matches[0] as $input) {
                $inputOutput = substr($input, 0, 1) . $templateAssetsBaseUrl . substr($input, 1);
                $templateContent = str_replace($input, $inputOutput, $templateContent);
            }
        }
        
        // TvigVisual assets
        $twvContent = '
        {% if app.environment == \'dev\' and is_granted(\'ROLE_ADMIN\') %}
            <link href="{{ asset(\'bundles/twigvisual/css/twv-icomoon/style.css\') }}" rel="stylesheet">
            <link href="{{ asset(\'bundles/twigvisual/css/twigvisual.css\') }}" rel="stylesheet">
            <script src="{{ asset(\'bundles/twigvisual/dist/twigvisual.js\') }}"></script>
            <script>
				const twigVisual = new TwigVisual({
					templateName: \'{{ _self }}\'
				});
			</script>
        {% endif %}
        ';
        $templateContent = str_replace('</head>', $twvContent . PHP_EOL . '</head>', $templateContent);
        
        return $templateContent;
    }

    /**
     * @param string $templateName
     * @param string $xpathQuery
     * @param string $textContent
     * @return bool
     */
    public function editTextContent($templateName, $xpathQuery, $textContent)
    {
        try {
            $templateData = $this->getTemplateSource($templateName);
        } catch (\Exception $e) {
            $this->setErrorMessage($e->getMessage());
            return false;
        }

        $doc = new \IvoPetkov\HTML5DOMDocument();

        $doc->loadHTML($templateData['source_code']);
        $xpath = new \DOMXPath($doc);

        /** @var \DOMNodeList $entries */
        $entries = $xpath->evaluate($xpathQuery, $doc);
        if ($entries->count() === 0) {
            $this->setErrorMessage('Element not found.');
            return false;
        }

        $entries->item(0)->textContent = trim($textContent);
        $htmlContent = $doc->saveHTML();
        $htmlContent = str_replace(['%7B%7B%20', '%7B%7B', '%20%7D%7D', '%7D%7D'], ['{{ ', '{{', ' }}', '}}'], $htmlContent);

        file_put_contents($templateData['file_path'], $htmlContent);
        
        return true;
    }

    /**
     * @param string $templateName
     * @return array
     * @throws \Twig\Error\LoaderError
     * @throws \Twig\Error\SyntaxError
     */
    public function getTemplateSource($templateName)
    {
        $template = $this->twig->resolveTemplate($templateName);
        $templateSource = $template->getSourceContext();
        return [
            'file_path' => $templateSource->getPath(),
            'starting_line' => 1,
            'source_code' => $templateSource->getCode(),
        ];
    }

    /**
     * @param $themeName
     * @return string|null
     */
    public function getPublicTemplateDirPath($themeName)
    {
        if (!$themeName) {
            return null;
        }
        $publicDirPath = $this->getPublicDirPath();
        return $publicDirPath . '/assets/' . $themeName;
    }

    /**
     * @return string
     */
    public function getPublicDirPath()
    {
        return $this->params->has('app.web_dir_path')
            ? realpath($this->params->get('app.web_dir_path'))
            : realpath($this->getRootDirPath() . '/public');
    }

    /**
     * @return string
     * @throws \Twig\Error\LoaderError
     */
    public function getTemplatesDirPath()
    {
        return dirname(dirname($this->twig->getLoader()->getSourceContext('base.html.twig')->getPath()));
    }

    /**
     * @return false|string
     */
    public function getRootDirPath()
    {
        return realpath($this->params->get('kernel.root_dir') . '/../..');
    }

    /**
     * Get file extension
     * @param string $filePath
     * @return string
     */
    public static function getExtension($filePath)
    {
        $temp_arr = $filePath ? explode('.', $filePath) : [];
        $ext = !empty($temp_arr) ? end($temp_arr) : '';
        return strtolower($ext);
    }
}
