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
        {% if app.environment == \'dev\' %}
            <link href="{{ asset(\'bundles/twigvisual/css/twv-icomoon/style.css\') }}" rel="stylesheet">
            <link href="{{ asset(\'bundles/twigvisual/css/twigvisual.css\') }}" rel="stylesheet">
            <script src="{{ asset(\'bundles/twigvisual/dist/twigvisual.js\') }}"></script>
        {% endif %}
        ';
        $templateContent = str_replace('</head>', $twvContent . PHP_EOL . '</head>', $templateContent);
        
        return $templateContent;
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
