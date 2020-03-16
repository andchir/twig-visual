<?php

namespace Andchir\TwigVisualBundle\Service;

use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Bridge\Twig\AppVariable;
use Doctrine\Common\Persistence\ObjectManager;
use Doctrine\Common\Persistence\ObjectRepository;
use Twig\Environment as TwigEnvironment;

class TwigVisualService {

    /** @var TwigEnvironment */
    protected $twig;
    /** @var ParameterBagInterface */
    protected $params;
    /** @var KernelInterface */
    protected $kernel;
    /** @var Beautify_Html */
    public $beautifyHtml;
    /** @var array */
    protected $config;
    private $errorMessage = '';
    private $isError = false;

    public function __construct(
        ParameterBagInterface $params,
        TwigEnvironment $twig,
        KernelInterface $kernel,
        Beautify_Html $beautifyHtml,
        array $config = []
    )
    {
        $this->kernel = $kernel;
        $this->params = $params;
        $this->twig = $twig;
        $this->beautifyHtml = $beautifyHtml;
        
        if (empty($config) && $params->has('twigvisual_config')) {
            $this->config = $params->get('twigvisual_config');
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
     * @return array
     */
    public function getConfig()
    {
        return $this->config;
    }

    /**
     * @param string $key
     * @param string $default
     * @return mixed|string
     */
    public function getConfigValue($key, $secondKey = null, $default = '')
    {
        if ($key && $secondKey) {
            return isset($this->config[$key]) ? ($this->config[$key][$secondKey] ?? $default) : $default;
        }
        return $this->config[$key] ?? $default;
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
        
        // TwigVisual assets
        $twvContent = '
        {% if app.environment == \'dev\' and is_granted(\'ROLE_ADMIN\') %}
            <link href="{{ asset(\'bundles/twigvisual/css/twv-icomoon/style.css\') }}" rel="stylesheet">
            <link href="{{ asset(\'bundles/twigvisual/css/twigvisual.css\') }}" rel="stylesheet">
            <script src="{{ asset(\'bundles/twigvisual/dist/twigvisual.js\') }}"></script>
            <script>
				const twigVisual = new TwigVisual({
					templateName: \'{{ _self }}\',
                    templates: {{ twigVisualOptions(\'templates\') }},
                    uiOptions: {{ twigVisualOptions() }},
                    pageFields: {{ twigVisualOptions(\'fields\', _context) }}
				});
			</script>
        {% endif %}
        ';
        $templateContent = str_replace('</head>', $twvContent . PHP_EOL . '</head>', $templateContent);
        
        return $templateContent;
    }

    /**
     * Copy template files from default theme
     * @param string $themeName
     * @return bool
     * @throws \Twig\Error\LoaderError
     */
    public function copyDefaultFiles($themeName)
    {
        $defaultFiles = $this->getConfigValue('default_copy');
        $currentThemeDirPath = $this->getCurrentThemeDirPath();
        $newThemeDirPath = dirname($currentThemeDirPath) . DIRECTORY_SEPARATOR . $themeName;
        if (!is_dir($newThemeDirPath)) {
            mkdir($newThemeDirPath);
        }
        foreach ($defaultFiles as $defaultFile) {
            $sourceFilePath = $currentThemeDirPath . DIRECTORY_SEPARATOR . $defaultFile;
            $targetFilePath = $newThemeDirPath . DIRECTORY_SEPARATOR . $defaultFile;
            if (!file_exists($sourceFilePath)) {
                $sourceFilePath .= '.html.twig';
                $targetFilePath .= '.html.twig';
            }
            if (!is_dir(dirname($targetFilePath))) {
                mkdir(dirname($targetFilePath));
            }
            if (file_exists($targetFilePath)) {
                unlink($targetFilePath);
            }
            if (!copy($sourceFilePath, $targetFilePath)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @param string $templateName
     * @param string $xpathQuery
     * @param string $textContent
     * @return bool
     */
    public function editTextContent($templateName, $xpathQuery, $innerHTML)
    {
        try {
            $result = $this->getDocumentNode($templateName, $xpathQuery);
        } catch (\Exception $e) {
            $this->setErrorMessage($e->getMessage());
            return false;
        }
        list($templateFilePath, $doc, $node) = $result;
        $node->innerHTML = $innerHTML;

        return $this->saveTemplateContent($doc, $templateFilePath);
    }

    /**
     * @param string $templateName
     * @param string $xpathQuery
     * @param array $attributes
     * @return bool
     */
    public function editAttributes($templateName, $xpathQuery, $attributes)
    {
        try {
            $result = $this->getDocumentNode($templateName, $xpathQuery);
        } catch (\Exception $e) {
            $this->setErrorMessage($e->getMessage());
            return false;
        }
        list($templateFilePath, $doc, $node) = $result;
        foreach ($attributes as $key => $value) {
            $node->setAttribute($key, $value);
        }

        return $this->saveTemplateContent($doc, $templateFilePath);
    }

    /**
     * Delete element
     * @param string $templateName
     * @param string $xpathQuery
     */
    public function deleteElement($templateName, $xpathQuery)
    {
        try {
            $result = $this->getDocumentNode($templateName, $xpathQuery);
        } catch (\Exception $e) {
            $this->setErrorMessage($e->getMessage());
            return false;
        }
        list($templateFilePath, $doc, $node) = $result;

        try {
            $node->parentNode->removeChild($node);
        } catch (\Exception $e) {
            $this->setErrorMessage($e->getMessage());
            return false;
        }
        
        return $this->saveTemplateContent($doc, $templateFilePath);
    }

    /**
     * @param \IvoPetkov\HTML5DOMDocument $doc
     * @param string $templateFilePath
     * @param bool $clearCache
     * @return bool
     */
    public function saveTemplateContent(\IvoPetkov\HTML5DOMDocument $doc, $templateFilePath, $clearCache = true)
    {
        if (!is_writable($templateFilePath)) {
            $this->setErrorMessage('Template is not writable.');
            return false;
        }
        $htmlContent = $doc->saveHTML();
        $htmlContent = self::unescapeUrls($htmlContent);

        file_put_contents($templateFilePath, $htmlContent);

        if ($clearCache) {
            $this->twigCacheClear();
        }
        return true;
    }

    /**
     * @param string $templateName
     * @param string $xpathQuery
     * @return array|bool
     */
    public function getDocumentNode($templateName, $xpathQuery)
    {
        $templateData = $this->getTemplateSource($templateName);
        $doc = new \IvoPetkov\HTML5DOMDocument();

        $doc->loadHTML($templateData['source_code']);
        $xpath = new \DOMXPath($doc);

        /** @var \DOMNodeList $entries */
        $entries = $xpath->evaluate($xpathQuery, $doc);
        if ($entries->count() === 0) {
            throw new \Exception('Element not found.');
        }

        return [$templateData['file_path'], $doc, $entries->item(0)];
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
     * @param string|null $environment
     * @return bool
     */
    public function systemCacheClear($environment = null)
    {
        if (!$environment) {
            $environment = $this->kernel->getEnvironment();
        }
        $application = new Application($this->kernel);
        $application->setAutoExit(false);

        $input = new ArrayInput([
            'command' => 'cache:clear',
            '--env' => $environment,
            '--quiet' => '1'
            // '--no-warmup' => '1'
        ]);

        $output = new BufferedOutput();
        $application->run($input, $output);
        $output->fetch();

        return $output->fetch() ?: true;
    }

    /**
     * Delete system cache files
     * @return bool
     */
    public function systemCacheFilesDelete($needReboot = true)
    {
        $cacheDirPath = $this->kernel->getCacheDir();
        $warmupDir = $cacheDirPath . '_';
        if (!is_dir($cacheDirPath)) {
            return true;
        }
        if (is_dir($warmupDir)) {
            self::delDir($warmupDir);
        }
        try {
            rename($cacheDirPath, $warmupDir);
            $result = true;
        } catch (\Exception $e) {
            $result = false;
        }
        if ($result && $needReboot) {
            $this->kernel->reboot($cacheDirPath);
        }
        return $result;
    }

    /**
     * @return bool
     */
    public function twigCacheClear()
    {
        $rootPath = $this->getRootDirPath();
        $environment = $this->kernel->getEnvironment();

        $cacheDirPath = $rootPath . '/var/cache/' . $environment . '/twig';
        if (is_dir($cacheDirPath)) {
            self::delDir($cacheDirPath);
        }

        return true;
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
        return dirname(dirname($this->twig->getLoader()->getSourceContext('homepage.html.twig')->getPath()));
    }

    /**
     * @return string
     * @throws \Twig\Error\LoaderError
     */
    public function getCurrentThemeName()
    {
        $templatePath = dirname($this->twig->getLoader()->getSourceContext('homepage.html.twig')->getPath());
        return basename($templatePath);
    }

    /**
     * @return string
     * @throws \Twig\Error\LoaderError
     */
    public function getCurrentThemeDirPath()
    {
        return dirname($this->twig->getLoader()->getSourceContext('homepage.html.twig')->getPath());
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

    /**
     * Recursively delete directory
     * @param $dir
     * @return bool
     */
    public static function delDir($dir) {
        $files = array_diff(scandir($dir), ['.','..']);
        foreach ($files as $file) {
            is_dir("$dir/$file")
                ? self::delDir("$dir/$file")
                : unlink("$dir/$file");
        }
        return rmdir($dir);
    }

    /**
     * @param string $inputXML
     * @param array $sourceArr
     * @param string $key
     * @return string
     */
    public static function replaceXMLTags($inputXML, $sourceArr, $key)
    {
        foreach ($sourceArr as $k => $opts) {
            if (!isset($opts[$key])) {
                continue;
            }
            $kLower = strtolower($k);
            $inputXML = str_replace(["<{$k}></{$k}>", "<{$kLower}></{$kLower}>"], $opts[$key], $inputXML);
        }
        return $inputXML;
    }

    /**
     * @param string $content
     * @return string
     */
    public static function unescapeUrls($content)
    {
        return str_replace(['%7B%7B%20', '%7B%7B', '%20%7D%7D', '%7D%7D', '%20'], ['{{ ', '{{', ' }}', '}}', ' '], $content);
    }

    /**
     * @param mixed $domElement
     * @param int $type
     * @return \DOMElement|\DOMNode|null
     */
    public static function getNextSiblingByType($domElement, $type = XML_ELEMENT_NODE)
    {
        if (!($domElement instanceof \DOMElement)
            && !($domElement instanceof HTML5DOMElement)
            && !($domElement instanceof \DOMText)) {
                return null;
        }
        if ($domElement->nextSibling && $domElement->nextSibling->nodeType !== $type) {
            return self::getNextSiblingByType($domElement->nextSibling, $type);
        }
        return $domElement->nextSibling;
    }

    /**
     * @param array $data
     * @return array
     */
    public static function getDataKeys($data)
    {
        $output = [];

        foreach ($data as $key => $val) {
            if (gettype($val) === 'array' && TwigVisualService::isAssoc($val)) {
                foreach ($val as $k => $v) {
                    $output[] = [
                        'name' => $key . '.' . $k,
                        'type' => gettype($v)
                    ];
                }
            }
            else if (gettype($val) === 'object' && method_exists($val, 'toArray')) {
                foreach ($val->toArray() as $k => $v) {
                    $output[] = [
                        'name' => $key . '.' . $k,
                        'type' => gettype($v)
                    ];
                }
            }
            else if ($key === 'app' && $val instanceof AppVariable) {
                $output[] = [
                    'name' => $key . '.user',
                    'type' => method_exists($val, 'getUser') ? gettype($val->getUser()) : 'null'
                ];
                $output[] = [
                    'name' => $key . '.request',
                    'type' => method_exists($val, 'getRequest') ? gettype($val->getRequest()) : 'null'
                ];
                $output[] = [
                    'name' => $key . '.session',
                    'type' => method_exists($val, 'getSession') ? gettype($val->getSession()) : 'null'
                ];
                $output[] = [
                    'name' => $key . '.flashes',
                    'type' => method_exists($val, 'getFlashes') ? gettype($val->getFlashes()) : 'null'
                ];
                $output[] = [
                    'name' => $key . '.environment',
                    'type' => method_exists($val, 'getEnvironment') ? gettype($val->getEnvironment()) : 'null'
                ];
            }
            else {
                $output[] = [
                    'name' => $key,
                    'type' => gettype($val)
                ];
            }
        }
        
        return $output;
    }

    /**
     * @param array $arr
     * @return bool
     */
    public static function isAssoc(array $arr)
    {
        if (array() === $arr) return false;
        return array_keys($arr) !== range(0, count($arr) - 1);
    }
}
